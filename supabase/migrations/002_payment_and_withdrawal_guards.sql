create unique index if not exists downloads_order_id_idx on public.downloads(order_id);

create or replace function public.reserve_withdrawal(
  creator_user_id uuid,
  withdrawal_amount integer,
  withdrawal_method text,
  withdrawal_details jsonb
)
returns public.withdrawal_requests
language plpgsql
security definer
as $$
declare
  creator_record public.creators;
  created_request public.withdrawal_requests;
begin
  select *
  into creator_record
  from public.creators
  where user_id = creator_user_id
  for update;

  if creator_record.id is null then
    raise exception 'Creator profile not found';
  end if;

  if withdrawal_amount < 50000 then
    raise exception 'Withdrawal amount is below the platform minimum';
  end if;

  if creator_record.available_balance < withdrawal_amount then
    raise exception 'Insufficient available balance';
  end if;

  update public.creators
  set available_balance = available_balance - withdrawal_amount,
      updated_at = now()
  where id = creator_record.id;

  insert into public.withdrawal_requests (
    creator_id,
    amount,
    status,
    payout_method,
    payout_details
  )
  values (
    creator_record.id,
    withdrawal_amount,
    'pending',
    withdrawal_method,
    coalesce(withdrawal_details, '{}'::jsonb)
  )
  returning *
  into created_request;

  return created_request;
end;
$$;

create or replace function public.transition_withdrawal_request(
  request_id uuid,
  next_status public.withdrawal_status,
  notes text default null
)
returns public.withdrawal_requests
language plpgsql
security definer
as $$
declare
  existing_request public.withdrawal_requests;
  updated_request public.withdrawal_requests;
begin
  select *
  into existing_request
  from public.withdrawal_requests
  where id = request_id
  for update;

  if existing_request.id is null then
    raise exception 'Withdrawal request not found';
  end if;

  if next_status = 'approved' and existing_request.status <> 'pending' then
    raise exception 'Only pending withdrawals can be approved';
  end if;

  if next_status = 'rejected' and existing_request.status not in ('pending', 'approved') then
    raise exception 'Only pending or approved withdrawals can be rejected';
  end if;

  if next_status = 'paid' and existing_request.status <> 'approved' then
    raise exception 'Only approved withdrawals can be marked paid';
  end if;

  if next_status = 'rejected' then
    update public.creators
    set available_balance = available_balance + existing_request.amount,
        updated_at = now()
    where id = existing_request.creator_id;
  end if;

  update public.withdrawal_requests
  set status = next_status,
      admin_notes = coalesce(notes, admin_notes),
      reviewed_at = case
        when next_status in ('approved', 'rejected') then now()
        else reviewed_at
      end,
      paid_at = case
        when next_status = 'paid' then now()
        else paid_at
      end
  where id = request_id
  returning *
  into updated_request;

  return updated_request;
end;
$$;

create or replace function public.finalize_pesapal_payment(
  payment_reference text,
  pesapal_tracking_id text,
  status_payload jsonb
)
returns table (
  order_id uuid,
  product_id uuid,
  product_slug text,
  download_token text,
  already_processed boolean
)
language plpgsql
security definer
as $$
declare
  payment_record record;
  created_download public.downloads;
begin
  select
    payments.id as payment_id,
    payments.status as payment_status,
    orders.id as linked_order_id,
    orders.status as order_status,
    orders.creator_id,
    orders.creator_earnings,
    orders.product_id,
    products.slug as linked_product_slug
  into payment_record
  from public.payments
  join public.orders on orders.id = payments.order_id
  join public.products on products.id = orders.product_id
  where payments.merchant_reference = payment_reference
  for update of payments;

  if payment_record.payment_id is null then
    raise exception 'Payment not found';
  end if;

  if payment_record.payment_status = 'completed' then
    select *
    into created_download
    from public.downloads
    where order_id = payment_record.linked_order_id;

    return query
    select
      payment_record.linked_order_id,
      payment_record.product_id,
      payment_record.linked_product_slug,
      created_download.token,
      true;
    return;
  end if;

  if payment_record.payment_status <> 'pending' then
    raise exception 'Only pending payments can be finalized';
  end if;

  update public.payments
  set status = 'completed',
      tracking_id = pesapal_tracking_id,
      raw_payload = coalesce(status_payload, '{}'::jsonb),
      verified_at = now()
  where id = payment_record.payment_id;

  update public.orders
  set status = 'paid',
      paid_at = now()
  where id = payment_record.linked_order_id
    and status <> 'paid';

  perform public.increment_creator_balance(payment_record.creator_id, payment_record.creator_earnings);

  insert into public.downloads (
    order_id,
    product_id,
    token,
    expires_at
  )
  values (
    payment_record.linked_order_id,
    payment_record.product_id,
    encode(gen_random_bytes(32), 'hex'),
    now() + interval '24 hours'
  )
  on conflict (order_id)
  do update set expires_at = excluded.expires_at
  returning *
  into created_download;

  return query
  select
    payment_record.linked_order_id,
    payment_record.product_id,
    payment_record.linked_product_slug,
    created_download.token,
    false;
end;
$$;

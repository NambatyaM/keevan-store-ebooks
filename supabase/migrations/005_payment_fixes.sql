-- ============================================================
-- Migration 005: Payment security & atomicity fixes
--
--  1. fail_pesapal_payment() — atomic failure state transition
--     (marks both payment + order in one transaction)
-- ============================================================

-- -------------------------------------------------------
-- 1. Atomic payment failure (replaces two separate UPDATEs)
-- -------------------------------------------------------
create or replace function public.fail_pesapal_payment(
  payment_merchant_reference text,
  failure_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  payment_record record;
begin
  select payments.id, payments.order_id, orders.status as order_status
  into payment_record
  from public.payments
  join public.orders on orders.id = payments.order_id
  where payments.merchant_reference = payment_merchant_reference
  for update of payments;

  if payment_record.id is null then
    return;
  end if;

  update public.payments
  set status = 'failed',
      raw_payload = coalesce(failure_payload, '{}'::jsonb)
  where id = payment_record.id
    and status = 'pending';

  if payment_record.order_status <> 'paid' then
    update public.orders
    set status = 'failed'
    where id = payment_record.order_id
      and status <> 'paid';
  end if;
end;
$$;

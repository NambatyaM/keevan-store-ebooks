-- ============================================================
-- Migration 004: Schema audit fixes
--
-- Fixes 11 issues found during database audit:
--   1. rate_limits: add composite primary key
--   2. rate_limits: drop RLS (service-role-only table)
--   3. payments: add unique constraint on order_id
--   4-6. orders.product_id, orders.creator_id, downloads.product_id:
--        add ON DELETE RESTRICT
--   7. admin_logs.admin_user_id: add ON DELETE SET NULL
--   8. orders: add CHECK (platform_fee <= amount)
--   9. orders: add CHECK (creator_earnings = amount - platform_fee)
--  10. updated_at trigger for all tables with updated_at
--  11. Missing indexes for common query patterns
-- ============================================================

-- -------------------------------------------------------
-- 1 & 2. rate_limits: primary key + disable RLS
-- -------------------------------------------------------
alter table public.rate_limits
  add constraint rate_limits_pkey primary key (key, window_start);

alter table public.rate_limits
  disable row level security;

-- -------------------------------------------------------
-- 3. payments.order_id: enforce one payment per order
-- -------------------------------------------------------
create unique index if not exists payments_order_id_idx
  on public.payments(order_id);

-- -------------------------------------------------------
-- 4. orders.product_id: prevent deleting products with orders
-- -------------------------------------------------------
alter table public.orders
  drop constraint if exists orders_product_id_fkey,
  add constraint orders_product_id_fkey
    foreign key (product_id) references public.products(id)
    on delete restrict;

-- -------------------------------------------------------
-- 5. orders.creator_id: prevent deleting creators with orders
-- -------------------------------------------------------
alter table public.orders
  drop constraint if exists orders_creator_id_fkey,
  add constraint orders_creator_id_fkey
    foreign key (creator_id) references public.creators(id)
    on delete restrict;

-- -------------------------------------------------------
-- 6. downloads.product_id: prevent deleting products with downloads
-- -------------------------------------------------------
alter table public.downloads
  drop constraint if exists downloads_product_id_fkey,
  add constraint downloads_product_id_fkey
    foreign key (product_id) references public.products(id)
    on delete restrict;

-- -------------------------------------------------------
-- 7. admin_logs.admin_user_id: preserve audit trail
-- -------------------------------------------------------
alter table public.admin_logs
  drop constraint if exists admin_logs_admin_user_id_fkey,
  add constraint admin_logs_admin_user_id_fkey
    foreign key (admin_user_id) references public.users(id)
    on delete set null;

-- -------------------------------------------------------
-- 8. orders: ensure platform_fee never exceeds amount
-- -------------------------------------------------------
alter table public.orders
  add constraint orders_platform_fee_check
    check (platform_fee <= amount);

-- -------------------------------------------------------
-- 9. orders: enforce fee-split formula
--     NOT VALID so existing rows don't block the migration;
--     VALIDATE runs afterward without blocking writes
-- -------------------------------------------------------
alter table public.orders
  add constraint orders_creator_earnings_check
    check (creator_earnings = amount - platform_fee)
    not valid;

alter table public.orders
  validate constraint orders_creator_earnings_check;

-- -------------------------------------------------------
-- 10. Auto-update updated_at via trigger
-- -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tbl text;
begin
  for tbl in
    select table_name
    from information_schema.columns
    where column_name = 'updated_at'
      and table_schema = 'public'
  loop
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.set_updated_at()',
      tbl || '_updated_at', tbl
    );
  end loop;
end;
$$;

-- -------------------------------------------------------
-- 11. Missing indexes for common query patterns
-- -------------------------------------------------------
create index if not exists orders_created_at_idx
  on public.orders(created_at desc);

create index if not exists orders_product_id_idx
  on public.orders(product_id);

create index if not exists products_creator_idx
  on public.products(creator_id);

create index if not exists withdrawals_requested_at_idx
  on public.withdrawal_requests(requested_at desc);

create index if not exists withdrawals_status_idx
  on public.withdrawal_requests(status);

create index if not exists creators_created_at_idx
  on public.creators(created_at desc);

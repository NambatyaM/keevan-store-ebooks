create extension if not exists "pgcrypto";

create type public.user_role as enum ('creator', 'admin');
create type public.store_status as enum ('active', 'suspended');
create type public.product_status as enum ('draft', 'published', 'disabled');
create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.payment_status as enum ('pending', 'completed', 'failed', 'reversed');
create type public.withdrawal_status as enum ('pending', 'approved', 'rejected', 'paid');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'creator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  bio text,
  phone text,
  available_balance integer not null default 0 check (available_balance >= 0),
  total_earnings integer not null default 0 check (total_earnings >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creators(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,64}$'),
  name text not null,
  description text,
  status public.store_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,96}$'),
  title text not null,
  description text not null,
  price integer not null check (price > 0),
  currency text not null default 'UGX' check (currency = 'UGX'),
  status public.product_status not null default 'draft',
  file_path text not null,
  file_size integer not null check (file_size <= 4194304),
  file_mime text not null check (file_mime in ('application/pdf','application/epub+zip','application/x-mobipocket-ebook','application/zip')),
  cover_path text,
  cover_size integer check (cover_size is null or cover_size <= 2097152),
  cover_mime text check (cover_mime is null or cover_mime in ('image/jpeg','image/png','image/webp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  creator_id uuid not null references public.creators(id),
  buyer_email text not null,
  buyer_name text not null,
  amount integer not null check (amount > 0),
  platform_fee integer not null check (platform_fee >= 0),
  creator_earnings integer not null check (creator_earnings >= 0),
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'pesapal' check (provider = 'pesapal'),
  merchant_reference text not null unique,
  tracking_id text unique,
  status public.payment_status not null default 'pending',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  token text not null unique,
  expires_at timestamptz not null,
  downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  amount integer not null check (amount >= 50000),
  status public.withdrawal_status not null default 'pending',
  payout_method text not null,
  payout_details jsonb not null default '{}'::jsonb,
  admin_notes text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  event_type text not null check (event_type in ('store_view','product_view','purchase','download')),
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index users_role_idx on public.users(role);
create index stores_creator_idx on public.stores(creator_id);
create index stores_slug_idx on public.stores(slug);
create index products_store_status_idx on public.products(store_id, status);
create index products_slug_idx on public.products(slug);
create index orders_creator_status_idx on public.orders(creator_id, status);
create index payments_reference_idx on public.payments(merchant_reference);
create index downloads_token_idx on public.downloads(token);
create index withdrawals_creator_status_idx on public.withdrawal_requests(creator_id, status);
create index analytics_store_type_created_idx on public.analytics_events(store_id, event_type, created_at);
create index analytics_product_type_created_idx on public.analytics_events(product_id, event_type, created_at);
create index admin_logs_admin_created_idx on public.admin_logs(admin_user_id, created_at);

alter table public.users enable row level security;
alter table public.creators enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.downloads enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.analytics_events enable row level security;
alter table public.admin_logs enable row level security;

create function public.is_admin() returns boolean language sql stable as $$
  select exists(select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

create function public.increment_creator_balance(creator_row_id uuid, amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.creators
  set available_balance = available_balance + amount,
      total_earnings = total_earnings + amount,
      updated_at = now()
  where id = creator_row_id;
end;
$$;

create policy "users own profile or admin" on public.users for select using (id = auth.uid() or public.is_admin());
create policy "creators own row or admin" on public.creators for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "public active stores" on public.stores for select using (status = 'active' or public.is_admin() or creator_id in (select id from public.creators where user_id = auth.uid()));
create policy "creator manages store" on public.stores for all using (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin()) with check (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin());
create policy "public published products" on public.products for select using (status = 'published' or public.is_admin() or creator_id in (select id from public.creators where user_id = auth.uid()));
create policy "creator manages products" on public.products for all using (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin()) with check (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin());
create policy "creator sees orders" on public.orders for select using (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin());
create policy "admin manages payments" on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages downloads" on public.downloads for all using (public.is_admin()) with check (public.is_admin());
create policy "creator withdrawal access" on public.withdrawal_requests for all using (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin()) with check (creator_id in (select id from public.creators where user_id = auth.uid()) or public.is_admin());
create policy "admin reads analytics" on public.analytics_events for select using (public.is_admin() or store_id in (select stores.id from public.stores join public.creators on creators.id = stores.creator_id where creators.user_id = auth.uid()));
create policy "public inserts analytics" on public.analytics_events for insert with check (true);
create policy "admin logs visible to admin" on public.admin_logs for select using (public.is_admin());

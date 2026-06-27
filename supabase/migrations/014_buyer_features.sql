-- Extend user_role enum to include 'buyer'
alter type public.user_role add value if not exists 'buyer';

-- Buyers profile table (extends users with role='buyer')
create table if not exists public.buyers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product reviews
create type public.review_status as enum ('approved', 'pending', 'rejected');

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid references public.buyers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  display_name text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(comment) >= 5),
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.reviews(product_id, created_at desc);
create index if not exists idx_reviews_status on public.reviews(status);

-- Timed discounts
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  discount_percent smallint not null check (discount_percent > 0 and discount_percent <= 100),
  starts_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > starts_at),
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_discounts_active on public.discounts(product_id, is_active, expires_at)
  where is_active = true and expires_at > now();

-- Cart for logged-in buyers
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(buyer_id, product_id)
);

create index if not exists idx_cart_buyer on public.cart_items(buyer_id);

-- Add buyer_id, discount_id to orders
alter table public.orders
  add column if not exists buyer_id uuid references public.buyers(id) on delete set null,
  add column if not exists discount_id uuid references public.discounts(id) on delete set null;

-- Purchases view for buyers (denormalized for fast lookup)
create table if not exists public.buyer_purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  creator_id uuid not null references public.creators(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict
);

create unique index if not exists idx_buyer_purchases_unique on public.buyer_purchases(buyer_id, product_id);
create index if not exists idx_buyer_purchases_buyer on public.buyer_purchases(buyer_id, created_at desc);

-- Auto-populate buyer_purchases when order is paid for logged-in buyer
create or replace function public.populate_buyer_purchase()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.buyer_id is not null and NEW.status = 'paid' then
    insert into public.buyer_purchases (buyer_id, order_id, product_id, creator_id, store_id)
    select
      NEW.buyer_id,
      NEW.id,
      NEW.product_id,
      NEW.creator_id,
      p.store_id
    from public.products p
    where p.id = NEW.product_id
    on conflict (buyer_id, product_id) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_populate_buyer_purchase on public.orders;
create trigger trg_populate_buyer_purchase
  after update of status on public.orders
  for each row
  when (OLD.status = 'pending' and NEW.status = 'paid')
  execute function public.populate_buyer_purchase();

-- RLS
alter table public.buyers enable row level security;
alter table public.reviews enable row level security;
alter table public.discounts enable row level security;
alter table public.cart_items enable row level security;
alter table public.buyer_purchases enable row level security;

-- Buyers can view own profile
create policy "buyers own profile" on public.buyers
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Public can read approved reviews
create policy "public read approved reviews" on public.reviews
  for select using (status = 'approved');

-- Buyers can create reviews
create policy "buyers create reviews" on public.reviews
  for insert with check (exists (select 1 from public.buyers where id = buyer_id and user_id = auth.uid()));

-- Creators can see reviews on their products
create policy "creators see product reviews" on public.reviews
  for select using (exists (
    select 1 from public.products p
    join public.creators c on c.id = p.creator_id
    where p.id = reviews.product_id and c.user_id = auth.uid()
  ));

-- Creator manages discounts
create policy "creator manages discounts" on public.discounts
  for all using (creator_id in (select id from public.creators where user_id = auth.uid()))
  with check (creator_id in (select id from public.creators where user_id = auth.uid()));

-- Public can read active discounts
create policy "public read active discounts" on public.discounts
  for select using (is_active = true and expires_at > now());

-- Buyer manages own cart
create policy "buyer manages cart" on public.cart_items
  for all using (buyer_id in (select id from public.buyers where user_id = auth.uid()))
  with check (buyer_id in (select id from public.buyers where user_id = auth.uid()));

-- Buyer sees own purchases
create policy "buyer sees own purchases" on public.buyer_purchases
  for select using (buyer_id in (select id from public.buyers where user_id = auth.uid()));

-- Admin can see all
create policy "admin manage buyers" on public.buyers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manage reviews" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manage discounts" on public.discounts
  for all using (public.is_admin()) with check (public.is_admin());

-- RPC to increment discount use count
create or replace function public.increment_discount_use(discount_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.discounts
  set use_count = use_count + 1
  where id = discount_id
    and (max_uses is null or use_count < max_uses);
end;
$$;

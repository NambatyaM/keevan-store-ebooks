create table if not exists public.rate_limits (
  key text not null,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

create index if not exists rate_limits_key_window_idx on public.rate_limits(key, window_start);

alter table public.rate_limits enable row level security;

-- ============================================================================
-- Cartly — Initial Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Buyer Profiles ──────────────────────────────────────────────────────────
-- Extends auth.users with buyer-specific fields.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text not null unique,
  name            text not null,
  email           text,
  avatar_url      text,
  wallet_balance  numeric(12,2) not null default 500,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Seller Profiles ─────────────────────────────────────────────────────────
create table if not exists public.seller_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text not null,
  email               text not null default '',
  phone               text not null,
  shop_name           text not null default 'My Shop',
  shop_description    text not null default '',
  avatar_url          text,
  banner_url          text,
  is_verified         boolean not null default false,
  rating              numeric(3,2) not null default 0,
  total_sales         integer not null default 0,
  joined_at           timestamptz not null default now(),
  address_street      text not null default '',
  address_city        text not null default '',
  address_district    text not null default '',
  address_province    text not null default '',
  updated_at          timestamptz not null default now()
);

create trigger seller_profiles_updated_at
  before update on public.seller_profiles
  for each row execute function public.set_updated_at();

-- ─── Categories ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  icon_name   text not null,
  image_url   text not null,
  parent_id   uuid references public.categories(id) on delete set null
);

-- ─── Products ────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  description           text not null default '',
  images                text[] not null default '{}',
  category_id           uuid not null references public.categories(id),
  subcategory_id        uuid references public.categories(id),
  seller_id             uuid not null references public.seller_profiles(id) on delete cascade,
  brand                 text,
  rating                numeric(3,2) not null default 0,
  total_reviews         integer not null default 0,
  is_authenticated      boolean not null default false,
  is_fast_delivery      boolean not null default false,
  cod_available_zones   text[] not null default '{}',
  variants              jsonb not null default '[]',
  base_price            numeric(12,2) not null,
  base_mrp              numeric(12,2) not null,
  weight_kg             numeric(6,3) not null default 0.5,
  tags                  text[] not null default '{}',
  in_stock              boolean not null default true,
  status                text not null default 'active'
                          check (status in ('active','inactive','out_of_stock','draft')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_category_id_idx on public.products(category_id);

-- ─── Addresses ───────────────────────────────────────────────────────────────
create table if not exists public.addresses (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  label                     text not null,
  province                  text not null,
  district                  text not null,
  municipality              text not null,
  ward                      integer not null,
  street                    text,
  landmark                  text not null default '',
  latitude                  numeric(10,7) not null,
  longitude                 numeric(10,7) not null,
  is_pickup_point_fallback  boolean not null default false,
  is_default                boolean not null default false,
  created_at                timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses(user_id);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  items             jsonb not null default '[]',
  address_id        uuid not null,
  address_snapshot  jsonb not null,
  zone_id           text not null,
  delivery_option   text not null,
  payment_method    text not null check (payment_method in ('cod','wallet')),
  subtotal          numeric(12,2) not null,
  shipping_fee      numeric(12,2) not null default 0,
  cod_fee           numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  coupon_code       text,
  total             numeric(12,2) not null,
  status            text not null default 'pending'
                      check (status in (
                        'pending','confirmed','packed','shipped',
                        'out_for_delivery','delivered','cancelled',
                        'return_requested','return_approved','return_picked','refunded'
                      )),
  timeline          jsonb not null default '[]',
  expected_delivery timestamptz not null,
  can_review        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

-- ─── Return Requests ─────────────────────────────────────────────────────────
create table if not exists public.return_requests (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reason      text not null
                check (reason in ('wrong_item','damaged','not_as_described','changed_mind','other')),
  description text not null default '',
  photos      text[] not null default '{}',
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected','picked','refunded')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger return_requests_updated_at
  before update on public.return_requests
  for each row execute function public.set_updated_at();

-- ─── Wallet Transactions ─────────────────────────────────────────────────────
create table if not exists public.wallet_transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null check (type in ('credit','debit')),
  amount        numeric(12,2) not null,
  description   text not null,
  reference_id  text,
  balance       numeric(12,2) not null,
  created_at    timestamptz not null default now()
);

create index if not exists wallet_txs_user_id_idx on public.wallet_transactions(user_id);

-- ─── Notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  body          text not null,
  type          text not null
                  check (type in ('order','promo','return','wallet','system')),
  reference_id  text,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  user_name   text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  images      text[] not null default '{}',
  order_id    uuid not null references public.orders(id),
  created_at  timestamptz not null default now(),
  unique (product_id, user_id, order_id)
);

create index if not exists reviews_product_id_idx on public.reviews(product_id);

-- ─── Seller Notifications ────────────────────────────────────────────────────
create table if not exists public.seller_notifications (
  id          uuid primary key default uuid_generate_v4(),
  seller_id   uuid not null references public.seller_profiles(id) on delete cascade,
  type        text not null
                check (type in ('new_order','order_update','low_stock','review','payout')),
  title       text not null,
  body        text not null,
  is_read     boolean not null default false,
  data        jsonb,
  created_at  timestamptz not null default now()
);

-- ─── Payouts ─────────────────────────────────────────────────────────────────
create table if not exists public.payouts (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       uuid not null references public.seller_profiles(id) on delete cascade,
  amount          numeric(12,2) not null,
  status          text not null default 'pending'
                    check (status in ('pending','processing','completed','failed')),
  method          text not null,
  account_details text not null,
  requested_at    timestamptz not null default now(),
  completed_at    timestamptz
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.return_requests enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.seller_notifications enable row level security;
alter table public.payouts enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;

-- ─── Profiles: users can read/update their own row ───────────────────────────
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

-- ─── Seller Profiles: sellers can read/update their own row ──────────────────
create policy "seller_profiles: own row" on public.seller_profiles
  for all using (auth.uid() = id);

-- ─── Addresses: users can CRUD their own addresses ───────────────────────────
create policy "addresses: own rows" on public.addresses
  for all using (auth.uid() = user_id);

-- ─── Orders: buyers see their own; sellers see orders containing their products
create policy "orders: buyer own" on public.orders
  for all using (auth.uid() = user_id);

-- ─── Return Requests ─────────────────────────────────────────────────────────
create policy "returns: own rows" on public.return_requests
  for all using (auth.uid() = user_id);

-- ─── Wallet Transactions ─────────────────────────────────────────────────────
create policy "wallet_txs: own rows" on public.wallet_transactions
  for all using (auth.uid() = user_id);

-- ─── Notifications ───────────────────────────────────────────────────────────
create policy "notifications: own rows" on public.notifications
  for all using (auth.uid() = user_id);

-- ─── Reviews: anyone can read; only authenticated buyers can insert ───────────
create policy "reviews: public read" on public.reviews
  for select using (true);

create policy "reviews: authenticated insert" on public.reviews
  for insert with check (auth.uid() = user_id);

-- ─── Products: public read; sellers manage their own ─────────────────────────
create policy "products: public read" on public.products
  for select using (true);

create policy "products: seller manage" on public.products
  for all using (auth.uid() = seller_id);

-- ─── Categories: public read ─────────────────────────────────────────────────
create policy "categories: public read" on public.categories
  for select using (true);

-- ─── Seller Notifications ────────────────────────────────────────────────────
create policy "seller_notifications: own rows" on public.seller_notifications
  for all using (auth.uid() = seller_id);

-- ─── Payouts ─────────────────────────────────────────────────────────────────
create policy "payouts: own rows" on public.payouts
  for all using (auth.uid() = seller_id);

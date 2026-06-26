-- ShopHub Marketplace — Supabase Schema
-- Run this in the Supabase SQL Editor (https://app.supabase.com)

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Categories (static reference data) ────────────────────────────────────
create table if not exists categories (
  id       text primary key,
  name     text not null,
  icon     text not null,
  slug     text unique not null
);

insert into categories (id, name, icon, slug) values
  ('1', 'Electronics',   'Laptop',         'electronics'),
  ('2', 'Fashion',       'Shirt',          'fashion'),
  ('3', 'Home & Kitchen','Home',           'home-kitchen'),
  ('4', 'Books',         'BookOpen',       'books'),
  ('5', 'Sports',        'Dumbbell',       'sports'),
  ('6', 'Beauty',        'Sparkles',       'beauty'),
  ('7', 'Toys',          'Gamepad2',       'toys'),
  ('8', 'Grocery',       'ShoppingBasket', 'grocery')
on conflict do nothing;

-- ─── Users (mirrors Supabase Auth users + extra profile fields) ────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique not null,
  role          text not null default 'customer' check (role in ('customer','seller','admin')),
  avatar        text,
  phone         text,
  address       jsonb,
  -- seller-specific
  business_name text,
  gstin         text,
  verified      boolean default false,
  seller_status text default 'pending' check (seller_status in ('pending','approved','rejected')),
  products      text[],
  rating        numeric default 0,
  total_sales   numeric default 0,
  created_at    timestamptz default now()
);

-- ─── Products ───────────────────────────────────────────────────────────────
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text not null,
  price          numeric not null check (price >= 0),
  original_price numeric not null check (original_price >= 0),
  images         text[] not null default '{}',
  category       text not null,
  category_id    text references categories(id),
  seller_id      text not null,
  seller_name    text not null,
  rating         numeric default 0,
  review_count   integer default 0,
  stock          integer not null default 0 check (stock >= 0),
  tags           text[] default '{}',
  specifications jsonb default '{}',
  discount       integer default 0,
  featured       boolean default false,
  promoted       boolean default false,
  is_demo        boolean default false,
  status         text default 'active' check (status in ('active','inactive','deleted')),
  created_at     timestamptz default now()
);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_seller_id_idx on products(seller_id);
create index if not exists products_status_idx on products(status);

-- Full-text search index
create index if not exists products_fts_idx on products
  using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- ─── Orders ─────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                 text primary key default 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  customer_id        text not null,
  customer_name      text not null,
  items              jsonb not null default '[]',
  total              numeric not null check (total >= 0),
  status             text not null default 'placed'
                       check (status in ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned')),
  payment_status     text not null default 'pending'
                       check (payment_status in ('paid','pending','failed')),
  payment_method     text,
  address            jsonb not null,
  voucher_code       text,
  voucher_discount   numeric default 0,
  cashback_amount    numeric default 0,
  estimated_delivery text,
  tracking           jsonb default '[]',
  created_at         timestamptz default now()
);

create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);

-- ─── Vouchers ────────────────────────────────────────────────────────────────
create table if not exists vouchers (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  type         text not null check (type in ('percentage','flat','free_delivery')),
  value        numeric not null check (value > 0),
  min_order_value numeric not null default 0,
  max_discount numeric,
  valid_until  timestamptz not null,
  max_uses     integer not null default 1,
  used_count   integer default 0,
  used_by      text[] default '{}',
  categories   text[],
  description  text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ─── Cashback Offers ─────────────────────────────────────────────────────────
create table if not exists cashback_offers (
  id              uuid primary key default gen_random_uuid(),
  percentage      numeric not null check (percentage > 0 and percentage <= 100),
  max_amount      numeric not null check (max_amount > 0),
  min_order_value numeric not null default 0,
  valid_until     timestamptz not null,
  description     text,
  categories      text[],
  active          boolean default true
);

-- ─── Cashback Transactions ───────────────────────────────────────────────────
create table if not exists cashback_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  order_id    text not null,
  amount      numeric not null check (amount > 0),
  percentage  numeric not null,
  status      text not null default 'pending' check (status in ('pending','credited','expired')),
  credited_at timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index if not exists cashback_tx_user_id_idx on cashback_transactions(user_id);
create index if not exists cashback_tx_order_id_idx on cashback_transactions(order_id);

-- ─── Wallet Transactions ─────────────────────────────────────────────────────
create table if not exists wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  type        text not null check (type in ('credit','debit','refund','cashback','cancellation_refund')),
  amount      numeric not null check (amount > 0),
  description text not null,
  order_id    text,
  created_at  timestamptz default now()
);

create index if not exists wallet_tx_user_id_idx on wallet_transactions(user_id);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id    text not null,
  user_name  text not null,
  rating     integer not null check (rating >= 1 and rating <= 5),
  comment    text,
  created_at timestamptz default now(),
  unique(product_id, user_id)
);

create index if not exists reviews_product_id_idx on reviews(product_id);

-- ─── Notifications ───────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  title      text not null,
  message    text not null,
  type       text not null check (type in ('order','promotion','refund','system','seller')),
  read       boolean default false,
  link       text,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);

-- ─── Seller Applications ─────────────────────────────────────────────────────
create table if not exists seller_applications (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text,
  business_name  text not null,
  gstin          text,
  category       text,
  address        text,
  description    text,
  bank_account   text,
  ifsc           text,
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  from_customer  boolean default false,
  submitted_at   timestamptz default now()
);

-- ─── Refund Requests ─────────────────────────────────────────────────────────
create table if not exists refund_requests (
  id            uuid primary key default gen_random_uuid(),
  order_id      text not null,
  customer_id   text not null,
  customer_name text not null,
  reason        text not null,
  status        text not null default 'pending'
                  check (status in ('pending','approved','rejected','processed')),
  amount        numeric not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists refunds_customer_id_idx on refund_requests(customer_id);
create index if not exists refunds_status_idx on refund_requests(status);

-- ─── Promotion Requests ──────────────────────────────────────────────────────
create table if not exists promotion_requests (
  id           uuid primary key default gen_random_uuid(),
  seller_id    text not null,
  seller_name  text not null,
  product_id   text,
  product_name text,
  type         text not null check (type in ('banner','featured','boost','ad','sale')),
  budget       numeric not null,
  duration     integer not null,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  message      text,
  coupon_code  text,
  created_at   timestamptz default now()
);

-- ─── Badge Requests ──────────────────────────────────────────────────────────
create table if not exists badge_requests (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           text not null,
  seller_name         text not null,
  seller_email        text not null,
  business_name       text not null,
  products_sold       integer not null,
  razorpay_payment_id text,
  status              text not null default 'pending' check (status in ('pending','approved','rejected')),
  applied_at          timestamptz default now()
);

-- ─── Commission Tiers ─────────────────────────────────────────────────────────
create table if not exists commission_tiers (
  id        text primary key,
  name      text not null,
  type      text not null check (type in ('listing_fee','transaction')),
  condition text not null,
  min_value numeric not null,
  max_value numeric,
  fee       numeric not null,
  active    boolean default true
);

insert into commission_tiers values
  ('lf1', 'Starter Listing',  'listing_fee',  'Sellers with fewer than 500 products', 0,    499,  10,  true),
  ('lf2', 'Growth Listing',   'listing_fee',  'Sellers with 500–999 products',         500,  999,  40,  true),
  ('lf3', 'Pro Listing',      'listing_fee',  'Sellers with 1,000+ products',          1000, null, 70,  true),
  ('tc1', 'Small Order',      'transaction',  'Orders below ₹750',                     0,    749,  15,  true),
  ('tc2', 'Standard Order',   'transaction',  'Orders ₹750–₹1,999',                   750,  1999, 30,  true),
  ('tc3', 'Large Order',      'transaction',  'Orders ₹2,000 and above',               2000, null, 100, true)
on conflict do nothing;

-- ─── Row Level Security (basic setup — customize for production) ────────────
alter table products    enable row level security;
alter table orders      enable row level security;
alter table reviews     enable row level security;
alter table vouchers    enable row level security;

-- Public read for products
create policy "products_public_read" on products for select using (status = 'active');
-- Service role can do anything (bypasses RLS)

-- ToyzGuru Database Schema Setup for Supabase
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/lunwguzzguemtotsshjm/sql/new)

-- ================= CREATE TABLES =================

-- 1. Profiles Table (Automatically synced from auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text default '',
  zip text,
  country text default 'IN',
  delivery_name text,
  delivery_email text,
  delivery_phone text,
  delivery_address text,
  delivery_city text,
  delivery_state text default '',
  delivery_zip text,
  delivery_country text default 'India',
  address1 text,
  address2 text,
  loyalty_points integer default 120 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- 2. Products Catalog Table
create table if not exists public.products (
  id text primary key,
  title text not null,
  category text not null,
  price numeric(12, 2) not null,
  original_price numeric(12, 2),
  image text not null,
  rating numeric(3, 2) default 5.00 not null,
  reviews_count integer default 1 not null,
  badge text,
  description text not null,
  options text[] default '{}'::text[] not null,
  specs jsonb default '{}'::jsonb not null,
  stock integer default 10 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Products
alter table public.products enable row level security;

-- 3. Shopping Cart Table (Synced dynamically for active users)
create table if not exists public.cart (
  user_id uuid references auth.users on delete cascade primary key,
  items jsonb default '[]'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Cart
alter table public.cart enable row level security;

-- 4. Customer Orders Table
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  email text not null,
  items jsonb not null,
  subtotal numeric(12, 2) not null,
  discount numeric(12, 2) default 0.00 not null,
  shipping numeric(12, 2) default 0.00 not null,
  tax numeric(12, 2) not null,
  total numeric(12, 2) not null,
  status text default 'pending'::text not null,
  address text not null,
  receipt_url text,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Orders
alter table public.orders enable row level security;

-- 5. Customer Feedback/Contact Messages Table
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Contact Messages
alter table public.contact_messages enable row level security;


-- ================= ROW LEVEL SECURITY (RLS) POLICIES =================

-- Profiles Policies
drop policy if exists "Allow public read access to profiles" on public.profiles;
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Allow users to insert their own profile" on public.profiles;
create policy "Allow users to insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Allow full profiles access (Admin Control)" on public.profiles;
create policy "Allow full profiles access (Admin Control)" on public.profiles
  for all using (true) with check (true);

-- Products Policies
drop policy if exists "Allow public read access to products" on public.products;
create policy "Allow public read access to products" on public.products
  for select using (true);

drop policy if exists "Allow public write access to products (Admin Control)" on public.products;
create policy "Allow public write access to products (Admin Control)" on public.products
  for all using (true) with check (true);

-- Cart Policies
drop policy if exists "Allow users to read their own cart" on public.cart;
create policy "Allow users to read their own cart" on public.cart
  for select using (auth.uid() = user_id);

drop policy if exists "Allow users to manage their own cart" on public.cart;
create policy "Allow users to manage their own cart" on public.cart
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders Policies
drop policy if exists "Allow users to read their own orders" on public.orders;
create policy "Allow users to read their own orders" on public.orders
  for select using (auth.uid() = user_id or email = auth.email());

drop policy if exists "Allow anyone to create an order" on public.orders;
create policy "Allow anyone to create an order" on public.orders
  for insert with check (true);

drop policy if exists "Allow full orders access (Admin Control)" on public.orders;
create policy "Allow full orders access (Admin Control)" on public.orders
  for all using (true) with check (true);

-- Contact Messages Policies
drop policy if exists "Allow anyone to insert messages" on public.contact_messages;
create policy "Allow anyone to insert messages" on public.contact_messages
  for insert with check (true);

drop policy if exists "Allow message access (Admin Control)" on public.contact_messages;
create policy "Allow message access (Admin Control)" on public.contact_messages
  for all using (true) with check (true);



-- ================= TRIGGERS AND PROCEDURES =================

-- Trigger to automatically create a profile row in public.profiles when a new user signs up via auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, loyalty_points, country, state)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Valued Customer'),
    new.email,
    120,
    'IN',
    ''
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger block
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ================= STORAGE SETUP =================

-- Enable storage extensions
create or replace function public.setup_bucket()
returns void as $$
begin
  -- Create bucket if not exists
  insert into storage.buckets (id, name, public) 
  values ('product-images', 'product-images', true)
  on conflict (id) do nothing;
  
  -- Create policies to allow public access to product-images
  drop policy if exists "Public Access" on storage.objects;
  create policy "Public Access" on storage.objects 
    for select using (bucket_id = 'product-images');

  drop policy if exists "Allow Public Uploads" on storage.objects;
  create policy "Allow Public Uploads" on storage.objects 
    for insert with check (bucket_id = 'product-images');

  drop policy if exists "Allow Public Updates" on storage.objects;
  create policy "Allow Public Updates" on storage.objects 
    for update using (bucket_id = 'product-images');

  drop policy if exists "Allow Public Deletions" on storage.objects;
  create policy "Allow Public Deletions" on storage.objects 
    for delete using (bucket_id = 'product-images');
end;
$$ language plpgsql;

select public.setup_bucket();

-- ================= RECEIPT STORAGE SETUP =================
-- Add bucket for order receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('order-receipts', 'order-receipts', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read policy for receipts
drop policy if exists "Public Receipt Access" on storage.objects;
CREATE POLICY "Public Receipt Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-receipts');

drop policy if exists "Public Receipt Upload" on storage.objects;
CREATE POLICY "Public Receipt Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-receipts');

drop policy if exists "Public Receipt Update" on storage.objects;
CREATE POLICY "Public Receipt Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'order-receipts');

drop policy if exists "Public Receipt Delete" on storage.objects;
CREATE POLICY "Public Receipt Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'order-receipts');


-- ================= DELIVERY CHARGES & COURIERS SETUP =================

-- 6. Delivery Charges Table
create table if not exists public.delivery_charges (
  state_name text primary key,
  normal_price numeric(12, 2) not null default 150.00,
  express_price numeric(12, 2) not null default 350.00,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Delivery Charges
alter table public.delivery_charges enable row level security;

drop policy if exists "Allow public read access to delivery_charges" on public.delivery_charges;
create policy "Allow public read access to delivery_charges" on public.delivery_charges
  for select using (true);

drop policy if exists "Allow full delivery_charges access (Admin Control)" on public.delivery_charges;
create policy "Allow full delivery_charges access (Admin Control)" on public.delivery_charges
  for all using (true) with check (true);

-- 7. Courier Agencies Table
create table if not exists public.couriers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  assigned_states text[] default '{}'::text[] not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Couriers
alter table public.couriers enable row level security;

drop policy if exists "Allow public read access to couriers" on public.couriers;
create policy "Allow public read access to couriers" on public.couriers
  for select using (true);

drop policy if exists "Allow full couriers access (Admin Control)" on public.couriers;
create policy "Allow full couriers access (Admin Control)" on public.couriers
  for all using (true) with check (true);


-- 8. Coupons Table
create table if not exists public.coupons (
  code text primary key,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(12, 2) not null,
  min_order numeric(12, 2) default 0.00 not null,
  max_discount numeric(12, 2),
  usage_limit integer,
  expires_at timestamp with time zone,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Coupons
alter table public.coupons enable row level security;

drop policy if exists "Allow public read access to coupons" on public.coupons;
create policy "Allow public read access to coupons" on public.coupons
  for select using (true);

drop policy if exists "Allow full coupons access (Admin Control)" on public.coupons;
create policy "Allow full coupons access (Admin Control)" on public.coupons
  for all using (true) with check (true);


-- ================= STORE SETTINGS (TAXES) =================
create table if not exists public.store_settings (
  id integer primary key,
  tax_enabled boolean default true,
  sgst_pct numeric default 4.0,
  cgst_pct numeric default 4.0,
  igst_pct numeric default 0.0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default row if not exists
insert into public.store_settings (id, tax_enabled, sgst_pct, cgst_pct, igst_pct)
values (1, true, 4.0, 4.0, 0.0)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

create policy "Allow public read access to store_settings" on public.store_settings
  for select using (true);

create policy "Allow full store_settings access (Admin Control)" on public.store_settings
  for all using (true) with check (true);


-- ================= NEWSLETTER SUBSCRIBERS =================

-- 9. Newsletter Subscribers Table
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.newsletter_subscribers enable row level security;

-- Anyone can subscribe (insert)
drop policy if exists "Allow anyone to subscribe to newsletter" on public.newsletter_subscribers;
create policy "Allow anyone to subscribe to newsletter" on public.newsletter_subscribers
  for insert with check (true);

-- Admin can read all subscribers
drop policy if exists "Allow full newsletter access (Admin Control)" on public.newsletter_subscribers;
create policy "Allow full newsletter access (Admin Control)" on public.newsletter_subscribers
  for all using (true) with check (true);


-- ================= WISHLIST PERSISTENCE MIGRATION =================
-- Run this to enable cross-device wishlist persistence for logged-in users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wishlist jsonb DEFAULT NULL;


-- ================= INDIAN GST & TAX MANAGEMENT MODULE =================

-- 10. GST Tax Rates Table
create table if not exists public.gst_tax_rates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  tax_type text not null, -- 'GST 0%', 'GST 5%', 'GST 12%', 'GST 18%'
  cgst_pct numeric(5, 2) not null default 0.00,
  sgst_pct numeric(5, 2) not null default 0.00,
  igst_pct numeric(5, 2) not null default 0.00,
  total_tax_pct numeric(5, 2) not null default 0.00,
  is_active boolean not null default true,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for gst_tax_rates
alter table public.gst_tax_rates enable row level security;

drop policy if exists "Allow public read access to gst_tax_rates" on public.gst_tax_rates;
create policy "Allow public read access to gst_tax_rates" on public.gst_tax_rates
  for select using (true);

drop policy if exists "Allow full gst_tax_rates access (Admin Control)" on public.gst_tax_rates;
create policy "Allow full gst_tax_rates access (Admin Control)" on public.gst_tax_rates
  for all using (true) with check (true);

-- Seed default GST rates
insert into public.gst_tax_rates (name, code, tax_type, cgst_pct, sgst_pct, igst_pct, total_tax_pct, is_active, description)
values
  ('No Tax (0%)', 'GST0', 'GST 0%', 0.00, 0.00, 0.00, 0.00, true, 'Zero tax category'),
  ('GST 5%', 'GST5', 'GST 5%', 2.50, 2.50, 5.00, 5.00, true, 'GST 5% tax category'),
  ('GST 12%', 'GST12', 'GST 12%', 6.00, 6.00, 12.00, 12.00, true, 'GST 12% tax category'),
  ('GST 18%', 'GST18', 'GST 18%', 9.00, 9.00, 18.00, 18.00, true, 'GST 18% tax category')
on conflict (code) do update set
  name = excluded.name,
  tax_type = excluded.tax_type,
  cgst_pct = excluded.cgst_pct,
  sgst_pct = excluded.sgst_pct,
  igst_pct = excluded.igst_pct,
  total_tax_pct = excluded.total_tax_pct;

-- 11. Add GST fields to public.products
alter table public.products add column if not exists tax_applicable boolean default true;
alter table public.products add column if not exists gst_category_id uuid references public.gst_tax_rates(id) on delete set null;
alter table public.products add column if not exists hsn_code text;
alter table public.products add column if not exists sac_code text;

-- 12. Add dynamic GST settings columns to public.store_settings
alter table public.store_settings add column if not exists seller_gstin text;
alter table public.store_settings add column if not exists business_state text default 'Telangana';
alter table public.store_settings add column if not exists default_tax_category_id uuid references public.gst_tax_rates(id) on delete set null;
alter table public.store_settings add column if not exists gst_enabled boolean default true;
alter table public.store_settings add column if not exists display_prices_including_tax boolean default true;
alter table public.store_settings add column if not exists display_prices_excluding_tax boolean default false;

-- 13. Add dynamic tax tracking to public.orders
alter table public.orders add column if not exists cgst_amount numeric(12, 2) default 0.00;
alter table public.orders add column if not exists sgst_amount numeric(12, 2) default 0.00;
alter table public.orders add column if not exists igst_amount numeric(12, 2) default 0.00;
alter table public.orders add column if not exists total_tax_amount numeric(12, 2) default 0.00;
alter table public.orders add column if not exists buyer_gstin text;



-- ============================================================
--  AutoFleet — Supabase Schema
--  Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────────────────

create table if not exists public.cars (
  id           text primary key,
  name         text not null,
  plate        text not null,
  year         text,
  rate         numeric        default 0,
  mileage      text,
  mileage_date text,
  reg_expiry   text,
  ins_expiry   text,
  inspection   text,
  notes        text,
  photo        text,                    -- base64 data-URL
  created_at   timestamptz    default now()
);

create table if not exists public.customers (
  id             text primary key,
  name           text not null,
  phone          text,
  license        text,
  license_expiry text,
  address        text,
  notes          text,
  id_document    text,                  -- base64 data-URL
  agreement_doc  text,                  -- base64 data-URL
  created_at     timestamptz  default now()
);

create table if not exists public.bookings (
  id           text primary key,
  customer     text not null,
  contact      text,
  license      text,
  car          text not null,
  plate        text,
  service_type text          default 'Self-drive',
  driver       text,
  pickup       text not null,
  return_date  text not null,
  rate         numeric       default 0,
  fees         numeric       default 0,
  book_status  text          default 'Active',
  notes        text,
  paid         numeric       default 0,
  days         integer       default 0,
  subtotal     numeric       default 0,
  total        numeric       default 0,
  pay_status   text,
  created_at   timestamptz   default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────
--  Any authenticated user can read/write all rows.
--  For a single-admin deployment this is the correct policy.

alter table public.cars      enable row level security;
alter table public.customers enable row level security;
alter table public.bookings  enable row level security;

create policy "auth_all_cars"
  on public.cars for all
  to authenticated
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth_all_customers"
  on public.customers for all
  to authenticated
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth_all_bookings"
  on public.bookings for all
  to authenticated
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── Realtime ──────────────────────────────────────────────────────────────
--  Adds the three tables to the default Supabase Realtime publication
--  so INSERT / UPDATE / DELETE events are broadcast to connected clients.

alter publication supabase_realtime add table public.cars;
alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.bookings;

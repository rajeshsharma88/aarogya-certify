-- Aarogya India — Payment Gateway Integration (Phase 1)
-- Supabase schema: payment tables, RLS policies, and payment management RPCs

-- ========================================== Add payment fields to certificates
alter table certificates
  add column if not exists is_paid boolean default false,
  add column if not exists paid_at timestamptz,
  add column if not exists can_download boolean default false;

-- =========================================== Payment Tables

-- Payment Orders: tracks all payment transactions via Razorpay
create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  certificate_id uuid not null references certificates (id) on delete cascade,

  -- Amount in paise (100 paise = ₹1)
  amount_paise int not null,
  currency text not null default 'INR' check (currency in ('INR', 'USD', 'EUR')),

  -- Order status
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),

  -- Razorpay transaction identifiers
  razorpay_order_id varchar(255) unique,
  razorpay_payment_id varchar(255),
  razorpay_signature varchar(255),

  -- Payment method used
  payment_method text check (payment_method in ('card', 'upi', 'netbanking', 'wallet', null)),

  -- Timestamps
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz,

  -- Indexes for common queries
  constraint unique_order_per_cert unique (user_id, certificate_id)
);

create index if not exists idx_payment_orders_user_id on payment_orders (user_id);
create index if not exists idx_payment_orders_certificate_id on payment_orders (certificate_id);
create index if not exists idx_payment_orders_status on payment_orders (status);
create index if not exists idx_payment_orders_razorpay_order_id on payment_orders (razorpay_order_id);

-- Payment Invoices: GST invoices for paid orders
create table if not exists payment_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references payment_orders (id) on delete cascade,

  -- Invoice numbering
  invoice_number varchar(50) unique not null,

  -- Billing details
  full_name varchar(255),
  email varchar(255),
  address text,
  gst_number varchar(50),

  -- Amount breakdown
  amount_paise int,
  gst_amount_paise int,
  total_amount_paise int,

  -- Invoice document
  pdf_url varchar(1024),
  generated_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_payment_invoices_order_id on payment_invoices (order_id);
create index if not exists idx_payment_invoices_invoice_number on payment_invoices (invoice_number);

-- Certificate Downloads: tracks certificate PDF downloads
create table if not exists certificate_downloads (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references certificates (id) on delete cascade,
  order_id uuid not null references payment_orders (id) on delete cascade,

  download_count int default 0,
  last_downloaded_at timestamptz,

  created_at timestamptz not null default now(),

  constraint unique_download_per_cert unique (certificate_id, order_id)
);

create index if not exists idx_certificate_downloads_certificate_id on certificate_downloads (certificate_id);
create index if not exists idx_certificate_downloads_order_id on certificate_downloads (order_id);

-- LinkedIn Shares: tracks certificate sharing to LinkedIn
create table if not exists linkedin_shares (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references certificates (id) on delete cascade,
  order_id uuid not null references payment_orders (id) on delete cascade,

  linkedin_post_id varchar(255),
  shared_at timestamptz,

  share_text text,
  certificate_badge_url varchar(1024),
  verification_url varchar(1024),

  created_at timestamptz not null default now()
);

create index if not exists idx_linkedin_shares_certificate_id on linkedin_shares (certificate_id);
create index if not exists idx_linkedin_shares_order_id on linkedin_shares (order_id);

-- ============================================================ RLS Policies

-- Enable RLS
alter table payment_orders enable row level security;
alter table payment_invoices enable row level security;
alter table certificate_downloads enable row level security;
alter table linkedin_shares enable row level security;

-- Payment Orders: owner read/write, admin full access
create policy "payment_orders owner read" on payment_orders
  for select using (user_id = auth.uid() or is_admin());

create policy "payment_orders owner write" on payment_orders
  for insert with check (user_id = auth.uid());

create policy "payment_orders admin update" on payment_orders
  for update using (is_admin()) with check (is_admin());

-- Payment Invoices: owner read, admin full access
create policy "payment_invoices owner read" on payment_invoices
  for select using (
    exists (select 1 from payment_orders po where po.id = order_id and po.user_id = auth.uid()) or is_admin()
  );

create policy "payment_invoices admin write" on payment_invoices
  for all using (is_admin()) with check (is_admin());

-- Certificate Downloads: owner read, admin full access
create policy "certificate_downloads owner read" on certificate_downloads
  for select using (
    exists (select 1 from payment_orders po where po.id = order_id and po.user_id = auth.uid()) or is_admin()
  );

create policy "certificate_downloads admin write" on certificate_downloads
  for all using (is_admin()) with check (is_admin());

-- LinkedIn Shares: owner read, admin full access
create policy "linkedin_shares owner read" on linkedin_shares
  for select using (
    exists (select 1 from payment_orders po where po.id = order_id and po.user_id = auth.uid()) or is_admin()
  );

create policy "linkedin_shares admin write" on linkedin_shares
  for all using (is_admin()) with check (is_admin());

-- ============================================================= RPCs

-- Create a payment order for a certificate
create or replace function create_payment_order(
  p_certificate_id uuid,
  p_amount_paise int,
  p_currency text default 'INR'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cert certificates%rowtype;
  v_order payment_orders%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  -- Verify certificate exists and belongs to user
  select * into v_cert from certificates where id = p_certificate_id and user_id = v_uid;
  if not found then raise exception 'Certificate not found'; end if;

  -- Create or return existing order
  select * into v_order from payment_orders
    where user_id = v_uid and certificate_id = p_certificate_id and status = 'pending'
    limit 1;

  if found then
    return to_jsonb(v_order);
  end if;

  -- Create new order
  insert into payment_orders (user_id, certificate_id, amount_paise, currency)
  values (v_uid, p_certificate_id, p_amount_paise, p_currency)
  returning * into v_order;

  return to_jsonb(v_order);
end $$;

-- Mark payment as completed (called by webhook after Razorpay verification)
create or replace function complete_payment(
  p_order_id uuid,
  p_razorpay_payment_id varchar,
  p_razorpay_signature varchar
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order payment_orders%rowtype;
begin
  if v_uid is null and not is_admin() then
    raise exception 'Not authenticated';
  end if;

  select * into v_order from payment_orders where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;

  -- Only admin can complete payments via RPC (webhook should be admin-only)
  if not is_admin() then raise exception 'Forbidden'; end if;

  -- Update order status
  update payment_orders
    set status = 'completed',
        completed_at = now(),
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = p_razorpay_signature
    where id = p_order_id
    returning * into v_order;

  -- Mark certificate as paid
  update certificates
    set is_paid = true,
        paid_at = now(),
        can_download = true
    where id = v_order.certificate_id;

  return to_jsonb(v_order);
end $$;

-- Get payment orders for a user
create or replace function get_user_payment_orders()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  return coalesce(
    (select jsonb_agg(to_jsonb(po.*) || jsonb_build_object(
      'certificate', (select jsonb_build_object('id', c.id, 'title', c.title, 'certificate_no', c.certificate_no))
        from certificates c where c.id = po.certificate_id
    ))
    from payment_orders po
    where po.user_id = v_uid
    order by po.created_at desc),
    '[]'::jsonb
  );
end $$;

-- Get payment status for a certificate
create or replace function get_payment_status(p_certificate_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order payment_orders%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_order from payment_orders
    where user_id = v_uid and certificate_id = p_certificate_id
    order by created_at desc
    limit 1;

  if found then
    return to_jsonb(v_order);
  else
    return jsonb_build_object('status', 'unpaid');
  end if;
end $$;

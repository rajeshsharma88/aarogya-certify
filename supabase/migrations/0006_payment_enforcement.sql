-- Aarogya India Gurukul — make certificate payment real
--
-- Until now the payment path was scaffolding: create_payment_order invented a
-- row with a client-supplied amount and never called Razorpay, and signature
-- verification always returned true. Order creation and verification now live
-- in edge functions that hold the Razorpay key secret. This migration closes
-- the paths that bypass them.
--
-- Run with: supabase db push   (or paste into psql)

begin;

-- 1. Grandfather every certificate issued before payment existed.
--
-- is_paid defaults to false, so without this every certificate already earned
-- would become undownloadable the moment the download is gated. Nobody who has
-- already passed should lose access because we started charging afterwards.
update certificates
   set is_paid = true,
       paid_at = coalesce(paid_at, created_at),
       can_download = true
 where is_paid is distinct from true;

-- 2. Stop the client creating its own orders.
--
-- create_payment_order takes p_amount_paise from the caller, so anyone able to
-- execute it could issue themselves a one paisa order and pay that instead.
-- The edge function sets the price from server configuration. The function is
-- left in place for administrative use rather than dropped, so an operator can
-- still record an offline payment.
-- Revoking from anon and authenticated is NOT enough, and this migration got
-- that wrong at first. Postgres grants EXECUTE on every new function to PUBLIC
-- by default, and both roles inherit it, so the ACL still read
--
--   =X/postgres postgres=X/postgres service_role=X/postgres
--
-- and anon could still call it. The leading "=X" is the PUBLIC grant. Only
-- revoking from public actually closes the path; the explicit service_role
-- grant then keeps it reachable from the edge functions.
revoke execute on function create_payment_order(uuid, int, text) from public, anon, authenticated;
grant execute on function create_payment_order(uuid, int, text) to service_role;

-- 3. complete_payment already requires is_admin(), and it does not verify the
-- Razorpay signature — it only stores it. That is acceptable for an admin
-- recording a payment by hand, and it is not reachable by candidates, but it
-- must never become the normal path. Verification belongs in razorpay-verify
-- and razorpay-webhook, which hold the key secret.
revoke execute on function complete_payment(uuid, varchar, varchar) from public, anon, authenticated;
grant execute on function complete_payment(uuid, varchar, varchar) to service_role;

comment on function complete_payment(uuid, varchar, varchar) is
  'Administrative override only: records a payment WITHOUT verifying the Razorpay signature. '
  'Normal payments are completed by the razorpay-verify / razorpay-webhook edge functions.';

-- 4. The webhook looks orders up by razorpay_order_id on every retry.
-- The unique constraint from 0003 already indexes it; this is a no-op where
-- that constraint exists and a safety net where it does not.
create index if not exists idx_payment_orders_rzp_order on payment_orders (razorpay_order_id);

commit;

-- Verify:
--   select count(*) filter (where is_paid) as paid,
--          count(*) filter (where not is_paid) as unpaid
--     from certificates;
-- Expect unpaid = 0 immediately after running this.
--
--   select p.proname, array_to_string(p.proacl, ' ')
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('create_payment_order', 'complete_payment');
-- Expect "postgres=X/postgres service_role=X/postgres" and NO bare "=X/..."
-- entry — that leading one is PUBLIC, and it is what let anon through.
--
-- Grant changes are invisible to PostgREST until its cache is refreshed:
--   notify pgrst, 'reload schema';

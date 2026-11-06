-- Aarogya India — restrict the live catalog to Ayurveda
--
-- Aarogya India is authorised to certify in Ayurveda only, so every domain and
-- certification outside dom-ayurveda is withdrawn from the catalog.
--
-- Deactivated, not deleted, and deliberately so:
--   * attempts.certification_id and certificates.certification_id reference
--     certifications with ON DELETE RESTRICT, so a delete would be refused
--     outright as soon as anyone had taken one of these assessments;
--   * certificates already issued must stay verifiable. Withdrawing an
--     assessment from sale is not a reason to invalidate a credential someone
--     legitimately earned, and the public verification page must keep working.
--
-- is_active is enforced as an authorisation gate, not merely a listing filter:
--   * RLS ("certs public read" / "domains public read") hides inactive rows
--     from anonymous reads, so direct URLs resolve to nothing;
--   * start_attempt() already selects `... and is_active`, so no new attempt
--     can be started against a withdrawn certification.
--
-- Safe to re-run. Reversible: set is_active = true for a domain and its
-- certifications if the authorisation is ever extended.
--
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

begin;

update domains
   set is_active = false
 where id <> 'dom-ayurveda'
   and is_active;

update certifications
   set is_active = false
 where domain_id <> 'dom-ayurveda'
   and is_active;

commit;

-- Verify (expects 1 active domain and 4 active certifications):
--   select
--     (select count(*) from domains        where is_active) as active_domains,
--     (select count(*) from certifications where is_active) as active_certs,
--     (select count(*) from certifications where not is_active) as withdrawn;

-- Remove the stale single-argument get_attempt_questions.
--
-- 0001 created get_attempt_questions(uuid). 0002 then ran
--
--   create or replace function get_attempt_questions(uuid, text default 'en')
--
-- intending to replace it. In Postgres the argument list is part of a
-- function's identity, so "or replace" replaced nothing: it created a second,
-- overloaded function and left the first one in place.
--
-- The app posts only p_attempt_id. Both candidates accept that call — the
-- two-argument one because p_language has a default — so PostgREST cannot pick
-- one and answers 300 Multiple Choices with PGRST203:
--
--   Could not choose the best candidate function between:
--     public.get_attempt_questions(p_attempt_id => uuid),
--     public.get_attempt_questions(p_attempt_id => uuid, p_language => text)
--
-- Every attempt therefore failed to load its questions: the assessment could
-- be started but never taken.
--
-- Dropping the older one is the right way round. The two-argument version is a
-- superset — identical behaviour at the default p_language => 'en', plus the
-- Hindi columns the rest of 0002 added.

drop function if exists public.get_attempt_questions(uuid);

-- Re-assert the grant on the survivor. Dropping an overload does not touch it,
-- but a fresh database that applies these migrations in order should not have
-- to infer that.
grant execute on function public.get_attempt_questions(uuid, text) to authenticated;

-- Guard against this class of mistake returning. Any future overload makes the
-- app's one-argument call ambiguous again, and the failure appears only at
-- runtime, in the browser, mid-assessment.
do $$
declare v_count int;
begin
  select count(*) into v_count
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_attempt_questions';

  if v_count <> 1 then
    raise exception
      'get_attempt_questions must have exactly one overload, found %. PostgREST cannot resolve the app''s single-argument call otherwise.',
      v_count;
  end if;
end $$;

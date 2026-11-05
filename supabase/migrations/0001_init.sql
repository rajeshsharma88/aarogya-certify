-- Aarogya India — Skill Assessment & Certification Platform
-- Supabase schema: tables, indexes, RLS, and server-side RPCs.
-- Run with: supabase db push   (or paste into the SQL editor)

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------- profiles
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Learner',
  role text not null default 'candidate' check (role in ('candidate', 'admin')),
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- catalog
create table if not exists domains (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text default '',
  icon text default '📘',
  sort_order int not null default 99,
  is_active boolean not null default true
);

create table if not exists certifications (
  id text primary key,
  domain_id text not null references domains (id) on delete restrict,
  slug text unique not null,
  title text not null,
  short_desc text default '',
  description text default '',
  eligibility text default '',
  duration_sec int not null default 420,
  question_count int not null default 10,
  pass_score_pct int not null default 60,
  topics text[] not null default '{}',
  is_active boolean not null default true,
  popularity int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id text primary key,
  certification_id text not null references certifications (id) on delete cascade,
  topic text not null default 'General',
  difficulty text not null default 'medium',
  qtype text not null default 'mcq_single' check (qtype in ('mcq_single', 'mcq_multi', 'true_false')),
  body text not null,
  explanation text,
  is_active boolean not null default true
);

create table if not exists question_options (
  id text primary key,
  question_id text not null references questions (id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0
);

-- ------------------------------------------------------------- attempts
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  certification_id text not null references certifications (id) on delete restrict,
  status text not null default 'in_progress' check (status in ('in_progress', 'scored', 'expired', 'submitted')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  duration_sec int not null,
  candidate_name text not null,
  question_ids text[] not null default '{}',
  answers jsonb not null default '{}'::jsonb,
  marked_for_review text[] not null default '{}'
);

-- One open attempt per user/certification.
create unique index if not exists attempts_one_in_progress
  on attempts (user_id, certification_id) where status = 'in_progress';

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid unique not null references attempts (id) on delete cascade,
  score_pct int not null,
  correct_count int not null,
  total_count int not null,
  passed boolean not null,
  level text not null,
  breakdown jsonb not null default '[]'::jsonb,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------- certificates
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_no text unique not null,
  user_id uuid not null references profiles (id) on delete cascade,
  attempt_id uuid unique not null references attempts (id) on delete cascade,
  certification_id text not null references certifications (id) on delete restrict,
  holder_name text not null,
  title text not null,
  score_pct int not null,
  issue_date timestamptz not null default now(),
  expiry_date timestamptz,
  status text not null default 'valid' check (status in ('valid', 'revoked', 'expired')),
  verify_token text not null,
  created_at timestamptz not null default now()
);

create table if not exists verification_logs (
  id bigserial primary key,
  certificate_no text not null,
  found boolean not null,
  verified_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ RLS
alter table profiles enable row level security;
alter table domains enable row level security;
alter table certifications enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table attempts enable row level security;
alter table results enable row level security;
alter table certificates enable row level security;
alter table verification_logs enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles
create policy "profiles self read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'candidate');
create policy "profiles self insert" on profiles for insert with check (id = auth.uid());

-- catalog: public read of active rows; admin write
create policy "domains public read" on domains for select using (is_active or is_admin());
create policy "domains admin write" on domains for all using (is_admin()) with check (is_admin());
create policy "certs public read" on certifications for select using (is_active or is_admin());
create policy "certs admin write" on certifications for all using (is_admin()) with check (is_admin());
create policy "questions public read" on questions for select using (is_active or is_admin());
create policy "questions admin write" on questions for all using (is_admin()) with check (is_admin());
create policy "options public read" on question_options for select using (true);
create policy "options admin write" on question_options for all using (is_admin()) with check (is_admin());

-- attempts: owner + admin. Writes through RPC only (no update policy for candidates).
create policy "attempts owner read" on attempts for select using (user_id = auth.uid() or is_admin());
create policy "attempts admin write" on attempts for all using (is_admin()) with check (is_admin());

-- results / certificates: owner + admin read; issuance via RPC.
create policy "results owner read" on results for select using (
  exists (select 1 from attempts a where a.id = results.attempt_id and (a.user_id = auth.uid() or is_admin()))
);
create policy "certificates owner read" on certificates for select using (user_id = auth.uid() or is_admin());
create policy "certificates admin write" on certificates for all using (is_admin()) with check (is_admin());
create policy "verification logs insert" on verification_logs for insert with check (true);
create policy "verification logs admin read" on verification_logs for select using (is_admin());

-- ------------------------------------------------------------------ RPCs
-- Start (or resume) an attempt with a randomized question selection.
create or replace function start_attempt(p_certification_id text, p_candidate_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cert certifications%rowtype;
  v_attempt attempts%rowtype;
  v_ids text[];
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_attempt from attempts
   where user_id = v_uid and certification_id = p_certification_id and status = 'in_progress'
   limit 1;
  if found then return to_jsonb(v_attempt); end if;

  select * into v_cert from certifications where id = p_certification_id and is_active;
  if not found then raise exception 'Certification not found'; end if;

  select array_agg(id order by random())
    into v_ids
    from (select id from questions where certification_id = p_certification_id and is_active
          order by random() limit v_cert.question_count) q;

  insert into attempts (user_id, certification_id, status, duration_sec, candidate_name, question_ids)
  values (v_uid, p_certification_id, 'in_progress', v_cert.duration_sec, p_candidate_name, coalesce(v_ids, '{}'))
  returning * into v_attempt;

  return to_jsonb(v_attempt);
end $$;

-- Questions for an attempt WITHOUT correct answers.
create or replace function get_attempt_questions(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_attempt attempts%rowtype;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.user_id <> v_uid and not is_admin() then raise exception 'Forbidden'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', q.id, 'certification_id', q.certification_id, 'topic', q.topic,
      'difficulty', q.difficulty, 'qtype', q.qtype, 'body', q.body, 'is_active', q.is_active,
      'options', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', o.id, 'question_id', o.question_id, 'label', o.label, 'sort_order', o.sort_order
        ) order by o.sort_order), '[]'::jsonb)
        from question_options o where o.question_id = q.id
      )
    ))
    from questions q
    where q.id = any(v_attempt.question_ids)
  ), '[]'::jsonb);
end $$;

create or replace function save_answer(p_attempt_id uuid, p_question_id text, p_option_ids text[])
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_attempt attempts%rowtype;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.user_id <> v_uid then raise exception 'Forbidden'; end if;
  if v_attempt.status <> 'in_progress' then raise exception 'Attempt already submitted'; end if;
  if not (p_question_id = any(v_attempt.question_ids)) then raise exception 'Question not in attempt'; end if;

  update attempts
     set answers = jsonb_set(answers, array[p_question_id], to_jsonb(p_option_ids), true)
   where id = p_attempt_id;
end $$;

create or replace function toggle_mark_for_review(p_attempt_id uuid, p_question_id text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_attempt attempts%rowtype;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.user_id <> v_uid then raise exception 'Forbidden'; end if;
  update attempts
     set marked_for_review = case
       when p_question_id = any(marked_for_review) then array_remove(marked_for_review, p_question_id)
       else array_append(marked_for_review, p_question_id) end
   where id = p_attempt_id;
end $$;

-- Score server-side; idempotent; issue certificate when passed.
create or replace function submit_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_attempt attempts%rowtype;
  v_cert certifications%rowtype;
  v_result results%rowtype;
  v_correct int := 0;
  v_total int := 0;
  v_pct int;
  v_passed boolean;
  v_level text;
  v_breakdown jsonb := '[]'::jsonb;
  v_strengths text[] := '{}';
  v_improvements text[] := '{}';
  v_recos text[] := '{}';
  v_no text;
  v_expiry timestamptz;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.user_id <> v_uid then raise exception 'Forbidden'; end if;

  select * into v_result from results where attempt_id = p_attempt_id;
  if found then return to_jsonb(v_result); end if;
  if v_attempt.status <> 'in_progress' then raise exception 'Attempt is not in progress'; end if;

  select * into v_cert from certifications where id = v_attempt.certification_id;

  select count(*) filter (where correct), count(*)
    into v_correct, v_total
    from (
      select q.id,
             (select array_agg(o.id order by o.id) from question_options o where o.question_id = q.id and o.is_correct)
             = (select array_agg(x order by x) from jsonb_array_elements_text(coalesce(v_attempt.answers->q.id, '[]'::jsonb)) x)
             as correct
        from questions q
       where q.id = any(v_attempt.question_ids)
    ) s;

  v_pct := case when v_total = 0 then 0 else round(100.0 * v_correct / v_total)::int end;
  v_passed := v_pct >= v_cert.pass_score_pct;
  v_level := case when v_pct >= 90 then 'Expert' when v_pct >= 75 then 'Advanced'
                  when v_pct >= v_cert.pass_score_pct then 'Competent' else 'Developing' end;

  select coalesce(jsonb_agg(jsonb_build_object('topic', topic, 'correct', correct, 'total', total,
                                               'pct', case when total = 0 then 0 else round(100.0*correct/total)::int end)), '[]'::jsonb)
    into v_breakdown
    from (
      select q.topic,
             count(*) filter (where (select array_agg(o.id order by o.id) from question_options o where o.question_id = q.id and o.is_correct)
                              = (select array_agg(x order by x) from jsonb_array_elements_text(coalesce(v_attempt.answers->q.id, '[]'::jsonb)) x)) as correct,
             count(*) as total
        from questions q where q.id = any(v_attempt.question_ids)
       group by q.topic
    ) t;

  select coalesce(array_agg(topic), '{}') into v_strengths
    from jsonb_to_recordset(v_breakdown) as x(topic text, correct int, total int, pct int) where pct >= 70;
  select coalesce(array_agg(topic), '{}') into v_improvements
    from jsonb_to_recordset(v_breakdown) as x(topic text, correct int, total int, pct int) where pct < 70;

  if array_length(v_improvements, 1) is not null then
    select array_agg('Review ' || t || ' fundamentals and practise applied scenarios.') into v_recos from unnest(v_improvements) t;
  else
    v_recos := array['Keep your skills current with advanced practice in all covered topics.'];
  end if;

  insert into results (attempt_id, score_pct, correct_count, total_count, passed, level,
                       breakdown, strengths, improvements, recommendations)
  values (p_attempt_id, v_pct, v_correct, v_total, v_passed, v_level, v_breakdown, v_strengths, v_improvements, v_recos)
  returning * into v_result;

  update attempts set status = 'scored', submitted_at = now() where id = p_attempt_id;

  if v_passed then
    -- 48 bits of randomness formatted AIC-XXXX-XXXX-XXXX; uniqueness enforced by the loop + unique index.
    loop
      declare v_hex text := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12));
      begin
        v_no := 'AIC-' || substr(v_hex, 1, 4) || '-' || substr(v_hex, 5, 4) || '-' || substr(v_hex, 9, 4);
      end;
      exit when not exists (select 1 from certificates where certificate_no = v_no);
    end loop;

    insert into certificates (certificate_no, user_id, attempt_id, certification_id,
                              holder_name, title, score_pct, issue_date, status, verify_token)
    values (v_no, v_uid, p_attempt_id, v_attempt.certification_id,
            v_attempt.candidate_name, v_cert.title, v_pct, now(), 'valid', encode(gen_random_bytes(16), 'hex'));
  end if;

  return to_jsonb(v_result);
end $$;

-- Public verification: no login required; returns only display-safe fields.
create or replace function verify_certificate(p_certificate_no text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cert certificates%rowtype; v_status text;
begin
  select * into v_cert from certificates where certificate_no = upper(trim(p_certificate_no));

  insert into verification_logs (certificate_no, found) values (upper(trim(p_certificate_no)), found);

  if not found then
    return jsonb_build_object('found', false, 'certificateNo', upper(trim(p_certificate_no)),
                              'status', 'not_recognized',
                              'message', 'No certificate matches this ID. Check the ID and try again.');
  end if;

  v_status := case
    when v_cert.status = 'revoked' then 'revoked'
    when v_cert.expiry_date is not null and v_cert.expiry_date < now() then 'expired'
    else 'valid' end;

  return jsonb_build_object(
    'found', true, 'certificateNo', v_cert.certificate_no, 'holderName', v_cert.holder_name,
    'title', v_cert.title, 'org', 'Aarogya India', 'issueDate', v_cert.issue_date,
    'expiryDate', v_cert.expiry_date, 'scorePct', v_cert.score_pct, 'status', v_status,
    'message', case v_status
      when 'revoked' then 'This certificate has been revoked by the issuer and is no longer valid.'
      when 'expired' then 'This certificate has expired.'
      else 'This certificate is authentic and currently valid.' end
  );
end $$;

create or replace function revoke_certificate(p_certificate_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Forbidden'; end if;
  update certificates set status = 'revoked' where id = p_certificate_id;
end $$;

create or replace function admin_analytics()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Forbidden'; end if;
  return jsonb_build_object(
    'totalUsers', (select count(*) from profiles where role = 'candidate'),
    'totalAttempts', (select count(*) from attempts),
    'totalCertificates', (select count(*) from certificates),
    'passRate', (select coalesce(round(100.0 * count(*) filter (where passed) / nullif(count(*), 0)), 0) from results),
    'byDomain', (select coalesce(jsonb_agg(jsonb_build_object(
        'domain', d.name,
        'attempts', (select count(*) from attempts a join certifications c on c.id = a.certification_id where c.domain_id = d.id),
        'certificates', (select count(*) from certificates ce join certifications c on c.id = ce.certification_id where c.domain_id = d.id)
      )), '[]'::jsonb) from domains d)
  );
end $$;

-- Grant execution to authenticated users (and anon for verification).
grant execute on function start_attempt(text, text) to authenticated;
grant execute on function get_attempt_questions(uuid) to authenticated;
grant execute on function save_answer(uuid, text, text[]) to authenticated;
grant execute on function toggle_mark_for_review(uuid, text) to authenticated;
grant execute on function submit_attempt(uuid) to authenticated;
grant execute on function revoke_certificate(uuid) to authenticated;
grant execute on function admin_analytics() to authenticated;
grant execute on function verify_certificate(text) to anon, authenticated;

-- Bootstrap an admin (replace with a real user id after signing up):
-- update profiles set role = 'admin' where id = '<auth-user-uuid>';

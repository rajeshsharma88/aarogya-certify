-- Aarogya India — Hindi Localization (Phase 1)
-- Adds Hindi language support columns to enable bilingual certification platform
-- Run with: supabase db push   (or paste into the SQL editor)

-- ================================================================ profiles
-- Add preferred language field for users
alter table profiles add column if not exists preferred_language text
  check (preferred_language in ('en', 'hi'))
  default 'en';

-- ================================================================ domains
-- Add Hindi translations for domain names and descriptions
alter table domains add column if not exists name_hi text;
alter table domains add column if not exists description_hi text;

-- Comment for clarity
comment on column domains.name_hi is 'Domain name in Hindi (हिंदी)';
comment on column domains.description_hi is 'Domain description in Hindi (हिंदी)';

-- ================================================================ certifications
-- Add Hindi translations for certification content
alter table certifications add column if not exists title_hi text;
alter table certifications add column if not exists short_desc_hi text;
alter table certifications add column if not exists description_hi text;
alter table certifications add column if not exists eligibility_hi text;

-- Comments for clarity
comment on column certifications.title_hi is 'Certification title in Hindi (हिंदी)';
comment on column certifications.short_desc_hi is 'Short description in Hindi (हिंदी)';
comment on column certifications.description_hi is 'Full description in Hindi (हिंदी)';
comment on column certifications.eligibility_hi is 'Eligibility criteria in Hindi (हिंदी)';

-- ================================================================ questions
-- Add Hindi translation for question body and explanation
alter table questions add column if not exists body_hi text;
alter table questions add column if not exists explanation_hi text;

-- Add domain_id foreign key (for better querying)
alter table questions add column if not exists domain_id text
  references domains (id) on delete cascade;

-- Comments for clarity
comment on column questions.body_hi is 'Question body in Hindi (हिंदी)';
comment on column questions.explanation_hi is 'Question explanation in Hindi (हिंदी)';

-- ================================================================ question_options
-- Add Hindi translation for option labels
alter table question_options add column if not exists label_hi text;

comment on column question_options.label_hi is 'Option label in Hindi (हिंदी)';

-- ================================================================ localization_metadata
-- Optional table for tracking translation status and metadata
create table if not exists localization_metadata (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('domain', 'certification', 'question', 'option')),
  entity_id text not null,
  language text not null check (language in ('en', 'hi')),
  translation_status text not null default 'pending'
    check (translation_status in ('pending', 'in_progress', 'completed', 'reviewed')),
  translator_notes text,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type, entity_id, language)
);

comment on table localization_metadata is 'Tracks translation status for all localizable content';

-- ================================================================ indexes
-- Add indexes for common queries
create index if not exists idx_profiles_preferred_language on profiles(preferred_language);
create index if not exists idx_localization_metadata_status on localization_metadata(translation_status);
create index if not exists idx_localization_metadata_entity on localization_metadata(entity_type, entity_id);

-- ================================================================ RLS for localization_metadata
alter table localization_metadata enable row level security;

-- Admin only can read/write localization metadata
create policy "localization_metadata admin read" on localization_metadata
  for select using (is_admin());
create policy "localization_metadata admin write" on localization_metadata
  for all using (is_admin()) with check (is_admin());

-- ================================================================ Updated RPC: get_attempt_questions with language support
-- Supports both English and Hindi based on language parameter
create or replace function get_attempt_questions(p_attempt_id uuid, p_language text DEFAULT 'en')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
        v_attempt attempts%rowtype;
        v_body_field text := case when p_language = 'hi' then 'body_hi' else 'body' end;
        v_exp_field text := case when p_language = 'hi' then 'explanation_hi' else 'explanation' end;
        v_label_field text := case when p_language = 'hi' then 'label_hi' else 'label' end;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.user_id <> v_uid and not is_admin() then raise exception 'Forbidden'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', q.id, 'certification_id', q.certification_id, 'topic', q.topic,
      'difficulty', q.difficulty, 'qtype', q.qtype,
      'body', case when p_language = 'hi' then coalesce(q.body_hi, q.body) else q.body end,
      'explanation', case when p_language = 'hi' then coalesce(q.explanation_hi, q.explanation) else q.explanation end,
      'is_active', q.is_active,
      'options', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', o.id, 'question_id', o.question_id,
          'label', case when p_language = 'hi' then coalesce(o.label_hi, o.label) else o.label end,
          'sort_order', o.sort_order
        ) order by o.sort_order), '[]'::jsonb)
        from question_options o where o.question_id = q.id
      )
    ))
    from questions q
    where q.id = any(v_attempt.question_ids)
  ), '[]'::jsonb);
end $$;

-- Update grant for new RPC signature
grant execute on function get_attempt_questions(uuid, text) to authenticated;

-- ================================================================ Migration Info
-- This migration adds support for:
-- 1. User language preference (profiles.preferred_language)
-- 2. Hindi translations for domains, certifications, questions, options
-- 3. Localization metadata tracking for translation management
-- 4. Updated RPC to support language parameter
--
-- No data is deleted or changed. All Hindi fields are optional and default to NULL.
-- The system falls back to English if Hindi content is not provided.

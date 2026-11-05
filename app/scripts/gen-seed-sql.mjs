/**
 * Generates `supabase/migrations/0004_seed_catalog.sql` from the canonical
 * TypeScript catalog in `src/data/seed.ts`.
 *
 * The catalog (domains, certifications, questions, question_options) previously
 * existed only in TypeScript, so it was visible to the local browser backend
 * but absent from Supabase — leaving the hosted catalog empty. Regenerate after
 * editing seed.ts:
 *
 *   node scripts/gen-seed-sql.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const outFile = path.resolve(appRoot, '../supabase/migrations/0004_seed_catalog.sql');

// Load the TypeScript seed through Vite so imports and types resolve exactly as
// they do in the app, with no duplicate copy of the catalog to drift out of sync.
const server = await createServer({
  configFile: false,
  root: appRoot,
  logLevel: 'warn',
  server: { middlewareMode: true },
  appType: 'custom',
});
const { DOMAINS, CERTIFICATIONS, QUESTIONS } = await server.ssrLoadModule('/src/data/seed.ts');
await server.close();

// ---------------------------------------------------------------- SQL helpers
/** Quotes a value as a SQL literal; undefined/null become NULL. */
function lit(v) {
  if (v === undefined || v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`Non-finite number: ${v}`);
    return String(v);
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Renders a JS string array as a Postgres text[] literal. */
function textArray(items) {
  if (!items?.length) return `'{}'`;
  return `array[${items.map(lit).join(', ')}]::text[]`;
}

/**
 * Builds an idempotent multi-row upsert. Re-running the migration refreshes
 * existing rows instead of failing on the primary key.
 */
function upsert(table, columns, rows, conflictKey = 'id') {
  if (!rows.length) return '';
  const updates = columns
    .filter((c) => c !== conflictKey)
    .map((c) => `  ${c} = excluded.${c}`)
    .join(',\n');
  const values = rows.map((r) => `  (${r.join(', ')})`).join(',\n');
  return (
    `insert into ${table} (${columns.join(', ')}) values\n${values}\n` +
    `on conflict (${conflictKey}) do update set\n${updates};\n`
  );
}

// ------------------------------------------------------------------- sections
const out = [];
out.push(`-- Aarogya India — catalog seed (domains, certifications, questions, options)
--
-- GENERATED FILE — do not edit by hand.
-- Source: app/src/data/seed.ts
-- Regenerate: cd app && node scripts/gen-seed-sql.mjs
--
-- The catalog lived only in TypeScript, which the local browser backend reads
-- directly. Supabase had the tables but no rows, so a hosted deployment showed
-- an empty certification directory. This migration loads the same catalog.
--
-- Safe to re-run: every statement upserts on the primary key.
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

begin;
`);

out.push('-- ------------------------------------------------------------- domains');
out.push(
  upsert(
    'domains',
    ['id', 'slug', 'name', 'description', 'name_hi', 'description_hi', 'icon', 'sort_order', 'is_active'],
    DOMAINS.map((d) => [
      lit(d.id),
      lit(d.slug),
      lit(d.name),
      lit(d.description),
      lit(d.nameHi),
      lit(d.descriptionHi),
      lit(d.icon),
      // sort_order is `int` in the schema but the seed uses fractional values
      // (Ayurveda is 2.5) to slot domains between existing ones.
      lit(Math.round(d.sortOrder * 10)),
      lit(d.isActive),
    ])
  )
);

out.push('-- ------------------------------------------------------ certifications');
out.push(
  upsert(
    'certifications',
    [
      'id', 'domain_id', 'slug', 'title', 'short_desc', 'description', 'eligibility',
      'title_hi', 'short_desc_hi', 'description_hi', 'eligibility_hi',
      'duration_sec', 'question_count', 'pass_score_pct', 'topics',
      'is_active', 'popularity', 'created_at',
    ],
    CERTIFICATIONS.map((c) => [
      lit(c.id),
      lit(c.domainId),
      lit(c.slug),
      lit(c.title),
      lit(c.shortDesc),
      lit(c.description),
      lit(c.eligibility),
      lit(c.titleHi),
      lit(c.shortDescHi),
      lit(c.descriptionHi),
      lit(c.eligibilityHi),
      lit(c.durationSec),
      lit(c.questionCount),
      lit(c.passScorePct),
      textArray(c.topics),
      lit(c.isActive),
      lit(c.popularity),
      lit(c.createdAt),
    ])
  )
);

out.push('-- ----------------------------------------------------------- questions');
out.push(
  upsert(
    'questions',
    [
      'id', 'certification_id', 'domain_id', 'topic', 'difficulty', 'qtype',
      'body', 'body_hi', 'explanation', 'explanation_hi', 'is_active',
    ],
    QUESTIONS.map((q) => [
      lit(q.id),
      lit(q.certificationId),
      lit(q.domainId),
      lit(q.topic),
      lit(q.difficulty),
      lit(q.qtype),
      lit(q.body),
      lit(q.bodyHi),
      lit(q.explanation),
      lit(q.explanationHi),
      lit(q.isActive),
    ])
  )
);

out.push('-- ---------------------------------------------------- question_options');
const options = QUESTIONS.flatMap((q) => q.options.map((o) => ({ ...o, questionId: q.id })));
out.push(
  upsert(
    'question_options',
    ['id', 'question_id', 'label', 'label_hi', 'is_correct', 'sort_order'],
    options.map((o) => [
      lit(o.id),
      lit(o.questionId),
      lit(o.label),
      lit(o.labelHi),
      lit(o.isCorrect),
      lit(o.sortOrder),
    ])
  )
);

out.push(`commit;

-- Sanity check (expects ${DOMAINS.length} / ${CERTIFICATIONS.length} / ${QUESTIONS.length} / ${options.length}):
--   select
--     (select count(*) from domains)          as domains,
--     (select count(*) from certifications)   as certifications,
--     (select count(*) from questions)        as questions,
--     (select count(*) from question_options) as options;
`);

// ------------------------------------------------------------- sanity checks
const certIds = new Set(CERTIFICATIONS.map((c) => c.id));
const domainIds = new Set(DOMAINS.map((d) => d.id));
const problems = [];
for (const c of CERTIFICATIONS) {
  if (!domainIds.has(c.domainId)) problems.push(`certification ${c.id} -> unknown domain ${c.domainId}`);
}
for (const q of QUESTIONS) {
  if (!certIds.has(q.certificationId)) problems.push(`question ${q.id} -> unknown certification ${q.certificationId}`);
  if (q.domainId && !domainIds.has(q.domainId)) problems.push(`question ${q.id} -> unknown domain ${q.domainId}`);
  const correct = q.options.filter((o) => o.isCorrect).length;
  if (correct === 0) problems.push(`question ${q.id} has no correct option`);
  if (q.qtype === 'mcq_single' && correct > 1) problems.push(`single-answer question ${q.id} has ${correct} correct options`);
}
const dupes = (arr) => {
  const seen = new Set();
  const bad = new Set();
  for (const x of arr) (seen.has(x) ? bad : seen).add(x);
  return [...bad];
};
for (const [label, ids] of [
  ['domain', DOMAINS.map((d) => d.id)],
  ['certification', CERTIFICATIONS.map((c) => c.id)],
  ['question', QUESTIONS.map((q) => q.id)],
  ['option', options.map((o) => o.id)],
]) {
  const d = dupes(ids);
  if (d.length) problems.push(`duplicate ${label} ids: ${d.slice(0, 5).join(', ')}`);
}

if (problems.length) {
  console.error('Refusing to write SQL — seed data is inconsistent:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

fs.writeFileSync(outFile, out.join('\n'));
console.log(`Wrote ${path.relative(path.resolve(appRoot, '..'), outFile)}`);
console.log(
  `  ${DOMAINS.length} domains, ${CERTIFICATIONS.length} certifications, ` +
    `${QUESTIONS.length} questions, ${options.length} options`
);

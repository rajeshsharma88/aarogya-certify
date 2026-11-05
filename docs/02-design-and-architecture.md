# Aarogya India — Skill Assessment & Certification Platform
## Brand, Page Map, Journeys, Database Architecture, Implementation Plan

---

## A. Brand identity (original — not Beep)

| Token | Value | Rationale |
|---|---|---|
| Product name | **Aarogya India Certifications** | "Aarogya" = wellness/health (Sanskrit) |
| Tagline | *"Prove your skill. Earn trust."* | original |
| Primary | Deep teal `#0F766E` (teal-700) | health, trust, calm |
| Primary dark | `#134E4A` | headers |
| Accent | Saffron/amber `#F59E0B` | Indian identity, energy |
| Accent soft | `#FEF3C7` | highlights |
| Success | `#16A34A` | valid certificate |
| Danger | `#DC2626` | invalid/revoked |
| Ink | `#0F172A` slate-900 | text |
| Surface | `#FFFFFF` / `#F8FAFC` | cards / page |
| Radius | `0.75rem` cards, `999px` pills | |
| Font | Inter (UI) + Fraunces (display/cert) | system fallback stack |
| Certificate motif | "Aarogya Lotus Seal" — original SVG lotus-in-circle emblem + saffron border band | distinct from gold-rosette |

Logo: original inline SVG — a lotus over a pulse/heartbeat line inside a rounded shield.
No third-party logos (no Google/AWS/Shark Tank/company marks).

---

## B. Page map

```
/                         Home (hero, search, categories, featured, how-it-works, benefits, steps, FAQ, CTA)
/certifications           Directory (search + category filter + sort + cards)
/certifications/:slug     Certification landing (description, eligibility, assessment details, Start)
/assess/:slug/start       Candidate info + instructions/rules → begin
/assess/:attemptId        Assessment interface (timer, nav, mark-for-review, submit)
/assess/:attemptId/result Results & skill analysis
/certificates/:id         Certificate view (own, after login) + download PDF + share link
/verify                   Public verification (enter ID or open /verify?id=...)
/verify/:certificateId    QR destination → public verification result
/login, /register         Auth
/dashboard                User: profile, in-progress, completed, results, certificates, history
/admin                    Admin: overview/analytics
/admin/domains            Manage domains
/admin/certifications     Create/edit certifications
/admin/questions          Question bank per certification
/admin/attempts           Users & attempts review
/admin/certificates       Issue / revoke / verify
```

---

## C. User journeys

**Candidate**
1. Browse/search certifications → open detail → Start free assessment.
2. Register/login (or continue as guest→prompt to save) → enter name/details → read rules → begin.
3. Timed MCQ: navigate, answer/change, mark-for-review, progress bar, countdown; auto-submit at 0.
4. Confirm submit → server scores → results + domain-wise breakdown + recommendations + eligibility.
5. If eligible → certificate generated (unique ID + QR) → view/download PDF/share public link.

**Verifier (public, no login)**
- Open `/verify`, paste ID, or scan QR → `/verify/:id` → shows holder, title, number, org, issue
  date, status (valid/revoked/expired) or "not recognized".

**Admin**
- Login (admin role) → manage domains/certifications/questions → configure duration & scoring →
  review attempts/results → issue/revoke certificates → view analytics.

---

## D. Feature breakdown (mapped to spec)
- Directory: search, category filter, sort (popular/newest/A–Z), cards, detail pages. ✅
- Assessment engine: question banks, randomized selection, configurable duration, MCQ (+ true/false,
  multi-select extensible), configurable scoring, auto-eval objective, attempt tracking, duplicate-
  submission prevention, result generation. **Automated scoring only — no AI evaluation claimed.**
- Certificate engine: unique non-guessable ID (CUID/UUID + HMAC-signed payload), unique verify URL,
  QR → verify page, stored candidate/assessment snapshot, status valid/revoked/expired.
- Dashboards: user + admin with RBAC.

---

## E. Database architecture (PostgreSQL / Supabase)

```
profiles            id (uuid PK = auth.users), full_name, role ('candidate'|'admin'), created_at
domains             id, slug, name, description, icon, sort_order, is_active
certifications      id, domain_id FK, slug, title, short_desc, description, eligibility,
                    duration_sec, question_count, pass_score_pct, is_active, created_at
questions           id, certification_id FK, domain_id FK, topic, difficulty, qtype
                    ('mcq_single'|'mcq_multi'|'true_false'), body, explanation, is_active
question_options    id, question_id FK, label, is_correct, sort_order
attempts            id, user_id FK, certification_id FK, status
                    ('in_progress'|'submitted'|'expired'|'scored'), started_at, submitted_at,
                    duration_sec, seed, candidate_name, unique(user_id, certification_id, in_progress)
attempt_questions   id, attempt_id FK, question_id FK, position
attempt_answers     id, attempt_question_id FK, option_id FK, unique(attempt_question_id, option_id)
results             id, attempt_id FK unique, score_pct, correct_count, total_count, passed bool,
                    breakdown jsonb (per-topic), level text, created_at
certificates        id, certificate_no text unique (non-guessable), user_id FK, attempt_id FK unique,
                    certification_id FK, holder_name, title, score_pct, issue_date, expiry_date null,
                    status ('valid'|'revoked'|'expired'), verify_token, payload_sig, created_at
verification_logs   id, certificate_id FK, verified_at, verifier_ip, outcome
```

**RLS (Supabase)**
- `profiles`: user reads/updates own; admin reads all.
- `domains`, `certifications`, `questions`(without correct), `question_options`(without is_correct):
  public read of active rows. `is_correct` never exposed pre-submit (separate privileged view/RPC).
- `attempts`, `attempt_answers`, `results`: owner read own; insert via RPC; admin all.
- `certificates`: owner read own; **public read of verification projection** (no PII beyond holder
  name/title/number/dates/status) via `verify_certificate(cert_no)` security-definer RPC.
- Admin writes restricted to `role='admin'` via JWT claim / profiles check.

**Server-side scoring**: `submit_attempt(attempt_id)` security-definer function — recomputes score
from stored correct options, writes `results`, marks attempt scored, and (if passed) issues
certificate atomically. Prevents client tampering & duplicate submission (idempotent on status).

---

## F. Tech stack & modules
- Frontend: React 18 + TypeScript + Vite, Tailwind CSS, react-router, reusable components.
- Backend: Supabase (Auth, Postgres, RLS, RPC, Storage for PDFs) — **or local mock adapter** (below).
- PDF: `@react-pdf/renderer` (client) or server-side; QR: `qrcode`.
- Modular: `src/modules/{catalog,assessment,results,certificate,verify,dashboard,admin,auth,brand}`.

---

## G. Implementation plan (incremental, tested per stage)
1. Scaffold + brand theme + router + layout. ✅ build passes.
2. Catalog: domains/certifications data + Home + Directory + Detail. ✅ navigation/search/filter.
3. Auth + profile + RBAC guard. ✅ login/register/role.
4. Assessment engine + interface (timer/nav/review/submit). ✅ full attempt flow.
5. Results + skill analysis. ✅ scoring correct.
6. Certificate engine (ID, QR, PDF, verify). ✅ valid/invalid/revoked.
7. Dashboards (user + admin). ✅ permissions.
8. Acceptance test pass (12 journeys).

---

## H. Backend decision: both
The platform ships with a single `DataProvider` interface and two adapters:

- **LocalProvider** — fully self-contained (browser storage, seeded catalog, real scoring,
  certificate issuance, QR/PDF). Used by default so the demo runs with no external accounts.
  Every screen shows a "local demo backend" notice.
- **SupabaseProvider** — same interface over Supabase Auth + PostgREST + RPC. Activated with
  `VITE_DATA_BACKEND=supabase` plus URL/anon key.

`supabase/migrations/0001_init.sql` contains the PostgreSQL schema, indexes, RLS policies and
security-definer RPCs (`start_attempt`, `get_attempt_questions`, `save_answer`,
`toggle_mark_for_review`, `submit_attempt`, `verify_certificate`, `revoke_certificate`,
`admin_analytics`). Switching backends requires no page-level changes.

## I. Mocked vs real (honesty register)
| Feature | Status |
|---|---|
| Scoring | **Real, automated** (objective). Not AI. |
| AI evaluation | **Not implemented** — explicitly excluded. |
| Auth / DB / RLS | Real if Supabase configured; otherwise **clearly-labeled local mock** (in-browser). |
| Certificate issuance | Real within chosen backend; PDF generated client-side. |
| Payment/pricing | Out of scope (free assessments). |

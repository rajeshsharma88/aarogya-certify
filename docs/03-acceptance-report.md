# Acceptance Report — Aarogya India Certification Platform

Executed against the local build (Vite dev server, Chrome 157 via CDP).

## Automated results

| Suite | Result |
|---|---|
| Unit / integration (`npm run test`) | **13/13 passed** |
| Browser acceptance (`npm run e2e`) | **19/19 checks passed** |
| TypeScript build (`tsc -b` + `vite build`) | **clean** |
| Uncaught console errors during journeys | **none** |

## Journey coverage

| # | Acceptance criterion | Verification | Evidence |
|---|---|---|---|
| 1 | Browse and search certifications | Home renders; directory opens; search "nutrition" filters; counts update | `01-home.png`, `02-directory.png` |
| 2 | Open a certification details page | Card → `/certifications/:slug`; description, eligibility, assessment details render | `03-detail.png` |
| 3 | Start an assessment | Unauthenticated start redirects to login; registration returns to start; rules accepted → attempt created with timer | `04-start.png`, `05-assessment.png` |
| 4 | Complete and submit | All questions answered via UI; Review & submit → confirmation modal → submit | e2e step 4a/4b |
| 5 | Calculate and display result | Result page shows score, level, topic breakdown, strengths/improvements; unit test asserts 100% for all-correct and 0% for all-wrong | `06-result.png`, unit tests |
| 6 | Generate certificate for eligible candidate | 100% attempt issues exactly one certificate; ID matches `AIC-XXXX-XXXX-XXXX`; duplicate submit returns same result and no second certificate | `07-certificate.png`, unit tests |
| 7 | Download certificate as PDF | Download triggered; file written; magic bytes `%PDF-`; valid document | e2e step 7b (~7 KB) |
| 8 | Scan or open QR destination | QR encodes `${origin}/verify/:certificateNo`; navigation to that URL renders verification | `07-certificate.png`, `08-verify-valid.png` |
| 9 | Verify a valid certificate | Public verification shows holder, title, org, date, number, score, status **Valid** | `08-verify-valid.png` |
| 10 | Verify an invalid certificate | Unknown ID shows **No matching certificate** with guidance | `09-verify-invalid.png` |
| 11 | Revoke and confirm verification reflects it | Admin revoke → public verify shows **Certificate revoked** | `10-verify-revoked.png` |
| 12 | User vs administrator permissions | Candidate blocked from `/admin`; admin sign-in opens console with analytics | `11-admin.png` |

## Additional integrity checks asserted in unit tests

- Correct answers are absent from the attempt-question payload.
- Attempt creation is randomized and de-duplicated (one open attempt per user/certification).
- Answers are locked after submission.
- Certificate IDs are unique and match the non-guessable format.
- Verification is public and independent of session state.
- Admin analytics and catalog CRUD operate through the same provider interface.

## Not covered / known limits

- Supabase mode was not executed against a live project (no credentials provided); the adapter and
  SQL/RLS migration are included but unverified end-to-end.
- Email verification, password reset and multi-device session revocation are not implemented.
- PDF is generated client-side; no server-side signing of the PDF blob (certificate records are the
  source of truth and public verification is authoritative).
- Expiry is supported by schema and verification logic but no certification configures an expiry
  yet; the expired state is therefore not exercised by the e2e run.

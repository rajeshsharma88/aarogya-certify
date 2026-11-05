/**
 * End-to-end acceptance journeys against the running dev server, using the
 * already-running Chrome (CDP on 127.0.0.1:9222). Covers journeys 1–12.
 *
 *   npm run dev -- --port 5173 --strictPort   # terminal 1
 *   npm run e2e                              # terminal 2
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = path.resolve('docs/screenshots');
const DOWNLOADS = path.join(os.tmpdir(), 'aarogya-e2e-downloads');
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(DOWNLOADS, { recursive: true, force: true });
fs.mkdirSync(DOWNLOADS, { recursive: true });

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) throw new Error(`Failed: ${name}`);
}

const browser = await puppeteer.connect({
  browserURL: 'http://127.0.0.1:9222',
  defaultViewport: { width: 1280, height: 900 },
});
const page = await browser.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('favicon')) consoleErrors.push(m.text());
});

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

async function clickText(selector, text, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const handles = await page.$$(selector);
    for (const h of handles) {
      const t = await h.evaluate((el) => (el.textContent ?? '').trim());
      if (t.includes(text)) {
        await h.click();
        return;
      }
    }
    await sleep(100);
  }
  throw new Error(`No ${selector} containing "${text}"`);
}

async function waitText(text, timeout = 15000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const email = `e2e-${Date.now()}@example.com`;

try {
  // ---- 1. Homepage + browse + search -------------------------------------
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  await waitText('Prove your skill.');
  check('Journey 1a: homepage renders hero', true);
  await shot('01-home');

  await clickText('a', 'Explore certifications');
  await page.waitForFunction(() => location.pathname === '/certifications');
  await waitText('Certification directory');
  check('Journey 1b: directory opens', true);

  await page.type('#dir-search', 'nutrition');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('matching') && !text.includes('Loading…');
  });
  const directoryText = await page.evaluate(() => document.body.innerText);
  check('Journey 1c: search filters results', /nutrition/i.test(directoryText), 'found Nutrition entries');
  await shot('02-directory');

  // ---- 2. Certification detail ------------------------------------------
  const firstCard = await page.$('a[href^="/certifications/"]');
  await firstCard.click();
  await page.waitForFunction(() => /^\/certifications\/[^/]+$/.test(location.pathname));
  await waitText('Assessment details');
  check('Journey 2: certification detail page opens', true);
  await shot('03-detail');

  // ---- 3. Start assessment (auth gate → register) -----------------------
  await clickText('a', 'Start free assessment');
  await page.waitForFunction(() => location.pathname === '/login');
  await waitText('Sign in');
  check('Journey 3a: unauthenticated start redirects to login', true);

  await clickText('a', 'Create an account');
  await page.waitForFunction(() => location.pathname === '/register');
  await page.type('#name', 'E2E Candidate');
  await page.type('#remail', email);
  await page.type('#rpassword', 'password123');
  await clickText('button', 'Create account');
  await page.waitForFunction(() => location.pathname.endsWith('/start'), { timeout: 15000 });
  await waitText('Before you begin');
  check('Journey 3b: registration returns to assessment start', true);
  await shot('04-start');

  await page.click('#candidate-name', { clickCount: 3 });
  await page.type('#candidate-name', 'E2E Candidate');
  await page.click('input[type="checkbox"]');
  await clickText('button', 'Begin assessment');
  await page.waitForFunction(() => /^\/assess\/[0-9a-f-]{10,}$/.test(location.pathname), { timeout: 15000 });
  await page.waitForSelector('[role="timer"]');
  check('Journey 3c: assessment begins with timer', true);
  await shot('05-assessment');

  // ---- 4/5. Answer all questions and submit -----------------------------
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => {
      const opt = document.querySelector('fieldset input[type="radio"], fieldset input[type="checkbox"]');
      opt?.click();
    });
    const hasNext = await page.evaluate(() =>
      [...document.querySelectorAll('button')].some((b) => (b.textContent ?? '').includes('Next')),
    );
    if (hasNext) {
      await clickText('button', 'Next');
      await sleep(80);
    } else {
      await clickText('button', 'Review & submit');
      break;
    }
  }
  await waitText('Submit your assessment?');
  check('Journey 4a: submit confirmation shown', true);
  await clickText('button', 'Submit now');
  await page.waitForFunction(() => location.pathname.endsWith('/result'), { timeout: 20000 });
  await page.waitForFunction(
    () => document.body.innerText.includes('Assessment complete') || document.body.innerText.includes('Congratulations'),
    { timeout: 20000 },
  );
  const resultText = await page.evaluate(() => document.body.innerText);
  check('Journey 4b/5: result page shows score', /Skill breakdown/.test(resultText), 'breakdown rendered');
  await shot('06-result');

  // ---- 6. Guaranteed-pass attempt via dev provider hook ------------------
  const data = await page.evaluate(async () => {
    const p = window.__AC__;
    const me = await p.currentUser();
    const certs = await p.listCertifications();
    const cert = certs.find((c) => c.slug === 'nutrition-fundamentals');
    const attempt = await p.startAttempt(me.id, cert.id, me.fullName);
    const questions = await p.listQuestions(cert.id);
    const byId = new Map(questions.map((q) => [q.id, q]));
    for (const qid of attempt.questionIds) {
      const q = byId.get(qid);
      await p.saveAnswer(attempt.id, qid, q.options.filter((o) => o.isCorrect).map((o) => o.id));
    }
    const result = await p.submitAttempt(attempt.id);
    const certificate = await p.getCertificateByAttempt(attempt.id);
    return {
      scorePct: result.scorePct,
      passed: result.passed,
      certificate: { id: certificate.id, certificateNo: certificate.certificateNo, holderName: certificate.holderName },
    };
  });
  check('Journey 6: eligible attempt issues certificate', data.passed && data.scorePct === 100, `score ${data.scorePct}%`);
  check('Journey 6b: certificate ID is non-trivial', /^AIC-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(data.certificate.certificateNo), data.certificate.certificateNo);

  // ---- 7. Certificate page + PDF download -------------------------------
  await page.goto(`${BASE}/certificates/${data.certificate.certificateNo}`, { waitUntil: 'networkidle2' });
  await waitText('Download PDF certificate');
  const certText = await page.evaluate(() => document.body.innerText);
  check('Journey 7a: certificate page shows holder + ID', certText.includes('E2E Candidate') && certText.includes(data.certificate.certificateNo));
  await shot('07-certificate');

  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS, eventsEnabled: true });
  await clickText('button', 'Download PDF certificate');
  let pdfPath = null;
  for (let i = 0; i < 40 && !pdfPath; i++) {
    await sleep(500);
    const files = fs.readdirSync(DOWNLOADS).filter((f) => f.endsWith('.pdf'));
    if (files.length) pdfPath = path.join(DOWNLOADS, files[0]);
  }
  const pdfOk = pdfPath ? fs.readFileSync(pdfPath).subarray(0, 5).toString() === '%PDF-' : false;
  check('Journey 7b: PDF downloads and is a valid PDF', pdfOk, pdfPath ? `${(fs.statSync(pdfPath).size / 1024).toFixed(0)} KB` : 'no file');

  // ---- 8/9. Public verification (QR destination) ------------------------
  await page.goto(`${BASE}/verify/${data.certificate.certificateNo}`, { waitUntil: 'networkidle2' });
  await waitText('Certificate verified');
  const verifyText = await page.evaluate(() => document.body.innerText);
  check('Journey 8/9: valid certificate verifies publicly', verifyText.includes('E2E Candidate') && verifyText.includes('Aarogya India'));
  await shot('08-verify-valid');

  // ---- 10. Invalid certificate ------------------------------------------
  await page.goto(`${BASE}/verify/AIC-0000-0000-0000`, { waitUntil: 'networkidle2' });
  await waitText('No matching certificate');
  check('Journey 10: invalid certificate shows not-recognized state', true);
  await shot('09-verify-invalid');

  // ---- 11. Revocation reflected publicly --------------------------------
  await page.evaluate(async (id) => {
    await window.__AC__.revokeCertificate(id);
  }, data.certificate.id);
  await page.goto(`${BASE}/verify/${data.certificate.certificateNo}`, { waitUntil: 'networkidle2' });
  await waitText('Certificate revoked');
  check('Journey 11: revocation reflected in verification', true);
  await shot('10-verify-revoked');

  // ---- 12. RBAC ---------------------------------------------------------
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await waitText('Administrator access required');
  check('Journey 12a: candidate blocked from admin', true);

  await page.evaluate(async () => {
    await window.__AC__.logout();
  });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('#email', 'admin@aarogya.in');
  await page.type('#password', 'Admin@12345');
  await clickText('button', 'Sign in');
  await page.waitForFunction(() => location.pathname === '/dashboard', { timeout: 15000 });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await waitText('Platform console');
  const adminText = await page.evaluate(() => document.body.innerText);
  check('Journey 12b: admin can open console', adminText.includes('Overview') && adminText.includes('Certificates'));
  await shot('11-admin');

  // ---- console health ---------------------------------------------------
  const noisy = consoleErrors.filter((e) => !/Download the React DevTools/.test(e));
  check('No uncaught console errors', noisy.length === 0, noisy.slice(0, 3).join(' | '));

  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed. Screenshots: ${OUT}`);
} catch (err) {
  await shot('99-failure');
  console.error('\nE2E failed:', err.message);
  console.error('Console errors:', consoleErrors.slice(0, 5));
  process.exitCode = 1;
} finally {
  await page.close();
  browser.disconnect();
}

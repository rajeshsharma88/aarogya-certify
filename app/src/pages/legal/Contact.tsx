import { LEGAL } from '../../brand/legal';
import { supportMailto } from '../../brand/contact';
import { BusinessDetails, Fact, LegalPage, Section } from './LegalLayout';

/**
 * Both Razorpay and Meta check that a real business can be reached from the
 * site: a named entity, a postal address, a working email and a telephone
 * number. A contact form alone does not satisfy either.
 */
export function Contact() {
  return (
    <LegalPage
      title="Contact Us"
      intro={`Questions about an assessment, a certificate or a payment — here is how to reach ${LEGAL.brandName}, and how quickly to expect an answer.`}
    >
      <Section heading="Registered business">
        <BusinessDetails />
      </Section>

      <Section heading="Email us">
        <p>
          <a className="font-medium text-brand-700 hover:underline" href={supportMailto()}>
            {LEGAL.supportEmail}
          </a>{' '}
          reaches us for everything: assessments, certificates, payments, refunds and data
          requests.
        </p>
        <p className="text-sm text-slate-600">
          Support hours: <Fact value={LEGAL.supportHours} label="support hours" />. We aim to reply
          within 2 working days.
        </p>
      </Section>

      <Section heading="Quicker answers">
        <p className="text-sm">
          Some things you can do without waiting for us:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>
            <strong>Check a certificate:</strong> use the public verification page — no account
            needed.
          </li>
          <li>
            <strong>Lost your password:</strong> use &ldquo;Forgot your password?&rdquo; on the
            sign-in page.
          </li>
          <li>
            <strong>Lost your certificate file:</strong> sign in and download it again from your
            dashboard, as many times as you like.
          </li>
          <li>
            <strong>Payment taken but no certificate:</strong> email us the Razorpay payment ID —
            do not pay again.
          </li>
        </ul>
      </Section>

      <Section heading="Grievance officer">
        <p className="text-sm">
          For complaints that we have not resolved to your satisfaction, as required by the
          Consumer Protection (E-Commerce) Rules, 2020 and the Digital Personal Data Protection
          Act, 2023:
        </p>
        <dl className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-ink">Name:</dt>
            <dd><Fact value={LEGAL.grievanceOfficerName} label="grievance officer name" /></dd>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2">
            <dt className="font-semibold text-ink">Email:</dt>
            <dd><Fact value={LEGAL.grievanceOfficerEmail} label="grievance officer email" /></dd>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2">
            <dt className="font-semibold text-ink">Phone:</dt>
            <dd><Fact value={LEGAL.phone} label="contact phone number" /></dd>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2">
            <dt className="font-semibold text-ink">Address:</dt>
            <dd><Fact value={LEGAL.registeredAddress} label="registered address" /></dd>
          </div>
        </dl>
        <p className="text-sm text-slate-600">
          We acknowledge grievances within 48 hours and aim to resolve them within 30 days.
        </p>
      </Section>
    </LegalPage>
  );
}

import { LEGAL } from '../../brand/legal';
import { BusinessDetails, Bullets, Fact, LegalPage, Section } from './LegalLayout';

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what personal data ${LEGAL.brandName} collects, why, and what you can do about it. It covers this website and the certificates issued through it.`}
    >
      <Section heading="Who controls your data">
        <BusinessDetails />
        <p>
          We are the data fiduciary for the personal data described here, under India&apos;s Digital
          Personal Data Protection Act, 2023.
        </p>
      </Section>

      <Section heading="What we collect">
        <Bullets
          items={[
            <><strong>Account details:</strong> your name and email address, and a password stored only as a salted hash — we never hold your password itself.</>,
            <><strong>Certificate details:</strong> the name you choose to appear on the certificate, the assessment taken, your score, and the issue date.</>,
            <><strong>Assessment activity:</strong> your answers, timing, and the result, which we need to score the assessment and to investigate disputes.</>,
            <><strong>Payment records:</strong> the amount, currency, order and payment identifiers, and status. We do not receive or store your card number, UPI PIN or bank credentials — those go directly to Razorpay.</>,
            <><strong>Verification logs:</strong> when a certificate number is checked on the public verification page, so we can detect abuse.</>,
            <><strong>Technical data:</strong> standard server logs, including IP address, needed to run and secure the service.</>,
          ]}
        />
      </Section>

      <Section heading="Why we use it, and on what basis">
        <Bullets
          items={[
            'To provide the service you asked for: creating your account, running the assessment, scoring it, and issuing your certificate.',
            'To take payment for a certificate and issue a receipt.',
            'To make certificates publicly verifiable — this is the core purpose of the product.',
            'To contact you about your account, such as confirming your email address or resetting your password.',
            'To keep records we are required by law to keep, including tax and accounting records.',
            'To detect and prevent fraud, cheating and abuse of the service.',
          ]}
        />
      </Section>

      <Section heading="What is public">
        {/* Candidates should understand this before they pay, not after. */}
        <p>
          A certificate is designed to be checked by other people. Anyone holding a certificate
          number can see, on the verification page, the holder&apos;s name as printed, the assessment
          title, the score, the issue date and whether the certificate is valid or revoked.
        </p>
        <p>
          Your email address, password, payment details and answer-level assessment data are never
          shown publicly.
        </p>
      </Section>

      <Section heading="Who we share it with">
        <Bullets
          items={[
            <><strong>Razorpay</strong>, our payment gateway, to process payments. They act as their own controller for payment data under their privacy policy.</>,
            <>Our <strong>hosting and email providers</strong>, who process data on our instructions to run the website and send transactional email.</>,
            <>Authorities, where we are legally required to disclose.</>,
          ]}
        />
        <p>We do not sell your personal data, and we do not share it with advertisers.</p>
      </Section>

      <Section heading="Where it is stored">
        <p>
          Our application and database run on servers we control. Some processors, such as our
          email provider, may process data outside India. Where that happens we rely on the
          provider&apos;s contractual commitments to protect it.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <Bullets
          items={[
            'Certificate records are kept indefinitely, because a certificate must remain verifiable for as long as someone may rely on it. This is the point of the product.',
            'Assessment answers are kept while your account is open, and for a reasonable period afterwards to resolve disputes.',
            'Payment and tax records are kept for as long as Indian tax law requires.',
            'Server logs are kept for a short operational period.',
          ]}
        />
      </Section>

      <Section heading="Your rights">
        <p>Under the DPDP Act you may ask us to:</p>
        <Bullets
          items={[
            'Give you a copy of the personal data we hold about you.',
            'Correct data that is inaccurate or incomplete.',
            'Erase data where we no longer need it.',
            'Nominate someone to exercise your rights if you cannot.',
          ]}
        />
        <p>
          One limit is worth being clear about: we will not erase an issued certificate record on
          request while it remains verifiable, because doing so would let someone quietly withdraw
          a credential that others may have relied on. We can close your account and remove your
          other data.
        </p>
        <p>
          To make a request, email{' '}
          <a className="font-medium text-brand-700 hover:underline" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          . We may need to verify your identity first.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We use only what the site needs to work: your sign-in session and your language choice,
          stored in your browser. We do not use advertising or cross-site tracking cookies on this
          website. If we add analytics or advertising pixels later, we will update this policy and
          ask for consent where required.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Traffic is served over HTTPS, passwords are stored only as salted hashes, access to
          records is restricted at the database level so one candidate cannot read another&apos;s, and
          payment credentials never reach our servers. No system is perfectly secure; if a breach
          affects your data we will notify you and the Data Protection Board as the law requires.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          The service is intended for adults. We do not knowingly collect data from children under
          18 without verifiable parental consent. If you believe a child has registered, contact us
          and we will remove the account.
        </p>
      </Section>

      <Section heading="Grievance officer">
        <p>
          If you are unhappy with how we have handled your data, contact our grievance officer:
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
            <dt className="font-semibold text-ink">Address:</dt>
            <dd><Fact value={LEGAL.registeredAddress} label="registered address" /></dd>
          </div>
        </dl>
        <p>
          We aim to acknowledge grievances within 48 hours and resolve them within 30 days. You may
          also complain to the Data Protection Board of India.
        </p>
      </Section>
    </LegalPage>
  );
}

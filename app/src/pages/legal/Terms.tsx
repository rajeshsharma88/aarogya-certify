import { Link } from 'react-router-dom';
import { LEGAL } from '../../brand/legal';
import { BusinessDetails, Bullets, Fact, LegalPage, Section } from './LegalLayout';

export function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms govern your use of ${LEGAL.brandName} and the assessments and digital certificates offered on this website. By creating an account or taking an assessment, you agree to them.`}
    >
      <Section heading="Who you are contracting with">
        <BusinessDetails />
      </Section>

      <Section heading="What we provide">
        <p>
          We provide online, objectively scored skill assessments in Ayurveda, and a digital
          certificate to candidates who meet the pass mark. Each certificate carries a unique
          certificate number and a public verification page so a third party can confirm it.
        </p>
        <Bullets
          items={[
            'Taking an assessment is free.',
            <>
              A certificate costs ₹{LEGAL.certificatePriceInr} and is issued only to candidates who
              reach the pass mark.
            </>,
            'Assessments are scored automatically by our server against a stored answer key. Scoring is rule-based, not an AI judgement.',
          ]}
        />
      </Section>

      <Section heading="What a certificate is, and is not">
        {/* This section is deliberately explicit. Overstating what the credential
            is would be a misrepresentation to candidates and a problem in both
            Razorpay and Meta review. */}
        <p>
          A certificate from {LEGAL.brandName} records that you passed our assessment on a given
          date. That is all it certifies.
        </p>
        <Bullets
          items={[
            'It is not a government, university or statutory qualification.',
            'It is not a licence or registration to practise Ayurveda, medicine or any other regulated profession, and it does not entitle you to treat patients.',
            'It is not accredited by any regulatory body unless we say so explicitly and name that body.',
            'It does not guarantee employment, admission, or any particular outcome.',
          ]}
        />
        <p>
          We certify in Ayurveda only. We do not offer assessments in subjects we are not
          authorised to certify.
        </p>
      </Section>

      <Section heading="Your account">
        <Bullets
          items={[
            'You must give accurate details. The name you enter is printed on the certificate, and we will not alter a certificate to show a name you did not earn it under.',
            'You are responsible for keeping your password confidential and for activity under your account.',
            'One person, one account. Accounts may not be shared, sold or transferred.',
            'You must be at least 18, or have the consent of a parent or guardian.',
          ]}
        />
      </Section>

      <Section heading="Assessment conduct">
        <p>
          Assessments are timed and must be your own unaided work. The following will void a result
          and may lead to a certificate being revoked and an account closed:
        </p>
        <Bullets
          items={[
            'Having another person take the assessment for you.',
            'Copying, recording, republishing or sharing assessment questions.',
            'Using automated tools to answer, or attempting to read answers from our systems.',
            'Interfering with scoring, verification, or any part of the service.',
          ]}
        />
        <p>
          Where a result is voided for conduct, the certificate fee is not refunded. See the{' '}
          <Link className="text-brand-700 hover:underline" to="/refund-policy">
            refund policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="Payment">
        <p>
          Certificate fees are shown in Indian Rupees on the{' '}
          <Link className="text-brand-700 hover:underline" to="/pricing">
            pricing page
          </Link>{' '}
          and are inclusive of applicable taxes unless stated otherwise. Payments are processed by
          Razorpay; we do not receive or store your card details. Your certificate is released once
          Razorpay confirms the payment to us.
        </p>
      </Section>

      <Section heading="Revocation">
        <p>
          We may revoke a certificate if it was obtained through misconduct, if the result was
          issued in error, or if a payment is reversed or charged back. Revocation is reflected
          immediately on the public verification page, so anyone checking the certificate sees its
          current status. We will tell you at the email on your account when we revoke a
          certificate, and why.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          We aim to keep the service available but do not guarantee uninterrupted access. We may
          suspend it for maintenance, and we may change or withdraw assessments. Certificates
          already issued remain verifiable.
        </p>
      </Section>

      <Section heading="Intellectual property">
        <p>
          Assessment content, question banks, branding and the website are owned by{' '}
          <Fact value={LEGAL.legalEntityName} label="registered entity name" /> and may not be
          copied, resold or used to build a competing assessment without written permission. Your
          certificate remains yours to display and share.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the extent permitted by law, our total liability to you for any claim relating to the
          service is limited to the amount you paid us in the twelve months before the claim. We
          are not liable for indirect or consequential loss, including loss of employment,
          earnings or opportunity. Nothing here limits liability that cannot be limited by law,
          including for fraud.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of India, and the courts at{' '}
          <Fact value={LEGAL.jurisdiction} label="city and state for jurisdiction" /> have exclusive
          jurisdiction.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms. The date at the top shows when they last changed. Material
          changes will be notified by email to registered candidates. Continuing to use the service
          after a change means you accept the updated terms.
        </p>
      </Section>
    </LegalPage>
  );
}

import { Link } from 'react-router-dom';
import { LEGAL } from '../../brand/legal';
import { Bullets, Fact, LegalPage, Section } from './LegalLayout';

export function RefundPolicy() {
  return (
    <LegalPage
      title="Refunds & Cancellation Policy"
      intro={`How refunds work for certificate purchases from ${LEGAL.brandName}. Razorpay requires us to publish this, and we would rather you knew the terms before paying than after.`}
    >
      <Section heading="What you are paying for">
        <p>
          Taking an assessment is free. The only paid item is the digital certificate, at ₹
          {LEGAL.certificatePriceInr}, which you can buy after you pass. There is no subscription
          and no recurring charge, so there is nothing to cancel.
        </p>
      </Section>

      <Section heading="When we refund in full">
        <Bullets
          items={[
            'You were charged more than once for the same certificate.',
            'You were charged but no certificate was released to you.',
            'A technical fault on our side made the certificate unusable and we cannot fix it.',
            'You were charged after we had already issued the certificate free of charge.',
          ]}
        />
        <p>
          In these cases you do not need to argue the point — tell us what happened and we will
          refund it.
        </p>
      </Section>

      <Section heading="When we do not refund">
        {/* Stated plainly rather than buried: a digital certificate cannot be
            returned once downloaded, and the assessment that earns it is free,
            so the buyer knows the outcome before paying. */}
        <Bullets
          items={[
            'You passed, bought the certificate, and then changed your mind. The certificate is a digital item delivered immediately, and you knew your result before paying.',
            'You are unhappy with your score. The assessment is free, you see your result before paying, and you may retake it.',
            'The certificate did not produce the employment, admission or recognition you hoped for. We make no such promise — see the Terms.',
            'Your result was voided, or the certificate revoked, because of assessment misconduct.',
          ]}
        />
      </Section>

      <Section heading="How to request a refund">
        <p>
          Email{' '}
          <a className="font-medium text-brand-700 hover:underline" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{' '}
          from the address on your account, within <strong>7 days</strong> of the payment, with:
        </p>
        <Bullets
          items={[
            'your certificate number, if one was issued;',
            'the Razorpay payment ID from your receipt;',
            'a short description of what went wrong.',
          ]}
        />
      </Section>

      <Section heading="How long it takes">
        <Bullets
          items={[
            'We acknowledge refund requests within 2 working days.',
            'We decide within 7 working days of receiving the details above.',
            'Approved refunds are sent back through Razorpay to the original payment method. Banks typically take a further 5–7 working days to show the credit.',
          ]}
        />
        <p>
          We cannot refund to a different account or method — Razorpay returns the money the way it
          came in.
        </p>
      </Section>

      <Section heading="What happens to the certificate">
        <p>
          A refunded certificate is revoked, and its public verification page shows it as revoked
          from that point. You should not continue to present a certificate you have been refunded
          for.
        </p>
      </Section>

      <Section heading="Failed and pending payments">
        <p>
          If a payment fails, nothing is charged and no certificate is issued — you can simply try
          again. If money has left your account but the certificate was not released, do not pay a
          second time: contact us with the payment ID and we will either release the certificate or
          refund you. Occasionally a bank authorises a payment but does not settle it; those
          amounts are released by the bank automatically, usually within 5–7 working days.
        </p>
      </Section>

      <Section heading="Chargebacks">
        <p>
          If you dispute a payment with your bank rather than contacting us, the associated
          certificate is revoked while the dispute is open. We would much rather resolve it
          directly and faster.
        </p>
      </Section>

      <Section heading="Grievances">
        <p>
          If you are not satisfied with our decision, escalate to{' '}
          <Fact value={LEGAL.grievanceOfficerName} label="grievance officer name" /> at{' '}
          <Fact value={LEGAL.grievanceOfficerEmail} label="grievance officer email" />. See also our{' '}
          <Link className="text-brand-700 hover:underline" to="/contact">
            contact page
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}

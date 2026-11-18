import { Link } from 'react-router-dom';
import { LEGAL } from '../../brand/legal';
import { Bullets, LegalPage, Section } from './LegalLayout';

/**
 * Razorpay's onboarding checklist asks every merchant for a shipping or
 * delivery policy, including merchants who ship nothing. Saying plainly that
 * delivery is electronic and instant is what satisfies it — an empty page, or
 * a copied physical-goods policy promising couriers, does not.
 */
export function DeliveryPolicy() {
  return (
    <LegalPage
      title="Delivery Policy"
      intro={`${LEGAL.brandName} sells one thing: a digital certificate. Nothing is physically shipped, so this page explains how and when that certificate reaches you.`}
    >
      <Section heading="Nothing is shipped">
        <p>
          We do not ship physical goods. There are no couriers, no shipping charges, and no
          delivery addresses to provide. We do not currently offer printed or framed certificates.
        </p>
      </Section>

      <Section heading="How your certificate is delivered">
        <Bullets
          items={[
            'Pass the assessment. Your result and certificate record are created immediately, before any payment.',
            `Pay ₹${LEGAL.certificatePriceInr} through Razorpay.`,
            'As soon as Razorpay confirms the payment to us, the download is released on your certificate page.',
            'You can download the PDF from your dashboard at any time afterwards, as often as you need.',
          ]}
        />
      </Section>

      <Section heading="Delivery time">
        <p>
          Delivery is immediate and automatic — normally within seconds of payment confirmation.
          There is no dispatch window and no waiting period.
        </p>
        <p>
          Very occasionally a bank takes longer to confirm a payment. If your download has not been
          released within <strong>30 minutes</strong>, contact us with your Razorpay payment ID and
          we will release it manually. Do not pay a second time.
        </p>
      </Section>

      <Section heading="Where to find it afterwards">
        <Bullets
          items={[
            <>Sign in and open <strong>My Dashboard</strong> to see every certificate on your account.</>,
            'Each certificate has a permanent public verification page you can share with an employer, carrying its unique certificate number and a QR code.',
            'Losing the downloaded file costs nothing — sign in and download it again.',
          ]}
        />
      </Section>

      <Section heading="If something goes wrong">
        <p>
          If you were charged and the certificate was not released, we will either release it or
          refund you in full. See the{' '}
          <Link className="text-brand-700 hover:underline" to="/refund-policy">
            refunds policy
          </Link>{' '}
          or write to{' '}
          <a className="font-medium text-brand-700 hover:underline" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}

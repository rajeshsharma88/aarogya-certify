import { Link } from 'react-router-dom';
import { LEGAL } from '../../brand/legal';
import { Bullets, LegalPage, Section } from './LegalLayout';

/**
 * Razorpay requires a page stating clearly what is sold and at what price, in
 * INR. Meta's review looks for the same thing when an ad promises a price.
 * The figure here must match CERTIFICATE_PRICE_PAISE on the server, which is
 * what a candidate is actually charged.
 */
export function Pricing() {
  return (
    <LegalPage
      title="Pricing"
      intro="What we charge, in full. There is no subscription, no renewal fee and no charge for taking an assessment."
    >
      <Section heading="Assessments — free">
        <p>
          Every assessment on {LEGAL.brandName} is free to take. You see your score and a
          topic-by-topic breakdown of where you stand whether you pass or not, and you can retake
          an assessment when you are ready. No card details are needed to begin.
        </p>
      </Section>

      <Section heading={`Digital certificate — ₹${LEGAL.certificatePriceInr}`}>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <p className="font-display text-3xl font-semibold text-brand-900">
            ₹{LEGAL.certificatePriceInr}
          </p>
          <p className="mt-1 text-sm text-brand-900">one-time, per certificate</p>
        </div>
        <p>You pay only if you pass and choose to take the certificate. It includes:</p>
        <Bullets
          items={[
            'A downloadable PDF certificate with your name, the assessment, your score and the issue date.',
            'A unique certificate number that cannot be guessed.',
            'A permanent public verification page, with a QR code, that anyone can check without signing in.',
            'Unlimited re-downloads from your dashboard.',
          ]}
        />
      </Section>

      <Section heading="Taxes">
        <p>
          Prices are in Indian Rupees and include applicable taxes unless stated otherwise at
          checkout. Your Razorpay receipt is your proof of payment.
        </p>
      </Section>

      <Section heading="How to pay">
        <p>
          Payment is handled by Razorpay, which supports UPI, cards, net banking and wallets. We do
          not see or store your card details.
        </p>
      </Section>

      <Section heading="What the price does not include">
        {/* Repeating the limits here, where someone is deciding whether to pay,
            rather than only in the Terms where they are less likely to look. */}
        <Bullets
          items={[
            'Printed or posted certificates — everything is digital.',
            'Any government, university or statutory qualification. This is a skill assessment certificate.',
            'Any licence or registration to practise Ayurveda or any regulated profession.',
            'Any guarantee of employment, admission or recognition by a third party.',
          ]}
        />
      </Section>

      <Section heading="Changes to pricing">
        <p>
          We may change the price. The price shown at the moment you pay is the price you are
          charged, and a change never affects a certificate you have already bought.
        </p>
        <p>
          See also the{' '}
          <Link className="text-brand-700 hover:underline" to="/refund-policy">
            refunds policy
          </Link>{' '}
          and{' '}
          <Link className="text-brand-700 hover:underline" to="/delivery-policy">
            delivery policy
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}

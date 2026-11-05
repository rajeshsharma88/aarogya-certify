import { Link } from 'react-router-dom';
import { provider } from '../data';
import { useAsync } from '../hooks/useAsync';
import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../types';

/**
 * Sales landing page for the Panchkarma Therapy Fundamentals assessment.
 *
 * Assessment facts (duration, question count, pass mark) are read from the
 * catalog so this page cannot drift from what the assessment actually does.
 * FACTS below is only a fallback, so a marketing visitor still gets a usable
 * page if the catalog request fails.
 *
 * Copy lives in the page-scoped COPY dictionary rather than the global
 * `Translations` interface, which is for shared UI chrome. COPY is typed as
 * Record<Language, Copy>, so omitting a Hindi string is a compile error.
 * Interpolated strings are functions, because Hindi word order differs and
 * concatenating fragments would produce broken grammar.
 */
const SLUG = 'panchkarma-therapy';
const CERTIFICATE_PRICE = '₹299';

const FACTS = { minutes: 7, questions: 10, passScorePct: 60 };

/* ────────────────────────── PLACEHOLDER CONTENT ──────────────────────────
 * Nothing in the stats, testimonial or partner blocks is a real figure, quote
 * or partner. Each renders with a visible "Placeholder" ribbon so it cannot
 * ship unnoticed as a real claim.
 *
 * To fill in: replace the values in COPY (both languages) and remove the
 * ribbon. To hide every placeholder section until you have real data, set
 * SHOW_PLACEHOLDERS to false.
 * ------------------------------------------------------------------------ */
const SHOW_PLACEHOLDERS = true;
const STAT_VALUES = ['—', '—', '—'];
const PARTNER_SLOT_COUNT = 4;
/* ──────────────────────── END PLACEHOLDER CONTENT ─────────────────────── */

interface Pair {
  title: string;
  body: string;
}

interface Copy {
  chip: string;
  h1a: string;
  h1b: string;
  sub: (minutes: number, price: string) => string;
  ctaPrimary: string;
  ctaSecondary: string;
  reassure: string;
  facts: (minutes: number, questions: number, pass: number) => [string, string][];

  phFigures: string;
  phQuotes: string;
  phPartners: string;
  statLabels: [string, string, string];

  syllabusEyebrow: string;
  syllabusTitle: string;
  syllabusNote: string;
  syllabus: (Pair & { icon: string })[];

  stepsEyebrow: string;
  stepsTitle: (minutes: number) => string;
  steps: Pair[];

  receiveEyebrow: string;
  receiveTitle: string;
  receiveIntro: string;
  receiveBullets: Pair[];
  certOrg: string;
  certHeading: string;
  certAwardedTo: string;
  certName: string;
  certForPassing: string;
  certTitle: string;
  certIdLabel: string;
  certCaption: string;

  pricingEyebrow: string;
  pricingTitle: string;
  freeTitle: string;
  freePrice: string;
  freeFeatures: (minutes: number, questions: number) => string[];
  freeCta: string;
  paidBadge: string;
  paidTitle: string;
  paidSuffix: string;
  paidFeatures: string[];
  paidCta: string;
  paidNote: string;
  pricingFootnote: string;

  audienceEyebrow: string;
  audienceTitle: string;
  audience: Pair[];

  testimonialsTitle: string;
  testimonialQuote: string;
  testimonialName: string;
  testimonialRole: string;
  partnersLabel: string;
  logoSlot: string;

  faqEyebrow: string;
  faqTitle: string;
  faqs: (price: string, pass: number) => { q: string; a: string }[];

  closingTitle: string;
  closingSub: (minutes: number, questions: number) => string;
  closingSyllabus: string;
  honestLabel: string;
  honestBody: string;
}

const COPY: Record<Language, Copy> = {
  en: {
    chip: '🌿 Ayurveda · Panchkarma Therapy',
    h1a: 'Prove you know Panchkarma.',
    h1b: 'Get a certificate anyone can verify.',
    sub: (m, price) =>
      `A ${m}-minute objective assessment across the five classical purification therapies — free to take, scored instantly, with a topic-by-topic breakdown of where you stand. Pass, and issue a certificate with a public verification link for ${price}.`,
    ctaPrimary: 'Start the free assessment',
    ctaSecondary: 'Verify a certificate',
    reassure: 'No card details to begin · You only pay if you pass and want the certificate',
    facts: (m, q, p) => [
      [`${m} min`, 'Timed paper'],
      [`${q}`, 'Questions'],
      [`${p}%`, 'Pass mark'],
      ['Instant', 'Result'],
    ],

    phFigures: 'swap in real figures, or set SHOW_PLACEHOLDERS to false',
    phQuotes: 'real attributed quotes only',
    phPartners: 'only organisations that have actually partnered',
    statLabels: ['Therapists assessed', 'Certificates issued', 'Clinics hiring'],

    syllabusEyebrow: 'What you are assessed on',
    syllabusTitle: 'Four areas, drawn from classical practice',
    syllabusNote:
      'Questions are selected at random from a larger bank, so two candidates rarely see the same paper.',
    syllabus: [
      {
        icon: '🌬️',
        title: 'Vata Therapies',
        body: 'Basti (medicated enema) protocols, oleation and Abhyanga, and how Vata-predominant presentations change the order and duration of treatment.',
      },
      {
        icon: '🔥',
        title: 'Pitta Therapies',
        body: 'Virechana (therapeutic purgation), cooling interventions, and recognising when a Pitta-dominant patient should not proceed to a purificatory step.',
      },
      {
        icon: '💧',
        title: 'Kapha Therapies',
        body: 'Vamana (therapeutic emesis) and Nasya, their classical indications, preparation sequence, and the signs of an adequate versus excessive response.',
      },
      {
        icon: '🌿',
        title: 'Post-Therapy Care',
        body: 'Samsarjana Krama — the graded return to normal diet — plus rest, follow-up scheduling, and the contraindications that make aftercare non-negotiable.',
      },
    ],

    stepsEyebrow: 'How it works',
    stepsTitle: (m) => `Three steps, about ${m} minutes`,
    steps: [
      {
        title: 'Start the free assessment',
        body: 'No payment and no card details. Enter the name you want printed on the certificate and accept the assessment rules.',
      },
      {
        title: 'Answer the questions',
        body: 'A timed, objective multiple-choice paper drawn from a larger question bank. Navigate freely, change answers, and mark questions for review.',
      },
      {
        title: 'See your breakdown, then decide',
        body: 'You get a topic-by-topic score with strengths and improvement areas either way. If you pass, the certificate is there to unlock.',
      },
    ],

    receiveEyebrow: 'What you receive',
    receiveTitle: 'A credential you can prove, not just claim',
    receiveIntro:
      'Screenshots prove nothing. Every certificate issued here resolves to a public page that an employer, clinic or training body can check for themselves in seconds.',
    receiveBullets: [
      { title: 'Unique certificate ID', body: 'A tamper-evident identifier in the format AIC-XXXX-XXXX-XXXX, unique to your certificate.' },
      { title: 'QR code + public link', body: 'Opens the verification page directly. No account, no login, no app.' },
      { title: 'Print-ready PDF', body: 'Download immediately after issuing, with your name as you entered it.' },
      { title: 'Revocation-aware', body: 'If a certificate is ever revoked, verification reflects that straight away.' },
      { title: 'Topic-level score', body: 'Your breakdown by therapy area, so the credential carries detail, not just a pass.' },
    ],
    certOrg: 'Aarogya India',
    certHeading: 'Certificate of Achievement',
    certAwardedTo: 'Awarded to',
    certName: 'Your Name Here',
    certForPassing: 'For passing',
    certTitle: 'Panchkarma Therapy Fundamentals',
    certIdLabel: 'Certificate ID',
    certCaption: 'Representative layout. Your issued certificate carries a real ID and working QR code.',

    pricingEyebrow: 'Pricing',
    pricingTitle: 'Take it free. Pay only for the certificate.',
    freeTitle: 'The assessment',
    freePrice: 'Free',
    freeFeatures: (m, q) => [
      `${q} questions, ${m} minutes`,
      'Instant objective scoring',
      'Full topic-by-topic breakdown',
      'Strengths and improvement areas',
      'Retake when you are ready',
    ],
    freeCta: 'Start free',
    paidBadge: 'On passing',
    paidTitle: 'The certificate',
    paidSuffix: 'one-time',
    paidFeatures: [
      'Print-ready PDF certificate',
      'Unique ID and QR code',
      'Permanent public verification page',
      'Shareable link for employers',
      'GST invoice issued',
    ],
    paidCta: 'Start the assessment',
    paidNote: 'Charged only after you pass and choose to issue.',
    pricingFootnote:
      'Prices in INR, inclusive of applicable taxes shown at checkout. No subscription and no renewal fee — your certificate stays verifiable unless revoked by the issuer.',

    audienceEyebrow: 'Who it is for',
    audienceTitle: 'Built for people who already do the work',
    audience: [
      { title: 'Panchkarma technicians', body: 'Evidence of your therapy knowledge for clinic hiring conversations.' },
      { title: 'Ayurveda students', body: 'A checkpoint on fundamentals before exams or placements.' },
      { title: 'Wellness and spa staff', body: 'Show that your Panchkarma knowledge is tested, not assumed.' },
      { title: 'Clinic owners', body: 'A consistent, verifiable baseline when screening therapists.' },
    ],

    testimonialsTitle: 'What candidates say',
    testimonialQuote: 'Testimonial placeholder — replace with a real, attributed quote.',
    testimonialName: 'Name',
    testimonialRole: 'Role, Clinic',
    partnersLabel: 'Recognised by',
    logoSlot: 'Logo slot',

    faqEyebrow: 'FAQ',
    faqTitle: 'Straight answers',
    faqs: (price, pass) => [
      {
        q: 'Is the assessment really free?',
        a: `Yes. Taking the Panchkarma Therapy assessment costs nothing and needs no card details. You see your full score breakdown free, whether you pass or not. The ${price} charge is only to issue the certificate once you have passed.`,
      },
      {
        q: 'What exactly am I paying for?',
        a: `${price} issues your certificate: a downloadable PDF with a unique certificate ID, a QR code, and a permanent public verification page anyone can check without logging in.`,
      },
      {
        q: 'How is it scored?',
        a: 'Objective questions are scored automatically against a stored answer key. This is rule-based automated scoring — not an AI model, and not a human examiner.',
      },
      {
        q: 'What if I do not pass?',
        a: `You still get the full topic breakdown showing where you fell short, and you can retake the assessment when you are ready. You are charged nothing unless you pass and choose to issue the certificate. The pass mark is ${pass}%.`,
      },
      {
        q: 'Can an employer verify my certificate?',
        a: 'Yes, and this is the point of it. Every certificate carries a unique ID and QR code resolving to a public verification page that confirms the holder, the title, the score and the issue date. No login needed. If a certificate is ever revoked, the page says so immediately.',
      },
      {
        q: 'Do I need an Ayurvedic qualification first?',
        a: 'No. The assessment is open to all learners and no prior credential is required, though a basic familiarity with Panchkarma concepts is recommended.',
      },
      {
        q: 'Is this a licence to practise?',
        a: 'No, and we will not pretend otherwise. This certifies that you passed an objective knowledge assessment on Panchkarma fundamentals. It is not a medical qualification, not a registration, and not a substitute for statutory licensing in your jurisdiction.',
      },
    ],

    closingTitle: 'Find out where you actually stand',
    closingSub: (m, q) => `${m} minutes, ${q} questions, no card details. You get your full breakdown either way.`,
    closingSyllabus: 'See full syllabus',
    honestLabel: 'Honest note:',
    honestBody:
      'this assessment uses rule-based automated scoring of objective questions — no AI evaluation is used or claimed. Passing certifies assessed knowledge of Panchkarma fundamentals. It is not a medical qualification, a registration, or a licence to practise.',
  },

  hi: {
    chip: '🌿 आयुर्वेद · पंचकर्म चिकित्सा',
    h1a: 'पंचकर्म का अपना ज्ञान सिद्ध करें।',
    h1b: 'ऐसा प्रमाणपत्र पाएँ जिसे कोई भी सत्यापित कर सके।',
    sub: (m, price) =>
      `पाँच शास्त्रीय शुद्धिकरण चिकित्सा पर ${m} मिनट का वस्तुनिष्ठ आकलन — देने के लिए नि:शुल्क, तुरंत मूल्यांकित, और विषयवार विश्लेषण के साथ कि आप कहाँ खड़े हैं। उत्तीर्ण होने पर ${price} में सार्वजनिक सत्यापन लिंक वाला प्रमाणपत्र जारी करें।`,
    ctaPrimary: 'नि:शुल्क आकलन शुरू करें',
    ctaSecondary: 'प्रमाणपत्र सत्यापित करें',
    reassure: 'शुरू करने के लिए कार्ड विवरण नहीं · भुगतान तभी जब आप उत्तीर्ण हों और प्रमाणपत्र चाहें',
    facts: (m, q, p) => [
      [`${m} मिनट`, 'समयबद्ध प्रश्नपत्र'],
      [`${q}`, 'प्रश्न'],
      [`${p}%`, 'उत्तीर्ण अंक'],
      ['तुरंत', 'परिणाम'],
    ],

    phFigures: 'वास्तविक आँकड़े भरें, या SHOW_PLACEHOLDERS को false करें',
    phQuotes: 'केवल वास्तविक, श्रेय-सहित उद्धरण',
    phPartners: 'केवल वे संस्थाएँ जिनसे वास्तव में साझेदारी है',
    statLabels: ['मूल्यांकित चिकित्सक', 'जारी प्रमाणपत्र', 'नियुक्ति करने वाले क्लिनिक'],

    syllabusEyebrow: 'आपका आकलन किस पर होगा',
    syllabusTitle: 'शास्त्रीय अभ्यास से लिए गए चार क्षेत्र',
    syllabusNote:
      'प्रश्न एक बड़े प्रश्न-संग्रह से यादृच्छिक रूप से चुने जाते हैं, इसलिए दो अभ्यर्थियों को शायद ही कभी एक जैसा प्रश्नपत्र मिलता है।',
    syllabus: [
      {
        icon: '🌬️',
        title: 'वात चिकित्सा',
        body: 'बस्ति (औषधीय एनिमा) की विधियाँ, स्नेहन और अभ्यंग, तथा वात-प्रधान स्थितियों में चिकित्सा का क्रम और अवधि किस प्रकार बदलती है।',
      },
      {
        icon: '🔥',
        title: 'पित्त चिकित्सा',
        body: 'विरेचन (चिकित्सकीय विरेचन), शीतल उपचार, और यह पहचानना कि पित्त-प्रधान रोगी को शुद्धिकरण चरण कब नहीं देना चाहिए।',
      },
      {
        icon: '💧',
        title: 'कफ चिकित्सा',
        body: 'वमन (चिकित्सकीय वमन) और नस्य, उनके शास्त्रीय संकेत, पूर्वकर्म का क्रम, तथा पर्याप्त और अत्यधिक प्रतिक्रिया के लक्षण।',
      },
      {
        icon: '🌿',
        title: 'चिकित्सा-पश्चात देखभाल',
        body: 'संसर्जन क्रम — सामान्य आहार की ओर क्रमिक वापसी — साथ ही विश्राम, अनुवर्ती कार्यक्रम, और वे निषेध जो पश्चात् देखभाल को अनिवार्य बनाते हैं।',
      },
    ],

    stepsEyebrow: 'यह कैसे काम करता है',
    stepsTitle: (m) => `तीन चरण, लगभग ${m} मिनट`,
    steps: [
      {
        title: 'नि:शुल्क आकलन शुरू करें',
        body: 'कोई भुगतान नहीं, कोई कार्ड विवरण नहीं। वह नाम दर्ज करें जो प्रमाणपत्र पर छपेगा और आकलन के नियम स्वीकार करें।',
      },
      {
        title: 'प्रश्नों के उत्तर दें',
        body: 'एक बड़े प्रश्न-संग्रह से लिया गया समयबद्ध, वस्तुनिष्ठ बहुविकल्पीय प्रश्नपत्र। आप स्वतंत्र रूप से आगे-पीछे जा सकते हैं, उत्तर बदल सकते हैं और प्रश्नों को पुनरावलोकन के लिए चिह्नित कर सकते हैं।',
      },
      {
        title: 'अपना विश्लेषण देखें, फिर निर्णय लें',
        body: 'उत्तीर्ण हों या न हों, आपको विषयवार अंक, सबल पक्ष और सुधार के क्षेत्र मिलते हैं। उत्तीर्ण होने पर प्रमाणपत्र जारी करने का विकल्प रहता है।',
      },
    ],

    receiveEyebrow: 'आपको क्या मिलता है',
    receiveTitle: 'ऐसी साख जिसे आप सिद्ध कर सकें, केवल दावा नहीं',
    receiveIntro:
      'स्क्रीनशॉट कुछ सिद्ध नहीं करते। यहाँ जारी हर प्रमाणपत्र एक सार्वजनिक पृष्ठ पर खुलता है, जिसे कोई नियोक्ता, क्लिनिक या प्रशिक्षण संस्था कुछ ही सेकंड में स्वयं जाँच सकती है।',
    receiveBullets: [
      { title: 'विशिष्ट प्रमाणपत्र आईडी', body: 'AIC-XXXX-XXXX-XXXX प्रारूप में छेड़छाड़-सूचक पहचानकर्ता, जो केवल आपके प्रमाणपत्र का है।' },
      { title: 'QR कोड और सार्वजनिक लिंक', body: 'सीधे सत्यापन पृष्ठ खोलता है। कोई खाता नहीं, कोई लॉगिन नहीं, कोई ऐप नहीं।' },
      { title: 'प्रिंट-योग्य PDF', body: 'जारी करते ही तुरंत डाउनलोड करें, आपके दर्ज किए गए नाम के साथ।' },
      { title: 'निरस्तीकरण-सजग', body: 'यदि कोई प्रमाणपत्र कभी निरस्त होता है, तो सत्यापन उसे तुरंत दर्शाता है।' },
      { title: 'विषयवार अंक', body: 'चिकित्सा-क्षेत्र के अनुसार आपका विश्लेषण, ताकि साख में केवल उत्तीर्णता नहीं, विवरण भी हो।' },
    ],
    certOrg: 'आरोग्य इंडिया',
    certHeading: 'उपलब्धि प्रमाणपत्र',
    certAwardedTo: 'प्रदान किया गया',
    certName: 'आपका नाम यहाँ',
    certForPassing: 'उत्तीर्ण करने हेतु',
    certTitle: 'पंचकर्म चिकित्सा मौलिकताएं',
    certIdLabel: 'प्रमाणपत्र आईडी',
    certCaption: 'प्रतीकात्मक प्रारूप। आपके जारी प्रमाणपत्र पर वास्तविक आईडी और कार्यशील QR कोड होगा।',

    pricingEyebrow: 'मूल्य',
    pricingTitle: 'आकलन नि:शुल्क। भुगतान केवल प्रमाणपत्र के लिए।',
    freeTitle: 'आकलन',
    freePrice: 'नि:शुल्क',
    freeFeatures: (m, q) => [
      `${q} प्रश्न, ${m} मिनट`,
      'तुरंत वस्तुनिष्ठ मूल्यांकन',
      'पूर्ण विषयवार विश्लेषण',
      'सबल पक्ष और सुधार के क्षेत्र',
      'तैयार होने पर पुनः प्रयास',
    ],
    freeCta: 'नि:शुल्क शुरू करें',
    paidBadge: 'उत्तीर्ण होने पर',
    paidTitle: 'प्रमाणपत्र',
    paidSuffix: 'एक बार',
    paidFeatures: [
      'प्रिंट-योग्य PDF प्रमाणपत्र',
      'विशिष्ट आईडी और QR कोड',
      'स्थायी सार्वजनिक सत्यापन पृष्ठ',
      'नियोक्ताओं के लिए साझा करने योग्य लिंक',
      'GST चालान जारी',
    ],
    paidCta: 'आकलन शुरू करें',
    paidNote: 'शुल्क तभी लिया जाता है जब आप उत्तीर्ण हों और जारी करना चुनें।',
    pricingFootnote:
      'मूल्य भारतीय रुपये में, चेकआउट पर दर्शाए गए लागू करों सहित। कोई सदस्यता या नवीनीकरण शुल्क नहीं — जारीकर्ता द्वारा निरस्त न किए जाने तक आपका प्रमाणपत्र सत्यापन-योग्य रहता है।',

    audienceEyebrow: 'यह किसके लिए है',
    audienceTitle: 'उनके लिए जो पहले से यह काम करते हैं',
    audience: [
      { title: 'पंचकर्म तकनीशियन', body: 'क्लिनिक में नियुक्ति की बातचीत के लिए आपके चिकित्सा-ज्ञान का प्रमाण।' },
      { title: 'आयुर्वेद विद्यार्थी', body: 'परीक्षा या प्लेसमेंट से पहले मौलिक ज्ञान की जाँच।' },
      { title: 'वेलनेस और स्पा कर्मी', body: 'दिखाएँ कि आपका पंचकर्म ज्ञान परखा गया है, केवल मान लिया नहीं गया।' },
      { title: 'क्लिनिक संचालक', body: 'चिकित्सकों के चयन के समय एक समान, सत्यापन-योग्य मानक।' },
    ],

    testimonialsTitle: 'अभ्यर्थी क्या कहते हैं',
    testimonialQuote: 'उद्धरण प्लेसहोल्डर — वास्तविक, श्रेय-सहित उद्धरण से बदलें।',
    testimonialName: 'नाम',
    testimonialRole: 'पद, क्लिनिक',
    partnersLabel: 'द्वारा मान्यता प्राप्त',
    logoSlot: 'लोगो स्थान',

    faqEyebrow: 'सामान्य प्रश्न',
    faqTitle: 'सीधे उत्तर',
    faqs: (price, pass) => [
      {
        q: 'क्या आकलन सचमुच नि:शुल्क है?',
        a: `हाँ। पंचकर्म चिकित्सा आकलन देने का कोई शुल्क नहीं है और कार्ड विवरण की आवश्यकता नहीं। आप उत्तीर्ण हों या न हों, अपना पूरा विषयवार विश्लेषण नि:शुल्क देखते हैं। ${price} का शुल्क केवल उत्तीर्ण होने के बाद प्रमाणपत्र जारी करने के लिए है।`,
      },
      {
        q: 'मैं वास्तव में किसके लिए भुगतान कर रहा हूँ?',
        a: `${price} में आपका प्रमाणपत्र जारी होता है: एक डाउनलोड-योग्य PDF, जिसमें विशिष्ट प्रमाणपत्र आईडी, QR कोड और एक स्थायी सार्वजनिक सत्यापन पृष्ठ होता है, जिसे कोई भी बिना लॉगिन किए जाँच सकता है।`,
      },
      {
        q: 'मूल्यांकन कैसे होता है?',
        a: 'वस्तुनिष्ठ प्रश्नों का मूल्यांकन संग्रहीत उत्तर-कुंजी के आधार पर स्वचालित रूप से होता है। यह नियम-आधारित स्वचालित मूल्यांकन है — न कोई AI मॉडल, न कोई मानव परीक्षक।',
      },
      {
        q: 'यदि मैं उत्तीर्ण न हो सका तो?',
        a: `आपको फिर भी पूरा विषयवार विश्लेषण मिलता है, जिससे पता चलता है कि आप कहाँ पीछे रहे, और तैयार होने पर आप पुनः आकलन दे सकते हैं। जब तक आप उत्तीर्ण होकर प्रमाणपत्र जारी करना न चुनें, कोई शुल्क नहीं लिया जाता। उत्तीर्ण अंक ${pass}% है।`,
      },
      {
        q: 'क्या नियोक्ता मेरा प्रमाणपत्र सत्यापित कर सकता है?',
        a: 'हाँ, और यही इसका उद्देश्य है। हर प्रमाणपत्र पर एक विशिष्ट आईडी और QR कोड होता है, जो एक सार्वजनिक सत्यापन पृष्ठ खोलता है और धारक का नाम, शीर्षक, अंक तथा जारी होने की तिथि की पुष्टि करता है। लॉगिन की आवश्यकता नहीं। यदि कोई प्रमाणपत्र निरस्त होता है, तो पृष्ठ तुरंत यह बता देता है।',
      },
      {
        q: 'क्या पहले से कोई आयुर्वेदिक योग्यता आवश्यक है?',
        a: 'नहीं। यह आकलन सभी शिक्षार्थियों के लिए खुला है और किसी पूर्व क्रेडेंशियल की आवश्यकता नहीं, हालाँकि पंचकर्म की बुनियादी जानकारी होना उपयोगी रहेगा।',
      },
      {
        q: 'क्या यह चिकित्सा करने का लाइसेंस है?',
        a: 'नहीं, और हम इसका दिखावा भी नहीं करेंगे। यह प्रमाणित करता है कि आपने पंचकर्म मौलिकताओं पर एक वस्तुनिष्ठ ज्ञान-आकलन उत्तीर्ण किया है। यह चिकित्सीय योग्यता नहीं है, पंजीकरण नहीं है, और आपके क्षेत्र के वैधानिक लाइसेंस का विकल्प नहीं है।',
      },
    ],

    closingTitle: 'जानिए आप वास्तव में कहाँ खड़े हैं',
    closingSub: (m, q) =>
      `${m} मिनट, ${q} प्रश्न, कोई कार्ड विवरण नहीं। दोनों ही स्थितियों में आपको पूरा विश्लेषण मिलता है।`,
    closingSyllabus: 'पूरा पाठ्यक्रम देखें',
    honestLabel: 'ईमानदार सूचना:',
    honestBody:
      'यह आकलन वस्तुनिष्ठ प्रश्नों के नियम-आधारित स्वचालित मूल्यांकन का उपयोग करता है — किसी AI मूल्यांकन का उपयोग नहीं किया जाता और न ही ऐसा दावा किया जाता है। उत्तीर्ण होना पंचकर्म मौलिकताओं के परखे गए ज्ञान को प्रमाणित करता है। यह चिकित्सीय योग्यता, पंजीकरण या चिकित्सा करने का लाइसेंस नहीं है।',
  },
};

/** Small amber ribbon marking content that is not yet real. */
function PlaceholderRibbon({ children }: { children: string }) {
  return (
    <p className="mx-auto mb-5 w-fit rounded-full border border-dashed border-saffron-400 bg-saffron-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-saffron-700">
      Placeholder — {children}
    </p>
  );
}

export function PanchkarmaLanding() {
  const { language } = useLanguage();
  const c = COPY[language] ?? COPY.en;

  const { data: cert } = useAsync(() => provider.getCertificationBySlug(SLUG, language), [language]);

  const minutes = cert ? Math.round(cert.durationSec / 60) : FACTS.minutes;
  const questions = cert?.questionCount ?? FACTS.questions;
  const passScorePct = cert?.passScorePct ?? FACTS.passScorePct;

  const startHref = `/assess/${SLUG}/start`;

  return (
    <div>
      {/* ───────────────────────────── Hero ───────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-saffron-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-saffron-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-32 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />

        <div className="container-page relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip bg-white text-brand-800 ring-1 ring-brand-200">{c.chip}</span>

            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {c.h1a}
              <span className="block text-brand-700">{c.h1b}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-slate-600 sm:text-lg">
              {c.sub(minutes, CERTIFICATE_PRICE)}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to={startHref} className="btn-primary">
                {c.ctaPrimary}
              </Link>
              <Link to="/verify" className="btn-outline">
                {c.ctaSecondary}
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">{c.reassure}</p>

            {/* Real assessment facts, read from the catalog */}
            <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
              {c.facts(minutes, questions, passScorePct).map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-2xl font-semibold text-brand-800">{value}</dd>
                  <dd className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ──────────────────── Stats (placeholder) ──────────────────── */}
      {SHOW_PLACEHOLDERS && (
        <section className="border-b border-slate-200 bg-white py-12">
          <div className="container-page text-center">
            <PlaceholderRibbon>{c.phFigures}</PlaceholderRibbon>
            <dl className="grid gap-8 sm:grid-cols-3">
              {c.statLabels.map((label, i) => (
                <div key={label} className="rounded-xl border border-dashed border-slate-300 p-6">
                  <dd className="font-display text-3xl font-semibold text-slate-400">{STAT_VALUES[i]}</dd>
                  <dt className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ───────────────────────── Syllabus ───────────────────────── */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{c.syllabusEyebrow}</p>
          <h2 className="section-title mt-1 text-balance">{c.syllabusTitle}</h2>
          <p className="mt-3 text-pretty text-slate-600">{c.syllabusNote}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {c.syllabus.map((s) => (
            <div key={s.title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-saffron-50 text-xl" aria-hidden>
                {s.icon}
              </span>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{c.stepsEyebrow}</p>
            <h2 className="section-title mt-1 text-balance">{c.stepsTitle(minutes)}</h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {c.steps.map((s, i) => (
              <li key={s.title} className="card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 font-display text-lg font-semibold text-brand-700">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ──────────────────────── What you receive ──────────────────────── */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">{c.receiveEyebrow}</p>
            <h2 className="section-title mt-1 text-balance">{c.receiveTitle}</h2>
            <p className="mt-4 text-pretty text-slate-600">{c.receiveIntro}</p>
            <ul className="mt-6 space-y-4">
              {c.receiveBullets.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <span
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{b.title}</span>
                    <span className="mt-0.5 block text-sm text-slate-600">{b.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Certificate mock — representative, not a real issued certificate */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-6 shadow-lift sm:p-8">
            <div className="rounded-xl border-4 border-saffron-300/60 bg-white p-6 text-center sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">{c.certOrg}</p>
              <p className="mt-4 font-display text-xl font-semibold text-ink sm:text-2xl">{c.certHeading}</p>
              <p className="mt-5 text-xs uppercase tracking-wider text-slate-500">{c.certAwardedTo}</p>
              <p className="font-display text-lg font-semibold text-brand-800">{c.certName}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">{c.certForPassing}</p>
              <p className="font-semibold text-ink">{c.certTitle}</p>

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200 pt-4 text-left">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.certIdLabel}</p>
                  <p className="font-mono text-[11px] font-semibold text-ink">AIC-••••-••••-••••</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded border border-slate-300 bg-slate-50 text-[8px] font-semibold text-slate-400">
                  QR
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-brand-100">{c.certCaption}</p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Pricing ───────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{c.pricingEyebrow}</p>
            <h2 className="section-title mt-1 text-balance">{c.pricingTitle}</h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            <div className="card flex flex-col p-6">
              <h3 className="font-semibold text-ink">{c.freeTitle}</h3>
              <p className="mt-1 font-display text-3xl font-semibold text-brand-800">{c.freePrice}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600">
                {c.freeFeatures(minutes, questions).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand-600" aria-hidden>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to={startHref} className="btn-outline mt-6 w-full">
                {c.freeCta}
              </Link>
            </div>

            <div className="card relative flex flex-col border-brand-200 p-6 ring-1 ring-brand-200">
              <span className="chip absolute -top-3 right-5 bg-saffron-100 text-saffron-700 ring-1 ring-saffron-200">
                {c.paidBadge}
              </span>
              <h3 className="font-semibold text-ink">{c.paidTitle}</h3>
              <p className="mt-1 font-display text-3xl font-semibold text-brand-800">
                {CERTIFICATE_PRICE}
                <span className="ml-1 align-middle text-sm font-medium text-slate-500">{c.paidSuffix}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600">
                {c.paidFeatures.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand-600" aria-hidden>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to={startHref} className="btn-primary mt-6 w-full">
                {c.paidCta}
              </Link>
              <p className="mt-3 text-center text-xs text-slate-500">{c.paidNote}</p>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-xs text-slate-500">
            {c.pricingFootnote}
          </p>
        </div>
      </section>

      {/* ───────────────────────── Who it is for ───────────────────────── */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{c.audienceEyebrow}</p>
          <h2 className="section-title mt-1 text-balance">{c.audienceTitle}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.audience.map((a) => (
            <div key={a.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-ink">{a.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── Testimonials + partners (placeholder) ─────────────── */}
      {SHOW_PLACEHOLDERS && (
        <section className="border-y border-slate-200 bg-white py-16">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <PlaceholderRibbon>{c.phQuotes}</PlaceholderRibbon>
              <h2 className="section-title">{c.testimonialsTitle}</h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <figure key={i} className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6">
                  <blockquote className="text-sm text-slate-500">“{c.testimonialQuote}”</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="block font-semibold text-slate-500">{c.testimonialName}</span>
                    <span className="block text-xs text-slate-400">{c.testimonialRole}</span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-14 text-center">
              <PlaceholderRibbon>{c.phPartners}</PlaceholderRibbon>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{c.partnersLabel}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: PARTNER_SLOT_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className="grid h-16 place-items-center rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-400"
                  >
                    {c.logoSlot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────── FAQ ─────────────────────────────── */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">{c.faqEyebrow}</p>
            <h2 className="section-title mt-1">{c.faqTitle}</h2>
          </div>
          <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {c.faqs(CERTIFICATE_PRICE, passScorePct).map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                  {f.q}
                  <span className="shrink-0 text-slate-400 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-pretty text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── Closing CTA ────────────────────────── */}
      <section className="container-page pb-16">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{c.closingTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-brand-100">{c.closingSub(minutes, questions)}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={startHref} className="btn-accent">
              {c.ctaPrimary}
            </Link>
            <Link
              to={`/certifications/${SLUG}`}
              className="btn inline-flex border border-white/40 text-white hover:bg-white/10"
            >
              {c.closingSyllabus}
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-pretty rounded-lg bg-slate-100 p-4 text-center text-sm text-slate-600">
          <strong className="text-ink">{c.honestLabel}</strong> {c.honestBody}
        </p>
      </section>
    </div>
  );
}

import type { Certification, Domain, Question, QuestionOption } from '../types';
import { DOMAIN_TRANSLATIONS, CERTIFICATION_TRANSLATIONS } from './translations';

const now = '2026-01-01T00:00:00.000Z';

/**
 * Aarogya India is authorised to certify in Ayurveda only, so every other
 * domain is seeded but inactive. The catalog filters on isActive in both the
 * local and Supabase providers, so inactive domains and their certifications
 * are hidden from the directory, search, home page and assessment start.
 *
 * Deactivated rather than deleted on purpose: attempts and certificates
 * reference certifications with ON DELETE RESTRICT, so removing the rows would
 * either be refused by the database or strand certificates already issued
 * against them. Those stay verifiable; they are simply no longer on offer.
 *
 * To certify in another domain later, add its id here — nothing else changes.
 */
export const AUTHORISED_DOMAIN_IDS: readonly string[] = ['dom-ayurveda'];

export function isAuthorisedDomain(domainId: string): boolean {
  return AUTHORISED_DOMAIN_IDS.includes(domainId);
}

const DOMAIN_SEEDS: Domain[] = [
  { id: 'dom-tech', slug: 'technology', name: 'Technology & Data', description: 'Software, data, cloud and security skills.', nameHi: DOMAIN_TRANSLATIONS['dom-tech'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-tech'].descriptionHi, icon: '💻', sortOrder: 1, isActive: true },
  { id: 'dom-health', slug: 'health', name: 'Health & Wellness', description: 'Nutrition, fitness, public health and care.', nameHi: DOMAIN_TRANSLATIONS['dom-health'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-health'].descriptionHi, icon: '🩺', sortOrder: 2, isActive: true },
  { id: 'dom-ayurveda', slug: 'ayurveda', name: 'Ayurveda', description: 'Traditional Indian medicine, therapies, and wellness practices.', nameHi: DOMAIN_TRANSLATIONS['dom-ayurveda'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-ayurveda'].descriptionHi, icon: '🌿', sortOrder: 2.5, isActive: true },
  { id: 'dom-business', slug: 'business', name: 'Business & Management', description: 'Management, operations and entrepreneurship.', nameHi: DOMAIN_TRANSLATIONS['dom-business'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-business'].descriptionHi, icon: '📊', sortOrder: 3, isActive: true },
  { id: 'dom-marketing', slug: 'marketing', name: 'Marketing & Design', description: 'Digital marketing, brand and design.', nameHi: DOMAIN_TRANSLATIONS['dom-marketing'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-marketing'].descriptionHi, icon: '🎨', sortOrder: 4, isActive: true },
  { id: 'dom-finance', slug: 'finance', name: 'Finance & Accounting', description: 'Accounting, taxation and markets.', nameHi: DOMAIN_TRANSLATIONS['dom-finance'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-finance'].descriptionHi, icon: '💰', sortOrder: 5, isActive: true },
  { id: 'dom-education', slug: 'education', name: 'Education & Teaching', description: 'Teaching, training and counselling.', nameHi: DOMAIN_TRANSLATIONS['dom-education'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-education'].descriptionHi, icon: '📚', sortOrder: 6, isActive: true },
  { id: 'dom-engineering', slug: 'engineering', name: 'Engineering & Safety', description: 'Core engineering, construction and safety.', nameHi: DOMAIN_TRANSLATIONS['dom-engineering'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-engineering'].descriptionHi, icon: '🏗️', sortOrder: 7, isActive: true },
  { id: 'dom-hr', slug: 'hr', name: 'HR & People', description: 'Recruitment, people ops and leadership.', nameHi: DOMAIN_TRANSLATIONS['dom-hr'].nameHi, descriptionHi: DOMAIN_TRANSLATIONS['dom-hr'].descriptionHi, icon: '🤝', sortOrder: 8, isActive: true },
];

export const DOMAINS: Domain[] = DOMAIN_SEEDS.map((d) => ({
  ...d,
  isActive: isAuthorisedDomain(d.id),
}));

interface CertSeed {
  slug: string;
  title: string;
  domainId: string;
  shortDesc: string;
  topics: string[];
  popularity: number;
  durationSec?: number;
  passScorePct?: number;
}

const CERT_SEEDS: CertSeed[] = [
  { slug: 'web-development', title: 'Web Development', domainId: 'dom-tech', shortDesc: 'Build modern, accessible, responsive web applications.', topics: ['HTML & CSS', 'JavaScript', 'HTTP & APIs', 'Accessibility'], popularity: 98 },
  { slug: 'data-analytics', title: 'Data Analytics', domainId: 'dom-tech', shortDesc: 'Turn raw data into clear, actionable insight.', topics: ['Statistics', 'Spreadsheets', 'SQL', 'Visualization'], popularity: 95 },
  { slug: 'cyber-security', title: 'Cyber Security Fundamentals', domainId: 'dom-tech', shortDesc: 'Protect systems, networks and data from threats.', topics: ['Threats', 'Cryptography', 'Network Security', 'Best Practices'], popularity: 90 },
  { slug: 'cloud-computing', title: 'Cloud Computing', domainId: 'dom-tech', shortDesc: 'Understand cloud models, services and deployment.', topics: ['Service Models', 'Deployment', 'Storage', 'Cost'], popularity: 86 },
  { slug: 'nutrition-fundamentals', title: 'Nutrition Fundamentals', domainId: 'dom-health', shortDesc: 'Core principles of balanced, evidence-based nutrition.', topics: ['Macronutrients', 'Micronutrients', 'Diet Planning', 'Food Safety'], popularity: 96 },
  { slug: 'public-health', title: 'Public Health & Community Nutrition', domainId: 'dom-health', shortDesc: 'Community-level nutrition programmes and policy.', topics: ['Epidemiology', 'Malnutrition', 'Programmes', 'Policy'], popularity: 82 },
  { slug: 'yoga-fitness', title: 'Yoga & Fitness Instruction', domainId: 'dom-health', shortDesc: 'Safe, effective movement and wellness coaching.', topics: ['Anatomy', 'Asanas', 'Program Design', 'Safety'], popularity: 80 },
  { slug: 'first-aid', title: 'First Aid & Emergency Care', domainId: 'dom-health', shortDesc: 'Respond correctly to common medical emergencies.', topics: ['CPR', 'Wounds', 'Fractures', 'Triage'], popularity: 78 },
  { slug: 'project-management', title: 'Project Management', domainId: 'dom-business', shortDesc: 'Plan, execute and deliver projects on time and budget.', topics: ['Scope', 'Scheduling', 'Risk', 'Stakeholders'], popularity: 93 },
  { slug: 'business-analytics', title: 'Business Analytics', domainId: 'dom-business', shortDesc: 'Make data-driven decisions that move the business.', topics: ['KPIs', 'Forecasting', 'Dashboards', 'Decision Models'], popularity: 88 },
  { slug: 'operations-management', title: 'Operations Management', domainId: 'dom-business', shortDesc: 'Optimise processes, capacity and supply chains.', topics: ['Process Design', 'Capacity', 'Quality', 'Supply Chain'], popularity: 81 },
  { slug: 'entrepreneurship', title: 'Entrepreneurship & Startup Basics', domainId: 'dom-business', shortDesc: 'Validate ideas and build sustainable ventures.', topics: ['Ideation', 'Business Models', 'Go-to-Market', 'Finance'], popularity: 79 },
  { slug: 'digital-marketing', title: 'Digital Marketing', domainId: 'dom-marketing', shortDesc: 'Grow audiences with measurable digital campaigns.', topics: ['SEO', 'Social Media', 'Email', 'Analytics'], popularity: 94 },
  { slug: 'ui-ux-design', title: 'UI/UX Design', domainId: 'dom-marketing', shortDesc: 'Design usable, delightful product experiences.', topics: ['Research', 'Wireframing', 'Visual Design', 'Usability'], popularity: 91 },
  { slug: 'content-marketing', title: 'Content & Copywriting', domainId: 'dom-marketing', shortDesc: 'Write clear, persuasive content that converts.', topics: ['Strategy', 'Writing', 'SEO Content', 'Editing'], popularity: 77 },
  { slug: 'financial-accounting', title: 'Financial Accounting', domainId: 'dom-finance', shortDesc: 'From journal entries to financial statements.', topics: ['Journal & Ledger', 'Trial Balance', 'Statements', 'Ratios'], popularity: 89 },
  { slug: 'gst-practitioner', title: 'GST Practitioner', domainId: 'dom-finance', shortDesc: 'Handle GST registration, returns and input credit.', topics: ['Registration', 'Returns', 'Input Tax Credit', 'Compliance'], popularity: 84 },
  { slug: 'stock-market', title: 'Stock Market Fundamentals', domainId: 'dom-finance', shortDesc: 'Understand markets, instruments and risk.', topics: ['Market Basics', 'Equity', 'Mutual Funds', 'Risk'], popularity: 83 },
  { slug: 'teaching-methodology', title: 'Teaching Methodology', domainId: 'dom-education', shortDesc: 'Plan and deliver effective, inclusive lessons.', topics: ['Pedagogy', 'Lesson Planning', 'Assessment', 'Classroom Mgmt'], popularity: 76 },
  { slug: 'career-counselling', title: 'Career Counselling', domainId: 'dom-education', shortDesc: 'Guide learners toward the right path ethically.', topics: ['Guidance', 'Aptitude', 'Communication', 'Ethics'], popularity: 72 },
  { slug: 'electrical-safety', title: 'Electrical & Workplace Safety', domainId: 'dom-engineering', shortDesc: 'Work safely with electrical and site hazards.', topics: ['Hazards', 'PPE', 'Lockout-Tagout', 'Codes'], popularity: 75 },
  { slug: 'autocad-drafting', title: 'CAD Drafting Essentials', domainId: 'dom-engineering', shortDesc: 'Read and produce clear technical drawings.', topics: ['Drawing Basics', 'Dimensions', 'Layers', 'Standards'], popularity: 70 },
  { slug: 'hr-recruitment', title: 'HR Recruitment', domainId: 'dom-hr', shortDesc: 'Source, screen and close the right candidates.', topics: ['Sourcing', 'Screening', 'Interviewing', 'Offer'], popularity: 87 },
  { slug: 'people-management', title: 'People Management', domainId: 'dom-hr', shortDesc: 'Motivate, coach and retain high-performing teams.', topics: ['Motivation', 'Feedback', 'Performance', 'Retention'], popularity: 85 },
  { slug: 'panchkarma-therapy', title: 'Panchkarma Therapy Fundamentals', domainId: 'dom-ayurveda', shortDesc: 'Master the five classical purification therapies of Ayurveda.', topics: ['Vata Therapies', 'Pitta Therapies', 'Kapha Therapies', 'Post-Therapy Care'], popularity: 92 },
  { slug: 'marma-therapy', title: 'Marma Therapy & Points', domainId: 'dom-ayurveda', shortDesc: 'Understand vital energy points and therapeutic applications.', topics: ['Marma Locations', 'Point Classification', 'Treatment Protocols', 'Safety Guidelines'], popularity: 88 },
  { slug: 'ayurvedic-nutrition', title: 'Ayurvedic Diet & Nutrition', domainId: 'dom-ayurveda', shortDesc: 'Apply doshas and food principles for personalized wellness.', topics: ['Dosha Constitution', 'Food Properties', 'Seasonal Eating', 'Digestive Health'], popularity: 90 },
  { slug: 'ayurvedic-herbs', title: 'Ayurvedic Herbal Medicine', domainId: 'dom-ayurveda', shortDesc: 'Identify and apply therapeutic herbs in Ayurvedic practice.', topics: ['Herb Properties', 'Formulations', 'Preparation Methods', 'Interactions & Safety'], popularity: 85 },
];

export const CERTIFICATIONS: Certification[] = CERT_SEEDS.map((c, i) => {
  const trans = CERTIFICATION_TRANSLATIONS[c.slug as keyof typeof CERTIFICATION_TRANSLATIONS];
  return {
    id: `cert-${c.slug}`,
    domainId: c.domainId,
    slug: c.slug,
    title: c.title,
    shortDesc: c.shortDesc,
    description: `${c.shortDesc} This certification validates practical, job-ready knowledge across ${c.topics.join(', ')}. The assessment is objective, timed and automatically scored.`,
    eligibility: 'Open to all learners. No prior credential required. A basic familiarity with the subject is recommended.',
    titleHi: trans?.titleHi,
    shortDescHi: trans?.shortDescHi,
    descriptionHi: trans?.descriptionHi,
    eligibilityHi: trans?.eligibilityHi,
    durationSec: c.durationSec ?? 7 * 60,
    questionCount: 10,
    passScorePct: c.passScorePct ?? 60,
    topics: c.topics,
    isActive: isAuthorisedDomain(c.domainId),
    popularity: c.popularity,
    createdAt: new Date(Date.parse(now) - (CERT_SEEDS.length - i) * 86400000).toISOString(),
  };
});

// ---- Question generation (original content) --------------------------------
let qCounter = 0;
let oCounter = 0;

function mcq(cert: Certification, topic: string, body: string, options: Array<[string, boolean]>, explanation?: string): Question {
  const qid = `q-${cert.slug}-${++qCounter}`;
  const opts: QuestionOption[] = options.map(([label, isCorrect], i) => ({
    id: `o-${++oCounter}`,
    questionId: qid,
    label,
    isCorrect,
    sortOrder: i,
  }));
  return {
    id: qid,
    certificationId: cert.id,
    domainId: cert.domainId,
    topic,
    difficulty: 'medium',
    qtype: 'mcq_single',
    body,
    explanation,
    isActive: true,
    options: opts,
  };
}

function tf(cert: Certification, topic: string, statement: string, isTrue: boolean, explanation?: string): Question {
  const qid = `q-${cert.slug}-${++qCounter}`;
  const opts: QuestionOption[] = [
    { id: `o-${++oCounter}`, questionId: qid, label: 'True', isCorrect: isTrue, sortOrder: 0 },
    { id: `o-${++oCounter}`, questionId: qid, label: 'False', isCorrect: !isTrue, sortOrder: 1 },
  ];
  return { id: qid, certificationId: cert.id, domainId: cert.domainId, topic, difficulty: 'easy', qtype: 'true_false', body: statement, explanation, isActive: true, options: opts };
}

/** Builds an original bank for each certification using its topics. */
function buildBank(cert: Certification): Question[] {
  const bank: Question[] = [];
  const [t0, t1, t2, t3] = cert.topics;
  bank.push(
    mcq(cert, t0, `Which statement best describes a core principle of ${t0} in ${cert.title}?`, [
      [`It is a foundational concept that underpins competent practice in ${t0}`, true],
      ['It is an optional extra with little practical value', false],
      ['It only applies to academic research, not real work', false],
      [`It is unrelated to ${cert.title}`, false],
    ], `${t0} is foundational to ${cert.title}.`),
    tf(cert, t1, `A solid understanding of ${t1} is expected of someone certified in ${cert.title}.`, true),
    mcq(cert, t2, `When applying ${t2} in a real scenario, what should a competent practitioner do first?`, [
      ['Assess the situation and gather relevant information', true],
      ['Skip analysis and act immediately', false],
      ['Delegate all responsibility without review', false],
      ['Ignore established best practices', false],
    ]),
    mcq(cert, t3, `Which of the following is a recognized best practice within ${t3}?`, [
      ['Following established standards and verifying outcomes', true],
      ['Relying solely on guesswork', false],
      ['Avoiding documentation entirely', false],
      ['Disregarding safety and quality checks', false],
    ]),
    tf(cert, t0, `In ${cert.title}, ${t0} can be safely ignored once the basics are learned.`, false),
    mcq(cert, t1, `What is the primary benefit of mastering ${t1} for a ${cert.title} professional?`, [
      ['It improves the quality and reliability of their work', true],
      ['It guarantees instant promotion', false],
      ['It removes the need for teamwork', false],
      ['It has no measurable impact', false],
    ]),
    mcq(cert, t2, `A beginner makes an error related to ${t2}. What is the most professional response?`, [
      ['Identify the cause, correct it, and learn from it', true],
      ['Hide the error and move on', false],
      ['Blame the tools immediately', false],
      [`Stop practicing ${t2} altogether`, false],
    ]),
    tf(cert, t3, `Continuous learning and staying current in ${t3} is important for long-term competence.`, true),
    mcq(cert, t0, `Which approach reflects ethical, professional conduct in ${t0}?`, [
      ['Being honest about limitations and following guidelines', true],
      ['Overstating abilities to win work', false],
      ['Cutting corners to save time', false],
      ['Concealing mistakes from stakeholders', false],
    ]),
    mcq(cert, t1, `How does ${t1} typically contribute to outcomes in ${cert.title}?`, [
      ['It supports better decisions and more dependable results', true],
      ['It slows work with no benefit', false],
      ['It is purely theoretical and unusable', false],
      [`It contradicts the goals of ${cert.title}`, false],
    ]),
  );
  return bank;
}

// ---- Ayurveda-specific question generators --------------------------------

function buildAyurvedicBank(cert: Certification): Question[] {
  const bank: Question[] = [];

  if (cert.slug === 'panchkarma-therapy') {
    bank.push(
      mcq(cert, 'Vata Therapies', 'Which Panchkarma therapy is most suitable for balancing Vata dosha?', [
        ['Abhyanga with warm sesame oil followed by Swedana', true],
        ['Strong purgative therapy immediately', false],
        ['Cold oil massage', false],
        ['Fasting and harsh detoxification', false],
      ], 'Abhyanga (warm oil massage) is the primary Vata balancing therapy.'),
      tf(cert, 'Pitta Therapies', 'Virechana (purgation) is contraindicated in weak or malnourished individuals.', true),
      mcq(cert, 'Kapha Therapies', 'What is the recommended approach for Kapha elimination through Panchkarma?', [
        ['Vigorous Swedana followed by Virechana with warm herbal oils', true],
        ['Gentle massage with cooling oils', false],
        ['Complete rest and avoidance of therapy', false],
        ['Cold water treatments only', false],
      ]),
      mcq(cert, 'Post-Therapy Care', 'During the recovery phase after Panchkarma, which dietary guideline is most important?', [
        ['Gradually introduce warm, easily digestible foods', true],
        ['Immediately resume heavy meals', false],
        ['Consume cold beverages and salads', false],
        ['Fast completely for 7 days', false],
      ]),
      tf(cert, 'Vata Therapies', 'Consistency and warm environment are key factors in successful Vata Panchkarma treatment.', true),
      mcq(cert, 'Pitta Therapies', 'Which Panchkarma procedure is specifically designed to remove excess bile from the body?', [
        ['Virechana (therapeutic purgation)', true],
        ['Nasya (nasal therapy)', false],
        ['Vasti (enema)', false],
        ['Rakta Moksha (blood letting)', false],
      ]),
      mcq(cert, 'Kapha Therapies', 'Before administering Vasti therapy, what is the essential preparatory step?', [
        ['Administer Sneha (oil) and Swedana (steam) to prepare the system', true],
        ['Give strong laxatives immediately', false],
        ['Restrict food and water completely', false],
        ['Skip any preparation procedures', false],
      ]),
      tf(cert, 'Post-Therapy Care', 'Sexual activity and strenuous exercise should be avoided immediately after Panchkarma completion.', true),
      mcq(cert, 'Vata Therapies', 'What is the primary benefit of Nasya (nasal therapy) in Panchkarma?', [
        ['Cleansing of the head, sinuses, and upper respiratory channels', true],
        ['Direct purification of the digestive system', false],
        ['Elimination of blood toxins', false],
        ['Removal of intestinal parasites', false],
      ]),
      mcq(cert, 'Pitta Therapies', 'How many days is a typical Panchkarma program usually recommended?', [
        ['7-21 days depending on the constitution and condition', true],
        ['1-2 days', false],
        ['3-4 months', false],
        ['Lifetime commitment', false],
      ])
    );
  } else if (cert.slug === 'marma-therapy') {
    bank.push(
      mcq(cert, 'Marma Locations', 'How many Marma points are recognized in classical Ayurvedic texts?', [
        ['108', true],
        ['72', false],
        ['365', false],
        ['42', false],
      ], 'Traditional Ayurveda recognizes 108 Marma points throughout the body.'),
      tf(cert, 'Point Classification', 'All Marma points are equally sensitive and produce the same therapeutic response.', false),
      mcq(cert, 'Marma Locations', 'The Sthapani Marma is located at which point on the body?', [
        ['Between the eyebrows (third eye region)', true],
        ['Top of the head', false],
        ['At the navel', false],
        ['Behind the ears', false],
      ]),
      mcq(cert, 'Treatment Protocols', 'What is the primary principle when stimulating a Marma point therapeutically?', [
        ['Apply moderate pressure with the correct duration for the specific point', true],
        ['Apply maximum force to break through resistance', false],
        ['Avoid any physical pressure', false],
        ['Stimulate randomly without plan', false],
      ]),
      tf(cert, 'Safety Guidelines', 'Certain Marma points like Hridaya (heart region) require extreme caution and should only be treated by experienced practitioners.', true),
      mcq(cert, 'Point Classification', 'Marma points are classified into how many categories based on their composition?', [
        ['4 main categories: Mamsa, Sira, Snayu, Asthi, and Sandhi', true],
        ['2 categories only', false],
        ['10 different categories', false],
        ['One single type', false],
      ]),
      mcq(cert, 'Treatment Protocols', 'Which condition is commonly treated through Marma therapy stimulation?', [
        ['Pain relief, improved circulation, and energy balance', true],
        ['Weight gain only', false],
        ['Increasing appetite exclusively', false],
        ['Temperature reduction', false],
      ]),
      tf(cert, 'Marma Locations', 'The Talahridaya Marma in the palm is used primarily for cardiovascular support.', true),
      mcq(cert, 'Safety Guidelines', 'What is the most critical contraindication for Marma point treatment?', [
        ['Severe acute inflammation or infection at the site', true],
        ['Mild muscle soreness', false],
        ['Recent healthy exercise', false],
        ['Good digestion', false],
      ]),
      mcq(cert, 'Point Classification', 'Ardha Marma points are those that:', [
        ['Affect both the immediate and distant body regions when stimulated', true],
        ['Only affect local tissue', false],
        ['Do not have therapeutic value', false],
        ['Can never be treated', false],
      ])
    );
  } else if (cert.slug === 'ayurvedic-nutrition') {
    bank.push(
      mcq(cert, 'Dosha Constitution', 'Which foods are generally recommended to balance an elevated Vata dosha?', [
        ['Warm, oily, grounding foods like sesame, ghee, and cooked grains', true],
        ['Cold, light, dry foods', false],
        ['Spicy, penetrating foods only', false],
        ['Raw vegetables exclusively', false],
      ], 'Warm, nourishing foods pacify Vata dosha.'),
      tf(cert, 'Food Properties', 'Ghee (clarified butter) is considered a tri-doshic food suitable for all constitutions.', true),
      mcq(cert, 'Seasonal Eating', 'What is the primary dietary principle for Pitta season (summer)?', [
        ['Favor cooling, slightly heavy foods; reduce spices and excess salt', true],
        ['Increase heating foods and spices', false],
        ['Eat only raw vegetables', false],
        ['Follow the same diet year-round', false],
      ]),
      mcq(cert, 'Digestive Health', 'According to Ayurveda, what is the optimal timing for the main meal?', [
        ['Midday when Agni (digestive fire) is strongest', true],
        ['Late evening before bed', false],
        ['Immediately upon waking', false],
        ['Midnight for all individuals', false],
      ]),
      tf(cert, 'Dosha Constitution', 'Kapha-dominant individuals should consume heavy, oily foods in abundance.', false),
      mcq(cert, 'Food Properties', 'Which of the following foods has a heating, drying quality in Ayurveda?', [
        ['Barley, mung beans, and leafy greens', true],
        ['Sesame oil, dates, and avocado', false],
        ['Ghee and coconut oil', false],
        ['Milk and rice', false],
      ]),
      mcq(cert, 'Seasonal Eating', 'During Kapha season (spring/winter), which taste should be minimized?', [
        ['Sweet taste; favor pungent, bitter, and astringent tastes', true],
        ['Spicy taste only', false],
        ['Bitter taste exclusively', false],
        ['Salty taste', false],
      ]),
      tf(cert, 'Digestive Health', 'Drinking warm water with meals aids digestion and is encouraged in Ayurveda.', true),
      mcq(cert, 'Dosha Constitution', 'What is the primary nutritional guideline for maintaining Pitta balance?', [
        ['Emphasize cooling, bitter, and astringent tastes; include adequate healthy fats', true],
        ['Consume exclusively spicy foods', false],
        ['Follow heavy, oily diet', false],
        ['Eat only fruits', false],
      ]),
      mcq(cert, 'Food Properties', 'Which cooking method is most balancing for a Vata-dominant individual?', [
        ['Slow-cooked with ghee and spices in a warm kitchen', true],
        ['Raw food diets exclusively', false],
        ['Grilling at high temperatures', false],
        ['Microwaving frozen foods', false],
      ])
    );
  } else if (cert.slug === 'ayurvedic-herbs') {
    bank.push(
      mcq(cert, 'Herb Properties', 'Which herb is specifically known for its immune-boosting and adaptogenic properties?', [
        ['Ashwagandha (Withania somnifera)', true],
        ['Only European herbs have immune benefits', false],
        ['No Ayurvedic herb supports immunity', false],
        ['Tulsi is never used for immunity', false],
      ], 'Ashwagandha is a premier Ayurvedic adaptogen.'),
      tf(cert, 'Formulations', 'Triphala is a classic three-herb formulation designed to support digestion and gentle detoxification.', true),
      mcq(cert, 'Preparation Methods', 'What is a decoction (Kwatha) in Ayurvedic herbal preparation?', [
        ['A concentrated extract made by simmering herbs in water for an extended period', true],
        ['A cold infusion method', false],
        ['Direct consumption of raw herbs', false],
        ['Powdering herbs without any liquid', false],
      ]),
      mcq(cert, 'Interactions & Safety', 'Which of the following is an important consideration when combining Ayurvedic herbs with modern medicines?', [
        ['Consult with a qualified practitioner to avoid adverse interactions', true],
        ['Herbs have no interactions with modern drugs', false],
        ['All combinations are always safe', false],
        ['Never inform your doctor about herb use', false],
      ]),
      tf(cert, 'Herb Properties', 'Turmeric (Curcuma longa) is traditionally used for its anti-inflammatory and digestive properties.', true),
      mcq(cert, 'Formulations', 'Brahmi oil is commonly used for which primary therapeutic purpose?', [
        ['Supporting mental clarity, focus, and nervous system health', true],
        ['Only for digestive issues', false],
        ['Exclusively for skin problems', false],
        ['Weight loss programs only', false],
      ]),
      mcq(cert, 'Preparation Methods', 'What does the term Churna refer to in Ayurvedic herbal preparations?', [
        ['A finely ground herbal powder', true],
        ['A liquid extract', false],
        ['A fresh herb paste', false],
        ['Whole dried herbs', false],
      ]),
      tf(cert, 'Interactions & Safety', 'Pregnant women should avoid certain Ayurvedic herbs and always consult a qualified practitioner.', true),
      mcq(cert, 'Herb Properties', 'Ginger (Shunti) in Ayurveda is primarily valued for:', [
        ['Enhancing digestion, reducing inflammation, and improving circulation', true],
        ['Cooling the body only', false],
        ['Having no therapeutic benefits', false],
        ['Causing digestive upset', false],
      ]),
      mcq(cert, 'Formulations', 'How should most Ayurvedic herbal formulas be taken for optimal benefit?', [
        ['At specific times with appropriate vehicles like water, ghee, or milk based on the condition', true],
        ['All at once without regard to timing', false],
        ['Only at night regardless of the formulation', false],
        ['Randomly throughout the day', false],
      ])
    );
  }

  return bank.length > 0 ? bank : buildBank(cert);
}

export const QUESTIONS: Question[] = CERTIFICATIONS.flatMap(buildAyurvedicBank);

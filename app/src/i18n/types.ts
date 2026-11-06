// Localization types and translations interface

export type Language = 'en' | 'hi';

export interface Translations {
  // Navigation & Layout
  appName: string;
  home: string;
  certifications: string;
  directory: string;
  dashboard: string;
  logout: string;
  login: string;
  register: string;
  profile: string;

  // Home page
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  browseByCategory: string;
  featuredCertifications: string;
  howItWorks: string;
  benefits: string;
  faq: string;
  startLearning: string;

  // Directory
  allCertifications: string;
  filterByDomain: string;
  sortBy: string;
  sortByPopular: string;
  sortByNewest: string;
  sortByAZ: string;
  noCertificationsFound: string;

  // Certification Detail
  eligibility: string;
  duration: string;
  passingScore: string;
  topics: string;
  startAssessment: string;
  backToDirectory: string;

  // Assessment
  startAssessmentTitle: string;
  enterYourName: string;
  acceptRules: string;
  rulesText: string;
  iAcceptTheRules: string;
  beginAssessment: string;
  question: string;
  of: string;
  timer: string;
  markForReview: string;
  markedForReview: string;
  nextQuestion: string;
  previousQuestion: string;
  reviewAnswers: string;
  submitAssessment: string;
  confirmSubmit: string;
  confirmSubmitText: string;
  cancel: string;
  submit: string;
  timeUp: string;
  autoSubmitting: string;

  // Results
  resultsTitle: string;
  congratulations: string;
  youPassed: string;
  youDidNotPass: string;
  yourScore: string;
  scorePercentage: string;
  level: string;
  topicBreakdown: string;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  getCertificate: string;
  tryAgain: string;
  backToDashboard: string;

  // Certificate
  certificate: string;
  certificateNo: string;
  certificateIssued: string;
  issueDate: string;
  score: string;
  verifyOnline: string;
  downloadPDF: string;
  shareLink: string;
  copied: string;

  // Verification
  verifyCertificate: string;
  enterCertificateID: string;
  verify: string;
  certificateValid: string;
  certificateInvalid: string;
  certificateRevoked: string;
  certificateExpired: string;
  certificateNotRecognized: string;

  // Dashboard
  myDashboard: string;
  myProfile: string;
  inProgress: string;
  completed: string;
  viewResults: string;
  myCertificates: string;
  downloadAll: string;
  assessmentHistory: string;

  // Admin
  adminPanel: string;
  analytics: string;
  manageDomains: string;
  manageCertifications: string;
  manageQuestions: string;
  reviewAttempts: string;
  issueCertificates: string;
  revokeCertificate: string;
  totalUsers: string;
  totalAttempts: string;
  totalCertificates: string;
  passRate: string;

  // Common
  loading: string;
  error: string;
  success: string;
  confirm: string;
  delete: string;
  edit: string;
  save: string;
  close: string;
  back: string;
  next: string;
  noDataAvailable: string;
  somethingWentWrong: string;

  // Language
  language: string;
  english: string;
  hindi: string;
  selectLanguage: string;

  // Layout — header & footer chrome
  navGetCertified: string;
  navGreeting: string;
  navToggle: string;
  navPrimary: string;
  navVerify: string;
  navSignIn: string;
  navSignOut: string;
  navCreateAccount: string;
  footerHowItWorks: string;
  navAdmin: string;
  footerTagline: string;
  footerPlatform: string;
  footerDirectory: string;
  footerTrust: string;
  footerStep1: string;
  footerStep2: string;
  footerStep3: string;
  footerTrust1: string;
  footerTrust2: string;
  footerTrust3: string;
  footerLegal: string;
  localBackendNotice: string;
}

export const EN_TRANSLATIONS: Translations = {
  // Navigation & Layout
  appName: 'Aarogya India Gurukul',
  home: 'Home',
  certifications: 'Certifications',
  directory: 'Directory',
  dashboard: 'Dashboard',
  logout: 'Logout',
  login: 'Login',
  register: 'Register',
  profile: 'Profile',

  // Home page
  heroTitle: 'Prove your skill. Earn trust.',
  heroSubtitle: 'Objective Ayurveda assessments with independently verifiable certificates.',
  searchPlaceholder: 'Search certifications...',
  browseByCategory: 'Browse by Category',
  featuredCertifications: 'Featured Certifications',
  howItWorks: 'How it Works',
  benefits: 'Benefits',
  faq: 'Frequently Asked Questions',
  startLearning: 'Start Learning',

  // Directory
  allCertifications: 'All Certifications',
  filterByDomain: 'Filter by Domain',
  sortBy: 'Sort by',
  sortByPopular: 'Most Popular',
  sortByNewest: 'Newest',
  sortByAZ: 'A – Z',
  noCertificationsFound: 'No certifications found. Try a different search.',

  // Certification Detail
  eligibility: 'Eligibility',
  duration: 'Duration',
  passingScore: 'Passing Score',
  topics: 'Topics Covered',
  startAssessment: 'Start Assessment',
  backToDirectory: 'Back to Directory',

  // Assessment
  startAssessmentTitle: 'Begin Your Assessment',
  enterYourName: 'Enter your full name',
  acceptRules: 'Assessment Rules',
  rulesText: 'You must complete the assessment in one sitting. You cannot pause or exit and resume later. Your answers are automatically saved.',
  iAcceptTheRules: 'I accept the rules',
  beginAssessment: 'Begin Assessment',
  question: 'Question',
  of: 'of',
  timer: 'Time Remaining',
  markForReview: 'Mark for Review',
  markedForReview: 'Marked for Review',
  nextQuestion: 'Next',
  previousQuestion: 'Previous',
  reviewAnswers: 'Review Answers',
  submitAssessment: 'Submit Assessment',
  confirmSubmit: 'Submit Assessment?',
  confirmSubmitText: 'Once submitted, you cannot change your answers. Are you sure?',
  cancel: 'Cancel',
  submit: 'Submit',
  timeUp: 'Time is up! Your assessment has been submitted.',
  autoSubmitting: 'Submitting...',

  // Results
  resultsTitle: 'Your Results',
  congratulations: 'Congratulations!',
  youPassed: 'You Passed!',
  youDidNotPass: 'You Did Not Pass',
  yourScore: 'Your Score',
  scorePercentage: 'Percentage',
  level: 'Level',
  topicBreakdown: 'Topic-wise Breakdown',
  strengths: 'Your Strengths',
  areasForImprovement: 'Areas for Improvement',
  recommendations: 'Recommendations',
  getCertificate: 'Get Your Certificate',
  tryAgain: 'Try Again',
  backToDashboard: 'Back to Dashboard',

  // Certificate
  certificate: 'Certificate',
  certificateNo: 'Certificate Number',
  certificateIssued: 'Certificate Issued',
  issueDate: 'Issue Date',
  score: 'Score',
  verifyOnline: 'Verify Online',
  downloadPDF: 'Download PDF',
  shareLink: 'Share Link',
  copied: 'Copied to clipboard!',

  // Verification
  verifyCertificate: 'Verify Certificate',
  enterCertificateID: 'Enter Certificate ID or Scan QR Code',
  verify: 'Verify',
  certificateValid: 'This certificate is valid',
  certificateInvalid: 'This certificate is not valid',
  certificateRevoked: 'This certificate has been revoked',
  certificateExpired: 'This certificate has expired',
  certificateNotRecognized: 'Certificate not recognized',

  // Dashboard
  myDashboard: 'My Dashboard',
  myProfile: 'My Profile',
  inProgress: 'In Progress',
  completed: 'Completed',
  viewResults: 'View Results',
  myCertificates: 'My Certificates',
  downloadAll: 'Download All',
  assessmentHistory: 'Assessment History',

  // Admin
  adminPanel: 'Admin Panel',
  analytics: 'Analytics',
  manageDomains: 'Manage Domains',
  manageCertifications: 'Manage Certifications',
  manageQuestions: 'Manage Questions',
  reviewAttempts: 'Review Attempts',
  issueCertificates: 'Issue Certificates',
  revokeCertificate: 'Revoke Certificate',
  totalUsers: 'Total Users',
  totalAttempts: 'Total Attempts',
  totalCertificates: 'Total Certificates',
  passRate: 'Pass Rate',

  // Common
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  confirm: 'Confirm',
  delete: 'Delete',
  edit: 'Edit',
  save: 'Save',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  noDataAvailable: 'No data available',
  somethingWentWrong: 'Something went wrong. Please try again.',

  // Language
  language: 'Language',
  english: 'English',
  hindi: 'हिंदी',
  selectLanguage: 'Select Language',

  // Layout — header & footer chrome
  navGetCertified: 'Get certified',
  navGreeting: 'Hi',
  navToggle: 'Toggle navigation',
  navPrimary: 'Primary',
  navVerify: 'Verify a certificate',
  navSignIn: 'Sign in',
  navSignOut: 'Sign out',
  navCreateAccount: 'Create account',
  footerHowItWorks: 'How it works',
  navAdmin: 'Admin',
  footerTagline:
    'Free, objective skill assessments with verifiable digital certificates for learners across India.',
  footerPlatform: 'Platform',
  footerDirectory: 'Certification directory',
  footerTrust: 'Trust',
  footerStep1: 'Choose a skill',
  footerStep2: 'Take the timed assessment',
  footerStep3: 'Earn a verifiable certificate',
  footerTrust1: 'Scoring computed server-side',
  footerTrust2: 'Unique, non-guessable certificate IDs',
  footerTrust3: 'Public verification, no login needed',
  footerLegal:
    'Certificates are issued for skill demonstration and are not a government or university qualification.',
  localBackendNotice:
    'Local demo backend — data is stored in your browser. Configure Supabase to use the hosted database.',
};

export const HI_TRANSLATIONS: Translations = {
  // Navigation & Layout
  appName: 'आरोग्य इंडिया गुरुकुल',
  home: 'होम',
  certifications: 'प्रमाणपत्र',
  directory: 'निर्देशिका',
  dashboard: 'डैशबोर्ड',
  logout: 'लॉगआउट',
  login: 'लॉगिन',
  register: 'पंजीकरण',
  profile: 'प्रोफाइल',

  // Home page
  heroTitle: 'अपने कौशल को साबित करें। विश्वास अर्जित करें।',
  heroSubtitle: 'वस्तुनिष्ठ आयुर्वेद आकलन और स्वतंत्र रूप से सत्यापन-योग्य प्रमाणपत्र।',
  searchPlaceholder: 'प्रमाणपत्र खोजें...',
  browseByCategory: 'श्रेणी के अनुसार ब्राउज़ करें',
  featuredCertifications: 'विशेष प्रमाणपत्र',
  howItWorks: 'यह कैसे काम करता है',
  benefits: 'लाभ',
  faq: 'अक्सर पूछे जाने वाले प्रश्न',
  startLearning: 'सीखना शुरू करें',

  // Directory
  allCertifications: 'सभी प्रमाणपत्र',
  filterByDomain: 'डोमेन के अनुसार फ़िल्टर करें',
  sortBy: 'के अनुसार क्रमबद्ध करें',
  sortByPopular: 'सबसे लोकप्रिय',
  sortByNewest: 'नवीनतम',
  sortByAZ: 'ए – जेड',
  noCertificationsFound: 'कोई प्रमाणपत्र नहीं मिला। कोई भिन्न खोज प्रयास करें।',

  // Certification Detail
  eligibility: 'पात्रता',
  duration: 'अवधि',
  passingScore: 'पास करने वाला स्कोर',
  topics: 'कवर किए गए विषय',
  startAssessment: 'आकलन शुरू करें',
  backToDirectory: 'निर्देशिका पर वापस',

  // Assessment
  startAssessmentTitle: 'अपना आकलन शुरू करें',
  enterYourName: 'अपना पूरा नाम दर्ज करें',
  acceptRules: 'आकलन नियम',
  rulesText: 'आपको एक ही बैठक में आकलन पूरा करना होगा। आप रुक नहीं सकते या बाहर निकल नहीं सकते और बाद में फिर से शुरू नहीं कर सकते। आपके उत्तर स्वचालित रूप से सहेजे जाते हैं।',
  iAcceptTheRules: 'मैं नियमों को स्वीकार करता हूँ',
  beginAssessment: 'आकलन शुरू करें',
  question: 'प्रश्न',
  of: 'का',
  timer: 'शेष समय',
  markForReview: 'समीक्षा के लिए चिह्नित करें',
  markedForReview: 'समीक्षा के लिए चिह्नित',
  nextQuestion: 'अगला',
  previousQuestion: 'पिछला',
  reviewAnswers: 'उत्तरों की समीक्षा करें',
  submitAssessment: 'आकलन जमा करें',
  confirmSubmit: 'आकलन जमा करें?',
  confirmSubmitText: 'एक बार जमा करने के बाद, आप अपने उत्तर नहीं बदल सकते। क्या आप निश्चित हैं?',
  cancel: 'रद्द करें',
  submit: 'जमा करें',
  timeUp: 'समय समाप्त! आपका आकलन जमा कर दिया गया है।',
  autoSubmitting: 'जमा किया जा रहा है...',

  // Results
  resultsTitle: 'आपके परिणाम',
  congratulations: 'बधाई हो!',
  youPassed: 'आप पास हो गए!',
  youDidNotPass: 'आप पास नहीं हुए',
  yourScore: 'आपका स्कोर',
  scorePercentage: 'प्रतिशत',
  level: 'स्तर',
  topicBreakdown: 'विषय के अनुसार विभाजन',
  strengths: 'आपकी शक्तियाँ',
  areasForImprovement: 'सुधार के क्षेत्र',
  recommendations: 'सिफारिशें',
  getCertificate: 'अपना प्रमाणपत्र प्राप्त करें',
  tryAgain: 'फिर से प्रयास करें',
  backToDashboard: 'डैशबोर्ड पर वापस',

  // Certificate
  certificate: 'प्रमाणपत्र',
  certificateNo: 'प्रमाणपत्र संख्या',
  certificateIssued: 'प्रमाणपत्र जारी किया गया',
  issueDate: 'जारी करने की तारीख',
  score: 'स्कोर',
  verifyOnline: 'ऑनलाइन सत्यापित करें',
  downloadPDF: 'पीडीएफ डाउनलोड करें',
  shareLink: 'लिंक साझा करें',
  copied: 'क्लिपबोर्ड पर कॉपी किया गया!',

  // Verification
  verifyCertificate: 'प्रमाणपत्र सत्यापित करें',
  enterCertificateID: 'प्रमाणपत्र आईडी दर्ज करें या QR कोड स्कैन करें',
  verify: 'सत्यापित करें',
  certificateValid: 'यह प्रमाणपत्र वैध है',
  certificateInvalid: 'यह प्रमाणपत्र वैध नहीं है',
  certificateRevoked: 'यह प्रमाणपत्र निरस्त कर दिया गया है',
  certificateExpired: 'यह प्रमाणपत्र समाप्त हो गया है',
  certificateNotRecognized: 'प्रमाणपत्र मान्यता प्राप्त नहीं है',

  // Dashboard
  myDashboard: 'मेरा डैशबोर्ड',
  myProfile: 'मेरी प्रोफाइल',
  inProgress: 'चल रहा है',
  completed: 'पूर्ण',
  viewResults: 'परिणाम देखें',
  myCertificates: 'मेरे प्रमाणपत्र',
  downloadAll: 'सभी डाउनलोड करें',
  assessmentHistory: 'आकलन इतिहास',

  // Admin
  adminPanel: 'प्रशासन पैनल',
  analytics: 'विश्लेषण',
  manageDomains: 'डोमेन प्रबंधित करें',
  manageCertifications: 'प्रमाणपत्र प्रबंधित करें',
  manageQuestions: 'प्रश्न प्रबंधित करें',
  reviewAttempts: 'प्रयासों की समीक्षा करें',
  issueCertificates: 'प्रमाणपत्र जारी करें',
  revokeCertificate: 'प्रमाणपत्र निरस्त करें',
  totalUsers: 'कुल उपयोगकर्ता',
  totalAttempts: 'कुल प्रयास',
  totalCertificates: 'कुल प्रमाणपत्र',
  passRate: 'पास दर',

  // Common
  loading: 'लोड हो रहा है...',
  error: 'त्रुटि',
  success: 'सफलता',
  confirm: 'पुष्टि करें',
  delete: 'हटाएं',
  edit: 'संपादित करें',
  save: 'सहेजें',
  close: 'बंद करें',
  back: 'पिछला',
  next: 'अगला',
  noDataAvailable: 'कोई डेटा उपलब्ध नहीं है',
  somethingWentWrong: 'कुछ गलत हुआ। कृपया फिर से प्रयास करें।',

  // Language
  language: 'भाषा',
  english: 'English',
  hindi: 'हिंदी',
  selectLanguage: 'भाषा चुनें',

  // Layout — header & footer chrome
  navGetCertified: 'प्रमाणित बनें',
  navGreeting: 'नमस्ते',
  navToggle: 'नेविगेशन खोलें या बंद करें',
  navPrimary: 'मुख्य',
  navVerify: 'प्रमाणपत्र सत्यापित करें',
  navSignIn: 'साइन इन करें',
  navSignOut: 'साइन आउट करें',
  navCreateAccount: 'खाता बनाएँ',
  footerHowItWorks: 'यह कैसे काम करता है',
  navAdmin: 'प्रशासन',
  footerTagline:
    'पूरे भारत के शिक्षार्थियों के लिए नि:शुल्क, वस्तुनिष्ठ कौशल आकलन और सत्यापन-योग्य डिजिटल प्रमाणपत्र।',
  footerPlatform: 'प्लेटफ़ॉर्म',
  footerDirectory: 'प्रमाणपत्र निर्देशिका',
  footerTrust: 'विश्वास',
  footerStep1: 'एक कौशल चुनें',
  footerStep2: 'समयबद्ध आकलन दें',
  footerStep3: 'सत्यापन-योग्य प्रमाणपत्र पाएँ',
  footerTrust1: 'मूल्यांकन सर्वर पर किया जाता है',
  footerTrust2: 'विशिष्ट, अनुमान-रहित प्रमाणपत्र आईडी',
  footerTrust3: 'सार्वजनिक सत्यापन, लॉगिन की आवश्यकता नहीं',
  footerLegal:
    'प्रमाणपत्र कौशल प्रदर्शन के लिए जारी किए जाते हैं और ये किसी सरकारी या विश्वविद्यालय की योग्यता नहीं हैं।',
  localBackendNotice:
    'स्थानीय डेमो बैकएंड — डेटा आपके ब्राउज़र में संग्रहीत है। होस्टेड डेटाबेस उपयोग करने के लिए Supabase कॉन्फ़िगर करें।',
};

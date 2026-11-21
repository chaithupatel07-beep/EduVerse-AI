/**
 * EduVerse AI - Centralized Multilingual Localization Service (Phase 4)
 * Full support for English, Telugu (తెలుగు), and Hindi (हिंदी)
 */

export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  native: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation & Common
    app_title: 'EduVerse AI',
    app_subtitle: 'Intelligent, Personalized & Collaborative Education Ecosystem',
    dashboard: 'Dashboard',
    profile: 'Profile',
    logout: 'Sign Out',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    language: 'Language',

    // Parent AI Assistant
    parent_ai_title: 'Parent AI Assistant',
    parent_ai_subtitle: 'Ask questions about your child\'s performance, attendance, and assignments in English, Telugu, or Hindi.',
    select_child: 'Select Child',
    child_performance_summary: 'Child Performance Telemetry',
    attendance_rate: 'Attendance Rate',
    pending_assignments: 'Pending Assignments',
    avg_score: 'Average Score',
    suggested_questions: 'Suggested Inquiries',
    type_message_placeholder: 'Type your academic inquiry here...',
    ask_ai_btn: 'Send to AI',
    verified_data_badge: 'Verified Institution Records Grounded',
    clear_chat: 'Clear History',

    // Communication Hub
    communication_hub: 'Parent-Teacher-Management Communication Hub',
    new_inquiry: 'New Inquiry',
    category: 'Category',
    teacher: 'Teacher',
    management: 'Management',
    subject: 'Subject',
    message: 'Message',
    send_inquiry: 'Send Inquiry',
    thread_status: 'Thread Status',
    translate_message: 'Translate Message',
    translating: 'Translating...',
    original_message: 'Original Message',
    reply_placeholder: 'Write a response...',
    send_reply: 'Send Reply',
    mark_resolved: 'Mark as Resolved',

    // Roles
    role_student: 'Student',
    role_teacher: 'Teacher',
    role_parent: 'Parent',
    role_admin: 'Institution Administrator',

    // Features
    ai_study_companion: 'AI Study Companion',
    ai_educator_copilot: 'AI Educator Copilot',
    lesson_planner: 'Lesson Planner',
    quiz_generator: 'Practice Quiz Generator',
    source_citations: 'Source Citations & RAG Grounding',

    // Phase 5 Personalization
    personalized_learning: 'Personalized Learning Hub',
    knowledge_gaps: 'Identified Knowledge Gaps',
    study_plans: 'Personalized Study Plans',
    recommendations: 'Recommended Study Resources',
    adaptive_practice: 'Adaptive Learning Calibration',
    child_learning_insights: 'Child Learning Insights',
  },
  te: {
    // Navigation & Common
    app_title: 'ఎడువర్స్ AI',
    app_subtitle: 'జెనరేటివ్ AI ఆధారిత ఇంటెలిజెంట్ విద్యా పర్యావరణ వ్యవస్థ',
    dashboard: 'డాష్‌బోర్డ్',
    profile: 'ప్రొఫైల్',
    logout: 'లాగ్ అవుట్',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    loading: 'లోడ్ అవుతోంది...',
    status: 'స్థితి',
    date: 'తేదీ',
    actions: 'చర్యలు',
    language: 'భాష',

    // Parent AI Assistant
    parent_ai_title: 'పేరెంట్ AI సహాయకుడు',
    parent_ai_subtitle: 'మీ పిల్లల చదువు, హాజరు, అసైన్మెంట్లపై తెలుగులో ప్రశ్నలు అడగండి.',
    select_child: 'విద్యార్థిని ఎంచుకోండి',
    child_performance_summary: 'విద్యార్థి విద్యా ప్రగతి వివరాలు',
    attendance_rate: 'హాజరు శాతం',
    pending_assignments: 'పెండింగ్ అసైన్మెంట్లు',
    avg_score: 'సగటు మార్కులు',
    suggested_questions: 'సిఫార్సు చేసిన ప్రశ్నలు',
    type_message_placeholder: 'మీ విద్యా సంబంధిత ప్రశ్నను ఇక్కడ రాయండి...',
    ask_ai_btn: 'AI కి పంపండి',
    verified_data_badge: 'ధృవీకరించబడిన సంస్థ రికార్డుల ఆధారంగా రూపొందించబడింది',
    clear_chat: 'చాట్ క్లియర్ చేయండి',

    // Communication Hub
    communication_hub: 'తల్లిదండ్రులు - ఉపాధ్యాయులు - నిర్వహణ సంభాషణ వేదిక',
    new_inquiry: 'కొత్త సందేహం / ప్రశ్న',
    category: 'వర్గం',
    teacher: 'ఉపాధ్యాయుడు',
    management: 'నిర్వహణ',
    subject: 'విషయం',
    message: 'సందేశం',
    send_inquiry: 'సందేశం పంపండి',
    thread_status: 'సందేశ స్థితి',
    translate_message: 'తెలుగులోకి అనువదించండి',
    translating: 'అనువదిస్తోంది...',
    original_message: 'అసలు సందేశం',
    reply_placeholder: 'సమాధానం రాయండి...',
    send_reply: 'సమాధానం పంపండి',
    mark_resolved: 'పరిష్కరించబడినట్లు గుర్తించండి',

    // Roles
    role_student: 'విద్యార్థి',
    role_teacher: 'ఉపాధ్యాయుడు',
    role_parent: 'తల్లిదండ్రులు',
    role_admin: 'సంస్థ నిర్వాహకుడు',

    // Features
    ai_study_companion: 'AI అభ్యాస సహాయకుడు',
    ai_educator_copilot: 'ఉపాధ్యాయ AI సహాయకుడు',
    lesson_planner: 'పాఠ్య ప్రణాళిక రూపకర్త',
    quiz_generator: 'పరీక్షా ప్రశ్నల రూపకర్త',
    source_citations: 'మూల గ్రంథ సూచనలు & RAG ఆధారాలు',

    // Phase 5 Personalization
    personalized_learning: 'వ్యక్తిగతీకరించిన అభ్యాస కేంద్రం',
    knowledge_gaps: 'గుర్తించిన జ్ఞాన అంతరాలు',
    study_plans: 'వ్యక్తిగత అధ్యయన ప్రణాళికలు',
    recommendations: 'సిఫార్సు చేయబడిన అధ్యయన వనరులు',
    adaptive_practice: 'అడాప్టివ్ లెర్నింగ్ ప్రాక్టీస్',
    child_learning_insights: 'పిల్లల అభ్యాస అంతర్దృష్టులు',
  },
  hi: {
    // Navigation & Common
    app_title: 'एडुवर्स एआई',
    app_subtitle: 'जेनरेटिव एआई आधारित आधुनिक एवं समावेशी शिक्षा प्रणाली',
    dashboard: 'डैशबोर्ड',
    profile: 'प्रोफाइल',
    logout: 'लॉग आउट',
    save: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    status: 'स्थिति',
    date: 'दिनांक',
    actions: 'क्रियाएँ',
    language: 'भाषा',

    // Parent AI Assistant
    parent_ai_title: 'पेरेंट एआई सहायक',
    parent_ai_subtitle: 'अपने बच्चे की पढ़ाई, उपस्थिति और असाइनमेंट से जुड़े प्रश्न हिंदी में पूछें।',
    select_child: 'बच्चे का चयन करें',
    child_performance_summary: 'शैक्षणिक प्रदर्शन विवरण',
    attendance_rate: 'उपस्थिति दर',
    pending_assignments: 'लंबित असाइनमेंट',
    avg_score: 'औसत अंक',
    suggested_questions: 'सुझाए गए प्रश्न',
    type_message_placeholder: 'अपना प्रश्न यहाँ लिखें...',
    ask_ai_btn: 'एआई से पूछें',
    verified_data_badge: 'संस्थान के सत्यापित रिकॉर्ड पर आधारित',
    clear_chat: 'चैट मिटाएं',

    // Communication Hub
    communication_hub: 'अभिभावक - शिक्षक - प्रबंधन संवाद केंद्र',
    new_inquiry: 'नया प्रश्न / संदेश',
    category: 'श्रेणी',
    teacher: 'शिक्षक',
    management: 'प्रबंधन',
    subject: 'विषय',
    message: 'संदेश',
    send_inquiry: 'संदेश भेजें',
    thread_status: 'वार्तालाप स्थिति',
    translate_message: 'हिंदी में अनुवाद करें',
    translating: 'अनुवाद हो रहा है...',
    original_message: 'मूल संदेश',
    reply_placeholder: 'उत्तर लिखें...',
    send_reply: 'उत्तर भेजें',
    mark_resolved: 'समाधान के रूप में चिह्नित करें',

    // Roles
    role_student: 'विद्यार्थी',
    role_teacher: 'शिक्षक',
    role_parent: 'अभिभावक',
    role_admin: 'संस्थान प्रशासक',

    // Features
    ai_study_companion: 'एआई अध्ययन साथी',
    ai_educator_copilot: 'शिक्षक एआई सहायक',
    lesson_planner: 'पाठ योजना निर्माता',
    quiz_generator: 'अभ्यास प्रश्नोत्तरी निर्माता',
    source_citations: 'स्रोतों के संदर्भ एवं आरएजी प्रमाण',

    // Phase 5 Personalization
    personalized_learning: 'व्यक्तिगत शिक्षण केंद्र',
    knowledge_gaps: 'पहचाने गए ज्ञान अंतराल',
    study_plans: 'व्यक्तिगत अध्ययन योजनाएं',
    recommendations: 'अनुशंसित अध्ययन सामग्री',
    adaptive_practice: 'अनुकूली अभ्यास सत्र',
    child_learning_insights: 'बच्चे की सीखने की अंतर्दृष्टि',
  },
};

const STORAGE_KEY = 'eduverse_preferred_language';

export const languageService = {
  getCurrentLanguage(): SupportedLanguage {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved && ['en', 'te', 'hi'].includes(saved)) {
      return saved;
    }
    return 'en';
  },

  setLanguage(lang: SupportedLanguage): void {
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  },

  t(key: string, lang?: SupportedLanguage): string {
    const currentLang = lang || this.getCurrentLanguage();
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  },
};

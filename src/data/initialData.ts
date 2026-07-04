export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicName: string;
  address: string;
  phone: string;
  whatsapp?: string;
  createdAt: string;
  hidden?: boolean;
  showOnHome?: boolean;
  showInSearch?: boolean;
  isPinned?: boolean;
  displayOrder?: number;
  isFeatured?: boolean;
  isPaidAd?: boolean;
  expiryDate?: string;
  isVerified?: boolean;
  pinDuration?: '7' | '30' | '90' | 'permanent';
  pinExpiryDate?: string;
  servicesProvided?: string[];
  startDay?: string;
  endDay?: string;
  openHour?: string;
  closeHour?: string;
  daysOff?: string[];
  packageTier?: 'normal' | 'silver' | 'gold' | 'diamond';
  lastUpdated?: string;
  village?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp?: string;
  createdAt: string;
  hidden?: boolean;
  showOnHome?: boolean;
  showInSearch?: boolean;
  isPinned?: boolean;
  displayOrder?: number;
  isFeatured?: boolean;
  isPaidAd?: boolean;
  expiryDate?: string;
  isVerified?: boolean;
  pinDuration?: '7' | '30' | '90' | 'permanent';
  pinExpiryDate?: string;
  servicesProvided?: string[];
  startDay?: string;
  endDay?: string;
  openHour?: string;
  closeHour?: string;
  daysOff?: string[];
  packageTier?: 'normal' | 'silver' | 'gold' | 'diamond';
  lastUpdated?: string;
  village?: string;
}

export interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp?: string;
  createdAt: string;
  hidden?: boolean;
  showOnHome?: boolean;
  showInSearch?: boolean;
  isPinned?: boolean;
  displayOrder?: number;
  isFeatured?: boolean;
  isPaidAd?: boolean;
  expiryDate?: string;
  isVerified?: boolean;
  pinDuration?: '7' | '30' | '90' | 'permanent';
  pinExpiryDate?: string;
  servicesProvided?: string[];
  startDay?: string;
  endDay?: string;
  openHour?: string;
  closeHour?: string;
  daysOff?: string[];
  packageTier?: 'normal' | 'silver' | 'gold' | 'diamond';
  lastUpdated?: string;
  village?: string;
}

export interface Ad {
  id: string;
  title?: string; // Optional title for backward compatibility
  content: string;
  link?: string;
  position: string; // e.g. 'top' | 'bottom' | 'before_doctors' | 'after_doctors' | 'before_pharmacies' | 'after_pharmacies' | 'before_labs' | 'after_labs'
  displayOrder: number;
  duration: number; // Duration in seconds
  backgroundColor: string; // Hex color e.g. #059669
  textColor: string; // Hex color e.g. #ffffff
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string; // 'إضافة' | 'تعديل' | 'حذف'
  type: 'doctor' | 'pharmacy' | 'lab' | 'specialty' | 'ad' | 'system' | 'backup';
  details: string;
}

export interface HomePageConfig {
  heroTitle: string;
  heroSubtitle: string;
  tickerSpeed: number; // in seconds
  
  // Custom Site Settings (Content, Logo, Brand, etc.)
  siteName?: string;
  siteLogoIcon?: string; // Icon identifier or generic
  siteLogoText?: string;
  themeColor?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'indigo' | 'slate';
  themeBackground?: 'light' | 'neutral' | 'warm' | 'dark';
  
  // Pages Contents
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutText?: string; // Plain text or markdown
  
  contactTitle?: string;
  contactSubtitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactWorkingHours?: string;
  
  // Social Links
  socialFacebook?: string;
  socialWhatsapp?: string;
  socialYoutube?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  
  privacyTitle?: string;
  privacyText?: string;
  
  termsTitle?: string;
  termsText?: string;
  
  // Sections Control (Visibility & Order)
  sectionsOrder?: string[]; // e.g. ['ticker', 'top-ad', 'hero', 'search', 'services', 'middle-ad', 'stats', 'featured']
  disabledSections?: string[]; // list of sections that are disabled
  
  // Paid Ads Carousel / Static Control
  paidAdsDisplayType?: 'static' | 'carousel';
  paidAdsSpeed?: number; // in seconds
  
  // Password Configuration
  adminPassword?: string;
}

export type NotificationType = 'general' | 'alert' | 'update' | 'promo' | 'maintenance';
export type NotificationPriority = 'high' | 'normal' | 'low';

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  isActive: boolean;
  isPinned: boolean;
  priority: NotificationPriority;
  startAt: string; // ISO String
  endAt: string; // ISO String
  createdAt: string; // ISO String
}

export interface RequestHistory {
  timestamp: string;
  status: string;
  updatedBy: string;
  notes?: string;
}

export interface DoctorRequest {
  id: string;
  serviceType: 'doctor' | 'pharmacy' | 'lab' | 'scan_center' | 'hospital' | 'physiotherapy' | 'other';
  name: string; // Represents Doctor's name, Pharmacy's name, Lab's name, Center's name, Hospital's name, or Service's name
  
  // Specific name aliases requested for cleaner Firestore documents
  doctorName?: string;
  pharmacyName?: string;
  labName?: string;
  hospitalName?: string;
  radiologyCenterName?: string;
  physiotherapyCenterName?: string;

  // Specialty fields
  specialty?: string; // used for doctor
  clinicName?: string; // used for doctor (optional)
  pharmacistName?: string; // used for pharmacy (optional)
  shortDescription?: string; // used for other services
  
  address: string;
  phone: string;
  governorate: string; // default "قنا"
  center: string; // default "الوقف"
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'contacting' | 'reviewing_data' | 'incomplete_data' | 'awaiting_completion' | 'accepted' | 'published' | 'rejected' | 'cancelled' | 'archived';
  rejectionReason?: string;
  adminNotes?: string;
  history?: RequestHistory[];
}

export interface ContactMessage {
  id?: string; // Optional helper for list operations if needed
  messageId: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  createdAt: string;
  updatedAt: string;
}


export const INITIAL_SPECIALTIES: string[] = [
  'أطفال وحديثي الولادة',
  'باطنة عامة وجهاز هضمي',
  'نساء وتوليد وعقم',
  'عظام ومفاصل',
  'طبيب أسنان',
  'قلب وأوعية دموية',
  'جلدية وتناسلية وتجميل',
  'جراحة عامة وأورام',
  'مخ وأعصاب',
  'أنف وأذن وحنجرة',
  'عيون ورمد',
  'مسالك بولية وتناسلية'
];

export const INITIAL_DOCTORS: Doctor[] = [];

export const INITIAL_PHARMACIES: Pharmacy[] = [];

export const INITIAL_LABS: Lab[] = [];

export const INITIAL_ADS: Ad[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_HOME_CONFIG: HomePageConfig = {
  heroTitle: 'دليل الوقف الطبي الإلكتروني',
  heroSubtitle: 'بوابتك السريعة والموثوقة للوصول إلى كافة الأطباء، الصيدليات، ومعامل التحاليل بمركز الوقف، محافظة قنا.',
  tickerSpeed: 4,
  
  siteName: 'دليل الوقف الطبي بالوقف',
  siteLogoIcon: 'HeartPulse',
  siteLogoText: 'دليل الوقف الطبي',
  themeColor: 'emerald',
  themeBackground: 'light',
  
  aboutTitle: 'من نحن - دليل الوقف الطبي',
  aboutSubtitle: 'دليلك الصحي المعتمد لمركز الوقف، محافظة قنا',
  aboutText: `**دليل الوقف الطبي** هو دليل إلكتروني خدمي مجاني تم إطلاقه خصيصاً لخدمة وتسهيل وصول أهالي مركز الوقف بمحافظة قنا والقرى المجاورة إلى الرعاية الصحية المطلوبة في أسرع وقت.

نسعى باستمرار لتطوير وتحديث الدليل، وإدراج أحدث عيادات الأطباء في مختلف التخصصات، والصيدليات العاملة طوال الـ 24 ساعة، بجانب أفضل معامل التحاليل الطبية والاشعة، لمساعدة المواطن الوقفي في تلبية احتياجاته الطبية دون عناء التنقل والبحث العشوائي.

**أهدافنا الأساسية:**
- تجميع وتدقيق بيانات الأطباء والصيدليات والمعامل بمركز الوقف في مكان واحد وسريع.
- تقديم واجهات تصفح عربية بالكامل وسلسة التصفح من مختلف الأجهزة الذكية والكمبيوتر.
- تنظيم المساحات الإعلانية لخدمات الرعاية الصحية ودعم استمرارية تطوير وتحديث الدليل مجاناً للمواطنين.`,
  
  contactTitle: 'اتصل بنا',
  contactSubtitle: 'يسعدنا تلقي اقتراحاتكم، طلبات إضافة عياداتكم، أو الاستفسار عن المساحات الإعلانية المتاحة.',
  contactPhone: '+20 109 876 5432',
  contactEmail: 'support@waqfmedical.com',
  contactAddress: 'مركز الوقف، محافظة قنا، مصر',
  contactWorkingHours: 'ساعات عمل الدعم: من 9 صباحاً حتى 9 مساءً',
  
  socialFacebook: 'https://facebook.com/WaqfMedical',
  socialWhatsapp: 'https://wa.me/201098765432',
  socialYoutube: 'https://youtube.com/WaqfMedical',
  socialTwitter: '',
  socialInstagram: '',
  
  privacyTitle: 'سياسة الخصوصية',
  privacyText: `أهلاً بك في **دليل الوقف الطبي**. نحن نولي أهمية قصوى لخصوصية زوارنا ومستخدمينا الكرام.

**جمع واستخدام البيانات:**
- نحن لا نجمع أي بيانات شخصية حساسة من زوارنا دون علمهم.
- نستخدم ملفات تعريف الارتباط المحلية (LocalStorage) لتخزين تفضيلات المستخدم وجلسة لوحة التحكم فقط.
- البيانات المرسلة من خلال نموذج الاتصال أو نموذج طلب الإضافة تُعامل بسرية تامة ولا تُشارك مع أي طرف ثالث خارج نطاق مراجعة الإدارة للتحقق والتأكد من مطابقة الخدمة الطبية للمعايير.`,
  
  termsTitle: 'الشروط والأحكام',
  termsText: `باستخدامك لموقع **دليل الوقف الطبي**، فإنك توافق على الشروط والأحكام التالية:

**شروط استخدام الدليل:**
- هذا الدليل هو عمل خدمي خيري غير ربحي يهدف لتسهيل الوصول للأطباء والخدمات الطبية بمركز الوقف.
- تسعى الإدارة جاهدة للتحقق من صحة جميع البيانات وتحديثها دورياً، ومع ذلك، يرجى دائماً التأكد من مواعيد العمل وأسعار الكشف بشكل مباشر من مقدم الخدمة.
- يُمنع إساءة استخدام الدليل أو إرسال طلبات إضافة وهمية أو مضللة، وتحتفظ إدارة الدليل بكامل الحق في قبول أو رفض أو حذف أي إدراج طبي دون إبداء الأسباب.`,
  
  sectionsOrder: ['top-ad', 'hero', 'search', 'services', 'middle-ad', 'stats', 'featured'],
  disabledSections: [],
  paidAdsDisplayType: 'carousel',
  paidAdsSpeed: 4,
  
  adminPassword: '@Alhawi92682905'
};

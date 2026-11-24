/**
 * ============================================================================
 *  دروب الوطن — ملف المحتوى الموحّد
 * ============================================================================
 *  جميع النصوص والأرقام والأيقونات المعروضة في العرض التقديمي موجودة هنا.
 *  عدّل القيم أدناه وستنعكس مباشرة على الشرائح دون الحاجة لتعديل أي مكوّن.
 *
 *  ملاحظة: الأرقام المالية والنِّسب والغرامات الواردة هنا قيم استرشادية
 *  لأغراض العرض، ويمكن استبدالها بالأرقام المعتمدة لدى فريق المشروع.
 * ============================================================================
 */
import type { LucideIcon } from 'lucide-react';
import {
  AlarmClockOff,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bath,
  Briefcase,
  Building2,
  CalendarClock,
  CarFront,
  CircleDollarSign,
  ClipboardCheck,
  Coffee,
  Construction,
  Factory,
  Fuel,
  Gavel,
  Globe2,
  Handshake,
  HeartPulse,
  Landmark,
  Leaf,
  Lock,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  QrCode,
  Route,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Snowflake,
  Store,
  Timer,
  TrafficCone,
  Truck,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  Zap,
  FlameKindling,
  Container,
  Scale,
  TrendingDown,
  Gauge,
  Globe,
  Sparkles,
} from 'lucide-react';

/* ----------------------------------------------------------------------------
 *  الأنواع (Types)
 * ------------------------------------------------------------------------- */
export type Accent = 'green' | 'gold' | 'navy' | 'white';

export interface SlideHeader {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

export interface NavItem {
  id: SlideId;
  title: string;
}

export type SlideId =
  | 'title'
  | 'problem'
  | 'solution'
  | 'parking'
  | 'journey'
  | 'wallet'
  | 'governance'
  | 'revenue'
  | 'impact'
  | 'closing';

/* ----------------------------------------------------------------------------
 *  البيانات العامة للمشروع
 * ------------------------------------------------------------------------- */
export const projectMeta = {
  name: 'دروب الوطن',
  nameEn: 'Duroob Al-Watan',
  shortTagline: 'منصة النقل اللوجستي الذكي',
  confidentiality: 'عرض مؤسسي — نسخة للنقاش',
  year: '2026',
};

/* ----------------------------------------------------------------------------
 *  ترتيب الشرائح وعناوينها في شريط التنقل السفلي
 * ------------------------------------------------------------------------- */
export const slidesNav: NavItem[] = [
  { id: 'title', title: 'الغلاف الرئيسي' },
  { id: 'problem', title: 'المشكلة والتحديات' },
  { id: 'solution', title: 'الحل: منصة دروب الوطن' },
  { id: 'parking', title: 'مواقف الشاحنات الذكية' },
  { id: 'journey', title: 'رحلة الشاحنة وتصاريح QR' },
  { id: 'wallet', title: 'المحفظة الإلكترونية' },
  { id: 'governance', title: 'الحوكمة والرقابة' },
  { id: 'revenue', title: 'نموذج العوائد' },
  { id: 'impact', title: 'الأثر الوطني والاقتصادي' },
  { id: 'closing', title: 'الخاتمة والرؤية' },
];

/* ----------------------------------------------------------------------------
 *  الشريحة 1 — الغلاف
 * ------------------------------------------------------------------------- */
export const titleSlide = {
  kicker: 'مشروع وطني للنقل اللوجستي الذكي',
  title: 'دروب الوطن',
  titleEn: 'DUROOB AL-WATAN',
  subtitle: 'المنصة الوطنية الذكية لتنظيم النقل اللوجستي وإدارة حركة الشاحنات',
  badge: 'متوافق مع مستهدفات رؤية المملكة 2030',
  highlights: [
    { icon: CalendarClock, label: 'جدولة زمنية ذكية' },
    { icon: QrCode, label: 'تصاريح QR رقمية' },
    { icon: Wallet, label: 'محفظة مالية آمنة' },
    { icon: ShieldCheck, label: 'حوكمة ورقابة' },
  ],
  hint: 'استخدم الأسهم أو لوحة المفاتيح للتنقل • اضغط F لملء الشاشة',
};

/* ----------------------------------------------------------------------------
 *  الشريحة 2 — المشكلة والتحديات
 * ------------------------------------------------------------------------- */
export const problemSlide = {
  header: {
    eyebrow: 'الواقع الحالي',
    title: 'المشكلة والتحديات الحالية',
    subtitle: 'ثلاث فجوات رئيسية تُبطئ حركة البضائع وتُثقل كاهل المدن — اضغط على أي بطاقة لعرض التفاصيل.',
    icon: ShieldAlert,
  } satisfies SlideHeader,
  cards: [
    {
      id: 'congestion',
      icon: TrafficCone,
      accent: 'gold' as Accent,
      title: 'الازدحام المروري داخل المدن',
      summary: 'تداخل أوقات دخول الشاحنات مع ذروة حركة المركبات الخاصة.',
      stat: { value: '+40%', label: 'زيادة متوقعة في زمن الرحلة وقت الذروة' },
      details: [
        'دخول عشوائي للشاحنات في أوقات متزامنة دون تنسيق مسبق.',
        'تكدّس الشاحنات على أكتاف الطرق ومداخل الأحياء.',
        'ارتفاع الحوادث والانبعاثات وتآكل البنية التحتية.',
        'تأثير مباشر على جودة الحياة في المدن الكبرى.',
      ],
    },
    {
      id: 'scheduling',
      icon: AlarmClockOff,
      accent: 'green' as Accent,
      title: 'غياب الجدولة الزمنية الدقيقة',
      summary: 'لا توجد نوافذ زمنية محددة مسبقاً للتحميل والتفريغ والعبور.',
      stat: { value: 'أكثر من 6 ساعات', label: 'متوسط انتظار غير منتج للسائق' },
      details: [
        'اعتماد على الاتصالات الهاتفية والتنسيق اليدوي.',
        'ضياع ساعات عمل السائقين في الانتظار دون خدمات.',
        'عدم قدرة التاجر على التنبؤ بموعد وصول الشحنة.',
        'هدر في الوقود وتكاليف تشغيلية إضافية.',
      ],
    },
    {
      id: 'rights',
      icon: Scale,
      accent: 'white' as Accent,
      title: 'صعوبة ضبط المخالفات وحفظ الحقوق',
      summary: 'نزاعات مالية متكررة بين الشاحن والناقل والسائق.',
      stat: { value: '1 من 4', label: 'رحلات تنتهي بخلاف على المستحقات' },
      details: [
        'غياب سجل رقمي موثّق لكل رحلة من البداية للنهاية.',
        'تأخر صرف المستحقات وصعوبة إثبات التسليم.',
        'صعوبة رصد المخالفات وتحديد المسؤولية.',
        'ضعف الثقة بين أطراف منظومة النقل.',
      ],
    },
  ],
};

/* ----------------------------------------------------------------------------
 *  الشريحة 3 — الحل
 * ------------------------------------------------------------------------- */
export const solutionSlide = {
  header: {
    eyebrow: 'الحل المقترح',
    title: 'منصة «دروب الوطن»',
    subtitle: 'ربط رقمي شامل بين جميع أطراف النقل في تطبيق موحّد يضبط الحركة من نقطة الانطلاق وحتى الوصول.',
    icon: Route,
  } satisfies SlideHeader,
  hub: {
    title: 'دروب الوطن',
    caption: 'منصة رقمية موحّدة',
  },
  parties: [
    {
      id: 'shipper',
      icon: Store,
      title: 'الشاحن / التاجر',
      role: 'يطلب الشحنة ويحجز الموعد',
      benefits: ['حجز نافذة زمنية مضمونة', 'تتبّع لحظي للشحنة', 'دفع آمن عبر المحفظة', 'تقييم الناقلين'],
    },
    {
      id: 'carrier',
      icon: Truck,
      title: 'الناقل / السائق',
      role: 'ينفّذ الرحلة وفق الجدول',
      benefits: ['طلبات نقل مستمرة', 'مستحقات مضمونة وفورية', 'مواقف وخدمات مساندة', 'ملاحة ذكية للمسار'],
    },
    {
      id: 'regulator',
      icon: Landmark,
      title: 'الجهات الرقابية',
      role: 'تراقب وتنظّم وتطبّق الأنظمة',
      benefits: ['لوحة رقابة لحظية', 'رصد آلي للمخالفات', 'بيانات لدعم القرار', 'تكامل مع الأنظمة الحكومية'],
    },
  ],
  pillars: [
    { icon: CalendarClock, label: 'الجدولة' },
    { icon: QrCode, label: 'التصاريح' },
    { icon: MapPinned, label: 'التتبّع' },
    { icon: Wallet, label: 'الدفع' },
    { icon: ShieldCheck, label: 'الرقابة' },
  ],
};

/* ----------------------------------------------------------------------------
 *  الشريحة 4 — مواقف الشاحنات الذكية
 * ------------------------------------------------------------------------- */
export const parkingSlide = {
  header: {
    eyebrow: 'البنية التحتية',
    title: 'مواقف الشاحنات الذكية',
    subtitle: 'مواقف خارجية على مداخل المدن تنظّم الانتظار وتقدّم الخدمات المساندة قبل الدخول — اختر منطقة لاستكشافها.',
    icon: Truck,
  } satisfies SlideHeader,
  totalCapacity: 1000,
  capacityLabel: 'شاحنة — الطاقة الاستيعابية للموقف الواحد',
  /** مجموع السعات يجب أن يساوي totalCapacity */
  zones: [
    {
      id: 'A',
      name: 'المنطقة A — النقل الثقيل',
      icon: Truck,
      capacity: 450,
      color: '#D97706',
      description: 'شاحنات البضائع العامة والمقطورات الطويلة مع مسارات دخول وخروج منفصلة.',
    },
    {
      id: 'B',
      name: 'المنطقة B — الحاويات',
      icon: Container,
      capacity: 300,
      color: '#15803D',
      description: 'مخصّصة لشاحنات الحاويات القادمة من الموانئ والمنافذ البرية.',
    },
    {
      id: 'C',
      name: 'المنطقة C — المبرّدة',
      icon: Snowflake,
      capacity: 150,
      color: '#38BDF8',
      description: 'نقاط تزويد كهربائي لوحدات التبريد للحفاظ على سلسلة التبريد للأغذية والأدوية.',
    },
    {
      id: 'D',
      name: 'المنطقة D — المواد الخطرة',
      icon: FlameKindling,
      capacity: 100,
      color: '#EF4444',
      description: 'منطقة معزولة بمعايير سلامة عالية وفرق استجابة للطوارئ.',
    },
  ],
  services: [
    { icon: Fuel, label: 'محطة وقود' },
    { icon: Wrench, label: 'صيانة سريعة' },
    { icon: Coffee, label: 'مطاعم واستراحات' },
    { icon: Bath, label: 'دورات مياه ومصلى' },
    { icon: HeartPulse, label: 'إسعافات أولية' },
    { icon: Zap, label: 'شحن كهربائي' },
  ],
  flow: [
    { icon: Route, label: 'الطريق السريع' },
    { icon: ScanLine, label: 'بوابة التحقق' },
    { icon: MapPin, label: 'الموقف الذكي' },
    { icon: QrCode, label: 'تصريح الدخول' },
    { icon: Building2, label: 'المدينة' },
  ],
};

/* ----------------------------------------------------------------------------
 *  الشريحة 5 — رحلة الشاحنة ونظام تصاريح QR
 * ------------------------------------------------------------------------- */
export const journeySlide = {
  header: {
    eyebrow: 'تجربة المستخدم',
    title: 'رحلة الشاحنة ونظام تصاريح QR الذكية',
    subtitle: 'أربع خطوات رقمية تحوّل الدخول العشوائي إلى حركة منظّمة — اضغط على أي خطوة.',
    icon: QrCode,
  } satisfies SlideHeader,
  autoplayLabel: 'تشغيل تلقائي',
  steps: [
    {
      icon: Smartphone,
      title: 'الحجز الزمني عبر التطبيق',
      short: 'الحجز',
      description: 'يختار الناقل نافذة زمنية متاحة للدخول، ويُربط الحجز برقم المركبة وهوية السائق وبيانات الشحنة.',
      points: ['اختيار الموقف والنافذة الزمنية', 'ربط الحجز بالمركبة والسائق', 'سداد رسوم الحجز من المحفظة'],
      metric: { value: 'أقل من دقيقتين', label: 'زمن إتمام الحجز' },
    },
    {
      icon: ScanLine,
      title: 'الوصول للموقف الخارجي والتحقق الآلي',
      short: 'التحقق',
      description: 'كاميرات قراءة اللوحات وأنظمة التحقق تطابق المركبة والسائق مع الحجز وتتحقق من الأهلية آلياً.',
      points: ['قراءة آلية للوحة المركبة (ANPR)', 'مطابقة هوية السائق ورخصته', 'فحص صلاحية الفحص الدوري والتأمين'],
      metric: { value: '30 ثانية', label: 'زمن التحقق الآلي' },
    },
    {
      icon: QrCode,
      title: 'إصدار تصريح دخول QR ذكي بوقت محدد',
      short: 'التصريح',
      description: 'يصدر تصريح رقمي مشفّر صالح لنافذة زمنية ومسار محددين، ويُرسل لتطبيق السائق فوراً.',
      points: ['رمز QR مشفّر وغير قابل للتكرار', 'صلاحية مرتبطة بالوقت والمسار', 'إلغاء تلقائي عند انتهاء المدة'],
      metric: { value: '100%', label: 'تصاريح رقمية بلا ورق' },
    },
    {
      icon: Building2,
      title: 'العبور عبر البوابات الذكية والدخول المنظم',
      short: 'العبور',
      description: 'تقرأ البوابات الذكية رمز التصريح وتسمح بالعبور، مع تتبّع المسار داخل المدينة حتى نقطة التسليم.',
      points: ['عبور دون توقف عبر البوابات', 'تتبّع لحظي للمسار المعتمد', 'إغلاق الرحلة وتحرير المستحقات'],
      metric: { value: '0', label: 'دخول عشوائي في أوقات الذروة' },
    },
  ],
  permitSample: {
    title: 'تصريح دخول ذكي',
    plate: 'أ ب ج 1234',
    window: '02:00 — 04:00 ص',
    gate: 'بوابة الشمال — 3',
    status: 'ساري',
  },
};

/* ----------------------------------------------------------------------------
 *  الشريحة 6 — المحفظة الإلكترونية
 * ------------------------------------------------------------------------- */
export const walletSlide = {
  header: {
    eyebrow: 'الثقة المالية',
    title: 'المحفظة الإلكترونية وضمان الحقوق',
    subtitle: 'تُحفظ المستحقات في حساب ضمان، وتُصرف آلياً عند إتمام الرحلة ومطابقة الشروط — فعّل الشروط لمشاهدة الصرف.',
    icon: Wallet,
  } satisfies SlideHeader,
  currency: 'ر.س',
  tripAmount: 4800,
  escrowLabel: 'حساب الضمان (Escrow)',
  payer: { icon: Store, title: 'الشاحن / التاجر', caption: 'يودع قيمة الرحلة مسبقاً' },
  conditions: [
    { id: 'arrival', icon: MapPin, label: 'الوصول ضمن النافذة الزمنية' },
    { id: 'delivery', icon: ClipboardCheck, label: 'تأكيد استلام الشحنة رقمياً' },
    { id: 'compliance', icon: BadgeCheck, label: 'عدم وجود مخالفات مسجّلة' },
  ],
  /** نسب التوزيع — يجب أن يكون مجموعها 100 */
  payouts: [
    { icon: Truck, title: 'الناقل', share: 82, color: '#15803D' },
    { icon: UserCheck, title: 'السائق (حوافز)', share: 10, color: '#22C55E' },
    { icon: Landmark, title: 'رسوم المنصة', share: 8, color: '#D97706' },
  ],
  guarantees: [
    { icon: Lock, label: 'تشفير بمعايير مصرفية' },
    { icon: Timer, label: 'صرف فوري خلال دقائق' },
    { icon: Gavel, label: 'آلية تسوية نزاعات موثّقة' },
  ],
};

/* ----------------------------------------------------------------------------
 *  الشريحة 7 — الحوكمة والرقابة والغرامات
 * ------------------------------------------------------------------------- */
export const governanceSlide = {
  header: {
    eyebrow: 'الانضباط والامتثال',
    title: 'الحوكمة، الرقابة، والغرامات الرادعة',
    subtitle: 'اشتراطات واضحة لكل فئة، ورقابة آلية صارمة على أهلية المركبات والسائقين.',
    icon: Gavel,
  } satisfies SlideHeader,
  categories: [
    { id: 'public', label: 'النقل العام', icon: Truck },
    { id: 'private', label: 'النقل الخاص', icon: Factory },
  ],
  /** كل صف يوضح الاشتراط لكل فئة */
  requirements: [
    { icon: Briefcase, criterion: 'الترخيص', public: 'ترخيص نشاط نقل بضائع بأجر ساري', private: 'سجل تجاري ونقل لبضائع المنشأة فقط' },
    { icon: CarFront, criterion: 'عمر المركبة', public: 'لا يتجاوز 20 عاماً', private: 'لا يتجاوز 25 عاماً' },
    { icon: ClipboardCheck, criterion: 'الفحص الدوري', public: 'ساري + فحص سلامة نصف سنوي', private: 'ساري سنوياً' },
    { icon: UserCheck, criterion: 'السائق', public: 'رخصة نقل ثقيل + بطاقة سائق مهنية', private: 'رخصة نقل ثقيل سارية' },
    { icon: MapPinned, criterion: 'التتبّع', public: 'جهاز تتبّع مرتبط بالمنصة إلزامياً', private: 'تتبّع عبر التطبيق إلزامياً' },
    { icon: CalendarClock, criterion: 'الحجز المسبق', public: 'إلزامي لكل رحلة', private: 'إلزامي داخل النطاق العمراني' },
  ],
  finesTitle: 'جدول الغرامات الرادعة (قيم استرشادية)',
  currency: 'ر.س',
  fines: [
    { icon: Timer, violation: 'الدخول خارج النافذة الزمنية', amount: 2000, severity: 2 },
    { icon: QrCode, violation: 'الدخول دون تصريح QR', amount: 5000, severity: 3 },
    { icon: Route, violation: 'الانحراف عن المسار المعتمد', amount: 3000, severity: 2 },
    { icon: ShieldAlert, violation: 'مركبة غير مستوفية للأهلية', amount: 10000, severity: 3 },
    { icon: Users, violation: 'سائق غير مؤهل أو منتهي الرخصة', amount: 7500, severity: 3 },
    { icon: MapPin, violation: 'الوقوف العشوائي خارج المواقف', amount: 1500, severity: 1 },
  ],
  repeatNote: 'تُضاعف الغرامة عند التكرار خلال 12 شهراً، مع إمكانية الإيقاف المؤقت من المنصة.',
};

/* ----------------------------------------------------------------------------
 *  الشريحة 8 — نموذج العوائد والاستدامة المالية
 * ------------------------------------------------------------------------- */
export const revenueSlide = {
  header: {
    eyebrow: 'الاستدامة المالية',
    title: 'نموذج العوائد والاستدامة المالية',
    subtitle: 'مصادر دخل متنوعة يُعاد استثمارها في تطوير الطرق الدولية ورفع جودة الخدمات — مرّر أو اضغط على أجزاء الرسم.',
    icon: BarChart3,
  } satisfies SlideHeader,
  currencyUnit: 'مليون ر.س',
  totalLabel: 'العائد السنوي المتوقع',
  /** مصادر الدخل — القيم بالمليون ريال (سنوياً) */
  streams: [
    { id: 'booking', icon: CalendarClock, label: 'رسوم الحجز والعبور', value: 180, color: '#D97706', note: 'رسوم رمزية لكل حجز وتصريح عبور ذكي.' },
    { id: 'parking', icon: MapPin, label: 'خدمات المواقف', value: 120, color: '#15803D', note: 'رسوم الانتظار والخدمات المساندة داخل المواقف.' },
    { id: 'subs', icon: BadgeCheck, label: 'الاشتراكات', value: 80, color: '#38BDF8', note: 'باقات للشركات والأساطيل الكبيرة بمزايا متقدمة.' },
    { id: 'data', icon: BarChart3, label: 'خدمات البيانات والتحليلات', value: 40, color: '#A78BFA', note: 'تقارير وتحليلات لسلاسل الإمداد (بيانات مجمّعة ومجهولة).' },
  ],
  reinvestTitle: 'إعادة استثمار العوائد',
  /** نسب إعادة الاستثمار — مجموعها 100 */
  reinvest: [
    { icon: Globe2, label: 'تطوير الطرق الدولية', share: 45, color: '#15803D' },
    { icon: Construction, label: 'توسعة ورفع جودة المواقف', share: 25, color: '#D97706' },
    { icon: Sparkles, label: 'التقنية والابتكار', share: 15, color: '#38BDF8' },
    { icon: Users, label: 'تدريب وتأهيل الكوادر الوطنية', share: 15, color: '#A78BFA' },
  ],
  growth: {
    title: 'نمو العوائد المتوقع (مليون ر.س)',
    years: [
      { year: '2027', value: 140 },
      { year: '2028', value: 260 },
      { year: '2029', value: 420 },
      { year: '2030', value: 560 },
    ],
  },
};

/* ----------------------------------------------------------------------------
 *  الشريحة 9 — الأثر الوطني والاقتصادي
 * ------------------------------------------------------------------------- */
export const impactSlide = {
  header: {
    eyebrow: 'رؤية المملكة 2030',
    title: 'الأثر الوطني والاقتصادي',
    subtitle: 'مؤشرات مستهدفة تعكس مساهمة المشروع في تحقيق مستهدفات الرؤية.',
    icon: Globe,
  } satisfies SlideHeader,
  counters: [
    { icon: TrendingDown, value: 35, prefix: '-', suffix: '%', label: 'تخفيف الاختناقات المرورية', caption: 'في ساعات الذروة داخل المدن الرئيسية', accent: 'green' as Accent },
    { icon: Gauge, value: 25, prefix: '+', suffix: '%', label: 'رفع كفاءة سلاسل الإمداد', caption: 'عبر تقليص أزمنة الانتظار والرحلات', accent: 'gold' as Accent },
    { icon: Users, value: 12000, prefix: '+', suffix: '', label: 'فرص عمل نوعية للمواطنين', caption: 'في التشغيل والرقابة والخدمات اللوجستية', accent: 'green' as Accent },
    { icon: Leaf, value: 18, prefix: '-', suffix: '%', label: 'خفض الانبعاثات الكربونية', caption: 'بتقليل التوقف والدوران العشوائي', accent: 'gold' as Accent },
  ],
  jobsBreakdown: {
    title: 'توزيع فرص العمل',
    items: [
      { label: 'التشغيل وإدارة المواقف', share: 40 },
      { label: 'الرقابة والامتثال', share: 25 },
      { label: 'الخدمات اللوجستية المساندة', share: 20 },
      { label: 'التقنية والدعم الفني', share: 15 },
    ],
  },
  visionPillars: [
    { icon: Briefcase, label: 'اقتصاد مزدهر' },
    { icon: HeartPulse, label: 'مجتمع حيوي' },
    { icon: Landmark, label: 'وطن طموح' },
  ],
};

/* ----------------------------------------------------------------------------
 *  الشريحة 10 — الخاتمة والرؤية المستقبلية
 * ------------------------------------------------------------------------- */
export const closingSlide = {
  header: {
    eyebrow: 'الخطوة التالية',
    title: 'الخاتمة والرؤية المستقبلية',
    subtitle: 'نحو منظومة نقل لوجستي وطنية ذكية، آمنة، ومستدامة.',
    icon: Handshake,
  } satisfies SlideHeader,
  values: [
    { icon: TrafficCone, title: 'مدن أقل ازدحاماً', text: 'دخول منظّم للشاحنات وفق نوافذ زمنية ذكية.' },
    { icon: ShieldCheck, title: 'حقوق محفوظة', text: 'محفظة ضمان تصرف المستحقات آلياً وبشفافية.' },
    { icon: Gavel, title: 'انضباط كامل', text: 'رقابة آلية وغرامات رادعة لكل مخالفة.' },
    { icon: CircleDollarSign, title: 'استدامة مالية', text: 'عوائد يُعاد استثمارها في الطرق والمواقف.' },
  ],
  cta: {
    title: 'ندعوكم للشراكة والاستثمار',
    text: 'نرحّب بالجهات الحكومية والمستثمرين وشركات النقل للانضمام إلى بناء مستقبل النقل اللوجستي في المملكة.',
    button: 'لنبدأ الشراكة',
    icon: Banknote,
  },
  /** بيانات التواصل — عدّلها بحسب بيانات فريق المشروع */
  contact: [
    { icon: Users, label: 'فريق المشروع', value: 'اسم المسؤول / الجهة' },
    { icon: Mail, label: 'البريد الإلكتروني', value: 'info@example.sa' },
    { icon: Phone, label: 'الهاتف', value: '+966 5X XXX XXXX' },
    { icon: Globe, label: 'الموقع الإلكتروني', value: 'www.example.sa' },
  ],
  thanks: 'شكراً لكم',
};

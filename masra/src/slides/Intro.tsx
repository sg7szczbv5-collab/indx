import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock4,
  Cpu,
  Gem,
  Headset,
  HeartHandshake,
  Leaf,
  MapPinned,
  Play,
  Receipt,
  Route,
  ShieldCheck,
  Shuffle,
  Smartphone,
  Sparkles,
  Star,
  UserRound,
  Car,
  Banknote,
  Percent,
} from 'lucide-react'
import { Logo, LogoMark } from '../components/Logo'
import { Card, GhostButton, PrimaryButton, SlideHeader, SlideShell, ease } from '../components/ui'
import type { SlideProps } from './types'
import { useEffect, useState } from 'react'

/* ───────────── 01 COVER ───────────── */

function CityScene() {
  // Stylized Saudi urban skyline at dusk with a modern car crossing on the road and route lines over it.
  return (
    <svg viewBox="0 0 2400 520" className="h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0d0c" stopOpacity="0" />
          <stop offset="1" stopColor="#0f5b3a" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1e1c" />
          <stop offset="1" stopColor="#0b0d0c" />
        </linearGradient>
        <linearGradient id="beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="2400" height="520" fill="url(#sky)" />
      {[0, 1200].map((ox) => (
        <g key={ox} transform={`translate(${ox} 0)`} opacity="0.9">
      {/* far skyline */}
      <g fill="#151917">
        <rect x="40" y="250" width="70" height="200" />
        <rect x="120" y="210" width="50" height="240" />
        <rect x="180" y="280" width="90" height="170" />
        <path d="M300 450 L300 170 Q330 120 360 170 L360 450 Z" />
        <rect x="380" y="240" width="60" height="210" />
        <rect x="455" y="300" width="110" height="150" />
        <path d="M590 450 L600 150 L640 110 L680 150 L690 450 Z" />
        <rect x="710" y="260" width="70" height="190" />
        <rect x="800" y="200" width="55" height="250" />
        <path d="M870 450 L870 230 L930 190 L930 450 Z" />
        <rect x="950" y="280" width="80" height="170" />
        <rect x="1045" y="230" width="60" height="220" />
        <rect x="1115" y="300" width="80" height="150" />
      </g>
      {/* windows */}
      <g fill="#1fa36a" opacity="0.35">
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={i} x={60 + ((i * 97) % 1100)} y={260 + ((i * 53) % 160)} width="4" height="7" />
        ))}
      </g>
      {/* water tower silhouette (regional landmark motif, abstract) */}
      <g fill="#1a1e1c">
        <rect x="1000" y="160" width="10" height="120" />
        <ellipse cx="1005" cy="160" rx="34" ry="22" />
      </g>
        </g>
      ))}
      {/* road */}
      <rect x="0" y="450" width="2400" height="70" fill="url(#road)" />
      <line x1="0" y1="485" x2="2400" y2="485" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="26 22" className="route-dash" />
      {/* car */}
      <motion.g initial={{ x: 2500 }} animate={{ x: -260 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}>
        <rect x="-170" y="462" width="176" height="12" fill="url(#beam)" opacity="0.5" />
        <g transform="translate(0 438)">
          <path d="M8 34 L14 18 Q20 8 36 6 L92 4 Q112 4 126 16 L146 22 Q160 24 162 34 L162 40 L8 40 Z" fill="#f4f6f5" />
          <path d="M40 10 L90 8 Q104 8 114 18 L44 20 Z" fill="#0b0d0c" opacity="0.85" />
          <rect x="4" y="28" width="10" height="4" rx="2" fill="#fff6df" />
          <rect x="150" y="28" width="12" height="4" rx="2" fill="#d9534f" />
          <circle cx="40" cy="40" r="11" fill="#0b0d0c" />
          <circle cx="40" cy="40" r="5" fill="#6b746f" />
          <circle cx="128" cy="40" r="11" fill="#0b0d0c" />
          <circle cx="128" cy="40" r="5" fill="#6b746f" />
          <path d="M60 22 L120 22" stroke="#1fa36a" strokeWidth="3" />
        </g>
      </motion.g>
    </svg>
  )
}

function RouteOverlay() {
  const paths = [
    'M80 140 C 260 60, 420 220, 620 120 S 980 60, 1140 160',
    'M40 260 C 240 200, 380 320, 600 240 S 900 200, 1180 280',
  ]
  return (
    <svg viewBox="0 0 1200 400" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d, i) => (
        <g key={i}>
          <motion.path d={d} fill="none" stroke="#1fa36a" strokeOpacity={i ? 0.25 : 0.5} strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, delay: 0.4 + i * 0.4, ease: 'easeInOut' }} />
          <circle r="4" fill="#1fa36a">
            <animateMotion dur={`${7 + i * 2}s`} repeatCount="indefinite" path={d} />
          </circle>
        </g>
      ))}
    </svg>
  )
}

export function Cover({ go, next }: SlideProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 glow-green" />
      <div className="pointer-events-none absolute inset-x-0 top-[12%] h-[45%] opacity-70">
        <RouteOverlay />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] min-h-[200px]">
        <CityScene />
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-[26vh] text-center">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease }}>
          <LogoMark size={84} animate />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease }}
          className="mt-6 text-[40px] font-bold sm:text-7xl"
        >
          مَسْرى
          <span className="mx-3 text-white/25">|</span>
          <span className="font-semibold tracking-[0.1em] sm:tracking-[0.18em]">MASRA</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35, ease }} className="mt-5 text-xl font-semibold text-green-3 sm:text-2xl">
          رحلتك تبدأ من هنا.
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease }} className="mt-2 max-w-xl text-[15px] text-white/60 sm:text-lg">
          منصة سعودية تعيد تعريف تجربة التنقل الذكي.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease }} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={() => go(4)}>
            <Smartphone size={18} /> استكشف المشروع
          </PrimaryButton>
          <GhostButton onClick={next}>
            <Play size={16} /> ابدأ العرض الاستثماري
          </GhostButton>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-6 text-xs text-white/35">
          الدمام · الخبر · الظهران — المرحلة الأولى
        </motion.div>
      </div>
    </div>
  )
}

/* ───────────── 02 VISION ───────────── */

const VALUES = [
  { I: Route, t: 'سهولة التنقل', d: 'رحلة بثلاث نقرات من أي مكان في المدينة.' },
  { I: ShieldCheck, t: 'الثقة والأمان', d: 'سائقون موثّقون، تتبع مباشر، وأدوات طوارئ.' },
  { I: Cpu, t: 'التقنية', d: 'مطابقة ذكية وتسعير شفاف قبل الطلب.' },
  { I: Gem, t: 'جودة الخدمة', d: 'تقييم ثنائي ومعايير تشغيل واضحة.' },
  { I: Leaf, t: 'التوسع والاستدامة', d: 'نموذج خفيف الأصول قابل للتكرار في كل مدينة.' },
]

export function Vision() {
  return (
    <SlideShell>
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SlideHeader index={2} eyebrow="الرؤية والرسالة" title={<>منصة نقل ذكية سعودية<br /><span className="text-white/45">تربط الراكب بالسائق بثقة وسهولة.</span></>} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card delay={0.15}>
              <div className="text-xs font-semibold text-green-3">الرؤية</div>
              <p className="mt-2 text-[15px] leading-7 text-white/80">أن تكون مَسْرى الخيار المحلي الأول للتنقل الذكي في مدن المملكة.</p>
            </Card>
            <Card delay={0.22}>
              <div className="text-xs font-semibold text-green-3">الرسالة</div>
              <p className="mt-2 text-[15px] leading-7 text-white/80">ربط الركاب بالسائقين عبر تجربة رقمية سهلة وموثوقة، بخدمة قريبة من السوق السعودي.</p>
            </Card>
          </div>
        </div>
        <div className="space-y-2.5">
          {VALUES.map(({ I, t, d }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease }}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-2/70 p-4 transition hover:border-green-3/40 hover:bg-green/10"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-4 text-green-3 transition group-hover:bg-green-3 group-hover:text-ink">
                <I size={22} />
              </span>
              <div>
                <div className="font-bold">{t}</div>
                <div className="text-sm text-white/55">{d}</div>
              </div>
              <span className="num ms-auto text-xs text-white/25">0{i + 1}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}

/* ───────────── 03 PROBLEM ───────────── */

const PROBLEMS = [
  { I: Clock4, t: 'الوصول السريع', d: 'صعوبة الوصول السريع إلى وسيلة نقل مناسبة في الوقت والمكان المطلوبين.' },
  { I: Shuffle, t: 'تفاوت التجربة', d: 'تفاوت جودة تجربة المستخدم بين رحلة وأخرى وغياب معايير واضحة.' },
  { I: Receipt, t: 'وضوح الحجز والدفع', d: 'الحاجة إلى تجربة حجز ودفع واضحة بسعر معروف قبل بدء الرحلة.' },
  { I: Headset, t: 'خدمة محلية قريبة', d: 'الحاجة إلى منصة محلية بخدمة عملاء قريبة من السوق وثقافته.' },
]

export function Problem() {
  return (
    <SlideShell>
      <SlideHeader index={3} eyebrow="المشكلة" title="أين تتعثر تجربة التنقل اليوم؟" subtitle="تحديات نوعية تستهدف المنصة معالجتها — تُقاس وتُوثّق خلال مرحلة الإطلاق التجريبي." />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map(({ I, t, d }, i) => (
          <Card key={t} delay={0.1 + i * 0.08} className="relative overflow-hidden !p-6">
            <span className="num absolute -top-4 -left-1 text-[90px] leading-none font-bold text-white/[0.03]">{i + 1}</span>
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-ink-3">
              <I size={22} className="text-white/80" />
            </span>
            <div className="mt-6 text-lg font-bold">{t}</div>
            <p className="mt-2 text-sm leading-7 text-white/55">{d}</p>
          </Card>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8 flex items-center gap-2 text-xs text-white/40">
        <Sparkles size={14} className="text-green-3" />
        لا نعرض إحصائيات غير موثقة؛ سيتم قياس هذه المؤشرات ميدانياً عبر استبيانات وتجربة السوق.
      </motion.div>
    </SlideShell>
  )
}

/* ───────────── 04 SOLUTION ───────────── */

const FLOW1 = [
  { I: UserRound, t: 'الراكب' },
  { I: Smartphone, t: 'تطبيق مَسْرى' },
  { I: Cpu, t: 'نظام التوجيه الذكي' },
  { I: Car, t: 'السائق' },
]
const FLOW2 = [
  { I: MapPinned, t: 'تنفيذ الرحلة' },
  { I: Banknote, t: 'الدفع' },
  { I: Star, t: 'التقييم' },
  { I: Percent, t: 'عمولة المنصة' },
]

function FlowRow({ items, active, offset }: { items: typeof FLOW1; active: number; offset: number }) {
  return (
    <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
      {items.map(({ I, t }, i) => {
        const idx = i + offset
        const on = active === idx
        const passed = active > idx
        return (
          <div key={t} className="flex flex-1 flex-col items-center md:flex-row">
            <motion.div
              animate={{ scale: on ? 1.04 : 1 }}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 transition-colors md:flex-col md:text-center ${
                on ? 'border-green-3 bg-green/20' : passed ? 'border-green-3/30 bg-ink-2' : 'border-line bg-ink-2'
              }`}
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition ${on ? 'bg-green-3 text-ink' : 'bg-ink-4 text-white/80'}`}>
                <I size={22} />
              </span>
              <span className="font-semibold">{t}</span>
            </motion.div>
            {i < items.length - 1 && (
              <div className="relative h-6 w-px md:h-px md:w-10 md:shrink-0">
                <div className="absolute inset-0 bg-line" />
                <motion.div className="absolute inset-0 origin-right bg-green-3" animate={{ scaleX: passed ? 1 : 0, scaleY: passed ? 1 : 0 }} transition={{ duration: 0.4 }} />
                <ArrowLeft size={14} className="absolute top-1/2 left-0 hidden -translate-x-1/2 -translate-y-1/2 text-white/40 md:block" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function Solution() {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto) return
    const iv = setInterval(() => setActive((a) => (a + 1) % 8), 1300)
    return () => clearInterval(iv)
  }, [auto])
  const desc = [
    'يفتح الراكب التطبيق ويحدد وجهته.',
    'يعرض التطبيق السعر التقديري ووقت الوصول قبل التأكيد.',
    'يطابق النظام الطلب مع أنسب سائق قريب متاح.',
    'يستقبل السائق الطلب ويتوجه لنقطة الالتقاء.',
    'تُتابع الرحلة مباشرة على الخريطة مع أدوات الأمان.',
    'يتم الدفع إلكترونياً أو نقداً عند الوصول.',
    'يقيّم الطرفان الرحلة للحفاظ على الجودة.',
    'تحصل المنصة على نسبة عمولة من قيمة الرحلة المكتملة.',
  ]
  return (
    <SlideShell>
      <SlideHeader index={4} eyebrow="الحل" title={<>مَسْرى تجمع الراكب والسائق<br className="hidden sm:block" /> في منصة واحدة.</>} />
      <div className="mt-10 space-y-4" onMouseEnter={() => setAuto(false)} onMouseLeave={() => setAuto(true)}>
        <FlowRow items={FLOW1} active={active} offset={0} />
        <div className="flex justify-center">
          <div className="h-6 w-px bg-line" />
        </div>
        <FlowRow items={FLOW2} active={active} offset={4} />
      </div>
      <div className="mt-6 flex flex-col items-center gap-4">
        <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-full border border-line bg-ink-2 px-5 py-2.5 text-sm text-white/75">
          <HeartHandshake size={16} className="text-green-3" /> {desc[active]}
        </motion.div>
        <div className="flex gap-1.5">
          {desc.map((_, i) => (
            <button key={i} type="button" aria-label={`الخطوة ${i + 1}`} onClick={() => { setAuto(false); setActive(i) }} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-green-3' : 'w-1.5 bg-white/20'}`} />
          ))}
        </div>
      </div>
      <div className="mt-8 hidden justify-center lg:flex">
        <Logo size={28} />
      </div>
    </SlideShell>
  )
}

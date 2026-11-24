import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, ResponsiveContainer, XAxis, Cell } from 'recharts'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Car,
  CornerUpLeft,
  FileText,
  History,
  Home,
  IdCard,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Power,
  ShieldCheck,
  Star,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { MapCanvas } from '../../components/MapCanvas'
import { useProgress } from '../../hooks/useProgress'

export type DriverScreen =
  | 'signup'
  | 'docs'
  | 'vehicle'
  | 'verify'
  | 'home'
  | 'request'
  | 'pickup'
  | 'arrived'
  | 'trip'
  | 'summary'
  | 'earnings'
  | 'history'
  | 'wallet'

export const DRIVER_STEPS: { label: string; screen: DriverScreen; online?: boolean }[] = [
  { label: 'التسجيل والانضمام', screen: 'signup' },
  { label: 'رفع الرخصة والوثائق', screen: 'docs' },
  { label: 'بيانات المركبة', screen: 'vehicle' },
  { label: 'التحقق من الحساب', screen: 'verify' },
  { label: 'الصفحة الرئيسية', screen: 'home', online: false },
  { label: 'متصل / غير متصل', screen: 'home', online: true },
  { label: 'استقبال طلب رحلة', screen: 'request' },
  { label: 'قبول أو رفض الطلب', screen: 'request' },
  { label: 'بيانات الراكب وموقع الالتقاء', screen: 'pickup' },
  { label: 'الملاحة إلى الراكب', screen: 'pickup' },
  { label: 'بدء الرحلة', screen: 'arrived' },
  { label: 'إنهاء الرحلة', screen: 'trip' },
  { label: 'الأرباح اليومية والأسبوعية', screen: 'earnings' },
  { label: 'سجل الرحلات', screen: 'history' },
  { label: 'المحفظة والتسويات', screen: 'wallet' },
]

const COMMISSION = 0.18
const REQ = { fare: 38, km: 14.2, min: 18, pickupKm: 1.1, pickupMin: 3, rider: 'سارة', riderRating: 4.87, dest: 'كورنيش الخبر' }

const anim = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
}

function DBtn({
  children,
  onClick,
  variant = 'green',
  className = '',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'green' | 'white' | 'ghost' | 'danger'
  className?: string
  disabled?: boolean
}) {
  const st = {
    green: 'bg-green-3 text-ink hover:brightness-110',
    white: 'bg-white text-ink hover:bg-mist',
    ghost: 'bg-white/8 text-white hover:bg-white/12',
    danger: 'bg-danger/15 text-[#ff8a85] hover:bg-danger/25',
  }[variant]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-40 ${st} ${className}`}
    >
      {children}
    </button>
  )
}

function Header({ title, step, onBack }: { title: string; step?: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-12 pb-3">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="رجوع" className="grid h-9 w-9 place-items-center rounded-full bg-white/8">
          <ArrowRight size={17} />
        </button>
      )}
      <div className="flex-1">
        {step && <div className="text-[11px] text-green-3">{step}</div>}
        <div className="text-[17px] font-bold">{title}</div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange?: (v: string) => void }) {
  return (
    <label className="block rounded-2xl bg-white/6 px-3.5 py-2 ring-1 ring-white/8 focus-within:ring-green-3">
      <span className="block text-[10px] text-white/45">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-transparent text-[14px] font-medium text-white outline-none"
      />
    </label>
  )
}

function TabBar({ screen, go }: { screen: DriverScreen; go: (s: DriverScreen) => void }) {
  const tabs: { s: DriverScreen; t: string; I: typeof Home }[] = [
    { s: 'home', t: 'الرئيسية', I: Home },
    { s: 'earnings', t: 'الأرباح', I: Banknote },
    { s: 'history', t: 'الرحلات', I: History },
    { s: 'wallet', t: 'المحفظة', I: Wallet },
  ]
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/8 bg-ink/95 px-2 pt-2 pb-6 backdrop-blur">
      {tabs.map(({ s, t, I }) => (
        <button
          key={s}
          type="button"
          onClick={() => go(s)}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${screen === s ? 'text-green-3' : 'text-white/45'}`}
        >
          <I size={19} />
          {t}
        </button>
      ))}
    </div>
  )
}

const WEEK = [
  { d: 'سبت', v: 410 },
  { d: 'أحد', v: 365 },
  { d: 'اثنين', v: 298 },
  { d: 'ثلاثاء', v: 452 },
  { d: 'أربعاء', v: 389 },
  { d: 'خميس', v: 515 },
  { d: 'جمعة', v: 0 },
]
const DAY = [
  { d: '8ص', v: 42 },
  { d: '10ص', v: 66 },
  { d: '12م', v: 38 },
  { d: '2م', v: 54 },
  { d: '4م', v: 71 },
  { d: '6م', v: 88 },
  { d: '8م', v: 95 },
]

const HISTORY = [
  { from: 'حي الشاطئ', to: 'كورنيش الخبر', t: '8:42 م', fare: 38, ok: true },
  { from: 'الظهران', to: 'الدمام · حي الفيصلية', t: '7:15 م', fare: 29, ok: true },
  { from: 'الخبر الشمالية', to: 'مدخل جسر الملك فهد', t: '5:50 م', fare: 46, ok: true },
  { from: 'محطة قطار الدمام', to: 'حي العزيزية', t: '3:02 م', fare: 24, ok: false },
  { from: 'حي الروضة', to: 'مطار الملك فهد الدولي', t: '11:20 ص', fare: 71, ok: true },
]

export function DriverApp({
  screen,
  onScreen,
  online,
  setOnline,
}: {
  screen: DriverScreen
  onScreen: (s: DriverScreen) => void
  online: boolean
  setOnline: (v: boolean) => void
}) {
  const [name, setName] = useState('محمد الشهري')
  const [city, setCity] = useState('الدمام')
  const [docs, setDocs] = useState<Record<string, 'idle' | 'loading' | 'done'>>({})
  const [car, setCar] = useState({ make: 'تويوتا', model: 'كامري', year: '2023', color: 'أبيض', plate: '٤٨٢٧ ب ر ح' })
  const [verifyStep, setVerifyStep] = useState(0)
  const [countdown, setCountdown] = useState(15)
  const [today, setToday] = useState({ trips: 7, gross: 286 })
  const [range, setRange] = useState<'day' | 'week'>('week')

  // simulated incoming request when online on home
  useEffect(() => {
    if (screen !== 'home' || !online) return
    const t = setTimeout(() => onScreen('request'), 3200)
    return () => clearTimeout(t)
  }, [screen, online, onScreen])

  // request countdown
  useEffect(() => {
    if (screen !== 'request') return
    setCountdown(15)
    const iv = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(iv)
  }, [screen])
  useEffect(() => {
    if (screen === 'request' && countdown === 0) onScreen('home')
  }, [countdown, screen, onScreen])

  // verification animation
  useEffect(() => {
    if (screen !== 'verify') return
    setVerifyStep(0)
    const ts = [800, 1700, 2600, 3400].map((ms, i) => setTimeout(() => setVerifyStep(i + 1), ms))
    return () => ts.forEach(clearTimeout)
  }, [screen])

  const toPickup = useProgress(screen === 'pickup', 8000, screen === 'pickup')
  const tripP = useProgress(screen === 'trip', 10000, screen === 'trip')

  const uploadDoc = (k: string) => {
    if (docs[k]) return
    setDocs((d) => ({ ...d, [k]: 'loading' }))
    setTimeout(() => setDocs((d) => ({ ...d, [k]: 'done' })), 1100)
  }
  const DOCS = [
    { k: 'license', t: 'رخصة القيادة', s: 'سارية المفعول', I: IdCard },
    { k: 'id', t: 'الهوية الوطنية / الإقامة', s: 'وجه وخلف', I: User },
    { k: 'reg', t: 'استمارة المركبة', s: 'رخصة السير', I: FileText },
    { k: 'ins', t: 'وثيقة التأمين', s: 'تأمين ساري', I: ShieldCheck },
  ]
  const docsDone = DOCS.every((d) => docs[d.k] === 'done')

  const fareNet = Math.round(REQ.fare * (1 - COMMISSION) * 100) / 100
  const showTabs = ['home', 'earnings', 'history', 'wallet'].includes(screen)
  const net = Math.round(today.gross * (1 - COMMISSION))

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink font-sans text-white" dir="rtl">
      <AnimatePresence mode="wait" initial={false}>
        {/* 1 — SIGNUP */}
        {screen === 'signup' && (
          <motion.div key="signup" {...anim} className="absolute inset-0 flex flex-col">
            <div className="px-5 pt-14">
              <LogoMark size={44} dark />
              <div className="mt-4 text-[22px] font-bold leading-8">انضم إلى مَسْرى<br />كشريك سائق</div>
              <div className="mt-1 text-[12px] text-white/55">بسيارتك الخاصة، وبالأوقات التي تناسبك.</div>
            </div>
            <div className="mt-5 flex-1 space-y-2.5 px-5">
              <Field label="الاسم الكامل" value={name} onChange={setName} />
              <Field label="رقم الجوال" value="+966 5X XXX XXXX" />
              <div>
                <div className="mb-1.5 text-[11px] text-white/45">مدينة العمل</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['الدمام', 'الخبر', 'الظهران'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`rounded-xl py-2.5 text-[13px] font-semibold ${city === c ? 'bg-green-3 text-ink' : 'bg-white/6 text-white/70'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-white/5 p-3 text-[11px] leading-5 text-white/55">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-3" />
                يخضع التسجيل للتحقق من الأهلية والمتطلبات النظامية المعتمدة لدى الجهات المختصة.
              </div>
            </div>
            <div className="px-5 pb-9">
              <DBtn onClick={() => onScreen('docs')}>متابعة</DBtn>
            </div>
          </motion.div>
        )}

        {/* 2 — DOCS */}
        {screen === 'docs' && (
          <motion.div key="docs" {...anim} className="absolute inset-0 flex flex-col">
            <Header title="الوثائق المطلوبة" step="الخطوة 2 من 4" onBack={() => onScreen('signup')} />
            <div className="flex-1 space-y-2 overflow-y-auto px-5 no-scrollbar">
              <div className="text-[12px] text-white/50">اضغط على كل وثيقة لمحاكاة رفعها.</div>
              {DOCS.map(({ k, t, s, I }) => {
                const st = docs[k] ?? 'idle'
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => uploadDoc(k)}
                    className={`flex w-full items-center gap-3 rounded-2xl border border-dashed p-3 text-start transition ${
                      st === 'done' ? 'border-green-3/60 bg-green-3/10' : 'border-white/15 bg-white/4 hover:bg-white/8'
                    }`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/8">
                      <I size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[13px] font-semibold">{t}</span>
                      <span className="block text-[11px] text-white/45">{st === 'done' ? 'تم الرفع · بانتظار المراجعة' : s}</span>
                    </span>
                    {st === 'idle' && <Upload size={17} className="text-white/50" />}
                    {st === 'loading' && <Loader2 size={17} className="animate-spin text-green-3" />}
                    {st === 'done' && <BadgeCheck size={19} className="text-green-3" />}
                  </button>
                )
              })}
            </div>
            <div className="space-y-2 px-5 pb-9 pt-3">
              {!docsDone && (
                <button type="button" onClick={() => DOCS.forEach((d) => uploadDoc(d.k))} className="w-full text-center text-[12px] text-green-3">
                  رفع جميع الوثائق (تجريبي)
                </button>
              )}
              <DBtn disabled={!docsDone} onClick={() => onScreen('vehicle')}>
                التالي: بيانات المركبة
              </DBtn>
            </div>
          </motion.div>
        )}

        {/* 3 — VEHICLE */}
        {screen === 'vehicle' && (
          <motion.div key="vehicle" {...anim} className="absolute inset-0 flex flex-col">
            <Header title="بيانات المركبة" step="الخطوة 3 من 4" onBack={() => onScreen('docs')} />
            <div className="flex-1 space-y-2 overflow-y-auto px-5 no-scrollbar">
              <div className="mb-1 grid h-24 place-items-center rounded-2xl bg-gradient-to-br from-green/40 to-white/5">
                <Car size={44} strokeWidth={1.2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="الشركة المصنعة" value={car.make} onChange={(v) => setCar({ ...car, make: v })} />
                <Field label="الطراز" value={car.model} onChange={(v) => setCar({ ...car, model: v })} />
                <Field label="سنة الصنع" value={car.year} onChange={(v) => setCar({ ...car, year: v })} />
                <Field label="اللون" value={car.color} onChange={(v) => setCar({ ...car, color: v })} />
              </div>
              <Field label="رقم اللوحة (تجريبي)" value={car.plate} onChange={(v) => setCar({ ...car, plate: v })} />
              <div className="rounded-2xl bg-white/5 p-3 text-[11px] leading-5 text-white/55">
                الفئة المقترحة: <span className="font-semibold text-white">اقتصادي · مريح</span> — تُحدد نهائياً بعد فحص المركبة.
              </div>
            </div>
            <div className="px-5 pb-9 pt-3">
              <DBtn onClick={() => onScreen('verify')}>إرسال للتحقق</DBtn>
            </div>
          </motion.div>
        )}

        {/* 4 — VERIFY */}
        {screen === 'verify' && (
          <motion.div key="verify" {...anim} className="absolute inset-0 flex flex-col">
            <Header title="التحقق من الحساب" step="الخطوة 4 من 4" />
            <div className="flex-1 px-5">
              <div className="relative mx-auto my-4 grid h-28 w-28 place-items-center">
                <motion.span
                  className="absolute inset-0 rounded-full border-4 border-white/10 border-t-green-3"
                  animate={{ rotate: verifyStep >= 4 ? 0 : 360 }}
                  transition={{ duration: 1, repeat: verifyStep >= 4 ? 0 : Infinity, ease: 'linear' }}
                  style={verifyStep >= 4 ? { borderColor: '#1fa36a' } : undefined}
                />
                {verifyStep >= 4 ? <BadgeCheck size={46} className="text-green-3" /> : <ShieldCheck size={40} className="text-white/70" />}
              </div>
              <div className="space-y-2">
                {['مراجعة الوثائق', 'التحقق من الهوية', 'مطابقة بيانات المركبة', 'تفعيل الحساب'].map((t, i) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-[13px]">
                    {verifyStep > i ? (
                      <BadgeCheck size={18} className="text-green-3" />
                    ) : verifyStep === i ? (
                      <Loader2 size={18} className="animate-spin text-white/60" />
                    ) : (
                      <span className="h-[18px] w-[18px] rounded-full border border-white/20" />
                    )}
                    <span className={verifyStep > i ? 'text-white' : 'text-white/55'}>{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center text-[10.5px] text-white/40">محاكاة: الاعتماد الفعلي يتطلب مراجعة بشرية وربطاً مع الأنظمة الرسمية.</div>
            </div>
            <div className="px-5 pb-9">
              <DBtn disabled={verifyStep < 4} onClick={() => onScreen('home')}>
                {verifyStep < 4 ? 'جارٍ التحقق…' : 'تم الاعتماد — الدخول'}
              </DBtn>
            </div>
          </motion.div>
        )}

        {/* 5/6 — HOME */}
        {screen === 'home' && (
          <motion.div key="home" {...anim} className="absolute inset-0">
            <div className={`absolute inset-0 transition duration-700 ${online ? '' : 'grayscale brightness-[0.55]'}`}>
              <MapCanvas showNearby={online} showUser />
            </div>
            <div className="absolute inset-x-4 top-12 z-10 flex items-center justify-between rounded-2xl bg-ink/90 px-4 py-2.5 shadow-xl backdrop-blur">
              <div>
                <div className="text-[10px] text-white/50">أرباح اليوم (صافي)</div>
                <div className="num text-[18px] font-bold">{net} ر.س</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] text-white/50">الرحلات</div>
                <div className="num text-[16px] font-bold">{today.trips}</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] text-white/50">التقييم</div>
                <div className="num text-[16px] font-bold">4.95</div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-[78px] z-20 px-5">
              <div className="mb-3 text-center text-[12px] font-semibold">
                {online ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-ink/85 px-3 py-1.5">
                    <motion.span className="h-2 w-2 rounded-full bg-green-3" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
                    متصل — بانتظار الطلبات في {city}
                  </span>
                ) : (
                  <span className="rounded-full bg-ink/85 px-3 py-1.5 text-white/70">أنت غير متصل</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOnline(!online)}
                className={`mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full border-4 shadow-2xl transition active:scale-95 ${
                  online ? 'border-ink bg-danger text-white' : 'border-ink bg-green-3 text-ink'
                }`}
                aria-label={online ? 'قطع الاتصال' : 'اتصال'}
              >
                <Power size={28} strokeWidth={2.5} />
              </button>
              <div className="mt-1.5 text-center text-[11px] font-bold">{online ? 'إيقاف' : 'ابدأ العمل'}</div>
            </div>
          </motion.div>
        )}

        {/* 7/8 — REQUEST: ride-offer card */}
        {screen === 'request' && (
          <motion.div key="request" {...anim} className="absolute inset-0 bg-ink">
            <div className="absolute inset-x-2 top-11 bottom-[46%] overflow-hidden rounded-[26px]">
              <MapCanvas view={{ y: 110, h: 400, w: 380 }} mode="preview" showPickup showDropoff showNearby={false} routeColor="#1fa36a" routeEta={`${REQ.pickupMin + 4} د`} />
              <button
                type="button"
                onClick={() => onScreen('home')}
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/90 px-3.5 py-2 text-[12.5px] font-bold text-white shadow-lg hover:bg-ink"
              >
                <X size={15} strokeWidth={2.6} /> رفض
              </button>
            </div>
            <motion.button
              type="button"
              onClick={() => onScreen('pickup')}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 z-20 rounded-t-[22px] bg-ink-3 px-5 pt-4 pb-7 text-center shadow-2xl ring-1 ring-white/10"
              aria-label="قبول الرحلة"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <span className="text-start text-[14px] font-bold">اقتصادي</span>
                <span className="relative grid h-14 w-14 place-items-center">
                  <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
                    <circle cx="28" cy="28" r="25" stroke="rgba(255,255,255,0.12)" strokeWidth="4" fill="none" />
                    <circle cx="28" cy="28" r="25" stroke="#ffffff" strokeWidth="4" fill="none" strokeDasharray={157} strokeDashoffset={157 * (1 - countdown / 15)} style={{ transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" />
                  </svg>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-green-2">
                    <User size={20} className="fill-white text-white" />
                  </span>
                </span>
                <span className="num flex items-center justify-end gap-1 text-[14px] font-bold">
                  {REQ.riderRating} <Star size={13} className="fill-white text-white" />
                </span>
              </div>
              <div className="num mt-3 text-[30px] leading-none font-bold">29 – 31 ر.س</div>
              <div className="num mt-2 text-[13px] text-white/80">معامل طلب 1.2× مطبّق</div>
              <div className="num mx-auto mt-2 w-fit rounded-full bg-black px-4 py-1.5 text-[12.5px] font-semibold">بعد عمولة المنصة 18%</div>
              <div className="num mt-3 text-[17px] font-bold">{REQ.min} د <span className="text-white/40">•</span> {REQ.km} كم</div>
              <div className="mt-2 space-y-0.5 text-[13px] text-white/85">
                <div className="flex items-center justify-center gap-1.5"><ArrowUpRight size={14} className="-rotate-45" /> حي الشاطئ، الدمام</div>
                <div className="flex items-center justify-center gap-1.5"><ArrowDownLeft size={14} className="-rotate-45" /> {REQ.dest}، الخبر</div>
              </div>
              <div className="mt-3 text-[11px] text-green-3">اضغط على البطاقة لقبول الرحلة · <span className="num">{countdown}</span> ث</div>
            </motion.button>
          </motion.div>
        )}

        {/* 9/10 — NAVIGATE TO PICKUP */}
        {screen === 'pickup' && (
          <motion.div key="pickup" {...anim} className="absolute inset-0">
            <MapCanvas mode="approach" progress={toPickup} showNearby={false} showPickup />
            <div className="absolute inset-x-3 top-11 z-10 flex items-center gap-3 rounded-2xl bg-green px-4 py-3 shadow-xl">
              <CornerUpLeft size={30} />
              <div className="flex-1">
                <div className="num text-[18px] font-bold">{toPickup < 0.45 ? '300 م' : toPickup < 1 ? '120 م' : 'وصلت'}</div>
                <div className="text-[12px] text-white/80">{toPickup < 0.45 ? 'انعطف يساراً إلى طريق الأمير محمد' : toPickup < 1 ? 'انعطف يساراً، نقطة الالتقاء على اليمين' : 'نقطة الالتقاء'}</div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[26px] bg-ink-2 px-5 pt-4 pb-8 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[15px] font-bold">س</div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold">{REQ.rider} <span className="text-[11px] font-normal text-white/50">· راكبة تجريبية</span></div>
                  <div className="flex items-center gap-1 text-[11px] text-white/55">
                    <MapPin size={12} /> حي الشاطئ — أمام البوابة الرئيسية
                  </div>
                </div>
                <button type="button" aria-label="اتصال" className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
                  <Phone size={16} />
                </button>
                <button type="button" aria-label="رسالة" className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
                  <MessageSquare size={16} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-white/55">
                <span className="flex items-center gap-1"><Navigation size={13} /> إلى نقطة الالتقاء</span>
                <span className="num">{Math.max(0, Math.ceil((1 - toPickup) * REQ.pickupMin))} د · {((1 - toPickup) * REQ.pickupKm).toFixed(1)} كم</span>
              </div>
              <DBtn className="mt-3" variant={toPickup >= 1 ? 'green' : 'white'} onClick={() => onScreen('arrived')}>
                {toPickup >= 1 ? 'وصلت إلى الراكب' : 'تخطّي: وصلت إلى الراكب'}
              </DBtn>
            </div>
          </motion.div>
        )}

        {/* 11 — ARRIVED / START */}
        {screen === 'arrived' && (
          <motion.div key="arrived" {...anim} className="absolute inset-0 flex flex-col">
            <div className="relative h-[42%]">
              <MapCanvas mode="preview" showPickup showDropoff showNearby={false} routeColor="#1fa36a" />
            </div>
            <div className="-mt-6 flex flex-1 flex-col rounded-t-[26px] bg-ink-2 px-5 pt-5 pb-8 ring-1 ring-white/10">
              <div className="text-[12px] text-green-3">بانتظار الراكب</div>
              <div className="mt-1 text-[18px] font-bold">تأكد من هوية الراكب قبل البدء</div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10 font-bold">س</div>
                <div className="flex-1 text-[13px]">
                  <div className="font-semibold">{REQ.rider}</div>
                  <div className="text-[11px] text-white/50">رمز الرحلة: <span className="num font-bold text-white">7 4 1</span></div>
                </div>
                <div className="num flex items-center gap-1 text-[12px]"><Star size={12} className="fill-gold text-gold" />{REQ.riderRating}</div>
              </div>
              <div className="mt-2 rounded-2xl bg-white/5 p-3 text-[12px]">
                <div className="text-[10px] text-white/45">الوجهة</div>
                <div className="font-semibold">{REQ.dest}</div>
                <div className="num text-[11px] text-white/50">{REQ.km} كم · {REQ.min} دقيقة تقريباً</div>
              </div>
              <div className="mt-auto space-y-2 pt-3">
                <DBtn onClick={() => onScreen('trip')}>بدء الرحلة</DBtn>
                <DBtn variant="ghost" onClick={() => onScreen('home')}>الراكب لم يحضر</DBtn>
              </div>
            </div>
          </motion.div>
        )}

        {/* 12 — IN TRIP / END */}
        {screen === 'trip' && (
          <motion.div key="trip" {...anim} className="absolute inset-0">
            <MapCanvas mode="trip" progress={tripP} showNearby={false} showDropoff routeColor="#1fa36a" />
            <div className="absolute inset-x-3 top-11 z-10 flex items-center gap-3 rounded-2xl bg-ink/95 px-4 py-3 shadow-xl">
              <Navigation size={22} className="text-green-3" />
              <div className="flex-1">
                <div className="text-[13px] font-bold">في الطريق إلى {REQ.dest}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-green-3" style={{ width: `${tripP * 100}%` }} />
                </div>
              </div>
              <div className="num text-[12px] text-white/60">{Math.max(0, Math.round((1 - tripP) * REQ.min))} د</div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[26px] bg-ink-2 px-5 pt-4 pb-8 ring-1 ring-white/10">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/5 py-2">
                  <div className="text-[10px] text-white/45">المسافة</div>
                  <div className="num text-[14px] font-bold">{(tripP * REQ.km).toFixed(1)} كم</div>
                </div>
                <div className="rounded-xl bg-white/5 py-2">
                  <div className="text-[10px] text-white/45">المدة</div>
                  <div className="num text-[14px] font-bold">{Math.round(tripP * REQ.min)} د</div>
                </div>
                <div className="rounded-xl bg-white/5 py-2">
                  <div className="text-[10px] text-white/45">الأجرة</div>
                  <div className="num text-[14px] font-bold">{REQ.fare} ر.س</div>
                </div>
              </div>
              <DBtn
                className="mt-3"
                variant={tripP >= 1 ? 'green' : 'danger'}
                onClick={() => {
                  setToday((t) => ({ trips: t.trips + 1, gross: t.gross + REQ.fare }))
                  onScreen('summary')
                }}
              >
                إنهاء الرحلة
              </DBtn>
            </div>
          </motion.div>
        )}

        {/* SUMMARY */}
        {screen === 'summary' && (
          <motion.div key="summary" {...anim} className="absolute inset-0 flex flex-col px-5 pt-16 pb-9">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 15 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-3 text-ink">
              <BadgeCheck size={32} />
            </motion.div>
            <div className="mt-4 text-center text-[13px] text-white/55">اكتملت الرحلة بنجاح</div>
            <div className="num mt-1 text-center text-[36px] font-bold">{fareNet} <span className="text-base">ر.س</span></div>
            <div className="text-center text-[11px] text-white/45">صافي أرباحك من الرحلة</div>
            <div className="mt-5 space-y-2 rounded-2xl bg-white/5 p-4 text-[13px]">
              <div className="flex justify-between"><span className="text-white/60">أجرة الرحلة</span><span className="num">{REQ.fare.toFixed(2)} ر.س</span></div>
              <div className="flex justify-between"><span className="text-white/60">عمولة المنصة (18%)</span><span className="num text-[#ff8a85]">− {(REQ.fare * COMMISSION).toFixed(2)} ر.س</span></div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between font-bold"><span>الصافي للسائق</span><span className="num text-green-3">{fareNet.toFixed(2)} ر.س</span></div>
            </div>
            <div className="mt-3 text-center text-[10.5px] text-white/40">أرقام توضيحية — نسبة العمولة افتراض تخطيطي</div>
            <div className="mt-auto space-y-2">
              <DBtn onClick={() => onScreen('home')}>العودة واستقبال طلبات</DBtn>
              <DBtn variant="ghost" onClick={() => onScreen('earnings')}>عرض الأرباح</DBtn>
            </div>
          </motion.div>
        )}

        {/* 13 — EARNINGS */}
        {screen === 'earnings' && (
          <motion.div key="earnings" {...anim} className="absolute inset-0 flex flex-col pb-20">
            <Header title="الأرباح" />
            <div className="px-5">
              <div className="grid grid-cols-2 rounded-xl bg-white/6 p-1 text-[12px] font-semibold">
                {(['day', 'week'] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-lg py-1.5 ${range === r ? 'bg-white text-ink' : 'text-white/60'}`}>
                    {r === 'day' ? 'اليوم' : 'هذا الأسبوع'}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-[11px] text-white/50">{range === 'day' ? 'صافي أرباح اليوم' : 'صافي أرباح الأسبوع'}</div>
              <div className="num text-[32px] font-bold">
                {range === 'day' ? net : WEEK.reduce((a, b) => a + b.v, 0).toLocaleString('en-US')} <span className="text-sm">ر.س</span>
              </div>
              <div className="mt-2 h-36" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={range === 'day' ? DAY : WEEK} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis reversed dataKey="d" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                    <Bar dataKey="v" radius={[5, 5, 0, 0]} isAnimationActive>
                      {(range === 'day' ? DAY : WEEK).map((_, i, arr) => (
                        <Cell key={i} fill={i === (range === 'day' ? arr.length - 1 : 5) ? '#1fa36a' : 'rgba(255,255,255,0.18)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: 'الرحلات', v: range === 'day' ? today.trips : 52 },
                  { l: 'ساعات الاتصال', v: range === 'day' ? '6.5' : '41' },
                  { l: 'متوسط الرحلة', v: range === 'day' ? Math.round(today.gross / today.trips) : 46 },
                ].map((x) => (
                  <div key={x.l} className="rounded-xl bg-white/5 py-2">
                    <div className="text-[10px] text-white/45">{x.l}</div>
                    <div className="num text-[15px] font-bold">{x.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center text-[10px] text-white/35">بيانات تجريبية لأغراض العرض</div>
            </div>
          </motion.div>
        )}

        {/* 14 — HISTORY */}
        {screen === 'history' && (
          <motion.div key="history" {...anim} className="absolute inset-0 flex flex-col pb-20">
            <Header title="سجل الرحلات" />
            <div className="flex-1 space-y-2 overflow-y-auto px-5 no-scrollbar">
              {HISTORY.map((h, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl bg-white/5 p-3">
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span className="num">اليوم · {h.t}</span>
                    <span className={h.ok ? 'text-green-3' : 'text-[#ff8a85]'}>{h.ok ? 'مكتملة' : 'ملغاة من الراكب'}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[13px]">
                    <div className="flex-1">
                      <div className="font-semibold">{h.from}</div>
                      <div className="text-white/55">← {h.to}</div>
                    </div>
                    <div className="num text-[15px] font-bold">{h.ok ? `${h.fare} ر.س` : '—'}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 15 — WALLET */}
        {screen === 'wallet' && (
          <motion.div key="wallet" {...anim} className="absolute inset-0 flex flex-col pb-20">
            <Header title="المحفظة والتسويات" />
            <div className="flex-1 overflow-y-auto px-5 no-scrollbar">
              <div className="rounded-3xl bg-gradient-to-br from-green to-green-2 p-4">
                <div className="text-[11px] text-white/70">الرصيد القابل للتحويل</div>
                <div className="num mt-1 text-[30px] font-bold">1,846.40 <span className="text-sm">ر.س</span></div>
                <div className="mt-1 text-[11px] text-white/70">التسوية القادمة: الأحد · تحويل بنكي</div>
                <button type="button" className="mt-3 w-full rounded-xl bg-white py-2.5 text-[13px] font-bold text-ink">طلب تحويل الآن</button>
              </div>
              <div className="mt-4 mb-2 text-[12px] font-semibold text-white/50">آخر الحركات</div>
              <div className="space-y-1">
                {[
                  { t: 'تسوية أسبوعية', s: 'IBAN •••• 0921', v: -2310, d: 'الأحد' },
                  { t: 'أرباح رحلات', s: '7 رحلات', v: +net, d: 'اليوم' },
                  { t: 'حافز الانضمام', s: 'برنامج السائقين الأوائل', v: +150, d: 'الخميس' },
                  { t: 'تحصيل نقدي — عمولة', s: 'رحلات مدفوعة نقداً', v: -42.3, d: 'الأربعاء' },
                ].map((x, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-1 py-2">
                    <span className={`grid h-9 w-9 place-items-center rounded-full ${x.v > 0 ? 'bg-green-3/15 text-green-3' : 'bg-white/8 text-white/70'}`}>
                      {x.v > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{x.t}</div>
                      <div className="num text-[10.5px] text-white/45">{x.s} · {x.d}</div>
                    </div>
                    <div className={`num text-[13px] font-bold ${x.v > 0 ? 'text-green-3' : ''}`} dir="ltr">
                      {x.v > 0 ? '+' : '−'}{Math.abs(x.v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-[10px] text-white/35">بيانات تجريبية — لا توجد تحويلات فعلية</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showTabs && <TabBar screen={screen} go={onScreen} />}
    </div>
  )
}

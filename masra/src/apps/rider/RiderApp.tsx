import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Car,
  Check,
  ChevronLeft,
  Clock,
  CreditCard,
  Crown,
  Home,
  LocateFixed,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { MapCanvas } from '../../components/MapCanvas'
import { useProgress } from '../../hooks/useProgress'
import { DEMO_DRIVER, PAYMENTS, PLACES, RIDE_TYPES, fareFor } from '../../data/rides'

export type RiderScreen =
  | 'welcome'
  | 'home'
  | 'search'
  | 'rides'
  | 'confirm'
  | 'searching'
  | 'found'
  | 'tracking'
  | 'done'

export const RIDER_STEPS: { id: RiderScreen; label: string }[] = [
  { id: 'welcome', label: 'البداية وتسجيل الدخول' },
  { id: 'home', label: 'الصفحة الرئيسية' },
  { id: 'search', label: 'اختيار الوجهة' },
  { id: 'rides', label: 'نوع الرحلة' },
  { id: 'confirm', label: 'تأكيد الرحلة' },
  { id: 'searching', label: 'البحث عن سائق' },
  { id: 'found', label: 'تم العثور على السائق' },
  { id: 'tracking', label: 'متابعة الرحلة' },
  { id: 'done', label: 'نهاية الرحلة والتقييم' },
]

const screenAnim = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
}

function Btn({
  children,
  onClick,
  variant = 'dark',
  className = '',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'dark' | 'light' | 'green' | 'outline'
  className?: string
  disabled?: boolean
}) {
  const styles = {
    dark: 'bg-ink text-white hover:bg-ink-3',
    light: 'bg-mist-2 text-ink hover:bg-mist',
    green: 'bg-green text-white hover:bg-green-2',
    outline: 'border border-ink/15 text-ink hover:bg-mist-2',
  }[variant]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute inset-x-0 bottom-0 z-20 rounded-t-[28px] bg-white px-5 pt-3 pb-7 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] ${className}`}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
      {children}
    </motion.div>
  )
}

function TopBack({ onBack, title }: { onBack: () => void; title?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-12 pb-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="رجوع"
        className="grid h-10 w-10 place-items-center rounded-full bg-mist-2 text-ink hover:bg-mist"
      >
        <ArrowRight size={18} />
      </button>
      {title && <div className="text-[16px] font-bold">{title}</div>}
    </div>
  )
}

function RideIcon({ id, size = 22 }: { id: string; size?: number }) {
  if (id === 'lux') return <Crown size={size} />
  if (id === 'family') return <Users size={size} />
  if (id === 'xl') return <Briefcase size={size} />
  return <Car size={size} />
}

function Plate() {
  return (
    <div className="flex overflow-hidden rounded-md border-2 border-ink text-[10px] font-bold leading-tight">
      <div className="grid grid-cols-2 divide-x divide-ink/30">
        <div className="px-1.5 py-0.5 text-center" dir="ltr">٤٨٢٧</div>
        <div className="px-1.5 py-0.5 text-center">{DEMO_DRIVER.plateAr}</div>
        <div className="border-t border-ink/30 px-1.5 py-0.5 text-center num" dir="ltr">{DEMO_DRIVER.plateNum}</div>
        <div className="border-t border-ink/30 px-1.5 py-0.5 text-center" dir="ltr">{DEMO_DRIVER.plateEn}</div>
      </div>
      <div className="grid w-4 place-items-center bg-ink text-[6px] text-white [writing-mode:vertical-rl]">KSA</div>
    </div>
  )
}

function DriverAvatar({ size = 52 }: { size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-green to-ink font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {DEMO_DRIVER.initials}
      <span className="absolute -bottom-1 rounded-full bg-white px-1.5 text-[10px] font-semibold text-ink shadow num">
        ★ {DEMO_DRIVER.rating}
      </span>
    </div>
  )
}

export function RiderApp({
  screen,
  onScreen,
}: {
  screen: RiderScreen
  onScreen: (s: RiderScreen) => void
}) {
  const [phone, setPhone] = useState('5')
  const [loggedIn, setLoggedIn] = useState(false)
  const [placeId, setPlaceId] = useState(PLACES[1].id)
  const [query, setQuery] = useState('')
  const [rideId, setRideId] = useState(RIDE_TYPES[0].id)
  const [payId, setPayId] = useState(PAYMENTS[0].id)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tip, setTip] = useState(0)

  const place = PLACES.find((p) => p.id === placeId) ?? PLACES[0]
  const ride = RIDE_TYPES.find((r) => r.id === rideId) ?? RIDE_TYPES[0]
  const pay = PAYMENTS.find((p) => p.id === payId) ?? PAYMENTS[0]
  const fare = fareFor(place, ride)

  const filtered = useMemo(
    () => PLACES.filter((p) => !query || p.name.includes(query) || p.area.includes(query)),
    [query],
  )

  // searching → found automatically
  useEffect(() => {
    if (screen !== 'searching') return
    const t = setTimeout(() => onScreen('found'), 3400)
    return () => clearTimeout(t)
  }, [screen, onScreen])

  useEffect(() => {
    if (screen === 'done') {
      setRating(0)
      setComment('')
      setSubmitted(false)
      setTip(0)
    }
  }, [screen])

  const approach = useProgress(screen === 'found', 9000, screen === 'found')
  const trip = useProgress(screen === 'tracking', 11000, screen === 'tracking', () =>
    setTimeout(() => onScreen('done'), 700),
  )

  const PayIcon = payId === 'cash' ? Banknote : payId === 'wallet' ? Wallet : CreditCard

  return (
    <div className="relative h-full w-full overflow-hidden bg-white font-sans" dir="rtl">
      <AnimatePresence mode="wait" initial={false}>
        {/* 1 — WELCOME / LOGIN */}
        {screen === 'welcome' && (
          <motion.div key="welcome" {...screenAnim} className="absolute inset-0 flex flex-col bg-ink text-white">
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute inset-0 opacity-40">
                <MapCanvas showNearby showUser={false} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/70 to-ink" />
              <div className="relative flex h-full flex-col items-center justify-center pt-10">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
                  <LogoMark size={72} dark animate />
                </motion.div>
                <div className="mt-4 text-3xl font-bold">مَسْرى</div>
                <div className="mt-1 text-[11px] tracking-[0.4em] text-white/50">MASRA</div>
                <div className="mt-3 text-sm text-white/70">رحلتك تبدأ من هنا</div>
              </div>
            </div>
            <div className="rounded-t-[28px] bg-white px-5 pt-6 pb-9 text-ink">
              <div className="text-lg font-bold">{loggedIn ? 'أدخل رمز التحقق' : 'أهلاً بك 👋'}</div>
              <div className="mt-1 text-[13px] text-ink/55">
                {loggedIn ? `أرسلنا رمزاً تجريبياً إلى ‎+966 ${phone}` : 'سجّل الدخول أو أنشئ حساباً برقم جوالك'}
              </div>
              {!loggedIn ? (
                <>
                  <div className="mt-4 flex h-12 items-center gap-2 rounded-2xl border border-ink/10 bg-mist-2 px-3" dir="ltr">
                    <span className="text-sm font-semibold whitespace-nowrap num">+966</span>
                    <span className="h-5 w-px bg-ink/15" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      inputMode="numeric"
                      placeholder="5X XXX XXXX"
                      aria-label="رقم الجوال"
                      className="num w-full bg-transparent text-[15px] font-medium outline-none"
                    />
                    <Phone size={16} className="text-ink/40" />
                  </div>
                  <Btn className="mt-3" onClick={() => setLoggedIn(true)}>
                    تسجيل الدخول
                  </Btn>
                  <Btn className="mt-2" variant="outline" onClick={() => setLoggedIn(true)}>
                    إنشاء حساب جديد
                  </Btn>
                  <div className="mt-3 text-center text-[10px] text-ink/40">نموذج تجريبي — لا يتم إرسال أي رسائل فعلية</div>
                </>
              ) : (
                <>
                  <div className="mt-4 flex justify-between gap-2" dir="ltr">
                    {[4, 8, 2, 1].map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.12 }}
                        className="num grid h-12 flex-1 place-items-center rounded-2xl border-2 border-ink bg-mist-2 text-lg font-bold"
                      >
                        {d}
                      </motion.div>
                    ))}
                  </div>
                  <Btn className="mt-4" onClick={() => onScreen('home')}>
                    تحقق ومتابعة
                  </Btn>
                  <button type="button" onClick={() => setLoggedIn(false)} className="mt-3 w-full text-center text-[12px] text-ink/50">
                    تغيير رقم الجوال
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* 2 — HOME */}
        {screen === 'home' && (
          <motion.div key="home" {...screenAnim} className="absolute inset-0">
            <MapCanvas showNearby />
            <div className="absolute inset-x-0 top-11 z-10 flex items-center justify-between px-4">
              <button type="button" aria-label="القائمة" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-md">
                <Menu size={18} />
              </button>
              <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold shadow-md">
                <span className="text-green-2">●</span> الدمام · حي الشاطئ
              </div>
              <button
                type="button"
                aria-label="تحديد موقعي"
                className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-md active:scale-95"
              >
                <LocateFixed size={18} className="text-green-2" />
              </button>
            </div>
            <Sheet>
              <div className="text-[17px] font-bold">مساء الخير، عبدالله</div>
              <button
                type="button"
                onClick={() => onScreen('search')}
                className="mt-3 flex h-12 w-full items-center gap-3 rounded-2xl bg-mist-2 px-4 text-start text-[15px] font-semibold text-ink/60 transition hover:bg-mist"
              >
                <Search size={18} className="text-ink" />
                إلى أين تريد الذهاب؟
              </button>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {RIDE_TYPES.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRideId(r.id)
                      onScreen('search')
                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-mist-2 py-2.5 text-[11px] font-semibold transition hover:bg-mist"
                  >
                    <RideIcon id={r.id} size={20} />
                    {r.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                {[
                  { icon: Home, t: 'المنزل', s: 'الدمام، حي الشاطئ', p: 'waterfront' },
                  { icon: Briefcase, t: 'العمل', s: 'الظهران', p: 'kfupm' },
                ].map((x) => (
                  <button
                    key={x.t}
                    type="button"
                    onClick={() => {
                      setPlaceId(x.p)
                      onScreen('rides')
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-start hover:bg-mist-2"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-mist-2">
                      <x.icon size={16} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[13px] font-semibold">{x.t}</span>
                      <span className="block text-[11px] text-ink/50">{x.s}</span>
                    </span>
                    <ChevronLeft size={16} className="text-ink/30" />
                  </button>
                ))}
              </div>
            </Sheet>
          </motion.div>
        )}

        {/* 3 — DESTINATION SEARCH */}
        {screen === 'search' && (
          <motion.div key="search" {...screenAnim} className="absolute inset-0 flex flex-col bg-white">
            <TopBack onBack={() => onScreen('home')} title="حدد وجهتك" />
            <div className="mx-4 mt-2 flex gap-3 rounded-2xl bg-mist-2 p-3">
              <div className="flex flex-col items-center pt-3">
                <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                <span className="my-1 h-8 w-px border-r border-dashed border-ink/30" />
                <span className="h-2.5 w-2.5 bg-green" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="rounded-xl bg-white px-3 py-2.5 text-[13px] font-medium">
                  <span className="block text-[10px] text-ink/45">نقطة الانطلاق</span>
                  موقعي الحالي · حي الشاطئ
                </div>
                <div className="flex items-center rounded-xl bg-white px-3 py-2 ring-2 ring-ink">
                  <div className="flex-1">
                    <span className="block text-[10px] text-ink/45">نقطة الوصول</span>
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ابحث عن مكان…"
                      aria-label="البحث عن الوجهة"
                      className="w-full bg-transparent text-[13px] font-medium outline-none"
                    />
                  </div>
                  {query && (
                    <button type="button" aria-label="مسح" onClick={() => setQuery('')}>
                      <X size={14} className="text-ink/40" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 px-5 text-[12px] font-semibold text-ink/45">أماكن مقترحة</div>
            <div className="mt-1 flex-1 overflow-y-auto px-3 pb-8 no-scrollbar">
              {filtered.map((p, i) => (
                <motion.button
                  key={p.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    setPlaceId(p.id)
                    onScreen('rides')
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start hover:bg-mist-2"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist-2">
                    <MapPin size={16} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-semibold leading-5">{p.name}</span>
                    <span className="block text-[11px] text-ink/50">{p.area}</span>
                  </span>
                  <span className="num text-[11px] text-ink/45">{p.km} كم</span>
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <div className="py-10 text-center text-[12px] text-ink/45">لا توجد نتائج تجريبية مطابقة</div>
              )}
            </div>
          </motion.div>
        )}

        {/* 4 — RIDE TYPE */}
        {screen === 'rides' && (
          <motion.div key="rides" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[46%]">
              <MapCanvas mode="preview" showPickup showDropoff showNearby={false} />
            </div>
            <div className="absolute top-11 right-4 z-10">
              <button type="button" aria-label="رجوع" onClick={() => onScreen('search')} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-md">
                <ArrowRight size={18} />
              </button>
            </div>
            <Sheet className="h-[60%]">
              <div className="flex items-baseline justify-between">
                <div className="text-[16px] font-bold">اختر نوع الرحلة</div>
                <div className="text-[11px] text-ink/50">إلى {place.name.split(' ').slice(0, 2).join(' ')}</div>
              </div>
              <div className="mt-2 h-[calc(100%-110px)] space-y-1.5 overflow-y-auto no-scrollbar">
                {RIDE_TYPES.map((r) => {
                  const active = r.id === rideId
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRideId(r.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-start transition ${
                        active ? 'border-ink bg-mist-2' : 'border-transparent hover:bg-mist-2'
                      }`}
                    >
                      <span className={`grid h-11 w-11 place-items-center rounded-xl ${active ? 'bg-ink text-white' : 'bg-mist text-ink'}`}>
                        <RideIcon id={r.id} />
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-1.5 text-[14px] font-bold">
                          {r.name}
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-ink/45">
                            <Users size={10} />
                            {r.seats}
                          </span>
                        </span>
                        <span className="block text-[10.5px] text-ink/50">
                          يصل خلال <span className="num">{r.eta}</span> د · {r.desc}
                        </span>
                      </span>
                      <span className="num text-[14px] font-bold">
                        {fareFor(place, r)}
                        <span className="text-[10px] font-medium"> ر.س</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <Btn className="absolute inset-x-5 bottom-7 !w-auto" onClick={() => onScreen('confirm')}>
                اختيار {ride.name}
              </Btn>
            </Sheet>
          </motion.div>
        )}

        {/* 5 — CONFIRM */}
        {screen === 'confirm' && (
          <motion.div key="confirm" {...screenAnim} className="absolute inset-0 flex flex-col bg-white">
            <TopBack onBack={() => onScreen('rides')} title="تأكيد الرحلة" />
            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 no-scrollbar">
              <div className="rounded-2xl bg-mist-2 p-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                    <span className="my-1 h-7 w-px border-r border-dashed border-ink/30" />
                    <span className="h-2.5 w-2.5 bg-green" />
                  </div>
                  <div className="flex-1 space-y-3 text-[13px]">
                    <div>
                      <div className="text-[10px] text-ink/45">من</div>
                      <div className="font-semibold">موقعي الحالي · حي الشاطئ</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-ink/45">إلى</div>
                      <div className="font-semibold">{place.name}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: 'المسافة', v: `${place.km}`, u: 'كم' },
                  { l: 'المدة', v: `${place.min}`, u: 'دقيقة' },
                  { l: 'الفئة', v: ride.name, u: '' },
                ].map((x) => (
                  <div key={x.l} className="rounded-2xl border border-ink/10 py-2.5">
                    <div className="text-[10px] text-ink/45">{x.l}</div>
                    <div className="num text-[15px] font-bold">
                      {x.v} <span className="text-[10px] font-medium">{x.u}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1.5 text-[12px] font-semibold text-ink/50">وسيلة الدفع</div>
                <div className="space-y-1.5">
                  {PAYMENTS.map((p) => {
                    const Ic = p.id === 'cash' ? Banknote : p.id === 'wallet' ? Wallet : CreditCard
                    const on = p.id === payId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPayId(p.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-start ${on ? 'border-ink' : 'border-ink/8 hover:bg-mist-2'}`}
                      >
                        <Ic size={18} />
                        <span className="flex-1 text-[13px] font-semibold">
                          {p.name} <span className="num text-[11px] font-normal text-ink/45">{p.detail}</span>
                        </span>
                        <span className={`grid h-5 w-5 place-items-center rounded-full ${on ? 'bg-ink text-white' : 'border border-ink/20'}`}>
                          {on && <Check size={12} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="border-t border-ink/8 px-4 pt-3 pb-8">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-ink/50">السعر التقديري</div>
                  <div className="text-[10px] text-amber-700">تسعير تجريبي غير معتمد</div>
                </div>
                <div className="num text-2xl font-bold">
                  {fare} <span className="text-sm">ر.س</span>
                </div>
              </div>
              <Btn onClick={() => onScreen('searching')}>تأكيد الطلب</Btn>
            </div>
          </motion.div>
        )}

        {/* 6 — SEARCHING */}
        {screen === 'searching' && (
          <motion.div key="searching" {...screenAnim} className="absolute inset-0">
            <MapCanvas showNearby showUser />
            <div className="pointer-events-none absolute inset-0">
              <svg viewBox="0 0 320 668" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
                {[0, 1, 2].map((i) => (
                  <motion.circle
                    key={i}
                    cx="110"
                    cy="470"
                    r="20"
                    fill="none"
                    stroke="#1fa36a"
                    strokeWidth="2"
                    initial={{ r: 20, opacity: 0.8 }}
                    animate={{ r: 190, opacity: 0 }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
                  />
                ))}
                <motion.g
                  style={{ originX: '110px', originY: '470px' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
                >
                  <path d="M110 470 L110 300 A170 170 0 0 1 257 385 Z" fill="url(#sweep)" />
                </motion.g>
                <defs>
                  <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#1fa36a" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#1fa36a" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <Sheet>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <motion.span
                    className="absolute inset-0 rounded-full border-[3px] border-ink/10 border-t-green-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <Car size={18} className="absolute inset-0 m-auto" />
                </div>
                <div>
                  <div className="text-[15px] font-bold">جارٍ البحث عن أقرب سائق…</div>
                  <div className="text-[12px] text-ink/50">نطابق طلبك مع السائقين القريبين</div>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-mist">
                <motion.div className="h-full bg-green-3" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.3, ease: 'easeInOut' }} />
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-ink/50">
                <span>{ride.name} · {fare} ر.س</span>
                <span>{place.name.split(' ').slice(0, 2).join(' ')}</span>
              </div>
              <Btn className="mt-4" variant="light" onClick={() => onScreen('confirm')}>
                إلغاء الطلب
              </Btn>
            </Sheet>
          </motion.div>
        )}

        {/* 7 — DRIVER FOUND */}
        {screen === 'found' && (
          <motion.div key="found" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[58%]">
              <MapCanvas mode="approach" progress={approach} showNearby={false} showPickup />
            </div>
            <div className="absolute top-12 inset-x-4 z-10 flex justify-center">
              <div className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
                {approach >= 1 ? 'وصل السائق إلى موقعك' : <>السائق في الطريق · <span className="num">{Math.max(1, Math.ceil((1 - approach) * 4))}</span> د</>}
              </div>
            </div>
            <Sheet>
              <div className="flex items-center gap-3">
                <DriverAvatar />
                <div className="flex-1">
                  <div className="text-[15px] font-bold">{DEMO_DRIVER.name}</div>
                  <div className="text-[11px] text-ink/50">{DEMO_DRIVER.car}</div>
                  <div className="num text-[10px] text-ink/40">{DEMO_DRIVER.trips.toLocaleString('en-US')} رحلة · سائق تجريبي</div>
                </div>
                <Plate />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { icon: Phone, t: 'اتصال' },
                  { icon: MessageSquare, t: 'رسالة' },
                  { icon: ShieldCheck, t: 'الأمان' },
                ].map((x) => (
                  <button key={x.t} type="button" className="flex flex-col items-center gap-1 rounded-2xl bg-mist-2 py-2.5 text-[11px] font-semibold hover:bg-mist">
                    <x.icon size={17} />
                    {x.t}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-ink/10 px-3 py-2 text-[12px]">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> الوصول المتوقع
                </span>
                <span className="num font-bold">{approach >= 1 ? 'الآن' : `${Math.max(1, Math.ceil((1 - approach) * 4))} دقائق`}</span>
              </div>
              <Btn className="mt-3" onClick={() => onScreen('tracking')}>
                {approach >= 1 ? 'ابدأ الرحلة' : 'تخطّي: ركبت السيارة'}
              </Btn>
            </Sheet>
          </motion.div>
        )}

        {/* 8 — TRACKING */}
        {screen === 'tracking' && (
          <motion.div key="tracking" {...screenAnim} className="absolute inset-0">
            <MapCanvas mode="trip" progress={trip} showNearby={false} showDropoff />
            <div className="absolute top-12 inset-x-4 z-10 rounded-2xl bg-ink px-4 py-3 text-white shadow-lg">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/60">في الطريق إلى</span>
                <span className="num font-semibold">{Math.max(0, Math.round((1 - trip) * place.min))} د متبقية</span>
              </div>
              <div className="mt-0.5 text-[14px] font-bold">{place.name}</div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full bg-green-3" style={{ width: `${trip * 100}%` }} />
              </div>
            </div>
            <Sheet>
              <div className="flex items-center gap-3">
                <DriverAvatar size={44} />
                <div className="flex-1">
                  <div className="text-[14px] font-bold">{DEMO_DRIVER.name}</div>
                  <div className="text-[11px] text-ink/50">{DEMO_DRIVER.car}</div>
                </div>
                <Plate />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-xl bg-mist-2 px-3 py-2">
                  <div className="text-[10px] text-ink/45">المسافة المقطوعة</div>
                  <div className="num font-bold">{(trip * place.km).toFixed(1)} / {place.km} كم</div>
                </div>
                <div className="rounded-xl bg-mist-2 px-3 py-2">
                  <div className="text-[10px] text-ink/45">الدفع</div>
                  <div className="flex items-center gap-1 font-bold">
                    <PayIcon size={13} /> {pay.name}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <Btn variant="light" onClick={() => onScreen('done')}>
                  محاكاة الوصول
                </Btn>
                <button type="button" className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/10 text-danger" aria-label="طوارئ">
                  <ShieldCheck size={18} />
                </button>
              </div>
            </Sheet>
          </motion.div>
        )}

        {/* 9 — TRIP END */}
        {screen === 'done' && (
          <motion.div key="done" {...screenAnim} className="absolute inset-0 flex flex-col bg-white">
            {!submitted ? (
              <>
                <div className="bg-ink px-5 pt-14 pb-6 text-center text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-3"
                  >
                    <Check size={24} />
                  </motion.div>
                  <div className="mt-3 text-[13px] text-white/60">وصلت بسلامة إلى {place.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="num mt-1 text-4xl font-bold">
                    {fare + tip} <span className="text-base">ر.س</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px]">
                    <PayIcon size={12} /> {pay.name} {pay.detail.includes('•') && <span className="num">{pay.detail}</span>}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 no-scrollbar">
                  <div className="flex items-center gap-3">
                    <DriverAvatar size={44} />
                    <div>
                      <div className="text-[12px] text-ink/50">كيف كانت رحلتك مع</div>
                      <div className="text-[15px] font-bold">{DEMO_DRIVER.name}؟</div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-2" dir="ltr">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <motion.button
                        key={n}
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setRating(n)}
                        aria-label={`${n} نجوم`}
                      >
                        <Star size={34} className={n <= rating ? 'fill-gold text-gold' : 'text-ink/15'} strokeWidth={1.5} />
                      </motion.button>
                    ))}
                  </div>
                  <div className="mt-1 h-4 text-center text-[11px] text-ink/50">
                    {['', 'سيئة', 'مقبولة', 'جيدة', 'رائعة', 'ممتازة!'][rating]}
                  </div>
                  <div className="mt-3 text-[12px] font-semibold text-ink/50">إكرامية للسائق (اختياري)</div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {[0, 3, 5, 10].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTip(t)}
                        className={`num rounded-xl py-2 text-[12px] font-semibold ${tip === t ? 'bg-ink text-white' : 'bg-mist-2'}`}
                      >
                        {t === 0 ? 'بدون' : `${t} ر.س`}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="أضف تعليقاً عن الرحلة…"
                    aria-label="تعليق"
                    rows={2}
                    className="mt-3 w-full resize-none rounded-2xl bg-mist-2 p-3 text-[13px] outline-none focus:ring-2 focus:ring-ink"
                  />
                </div>
                <div className="px-5 pb-8">
                  <Btn disabled={rating === 0} onClick={() => setSubmitted(true)}>
                    إرسال التقييم
                  </Btn>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <LogoMark size={64} />
                </motion.div>
                <div className="mt-5 text-xl font-bold">شكراً لتقييمك</div>
                <div className="mt-2 text-[13px] leading-6 text-ink/55">
                  تقييمك يساعدنا في الحفاظ على جودة الخدمة وسلامة الرحلات.
                </div>
                <div className="mt-6 w-full">
                  <Btn onClick={() => onScreen('home')}>طلب رحلة جديدة</Btn>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  BusFront,
  CalendarClock,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  CreditCard,
  Crown,
  Home,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Plane,
  Plus,
  Radio,
  ReceiptText,
  Search,
  Share2,
  ShieldCheck,
  Star,
  User,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { MapCanvas } from '../../components/MapCanvas'
import { CarArt } from '../../components/CarArt'
import { useProgress } from '../../hooks/useProgress'
import { DEMO_DRIVER, PAYMENTS, PLACES, RIDE_TYPES, clockAt, fareFor, type RideType } from '../../data/rides'

export type RiderScreen = 'welcome' | 'home' | 'search' | 'rides' | 'pickup' | 'searching' | 'found' | 'tracking' | 'done'

export const RIDER_STEPS: { id: RiderScreen; label: string }[] = [
  { id: 'welcome', label: 'البداية وتسجيل الدخول' },
  { id: 'home', label: 'الصفحة الرئيسية والخدمات' },
  { id: 'search', label: 'اختيار الوجهة' },
  { id: 'rides', label: 'اختيار نوع الرحلة والسعر' },
  { id: 'pickup', label: 'تأكيد نقطة الالتقاء' },
  { id: 'searching', label: 'الربط بأقرب سائق' },
  { id: 'found', label: 'السائق في الطريق ورمز التحقق' },
  { id: 'tracking', label: 'متابعة الرحلة وتفاصيلها' },
  { id: 'done', label: 'نهاية الرحلة والتقييم' },
]

const screenAnim = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
}

function Btn({ children, onClick, variant = 'dark', className = '', disabled }: { children: ReactNode; onClick?: () => void; variant?: 'dark' | 'light' | 'outline'; className?: string; disabled?: boolean }) {
  const styles = { dark: 'bg-ink text-white hover:bg-ink-3', light: 'bg-mist-2 text-ink hover:bg-mist', outline: 'border border-ink/15 text-ink hover:bg-mist-2' }[variant]
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  )
}

function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`absolute inset-x-0 bottom-0 z-20 rounded-t-[22px] bg-white pt-2 pb-7 shadow-[0_-10px_36px_rgba(0,0,0,0.14)] ${className}`}>
      <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-ink/15" />
      {children}
    </motion.div>
  )
}

function RoundBtn({ onClick, label, children, className = '' }: { onClick?: () => void; label: string; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-[0_2px_10px_rgba(0,0,0,0.16)] active:scale-95 ${className}`}>
      {children}
    </button>
  )
}

function MinBox({ value, label = 'دقيقة' }: { value: number | string; label?: string }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-ink text-white">
      <div className="text-center leading-none">
        <div className="num text-[18px] font-bold">{value}</div>
        <div className="mt-0.5 text-[8.5px] opacity-70">{label}</div>
      </div>
    </div>
  )
}

function Plate() {
  return (
    <div className="flex overflow-hidden rounded-md border-[1.5px] border-ink text-[9.5px] font-bold leading-tight">
      <div className="grid grid-cols-2 divide-x divide-ink/30">
        <div className="px-1.5 py-0.5 text-center" dir="ltr">٤٨٢٧</div>
        <div className="px-1.5 py-0.5 text-center">{DEMO_DRIVER.plateAr}</div>
        <div className="num border-t border-ink/30 px-1.5 py-0.5 text-center" dir="ltr">{DEMO_DRIVER.plateNum}</div>
        <div className="border-t border-ink/30 px-1.5 py-0.5 text-center" dir="ltr">{DEMO_DRIVER.plateEn}</div>
      </div>
      <div className="grid w-3.5 place-items-center bg-ink text-[5.5px] text-white [writing-mode:vertical-rl]">KSA</div>
    </div>
  )
}

function DriverAvatar({ size = 48 }: { size?: number }) {
  return (
    <div className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-green to-ink font-bold text-white ring-2 ring-white" style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {DEMO_DRIVER.initials}
    </div>
  )
}

function PlaceIcon({ kind }: { kind?: string }) {
  const I = kind === 'airport' ? Plane : kind === 'recent' ? Clock : MapPin
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink/70">
      <I size={15} />
    </span>
  )
}

function RideRow({ r, fare, active, onClick, showDesc }: { r: RideType; fare: number; active: boolean; onClick: () => void; showDesc?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-start transition ${active ? 'border-ink' : 'border-transparent hover:bg-mist-2'}`}>
      <CarArt kind={r.car} color={r.color} width={58} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14px] font-bold">
          {r.name}
          <span className="flex items-center gap-0.5 text-[10.5px] font-medium text-ink/60">
            <User size={10} strokeWidth={2.5} />
            <span className="num">{r.seats}</span>
          </span>
        </span>
        <span className="num block text-[11px] text-ink/55">
          {clockAt(r.eta + 14)} · بعد {r.eta} د
        </span>
        {showDesc && <span className="block truncate text-[10.5px] text-ink/45">{r.desc}</span>}
        {r.tag && !showDesc && <span className="mt-0.5 inline-block rounded bg-green-soft px-1.5 py-px text-[9.5px] font-bold text-green">{r.tag}</span>}
      </span>
      <span className="num text-[14px] font-bold">{fare} ر.س</span>
    </button>
  )
}

export function RiderApp({ screen, onScreen }: { screen: RiderScreen; onScreen: (s: RiderScreen) => void }) {
  const [phone, setPhone] = useState('5')
  const [loggedIn, setLoggedIn] = useState(false)
  const [placeId, setPlaceId] = useState(PLACES[1].id)
  const [query, setQuery] = useState('')
  const [rideId, setRideId] = useState(RIDE_TYPES[0].id)
  const [payId, setPayId] = useState(PAYMENTS[0].id)
  const [expanded, setExpanded] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [toast, setToast] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tip, setTip] = useState(0)

  const place = PLACES.find((p) => p.id === placeId) ?? PLACES[0]
  const ride = RIDE_TYPES.find((r) => r.id === rideId) ?? RIDE_TYPES[0]
  const pay = PAYMENTS.find((p) => p.id === payId) ?? PAYMENTS[0]
  const fare = fareFor(place, ride)
  const short = place.name.split(' ').slice(0, 2).join(' ')

  const filtered = useMemo(() => PLACES.filter((p) => !query || p.name.includes(query) || p.area.includes(query) || p.addr.includes(query)), [query])

  useEffect(() => {
    if (screen !== 'searching') return
    const t = setTimeout(() => onScreen('found'), 3600)
    return () => clearTimeout(t)
  }, [screen, onScreen])

  useEffect(() => {
    if (screen === 'done') {
      setRating(0)
      setComment('')
      setSubmitted(false)
      setTip(0)
    }
    if (screen === 'found') setToast(true)
    if (screen !== 'rides') {
      setExpanded(false)
      setPayOpen(false)
    }
  }, [screen])

  const approach = useProgress(screen === 'found', 9000, screen === 'found')
  const trip = useProgress(screen === 'tracking', 12000, screen === 'tracking', () => setTimeout(() => onScreen('done'), 700))
  const minsAway = approach >= 1 ? 0 : Math.max(1, Math.ceil((1 - approach) * ride.eta))

  const PayIcon = payId === 'cash' ? Banknote : payId === 'wallet' ? Wallet : CreditCard

  return (
    <div className="relative h-full w-full overflow-hidden bg-white font-sans" dir="rtl">
      <AnimatePresence mode="wait" initial={false}>
        {/* 1 — WELCOME / LOGIN */}
        {screen === 'welcome' && (
          <motion.div key="welcome" {...screenAnim} className="absolute inset-0 flex flex-col bg-ink text-white">
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <MapCanvas showNearby showUser={false} labels={false} dark />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/60 to-ink" />
              <div className="relative flex h-full flex-col items-center justify-center pt-10">
                <LogoMark size={72} dark animate />
                <div className="mt-4 text-3xl font-bold">مَسْرى</div>
                <div className="mt-1 text-[11px] tracking-[0.4em] text-white/50">MASRA</div>
                <div className="mt-3 text-sm text-white/70">رحلتك تبدأ من هنا</div>
              </div>
            </div>
            <div className="rounded-t-[24px] bg-white px-5 pt-6 pb-9 text-ink">
              <div className="text-lg font-bold">{loggedIn ? 'أدخل رمز التحقق' : 'أهلاً بك'}</div>
              <div className="mt-1 text-[13px] text-ink/55">{loggedIn ? `أرسلنا رمزاً تجريبياً إلى ‎+966 ${phone}` : 'سجّل الدخول أو أنشئ حساباً برقم جوالك'}</div>
              {!loggedIn ? (
                <>
                  <div className="mt-4 flex h-12 items-center gap-2 rounded-xl border border-ink/10 bg-mist-2 px-3" dir="ltr">
                    <span className="num text-sm font-semibold whitespace-nowrap">+966</span>
                    <span className="h-5 w-px bg-ink/15" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} inputMode="numeric" placeholder="5X XXX XXXX" aria-label="رقم الجوال" className="num w-full bg-transparent text-[15px] font-medium outline-none" />
                    <Phone size={16} className="text-ink/40" />
                  </div>
                  <Btn className="mt-3" onClick={() => setLoggedIn(true)}>تسجيل الدخول</Btn>
                  <Btn className="mt-2" variant="outline" onClick={() => setLoggedIn(true)}>إنشاء حساب جديد</Btn>
                  <div className="mt-3 text-center text-[10px] text-ink/40">نموذج تجريبي — لا يتم إرسال أي رسائل فعلية</div>
                </>
              ) : (
                <>
                  <div className="mt-4 flex justify-between gap-2" dir="ltr">
                    {[4, 8, 2, 1].map((d, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className="num grid h-12 flex-1 place-items-center rounded-xl border-2 border-ink bg-mist-2 text-lg font-bold">
                        {d}
                      </motion.div>
                    ))}
                  </div>
                  <Btn className="mt-4" onClick={() => onScreen('home')}>تحقق ومتابعة</Btn>
                  <button type="button" onClick={() => setLoggedIn(false)} className="mt-3 w-full text-center text-[12px] text-ink/50">تغيير رقم الجوال</button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* 2 — HOME: services hub */}
        {screen === 'home' && (
          <motion.div key="home" {...screenAnim} className="absolute inset-0 flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto px-4 pt-12 pb-24 no-scrollbar">
              {/* promo */}
              <button type="button" onClick={() => onScreen('search')} className="relative block h-[104px] w-full overflow-hidden rounded-2xl bg-green text-start text-white">
                <svg viewBox="0 0 160 104" className="absolute inset-y-0 left-0 h-full" aria-hidden="true">
                  <path d="M10 100 C 40 70, 30 40, 80 36 S 130 10, 150 -4" fill="none" stroke="#1fa36a" strokeWidth="10" strokeLinecap="round" opacity="0.55" />
                  <path d="M10 100 C 40 70, 30 40, 80 36 S 130 10, 150 -4" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.6" />
                  <circle cx="80" cy="36" r="6" fill="#fff" />
                  <circle cx="80" cy="36" r="2.5" fill="#0f5b3a" />
                </svg>
                <div className="relative p-4">
                  <div className="text-[17px] font-bold leading-6">تنقّل بسهولة<br />في الشرقية</div>
                  <div className="mt-1.5 flex items-center gap-1 text-[12px] text-white/85">
                    اطلب رحلتك الآن <ChevronLeft size={13} />
                  </div>
                </div>
              </button>

              {/* services */}
              <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3">
                {[
                  { I: Car, t: 'رحلة', go: () => onScreen('search') },
                  { I: CalendarClock, t: 'حجز مسبق', go: () => onScreen('search') },
                  { I: Plane, t: 'المطار', go: () => { setPlaceId('airport'); onScreen('rides') } },
                  { I: Users, t: 'عائلي', go: () => { setRideId('family'); onScreen('search') } },
                  { I: BusFront, t: 'XL', go: () => { setRideId('xl'); onScreen('search') } },
                  { I: Crown, t: 'فاخر', go: () => { setRideId('lux'); onScreen('search') } },
                  { I: Package, t: 'طرود', soon: true },
                  { I: MoreHorizontal, t: 'المزيد' },
                ].map(({ I, t, go, soon }) => (
                  <button key={t} type="button" onClick={go} className="group flex flex-col items-center gap-1">
                    <span className="relative grid h-[58px] w-full place-items-center rounded-xl bg-mist-2 transition group-hover:bg-mist">
                      <I size={24} strokeWidth={1.7} />
                      {soon && <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-1.5 text-[8px] font-bold text-white">قريباً</span>}
                    </span>
                    <span className="text-[11px] font-medium">{t}</span>
                  </button>
                ))}
              </div>

              {/* where to */}
              <button type="button" onClick={() => onScreen('search')} className="mt-4 flex h-12 w-full items-center gap-2.5 rounded-full bg-mist-2 pe-1.5 ps-4 text-start">
                <Search size={18} strokeWidth={2.4} />
                <span className="flex-1 text-[15px] font-semibold text-ink/70">إلى أين؟</span>
                <span className="flex h-9 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold shadow-sm">
                  <Clock size={13} /> الآن <ChevronDown size={13} />
                </span>
              </button>

              <div className="mt-1 divide-y divide-ink/5">
                <button type="button" onClick={() => onScreen('search')} className="flex w-full items-center gap-3 py-3 text-start text-[13px] font-medium">
                  <Star size={17} className="fill-ink" /> اختر مكاناً محفوظاً
                </button>
                <button type="button" onClick={() => onScreen('pickup')} className="flex w-full items-center gap-3 py-3 text-start text-[13px] font-medium">
                  <MapPin size={17} className="fill-ink text-white" strokeWidth={1.5} /> حدد الوجهة على الخريطة
                </button>
              </div>

              <div className="mt-3 text-[15px] font-bold">حولك</div>
              <div className="mt-2 h-28 overflow-hidden rounded-2xl">
                <MapCanvas showNearby showUser />
              </div>
            </div>
            {/* tab bar */}
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t border-ink/5 bg-white pt-2 pb-6">
              {[
                { I: Home, t: 'الرئيسية', on: true },
                { I: ReceiptText, t: 'النشاط' },
                { I: UserRound, t: 'الحساب' },
              ].map(({ I, t, on }) => (
                <span key={t} className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${on ? 'text-ink' : 'text-ink/35'}`}>
                  <I size={19} className={on ? 'fill-ink/10' : ''} />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3 — DESTINATION SEARCH */}
        {screen === 'search' && (
          <motion.div key="search" {...screenAnim} className="absolute inset-0 flex flex-col bg-white">
            <div className="relative flex items-center justify-center px-4 pt-12 pb-3">
              <button type="button" onClick={() => onScreen('home')} aria-label="رجوع" className="absolute right-3 grid h-9 w-9 place-items-center rounded-full hover:bg-mist-2">
                <ArrowRight size={20} />
              </button>
              <span className="flex items-center gap-1.5 rounded-full bg-mist-2 px-3 py-1.5 text-[12px] font-semibold">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-green-3 text-white"><User size={11} /></span>
                الرحلة لي <ChevronDown size={13} />
              </span>
            </div>
            <div className="flex items-start gap-2 px-4">
              <div className="flex flex-col items-center pt-4">
                <span className="h-2 w-2 rounded-full bg-ink" />
                <span className="my-1 h-8 w-px bg-ink/40" />
                <span className="h-2 w-2 bg-ink" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="truncate rounded-md bg-mist-2 px-3 py-2.5 text-[13px] text-ink/70">موقعي الحالي · حي الشاطئ، الدمام</div>
                <div className="flex items-center rounded-md bg-mist px-3 py-1.5 ring-2 ring-ink">
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="إلى أين؟" aria-label="البحث عن الوجهة" className="h-7 w-full bg-transparent text-[13px] font-medium outline-none" />
                  {query && (
                    <button type="button" aria-label="مسح" onClick={() => setQuery('')}><X size={14} className="text-ink/40" /></button>
                  )}
                </div>
                <div className="text-left">
                  <span className="rounded bg-ink/75 px-1.5 py-0.5 text-[9px] text-white">أضف حتى 3 توقفات في رحلتك</span>
                </div>
              </div>
              <button type="button" aria-label="إضافة توقف" className="mt-11 grid h-8 w-8 place-items-center rounded-full bg-mist-2"><Plus size={16} /></button>
            </div>
            <button type="button" className="mt-2 flex items-center gap-3 border-y-[6px] border-mist-2 px-4 py-3 text-start text-[13px] font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-white"><Star size={14} className="fill-white" /></span>
              <span className="flex-1">الأماكن المحفوظة</span>
              <ChevronLeft size={16} className="text-ink/40" />
            </button>
            <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">
              {filtered.map((p, i) => (
                <motion.button key={p.id} type="button" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }} onClick={() => { setPlaceId(p.id); onScreen('rides') }} className="flex w-full items-center gap-3 border-b border-ink/5 px-4 py-2.5 text-start hover:bg-mist-2">
                  <PlaceIcon kind={p.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                    <span className="block truncate text-[11px] text-ink/50">{p.addr}</span>
                  </span>
                  <span className="num text-[10.5px] text-ink/40">{p.km} كم</span>
                </motion.button>
              ))}
              {filtered.length === 0 && <div className="py-10 text-center text-[12px] text-ink/45">لا توجد نتائج تجريبية مطابقة</div>}
            </div>
          </motion.div>
        )}

        {/* 4 — CHOOSE A RIDE */}
        {screen === 'rides' && (
          <motion.div key="rides" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[45%]">
              <MapCanvas view={{ y: 72, h: 420, w: 440 }} mode="preview" showPickup showDropoff showNearby={false} pickupLabel="حي الشاطئ" pickupSub="طريق الخليج" pickupEta={String(ride.eta)} dropoffLabel={short} />
            </div>
            <div className="absolute top-11 right-3 z-10">
              <RoundBtn label="رجوع" onClick={() => onScreen('search')}><ArrowRight size={18} /></RoundBtn>
            </div>
            <motion.div layout transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className={`absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[22px] bg-white shadow-[0_-10px_36px_rgba(0,0,0,0.14)] ${expanded ? 'top-11' : 'h-[56%]'}`}>
              <button type="button" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? 'تصغير' : 'عرض كل الخيارات'} className="w-full pt-2 pb-1">
                <div className="mx-auto h-1 w-9 rounded-full bg-ink/15" />
              </button>
              <div className="border-b border-ink/5 pb-2 text-center text-[15px] font-bold">اختر رحلتك</div>
              <div className="flex-1 overflow-y-auto px-2.5 pt-2 no-scrollbar">
                {expanded ? (
                  <>
                    {(['rec', 'pop'] as const).map((sec) => (
                      <div key={sec} className="mb-2">
                        <div className="px-2 pb-1 pt-1 text-[13px] font-bold">{sec === 'rec' ? 'موصى بها' : 'شائعة'}</div>
                        {RIDE_TYPES.filter((r) => r.section === sec).map((r) => (
                          <RideRow key={r.id} r={r} fare={fareFor(place, r)} active={r.id === rideId} onClick={() => setRideId(r.id)} showDesc />
                        ))}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {RIDE_TYPES.slice(0, 3).map((r) => (
                      <RideRow key={r.id} r={r} fare={fareFor(place, r)} active={r.id === rideId} onClick={() => setRideId(r.id)} />
                    ))}
                    <button type="button" onClick={() => setExpanded(true)} className="mt-1 w-full py-1.5 text-center text-[12px] font-semibold text-green-2">
                      عرض كل الخيارات ({RIDE_TYPES.length})
                    </button>
                  </>
                )}
              </div>
              <div className="relative border-t border-ink/5 px-3 pt-2 pb-7">
                <AnimatePresence>
                  {payOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute inset-x-3 bottom-full mb-2 rounded-xl bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-ink/5">
                      {PAYMENTS.map((p) => {
                        const Ic = p.id === 'cash' ? Banknote : p.id === 'wallet' ? Wallet : CreditCard
                        return (
                          <button key={p.id} type="button" onClick={() => { setPayId(p.id); setPayOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[12.5px] hover:bg-mist-2">
                            <Ic size={16} />
                            <span className="flex-1 font-semibold">{p.name} <span className="num font-normal text-ink/45">{p.detail}</span></span>
                            {p.id === payId && <Check size={15} className="text-green-2" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button type="button" onClick={() => setPayOpen((o) => !o)} className="flex w-full items-center gap-2 py-1.5 text-start text-[12.5px] font-semibold">
                  <span className="grid h-5 w-7 place-items-center rounded bg-ink text-white"><PayIcon size={12} /></span>
                  <span className="num flex-1">{pay.id === 'card' ? pay.detail : pay.name}</span>
                  <ChevronLeft size={15} className="text-ink/40" />
                </button>
                <div className="mt-1.5 flex gap-2">
                  <Btn className="flex-1" onClick={() => onScreen('pickup')}>اختيار {ride.name}</Btn>
                  <button type="button" aria-label="جدولة الرحلة" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mist-2 hover:bg-mist">
                    <CalendarClock size={19} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 5 — CONFIRM PICKUP SPOT */}
        {screen === 'pickup' && (
          <motion.div key="pickup" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[66%]"><MapCanvas view={{ y: 300, h: 380 }} showNearby={false} showUser pickupBubble="الالتقاء هنا" /></div>
            <div className="absolute top-11 right-3 z-10">
              <RoundBtn label="رجوع" onClick={() => onScreen('rides')}><ArrowRight size={18} /></RoundBtn>
            </div>
            <Sheet>
              <div className="border-b border-ink/5 pb-3 text-center text-[15px] font-bold">أكّد نقطة الالتقاء</div>
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex-1 text-[13px] font-semibold leading-5">بالقرب من مدخل حي الشاطئ، طريق الخليج — الدمام</div>
                <button type="button" onClick={() => onScreen('search')} className="rounded-full bg-mist-2 px-3.5 py-1.5 text-[12px] font-semibold hover:bg-mist">بحث</button>
              </div>
              <div className="px-4">
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-mist-2 px-3 py-2 text-[11px] text-ink/60">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-green-soft"><MapPin size={11} className="text-green" /></span>
                  نقطة آمنة يسهل على السائق التوقف فيها · مشي دقيقة واحدة
                </div>
                <Btn onClick={() => onScreen('searching')}>تأكيد الالتقاء</Btn>
              </div>
            </Sheet>
          </motion.div>
        )}

        {/* 6 — CONNECTING TO A DRIVER */}
        {screen === 'searching' && (
          <motion.div key="searching" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[64%]">
              <MapCanvas view={{ y: 200, h: 460 }} mode="preview" showPickup showNearby pickupLabel="الالتقاء من طريق الخليج" pickupEta={String(ride.eta)} pickupSub="حي الشاطئ" />
            </div>
            <Sheet>
              <div className="px-5">
                <div className="text-center text-[15px] font-bold">جارٍ ربطك بسائق</div>
                <div className="mt-3 grid grid-cols-4 gap-1.5" dir="ltr">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-1 overflow-hidden rounded-full bg-mist">
                      <motion.div className="h-full bg-green-3" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.85, delay: i * 0.85, ease: 'linear' }} />
                    </div>
                  ))}
                </div>
                <div className="relative mx-auto mt-5 grid h-24 w-24 place-items-center rounded-full bg-green-soft">
                  {[0, 1].map((i) => (
                    <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-green-3" initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9 }} />
                  ))}
                  <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
                    <circle cx="40" cy="28" r="12" fill="#0b0d0c" />
                    <path d="M16 72 Q18 46 40 44 Q62 46 64 72 Z" fill="#0f5b3a" />
                    <path d="M34 44 L40 54 L46 44" fill="#ffffff" />
                  </svg>
                </div>
                <div className="num mt-4 text-center text-[12.5px] text-ink/60">الوصول المتوقع إلى وجهتك {clockAt(ride.eta + place.min + 1)}</div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink/5 px-5 pt-3 text-[12.5px]">
                <span className="flex items-center gap-2 font-semibold"><MapPin size={15} /> {short}</span>
                <button type="button" onClick={() => onScreen('rides')} className="font-semibold text-danger">إلغاء</button>
              </div>
            </Sheet>
          </motion.div>
        )}

        {/* 7 — DRIVER ON THE WAY + PIN */}
        {screen === 'found' && (
          <motion.div key="found" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[52%]">
              <MapCanvas view={{ y: 400, h: 290 }} mode="approach" progress={approach} showNearby={false} showPickup />
            </div>
            <div className="absolute top-12 left-1/2 z-10 -translate-x-1/2 rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              <span className="num">{approach >= 1 ? 'وصل' : `${Math.round((1 - approach) * 900)} م`}</span>
            </div>
            <AnimatePresence>
              {toast && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-6 top-[40%] z-20 flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-[11px] leading-4 text-white shadow-lg">
                  <span className="flex-1">نشارك موقعك المباشر مع السائق لمساعدته في الوصول إليك</span>
                  <button type="button" aria-label="إغلاق" onClick={() => setToast(false)}><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[22px] bg-white pb-6 shadow-[0_-10px_36px_rgba(0,0,0,0.14)]">
              <div className="mx-auto mt-2 mb-2 h-1 w-9 rounded-full bg-ink/15" />
              <div className="flex items-center gap-3 border-b border-ink/5 px-4 pb-3">
                <div className="flex-1 text-[15px] font-bold leading-6">{approach >= 1 ? 'السائق في نقطة الالتقاء' : 'قابل السائق عند نقطة الالتقاء'}<span className="block text-[11.5px] font-medium text-ink/50">حي الشاطئ · طريق الخليج</span></div>
                <MinBox value={minsAway} />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[12.5px] font-semibold">رمز التحقق للرحلة</span>
                <span className="flex gap-1" dir="ltr">
                  {DEMO_DRIVER.pin.split('').map((d, i) => (
                    <span key={i} className="num grid h-7 w-6 place-items-center rounded bg-green text-[14px] font-bold text-white">{d}</span>
                  ))}
                </span>
              </div>
              <div className="flex items-center gap-3 border-t border-ink/5 px-4 pt-3">
                <div className="relative h-14 w-[92px] shrink-0">
                  <div className="absolute top-0 right-0"><DriverAvatar size={44} /></div>
                  <div className="absolute bottom-0 left-0"><CarArt kind="sedan" color="#f4f6f5" width={62} /></div>
                  <span className="num absolute -bottom-1 right-0 rounded-full bg-white px-1.5 text-[10px] font-bold shadow">{DEMO_DRIVER.rating} ★</span>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex justify-end"><Plate /></div>
                  <div className="mt-1 text-[11px] text-ink/55">{DEMO_DRIVER.model}</div>
                </div>
              </div>
              <div className="px-4 pt-1.5 text-[12px]">
                <span className="font-bold">{DEMO_DRIVER.name}</span>
                <span className="text-ink/50"> · <span className="num">{DEMO_DRIVER.trips.toLocaleString('en-US')}</span> رحلة · سائق بتقييم عالٍ</span>
              </div>
              <div className="mt-3 flex items-center gap-2 px-4">
                <div className="flex h-10 flex-1 items-center rounded-full bg-mist-2 px-4 text-[12px] text-ink/45">أي ملاحظات للالتقاء؟</div>
                <button type="button" aria-label="اتصال" className="grid h-10 w-10 place-items-center rounded-full bg-mist-2"><Phone size={16} /></button>
                <button type="button" aria-label="الأمان" className="grid h-10 w-10 place-items-center rounded-full bg-mist-2"><ShieldCheck size={16} className="text-green-2" /></button>
              </div>
              <div className="px-4 pt-3">
                <Btn variant={approach >= 1 ? 'dark' : 'light'} onClick={() => onScreen('tracking')}>{approach >= 1 ? 'ركبت — ابدأ الرحلة' : 'تخطّي: ركبت السيارة'}</Btn>
              </div>
            </div>
          </motion.div>
        )}

        {/* 8 — ON TRIP + TRIP DETAILS */}
        {screen === 'tracking' && (
          <motion.div key="tracking" {...screenAnim} className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[41%]">
              <MapCanvas view={{ y: 84, h: 400, w: 470 }} mode="trip" progress={trip} showNearby={false} showDropoff dropoffLabel={short} />
            </div>
            <div className="absolute inset-x-0 bottom-0 top-[40%] z-20 flex flex-col rounded-t-[22px] bg-mist-2 shadow-[0_-10px_36px_rgba(0,0,0,0.14)]">
              <div className="rounded-t-[22px] bg-white">
                <div className="mx-auto mt-2 mb-2 h-1 w-9 rounded-full bg-ink/15" />
                <div className="flex items-center gap-3 px-4 pb-3">
                  <div className="flex-1 text-[15px] font-bold leading-6">
                    في الطريق إلى {short}
                    <span className="num block text-[11.5px] font-medium text-ink/50">الوصول {clockAt(place.min + 4)} · {(trip * place.km).toFixed(1)} من {place.km} كم</span>
                  </div>
                  <MinBox value={Math.max(0, Math.round((1 - trip) * place.min))} />
                </div>
                <div className="mx-4 mb-3 h-1 overflow-hidden rounded-full bg-mist">
                  <div className="h-full bg-green-3" style={{ width: `${trip * 100}%` }} />
                </div>
              </div>
              <div className="mt-1.5 flex-1 divide-y divide-ink/5 overflow-y-auto bg-white no-scrollbar">
                {[
                  { I: MapPin, t: place.name, s: `الوصول ${clockAt(place.min + 4)}`, a: 'إضافة أو تغيير' },
                  { I: PayIcon, t: `${fare} ر.س`, s: pay.id === 'card' ? `بطاقة ${pay.detail}` : pay.name, a: 'تبديل' },
                  { I: Users, t: 'ترافق أحداً؟', s: 'قسّم الأجرة بسهولة', a: 'تقسيم الأجرة' },
                  { I: Radio, t: 'مشاركة حالة الرحلة', s: 'يتابع أهلك رحلتك مباشرة', a: 'مشاركة' },
                ].map(({ I, t, s, a }) => (
                  <div key={a} className="flex items-center gap-3 px-4 py-2.5">
                    <I size={17} className="shrink-0 text-ink/70" />
                    <div className="min-w-0 flex-1">
                      <div className="num truncate text-[12.5px] font-semibold">{t}</div>
                      <div className="num truncate text-[10.5px] text-ink/45">{s}</div>
                    </div>
                    <button type="button" className="shrink-0 text-[11.5px] font-semibold text-green-2">{a}</button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 border-t border-ink/5 bg-white text-[13px] font-semibold">
                <button type="button" onClick={() => onScreen('done')} className="py-3 text-ink/70">تخطٍّ للوصول</button>
                <button type="button" className="flex items-center justify-center gap-1.5 border-r border-ink/5 py-3 text-green-2"><ShieldCheck size={16} /> الأمان</button>
              </div>
              <div className="flex items-center justify-center gap-1.5 bg-green pt-2 pb-6 text-[11px] text-white">
                <Share2 size={12} /> اضغط للوصول إلى أدوات الأمان ومشاركة الرحلة
              </div>
            </div>
          </motion.div>
        )}

        {/* 9 — TRIP END */}
        {screen === 'done' && (
          <motion.div key="done" {...screenAnim} className="absolute inset-0 flex flex-col bg-white">
            {!submitted ? (
              <>
                <div className="bg-ink px-5 pt-14 pb-6 text-center text-white">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-3">
                    <Check size={24} />
                  </motion.div>
                  <div className="mt-3 text-[13px] text-white/60">وصلت بسلامة إلى {short}</div>
                  <div className="num mt-1 text-4xl font-bold">{fare + tip} <span className="text-base">ر.س</span></div>
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
                      <motion.button key={n} type="button" whileTap={{ scale: 0.85 }} onClick={() => setRating(n)} aria-label={`${n} نجوم`}>
                        <Star size={34} className={n <= rating ? 'fill-gold text-gold' : 'text-ink/15'} strokeWidth={1.5} />
                      </motion.button>
                    ))}
                  </div>
                  <div className="mt-1 h-4 text-center text-[11px] text-ink/50">{['', 'سيئة', 'مقبولة', 'جيدة', 'رائعة', 'ممتازة!'][rating]}</div>
                  <div className="mt-3 text-[12px] font-semibold text-ink/50">إكرامية للسائق (اختياري)</div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {[0, 3, 5, 10].map((t) => (
                      <button key={t} type="button" onClick={() => setTip(t)} className={`num rounded-lg py-2 text-[12px] font-semibold ${tip === t ? 'bg-ink text-white' : 'bg-mist-2'}`}>
                        {t === 0 ? 'بدون' : `${t} ر.س`}
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="أضف تعليقاً عن الرحلة…" aria-label="تعليق" rows={2} className="mt-3 w-full resize-none rounded-xl bg-mist-2 p-3 text-[13px] outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div className="px-5 pb-8">
                  <Btn disabled={rating === 0} onClick={() => setSubmitted(true)}>إرسال التقييم</Btn>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <LogoMark size={64} />
                </motion.div>
                <div className="mt-5 text-xl font-bold">شكراً لتقييمك</div>
                <div className="mt-2 text-[13px] leading-6 text-ink/55">تقييمك يساعدنا في الحفاظ على جودة الخدمة وسلامة الرحلات.</div>
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

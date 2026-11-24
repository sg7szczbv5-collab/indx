import { useMemo, useState } from 'react'
import {
  Menu, Search, Clock, Home, Briefcase, MapPin, X, CalendarClock, Tag, ChevronDown, Plus, Users, Check, Plane, Building2, ShoppingBag, GraduationCap, Hospital, Trees, Landmark, Hotel, Crosshair, Bell, Zap, Info,
} from 'lucide-react'
import { Map } from '../../components/Map'
import { Btn, IconBtn, Sheet, StatusBar, VehicleArt, PaymentIcon, PAY_LABEL, Row, Badge } from '../../components/ui'
import { PLACES, kmToMin, route, routeKm, snapToRoad, type Place, type PlaceKind, type Point } from '../../lib/geo'
import { money, mins, km, clock } from '../../lib/format'
import { driverPose, fareFor, findPromo, isLive, nearbyFor, requestTrip, useNow, useSession, useStore } from '../../store/store'
import type { CategoryId, Loc, PaymentMethod, Trip } from '../../store/types'
import { RiderAuth, RiderProfileStep } from './RiderAuth'
import { Loading } from '../../components/PhoneOtp'
import { RiderTrip } from './RiderTrip'
import { RiderMenu, RiderPage, type PageId } from './RiderAccount'

export const CURRENT: Loc = { name: 'موقعك الحالي', sub: 'شارع الثمامة، حي الياسمين', p: { x: 400, y: 380 } }

export const kindIcon = (k: PlaceKind, size = 18) => {
  const m = { airport: Plane, mall: ShoppingBag, landmark: Landmark, uni: GraduationCap, hospital: Hospital, park: Trees, home: Home, work: Briefcase, district: MapPin, hotel: Hotel }
  const I = m[k] ?? Building2
  return <I size={size} />
}

type Screen = 'home' | 'search' | 'choose'

export function RiderApp() {
  const s = useStore()
  const now = useNow(300)
  const session = useSession('rider')
  const riderOrNone = s.riders.find((r) => r.id === s.me.riderId)
  const rider = riderOrNone!
  const [screen, setScreen] = useState<Screen>('home')
  const [pickup, setPickup] = useState<Loc>(CURRENT)
  const [dropoff, setDropoff] = useState<Loc | null>(null)
  const [cat, setCat] = useState<CategoryId>('go')
  const [pay, setPay] = useState<PaymentMethod>(riderOrNone?.defaultPayment ?? 'card')
  const [promo, setPromo] = useState<string>('')
  const [menu, setMenu] = useState(false)
  const [page, setPage] = useState<PageId | null>(null)
  const [watchId, setWatchId] = useState<string | null>(null)
  const [mode, setMode] = useState<'ride' | 'courier'>('ride')

  const myTrip: Trip | undefined = useMemo(() => {
    if (watchId) return s.trips.find((t) => t.id === watchId)
    return s.trips.find((t) => t.riderId === riderOrNone?.id && isLive(t))
  }, [s.trips, watchId, riderOrNone?.id])

  if (session.loading) return <Loading />
  if (!s.me.riderSignedIn || !riderOrNone) return <RiderAuth />
  if (!rider.name) return <RiderProfileStep />

  if (rider.blocked)
    return (
      <div className="grid h-full place-items-center bg-white p-8 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-bad">
            <X />
          </div>
          <h2 className="text-xl font-bold">تم إيقاف حسابك مؤقتاً</h2>
          <p className="mt-2 text-sm text-mute">تواصل مع فريق دعم AUAR لمعرفة التفاصيل.</p>
        </div>
      </div>
    )

  if (myTrip && (isLive(myTrip) || watchId))
    return (
      <RiderTrip
        trip={myTrip}
        onDone={() => {
          setWatchId(null)
          setDropoff(null)
          setScreen('home')
        }}
        onWatch={setWatchId}
      />
    )

  if (page) return <RiderPage page={page} onBack={() => setPage(null)} onOpenTrip={(id) => { setPage(null); setWatchId(id) }} />

  const nearby = nearbyFor(s, pickup.p, mode === 'courier' ? 'courier' : 'go', now).slice(0, 7)
  const cars = s.drivers
    .filter((d) => d.status === 'active' && d.online && d.bot)
    .slice(0, 14)
    .map((d) => {
      const pose = driverPose(d, s, now)
      return { id: d.id, p: pose.p, a: pose.a, color: d.car.colorHex, moto: d.categories.includes('moto') }
    })

  const choose = (to: Loc) => {
    setDropoff(to)
    setScreen('choose')
    if (mode === 'courier') setCat('courier')
    else if (cat === 'courier') setCat('go')
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <StatusBar />
      {screen === 'home' && (
        <>
          <div className="absolute inset-0">
            <Map focus={[pickup.p, ...nearby.slice(0, 4).map((n) => driverPose(n.d, s, now).p)]} inset={0.52} minSpan={340} user={pickup.p} cars={cars} />
          </div>
          <div className="absolute inset-x-0 top-12 z-20 flex items-center justify-between px-4">
            <IconBtn onClick={() => setMenu(true)} aria-label="القائمة">
              <Menu size={20} />
            </IconBtn>
            <IconBtn onClick={() => setPage('notifications')} aria-label="الإشعارات" className="relative">
              <Bell size={19} />
              {s.notices.some((n) => n.audience !== 'drivers' && now - n.at < 86400000) && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-bad" />}
            </IconBtn>
          </div>
          <Sheet className="pb-6">
            <div className="px-5 pt-3">
              <div className="mb-3 flex gap-2">
                {(
                  [
                    ['ride', 'رحلة'],
                    ['courier', 'توصيل'],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} onClick={() => setMode(k)} className={`h-9 rounded-full px-4 text-sm font-semibold ${mode === k ? 'bg-ink text-white' : 'bg-mist text-ink'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('search')} className="flex h-14 w-full items-center gap-3 rounded-2xl bg-mist px-4 text-start">
                <Search size={22} strokeWidth={2.4} />
                <span className="flex-1 text-[18px] font-semibold">{mode === 'courier' ? 'إلى أين ترسل الطرد؟' : 'إلى أين؟'}</span>
                <span onClick={(e) => { e.stopPropagation(); setScreen('search') }} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold">
                  <Clock size={15} /> الآن <ChevronDown size={14} />
                </span>
              </button>
              <div className="mt-2">
                {[PLACES[0], PLACES[1], PLACES[2]].map((p) => (
                  <Row key={p.id} icon={kindIcon(p.kind)} title={p.name} sub={p.sub} onClick={() => choose(p)} />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(
                  [
                    ['go', 'رحلة', () => { setMode('ride'); setScreen('search') }],
                    ['courier', 'توصيل', () => { setMode('courier'); setScreen('search') }],
                    ['moto', 'Moto', () => { setMode('ride'); setCat('moto'); setScreen('search') }],
                    ['xl', 'حجز مسبق', () => { setMode('ride'); setScreen('search') }],
                  ] as [CategoryId, string, () => void][]
                ).map(([id, l, fn], i) => (
                  <button key={l} onClick={fn} className="rounded-2xl bg-mist px-1 pb-2 pt-1.5 text-center hover:bg-mist-2">
                    {i === 3 ? (
                      <span className="mx-auto grid h-11 place-items-center">
                        <CalendarClock size={28} strokeWidth={1.6} />
                      </span>
                    ) : (
                      <VehicleArt id={id} className="mx-auto h-11 w-16" />
                    )}
                    <span className="block text-[13px] font-semibold">{l}</span>
                  </button>
                ))}
              </div>
              {s.promos.find((p) => p.active) && (
                <button onClick={() => setPage('promos')} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-ink p-4 text-start text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink">
                    <Tag size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-bold">رحلات أوفر هذا الأسبوع</span>
                    <span className="block text-[13px] text-white/60">{s.promos.find((p) => p.active)!.desc} — الرمز {s.promos.find((p) => p.active)!.code}</span>
                  </span>
                </button>
              )}
            </div>
          </Sheet>
        </>
      )}

      {screen === 'search' && (
        <SearchScreen
          pickup={pickup}
          courier={mode === 'courier'}
          onPickup={setPickup}
          onBack={() => setScreen('home')}
          onChoose={choose}
        />
      )}

      {screen === 'choose' && dropoff && (
        <ChooseRide
          pickup={pickup}
          dropoff={dropoff}
          cat={cat}
          setCat={setCat}
          pay={pay}
          setPay={setPay}
          promo={promo}
          setPromo={setPromo}
          courier={mode === 'courier'}
          onBack={() => setScreen('search')}
          onRequested={() => undefined}
          onScheduled={() => {
            setScreen('home')
            setPage('trips')
          }}
        />
      )}

      {menu && <RiderMenu onClose={() => setMenu(false)} onOpen={(p) => { setMenu(false); setPage(p) }} />}
    </div>
  )
}

/* ───────────── search ───────────── */

function SearchScreen({ pickup, courier, onPickup, onBack, onChoose }: { pickup: Loc; courier: boolean; onPickup: (l: Loc) => void; onBack: () => void; onChoose: (l: Loc) => void }) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<'pickup' | 'dropoff'>('dropoff')
  const [onMap, setOnMap] = useState(false)
  const [pin, setPin] = useState<Point>(pickup.p)
  const list = PLACES.filter((p) => !q || p.name.includes(q) || p.sub.includes(q))

  const pick = (p: Place | Loc) => {
    const loc = { name: p.name, sub: p.sub, p: p.p }
    if (editing === 'pickup') {
      onPickup(loc)
      setEditing('dropoff')
      setQ('')
    } else onChoose(loc)
  }

  if (onMap)
    return (
      <div className="absolute inset-0 z-30 bg-white">
        <Map focus={[pin]} minSpan={300} inset={0.3} onTap={(p) => setPin(snapToRoad(p))} pickup={editing === 'pickup' ? { p: pin } : undefined} dropoff={editing === 'dropoff' ? { p: pin } : undefined} />
        <div className="absolute inset-x-0 top-12 z-20 px-4">
          <IconBtn onClick={() => setOnMap(false)} aria-label="رجوع">
            <X size={20} />
          </IconBtn>
        </div>
        <Sheet className="px-5 pb-6 pt-3">
          <h3 className="text-lg font-bold">{editing === 'pickup' ? 'حدد نقطة الالتقاء' : 'حدد الوجهة'}</h3>
          <p className="mt-1 text-sm text-mute">اضغط على الخريطة لتحريك الدبوس إلى الشارع المطلوب</p>
          <Btn full size="lg" className="mt-4" onClick={() => pick({ name: 'موقع محدد على الخريطة', sub: `قرب ${nearestName(pin)}`, p: pin })}>
            تأكيد الموقع
          </Btn>
        </Sheet>
      </div>
    )

  return (
    <div className="fade-in absolute inset-0 z-30 flex flex-col bg-white pt-12">
      <div className="flex items-center gap-2 px-4">
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist" aria-label="رجوع">
          <X size={22} />
        </button>
        <h2 className="flex-1 text-center text-[17px] font-bold">{courier ? 'إرسال طرد' : 'خطط لرحلتك'}</h2>
        <span className="w-10" />
      </div>
      <div className="mt-3 flex gap-2 px-4">
        <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-sm font-semibold">
          <Clock size={15} /> الآن
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-sm font-semibold">
          <Users size={15} /> لي
        </span>
      </div>
      <div className="mx-4 mt-3 flex gap-3 rounded-2xl border-2 border-ink/5 p-2">
        <div className="flex flex-col items-center py-4">
          <span className="h-2.5 w-2.5 rounded-full bg-ink" />
          <span className="my-1 w-0.5 flex-1 bg-ink/30" />
          <span className="h-2.5 w-2.5 bg-ink" />
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            value={editing === 'pickup' ? q : pickup.name}
            onFocus={() => { setEditing('pickup'); setQ('') }}
            onChange={(e) => setQ(e.target.value)}
            placeholder="نقطة الالتقاء"
            className={`h-11 w-full rounded-xl px-3 text-[15px] outline-none ${editing === 'pickup' ? 'bg-mist ring-2 ring-ink' : 'bg-mist'}`}
          />
          <input
            autoFocus
            value={editing === 'dropoff' ? q : ''}
            onFocus={() => { setEditing('dropoff'); setQ('') }}
            onChange={(e) => setQ(e.target.value)}
            placeholder={courier ? 'عنوان المستلم' : 'إلى أين؟'}
            className={`h-11 w-full rounded-xl px-3 text-[15px] outline-none ${editing === 'dropoff' ? 'bg-mist ring-2 ring-ink' : 'bg-mist'}`}
          />
        </div>
        <button className="self-center rounded-full p-2 hover:bg-mist" aria-label="إضافة محطة">
          <Plus size={20} />
        </button>
      </div>
      <div className="no-scrollbar mt-2 flex-1 overflow-y-auto px-5 pb-6">
        {editing === 'pickup' && <Row icon={<Crosshair size={18} />} title="موقعك الحالي" sub={CURRENT.sub} onClick={() => pick(CURRENT)} />}
        <Row icon={<MapPin size={18} />} title="تحديد على الخريطة" sub="اختر النقطة بدقة" onClick={() => { setPin(editing === 'pickup' ? pickup.p : { x: 500, y: 700 }); setOnMap(true) }} />
        <div className="my-1 h-px bg-line" />
        {list.map((p) => (
          <Row key={p.id} icon={kindIcon(p.kind)} title={p.name} sub={p.sub} onClick={() => pick(p)} right={<span className="text-xs text-mute tnum">{km(routeKm(route(pickup.p, p.p)))}</span>} />
        ))}
        {list.length === 0 && <p className="py-10 text-center text-sm text-mute">لا توجد نتائج لـ «{q}»</p>}
      </div>
    </div>
  )
}

function nearestName(p: Point) {
  let best = PLACES[0]
  let bd = Infinity
  for (const x of PLACES) {
    const d = Math.abs(x.p.x - p.x) + Math.abs(x.p.y - p.y)
    if (d < bd) {
      bd = d
      best = x
    }
  }
  return best.name
}

/* ───────────── choose a ride ───────────── */

function ChooseRide(props: {
  pickup: Loc
  dropoff: Loc
  cat: CategoryId
  setCat: (c: CategoryId) => void
  pay: PaymentMethod
  setPay: (p: PaymentMethod) => void
  promo: string
  setPromo: (p: string) => void
  courier: boolean
  onBack: () => void
  onRequested: (id: string) => void
  onScheduled: () => void
}) {
  const { pickup, dropoff, cat, setCat, pay, setPay, promo, setPromo, courier } = props
  const s = useStore()
  const now = useNow(1000)
  const rider = s.riders.find((r) => r.id === s.me.riderId)!
  const path = useMemo(() => route(pickup.p, dropoff.p), [pickup.p, dropoff.p])
  const dkm = routeKm(path)
  const dmin = kmToMin(dkm)
  const [sheet, setSheet] = useState<null | 'pay' | 'promo' | 'schedule' | 'details'>(null)
  const [promoInput, setPromoInput] = useState(promo)
  const [promoErr, setPromoErr] = useState('')
  const [schedule, setSchedule] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const cats = s.categories.filter((c) => c.enabled && (courier ? c.id === 'courier' : c.id !== 'courier'))
  const selected = s.categories.find((c) => c.id === cat) ?? cats[0]
  const q = fareFor(s, selected, dkm, dmin, promo)
  const etaOf = (id: CategoryId) => {
    const n = nearbyFor(s, pickup.p, id, now)[0]
    return n ? Math.max(2, kmToMin(n.km)) : null
  }

  const herBlocked = selected.id === 'her' && rider.gender !== 'f'
  const walletShort = pay === 'wallet' && rider.wallet < q.fare

  const [busy, setBusy] = useState(false)
  const [reqErr, setReqErr] = useState('')
  const go = () => {
    setBusy(true)
    setReqErr('')
    requestTrip({ pickup, dropoff, category: selected.id, payment: pay, promo: promo || undefined, scheduledFor: schedule ?? undefined, note: note || undefined })
      .then((id) => {
        if (!id) return setReqErr('تعذر إنشاء الطلب. تحقق من طريقة الدفع أو أن لديك رحلة جارية.')
        if (schedule) props.onScheduled()
        else props.onRequested(id)
      })
      .catch((e: Error) => setReqErr(e.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.'))
      .finally(() => setBusy(false))
  }

  return (
    <div className="absolute inset-0">
      <Map focus={path} inset={0.6} route={path} pickup={{ p: pickup.p, label: pickup.name }} dropoff={{ p: dropoff.p, label: dropoff.name, sub: `${mins(dmin)} • ${km(dkm)}` }} pois={false} />
      <div className="absolute inset-x-0 top-12 z-20 px-4">
        <IconBtn onClick={props.onBack} aria-label="رجوع">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </IconBtn>
      </div>
      <Sheet className="flex max-h-[64%] flex-col">
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <h3 className="text-[17px] font-bold">{courier ? 'خيار التوصيل' : 'اختر رحلتك'}</h3>
          {s.settings.surgeOn && (
            <Badge tone="warn">
              <Zap size={12} /> الطلب مرتفع ×{s.settings.surge}
            </Badge>
          )}
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-3">
          {cats.map((c) => {
            const qq = fareFor(s, c, dkm, dmin, promo)
            const eta = etaOf(c.id)
            const active = c.id === selected.id
            return (
              <button
                key={c.id}
                onClick={() => (active ? setSheet('details') : setCat(c.id))}
                className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-start transition ${active ? 'ring-2 ring-ink' : 'hover:bg-mist/70'}`}
              >
                <VehicleArt id={c.id} className="h-12 w-20 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[16px] font-bold" dir="auto">
                    {c.name}
                    {c.seats > 0 && (
                      <span className="flex items-center gap-0.5 text-[12px] font-medium text-mute">
                        <Users size={12} />
                        {c.seats}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[13px] text-mute">{eta ? `${clock(now + (eta + dmin) * 60000)} • على بُعد ${eta} د` : 'لا يوجد كباتن متاحون'}</span>
                  {active && <span className="block truncate text-[12px] text-mute">{c.desc}</span>}
                </span>
                <span className="text-end">
                  <span className="block text-[16px] font-bold tnum">{money(qq.fare)}</span>
                  {qq.discount > 0 && <span className="block text-[12px] text-mute line-through tnum">{money(qq.subtotal)}</span>}
                </span>
              </button>
            )
          })}
        </div>
        <div className="border-t border-line px-5 pb-5 pt-3">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setSheet('pay')} className="flex flex-1 items-center gap-2.5 rounded-xl py-1 text-start">
              <PaymentIcon m={pay} />
              <span className="flex-1 text-[14px] font-semibold">
                {PAY_LABEL[pay]}
                {pay === 'wallet' && <span className="ms-1 text-mute tnum">({money(rider.wallet)})</span>}
              </span>
              <ChevronDown size={16} />
            </button>
            <button onClick={() => setSheet('promo')} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold ${promo ? 'bg-lime' : 'bg-mist'}`}>
              <Tag size={14} />
              {promo || 'رمز ترويجي'}
            </button>
            <button onClick={() => setSheet('schedule')} className={`grid h-9 w-9 place-items-center rounded-full ${schedule ? 'bg-lime' : 'bg-mist'}`} aria-label="جدولة">
              <CalendarClock size={17} />
            </button>
          </div>
          {herBlocked && <p className="mb-2 text-[13px] text-bad">خدمة AUAR Her متاحة لحسابات الراكبات فقط.</p>}
          {walletShort && <p className="mb-2 text-[13px] text-bad">رصيد المحفظة غير كافٍ — اشحن المحفظة أو اختر طريقة أخرى.</p>}
          {reqErr && <p className="mb-2 text-[13px] text-bad">{reqErr}</p>}
          <Btn full size="lg" disabled={busy || herBlocked || walletShort || (!etaOf(selected.id) && !schedule)} onClick={go}>
            {schedule ? `جدولة ${selected.name} — ${clock(schedule)}` : `اطلب ${selected.name}`}
          </Btn>
        </div>
      </Sheet>

      {sheet && (
        <div className="fade-in absolute inset-0 z-40 bg-black/40" onClick={() => setSheet(null)}>
          <div className="slide-up absolute inset-x-0 bottom-0 rounded-t-[26px] bg-white px-5 pb-6 pt-5" onClick={(e) => e.stopPropagation()}>
            {sheet === 'pay' && (
              <>
                <h3 className="mb-2 text-lg font-bold">طريقة الدفع</h3>
                {(['card', 'apple', 'wallet', 'cash'] as PaymentMethod[]).map((m) => (
                  <Row
                    key={m}
                    icon={<PaymentIcon m={m} />}
                    title={PAY_LABEL[m]}
                    sub={m === 'wallet' ? `الرصيد ${money(rider.wallet)}` : m === 'cash' ? 'ادفع للكابتن مباشرة' : undefined}
                    right={pay === m ? <Check size={20} /> : null}
                    onClick={() => { setPay(m); setSheet(null) }}
                  />
                ))}
              </>
            )}
            {sheet === 'promo' && (
              <>
                <h3 className="mb-3 text-lg font-bold">رمز ترويجي</h3>
                <div className="flex gap-2">
                  <input value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr('') }} placeholder="أدخل الرمز" dir="ltr" className="h-12 flex-1 rounded-xl bg-mist px-4 text-center font-semibold tracking-widest outline-none focus:ring-2 focus:ring-ink" />
                  <Btn
                    onClick={() => {
                      const p = findPromo(s, promoInput)
                      if (!promoInput) { setPromo(''); setSheet(null); return }
                      if (!p || !p.active || p.uses >= p.limit) { setPromoErr('الرمز غير صالح أو منتهي'); return }
                      setPromo(p.code)
                      setSheet(null)
                    }}
                  >
                    تطبيق
                  </Btn>
                </div>
                {promoErr && <p className="mt-2 text-sm text-bad">{promoErr}</p>}
                <div className="mt-3 space-y-2">
                  {s.promos.filter((p) => p.active).map((p) => (
                    <button key={p.code} onClick={() => setPromoInput(p.code)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-ink/25 px-4 py-3 text-start">
                      <span className="text-sm">{p.desc}</span>
                      <span className="font-bold tracking-wider" dir="ltr">{p.code}</span>
                    </button>
                  ))}
                </div>
                {promo && (
                  <button className="mt-3 text-sm font-semibold text-bad" onClick={() => { setPromo(''); setPromoInput(''); setSheet(null) }}>
                    إزالة الرمز
                  </button>
                )}
              </>
            )}
            {sheet === 'schedule' && (
              <>
                <h3 className="mb-1 text-lg font-bold">جدولة الرحلة</h3>
                <p className="mb-3 text-sm text-mute">سيصلك الكابتن في الوقت المحدد. يمكنك الإلغاء مجاناً قبل ٦٠ دقيقة.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[null, 1, 15, 60, 120, 24 * 60].map((m) => {
                    const t = m === null ? null : Math.ceil((now + m * 60000) / 300000) * 300000
                    const on = (schedule === null && m === null) || (schedule !== null && t === schedule)
                    return (
                      <button key={String(m)} onClick={() => setSchedule(t)} className={`rounded-xl px-2 py-3 text-sm font-semibold ${on ? 'bg-ink text-white' : 'bg-mist'}`}>
                        {m === null ? 'الآن' : m === 1 ? 'بعد دقيقة' : m < 60 ? `بعد ${m} د` : m < 1440 ? `بعد ${m / 60} س` : 'غداً'}
                        {t && <span className="block text-[11px] font-normal opacity-70 tnum">{clock(t)}</span>}
                      </button>
                    )
                  })}
                </div>
                <label className="mt-4 block text-sm font-medium text-mute">ملاحظة للكابتن</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: البوابة الشمالية" className="mt-1.5 h-12 w-full rounded-xl bg-mist px-4 outline-none focus:ring-2 focus:ring-ink" />
                <Btn full size="lg" className="mt-4" onClick={() => setSheet(null)}>
                  تم
                </Btn>
              </>
            )}
            {sheet === 'details' && (
              <>
                <div className="flex items-center gap-3">
                  <VehicleArt id={selected.id} className="h-16 w-28" />
                  <div>
                    <h3 className="text-xl font-bold" dir="auto">{selected.name}</h3>
                    <p className="text-sm text-mute">{selected.desc}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 rounded-2xl bg-mist p-4 text-sm">
                  <FareLine l="الأجرة الأساسية" v={money(selected.base)} />
                  <FareLine l={`المسافة (${km(dkm)})`} v={money(selected.perKm * dkm)} />
                  <FareLine l={`الوقت (${mins(dmin)})`} v={money(selected.perMin * dmin)} />
                  <FareLine l="الحد الأدنى للأجرة" v={money(selected.minFare)} />
                  {q.surge > 1 && <FareLine l="معامل الطلب المرتفع" v={`×${q.surge}`} />}
                  {q.discount > 0 && <FareLine l={`خصم ${promo}`} v={`- ${money(q.discount)}`} />}
                  <div className="h-px bg-line" />
                  <FareLine l="الإجمالي التقديري" v={money(q.fare)} bold />
                </div>
                <p className="mt-3 flex items-start gap-2 text-[12px] text-mute">
                  <Info size={14} className="mt-0.5 shrink-0" /> السعر شامل ضريبة القيمة المضافة. قد يتغير السعر إذا تغيّر المسار أو الوجهة.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FareLine({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-base font-bold' : ''}`}>
      <span className={bold ? '' : 'text-mute'}>{l}</span>
      <span className="tnum">{v}</span>
    </div>
  )
}


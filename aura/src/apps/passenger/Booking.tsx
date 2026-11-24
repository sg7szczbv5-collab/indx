import { useMemo, useState } from 'react'
import {
  Bell,
  Briefcase,
  CalendarClock,
  Car,
  ChevronDown,
  CircleDot,
  Clock,
  CreditCard,
  Flag,
  Gift,
  Home as HomeIcon,
  Info,
  MapPin,
  Menu,
  Search,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { CityMap, type MapMarker } from '../../map/CityMap'
import { Badge, Button, cx, Divider, ErrorState, ICON, IconButton, Input, Money, Row, Segmented, Sheet, useToast } from '../../ds/ui'
import { CarArt } from '../../ds/vehicle'
import { useI18n } from '../../i18n/I18n'
import { DEMO_CURRENT, PLACES, haversineKm, nearestPlaceName, pinPlace, routeBetween } from '../../core/geo'
import { VEHICLE_CLASSES, classById } from '../../core/pricing'
import { actions, findPromo, fleetSnapshot, nearbyAvailable, quoteTrip, useEco, useNow, zoneAt } from '../../core/store'
import { clock, day, sar } from '../../core/format'
import type { Customer, PaymentMethodId, Place, VehicleClassId } from '../../core/types'
import { BackIcon, TopBar } from '../shared/mobile'

export type BookingDraft = {
  pickup: Place
  dropoff?: Place
  classId: VehicleClassId
  payment: PaymentMethodId
  promo?: string
  scheduleAt?: number
}

export const PAYMENT_LABEL: Record<PaymentMethodId, { ar: string; en: string; sub?: string }> = {
  mada: { ar: 'مدى', en: 'mada', sub: '•••• 4821' },
  apple_pay: { ar: 'Apple Pay', en: 'Apple Pay' },
  wallet: { ar: 'محفظة أورا', en: 'AURA Wallet' },
  cash: { ar: 'نقداً', en: 'Cash' },
}

function greeting(lang: 'ar' | 'en') {
  const h = new Date().getHours()
  if (lang === 'ar') return h < 12 ? 'صباح الخير' : 'مساء الخير'
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/* ============================== HOME ============================== */

export function PassengerHome({ customer, onWhereTo, onQuick, onOpenInbox, inboxCount, onMenu, onSchedule }: { customer: Customer; onWhereTo: () => void; onQuick: (p: Place) => void; onOpenInbox: () => void; inboxCount: number; onMenu: () => void; onSchedule: () => void }) {
  const { t, L, lang } = useI18n()
  const now = useNow(1000)
  const reservations = useEco((s) => s.reservations.filter((r) => r.passengerId === customer.id && r.status === 'scheduled' && r.at > Date.now()))
  const cars = useMemo(() => nearbyAvailable(DEMO_CURRENT.pos, now, 6), [now])
  const [tripType, setTripType] = useState<'ride' | 'schedule' | 'xl'>('ride')
  const markers: MapMarker[] = [
    ...cars.map((c) => ({ id: c.driverId, pos: c.pos, kind: 'car' as const, heading: c.heading })),
    { id: 'me', pos: DEMO_CURRENT.pos, kind: 'me' as const },
  ]
  const first = L(customer.name).split(' ')[0]
  return (
    <div className="absolute inset-0">
      <CityMap center={DEMO_CURRENT.pos} zoom={70} markers={markers} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4" style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}>
        <IconButton label={t('الإشعارات', 'Notifications')} onClick={onOpenInbox} className="pointer-events-auto relative">
          <Bell size={19} {...ICON} />
          {inboxCount > 0 && <span className="absolute top-2 end-2.5 size-2 rounded-full bg-go ring-2 ring-white" />}
        </IconButton>
        <div className="pointer-events-auto rounded-full bg-white px-4 py-1.5 text-center shadow-[0_2px_12px_rgba(16,17,18,.1)]">
          <p className="text-[10.5px] text-mute">{greeting(lang)}</p>
          <p className="text-[14px] font-semibold leading-tight">{first}</p>
        </div>
        <IconButton label={t('القائمة', 'Menu')} onClick={onMenu} className="pointer-events-auto">
          <Menu size={19} {...ICON} />
        </IconButton>
      </div>

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pt-2.5 pb-3 shadow-[0_-8px_30px_rgba(16,17,18,.08)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-2" />
        <button onClick={tripType === 'schedule' ? onSchedule : onWhereTo} className="flex h-14 w-full items-center gap-3 rounded-2xl bg-road px-4 text-start transition active:scale-[0.99]">
          <Search size={20} {...ICON} />
          <span className="flex-1 font-display text-[17px] font-semibold">{t('إلى أين اليوم؟', 'Where to today?')}</span>
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold shadow-sm">
            <Clock size={13} {...ICON} />
            {tripType === 'schedule' ? t('لاحقاً', 'Later') : t('الآن', 'Now')}
          </span>
        </button>
        <div className="mt-1">
          {customer.saved.home && (
            <Row onClick={() => onQuick(customer.saved.home!)} icon={<HomeIcon size={18} {...ICON} />} title={t('المنزل', 'Home')} sub={L(customer.saved.home.sub)} end={<BackIcon size={16} />} />
          )}
          <Divider />
          {customer.saved.work && (
            <Row onClick={() => onQuick(customer.saved.work!)} icon={<Briefcase size={18} {...ICON} />} title={t('العمل', 'Work')} sub={L(customer.saved.work.sub)} end={<BackIcon size={16} />} />
          )}
        </div>
        {customer.saved.others.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-1 flex gap-2 overflow-x-auto px-4 pb-1">
            {customer.saved.others.map((p) => (
              <button key={p.id} onClick={() => onQuick(p)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-medium">
                <Star size={13} {...ICON} />
                {L(p.name)}
              </button>
            ))}
          </div>
        )}
        {reservations.length > 0 && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-road px-3 py-2.5 text-sm">
            <CalendarClock size={18} {...ICON} />
            <span className="flex-1 truncate">
              {t('رحلة مجدولة', 'Scheduled ride')} · {L(reservations[0].dropoff.name)}
            </span>
            <span className="num text-xs font-semibold">{day(reservations[0].at, lang)} {clock(reservations[0].at, lang)}</span>
          </div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('نوع الرحلة', 'Trip type')}>
          {[
            { id: 'ride' as const, icon: <Car size={20} {...ICON} />, label: t('رحلة', 'Ride') },
            { id: 'schedule' as const, icon: <CalendarClock size={20} {...ICON} />, label: t('جدولة', 'Schedule') },
            { id: 'xl' as const, icon: <Users size={20} {...ICON} />, label: t('عائلي XL', 'Family XL') },
          ].map((x) => (
            <button
              key={x.id}
              role="radio"
              aria-checked={tripType === x.id}
              onClick={() => {
                setTripType(x.id)
                if (x.id === 'schedule') onSchedule()
                if (x.id === 'xl') onWhereTo()
              }}
              className={cx('flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-semibold transition', tripType === x.id ? 'bg-ink text-white' : 'bg-road text-ink')}
            >
              <span className={tripType === x.id ? 'text-go' : ''}>{x.icon}</span>
              {x.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================== DESTINATION ============================== */

export function DestinationScreen({ draft, customer, recent, onBack, onChoose, onPickOnMap, onEditPickup }: { draft: BookingDraft; customer: Customer; recent: Place[]; onBack: () => void; onChoose: (p: Place) => void; onPickOnMap: (target: 'pickup' | 'dropoff') => void; onEditPickup: (p: Place) => void }) {
  const { t, L, lang } = useI18n()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<'pickup' | 'dropoff'>('dropoff')
  const pickupLabel = draft.pickup.id === 'current' ? t('موقعك الحالي', 'Current location') : L(draft.pickup.name)
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return [...PLACES, ...(customer.saved.home ? [customer.saved.home] : []), ...(customer.saved.work ? [customer.saved.work] : [])].filter((p) => p.name.ar.includes(q.trim()) || p.name.en.toLowerCase().includes(s) || p.sub.en.toLowerCase().includes(s) || p.sub.ar.includes(q.trim()))
  }, [q, customer])
  const dist = (p: Place) => `${haversineKm(draft.pickup.pos, p.pos).toFixed(1)} ${t('كم', 'km')}`
  const choose = (p: Place) => (editing === 'pickup' ? (onEditPickup(p), setEditing('dropoff'), setQ('')) : onChoose(p))
  const suggestions = PLACES.slice(0, 6)
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <TopBar title={t('وجهتك', 'Your destination')} onBack={onBack} />
      <div className="px-4">
        <div className="flex gap-3 rounded-2xl bg-road p-3">
          <div className="flex flex-col items-center pt-3.5">
            <span className="size-2.5 rounded-full border-2 border-ink" />
            <span className="my-1 w-0.5 flex-1 bg-go" />
            <span className="size-2.5 rounded-[3px] bg-ink" />
          </div>
          <div className="flex-1 space-y-2">
            <button onClick={() => { setEditing('pickup'); setQ('') }} className={cx('flex h-11 w-full items-center rounded-xl bg-white px-3 text-start text-sm', editing === 'pickup' && 'ring-2 ring-ink')}>
              {editing === 'pickup' ? (
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ابحث عن نقطة الانطلاق', 'Search pickup')} className="w-full bg-transparent outline-none" />
              ) : (
                <span className="truncate">{pickupLabel}</span>
              )}
            </button>
            <div className={cx('flex h-11 items-center rounded-xl bg-white px-3', editing === 'dropoff' && 'ring-2 ring-ink')} onClick={() => setEditing('dropoff')}>
              {editing === 'dropoff' ? (
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('إلى أين؟', 'Where to?')} className="w-full bg-transparent text-sm outline-none" aria-label={t('الوجهة', 'Destination')} />
              ) : (
                <span className="truncate text-sm text-mute">{draft.dropoff ? L(draft.dropoff.name) : t('إلى أين؟', 'Where to?')}</span>
              )}
              {q && (
                <button aria-label={t('مسح', 'Clear')} onClick={() => setQ('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="thin-scroll mt-2 flex-1 overflow-y-auto px-4 pb-8">
        {q ? (
          <>
            <p className="mt-3 mb-1 text-[12px] font-semibold text-mute">{t('نتائج البحث', 'Results')}</p>
            {results.length === 0 && <p className="py-8 text-center text-sm text-mute">{t('لا توجد نتائج. جرّب اسماً آخر أو اختر من الخريطة.', 'No results. Try another name or pick on the map.')}</p>}
            {results.map((p) => (
              <Row key={p.id} onClick={() => choose(p)} icon={<MapPin size={18} {...ICON} />} title={L(p.name)} sub={`${L(p.sub)} · ${dist(p)}`} />
            ))}
          </>
        ) : (
          <>
            {(customer.saved.home || customer.saved.work || customer.saved.others.length > 0) && (
              <>
                <p className="mt-3 mb-1 text-[12px] font-semibold text-mute">{t('المفضلة', 'Saved')}</p>
                {customer.saved.home && <Row onClick={() => choose(customer.saved.home!)} icon={<HomeIcon size={18} {...ICON} />} title={t('المنزل', 'Home')} sub={L(customer.saved.home.sub)} />}
                {customer.saved.work && <Row onClick={() => choose(customer.saved.work!)} icon={<Briefcase size={18} {...ICON} />} title={t('العمل', 'Work')} sub={L(customer.saved.work.sub)} />}
                {customer.saved.others.map((p) => (
                  <Row key={p.id} onClick={() => choose(p)} icon={<Star size={18} {...ICON} />} title={L(p.name)} sub={L(p.sub)} />
                ))}
              </>
            )}
            {recent.length > 0 && (
              <>
                <p className="mt-3 mb-1 text-[12px] font-semibold text-mute">{t('الأماكن الأخيرة', 'Recent')}</p>
                {recent.slice(0, 4).map((p) => (
                  <Row key={p.id} onClick={() => choose(p)} icon={<Clock size={18} {...ICON} />} title={L(p.name)} sub={`${L(p.sub)} · ${dist(p)}`} />
                ))}
              </>
            )}
            <p className="mt-3 mb-1 text-[12px] font-semibold text-mute">{t('اقتراحات', 'Suggestions')}</p>
            {suggestions.map((p) => (
              <Row key={p.id} onClick={() => choose(p)} icon={<MapPin size={18} {...ICON} />} title={L(p.name)} sub={`${L(p.sub)} · ${dist(p)}`} />
            ))}
            <Row onClick={() => onPickOnMap(editing)} icon={<Flag size={18} {...ICON} />} title={t('اختيار من الخريطة', 'Choose on map')} sub={t('ضع الدبوس بنفسك', 'Drop the pin yourself')} />
            <p className="mt-6 text-center text-[11px] text-mute-2">{lang === 'ar' ? 'المواقع تقريبية للعرض التجريبي' : 'Locations are approximate (demo)'}</p>
          </>
        )}
      </div>
    </div>
  )
}

/* ============================== MAP PICK ============================== */

export function MapPickScreen({ target, start, onBack, onConfirm }: { target: 'pickup' | 'dropoff'; start: Place; onBack: () => void; onConfirm: (p: Place) => void }) {
  const { t, lang } = useI18n()
  const [center, setCenter] = useState(start.pos)
  const z = zoneAt(center)
  const blocked = target === 'pickup' && (z.restricted || !z.inService)
  return (
    <div className="absolute inset-0">
      <CityMap center={start.pos} zoom={150} onCenterChange={setCenter} onPick={setCenter} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="-mt-12 flex flex-col items-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-ink text-white shadow-lg">
            <CircleDot size={18} />
          </div>
          <div className="h-6 w-0.5 bg-ink" />
          <div className="h-1 w-3 rounded-full bg-ink/25" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4" style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}>
        <IconButton label={t('رجوع', 'Back')} onClick={onBack} className="pointer-events-auto">
          <BackIcon />
        </IconButton>
        <span className="rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white">{target === 'pickup' ? t('حرّك الخريطة لضبط نقطة الالتقاء', 'Move the map to set pickup') : t('حرّك الخريطة لتحديد الوجهة', 'Move the map to set destination')}</span>
        <span className="w-10" />
      </div>
      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pt-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
        <p className="text-xs text-mute">{target === 'pickup' ? t('موقع الانطلاق', 'Pickup') : t('الوجهة', 'Destination')}</p>
        <div className="mt-1 mb-3 flex items-center gap-3 rounded-2xl bg-road px-3 py-3">
          {target === 'pickup' ? <span className="size-3 rounded-full border-[3px] border-ink" /> : <span className="size-3 rounded-[3px] bg-ink" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{nearestPlaceName(center, lang)}</p>
            <p className="num text-[11px] text-mute" dir="ltr">
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </p>
          </div>
        </div>
        {blocked && <div className="mb-3"><ErrorState title={z.restricted ? t('الالتقاء غير متاح في هذه المنطقة', 'Pickups are not allowed in this zone') : t('خارج نطاق الخدمة', 'Outside the service area')} body={t('حرّك الدبوس إلى موقع قريب.', 'Move the pin to a nearby spot.')} /></div>}
        <Button size="lg" full disabled={!!blocked} onClick={() => onConfirm(pinPlace(center))}>
          {target === 'pickup' ? t('تأكيد موقع الانطلاق', 'Confirm pickup') : t('تأكيد الوجهة', 'Confirm destination')}
        </Button>
      </div>
    </div>
  )
}

/* ============================== VEHICLES ============================== */

export function VehiclesScreen({ draft, onBack, onSelect, onNext }: { draft: BookingDraft; onBack: () => void; onSelect: (id: VehicleClassId) => void; onNext: () => void }) {
  const { t, L } = useI18n()
  const now = useNow(5000)
  const [details, setDetails] = useState(false)
  const route = routeBetween(draft.pickup.pos, draft.dropoff!.pos)
  const fleet = useMemo(() => fleetSnapshot(now).filter((u) => u.status === 'available'), [now])
  const pricing = useEco((s) => s.pricing)
  const zones = useEco((s) => s.zones)
  const quotes = useMemo(() => Object.fromEntries(VEHICLE_CLASSES.map((c) => [c.id, quoteTrip(draft.pickup, draft.dropoff!, c.id, draft.promo)])), [draft, pricing, zones])
  const eta = (id: VehicleClassId) => {
    const near = fleet.filter((u) => u.classId === id || (id === 'go' && u.classId !== 'black')).map((u) => haversineKm(u.pos, draft.pickup.pos))
    const km = near.length ? Math.min(...near) : 3
    return Math.max(2, Math.round((km / 30) * 60 * classById(id).etaFactor))
  }
  const surge = zoneAt(draft.pickup.pos).surge
  const sel = quotes[draft.classId]
  return (
    <div className="absolute inset-0">
      <CityMap
        fit={route}
        padding={[110, 50, 420, 50]}
        routes={[{ id: 'r', pts: route }]}
        markers={[
          { id: 'p', pos: draft.pickup.pos, kind: 'pickup' },
          { id: 'd', pos: draft.dropoff!.pos, kind: 'dropoff', label: `${sel.durationMin} ${t('د', 'min')}` },
          ...fleet.filter((u) => haversineKm(u.pos, draft.pickup.pos) < 3).map((u) => ({ id: u.driverId, pos: u.pos, kind: 'car' as const, heading: u.heading })),
        ]}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-4" style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}>
        <IconButton label={t('رجوع', 'Back')} onClick={onBack} className="pointer-events-auto">
          <BackIcon />
        </IconButton>
      </div>
      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pt-2.5 shadow-[0_-8px_30px_rgba(16,17,18,.08)]" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-2" />
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t('اختر فئة السيارة', 'Choose a car class')}</h2>
          <span className="num text-xs text-mute">
            {sel.distanceKm} {t('كم', 'km')} · {sel.durationMin} {t('د', 'min')}
          </span>
        </div>
        {surge && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-go-soft px-3 py-2 text-xs text-go-deep">
            <Info size={14} /> {t('طلب مرتفع في منطقتك', 'High demand in your area')} · ×{surge.multiplier}
          </div>
        )}
        <div className="space-y-2" role="radiogroup">
          {VEHICLE_CLASSES.filter((c) => c.active).map((c) => {
            const on = draft.classId === c.id
            const q = quotes[c.id]
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={on}
                onClick={() => (on ? onNext() : onSelect(c.id))}
                className={cx('flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition', on ? 'bg-go-soft ring-2 ring-go' : 'bg-white ring-1 ring-line')}
              >
                <CarArt classId={c.id} width={70} color={c.id === 'black' ? '#141516' : '#F5F5F3'} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
                    {c.name}
                  </p>
                  <p className="truncate text-[12px] text-mute">
                    {L(c.tagline)} · {c.seats} {t('مقاعد', 'seats')} · {eta(c.id)} {t('د', 'min')}
                  </p>
                </div>
                <div className="text-end">
                  <Money h={q.total} size="md" />
                  {q.discount > 0 && <p className="num text-[11px] text-mute line-through">{sar(q.subtotal + Math.round(q.subtotal * q.vatRate))}</p>}
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[12px] text-mute">{L(classById(draft.classId).description)}</p>
        <div className="mt-2 flex gap-2">
          <Button variant="soft" size="lg" onClick={() => setDetails(true)} icon={<Info size={17} {...ICON} />}>
            {t('تفاصيل السعر', 'Price details')}
          </Button>
          <Button size="lg" className="flex-1" onClick={onNext}>
            {t('اختيار', 'Choose')} <span dir="ltr">{classById(draft.classId).name}</span>
          </Button>
        </div>
      </div>
      <Sheet open={details} onClose={() => setDetails(false)} title={t('تفاصيل السعر', 'Price details')}>
        <FareTable classId={draft.classId} q={sel} />
        <Button full size="lg" className="mt-4" onClick={() => { setDetails(false); onNext() }}>
          {t('متابعة', 'Continue')}
        </Button>
      </Sheet>
    </div>
  )
}

export function FareTable({ q, classId, compact }: { q: ReturnType<typeof quoteTrip>; classId: VehicleClassId; compact?: boolean }) {
  const { t } = useI18n()
  const lines: [string, number, boolean?][] = [
    [t('رسوم فتح الرحلة', 'Base fare'), q.base],
    [`${t('المسافة', 'Distance')} · ${q.distanceKm} ${t('كم', 'km')}`, q.distance],
    [`${t('الوقت', 'Time')} · ${q.durationMin} ${t('دقيقة', 'min')}`, q.time],
  ]
  if (q.surge) lines.push([`${t('طلب مرتفع', 'High demand')} ×${q.surgeMultiplier}`, q.surge])
  if (q.minFareTopUp) lines.push([t('تقريب / حد أدنى', 'Rounding / minimum fare'), q.minFareTopUp])
  if (q.discount) lines.push([`${t('خصم', 'Discount')} ${q.promoCode ?? ''}`, -q.discount, true])
  lines.push([`${t('ضريبة القيمة المضافة', 'VAT')} ${Math.round(q.vatRate * 100)}%`, q.vat])
  return (
    <div>
      {!compact && (
        <div className="mb-3 rounded-2xl bg-ink p-4 text-white">
          <p className="text-xs text-white/55">
            {t('السعر النهائي', 'Final price')} · <span dir="ltr">{classById(classId).name}</span>
          </p>
          <div className="mt-1 flex items-baseline gap-1.5" dir="ltr" style={{ justifyContent: 'flex-start' }}>
            <span className="num text-[40px] font-semibold leading-none">{sar(q.total)}</span>
            <span className="num text-sm font-semibold text-go">SAR</span>
          </div>
          <p className="num mt-1 text-xs text-white/55">
            {q.distanceKm} {t('كم', 'km')} · {q.durationMin} {t('دقيقة', 'min')}
          </p>
        </div>
      )}
      <div className="divide-y divide-line">
        {lines.map(([k, v, green]) => (
          <div key={k} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-mute">{k}</span>
            <span className={cx('num font-semibold', green && 'text-go-deep')} dir="ltr">
              {v < 0 ? '−' : ''}
              {sar(Math.abs(v))}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between py-3 text-[15px] font-semibold">
          <span>{t('الإجمالي', 'Total')}</span>
          <Money h={q.total} />
        </div>
      </div>
      <p className="mt-1 text-[11.5px] text-mute">{t('السعر يظهر قبل الطلب ولا يتغير بعد التأكيد. الأسعار شاملة ضريبة القيمة المضافة. أسعار تجريبية قابلة للتعديل من لوحة الإدارة.', 'Price is shown before you request and will not change. Includes VAT. Demo tariffs, configurable in Admin.')}</p>
    </div>
  )
}

/* ============================== CONFIRM ============================== */

export function ConfirmScreen({ draft, customer, onBack, onChange, onConfirm, onEditPickup }: { draft: BookingDraft; customer: Customer; onBack: () => void; onChange: (d: Partial<BookingDraft>) => void; onConfirm: () => void; onEditPickup: () => void }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const [payOpen, setPayOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promoErr, setPromoErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const gateways = useEco((s) => s.settings.gateways)
  const q = quoteTrip(draft.pickup, draft.dropoff!, draft.classId, draft.promo)
  const walletShort = draft.payment === 'wallet' && customer.walletBalance < q.total

  const confirm = () => {
    setError('')
    if (draft.scheduleAt) {
      actions.scheduleRide({ passengerId: customer.id, pickup: draft.pickup, dropoff: draft.dropoff!, vehicleClass: draft.classId, at: draft.scheduleAt })
      toast(t('تمت جدولة رحلتك', 'Your ride is scheduled'))
      onBack()
      return
    }
    setBusy(true)
    setTimeout(() => {
      const r = actions.requestTrip({ passengerId: customer.id, pickup: draft.pickup, dropoff: draft.dropoff!, classId: draft.classId, payment: draft.payment, promoCode: draft.promo })
      setBusy(false)
      if (!r.ok) {
        setError(
          {
            restricted: t('لا يمكن الالتقاء في هذه المنطقة. عدّل نقطة الانطلاق.', 'Pickups are not allowed in this zone. Adjust your pickup.'),
            out_of_service: t('موقع الانطلاق خارج نطاق الخدمة.', 'Pickup is outside the service area.'),
            blocked: t('حسابك موقوف. تواصل مع الدعم.', 'Your account is suspended. Contact support.'),
            active_exists: t('لديك رحلة نشطة بالفعل.', 'You already have an active trip.'),
          }[r.error],
        )
        return
      }
      onConfirm()
    }, 500)
  }

  const applyPromo = () => {
    const p = findPromo(promoInput)
    if (!p) return setPromoErr(t('الرمز غير صالح أو منتهي', 'Invalid or expired code'))
    onChange({ promo: p.code })
    setPromoOpen(false)
    setPromoErr('')
    toast(t('تم تطبيق الخصم', 'Discount applied'))
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <TopBar title={draft.scheduleAt ? t('جدولة الرحلة', 'Schedule ride') : t('تأكيد الطلب', 'Confirm request')} onBack={onBack} />
      <div className="thin-scroll flex-1 overflow-y-auto px-4 pb-4">
        <FareTable q={q} classId={draft.classId} />
        <div className="mt-3 rounded-2xl ring-1 ring-line">
          <button onClick={onEditPickup} className="flex w-full items-center gap-3 px-3 py-3 text-start">
            <span className="size-3 rounded-full border-[3px] border-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-mute">{t('موقع الانطلاق', 'Pickup')}</p>
              <p className="truncate text-sm font-semibold">{L(draft.pickup.name)}</p>
            </div>
            <span className="text-xs font-semibold text-mute underline">{t('تعديل', 'Edit')}</span>
          </button>
          <Divider className="mx-3" />
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="size-3 rounded-[3px] bg-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-mute">{t('الوجهة', 'Destination')}</p>
              <p className="truncate text-sm font-semibold">{L(draft.dropoff!.name)}</p>
            </div>
          </div>
          <Divider className="mx-3" />
          <div className="flex items-center gap-3 px-3 py-2">
            <CarArt classId={draft.classId} width={54} color={draft.classId === 'black' ? '#141516' : '#F5F5F3'} />
            <div className="flex-1">
              <p className="text-[11px] text-mute">{t('نوع المركبة', 'Vehicle')}</p>
              <p className="text-sm font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
                {classById(draft.classId).name}
              </p>
            </div>
          </div>
          {draft.scheduleAt && (
            <>
              <Divider className="mx-3" />
              <div className="flex items-center gap-3 px-3 py-3 text-sm">
                <CalendarClock size={18} {...ICON} />
                <span className="flex-1">{t('موعد الالتقاء', 'Pickup time')}</span>
                <span className="num font-semibold">
                  {day(draft.scheduleAt, lang)} · {clock(draft.scheduleAt, lang)}
                </span>
              </div>
            </>
          )}
        </div>
        <button onClick={() => setPayOpen(true)} className="mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start ring-1 ring-line">
          {draft.payment === 'wallet' ? <Wallet size={20} {...ICON} /> : <CreditCard size={20} {...ICON} />}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {L(PAYMENT_LABEL[draft.payment])} <span className="num text-mute">{PAYMENT_LABEL[draft.payment].sub}</span>
            </p>
            <p className="text-[11px] text-mute">{t('طريقة الدفع', 'Payment method')}</p>
          </div>
          <ChevronDown size={18} />
        </button>
        {walletShort && <p className="mt-1.5 px-1 text-xs text-danger">{t('رصيد المحفظة غير كافٍ لهذه الرحلة.', 'Wallet balance is not enough for this trip.')}</p>}
        {draft.promo ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-go px-3 py-3">
            <Gift size={20} className="text-go-deep" {...ICON} />
            <div className="flex-1">
              <p className="num text-sm font-semibold">{draft.promo}</p>
              <p className="text-[11px] text-mute">{L(findPromo(draft.promo)?.title)}</p>
            </div>
            <span className="num font-semibold text-go-deep" dir="ltr">
              −{sar(q.discount)}
            </span>
            <button aria-label={t('إزالة', 'Remove')} onClick={() => onChange({ promo: undefined })}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setPromoOpen(true)} className="mt-3 flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-line-2 px-3 py-3 text-start text-sm font-semibold">
            <Gift size={20} {...ICON} /> {t('إضافة رمز خصم', 'Add promo code')}
          </button>
        )}
        {error && <div className="mt-3"><ErrorState title={error} /></div>}
      </div>
      <div className="border-t border-line px-4 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-mute">{t('الإجمالي', 'Total')}</span>
          <Money h={q.total} />
        </div>
        <Button size="lg" full loading={busy} disabled={walletShort} onClick={confirm}>
          {draft.scheduleAt ? t('تأكيد الجدولة', 'Confirm schedule') : t('تأكيد الرحلة', 'Confirm ride')}
        </Button>
      </div>

      <Sheet open={payOpen} onClose={() => setPayOpen(false)} title={t('طريقة الدفع', 'Payment method')}>
        {(['mada', 'apple_pay', 'wallet', 'cash'] as PaymentMethodId[]).map((m) => {
          const enabled = gateways[m]
          return (
            <button
              key={m}
              disabled={!enabled}
              onClick={() => {
                onChange({ payment: m })
                setPayOpen(false)
              }}
              className={cx('mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-start disabled:opacity-40', draft.payment === m ? 'bg-go-soft ring-2 ring-go' : 'ring-1 ring-line')}
            >
              {m === 'wallet' ? <Wallet size={20} {...ICON} /> : <CreditCard size={20} {...ICON} />}
              <span className="flex-1 text-sm font-semibold">
                {L(PAYMENT_LABEL[m])} <span className="num text-mute">{PAYMENT_LABEL[m].sub}</span>
              </span>
              {m === 'wallet' && <Money h={customer.walletBalance} size="sm" className="text-mute" />}
              {!enabled && <Badge tone="outline">{t('غير متاح', 'Unavailable')}</Badge>}
            </button>
          )
        })}
        <p className="mt-2 text-[11.5px] text-mute">{t('الدفع الإلكتروني يتطلب ربط بوابة دفع مرخّصة. لا يتم خصم أي مبلغ في النسخة التجريبية.', 'Card payments require a licensed payment gateway. No money is charged in the demo.')}</p>
      </Sheet>
      <Sheet open={promoOpen} onClose={() => setPromoOpen(false)} title={t('رمز الخصم', 'Promo code')}>
        <Input value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr('') }} placeholder="AURA50" dir="ltr" className="num text-center tracking-widest" invalid={!!promoErr} autoFocus />
        {promoErr && <p className="mt-2 text-sm text-danger">{promoErr}</p>}
        <Button full size="lg" className="mt-3" disabled={!promoInput} onClick={applyPromo}>
          {t('تطبيق', 'Apply')}
        </Button>
        <p className="mt-3 text-center text-xs text-mute">{t('جرّب AURA50 أو RIYADH15', 'Try AURA50 or RIYADH15')}</p>
      </Sheet>
    </div>
  )
}

/* ============================== SCHEDULE PICKER ============================== */

export function ScheduleSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (at: number) => void }) {
  const { t, lang } = useI18n()
  const [dayIdx, setDayIdx] = useState<'0' | '1' | '2'>('0')
  const base = new Date()
  const slots = useMemo(() => {
    const out: number[] = []
    const d0 = new Date()
    d0.setDate(d0.getDate() + Number(dayIdx))
    for (let h = 0; h < 24; h++)
      for (const m of [0, 30]) {
        const d = new Date(d0)
        d.setHours(h, m, 0, 0)
        if (d.getTime() > Date.now() + 30 * 60_000) out.push(d.getTime())
      }
    return out.slice(0, 16)
  }, [dayIdx])
  return (
    <Sheet open={open} onClose={onClose} title={t('جدولة رحلة', 'Schedule a ride')}>
      <Segmented
        className="w-full"
        value={dayIdx}
        onChange={setDayIdx}
        options={[0, 1, 2].map((i) => {
          const d = new Date(base)
          d.setDate(d.getDate() + i)
          return { value: String(i) as '0' | '1' | '2', label: i === 0 ? t('اليوم', 'Today') : i === 1 ? t('غداً', 'Tomorrow') : day(d.getTime(), lang) }
        })}
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {slots.map((s) => (
          <button key={s} onClick={() => onPick(s)} className="num h-11 rounded-xl bg-road text-sm font-semibold transition hover:bg-ink hover:text-white">
            {clock(s, lang)}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-mute">{t('يمكنك الجدولة حتى ٣ أيام مقدماً. السعر تقديري ويُثبّت عند الإرسال.', 'Schedule up to 3 days ahead. Price is an estimate, fixed at dispatch.')}</p>
    </Sheet>
  )
}


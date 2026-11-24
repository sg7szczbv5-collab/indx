import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Bell, Car, ChevronLeft, ChevronRight, FileText, Globe, HelpCircle, LogOut, TrendingUp, User, Gift, Banknote, History, FileUp } from 'lucide-react'
import { Avatar, Badge, Button, cx, EmptyState, ICON, Money, Row, Segmented, Sheet, Switch, TripStatusBadge, useToast, Divider } from '../../ds/ui'
import { CarArt, Plate } from '../../ds/vehicle'
import { useI18n } from '../../i18n/I18n'
import { earningsFor, getCustomer, getVehicle, useAllTrips, useEco } from '../../core/store'
import { classById } from '../../core/pricing'
import { DAY, dateTime, day, int, pct, sar, startOfDay } from '../../core/format'
import { STATUS_LABEL } from '../../core/trip'
import type { Driver, Trip } from '../../core/types'
import { Panel, TopBar } from '../shared/mobile'
import { HelpPanel } from '../passenger/Tabs'

const TAG_LABEL: Record<string, { ar: string; en: string }> = {
  safe_driving: { ar: 'قيادة آمنة', en: 'Safe driving' },
  clean_car: { ar: 'سيارة نظيفة', en: 'Clean car' },
  on_time: { ar: 'دقة المواعيد', en: 'On time' },
  polite: { ar: 'لبق', en: 'Polite' },
}

/** Demo incentive rule: SAR 75 for every 25 completed trips in a week. */
const INCENTIVE = { trips: 25, amount: 7500 }

/* ============================== TRIPS ============================== */

export function DriverTripsTab({ driver }: { driver: Driver }) {
  const { t, L, lang } = useI18n()
  const all = useAllTrips()
  const [f, setF] = useState<'completed' | 'cancelled'>('completed')
  const [open, setOpen] = useState<Trip | null>(null)
  const list = useMemo(() => all.filter((x) => x.driverId === driver.id && x.status === f).slice(0, 80), [all, driver.id, f])
  return (
    <div className="absolute inset-0 flex flex-col">
      <TopBar title={t('الرحلات', 'Trips')} />
      <div className="px-4">
        <Segmented className="w-full" value={f} onChange={setF} options={[{ value: 'completed', label: t('المكتملة', 'Completed') }, { value: 'cancelled', label: t('الملغاة', 'Cancelled') }]} />
      </div>
      <div className="thin-scroll-dark flex-1 overflow-y-auto px-4 pt-3 pb-6">
        {list.length === 0 && <EmptyState icon={<History size={26} />} title={t('لا توجد رحلات', 'No trips')} />}
        {list.map((x) => (
          <button key={x.id} onClick={() => setOpen(x)} className="mb-2 block w-full rounded-2xl bg-ink-2 p-3.5 text-start ring-1 ring-white/6">
            <div className="flex items-center justify-between text-[12px] text-white/50">
              <span className="num">{dateTime(x.createdAt, lang)}</span>
              <span dir="ltr">{classById(x.vehicleClass).name}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{L(x.pickup.name)}</p>
                <p className="truncate text-sm font-semibold">→ {L(x.dropoff.name)}</p>
              </div>
              {x.status === 'completed' ? <Money h={x.fare.driverNet + (x.passengerRating?.tip ?? 0)} className="text-go" /> : <Badge tone="danger">{L(STATUS_LABEL.cancelled)}</Badge>}
            </div>
          </button>
        ))}
        {list.some((x) => x.seeded) && <p className="mt-2 text-center text-[11px] text-white/35">{t('يتضمن السجل رحلات تجريبية', 'Includes demo history')}</p>}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={t('تفاصيل الرحلة', 'Trip details')}>
        {open && <DriverTripDetail trip={open} />}
      </Sheet>
    </div>
  )
}

function DriverTripDetail({ trip }: { trip: Trip }) {
  const { t, L, lang } = useI18n()
  const rider = getCustomer(trip.passengerId)
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <span className="num font-semibold">{trip.id}</span>
        <TripStatusBadge status={trip.status} />
      </div>
      <p className="mt-2 text-white/60">
        {L(trip.pickup.name)} → {L(trip.dropoff.name)}
      </p>
      {rider && <p className="mt-1 text-white/60">{t('الراكب', 'Rider')}: {L(rider.name)}</p>}
      {trip.status === 'completed' && (
        <div className="mt-3 divide-y divide-white/8">
          {[
            [t('المسافة', 'Distance'), `${trip.fare.distanceKm} km`],
            [t('المدة', 'Duration'), `${trip.fare.durationMin} min`],
            [t('قيمة الرحلة', 'Fare'), sar(trip.fare.subtotal)],
            [t('العمولة', 'Commission'), `−${sar(trip.fare.commission)}`],
            [t('الإكرامية', 'Tip'), sar(trip.passengerRating?.tip ?? 0)],
            [t('الصافي', 'Net'), sar(trip.fare.driverNet + (trip.passengerRating?.tip ?? 0))],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2">
              <span className="text-white/55">{k}</span>
              <span className="num font-semibold" dir="ltr">
                {v}
              </span>
            </div>
          ))}
        </div>
      )}
      {trip.cancel && <p className="mt-3 text-white/60">{t('سبب الإلغاء', 'Reason')}: {trip.cancel.reason}</p>}
      <div className="mt-3 space-y-1">
        {trip.timeline.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-white/55">
            <span className="size-1.5 rounded-full bg-go" />
            <span className="flex-1">{L(STATUS_LABEL[e.status])}</span>
            <span className="num">{dateTime(e.at, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================== EARNINGS ============================== */

export function EarningsTab({ driver }: { driver: Driver }) {
  const { t, L, lang } = useI18n()
  const rev = useEco((s) => s.rev)
  const payouts = useEco((s) => s.payouts.filter((p) => p.driverId === driver.id))
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'all'>('week')
  const [open, setOpen] = useState<Trip | null>(null)
  const from = { day: startOfDay(), week: startOfDay() - 6 * DAY, month: startOfDay() - 29 * DAY, all: 0 }[range]
  const e = useMemo(() => earningsFor(driver.id, from), [driver.id, from, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  const weeks = useMemo(() => {
    const out: { start: number; net: number; count: number }[] = []
    for (let w = 0; w < 4; w++) {
      const s = startOfDay() - (w + 1) * 7 * DAY + DAY
      const x = earningsFor(driver.id, s, s + 7 * DAY)
      out.push({ start: s, net: x.net, count: x.count })
    }
    return out
  }, [driver.id, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  const incentives = Math.floor(e.count / INCENTIVE.trips) * INCENTIVE.amount
  const weekProgress = weeks[0].count % INCENTIVE.trips
  const chart = useMemo(() => {
    const days = range === 'month' ? 30 : 7
    return Array.from({ length: days }).map((_, i) => {
      const s = startOfDay() - (days - 1 - i) * DAY
      const x = earningsFor(driver.id, s, s + DAY - 1)
      return { d: new Date(s).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { weekday: days === 7 ? 'short' : undefined, day: days === 30 ? 'numeric' : undefined }), v: x.net / 100 }
    })
  }, [driver.id, range, lang, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="absolute inset-0 flex flex-col">
      <TopBar title={t('الأرباح', 'Earnings')} />
      <div className="thin-scroll-dark flex-1 overflow-y-auto px-4 pb-6">
        <Segmented
          className="w-full"
          value={range}
          onChange={setRange}
          options={[
            { value: 'day', label: t('اليوم', 'Today') },
            { value: 'week', label: t('الأسبوع', 'Week') },
            { value: 'month', label: t('الشهر', 'Month') },
            { value: 'all', label: t('الإجمالي', 'Total') },
          ]}
        />
        <div className="mt-3 rounded-3xl bg-ink-2 p-5 ring-1 ring-white/6">
          <p className="text-xs text-white/50">{t('صافي الأرباح', 'Net earnings')}</p>
          <div className="mt-1 flex items-baseline gap-1.5" dir="ltr" style={{ justifyContent: 'flex-start' }}>
            <span className="num text-[40px] font-semibold leading-none">{sar(e.net + (range === 'day' ? 0 : incentives))}</span>
            <span className="num text-sm font-semibold text-go">SAR</span>
          </div>
          <p className="num mt-1 text-xs text-white/45">
            {e.count} {t('رحلة', 'trips')}
          </p>
          {range !== 'day' && (
            <div className="mt-3 h-28" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="d" tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 10 }} axisLine={false} tickLine={false} interval={range === 'month' ? 4 : 0} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} contentStyle={{ background: '#101112', border: '1px solid #2b2d30', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${Number(v).toFixed(2)} SAR`, '']} />
                  <Bar dataKey="v" fill="#78B83F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Mini label={t('إجمالي قيمة الرحلات', 'Gross fares')} h={e.gross} />
          <Mini label={t('عمولات المنصة', 'Commissions')} h={-e.commission} />
          <Mini label={t('الإكراميات', 'Tips')} h={e.tips} />
          <Mini label={t('الحوافز', 'Incentives')} h={range === 'day' ? 0 : incentives} />
          <Mini label={t('نقد مُحصّل', 'Cash collected')} h={e.cash} />
          <Mini label={t('رحلات ملغاة', 'Cancelled')} text={String(e.cancelled.length)} />
        </div>
        <div className="mt-3 rounded-2xl bg-ink-2 p-4 ring-1 ring-white/6">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-go" />
            <p className="flex-1 text-sm font-semibold">{t('حافز الأسبوع', 'Weekly incentive')}</p>
            <span className="num text-xs text-white/50">
              {weekProgress}/{INCENTIVE.trips}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-go" style={{ width: `${(weekProgress / INCENTIVE.trips) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/50">{t(`أكمل ${INCENTIVE.trips - weekProgress} رحلات إضافية لتحصل على ${INCENTIVE.amount / 100} ريال`, `Complete ${INCENTIVE.trips - weekProgress} more trips to earn SAR ${INCENTIVE.amount / 100}`)}</p>
        </div>
        <h3 className="mt-5 mb-1 text-[13px] font-semibold text-white/55">{t('سجل التحويلات', 'Transfers')}</h3>
        <div className="divide-y divide-white/8">
          {payouts.map((p) => (
            <Row key={p.id} icon={<Banknote size={18} {...ICON} />} title={<Money h={p.amount} size="sm" />} sub={`${p.reference} · ${dateTime(p.at, lang)}`} end={<Badge tone="pending">{t('قيد التحويل', 'Processing')}</Badge>} />
          ))}
          {weeks.slice(1).map((w) => (
            <Row key={w.start} icon={<Banknote size={18} {...ICON} />} title={<Money h={w.net} size="sm" />} sub={`${t('أسبوع', 'Week of')} ${day(w.start, lang)} · ${w.count} ${t('رحلة', 'trips')}`} end={<Badge tone="live">{t('محوّل', 'Paid')}</Badge>} />
          ))}
        </div>
        <h3 className="mt-5 mb-1 text-[13px] font-semibold text-white/55">{t('تفاصيل الرحلات', 'Per-trip earnings')}</h3>
        {e.trips.slice(0, 15).map((x) => (
          <Row key={x.id} onClick={() => setOpen(x)} title={L(x.dropoff.name)} sub={`${dateTime(x.createdAt, lang)} · ${x.id}`} end={<Money h={x.fare.driverNet + (x.passengerRating?.tip ?? 0)} size="sm" className="text-go" />} />
        ))}
        {e.trips.length === 0 && <EmptyState title={t('لا توجد أرباح في هذه الفترة', 'No earnings in this period')} />}
        <p className="mt-3 text-center text-[11px] text-white/35">{t('الأرقام مبنية على بيانات تجريبية', 'Figures are based on demo data')}</p>
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={t('تفاصيل الرحلة', 'Trip details')}>
        {open && <DriverTripDetail trip={open} />}
      </Sheet>
    </div>
  )
}

function Mini({ label, h, text }: { label: string; h?: number; text?: string }) {
  return (
    <div className="rounded-2xl bg-ink-2 px-3 py-3 ring-1 ring-white/6">
      <p className="num text-[16px] font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
        {text ?? `${h! < 0 ? '−' : ''}${sar(Math.abs(h!))}`}
      </p>
      <p className="text-[11px] text-white/50">{label}</p>
    </div>
  )
}

/* ============================== PERFORMANCE ============================== */

export function PerformancePanel({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const { t, L, lang } = useI18n()
  const all = useAllTrips()
  const reviews = useMemo(() => all.filter((x) => x.driverId === driver.id && x.passengerRating).slice(0, 12), [all, driver.id])
  const trips = useMemo(() => all.filter((x) => x.driverId === driver.id && x.status === 'completed').length, [all, driver.id])
  const metrics = [
    { label: t('نسبة قبول الطلبات', 'Acceptance rate'), v: driver.acceptanceRate, good: driver.acceptanceRate >= 0.85, target: '≥ 85%' },
    { label: t('نسبة الإلغاء', 'Cancellation rate'), v: driver.cancellationRate, good: driver.cancellationRate <= 0.05, target: '≤ 5%', inverse: true },
    { label: t('الالتزام بالمواعيد', 'Punctuality'), v: driver.punctuality, good: driver.punctuality >= 0.9, target: '≥ 90%' },
  ]
  return (
    <Panel title={t('الأداء والتقييم', 'Performance')} onClose={onClose}>
      <div className="flex flex-col items-center py-4">
        <p className="num text-[56px] font-semibold leading-none">{driver.rating.toFixed(2)}</p>
        <div className="mt-2 flex gap-1 text-go">{'★★★★★'}</div>
        <p className="num mt-1 text-xs text-white/50">
          {int(driver.ratingsCount)} {t('تقييم', 'ratings')} · {int(trips)} {t('رحلة', 'trips')}
        </p>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl bg-ink-2 p-4 ring-1 ring-white/6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{m.label}</span>
              <span className={cx('num text-lg font-semibold', m.good ? 'text-go' : 'text-warn')}>{pct(m.v)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className={cx('h-full rounded-full', m.good ? 'bg-go' : 'bg-warn')} style={{ width: `${(m.inverse ? Math.min(1, m.v * 5) : m.v) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-white/45">
              {t('المستهدف', 'Target')} <span className="num">{m.target}</span>
            </p>
          </div>
        ))}
      </div>
      <h3 className="mt-5 mb-2 text-[13px] font-semibold text-white/55">{t('تقييمات العملاء', 'Rider reviews')}</h3>
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-white/8 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{L(getCustomer(r.passengerId)?.name).split(' ')[0]}</span>
            <span className="num text-xs text-white/45">{day(r.createdAt, lang)}</span>
          </div>
          <p className="mt-0.5 text-go">{'★'.repeat(r.passengerRating!.stars)}<span className="text-white/20">{'★'.repeat(5 - r.passengerRating!.stars)}</span></p>
          {r.passengerRating!.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {r.passengerRating!.tags.map((tg) => (
                <Badge key={tg} tone="neutral">
                  {L(TAG_LABEL[tg] ?? { ar: tg, en: tg })}
                </Badge>
              ))}
            </div>
          )}
          {r.passengerRating!.comment && <p className="mt-1 text-sm text-white/70">“{r.passengerRating!.comment}”</p>}
        </div>
      ))}
    </Panel>
  )
}

/* ============================== ACCOUNT ============================== */

type Sub = null | 'profile' | 'vehicle' | 'docs' | 'notifications' | 'support' | 'performance'

export function DriverAccountTab({ driver, onLogout }: { driver: Driver; onLogout: () => void }) {
  const { t, L, lang, setLang } = useI18n()
  const toast = useToast()
  const [sub, setSub] = useState<Sub>(null)
  const [n, setN] = useState({ trips: true, earnings: true, promo: false })
  const vehicle = getVehicle(driver.vehicleId)
  const Chev = lang === 'ar' ? ChevronLeft : ChevronRight
  const docLabel = { national_id: t('الهوية الوطنية', 'National ID'), license: t('رخصة القيادة', 'Driving licence'), registration: t('استمارة المركبة', 'Registration'), insurance: t('التأمين', 'Insurance'), photo: t('الصورة الشخصية', 'Photo') }
  const rows: { id: Sub; icon: React.ReactNode; label: string }[] = [
    { id: 'profile', icon: <User size={18} {...ICON} />, label: t('الملف الشخصي', 'Profile') },
    { id: 'vehicle', icon: <Car size={18} {...ICON} />, label: t('بيانات المركبة', 'Vehicle') },
    { id: 'docs', icon: <FileText size={18} {...ICON} />, label: t('المستندات', 'Documents') },
    { id: 'performance', icon: <TrendingUp size={18} {...ICON} />, label: t('الأداء والتقييم', 'Performance') },
    { id: 'notifications', icon: <Bell size={18} {...ICON} />, label: t('الإشعارات', 'Notifications') },
    { id: 'support', icon: <HelpCircle size={18} {...ICON} />, label: t('الدعم والمساعدة', 'Help & support') },
  ]
  return (
    <div className="absolute inset-0 flex flex-col">
      <TopBar title={t('حسابي', 'My account')} />
      <div className="thin-scroll-dark flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex items-center gap-3 rounded-3xl bg-ink-2 p-4 ring-1 ring-white/6">
          <Avatar name={L(driver.name)} size={58} />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">{L(driver.name)}</p>
            <p className="text-xs text-white/50">
              <span className="num">★ {driver.rating.toFixed(2)}</span> · {t('كابتن منذ', 'Captain since')} <span className="num">{new Date(driver.joinedAt).getFullYear()}</span>
            </p>
          </div>
          <Badge tone="live">{t('موثّق', 'Verified')}</Badge>
        </div>
        <div className="mt-2 divide-y divide-white/8">
          {rows.map((r) => (
            <Row key={r.id} icon={r.icon} title={r.label} onClick={() => setSub(r.id)} end={<Chev size={16} className="text-white/30" />} />
          ))}
          <Row icon={<Globe size={18} {...ICON} />} title={t('اللغة', 'Language')} end={<Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'EN' }]} />} />
        </div>
        <button onClick={onLogout} className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/55">
          <LogOut size={17} className="rtl:-scale-x-100" /> {t('تسجيل الخروج', 'Log out')}
        </button>
      </div>
      <AnimatePresence>
        {sub === 'profile' && (
          <Panel title={t('الملف الشخصي', 'Profile')} onClose={() => setSub(null)}>
            <div className="flex justify-center py-4">
              <Avatar name={L(driver.name)} size={80} />
            </div>
            {[
              [t('الاسم', 'Name'), L(driver.name)],
              [t('رقم الجوال', 'Mobile'), driver.phone],
              [t('رقم الهوية', 'National ID'), `${driver.nationalId.slice(0, 2)}•••••${driver.nationalId.slice(-3)}`],
              [t('البريد', 'Email'), driver.email ?? '—'],
              [t('المدينة', 'City'), driver.cityId],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/8 py-3 text-sm">
                <span className="text-white/55">{k}</span>
                <span className="num" dir="ltr">
                  {v}
                </span>
              </div>
            ))}
            <p className="mt-3 text-xs text-white/45">{t('لتعديل البيانات الرسمية تواصل مع الدعم.', 'Contact support to change official details.')}</p>
          </Panel>
        )}
        {sub === 'vehicle' && vehicle && (
          <Panel title={t('بيانات المركبة', 'Vehicle')} onClose={() => setSub(null)}>
            <div className="flex justify-center rounded-3xl bg-ink-2 py-6">
              <CarArt classId={vehicle.classId} color={vehicle.colorHex} width={220} />
            </div>
            <div className="mt-3 flex justify-center">
              <Plate digits={vehicle.plate.digits} lettersAr={vehicle.plate.lettersAr} lettersEn={vehicle.plate.lettersEn} size="lg" />
            </div>
            {[
              [t('الطراز', 'Model'), `${vehicle.make} ${vehicle.model}`],
              [t('سنة الصنع', 'Year'), String(vehicle.year)],
              [t('اللون', 'Colour'), L(vehicle.color)],
              [t('الفئة', 'Class'), classById(vehicle.classId).name],
              [t('الحالة', 'Status'), vehicle.status === 'active' ? t('نشطة', 'Active') : vehicle.status === 'inspection_due' ? t('فحص مستحق', 'Inspection due') : t('غير نشطة', 'Inactive')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/8 py-3 text-sm">
                <span className="text-white/55">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </Panel>
        )}
        {sub === 'docs' && (
          <Panel title={t('المستندات', 'Documents')} onClose={() => setSub(null)}>
            {driver.docs.map((d) => (
              <div key={d.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-ink-2 p-3.5 ring-1 ring-white/6">
                <FileText size={20} className="text-white/60" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{docLabel[d.id]}</p>
                  <p className="num text-xs text-white/45">{d.expires ? `${t('تنتهي', 'Expires')} ${d.expires}` : d.fileName}</p>
                </div>
                <Badge tone={d.status === 'approved' ? 'live' : d.status === 'rejected' ? 'danger' : 'pending'}>{{ approved: t('معتمد', 'Approved'), rejected: t('مرفوض', 'Rejected'), uploaded: t('قيد المراجعة', 'In review'), missing: t('ناقص', 'Missing') }[d.status]}</Badge>
              </div>
            ))}
            <Button variant="secondary" full className="mt-2" icon={<FileUp size={17} />} onClick={() => toast(t('اختر الملف من جهازك لتحديث المستند', 'Pick a file to update the document'), 'info')}>
              {t('تحديث مستند', 'Update a document')}
            </Button>
          </Panel>
        )}
        {sub === 'notifications' && (
          <Panel title={t('الإشعارات', 'Notifications')} onClose={() => setSub(null)}>
            <Row title={t('طلبات الرحلات', 'Trip requests')} sub={t('صوت واهتزاز', 'Sound & vibration')} end={<Switch checked={n.trips} onChange={(v) => setN({ ...n, trips: v })} />} />
            <Divider />
            <Row title={t('الأرباح والتحويلات', 'Earnings & transfers')} end={<Switch checked={n.earnings} onChange={(v) => setN({ ...n, earnings: v })} />} />
            <Divider />
            <Row title={t('الحوافز والحملات', 'Incentives & campaigns')} end={<Switch checked={n.promo} onChange={(v) => setN({ ...n, promo: v })} />} />
          </Panel>
        )}
        {sub === 'support' && <HelpPanel requester={{ kind: 'driver', id: driver.id }} onClose={() => setSub(null)} />}
        {sub === 'performance' && <PerformancePanel driver={driver} onClose={() => setSub(null)} />}
      </AnimatePresence>
    </div>
  )
}


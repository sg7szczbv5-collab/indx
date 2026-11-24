import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Bell,
  Briefcase,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gift,
  Globe,
  HelpCircle,
  Home as HomeIcon,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  User,
  Wallet,
  Settings as SettingsIcon,
  History,
  Trash2,
} from 'lucide-react'
import { Avatar, Badge, Button, Card, cx, Divider, EmptyState, Field, ICON, Input, Money, Row, Segmented, Sheet, Switch, TripStatusBadge, useToast, Select } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { actions, getDriver, useAllTrips, useEco } from '../../core/store'
import { classById } from '../../core/pricing'
import { dateTime, day, sar, clock } from '../../core/format'
import { PLACES } from '../../core/geo'
import type { Customer, Ticket, Trip } from '../../core/types'
import { Panel, TopBar } from '../shared/mobile'
import { PAYMENT_LABEL } from './Booking'

/* ============================== MY TRIPS ============================== */

export function TripsTab({ customer }: { customer: Customer }) {
  const { t, L, lang } = useI18n()
  const all = useAllTrips()
  const reservations = useEco((s) => s.reservations.filter((r) => r.passengerId === customer.id && r.status === 'scheduled'))
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'upcoming'>('all')
  const [open, setOpen] = useState<Trip | null>(null)
  const mine = useMemo(() => all.filter((x) => x.passengerId === customer.id), [all, customer.id])
  const list = mine.filter((x) => (filter === 'all' ? true : filter === 'upcoming' ? false : x.status === filter))
  return (
    <div className="absolute inset-0 flex flex-col">
      <TopBar title={t('رحلاتي', 'My trips')} />
      <div className="px-4">
        <Segmented
          className="w-full"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('الكل', 'All') },
            { value: 'completed', label: t('مكتملة', 'Completed') },
            { value: 'cancelled', label: t('ملغاة', 'Cancelled') },
            { value: 'upcoming', label: `${t('مجدولة', 'Upcoming')}${reservations.length ? ` · ${reservations.length}` : ''}` },
          ]}
        />
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto px-4 pt-3 pb-6">
        {filter === 'upcoming' ? (
          reservations.length === 0 ? (
            <EmptyState icon={<CalendarClock size={26} {...ICON} />} title={t('لا توجد رحلات مجدولة', 'No scheduled rides')} body={t('جدول رحلتك من الصفحة الرئيسية.', 'Schedule a ride from Home.')} />
          ) : (
            reservations.map((r) => (
              <Card key={r.id} className="mb-2">
                <div className="flex items-center justify-between">
                  <Badge tone="live" dot>
                    {t('مجدولة', 'Scheduled')}
                  </Badge>
                  <span className="num text-xs font-semibold">
                    {day(r.at, lang)} · {clock(r.at, lang)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {L(r.pickup.name)} → {L(r.dropoff.name)}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-mute">
                  <span dir="ltr">{classById(r.vehicleClass).name}</span>
                  <span>
                    {t('تقديري', 'Est.')} <Money h={r.estimate} size="sm" />
                  </span>
                </div>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => actions.cancelReservation(r.id)}>
                  {t('إلغاء الحجز', 'Cancel booking')}
                </Button>
              </Card>
            ))
          )
        ) : list.length === 0 ? (
          <EmptyState icon={<History size={26} {...ICON} />} title={t('لا توجد رحلات', 'No trips yet')} body={t('ستظهر رحلاتك هنا بعد أول مشوار.', 'Your trips will appear here after your first ride.')} />
        ) : (
          list.map((x) => (
            <button key={x.id} onClick={() => setOpen(x)} className="mb-2 block w-full rounded-2xl p-3.5 text-start ring-1 ring-line transition hover:ring-line-2">
              <div className="flex items-center justify-between">
                <span className="num text-[12px] text-mute">{dateTime(x.createdAt, lang)}</span>
                <TripStatusBadge status={x.status} />
              </div>
              <div className="mt-2 flex gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <span className="size-2 rounded-full border-2 border-ink" />
                  <span className="my-0.5 w-px flex-1 bg-line-2" />
                  <span className="size-2 rounded-[2px] bg-ink" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <p className="truncate">{L(x.pickup.name)}</p>
                  <p className="truncate font-semibold">{L(x.dropoff.name)}</p>
                </div>
                <div className="text-end">
                  <Money h={x.status === 'cancelled' ? 0 : x.fare.total} size="sm" />
                  <p className="text-[11px] text-mute" dir="ltr">
                    {classById(x.vehicleClass).name}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
        {(filter === 'all' || filter === 'completed') && mine.some((m) => m.seeded) && <p className="mt-2 text-center text-[11px] text-mute-2">{t('يتضمن السجل رحلات تجريبية', 'History includes demo trips')}</p>}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={t('تفاصيل الرحلة', 'Trip details')}>
        {open && <TripDetail trip={open} customerId={customer.id} onDone={() => setOpen(null)} />}
      </Sheet>
    </div>
  )
}

function TripDetail({ trip, customerId, onDone }: { trip: Trip; customerId: string; onDone: () => void }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const d = getDriver(trip.driverId)
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="num text-sm font-semibold">{trip.id}</span>
        <TripStatusBadge status={trip.status} />
      </div>
      <p className="num mt-1 text-xs text-mute">{dateTime(trip.createdAt, lang)}</p>
      <div className="mt-3 space-y-2 rounded-2xl bg-road p-3 text-sm">
        <p>
          <span className="text-mute">{t('من', 'From')}: </span>
          {L(trip.pickup.name)}
        </p>
        <p>
          <span className="text-mute">{t('إلى', 'To')}: </span>
          {L(trip.dropoff.name)}
        </p>
        {d && (
          <p>
            <span className="text-mute">{t('الكابتن', 'Captain')}: </span>
            {L(d.name)}
          </p>
        )}
      </div>
      {trip.status === 'completed' && (
        <div className="mt-3 divide-y divide-line text-sm">
          {[
            [t('قيمة الرحلة', 'Fare'), trip.fare.subtotal],
            ...(trip.fare.discount ? [[t('الخصم', 'Discount'), -trip.fare.discount] as [string, number]] : []),
            [t('ضريبة القيمة المضافة', 'VAT'), trip.fare.vat],
            ...(trip.passengerRating?.tip ? [[t('الإكرامية', 'Tip'), trip.passengerRating.tip] as [string, number]] : []),
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between py-2">
              <span className="text-mute">{k}</span>
              <span className="num font-semibold" dir="ltr">
                {(v as number) < 0 ? '−' : ''}
                {sar(Math.abs(v as number))}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-2 font-semibold">
            <span>{t('الإجمالي', 'Total')}</span>
            <Money h={trip.fare.total + (trip.passengerRating?.tip ?? 0)} />
          </div>
        </div>
      )}
      {trip.status === 'cancelled' && <p className="mt-3 text-sm text-mute">{t('سبب الإلغاء', 'Reason')}: {trip.cancel?.reason}</p>}
      {trip.passengerRating && (
        <p className="mt-2 text-sm">
          {t('تقييمك', 'Your rating')}: <span className="num">{'★'.repeat(trip.passengerRating.stars)}</span>
        </p>
      )}
      <Button
        variant="secondary"
        full
        className="mt-4"
        icon={<HelpCircle size={17} />}
        onClick={() => {
          actions.createTicket({ requester: { kind: 'customer', id: customerId }, subject: `Issue with trip ${trip.id}`, category: 'complaint', tripId: trip.id, text: 'Rider reported an issue from trip history.' })
          toast(t('تم فتح تذكرة دعم', 'Support ticket opened'))
          onDone()
        }}
      >
        {t('الإبلاغ عن مشكلة', 'Report an issue')}
      </Button>
    </div>
  )
}

/* ============================== WALLET ============================== */

export function WalletTab({ customer }: { customer: Customer }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const all = useAllTrips()
  const promos = useEco((s) => s.promos.filter((p) => p.active && p.endsAt > Date.now() && (p.audience === 'all' || (p.audience === 'gold' && customer.tier === 'gold') || p.audience === 'new')))
  const [topup, setTopup] = useState(false)
  const [amount, setAmount] = useState(10000)
  const tx = useMemo(() => all.filter((x) => x.passengerId === customer.id && x.status === 'completed').slice(0, 12), [all, customer.id])
  return (
    <div className="absolute inset-0 flex flex-col">
      <TopBar title={t('المحفظة', 'Wallet')} />
      <div className="thin-scroll flex-1 overflow-y-auto px-4 pb-6">
        <div className="aura-field relative overflow-hidden rounded-3xl p-5 text-white">
          <p className="text-xs text-white/55">{t('رصيد محفظة أورا', 'AURA Wallet balance')}</p>
          <div className="mt-1 flex items-baseline gap-1.5" dir="ltr" style={{ justifyContent: 'flex-start' }}>
            <span className="num text-[38px] font-semibold leading-none">{sar(customer.walletBalance)}</span>
            <span className="num text-sm font-semibold text-go">SAR</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="go" size="sm" icon={<Plus size={15} />} onClick={() => setTopup(true)}>
              {t('شحن الرصيد', 'Top up')}
            </Button>
          </div>
        </div>
        <h3 className="mt-5 mb-1 text-[13px] font-semibold text-mute">{t('طرق الدفع', 'Payment methods')}</h3>
        <PaymentMethods />
        <h3 className="mt-5 mb-2 text-[13px] font-semibold text-mute">{t('العروض المتاحة', 'Available offers')}</h3>
        <div className="space-y-2">
          {promos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-go/70 px-3 py-3">
              <Gift size={20} className="text-go-deep" {...ICON} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{L(p.title)}</p>
                <p className="num text-xs text-mute">{p.code}</p>
              </div>
              <button
                className="text-xs font-semibold underline"
                onClick={() => {
                  navigator.clipboard?.writeText(p.code).catch(() => {})
                  toast(t('تم نسخ الرمز', 'Code copied'))
                }}
              >
                {t('نسخ', 'Copy')}
              </button>
            </div>
          ))}
        </div>
        <h3 className="mt-5 mb-1 text-[13px] font-semibold text-mute">{t('آخر العمليات', 'Recent transactions')}</h3>
        {tx.length === 0 && <EmptyState title={t('لا توجد عمليات', 'No transactions')} />}
        {tx.map((x) => (
          <Row
            key={x.id}
            icon={x.paymentMethod === 'wallet' ? <Wallet size={18} {...ICON} /> : <CreditCard size={18} {...ICON} />}
            title={L(x.dropoff.name)}
            sub={`${dateTime(x.createdAt, lang)} · ${L(PAYMENT_LABEL[x.paymentMethod])}`}
            end={<span className="num text-sm font-semibold" dir="ltr">−{sar(x.fare.total)}</span>}
          />
        ))}
      </div>
      <Sheet open={topup} onClose={() => setTopup(false)} title={t('شحن المحفظة', 'Top up wallet')}>
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          {[5000, 10000, 20000].map((v) => (
            <button key={v} onClick={() => setAmount(v)} className={cx('num h-12 rounded-xl font-semibold', amount === v ? 'bg-go-soft ring-2 ring-go' : 'ring-1 ring-line')}>
              {v / 100} SAR
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-mute">{t('الشحن يتطلب بوابة دفع مرخّصة. في النسخة التجريبية يُضاف رصيد تجريبي فقط.', 'Top-ups require a licensed gateway. In the demo only test credit is added.')}</p>
        <Button
          full
          size="lg"
          className="mt-3"
          onClick={() => {
            actions.topUpWallet(customer.id, amount)
            setTopup(false)
            toast(t('تمت إضافة رصيد تجريبي', 'Demo credit added'))
          }}
        >
          {t('شحن', 'Top up')} <span className="num">{amount / 100} SAR</span>
        </Button>
      </Sheet>
    </div>
  )
}

function PaymentMethods() {
  const { t } = useI18n()
  const gateways = useEco((s) => s.settings.gateways)
  return (
    <div className="divide-y divide-line rounded-2xl px-3 ring-1 ring-line">
      <Row icon={<CreditCard size={18} {...ICON} />} title={<span>mada <span className="num text-mute">•••• 4821</span></span>} sub={t('الافتراضية', 'Default')} end={<Badge tone="live">{t('مفعّلة', 'Active')}</Badge>} />
      <Row icon={<CreditCard size={18} {...ICON} />} title="Apple Pay" sub={gateways.apple_pay ? t('متاحة', 'Available') : t('غير متاحة', 'Unavailable')} />
      <Row icon={<Wallet size={18} {...ICON} />} title={t('نقداً', 'Cash')} sub={t('ادفع للكابتن مباشرة', 'Pay the captain directly')} />
    </div>
  )
}

/* ============================== ACCOUNT ============================== */

type Sub = null | 'profile' | 'payments' | 'offers' | 'places' | 'safety' | 'help' | 'settings' | 'inbox'

export function AccountTab({ customer, onLogout, onTab, initial }: { customer: Customer; onLogout: () => void; onTab: (t: 'trips' | 'wallet') => void; initial?: Sub }) {
  const { t, L, lang, setLang } = useI18n()
  const all = useAllTrips()
  const [sub, setSub] = useState<Sub>(initial ?? null)
  const trips = useMemo(() => all.filter((x) => x.passengerId === customer.id && x.status === 'completed').length, [all, customer.id])
  const Chev = lang === 'ar' ? ChevronLeft : ChevronRight
  const rows: { id: Sub | 'trips' | 'wallet'; icon: React.ReactNode; label: string; end?: React.ReactNode }[] = [
    { id: 'profile', icon: <User size={18} {...ICON} />, label: t('الملف الشخصي', 'Profile') },
    { id: 'trips', icon: <History size={18} {...ICON} />, label: t('سجل الرحلات', 'Trip history') },
    { id: 'wallet', icon: <Wallet size={18} {...ICON} />, label: t('المحفظة', 'Wallet'), end: <Money h={customer.walletBalance} size="sm" className="text-mute" /> },
    { id: 'payments', icon: <CreditCard size={18} {...ICON} />, label: t('طرق الدفع', 'Payment methods'), end: <span className="text-xs text-mute">mada</span> },
    { id: 'offers', icon: <Gift size={18} {...ICON} />, label: t('العروض', 'Offers') },
    { id: 'places', icon: <MapPin size={18} {...ICON} />, label: t('الأماكن المحفوظة', 'Saved places'), end: <span className="num text-xs text-mute">{(customer.saved.home ? 1 : 0) + (customer.saved.work ? 1 : 0) + customer.saved.others.length}</span> },
    { id: 'safety', icon: <ShieldCheck size={18} {...ICON} />, label: t('الأمان', 'Safety') },
    { id: 'help', icon: <HelpCircle size={18} {...ICON} />, label: t('المساعدة', 'Help') },
    { id: 'settings', icon: <SettingsIcon size={18} {...ICON} />, label: t('الإعدادات', 'Settings') },
  ]
  return (
    <div className="absolute inset-0 flex flex-col">
      <TopBar title={t('حسابي', 'My account')} />
      <div className="thin-scroll flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex items-center gap-3">
          <Avatar name={L(customer.name)} size={58} />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">{L(customer.name)}</p>
            <p className="text-[12px] text-mute">
              <span className="num">★ {customer.rating.toFixed(2)}</span> · {t('عضو منذ', 'Member since')} <span className="num">{new Date(customer.joinedAt).getFullYear()}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            [customer.tier === 'gold' ? 'Gold' : 'Standard', t('المستوى', 'Tier')],
            [String(trips * 12 + 40), t('نقطة أورا', 'AURA points')],
            [String(trips), t('رحلة', 'Trips')],
          ].map(([v, k]) => (
            <div key={k} className="rounded-2xl bg-road py-3">
              <p className="num font-semibold">{v}</p>
              <p className="text-[11px] text-mute">{k}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 divide-y divide-line">
          {rows.map((r) => (
            <Row
              key={r.id}
              icon={r.icon}
              title={r.label}
              onClick={() => (r.id === 'trips' || r.id === 'wallet' ? onTab(r.id) : setSub(r.id as Sub))}
              end={
                <span className="flex items-center gap-2">
                  {r.end}
                  <Chev size={16} className="text-mute-2" />
                </span>
              }
            />
          ))}
          <Row
            icon={<Globe size={18} {...ICON} />}
            title={t('اللغة', 'Language')}
            end={<Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'EN' }]} />}
          />
        </div>
        <button onClick={onLogout} className="mt-4 flex items-center gap-2 text-sm font-semibold text-mute">
          <LogOut size={17} className="rtl:-scale-x-100" /> {t('تسجيل الخروج', 'Log out')}
        </button>
      </div>
      <AnimatePresence>
        {sub === 'profile' && <ProfilePanel customer={customer} onClose={() => setSub(null)} />}
        {sub === 'payments' && (
          <Panel title={t('طرق الدفع', 'Payment methods')} onClose={() => setSub(null)}>
            <PaymentMethods />
            <Button variant="secondary" full className="mt-3" icon={<Plus size={16} />} disabled>
              {t('إضافة بطاقة (يتطلب بوابة دفع)', 'Add card (requires gateway)')}
            </Button>
          </Panel>
        )}
        {sub === 'offers' && (
          <Panel title={t('العروض', 'Offers')} onClose={() => setSub(null)}>
            <OffersList customer={customer} />
          </Panel>
        )}
        {sub === 'places' && <PlacesPanel customer={customer} onClose={() => setSub(null)} />}
        {sub === 'safety' && <SafetyPanel onClose={() => setSub(null)} />}
        {sub === 'help' && <HelpPanel requester={{ kind: 'customer', id: customer.id }} onClose={() => setSub(null)} />}
        {sub === 'settings' && <SettingsPanel onClose={() => setSub(null)} />}
        {sub === 'inbox' && <InboxPanel audience="passengers" onClose={() => setSub(null)} />}
      </AnimatePresence>
    </div>
  )
}

function ProfilePanel({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [name, setName] = useState(L(customer.name))
  const [email, setEmail] = useState(customer.email ?? '')
  return (
    <Panel title={t('الملف الشخصي', 'Profile')} onClose={onClose}>
      <div className="flex justify-center py-3">
        <Avatar name={name} size={76} />
      </div>
      <div className="space-y-3">
        <Field label={t('الاسم', 'Name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('البريد الإلكتروني', 'Email')}>
          <Input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t('رقم الجوال', 'Mobile')} hint={t('تغيير الرقم يتطلب تحققاً جديداً', 'Changing your number requires re-verification')}>
          <div dir="ltr" className="num flex h-12 items-center rounded-xl bg-road px-4 text-mute">
            {customer.phone}
          </div>
        </Field>
      </div>
      <Button
        full
        size="lg"
        className="mt-5"
        onClick={() => {
          actions.updateCustomer(customer.id, { name: { ar: name, en: name }, email })
          toast(t('تم حفظ التغييرات', 'Changes saved'))
          onClose()
        }}
      >
        {t('حفظ', 'Save')}
      </Button>
    </Panel>
  )
}

function OffersList({ customer }: { customer: Customer }) {
  const { t, L, lang } = useI18n()
  const promos = useEco((s) => s.promos.filter((p) => p.active && p.endsAt > Date.now()))
  if (!promos.length) return <EmptyState icon={<Gift size={26} />} title={t('لا توجد عروض حالياً', 'No offers right now')} />
  return (
    <div className="space-y-2 pt-2">
      {promos.map((p) => (
        <div key={p.id} className="rounded-2xl bg-ink p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{L(p.title)}</p>
            {p.audience === 'gold' && customer.tier !== 'gold' && <Badge tone="outline">Gold</Badge>}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="num rounded-lg bg-go px-2.5 py-1 text-sm font-bold tracking-widest text-ink">{p.code}</span>
            <span className="num text-xs text-white/50">
              {t('حتى', 'Until')} {day(p.endsAt, lang)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlacesPanel({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [sel, setSel] = useState(PLACES[1].id)
  const [slot, setSlot] = useState<'home' | 'work' | 'other'>('other')
  return (
    <Panel title={t('الأماكن المحفوظة', 'Saved places')} onClose={onClose}>
      <div className="divide-y divide-line">
        <Row icon={<HomeIcon size={18} {...ICON} />} title={t('المنزل', 'Home')} sub={customer.saved.home ? L(customer.saved.home.sub) : t('غير محدد', 'Not set')} />
        <Row icon={<Briefcase size={18} {...ICON} />} title={t('العمل', 'Work')} sub={customer.saved.work ? L(customer.saved.work.sub) : t('غير محدد', 'Not set')} />
        {customer.saved.others.map((p) => (
          <Row key={p.id} icon={<Star size={18} {...ICON} />} title={L(p.name)} sub={L(p.sub)} />
        ))}
      </div>
      <Button variant="secondary" full className="mt-3" icon={<Plus size={16} />} onClick={() => setAdding(true)}>
        {t('إضافة مكان', 'Add place')}
      </Button>
      <Sheet open={adding} onClose={() => setAdding(false)} title={t('إضافة مكان', 'Add place')}>
        <Field label={t('النوع', 'Type')}>
          <Segmented className="w-full" value={slot} onChange={setSlot} options={[{ value: 'home', label: t('المنزل', 'Home') }, { value: 'work', label: t('العمل', 'Work') }, { value: 'other', label: t('مفضل', 'Favourite') }]} />
        </Field>
        <Field label={t('المكان', 'Place')} className="mt-3">
          <Select className="h-12 w-full" value={sel} onChange={setSel} options={PLACES.map((p) => ({ value: p.id, label: L(p.name) }))} />
        </Field>
        <Button
          full
          size="lg"
          className="mt-4"
          onClick={() => {
            const p = PLACES.find((x) => x.id === sel)!
            actions.saveCustomerPlace(customer.id, slot, slot === 'other' ? p : { ...p, id: slot, name: slot === 'home' ? { ar: 'المنزل', en: 'Home' } : { ar: 'العمل', en: 'Work' }, sub: p.name })
            setAdding(false)
            toast(t('تم الحفظ', 'Saved'))
          }}
        >
          {t('حفظ', 'Save')}
        </Button>
      </Sheet>
    </Panel>
  )
}

function SafetyPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [share, setShare] = useState(true)
  const [pin, setPin] = useState(true)
  return (
    <Panel title={t('الأمان', 'Safety')} onClose={onClose}>
      <div className="rounded-2xl bg-ink p-4 text-white">
        <ShieldCheck className="text-go" size={26} />
        <p className="mt-2 font-semibold">{t('الأمان ظاهر في كل رحلة', 'Safety, visible on every trip')}</p>
        <p className="mt-1 text-xs text-white/60">{t('كباتن موثّقون، رمز تحقق لكل رحلة، ومشاركة مباشرة للمسار.', 'Verified captains, a code for every trip, and live route sharing.')}</p>
      </div>
      <div className="mt-3 divide-y divide-line">
        <Row title={t('التحقق برمز الرحلة', 'Trip code verification')} sub={t('يطلب الكابتن رمزك قبل البدء', 'Captain asks for your code before starting')} end={<Switch checked={pin} onChange={setPin} />} />
        <Row title={t('مشاركة تلقائية مع جهات الثقة', 'Auto-share with trusted contacts')} sub={t('في الرحلات الليلية', 'For night trips')} end={<Switch checked={share} onChange={setShare} />} />
        <Row icon={<Phone size={18} {...ICON} />} title={t('جهات الاتصال الموثوقة', 'Trusted contacts')} sub={t('أضف حتى ٥ جهات', 'Add up to 5 contacts')} />
      </div>
    </Panel>
  )
}

export function HelpPanel({ requester, onClose }: { requester: Ticket['requester']; onClose: () => void }) {
  const { t, lang } = useI18n()
  const toast = useToast()
  const tickets = useEco((s) => s.tickets.filter((x) => x.requester.id === requester.id && x.requester.kind === requester.kind))
  const [composing, setComposing] = useState(false)
  const [subject, setSubject] = useState('')
  const [cat, setCat] = useState<Ticket['category']>('help')
  const [text, setText] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const cur = tickets.find((x) => x.id === open)
  const faq = [
    [t('كيف يُحسب السعر؟', 'How is the price calculated?'), t('رسوم فتح + مسافة + وقت، ويظهر السعر النهائي قبل التأكيد ولا يتغير.', 'Base + distance + time. The final price is shown before you confirm and never changes.')],
    [t('نسيت غرضاً في السيارة', 'I left an item in the car'), t('افتح تذكرة من نوع «مفقودات» وسنتواصل مع الكابتن.', 'Open a "Lost item" ticket and we will contact the captain.')],
    [t('كيف ألغي رحلة؟', 'How do I cancel a ride?'), t('من شاشة الرحلة اضغط «إلغاء الرحلة» واختر السبب.', 'From the trip screen tap "Cancel trip" and choose a reason.')],
  ]
  return (
    <Panel title={t('المساعدة', 'Help')} onClose={onClose}>
      <Button full icon={<MessageSquare size={17} />} onClick={() => setComposing(true)}>
        {t('تواصل مع الدعم', 'Contact support')}
      </Button>
      <h3 className="mt-5 mb-1 text-[13px] font-semibold text-mute">{t('تذاكري', 'My tickets')}</h3>
      {tickets.length === 0 && <p className="py-3 text-sm text-mute">{t('لا توجد تذاكر', 'No tickets')}</p>}
      {tickets.map((x) => (
        <Row
          key={x.id}
          onClick={() => setOpen(x.id)}
          icon={<MessageSquare size={18} {...ICON} />}
          title={x.subject}
          sub={`${x.id} · ${dateTime(x.updatedAt, lang)}`}
          end={<Badge tone={x.status === 'resolved' ? 'done' : x.status === 'pending' ? 'pending' : 'live'}>{x.status === 'open' ? t('مفتوحة', 'Open') : x.status === 'pending' ? t('قيد المعالجة', 'Pending') : t('محلولة', 'Resolved')}</Badge>}
        />
      ))}
      <h3 className="mt-5 mb-1 text-[13px] font-semibold text-mute">{t('أسئلة شائعة', 'FAQ')}</h3>
      {faq.map(([q, a]) => (
        <details key={q} className="border-b border-line py-3">
          <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
          <p className="mt-2 text-sm text-mute">{a}</p>
        </details>
      ))}
      <Sheet open={composing} onClose={() => setComposing(false)} title={t('تذكرة جديدة', 'New ticket')}>
        <Field label={t('النوع', 'Category')}>
          <Select
            className="h-12 w-full"
            value={cat}
            onChange={(v) => setCat(v as Ticket['category'])}
            options={[
              { value: 'help', label: t('طلب مساعدة', 'Help request') },
              { value: 'complaint', label: t('شكوى', 'Complaint') },
              { value: 'lost_item', label: t('مفقودات', 'Lost item') },
              { value: 'dispute', label: t('اعتراض على مبلغ', 'Payment dispute') },
              { value: 'safety', label: t('بلاغ أمان', 'Safety report') },
            ]}
          />
        </Field>
        <Field label={t('العنوان', 'Subject')} className="mt-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label={t('التفاصيل', 'Details')} className="mt-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="h-24 w-full resize-none rounded-xl bg-road p-3 text-sm outline-none focus:ring-2 focus:ring-ink" />
        </Field>
        <Button
          full
          size="lg"
          className="mt-4"
          disabled={subject.trim().length < 3 || text.trim().length < 5}
          onClick={() => {
            actions.createTicket({ requester, subject, category: cat, text })
            setComposing(false)
            setSubject('')
            setText('')
            toast(t('تم إرسال التذكرة. سيرد فريق الدعم قريباً.', 'Ticket sent. Support will reply soon.'))
          }}
        >
          {t('إرسال', 'Send')}
        </Button>
      </Sheet>
      <Sheet open={!!cur} onClose={() => setOpen(null)} title={cur?.subject}>
        {cur && (
          <>
            <div className="thin-scroll flex max-h-72 flex-col gap-2 overflow-y-auto">
              {cur.messages.map((m, i) => (
                <div key={i} className={cx('max-w-[85%] rounded-2xl px-3 py-2 text-sm', m.from === requester.kind ? 'self-end bg-ink text-white' : 'self-start bg-road')}>
                  {m.from === 'agent' && <p className="mb-0.5 text-[11px] font-semibold text-go-deep">{m.author ?? t('فريق أورا', 'AURA team')}</p>}
                  {m.text}
                  <p className="num mt-1 text-[10px] opacity-50">{dateTime(m.at, lang)}</p>
                </div>
              ))}
            </div>
            {cur.status !== 'resolved' && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  actions.replyTicket(cur.id, { from: requester.kind, text: reply })
                  setReply('')
                }}
              >
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('اكتب ردك…', 'Write a reply…')} />
                <Button type="submit" disabled={!reply.trim()}>
                  {t('إرسال', 'Send')}
                </Button>
              </form>
            )}
          </>
        )}
      </Sheet>
    </Panel>
  )
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, lang, setLang } = useI18n()
  const [n1, setN1] = useState(true)
  const [n2, setN2] = useState(false)
  return (
    <Panel title={t('الإعدادات', 'Settings')} onClose={onClose}>
      <div className="divide-y divide-line">
        <Row icon={<Globe size={18} {...ICON} />} title={t('اللغة', 'Language')} end={<Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'English' }]} />} />
        <Row icon={<Bell size={18} {...ICON} />} title={t('إشعارات الرحلات', 'Trip notifications')} end={<Switch checked={n1} onChange={setN1} />} />
        <Row icon={<Gift size={18} {...ICON} />} title={t('العروض والتسويق', 'Offers & marketing')} end={<Switch checked={n2} onChange={setN2} />} />
        <Row icon={<Trash2 size={18} {...ICON} />} danger title={t('حذف الحساب', 'Delete account')} sub={t('يتم عبر الدعم وفق نظام حماية البيانات الشخصية', 'Handled by support under the PDPL')} />
      </div>
      <Divider className="my-4" />
      <p className="text-center text-[11px] text-mute-2">AURA Passenger · v1.0 (demo)</p>
    </Panel>
  )
}

export function InboxPanel({ audience, onClose }: { audience: 'passengers' | 'captains'; onClose: () => void }) {
  const { t, L, lang } = useI18n()
  const items = useEco((s) => s.inbox.filter((i) => i.to === 'all' || i.to === audience))
  return (
    <Panel title={t('الإشعارات', 'Notifications')} onClose={onClose}>
      {items.length === 0 && <EmptyState icon={<Bell size={26} />} title={t('لا توجد إشعارات', 'No notifications')} />}
      {items.map((i) => (
        <div key={i.id} className="border-b border-current/10 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{L(i.title)}</p>
            <span className="num shrink-0 text-[11px] opacity-50">{dateTime(i.at, lang)}</span>
          </div>
          <p className="mt-0.5 text-[13px] opacity-65">{L(i.body)}</p>
        </div>
      ))}
    </Panel>
  )
}

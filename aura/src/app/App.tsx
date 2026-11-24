import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { ArrowUpRight, Boxes, LayoutDashboard, Palette, RotateCcw, Smartphone, CarFront } from 'lucide-react'
import { useHashRoute } from './router'
import { useI18n } from '../i18n/I18n'
import { AppIcon, Wordmark } from '../ds/Logo'
import { Device, useIsMobile } from '../ds/Device'
import { Badge, Button, cx, Segmented, Spinner, TripStatusBadge } from '../ds/ui'
import { PassengerApp } from '../apps/passenger/PassengerApp'
import { DriverApp } from '../apps/driver/DriverApp'
import { actions, getCustomer, getDriver, getSession, setSession, store, useEco, useNow } from '../core/store'
import { STATUS_LABEL, TRIP_STATUSES } from '../core/trip'
import { clock, sar } from '../core/format'
import { DEMO_PASSENGER_ID, DEMO_DRIVER_ID } from '../core/seed'

const AdminApp = lazy(() => import('../apps/admin/AdminApp').then((m) => ({ default: m.AdminApp })))
const DesignSystemPage = lazy(() => import('./DesignSystem').then((m) => ({ default: m.DesignSystemPage })))

export function App() {
  const parts = useHashRoute()
  const r = parts[0] ?? ''
  const fallback = (
    <div className="flex min-h-screen items-center justify-center bg-road">
      <Spinner size={28} />
    </div>
  )
  if (r === 'passenger') return <MobileHost app="passenger" />
  if (r === 'driver') return <MobileHost app="driver" />
  if (r === 'admin')
    return (
      <Suspense fallback={fallback}>
        <AdminApp />
      </Suspense>
    )
  if (r === 'ecosystem') return <Ecosystem />
  if (r === 'design')
    return (
      <Suspense fallback={fallback}>
        <DesignSystemPage />
      </Suspense>
    )
  return <Launcher />
}

/* ------------------------------------------------------------------ */

function TopNav({ dark }: { dark?: boolean }) {
  const { t, lang, setLang, dir } = useI18n()
  return (
    <header dir={dir} className={cx('flex items-center gap-4 px-5 py-4 md:px-8', dark ? 'text-white' : 'text-ink')}>
      <a href="#/" aria-label="AURA">
        <Wordmark tone={dark ? 'white' : 'black'} width={86} />
      </a>
      <nav className="ms-4 hidden items-center gap-1 text-sm font-medium md:flex">
        {[
          ['#/passenger', t('العميل', 'Passenger')],
          ['#/driver', t('الكابتن', 'Driver')],
          ['#/admin/overview', t('الإدارة', 'Admin')],
          ['#/ecosystem', t('المنظومة المباشرة', 'Live ecosystem')],
          ['#/design', t('نظام التصميم', 'Design system')],
        ].map(([h, l]) => (
          <a key={h} href={h} className={cx('rounded-lg px-3 py-1.5 transition', dark ? 'text-white/65 hover:bg-white/8 hover:text-white' : 'text-mute hover:bg-white hover:text-ink')}>
            {l}
          </a>
        ))}
      </nav>
      <div className="ms-auto">
        <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'EN' }]} />
      </div>
    </header>
  )
}

function Launcher() {
  const { t, dir } = useI18n()
  const products = [
    {
      href: '#/passenger',
      icon: <Smartphone size={22} />,
      title: 'AURA Passenger',
      sub: t('تجربة العميل', 'Rider experience'),
      body: t('حجز في ثلاث نقرات، سعر نهائي قبل التأكيد، تتبع حي ورمز تحقق لكل رحلة.', 'Book in three taps, final price before confirming, live tracking and a code for every trip.'),
      tone: 'light' as const,
    },
    {
      href: '#/driver',
      icon: <CarFront size={22} />,
      title: 'AURA Driver',
      sub: t('تجربة الكابتن', 'Captain experience'),
      body: t('واجهة داكنة عالية التباين للعمل: استقبال الطلبات، الملاحة، التحقق، والأرباح.', 'High-contrast dark UI for work: offers, navigation, rider verification and earnings.'),
      tone: 'dark' as const,
    },
    {
      href: '#/admin/overview',
      icon: <LayoutDashboard size={22} />,
      title: 'AURA Admin',
      sub: t('مركز التحكم والتشغيل', 'Control centre'),
      body: t('خريطة تشغيلية مباشرة، الرحلات والكباتن والعملاء، المالية والتسعير، والصلاحيات.', 'Live ops map, trips, captains and customers, finance and pricing, and role permissions.'),
      tone: 'light' as const,
    },
  ]
  return (
    <div dir={dir} className="min-h-screen bg-road">
      <div className="aura-field relative overflow-hidden pb-24">
        <TopNav dark />
        <svg viewBox="0 0 400 300" className="pointer-events-none absolute -bottom-10 start-1/2 w-[900px] max-w-none -translate-x-1/2 rtl:translate-x-1/2 opacity-90" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d={`M${200 - 22 - i * 24} 300 L200 ${130 - i * 18} L${200 + 22 + i * 24} 300`} fill="none" stroke="#fff" strokeOpacity={0.035 + (9 - i) * 0.012} strokeWidth="2" strokeLinejoin="round" />
          ))}
          <path d="M182 300 L200 268 L218 300" fill="none" stroke="#78B83F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="relative mx-auto max-w-5xl px-5 pt-14 text-center text-white md:pt-20">
          <p className="text-xs font-semibold tracking-[0.3em] text-go">SAUDI SMART MOBILITY · GLOBAL STANDARDS</p>
          <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.1] md:text-[64px]">{t('تنقّل بثقة', 'Move with confidence')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/60">{t('منظومة نقل ذكي متكاملة: ثلاث منتجات تشترك في الهوية والبيانات ومنطق التشغيل نفسه.', 'One mobility ecosystem: three products sharing one identity, one data model and one operating logic.')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#/ecosystem">
              <Button variant="go" size="lg" icon={<Boxes size={18} />}>
                {t('شاهد المنظومة تعمل مباشرة', 'Watch the ecosystem live')}
              </Button>
            </a>
            <a href="#/design">
              <Button variant="secondary" size="lg" icon={<Palette size={18} />} className="border-white/20! bg-transparent! text-white! hover:bg-white/5!">
                {t('نظام التصميم', 'Design system')}
              </Button>
            </a>
          </div>
        </div>
      </div>
      <div className="relative mx-auto -mt-16 grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {products.map((p) => (
          <a key={p.href} href={p.href} className={cx('group flex flex-col rounded-3xl p-6 shadow-[0_20px_60px_-30px_rgba(16,17,18,.4)] transition hover:-translate-y-1', p.tone === 'dark' ? 'bg-ink-2 text-white ring-1 ring-white/6' : 'bg-white ring-1 ring-line')}>
            <div className="flex items-center justify-between">
              <AppIcon size={48} variant={p.tone === 'dark' ? 'primary' : 'light'} />
              <ArrowUpRight size={20} className="opacity-40 transition group-hover:opacity-100 rtl:-scale-x-100" />
            </div>
            <p className="mt-5 font-display text-xl font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
              {p.title}
            </p>
            <p className={cx('text-sm', p.tone === 'dark' ? 'text-go' : 'text-go-deep')}>{p.sub}</p>
            <p className={cx('mt-3 text-sm leading-relaxed', p.tone === 'dark' ? 'text-white/55' : 'text-mute')}>{p.body}</p>
          </a>
        ))}
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
          <p className="font-display text-lg font-semibold">{t('جرّب دورة تشغيل كاملة', 'Try a full operating cycle')}</p>
          <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm text-mute">
            <li>{t('افتح «المنظومة المباشرة» أو التطبيقات في ثلاث نوافذ.', 'Open "Live ecosystem", or the three apps in separate tabs.')}</li>
            <li>{t('في تطبيق الكابتن اضغط «اتصل الآن».', 'In the Driver app tap "Go online".')}</li>
            <li>{t('في تطبيق العميل اطلب رحلة Aura Go أو Comfort.', 'In the Passenger app request an Aura Go or Comfort ride.')}</li>
            <li>{t('اقبل الطلب، وصل، أدخل رمز الراكب، ثم أنهِ الرحلة.', 'Accept, arrive, enter the rider code, then end the trip.')}</li>
            <li>{t('تابع الحالات والمبالغ والعمولة في لوحة الإدارة.', 'Follow statuses, amounts and commission in Admin.')}</li>
          </ol>
        </div>
        <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
          <p className="font-display text-lg font-semibold">{t('حالات الرحلة الموحّدة', 'Unified trip states')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRIP_STATUSES.map((s) => (
              <span key={s} className="num rounded-lg bg-road px-2 py-1 text-[12px]" dir="ltr">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-dashed border-line-2 p-3 text-[12.5px] text-mute">
            {t('نسخة تجريبية: كل الأسماء والأرقام والأسعار والإحصاءات بيانات تجريبية للعرض فقط، ولا يوجد دفع أو اتصال أو إرسال حقيقي.', 'Demo build: all names, numbers, prices and statistics are demo data for presentation only. No real payments, calls or dispatch.')}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function MobileHost({ app }: { app: 'passenger' | 'driver' }) {
  const { t, dir } = useI18n()
  const mobile = useIsMobile()
  const el = app === 'passenger' ? <PassengerApp /> : <DriverApp />
  if (mobile) return <Device>{el}</Device>
  return (
    <div dir={dir} className={cx('flex min-h-screen flex-col', app === 'driver' ? 'aura-field' : 'bg-road')}>
      <TopNav dark={app === 'driver'} />
      <div className="flex flex-1 items-center justify-center gap-12 px-6 pb-8">
        <div className={cx('hidden max-w-xs xl:block', app === 'driver' ? 'text-white' : 'text-ink')}>
          <AppIcon size={56} variant={app === 'driver' ? 'primary' : 'light'} />
          <p className="mt-5 font-display text-3xl font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
            {app === 'passenger' ? 'AURA Passenger' : 'AURA Driver'}
          </p>
          <p className={cx('mt-2 text-sm leading-relaxed', app === 'driver' ? 'text-white/55' : 'text-mute')}>
            {app === 'passenger'
              ? t('رقم تجريبي: 55 765 4321 · الرمز 2468. أي رقم آخر ينشئ حساباً جديداً.', 'Demo number: 55 765 4321 · code 2468. Any other number creates a new account.')
              : t('رقم تجريبي: 55 123 4567 · الرمز 1357. أي رقم آخر يبدأ تسجيل كابتن جديد.', 'Demo number: 55 123 4567 · code 1357. Any other number starts a new captain application.')}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={app === 'passenger' ? '#/driver' : '#/passenger'}>
              <Button variant="secondary" size="sm" className={app === 'driver' ? 'border-white/20! bg-transparent! text-white!' : ''}>
                {app === 'passenger' ? t('افتح تطبيق الكابتن', 'Open Driver app') : t('افتح تطبيق العميل', 'Open Passenger app')}
              </Button>
            </a>
            <a href="#/ecosystem">
              <Button variant="go" size="sm">
                {t('المنظومة المباشرة', 'Live ecosystem')}
              </Button>
            </a>
          </div>
        </div>
        <Device statusTone={app === 'driver' ? 'light' : 'dark'} reserveH={110}>
          {el}
        </Device>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Ecosystem() {
  const { t, dir } = useI18n()
  // Sign both phones into the demo accounts so the cycle can start immediately.
  useMemo(() => {
    const s = getSession()
    setSession({ passengerId: s.passengerId ?? DEMO_PASSENGER_ID, driverId: s.driverId ?? DEMO_DRIVER_ID })
  }, [])
  return (
    <div dir={dir} className="min-h-screen bg-road">
      <TopNav />
      <div className="mx-auto max-w-[1500px] px-4 pb-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-2">
          <div>
            <h1 className="font-display text-[28px] font-semibold">{t('المنظومة المباشرة', 'Live ecosystem')}</h1>
            <p className="text-sm text-mute">{t('العميل والكابتن والإدارة على نفس البيانات ونفس حالات الرحلة، لحظة بلحظة.', 'Passenger, captain and operations on the same data and trip states, in real time.')}</p>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={15} />} onClick={() => { actions.resetDemo(); window.location.reload() }}>
            {t('إعادة ضبط التجربة', 'Reset demo')}
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-6">
          <Column title="AURA Passenger" sub={t('العميل', 'Rider')}>
            <Device scale={0.74} forceFrame>
              <PassengerApp embedded />
            </Device>
          </Column>
          <Column title="AURA Driver" sub={t('الكابتن', 'Captain')}>
            <Device scale={0.74} statusTone="light" forceFrame>
              <DriverApp embedded />
            </Device>
          </Column>
          <Column title="AURA Admin" sub={t('غرفة التشغيل', 'Operations')}>
            <OpsMonitor />
          </Column>
        </div>
      </div>
    </div>
  )
}

function Column({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-display font-semibold" dir="ltr">
          {title}
        </span>
        <span className="text-mute">· {sub}</span>
      </p>
      {children}
    </div>
  )
}

/** Compact admin view of the same trips (full console at #/admin). */
function OpsMonitor() {
  const { t, L, lang } = useI18n()
  useNow(1000)
  const trips = useEco((s) => s.trips.slice(0, 6))
  const audit = useEco((s) => s.audit.slice(0, 5))
  const cur = trips[0]
  return (
    <div className="flex w-[340px] flex-col gap-3" style={{ height: (844 + 24) * 0.74 }}>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-line">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold">{t('آخر رحلة', 'Latest trip')}</p>
          <a href="#/admin/trips" className="text-xs font-semibold underline">
            {t('فتح لوحة الإدارة', 'Open Admin')}
          </a>
        </div>
        {!cur ? (
          <p className="py-8 text-center text-sm text-mute">{t('اطلب رحلة من تطبيق العميل لتظهر هنا.', 'Request a ride in the Passenger app to see it here.')}</p>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-between">
              <span className="num font-semibold">{cur.id}</span>
              <TripStatusBadge status={cur.status} />
            </div>
            <p className="mt-1 truncate text-xs text-mute">
              {L(getCustomer(cur.passengerId)?.name)} → {L(cur.dropoff.name)}
            </p>
            <p className="truncate text-xs text-mute">
              {t('الكابتن', 'Captain')}: {cur.driverId ? L(getDriver(cur.driverId)?.name) : '—'}
            </p>
            <ol className="mt-3 space-y-1.5">
              {TRIP_STATUSES.filter((s) => s !== 'cancelled' || cur.status === 'cancelled').map((s) => {
                const hit = cur.timeline.find((e) => e.status === s)
                return (
                  <li key={s} className={cx('flex items-center gap-2 text-[12.5px]', !hit && 'opacity-35')}>
                    <span className={cx('size-2 rounded-full', hit ? (s === 'cancelled' ? 'bg-danger' : 'bg-go') : 'bg-line-2')} />
                    <span className="num w-28 shrink-0 text-[11px]" dir="ltr">
                      {s}
                    </span>
                    <span className="flex-1 truncate">{L(STATUS_LABEL[s])}</span>
                    {hit && <span className="num text-[11px] text-mute">{clock(hit.at, lang)}</span>}
                  </li>
                )
              })}
            </ol>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              {[
                [t('الإجمالي', 'Total'), sar(cur.fare.total)],
                [t('العمولة', 'Commission'), sar(cur.fare.commission)],
                [t('للكابتن', 'Captain'), sar(cur.fare.driverNet)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-road py-2">
                  <p className="num text-[13px] font-semibold">{v}</p>
                  <p className="text-[10.5px] text-mute">{k}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-white p-4 ring-1 ring-line">
        <p className="text-[13px] font-semibold">{t('رحلات الجلسة', 'Session trips')}</p>
        <div className="thin-scroll mt-2 max-h-full space-y-1.5 overflow-y-auto">
          {trips.map((x) => (
            <div key={x.id} className="flex items-center justify-between text-[12px]">
              <span className="num">{x.id}</span>
              <Badge tone={x.status === 'completed' ? 'done' : x.status === 'cancelled' ? 'danger' : 'live'}>{x.status}</Badge>
            </div>
          ))}
          {trips.length === 0 && <p className="text-xs text-mute">—</p>}
          <p className="pt-3 text-[13px] font-semibold">{t('سجل العمليات', 'Audit log')}</p>
          {audit.map((a) => (
            <p key={a.id} className="truncate text-[11.5px] text-mute">
              <span className="num">{clock(a.at, lang)}</span> · {a.actor} · {a.action}
            </p>
          ))}
        </div>
      </div>
      <p className="text-center text-[11px] text-mute">{store.state.settings.autoDispatch ? t('التوزيع التلقائي التجريبي مفعّل', 'Demo auto-dispatch on') : ''}</p>
    </div>
  )
}

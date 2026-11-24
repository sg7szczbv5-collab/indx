import { useMemo, useState, type ReactNode } from 'react'
import {
  LayoutDashboard, Map as MapIcon, Route, Car, Users, BadgeDollarSign, Tag, LifeBuoy, Megaphone, Settings, ScrollText, Siren, TrendingUp, Activity, Wallet, Star, XCircle, Search, ExternalLink,
} from 'lucide-react'
import { Logo, Badge } from '../../components/ui'
import { money, num, ago } from '../../lib/format'
import { isLive, resolveSOS, useNow, useStore } from '../../store/store'
import type { State } from '../../store/types'
import { LiveMap, TripsPage } from './AdminTrips'
import { DriversPage, RidersPage } from './AdminPeople'
import { PricingPage, PromosPage, SupportPage, NoticesPage, SettingsPage, LogPage } from './AdminConfig'

export type AdminPage = 'overview' | 'live' | 'trips' | 'drivers' | 'riders' | 'pricing' | 'promos' | 'support' | 'notices' | 'settings' | 'log'

export function AdminApp() {
  const s = useStore()
  const [page, setPage] = useState<AdminPage>('overview')
  const [focusTrip, setFocusTrip] = useState<string | null>(null)
  const pending = s.drivers.filter((d) => d.status === 'pending').length
  const openT = s.tickets.filter((t) => t.status === 'open').length
  const sos = s.trips.filter((t) => t.sos && isLive(t))
  const live = s.trips.filter(isLive).length

  const nav: [AdminPage, string, typeof Car, number?][] = [
    ['overview', 'نظرة عامة', LayoutDashboard],
    ['live', 'العمليات المباشرة', MapIcon, live],
    ['trips', 'الرحلات', Route],
    ['drivers', 'الكباتن', Car, pending],
    ['riders', 'الركاب', Users],
    ['pricing', 'التسعير والخدمات', BadgeDollarSign],
    ['promos', 'العروض والأكواد', Tag],
    ['support', 'الدعم والشكاوى', LifeBuoy, openT],
    ['notices', 'الإشعارات', Megaphone],
    ['settings', 'إعدادات المنصة', Settings],
    ['log', 'سجل النشاط', ScrollText],
  ]
  const go = (p: AdminPage, trip?: string) => {
    setPage(p)
    setFocusTrip(trip ?? null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-mist lg:flex-row">
      <aside className="shrink-0 bg-ink text-white lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:py-6">
          <Logo size={30} light tag="ADMIN" />
          <div className="flex gap-2 lg:hidden">
            <a href="#/" className="text-xs text-white/60">
              الرئيسية
            </a>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pb-6">
          {nav.map(([k, l, I, n]) => (
            <button key={k} onClick={() => go(k)} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${page === k ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <I size={18} />
              <span className="whitespace-nowrap lg:flex-1 lg:text-start">{l}</span>
              {!!n && <span className={`rounded-full px-1.5 text-[11px] font-bold tnum ${page === k ? 'bg-ink text-white' : 'bg-lime text-ink'}`}>{n}</span>}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 text-xs text-white/50 lg:block">
          <p className="font-semibold text-white">مدير النظام</p>
          <p>admin@auar.app</p>
          <a href="#/" className="mt-2 inline-flex items-center gap-1 text-lime">
            <ExternalLink size={12} /> بوابة التطبيقات
          </a>
        </div>
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {sos.length > 0 && (
          <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 bg-bad px-6 py-3 text-white">
            <Siren size={20} className="animate-pulse" />
            <span className="font-bold">تنبيه طوارئ نشط</span>
            {sos.map((t) => (
              <span key={t.id} className="flex items-center gap-2 rounded-lg bg-white/15 px-2 py-1 text-sm">
                رحلة {t.id}
                <button className="underline" onClick={() => go('trips', t.id)}>
                  عرض
                </button>
                <button className="underline" onClick={() => resolveSOS(t.id)}>
                  تمت المعالجة
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mx-auto max-w-[1280px] p-4 md:p-6">
          {page === 'overview' && <Overview go={go} />}
          {page === 'live' && <LiveMap onOpen={(id) => go('trips', id)} />}
          {page === 'trips' && <TripsPage focus={focusTrip} setFocus={setFocusTrip} />}
          {page === 'drivers' && <DriversPage />}
          {page === 'riders' && <RidersPage />}
          {page === 'pricing' && <PricingPage />}
          {page === 'promos' && <PromosPage />}
          {page === 'support' && <SupportPage />}
          {page === 'notices' && <NoticesPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'log' && <LogPage />}
        </div>
      </main>
    </div>
  )
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-mute">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Card({ children, className = '', title, right }: { children: ReactNode; className?: string; title?: string; right?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-bold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3">
      <Search size={16} className="text-mute" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-48 bg-transparent text-sm outline-none" />
    </label>
  )
}

function stats(s: State, now: number) {
  const day = now - 86400000
  const done = s.trips.filter((t) => t.status === 'completed' && (t.completedAt ?? 0) > day)
  const canc = s.trips.filter((t) => t.status === 'cancelled' && (t.cancelledAt ?? 0) > day)
  const gross = done.reduce((a, t) => a + t.fare, 0)
  const comm = done.reduce((a, t) => a + t.commission, 0)
  const rated = s.trips.filter((t) => t.riderRating)
  const avg = rated.length ? rated.reduce((a, t) => a + (t.riderRating ?? 0), 0) / rated.length : 0
  return { done, canc, gross, comm, avg, cancelRate: done.length + canc.length ? canc.length / (done.length + canc.length) : 0 }
}

function Overview({ go }: { go: (p: AdminPage, t?: string) => void }) {
  const s = useStore()
  const now = useNow(2000)
  const st = stats(s, now)
  const online = s.drivers.filter((d) => d.online && d.status === 'active')
  const busy = new Set(s.trips.filter((t) => ['accepted', 'arrived', 'in_progress'].includes(t.status)).map((t) => t.driverId))
  const liveTrips = s.trips.filter(isLive)

  const hours = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => {
      const end = now - (11 - i) * 2 * 3600000
      const start = end - 2 * 3600000
      const ts = s.trips.filter((t) => t.status === 'completed' && t.completedAt! > start && t.completedAt! <= end)
      return { h: new Date(end).getHours(), v: ts.reduce((a, t) => a + t.fare, 0), n: ts.length }
    })
    return arr
  }, [s.trips, Math.floor(now / 60000)])
  const maxH = Math.max(1, ...hours.map((h) => h.v))

  const byCat = s.categories.map((c) => ({ c, n: s.trips.filter((t) => t.category === c.id && t.status === 'completed').length }))
  const maxC = Math.max(1, ...byCat.map((x) => x.n))
  const payMix = (['card', 'cash', 'wallet', 'apple'] as const).map((m) => ({ m, n: s.trips.filter((t) => t.payment === m && t.status === 'completed').length }))
  const payTotal = Math.max(1, payMix.reduce((a, x) => a + x.n, 0))

  const kpis: [string, string, typeof Car, string?][] = [
    ['إجمالي الحجوزات (٢٤ س)', money(st.gross), Wallet],
    ['إيراد المنصة (العمولة)', money(st.comm), TrendingUp, `${Math.round(s.settings.commission * 100)}٪ عمولة`],
    ['رحلات مكتملة (٢٤ س)', num(st.done.length), Route],
    ['رحلات جارية الآن', num(liveTrips.length), Activity],
    ['كباتن متصلون', `${online.length} / ${s.drivers.filter((d) => d.status === 'active').length}`, Car, `${busy.size} في رحلة`],
    ['متوسط تقييم الرحلات', st.avg.toFixed(2), Star],
    ['نسبة الإلغاء', `${Math.round(st.cancelRate * 100)}٪`, XCircle],
    ['الركاب المسجلون', num(s.riders.length), Users, `${s.riders.filter((r) => r.blocked).length} محظور`],
  ]

  return (
    <>
      <PageTitle title="نظرة عامة" sub={`آخر تحديث ${new Date(now).toLocaleTimeString('ar-SA-u-nu-latn')} — البيانات مباشرة`} right={s.settings.surgeOn ? <Badge tone="warn">التسعير الديناميكي مفعّل ×{s.settings.surge}</Badge> : undefined} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([l, v, I, sub]) => (
          <div key={l} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between text-mute">
              <span className="text-[13px]">{l}</span>
              <I size={16} />
            </div>
            <p className="mt-2 text-2xl font-bold tnum">{v}</p>
            {sub && <p className="mt-0.5 text-xs text-mute">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="الحجوزات خلال ٢٤ ساعة" className="lg:col-span-2" right={<span className="text-xs text-mute">كل عمود = ساعتان</span>}>
          <div className="flex h-48 items-end gap-2" role="img" aria-label="مخطط الحجوزات">
            {hours.map((h, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-mute opacity-0 transition group-hover:opacity-100 tnum">{Math.round(h.v)}</span>
                <div className={`w-full rounded-t-md ${i === hours.length - 1 ? 'bg-ink' : 'bg-ink/20 group-hover:bg-ink/40'}`} style={{ height: `${Math.max(3, (h.v / maxH) * 150)}px` }} title={`${money(h.v)} • ${h.n} رحلة`} />
                <span className="text-[10px] text-mute tnum">{h.h}:00</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="الرحلات حسب الخدمة">
          <div className="space-y-2.5">
            {byCat.map(({ c, n }) => (
              <div key={c.id}>
                <div className="flex justify-between text-[13px]">
                  <span dir="auto">{c.name}</span>
                  <span className="text-mute tnum">{n}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-mist">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(n / maxC) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="الرحلات الجارية" className="lg:col-span-2" right={<button onClick={() => go('live')} className="text-sm font-semibold text-sky">الخريطة المباشرة ←</button>}>
          {liveTrips.length === 0 ? (
            <p className="py-6 text-center text-sm text-mute">لا توجد رحلات جارية الآن — افتح تطبيق الراكب واطلب رحلة لتظهر هنا مباشرة.</p>
          ) : (
            <div className="divide-y divide-line">
              {liveTrips.map((t) => {
                const d = s.drivers.find((x) => x.id === t.driverId)
                const r = s.riders.find((x) => x.id === t.riderId)
                return (
                  <button key={t.id} onClick={() => go('trips', t.id)} className="flex w-full items-center gap-3 py-2.5 text-start text-sm hover:bg-mist/50">
                    <span className="w-20 font-mono text-xs text-mute">{t.id}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {r?.name} ← {t.dropoff.name}
                    </span>
                    <span className="hidden truncate text-mute md:block">{d?.name ?? '—'}</span>
                    <TripStatus st={t.status} />
                    {t.sos && <Badge tone="bad">SOS</Badge>}
                  </button>
                )
              })}
            </div>
          )}
        </Card>
        <Card title="طرق الدفع">
          <div className="flex h-3 overflow-hidden rounded-full">
            {payMix.map(({ m, n }, i) => (
              <div key={m} style={{ width: `${(n / payTotal) * 100}%`, background: ['#0a0a0a', '#16a34a', '#c8f31d', '#6b6b66'][i] }} />
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-[13px]">
            {payMix.map(({ m, n }, i) => (
              <div key={m} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ['#0a0a0a', '#16a34a', '#c8f31d', '#6b6b66'][i] }} />
                <span className="flex-1">{{ card: 'بطاقة', cash: 'نقداً', wallet: 'المحفظة', apple: 'Apple Pay' }[m]}</span>
                <span className="text-mute tnum">{Math.round((n / payTotal) * 100)}٪</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-sm font-bold">تحتاج إجراء</p>
            <button onClick={() => go('drivers')} className="flex w-full justify-between py-1 text-sm hover:underline">
              <span>طلبات انضمام كباتن</span>
              <Badge tone={s.drivers.some((d) => d.status === 'pending') ? 'warn' : 'neutral'}>{s.drivers.filter((d) => d.status === 'pending').length}</Badge>
            </button>
            <button onClick={() => go('support')} className="flex w-full justify-between py-1 text-sm hover:underline">
              <span>تذاكر دعم مفتوحة</span>
              <Badge tone={s.tickets.some((t) => t.status === 'open') ? 'warn' : 'neutral'}>{s.tickets.filter((t) => t.status === 'open').length}</Badge>
            </button>
          </div>
        </Card>
      </div>
      <Card title="آخر النشاطات" className="mt-4" right={<button onClick={() => go('log')} className="text-sm font-semibold text-sky">الكل ←</button>}>
        <div className="divide-y divide-line text-sm">
          {s.log.slice(0, 6).map((l, i) => (
            <div key={i} className="flex justify-between gap-3 py-2">
              <span>{l.text}</span>
              <span className="shrink-0 text-xs text-mute">{ago(l.at, now)}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

const ST: Record<string, [string, 'ok' | 'bad' | 'warn' | 'info' | 'neutral' | 'lime' | 'dark']> = {
  searching: ['بحث عن كابتن', 'warn'],
  accepted: ['الكابتن في الطريق', 'info'],
  arrived: ['الكابتن وصل', 'lime'],
  in_progress: ['جارية', 'dark'],
  completed: ['مكتملة', 'ok'],
  cancelled: ['ملغاة', 'bad'],
  no_drivers: ['لا يوجد كابتن', 'neutral'],
  scheduled: ['مجدولة', 'info'],
}
export const TripStatus = ({ st }: { st: string }) => <Badge tone={ST[st]?.[1] ?? 'neutral'}>{ST[st]?.[0] ?? st}</Badge>

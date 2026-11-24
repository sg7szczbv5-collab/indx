import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  Car,
  CarFront,
  CircleDollarSign,
  Headset,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPinned,
  Megaphone,
  Menu,
  Route,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Tags,
  Users,
  X,
} from 'lucide-react'
import { Wordmark } from '../../ds/Logo'
import { Avatar, Badge, cx, ICON, Segmented, Surface, ToastHost } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { clearSession, fleetSnapshot, getSession, setSession, store, useEco, useNow } from '../../core/store'
import { isActive } from '../../core/trip'
import { ROLE_LABEL } from '../../core/seed'
import type { AdminUser, Permission } from '../../core/types'
import { go, useHashRoute } from '../../app/router'
import { AdminLogin } from './Login'
import { AdminProvider, Forbidden, useAdmin } from './kit'
import { OverviewPage } from './pages/Overview'
import { LiveMapPage } from './pages/LiveMap'
import { TripsPage } from './pages/Trips'
import { DriversPage } from './pages/Drivers'
import { CustomersPage, VehiclesPage } from './pages/People'
import { FinancePage, PricingPage } from './pages/Money'
import { ZonesPage } from './pages/Zones'
import { MarketingPage, SupportPage } from './pages/Service'
import { ReportsPage } from './pages/Reports'
import { RolesPage, SettingsPage } from './pages/System'

type PageDef = { id: string; label: { ar: string; en: string }; icon: ReactNode; perm: Permission; el: () => ReactNode }
type Group = { label: { ar: string; en: string }; pages: PageDef[] }

const I = (n: ReactNode) => n
const GROUPS: Group[] = [
  {
    label: { ar: 'التشغيل', en: 'Operations' },
    pages: [
      { id: 'overview', label: { ar: 'الرئيسية', en: 'Overview' }, icon: I(<LayoutDashboard size={18} {...ICON} />), perm: 'dashboard.view', el: () => <OverviewPage /> },
      { id: 'live', label: { ar: 'الخريطة المباشرة', en: 'Live map' }, icon: I(<MapIcon size={18} {...ICON} />), perm: 'livemap.view', el: () => <LiveMapPage /> },
      { id: 'trips', label: { ar: 'الرحلات', en: 'Trips' }, icon: I(<Route size={18} {...ICON} />), perm: 'trips.view', el: () => <TripsPage /> },
      { id: 'drivers', label: { ar: 'الكباتن', en: 'Captains' }, icon: I(<CarFront size={18} {...ICON} />), perm: 'drivers.view', el: () => <DriversPage /> },
      { id: 'customers', label: { ar: 'العملاء', en: 'Customers' }, icon: I(<Users size={18} {...ICON} />), perm: 'customers.view', el: () => <CustomersPage /> },
      { id: 'vehicles', label: { ar: 'المركبات', en: 'Vehicles' }, icon: I(<Car size={18} {...ICON} />), perm: 'vehicles.view', el: () => <VehiclesPage /> },
    ],
  },
  {
    label: { ar: 'الأعمال', en: 'Business' },
    pages: [
      { id: 'finance', label: { ar: 'المالية', en: 'Finance' }, icon: I(<CircleDollarSign size={18} {...ICON} />), perm: 'finance.view', el: () => <FinancePage /> },
      { id: 'pricing', label: { ar: 'التسعير والعمولات', en: 'Pricing' }, icon: I(<Tags size={18} {...ICON} />), perm: 'pricing.view', el: () => <PricingPage /> },
      { id: 'zones', label: { ar: 'المدن والمناطق', en: 'Cities & zones' }, icon: I(<MapPinned size={18} {...ICON} />), perm: 'zones.view', el: () => <ZonesPage /> },
      { id: 'marketing', label: { ar: 'التسويق', en: 'Marketing' }, icon: I(<Megaphone size={18} {...ICON} />), perm: 'marketing.view', el: () => <MarketingPage /> },
      { id: 'reports', label: { ar: 'التقارير', en: 'Reports' }, icon: I(<BarChart3 size={18} {...ICON} />), perm: 'reports.view', el: () => <ReportsPage /> },
    ],
  },
  {
    label: { ar: 'الخدمة والنظام', en: 'Service & system' },
    pages: [
      { id: 'support', label: { ar: 'خدمة العملاء', en: 'Support' }, icon: I(<Headset size={18} {...ICON} />), perm: 'support.view', el: () => <SupportPage /> },
      { id: 'roles', label: { ar: 'المستخدمون والصلاحيات', en: 'Users & roles' }, icon: I(<ShieldCheck size={18} {...ICON} />), perm: 'settings.view', el: () => <RolesPage /> },
      { id: 'settings', label: { ar: 'الإعدادات', en: 'Settings' }, icon: I(<SettingsIcon size={18} {...ICON} />), perm: 'settings.view', el: () => <SettingsPage /> },
    ],
  },
]
const ALL_PAGES = GROUPS.flatMap((g) => g.pages)

export function AdminApp() {
  const { dir } = useI18n()
  const admins = useEco((s) => s.admins)
  const [adminId, setAdminId] = useState<string | undefined>(() => (getSession().adminVerified ? getSession().adminId : undefined))
  const admin = admins.find((a) => a.id === adminId && a.active)
  if (!admin)
    return (
      <AdminLogin
        onSuccess={(u) => {
          setSession({ adminId: u.id, adminVerified: true })
          setAdminId(u.id)
          if (!window.location.hash.startsWith('#/admin/')) go('/admin/overview')
        }}
      />
    )
  return (
    <Surface tone="light">
      <ToastHost>
        <AdminProvider admin={admin}>
          <div dir={dir} className="min-h-screen bg-road font-sans text-ink">
            <Shell
              admin={admin}
              onLogout={() => {
                clearSession(['adminId', 'adminVerified'])
                setAdminId(undefined)
              }}
            />
          </div>
        </AdminProvider>
      </ToastHost>
    </Surface>
  )
}

function Shell({ admin, onLogout }: { admin: AdminUser; onLogout: () => void }) {
  const { t, L, lang, setLang } = useI18n()
  const { can } = useAdmin()
  const parts = useHashRoute()
  const [mobileNav, setMobileNav] = useState(false)
  const pageId = parts[1] ?? 'overview'
  const page = ALL_PAGES.find((p) => p.id === pageId) ?? ALL_PAGES[0]
  const now = useNow(3000)
  const liveCount = useEco((s) => s.trips.filter((x) => isActive(x.status)).length)
  const simActive = useMemo(() => fleetSnapshot(now).filter((u) => u.tripId?.startsWith('SIM') && u.status !== 'available').length, [now])
  const pendingApps = useEco((s) => s.drivers.filter((d) => d.status === 'pending_review').length)
  const openTickets = useEco((s) => s.tickets.filter((x) => x.status === 'open').length)
  const badges: Record<string, number> = { trips: liveCount, drivers: pendingApps, support: openTickets }
  useEffect(() => setMobileNav(false), [pageId])
  useEffect(() => {
    document.title = `${L(page.label)} · AURA Admin`
  }, [page, L])

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <Wordmark tone="white" width={84} />
          <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.18em] text-white/55">ADMIN</span>
        </div>
        <button className="text-white/60 lg:hidden" aria-label={t('إغلاق', 'Close')} onClick={() => setMobileNav(false)}>
          <X size={20} />
        </button>
      </div>
      <div className="thin-scroll-dark flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => {
          const pages = g.pages.filter((p) => can(p.perm))
          if (!pages.length) return null
          return (
            <div key={g.label.en} className="mb-4">
              <p className="px-3 pb-1.5 text-[10.5px] font-semibold tracking-wider text-white/35 uppercase">{L(g.label)}</p>
              {pages.map((p) => {
                const on = p.id === page.id
                return (
                  <a
                    key={p.id}
                    href={`#/admin/${p.id}`}
                    aria-current={on ? 'page' : undefined}
                    className={cx('relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition', on ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}
                  >
                    {on && <span className="absolute start-0 top-2 bottom-2 w-[3px] rounded-full bg-go" />}
                    {p.icon}
                    <span className="flex-1">{L(p.label)}</span>
                    {!!badges[p.id] && <span className={cx('num rounded-md px-1.5 text-[11px] font-bold', p.id === 'trips' ? 'bg-go text-ink' : 'bg-white/12 text-white')}>{badges[p.id]}</span>}
                  </a>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={admin.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{admin.name}</p>
            <p className="truncate text-[11px] text-white/45">{L(ROLE_LABEL[admin.role])}</p>
          </div>
          <button aria-label={t('تسجيل الخروج', 'Log out')} title={t('تسجيل الخروج', 'Log out')} onClick={onLogout} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white">
            <LogOut size={17} className="rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-ink lg:block">{nav}</aside>
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-ink">{nav}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-road/85 px-4 backdrop-blur md:px-6">
          <button className="rounded-xl p-2 hover:bg-white lg:hidden" aria-label={t('القائمة', 'Menu')} onClick={() => setMobileNav(true)}>
            <Menu size={20} />
          </button>
          <GlobalSearch />
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold ring-1 ring-line sm:flex">
              <span className="size-2 animate-pulse rounded-full bg-go" />
              <span className="num">{liveCount + simActive}</span> {t('رحلة نشطة', 'active trips')}
            </span>
            <a href="#/admin/support" className="relative rounded-xl p-2 hover:bg-white" aria-label={t('التذاكر المفتوحة', 'Open tickets')}>
              <Bell size={19} {...ICON} />
              {openTickets > 0 && <span className="num absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white">{openTickets}</span>}
            </a>
            <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'ع' }, { value: 'en', label: 'EN' }]} />
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-4 md:p-6">{can(page.perm) ? page.el() : <Forbidden />}</main>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const { t, L } = useI18n()
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const { can } = useAdmin()
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    const out: { label: string; sub: string; href: string; kind: string }[] = []
    if (can('trips.view'))
      store
        .allTrips()
        .filter((x) => x.id.toLowerCase().includes(s))
        .slice(0, 4)
        .forEach((x) => out.push({ label: x.id, sub: `${L(x.pickup.name)} → ${L(x.dropoff.name)}`, href: `#/admin/trips?id=${x.id}`, kind: t('رحلة', 'Trip') }))
    if (can('drivers.view'))
      store.state.drivers
        .filter((d) => d.name.en.toLowerCase().includes(s) || d.name.ar.includes(q.trim()) || d.id.includes(s))
        .slice(0, 4)
        .forEach((d) => out.push({ label: L(d.name), sub: d.id, href: `#/admin/drivers?id=${d.id}`, kind: t('كابتن', 'Captain') }))
    if (can('customers.view'))
      store.state.customers
        .filter((c) => c.name.en.toLowerCase().includes(s) || c.name.ar.includes(q.trim()))
        .slice(0, 3)
        .forEach((c) => out.push({ label: L(c.name), sub: c.phone, href: '#/admin/customers', kind: t('عميل', 'Customer') }))
    return out
  }, [q, can, L, t])
  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute-2" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={t('ابحث برقم الرحلة أو اسم الكابتن أو العميل…', 'Search trip ID, captain or customer…')}
        aria-label={t('بحث شامل', 'Global search')}
        className="h-10 w-full rounded-xl bg-white ps-9 pe-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-ink"
      />
      {focus && results.length > 0 && (
        <div className="absolute inset-x-0 top-12 z-40 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-line">
          {results.map((r) => (
            <a key={r.href + r.label} href={r.href} onClick={() => setQ('')} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-road">
              <Badge tone="neutral">{r.kind}</Badge>
              <span className="min-w-0 flex-1">
                <span className="num block truncate font-semibold">{r.label}</span>
                <span className="block truncate text-xs text-mute">{r.sub}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

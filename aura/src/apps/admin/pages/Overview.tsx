import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Car, CircleCheck, CircleX, Clock, Coins, Receipt, Users, UserCheck, UserX, Wallet, Route } from 'lucide-react'
import { DemoBadge, Badge, Button, TripStatusBadge } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { fleetSnapshot, getCustomer, getDriver, useAllTrips, useEco, useNow } from '../../../core/store'
import { DAY, clock, int, sar, sarCompact, startOfDay } from '../../../core/format'
import { isActive } from '../../../core/trip'
import { classById } from '../../../core/pricing'
import { CHART, CLASS_COLORS, Kpi, PageHeader, Panel } from '../kit'
import { cityMix, classMix, dailySeries, growthSeries, summarize } from '../analytics'
import { go } from '../../../app/router'

const tooltipStyle = { background: '#101112', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12, padding: '8px 12px' }

export function OverviewPage() {
  const { t, L, lang } = useI18n()
  const now = useNow(2000)
  const all = useAllTrips()
  const drivers = useEco((s) => s.drivers)
  const customers = useEco((s) => s.customers)
  const live = useEco((s) => s.trips.filter((x) => isActive(x.status)))
  const fleet = useMemo(() => fleetSnapshot(now), [now])
  const today0 = startOfDay()
  const today = useMemo(() => summarize(all.filter((x) => x.createdAt >= today0)), [all, today0])
  const prev7 = useMemo(() => summarize(all.filter((x) => x.createdAt >= today0 - 7 * DAY && x.createdAt < today0)), [all, today0])
  const hourFrac = Math.max(0.15, (now - today0) / DAY)
  const tripDelta = prev7.total ? today.total / hourFrac / (prev7.total / 7) - 1 : 0
  const revDelta = prev7.gmv ? today.gmv / hourFrac / (prev7.gmv / 7) - 1 : 0
  const simActive = fleet.filter((u) => u.status !== 'available' && u.status !== 'offline' && u.tripId?.startsWith('SIM')).length
  const onlineCaptains = fleet.filter((u) => u.status !== 'offline').length + drivers.filter((d) => d.online && d.cityId !== 'riyadh').length
  const approved = drivers.filter((d) => d.status === 'approved').length
  const daily = useMemo(() => dailySeries(all, 30, lang), [all, lang])
  const custGrowth = useMemo(() => growthSeries(customers, 12, lang), [customers, lang])
  const capGrowth = useMemo(() => growthSeries(drivers, 12, lang), [drivers, lang])
  const mix = useMemo(() => classMix(all.filter((x) => x.createdAt >= today0 - 30 * DAY)), [all, today0])
  const cities = useMemo(() => cityMix(all.filter((x) => x.createdAt >= today0 - 30 * DAY), lang), [all, today0, lang])
  const monthToDate = useMemo(() => summarize(all.filter((x) => x.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime())), [all])

  return (
    <div>
      <PageHeader
        title={t('لوحة المعلومات', 'Dashboard overview')}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            {t('مؤشرات تشغيلية ومالية مباشرة', 'Live operational and financial indicators')} · <span className="num">{clock(now, lang)}</span> <DemoBadge />
          </span>
        }
        actions={
          <Button variant="secondary" size="sm" icon={<Activity size={15} />} onClick={() => go('/admin/live')}>
            {t('الخريطة المباشرة', 'Live map')}
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={t('إجمالي الرحلات اليوم', 'Trips today')} value={int(today.total + simActive)} delta={tripDelta} icon={<Route size={16} />} />
        <Kpi label={t('الرحلات النشطة الآن', 'Active now')} value={int(live.length + simActive)} live />
        <Kpi label={t('الرحلات المكتملة', 'Completed')} value={int(today.completed)} icon={<CircleCheck size={16} />} />
        <Kpi label={t('الرحلات الملغاة', 'Cancelled')} value={int(today.cancelled)} icon={<CircleX size={16} />} hint={`${(today.cancelRate * 100).toFixed(1)}%`} />
        <Kpi label={t('عدد العملاء', 'Customers')} value={int(customers.length)} icon={<Users size={16} />} />
        <Kpi label={t('عدد الكباتن', 'Captains')} value={int(approved)} icon={<Car size={16} />} />
        <Kpi label={t('الكباتن المتصلون', 'Captains online')} value={int(onlineCaptains)} live />
        <Kpi label={t('الكباتن غير المتصلين', 'Captains offline')} value={int(Math.max(0, approved - onlineCaptains))} icon={<UserX size={16} />} />
        <Kpi label={t('إجمالي الإيرادات', 'Gross revenue')} value={sarCompact(today.gmv)} unit="SAR" delta={revDelta} icon={<Coins size={16} />} />
        <Kpi label={t('إيرادات المنصة', 'Platform revenue')} value={sarCompact(today.commission)} unit="SAR" icon={<Wallet size={16} />} />
        <Kpi label={t('متوسط قيمة الرحلة', 'Avg trip value')} value={sar(today.avgValue)} unit="SAR" icon={<Receipt size={16} />} />
        <Kpi label={t('متوسط وقت وصول الكابتن', 'Avg captain ETA')} value={today.avgEta ? today.avgEta.toFixed(1) : '—'} unit={t('د', 'min')} icon={<Clock size={16} />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title={t('الرحلات حسب الأيام', 'Trips per day')} action={<span className="text-xs text-mute">{t('آخر ٣٠ يوماً', 'Last 30 days')}</span>}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={daily} margin={{ left: -18, right: 4, top: 6 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(16,17,18,.04)' }} />
                <Bar dataKey="completed" name={t('مكتملة', 'Completed')} stackId="a" fill={CHART.ink} radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelled" name={t('ملغاة', 'Cancelled')} stackId="a" fill={CHART.light} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[[CHART.ink, t('مكتملة', 'Completed')], [CHART.light, t('ملغاة', 'Cancelled')]]} />
        </Panel>
        <Panel title={t('توزيع فئات المركبات', 'Vehicle class mix')} action={<span className="text-xs text-mute">{t('٣٠ يوماً', '30 days')}</span>}>
          <div className="relative h-52" dir="ltr">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {mix.map((m) => (
                    <Cell key={m.id} fill={CLASS_COLORS[m.id]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-2xl font-semibold">{int(mix.reduce((a, b) => a + b.value, 0))}</span>
              <span className="text-[11px] text-mute">{t('رحلة', 'trips')}</span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[12.5px]">
            {mix.map((m) => (
              <span key={m.id} className="flex items-center gap-2" dir="ltr">
                <span className="size-2.5 rounded-sm" style={{ background: CLASS_COLORS[m.id] }} />
                {m.name}
                <span className="num ms-auto text-mute">{int(m.value)}</span>
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title={t('الإيرادات', 'Revenue')} action={<span className="text-xs text-mute">{t('الشهر الحالي:', 'Month to date:')} <span className="num font-semibold text-ink">{sarCompact(monthToDate.gmv)} SAR</span></span>}>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={daily} margin={{ left: -6, right: 4, top: 6 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(0)} SAR`} />
                <Area type="monotone" dataKey="driverSar" name={t('مستحقات الكباتن', 'Captain earnings')} stackId="1" stroke={CHART.ink} fill={CHART.ink} fillOpacity={0.85} />
                <Area type="monotone" dataKey="commissionSar" name={t('إيرادات المنصة', 'Platform revenue')} stackId="1" stroke={CHART.go} fill={CHART.go} fillOpacity={0.9} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[[CHART.ink, t('مستحقات الكباتن', 'Captain earnings')], [CHART.go, t('إيرادات المنصة', 'Platform revenue')]]} />
        </Panel>
        <Panel title={t('الرحلات حسب المدن', 'Trips by city')} action={<span className="text-xs text-mute">{t('٣٠ يوماً', '30 days')}</span>}>
          <div className="space-y-3">
            {cities.map((c) => {
              const max = cities[0].trips || 1
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2">
                      {c.name}
                      {c.status !== 'live' && <Badge tone="outline">{c.status === 'pilot' ? t('تجريبي', 'Pilot') : t('مخطط', 'Planned')}</Badge>}
                    </span>
                    <span className="num font-semibold">{int(c.trips)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-road">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(c.trips / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title={t('نمو العملاء', 'Customer growth')} action={<span className="text-xs text-mute">{t('١٢ شهراً', '12 months')}</span>}>
          <GrowthChart data={custGrowth} color={CHART.ink} />
        </Panel>
        <Panel title={t('نمو الكباتن', 'Captain growth')} action={<span className="text-xs text-mute">{t('١٢ شهراً', '12 months')}</span>}>
          <GrowthChart data={capGrowth} color={CHART.go} />
        </Panel>
        <Panel title={t('رحلات نشطة الآن', 'Active right now')} action={<button onClick={() => go('/admin/trips')} className="text-xs font-semibold underline">{t('الكل', 'All')}</button>}>
          {live.length === 0 ? (
            <p className="py-6 text-center text-sm text-mute">
              {t('لا توجد رحلات نشطة من التطبيقات الآن. اطلب رحلة من تطبيق العميل لتظهر هنا مباشرة.', 'No app trips active now. Request one in the Passenger app to see it here live.')}
              <br />
              <span className="num text-xs">+{simActive} {t('رحلة محاكاة على الخريطة', 'simulated on the map')}</span>
            </p>
          ) : (
            <div className="space-y-2">
              {live.slice(0, 5).map((x) => (
                <button key={x.id} onClick={() => go(`/admin/trips?id=${x.id}`)} className="flex w-full items-center gap-3 rounded-xl bg-road px-3 py-2.5 text-start">
                  <div className="min-w-0 flex-1">
                    <p className="num text-[12.5px] font-semibold">{x.id}</p>
                    <p className="truncate text-[12px] text-mute">
                      {L(getCustomer(x.passengerId)?.name)} → {L(x.dropoff.name)}
                    </p>
                    <p className="truncate text-[11px] text-mute-2">
                      {getDriver(x.driverId) ? L(getDriver(x.driverId)!.name) : t('بانتظار كابتن', 'Awaiting captain')} · <span dir="ltr">{classById(x.vehicleClass).name}</span>
                    </p>
                  </div>
                  <TripStatusBadge status={x.status} />
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-mute">
        <UserCheck size={14} /> {t('جميع الأرقام والرسوم البيانية في هذه اللوحة مبنية على بيانات تجريبية مولّدة ورحلات هذه الجلسة.', 'All numbers and charts are built from generated demo data plus trips from this session.')}
      </p>
    </div>
  )
}

function GrowthChart({ data, color }: { data: { label: string; total: number }[]; color: string }) {
  return (
    <div className="h-44" dir="ltr">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -22, right: 6, top: 6 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} interval={1} />
          <YAxis tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="total" stroke={color} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-mute">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  )
}

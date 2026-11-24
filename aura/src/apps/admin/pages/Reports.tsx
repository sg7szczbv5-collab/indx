import { useMemo, useState } from 'react'
import { ComposedChart, Bar, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileDown, Printer } from 'lucide-react'
import { Avatar, Badge, Button, DemoBadge } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { useAllTrips, useEco } from '../../../core/store'
import { DAY, int, pct, sar, sarCompact, startOfDay } from '../../../core/format'
import { Can, CHART, DataTable, downloadFile, FilterChips, Kpi, PageHeader, Panel } from '../kit'
import { cityMix, dailySeries, summarize, topDrivers } from '../analytics'
import { Legend } from './Overview'

type Period = 'daily' | 'weekly' | 'monthly'

export function ReportsPage() {
  const { t, L, lang } = useI18n()
  const all = useAllTrips()
  const drivers = useEco((s) => s.drivers)
  const [period, setPeriod] = useState<Period>('weekly')
  const days = { daily: 1, weekly: 7, monthly: 30 }[period]
  const from = startOfDay() - (days - 1) * DAY
  const prevFrom = from - days * DAY
  const cur = useMemo(() => all.filter((x) => x.createdAt >= from), [all, from])
  const prev = useMemo(() => all.filter((x) => x.createdAt >= prevFrom && x.createdAt < from), [all, prevFrom, from])
  const s = summarize(cur)
  const p = summarize(prev)
  const delta = (a: number, b: number) => (b ? a / b - 1 : 0)
  const series = useMemo(() => dailySeries(all, Math.max(7, days), lang), [all, days, lang])
  const cities = useMemo(() => cityMix(cur, lang), [cur, lang])
  const top = useMemo(() => topDrivers(cur, drivers, 10), [cur, drivers])
  const label = { daily: t('تقرير يومي', 'Daily report'), weekly: t('تقرير أسبوعي', 'Weekly report'), monthly: t('تقرير شهري', 'Monthly report') }[period]

  const exportAll = () => {
    const rows = [
      ['AURA report', label, new Date().toISOString().slice(0, 10)],
      [],
      ['Trips', s.total],
      ['Completed', s.completed],
      ['Cancelled', s.cancelled],
      ['Cancellation rate', (s.cancelRate * 100).toFixed(1) + '%'],
      ['Acceptance rate', (s.acceptRate * 100).toFixed(1) + '%'],
      ['Gross value SAR', sar(s.gmv)],
      ['Platform revenue SAR', sar(s.commission)],
      ['Avg trip value SAR', sar(s.avgValue)],
      [],
      ['City', 'Trips', 'Completed', 'Gross SAR', 'Commission SAR', 'Cancel rate'],
      ...cities.map((c) => [c.name, c.trips, c.completed, sar(c.gmv), sar(c.commission), (c.cancelRate * 100).toFixed(1) + '%']),
      [],
      ['Captain', 'Trips', 'Net SAR', 'Rating'],
      ...top.map((x) => [x.driver.name.en, x.trips, sar(x.net), x.driver.rating]),
    ]
    downloadFile(`aura-${period}-report.csv`, rows.map((r) => r.join(',')).join('\n'))
  }

  return (
    <div>
      <PageHeader
        title={t('التقارير والتحليلات', 'Analytics & reports')}
        sub={<span className="flex items-center gap-2">{label} · {t('مقارنة بالفترة السابقة', 'vs previous period')} <DemoBadge /></span>}
        actions={
          <>
            <FilterChips value={period} onChange={setPeriod} options={[{ value: 'daily', label: t('يومي', 'Daily') }, { value: 'weekly', label: t('أسبوعي', 'Weekly') }, { value: 'monthly', label: t('شهري', 'Monthly') }]} />
            <Can perm="reports.export">
              <Button size="sm" variant="secondary" icon={<Printer size={15} />} onClick={() => window.print()}>
                PDF
              </Button>
              <Button size="sm" icon={<FileDown size={15} />} onClick={exportAll}>
                {t('تصدير التقرير', 'Export report')}
              </Button>
            </Can>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={t('الإيرادات', 'Revenue')} value={sarCompact(s.gmv)} unit="SAR" delta={delta(s.gmv, p.gmv)} />
        <Kpi label={t('إيرادات المنصة', 'Platform revenue')} value={sarCompact(s.commission)} unit="SAR" delta={delta(s.commission, p.commission)} />
        <Kpi label={t('عدد الرحلات', 'Trips')} value={int(s.total)} delta={delta(s.total, p.total)} />
        <Kpi label={t('معدل الإلغاء', 'Cancellation rate')} value={pct(s.cancelRate, 1)} />
        <Kpi label={t('معدل قبول الرحلات', 'Acceptance rate')} value={pct(s.acceptRate, 1)} />
        <Kpi label={t('متوسط قيمة الرحلة', 'Avg trip value')} value={sar(s.avgValue)} unit="SAR" />
      </div>
      <Panel className="mt-4" title={t('الإيرادات وعدد الرحلات', 'Revenue and trips')}>
        <div className="h-72" dir="ltr">
          <ResponsiveContainer>
            <ComposedChart data={series} margin={{ left: -4, right: -4, top: 6 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} interval={series.length > 10 ? 3 : 0} />
              <YAxis yAxisId="l" tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10.5, fill: CHART.mid }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#101112', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
              <Bar yAxisId="l" dataKey="gmvSar" name={t('الإيرادات SAR', 'Revenue SAR')} fill={CHART.ink} radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" type="monotone" dataKey="completed" name={t('رحلات مكتملة', 'Completed trips')} stroke={CHART.go} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <Legend items={[[CHART.ink, t('الإيرادات', 'Revenue')], [CHART.go, t('رحلات مكتملة', 'Completed trips')]]} />
      </Panel>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <h2 className="mb-2 text-[14px] font-semibold">{t('أداء المدن', 'City performance')}</h2>
          <DataTable
            rows={cities}
            rowKey={(c) => c.id}
            pageSize={6}
            exportName={`aura-cities-${period}`}
            cols={[
              { key: 'n', header: t('المدينة', 'City'), cell: (c) => <span className="font-semibold">{c.name}</span>, csv: (c) => c.name },
              { key: 't', header: t('الرحلات', 'Trips'), cell: (c) => <span className="num">{int(c.trips)}</span>, sort: (c) => c.trips, csv: (c) => c.trips },
              { key: 'g', header: t('الإيرادات', 'Revenue'), cell: (c) => <span className="num" dir="ltr">{sarCompact(c.gmv)}</span>, sort: (c) => c.gmv, csv: (c) => sar(c.gmv) },
              { key: 'c', header: t('العمولة', 'Commission'), cell: (c) => <span className="num" dir="ltr">{sarCompact(c.commission)}</span>, csv: (c) => sar(c.commission) },
              { key: 'r', header: t('الإلغاء', 'Cancel %'), cell: (c) => <span className="num">{pct(c.cancelRate, 1)}</span>, sort: (c) => c.cancelRate, csv: (c) => c.cancelRate },
            ]}
          />
        </div>
        <div>
          <h2 className="mb-2 text-[14px] font-semibold">{t('أداء الكباتن', 'Captain performance')}</h2>
          <DataTable
            rows={top}
            rowKey={(x) => x.driver.id}
            pageSize={6}
            exportName={`aura-captains-${period}`}
            cols={[
              { key: 'n', header: t('الكابتن', 'Captain'), cell: (x) => <span className="flex items-center gap-2"><Avatar name={L(x.driver.name)} size={28} />{L(x.driver.name)}</span>, csv: (x) => x.driver.name.en },
              { key: 't', header: t('الرحلات', 'Trips'), cell: (x) => <span className="num">{x.trips}</span>, sort: (x) => x.trips, csv: (x) => x.trips },
              { key: 'e', header: t('الأرباح', 'Earned'), cell: (x) => <span className="num" dir="ltr">{sar(x.net, 0)}</span>, sort: (x) => x.net, csv: (x) => sar(x.net) },
              { key: 'r', header: t('التقييم', 'Rating'), cell: (x) => <span className="num">★ {x.driver.rating.toFixed(2)}</span>, csv: (x) => x.driver.rating },
              { key: 'a', header: t('القبول', 'Accept'), cell: (x) => <Badge tone={x.driver.acceptanceRate >= 0.85 ? 'live' : 'warn'}>{pct(x.driver.acceptanceRate)}</Badge>, csv: (x) => x.driver.acceptanceRate },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

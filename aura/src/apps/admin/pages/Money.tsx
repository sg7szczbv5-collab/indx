import { useMemo, useState } from 'react'
import { Calculator, FileSpreadsheet, History, Save, Send } from 'lucide-react'
import { Badge, Button, cx, DemoBadge, Field, Input, Money, Select, Switch, useToast } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { actions, getDriver, quoteTrip, useAllTrips, useEco } from '../../../core/store'
import { VEHICLE_CLASSES, type ClassTariff } from '../../../core/pricing'
import { CITIES, PLACES } from '../../../core/geo'
import { DAY, dateTime, sar, sarCompact, startOfDay } from '../../../core/format'
import type { CityId, VehicleClassId } from '../../../core/types'
import { Can, DataTable, downloadFile, FilterChips, Kpi, PageHeader, Panel, useAdmin, type Col } from '../kit'
import { summarize } from '../analytics'
import { PAYMENT_LABEL } from '../../passenger/Booking'
import { go } from '../../../app/router'

/* ============================== FINANCE ============================== */

type Range = 'today' | '7d' | '30d'
type Tx = { id: string; at: number; kind: 'payment' | 'refund' | 'payout'; ref: string; party: string; method: string; amount: number; commission: number; vat: number }

export function FinancePage() {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin } = useAdmin()
  const all = useAllTrips()
  const refunds = useEco((s) => s.refunds)
  const payouts = useEco((s) => s.payouts)
  const drivers = useEco((s) => s.drivers)
  const [range, setRange] = useState<Range>('7d')
  const [tab, setTab] = useState<'tx' | 'settle'>('tx')
  const from = { today: startOfDay(), '7d': startOfDay() - 6 * DAY, '30d': startOfDay() - 29 * DAY }[range]
  const trips = useMemo(() => all.filter((x) => x.createdAt >= from), [all, from])
  const s = summarize(trips)
  const done = trips.filter((x) => x.status === 'completed')
  const cash = done.filter((x) => x.paymentMethod === 'cash').reduce((a, x) => a + x.fare.total, 0)
  const rangeRefunds = refunds.filter((r) => r.at >= from)
  const refundTotal = rangeRefunds.reduce((a, r) => a + r.amount, 0)

  const tx: Tx[] = useMemo(
    () =>
      [
        ...done.map((x) => ({ id: `pay-${x.id}`, at: x.updatedAt, kind: 'payment' as const, ref: x.id, party: L(getDriver(x.driverId)?.name), method: L(PAYMENT_LABEL[x.paymentMethod]), amount: x.fare.total, commission: x.fare.commission, vat: x.fare.vat })),
        ...rangeRefunds.map((r) => ({ id: r.id, at: r.at, kind: 'refund' as const, ref: r.tripId, party: r.by, method: '—', amount: -r.amount, commission: 0, vat: 0 })),
        ...payouts.filter((p) => p.at >= from).map((p) => ({ id: p.id, at: p.at, kind: 'payout' as const, ref: p.reference, party: L(getDriver(p.driverId)?.name), method: t('تحويل بنكي', 'Bank transfer'), amount: -p.amount, commission: 0, vat: 0 })),
      ].sort((a, b) => b.at - a.at),
    [done, rangeRefunds, payouts, from, L, t],
  )

  /** Settlement: electronic trips owe the captain their net; cash trips mean the captain owes the platform its share. */
  const settlements = useMemo(() => {
    const weekFrom = startOfDay() - 6 * DAY
    return drivers
      .filter((d) => d.status === 'approved')
      .map((d) => {
        const mine = all.filter((x) => x.driverId === d.id && x.status === 'completed' && x.createdAt >= weekFrom)
        const owed = mine.filter((x) => x.paymentMethod !== 'cash').reduce((a, x) => a + x.fare.driverNet + (x.passengerRating?.tip ?? 0), 0)
        const owes = mine.filter((x) => x.paymentMethod === 'cash').reduce((a, x) => a + (x.fare.total - x.fare.driverNet), 0)
        const paid = payouts.filter((p) => p.driverId === d.id && p.at >= weekFrom).reduce((a, p) => a + p.amount, 0)
        return { d, trips: mine.length, owed, owes, paid, balance: owed - owes - paid }
      })
      .filter((x) => x.trips > 0)
      .sort((a, b) => b.balance - a.balance)
  }, [drivers, all, payouts])

  const txCols: Col<Tx>[] = [
    { key: 'at', header: t('التاريخ', 'Date'), cell: (r) => <span className="num whitespace-nowrap text-mute">{dateTime(r.at, lang)}</span>, sort: (r) => r.at, csv: (r) => new Date(r.at).toISOString() },
    { key: 'kind', header: t('النوع', 'Type'), cell: (r) => <Badge tone={r.kind === 'payment' ? 'live' : r.kind === 'refund' ? 'danger' : 'pending'}>{{ payment: t('دفعة رحلة', 'Trip payment'), refund: t('استرداد', 'Refund'), payout: t('تسوية كابتن', 'Captain payout') }[r.kind]}</Badge>, csv: (r) => r.kind },
    { key: 'ref', header: t('المرجع', 'Reference'), cell: (r) => <button className="num font-semibold hover:underline" onClick={(e) => { e.stopPropagation(); if (r.ref.startsWith('AUR')) go(`/admin/trips?id=${r.ref}`) }}>{r.ref}</button>, csv: (r) => r.ref },
    { key: 'party', header: t('الكابتن / المنفّذ', 'Captain / by'), cell: (r) => r.party || '—', csv: (r) => r.party },
    { key: 'method', header: t('الطريقة', 'Method'), cell: (r) => r.method, csv: (r) => r.method },
    { key: 'amount', header: t('المبلغ', 'Amount'), cell: (r) => <span className={cx('num font-semibold', r.amount < 0 && 'text-danger')} dir="ltr">{r.amount < 0 ? '−' : ''}{sar(Math.abs(r.amount))}</span>, sort: (r) => r.amount, csv: (r) => sar(r.amount) },
    { key: 'comm', header: t('العمولة', 'Commission'), cell: (r) => <span className="num text-mute" dir="ltr">{r.commission ? sar(r.commission) : '—'}</span>, csv: (r) => sar(r.commission) },
    { key: 'vat', header: t('الضريبة', 'VAT'), cell: (r) => <span className="num text-mute" dir="ltr">{r.vat ? sar(r.vat) : '—'}</span>, csv: (r) => sar(r.vat) },
  ]

  const exportReport = () => {
    const lines = [
      ['Metric', 'SAR'],
      ['Gross trip value (incl. VAT)', sar(s.gmv)],
      ['Trip subtotal', sar(s.subtotal)],
      ['Platform commission', sar(s.commission)],
      ['Captain earnings', sar(s.driverNet)],
      ['Tips', sar(s.tips)],
      ['Discounts (platform funded)', sar(s.discounts)],
      ['VAT collected', sar(s.vat)],
      ['Refunds', sar(refundTotal)],
      ['Cash collected by captains', sar(cash)],
    ]
    downloadFile(`aura-finance-${range}.csv`, lines.map((l) => l.join(',')).join('\n'))
  }

  return (
    <div>
      <PageHeader
        title={t('الإدارة المالية', 'Finance & payments')}
        sub={<span className="flex items-center gap-2">{t('القيم والعمولات والمستحقات والضرائب', 'Values, commissions, payouts and taxes')} <DemoBadge /></span>}
        actions={
          <>
            <FilterChips value={range} onChange={setRange} options={[{ value: 'today', label: t('اليوم', 'Today') }, { value: '7d', label: t('٧ أيام', '7 days') }, { value: '30d', label: t('٣٠ يوماً', '30 days') }]} />
            <Can perm="reports.export">
              <Button variant="secondary" size="sm" icon={<FileSpreadsheet size={15} />} onClick={exportReport}>
                {t('التقرير المالي', 'Financial report')}
              </Button>
            </Can>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t('إجمالي قيمة الرحلات', 'Gross trip value')} value={sarCompact(s.gmv)} unit="SAR" />
        <Kpi label={t('عمولات المنصة', 'Platform commission')} value={sarCompact(s.commission)} unit="SAR" />
        <Kpi label={t('مستحقات الكباتن', 'Captain earnings')} value={sarCompact(s.driverNet + s.tips)} unit="SAR" />
        <Kpi label={t('المدفوعات الإلكترونية', 'Electronic payments')} value={sarCompact(s.gmv - cash)} unit="SAR" />
        <Kpi label={t('المبالغ المستردة', 'Refunds')} value={sar(refundTotal, 0)} unit="SAR" />
        <Kpi label={t('الخصومات', 'Discounts')} value={sarCompact(s.discounts)} unit="SAR" />
        <Kpi label={t('ضريبة القيمة المضافة', 'VAT collected')} value={sarCompact(s.vat)} unit="SAR" />
        <Kpi label={t('نقد لدى الكباتن', 'Cash with captains')} value={sarCompact(cash)} unit="SAR" />
      </div>
      <div className="mt-5 mb-3">
        <FilterChips value={tab} onChange={setTab} options={[{ value: 'tx', label: t('سجل المعاملات', 'Transactions'), count: tx.length }, { value: 'settle', label: t('تسويات الكباتن', 'Captain settlements'), count: settlements.length }]} />
      </div>
      {tab === 'tx' ? (
        <DataTable rows={tx} cols={txCols} rowKey={(r) => r.id} exportName={`aura-transactions-${range}`} search={(r, q) => r.ref.toLowerCase().includes(q) || r.party.toLowerCase().includes(q)} initialSort={{ key: 'at', dir: -1 }} dense />
      ) : (
        <DataTable
          rows={settlements}
          rowKey={(r) => r.d.id}
          exportName="aura-settlements"
          search={(r, q) => r.d.name.en.toLowerCase().includes(q) || r.d.name.ar.includes(q) || r.d.id.includes(q)}
          cols={[
            { key: 'cap', header: t('الكابتن', 'Captain'), cell: (r) => <span className="font-semibold">{L(r.d.name)}</span>, csv: (r) => r.d.name.en },
            { key: 'trips', header: t('رحلات الأسبوع', 'Trips (7d)'), cell: (r) => <span className="num">{r.trips}</span>, sort: (r) => r.trips, csv: (r) => r.trips },
            { key: 'owed', header: t('مستحق للكابتن', 'Owed to captain'), cell: (r) => <span className="num" dir="ltr">{sar(r.owed)}</span>, csv: (r) => sar(r.owed) },
            { key: 'owes', header: t('مستحق للمنصة (نقد)', 'Owed to platform (cash)'), cell: (r) => <span className="num text-mute" dir="ltr">{sar(r.owes)}</span>, csv: (r) => sar(r.owes) },
            { key: 'paid', header: t('محوّل', 'Paid out'), cell: (r) => <span className="num text-mute" dir="ltr">{sar(r.paid)}</span>, csv: (r) => sar(r.paid) },
            { key: 'bal', header: t('الرصيد', 'Balance'), cell: (r) => <span className={cx('num font-semibold', r.balance < 0 && 'text-danger')} dir="ltr">{sar(r.balance)}</span>, sort: (r) => r.balance, csv: (r) => sar(r.balance) },
            {
              key: 'act',
              header: '',
              cell: (r) =>
                r.balance > 0 ? (
                  <Can perm="finance.settle">
                    <Button size="sm" variant="secondary" icon={<Send size={14} />} onClick={(e) => { e.stopPropagation(); actions.settleDriver(r.d.id, r.balance, admin); toast(t('تم إنشاء أمر التحويل', 'Payout created')) }}>
                      {t('تسوية', 'Settle')}
                    </Button>
                  </Can>
                ) : (
                  <span className="text-xs text-mute">{r.balance < 0 ? t('مطالبة', 'Collect') : t('مسدد', 'Settled')}</span>
                ),
            },
          ]}
        />
      )}
      <p className="mt-3 text-xs text-mute">{t('التحويلات الفعلية تتطلب ربط بنك/بوابة دفع مرخّصة. الأوامر هنا تُسجَّل فقط.', 'Real transfers require a licensed bank/gateway integration. Orders here are recorded only.')}</p>
    </div>
  )
}

/* ============================== PRICING ============================== */

export function PricingPage() {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const pricing = useEco((s) => s.pricing)
  const audit = useEco((s) => s.audit.filter((a) => a.action.startsWith('pricing') || a.action.startsWith('tax') || a.action.startsWith('promo')))
  const promos = useEco((s) => s.promos)
  const [city, setCity] = useState<CityId>('riyadh')
  const [draft, setDraft] = useState<Record<string, Partial<ClassTariff>>>({})
  const [vat, setVat] = useState(String(Math.round(pricing.vatRate * 100)))
  const [sim, setSim] = useState({ a: 'kingdom', b: 'ruh', c: 'comfort' as VehicleClassId })
  const editable = can('pricing.edit')
  const dirty = Object.keys(draft).length > 0
  const val = (cls: VehicleClassId, k: keyof ClassTariff) => draft[cls]?.[k] ?? pricing.cities[city][cls][k]
  const setVal = (cls: VehicleClassId, k: keyof ClassTariff, v: number) => setDraft((d) => ({ ...d, [cls]: { ...d[cls], [k]: v } }))
  const save = () => {
    for (const [cls, patch] of Object.entries(draft)) actions.updateTariff(city, cls as VehicleClassId, patch, admin)
    setDraft({})
    toast(t('تم حفظ التسعير وتسجيل التغيير', 'Pricing saved and change logged'))
  }
  const fields: { k: keyof ClassTariff; label: string; money: boolean }[] = [
    { k: 'base', label: t('رسوم فتح الرحلة', 'Base fare'), money: true },
    { k: 'perKm', label: t('سعر الكيلومتر', 'Per km'), money: true },
    { k: 'perMin', label: t('سعر الدقيقة', 'Per minute'), money: true },
    { k: 'minFare', label: t('الحد الأدنى', 'Minimum fare'), money: true },
    { k: 'commissionRate', label: t('العمولة %', 'Commission %'), money: false },
  ]
  const pa = PLACES.find((p) => p.id === sim.a)!
  const pb = PLACES.find((p) => p.id === sim.b)!
  const q = quoteTrip(pa, pb, sim.c)

  return (
    <div>
      <PageHeader
        title={t('التسعير والعمولات', 'Pricing & commission')}
        sub={<span className="flex items-center gap-2">{t('تعريفات حسب المدينة والفئة، مع سجل تغييرات وصلاحيات', 'Tariffs by city and class, with change log and permissions')} <DemoBadge /></span>}
        actions={
          <>
            <Select value={city} onChange={(v) => { setCity(v as CityId); setDraft({}) }} options={CITIES.map((c) => ({ value: c.id, label: L(c.name) }))} />
            <Can perm="pricing.edit">
              <Button size="sm" icon={<Save size={15} />} disabled={!dirty} onClick={save}>
                {t('حفظ التغييرات', 'Save changes')}
              </Button>
            </Can>
          </>
        }
      />
      {!editable && <p className="mb-3 rounded-xl bg-warn-soft px-4 py-2.5 text-sm text-warn">{t('عرض فقط: دورك لا يسمح بتعديل التسعير.', 'Read-only: your role cannot edit pricing.')}</p>}
      <div className="thin-scroll overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-[12px] text-mute">
              <th className="px-4 py-3 text-start font-medium">{t('الفئة', 'Class')}</th>
              {fields.map((f) => (
                <th key={f.k} className="px-3 py-3 text-start font-medium">
                  {f.label} {f.money && <span className="num opacity-60">(SAR)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VEHICLE_CLASSES.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
                  {c.name}
                </td>
                {fields.map((f) => {
                  const raw = val(c.id, f.k)
                  const shown = f.money ? (raw / 100).toFixed(2) : String(Math.round(raw * 100))
                  const changed = draft[c.id]?.[f.k] !== undefined
                  return (
                    <td key={f.k} className="px-3 py-2">
                      <input
                        aria-label={`${c.name} ${f.label}`}
                        disabled={!editable}
                        dir="ltr"
                        defaultValue={shown}
                        key={`${city}-${c.id}-${f.k}-${pricing.cities[city][c.id][f.k]}`}
                        onBlur={(e) => {
                          const n = Number(e.target.value)
                          if (!Number.isFinite(n) || n < 0) return
                          const v = f.money ? Math.round(n * 100) : Math.min(0.5, n / 100)
                          if (v !== pricing.cities[city][c.id][f.k]) setVal(c.id, f.k, v)
                        }}
                        className={cx('num h-10 w-24 rounded-lg px-2.5 outline-none focus:ring-2 focus:ring-ink disabled:bg-transparent', changed ? 'bg-go-soft ring-1 ring-go' : 'bg-road')}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title={<span className="flex items-center gap-2"><Calculator size={16} /> {t('محاكي السعر', 'Fare simulator')}</span>}>
          <div className="space-y-2">
            <Select className="w-full" value={sim.a} onChange={(v) => setSim({ ...sim, a: v })} options={PLACES.map((p) => ({ value: p.id, label: `${t('من', 'From')}: ${L(p.name)}` }))} />
            <Select className="w-full" value={sim.b} onChange={(v) => setSim({ ...sim, b: v })} options={PLACES.map((p) => ({ value: p.id, label: `${t('إلى', 'To')}: ${L(p.name)}` }))} />
            <Select className="w-full" value={sim.c} onChange={(v) => setSim({ ...sim, c: v as VehicleClassId })} options={VEHICLE_CLASSES.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="mt-3 rounded-xl bg-ink p-4 text-white">
            <p className="num text-xs text-white/55">
              {q.distanceKm} km · {q.durationMin} min {q.surgeMultiplier > 1 && `· ×${q.surgeMultiplier}`}
            </p>
            <Money h={q.total} size="lg" />
            <p className="num mt-2 text-xs text-white/60">
              {t('عمولة', 'Commission')} {sar(q.commission)} · {t('للكابتن', 'Captain')} {sar(q.driverNet)} · VAT {sar(q.vat)}
            </p>
          </div>
          <p className="mt-2 text-[11.5px] text-mute">{t('يستخدم التسعير المحفوظ للرياض ومناطق الطلب المرتفع.', 'Uses saved Riyadh pricing and active surge zones.')}</p>
        </Panel>
        <Panel title={t('الضرائب والعروض', 'Tax & promotions')}>
          <Field label={t('ضريبة القيمة المضافة %', 'VAT %')}>
            <div className="flex gap-2">
              <Input dir="ltr" className="num" disabled={!editable} value={vat} onChange={(e) => setVat(e.target.value.replace(/[^\d.]/g, ''))} />
              <Can perm="pricing.edit">
                <Button variant="secondary" disabled={Number(vat) / 100 === pricing.vatRate || !(Number(vat) >= 0 && Number(vat) <= 30)} onClick={() => { actions.setVat(Number(vat) / 100, admin); toast(t('تم تحديث الضريبة', 'VAT updated')) }}>
                  {t('حفظ', 'Save')}
                </Button>
              </Can>
            </div>
          </Field>
          <div className="mt-4 space-y-2">
            {promos.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-road px-3 py-2">
                <span>
                  <span className="num text-sm font-semibold">{p.code}</span>
                  <span className="block text-xs text-mute">{L(p.title)}</span>
                </span>
                <Switch checked={p.active} disabled={!can('marketing.edit') && !editable} onChange={(v) => actions.upsertPromo({ ...p, active: v }, admin)} label={p.code} />
              </div>
            ))}
            <button onClick={() => go('/admin/marketing')} className="text-xs font-semibold underline">
              {t('إدارة كل العروض', 'Manage all promotions')}
            </button>
          </div>
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><History size={16} /> {t('سجل التغييرات', 'Change history')}</span>}>
          <div className="thin-scroll max-h-80 space-y-3 overflow-y-auto">
            {audit.length === 0 && <p className="text-sm text-mute">{t('لا توجد تغييرات', 'No changes yet')}</p>}
            {audit.map((a) => (
              <div key={a.id} className="border-b border-line pb-2.5 text-sm last:border-0">
                <p className="font-semibold">
                  {a.action} · <span className="font-normal">{a.target}</span>
                </p>
                {a.detail && <p className="num text-xs text-mute" dir="ltr">{a.detail}</p>}
                <p className="num mt-0.5 text-[11px] text-mute-2">
                  {a.actor} · {dateTime(a.at, lang)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}


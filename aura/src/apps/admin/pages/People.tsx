import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, Pencil } from 'lucide-react'
import { Avatar, Badge, Button, DemoBadge, Field, Input, Select, TripStatusBadge, useToast } from '../../../ds/ui'
import { CarArt, Plate } from '../../../ds/vehicle'
import { useI18n } from '../../../i18n/I18n'
import { actions, getDriver, useAllTrips, useEco } from '../../../core/store'
import { classById, VEHICLE_CLASSES } from '../../../core/pricing'
import { cityById } from '../../../core/geo'
import { dateTime, day, int, sar } from '../../../core/format'
import type { Customer, Vehicle, VehicleClassId } from '../../../core/types'
import { Can, DataTable, Drawer, FilterChips, KV, PageHeader, Panel, useAdmin, type Col } from '../kit'
import { customerStats } from '../analytics'
import { go } from '../../../app/router'

/* ============================== CUSTOMERS ============================== */

export function CustomersPage() {
  const { t, L, lang } = useI18n()
  const customers = useEco((s) => s.customers)
  const trips = useAllTrips()
  const [f, setF] = useState<'all' | 'active' | 'blocked' | 'gold'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const stats = useMemo(() => new Map(customers.map((c) => [c.id, customerStats(c, trips)])), [customers, trips])
  const rows = customers.filter((c) => (f === 'all' ? true : f === 'gold' ? c.tier === 'gold' : c.status === f))
  const cols: Col<Customer>[] = [
    {
      key: 'name',
      header: t('العميل', 'Customer'),
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={L(c.name)} size={32} />
          <span>
            <span className="block font-semibold">{L(c.name)}</span>
            <span className="num block text-xs text-mute">{c.id}</span>
          </span>
        </span>
      ),
      sort: (c) => L(c.name),
      csv: (c) => c.name.en,
    },
    { key: 'phone', header: t('الجوال', 'Mobile'), cell: (c) => <span className="num whitespace-nowrap" dir="ltr">{c.phone}</span>, csv: (c) => c.phone },
    { key: 'city', header: t('المدينة', 'City'), cell: (c) => L(cityById(c.cityId).name), csv: (c) => c.cityId },
    { key: 'trips', header: t('الرحلات', 'Trips'), cell: (c) => <span className="num">{stats.get(c.id)?.completed ?? 0}</span>, sort: (c) => stats.get(c.id)?.completed ?? 0, csv: (c) => stats.get(c.id)?.completed ?? 0 },
    { key: 'spend', header: t('إجمالي الإنفاق', 'Total spend'), cell: (c) => <span className="num" dir="ltr">{sar(stats.get(c.id)?.spend ?? 0, 0)}</span>, sort: (c) => stats.get(c.id)?.spend ?? 0, csv: (c) => sar(stats.get(c.id)?.spend ?? 0) },
    { key: 'rating', header: t('التقييم', 'Rating'), cell: (c) => <span className="num">★ {c.rating.toFixed(2)}</span>, sort: (c) => c.rating, csv: (c) => c.rating },
    { key: 'tier', header: t('المستوى', 'Tier'), cell: (c) => (c.tier === 'gold' ? <Badge tone="done">Gold</Badge> : <Badge tone="outline">Standard</Badge>), csv: (c) => c.tier },
    { key: 'joined', header: t('الانضمام', 'Joined'), cell: (c) => <span className="num text-mute">{day(c.joinedAt, lang)}</span>, sort: (c) => c.joinedAt, csv: (c) => new Date(c.joinedAt).toISOString() },
    { key: 'status', header: t('الحالة', 'Status'), cell: (c) => (c.status === 'active' ? <Badge tone="live">{t('نشط', 'Active')}</Badge> : <Badge tone="danger">{t('محظور', 'Blocked')}</Badge>), csv: (c) => c.status },
  ]
  return (
    <div>
      <PageHeader title={t('إدارة العملاء', 'Customer management')} sub={<span className="flex items-center gap-2">{t('الحسابات والرحلات والإنفاق والشكاوى', 'Accounts, trips, spend and complaints')} <DemoBadge /></span>} />
      <DataTable
        rows={rows}
        cols={cols}
        rowKey={(c) => c.id}
        onRow={(c) => setOpen(c.id)}
        exportName="aura-customers"
        search={(c, q) => c.id.includes(q) || c.name.en.toLowerCase().includes(q) || c.name.ar.includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))}
        searchPlaceholder={t('الاسم أو الجوال', 'Name or mobile')}
        filters={
          <FilterChips
            value={f}
            onChange={setF}
            options={[
              { value: 'all', label: t('الكل', 'All'), count: customers.length },
              { value: 'active', label: t('نشط', 'Active'), count: customers.filter((c) => c.status === 'active').length },
              { value: 'blocked', label: t('محظور', 'Blocked'), count: customers.filter((c) => c.status === 'blocked').length },
              { value: 'gold', label: 'Gold', count: customers.filter((c) => c.tier === 'gold').length },
            ]}
          />
        }
      />
      <CustomerDrawer customer={customers.find((c) => c.id === open)} onClose={() => setOpen(null)} />
    </div>
  )
}

function CustomerDrawer({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin } = useAdmin()
  const trips = useAllTrips()
  const tickets = useEco((s) => s.tickets.filter((x) => x.requester.kind === 'customer' && x.requester.id === customer?.id))
  const [blocking, setBlocking] = useState(false)
  const [reason, setReason] = useState('')
  const mine = useMemo(() => (customer ? trips.filter((x) => x.passengerId === customer.id) : []), [trips, customer])
  const s = customer ? customerStats(customer, trips) : undefined
  const given = mine.filter((x) => x.driverRating)
  return (
    <Drawer
      open={!!customer}
      onClose={() => { setBlocking(false); onClose() }}
      width={560}
      title={customer && L(customer.name)}
      footer={
        customer && (
          <Can perm="customers.block">
            {customer.status === 'active' ? (
              <Button variant="danger" size="sm" icon={<Ban size={15} />} onClick={() => setBlocking(true)}>
                {t('حظر الحساب', 'Block account')}
              </Button>
            ) : (
              <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={() => { actions.setCustomerStatus(customer.id, 'active', admin); toast(t('تم تفعيل الحساب', 'Account activated')) }}>
                {t('تفعيل الحساب', 'Activate account')}
              </Button>
            )}
          </Can>
        )
      }
    >
      {customer && s && (
        <div className="space-y-5">
          {blocking && (
            <div className="rounded-2xl bg-danger-soft p-4">
              <Field label={t('سبب الحظر', 'Reason')}>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <Button variant="danger" size="sm" className="mt-3" disabled={reason.trim().length < 4} onClick={() => { actions.setCustomerStatus(customer.id, 'blocked', admin, reason); setBlocking(false); toast(t('تم حظر الحساب', 'Account blocked'), 'info') }}>
                {t('تأكيد الحظر', 'Confirm block')}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Avatar name={L(customer.name)} size={60} />
            <div>
              <p className="num text-sm text-mute">{customer.id}</p>
              <div className="mt-1 flex gap-2">
                {customer.status === 'active' ? <Badge tone="live">{t('نشط', 'Active')}</Badge> : <Badge tone="danger">{t('محظور', 'Blocked')}</Badge>}
                {customer.tier === 'gold' && <Badge tone="done">Gold</Badge>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [int(s.completed), t('رحلة مكتملة', 'Completed')],
              [sar(s.spend, 0), t('الإنفاق (SAR)', 'Spend (SAR)')],
              [int(s.cancelled), t('ملغاة', 'Cancelled')],
            ].map(([v, k]) => (
              <div key={k} className="rounded-xl bg-road py-3">
                <p className="num font-semibold">{v}</p>
                <p className="text-[11px] text-mute">{k}</p>
              </div>
            ))}
          </div>
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-mute">{t('بيانات الحساب', 'Account')}</h3>
            <KV k={t('الجوال', 'Mobile')} v={<span className="num" dir="ltr">{customer.phone}</span>} />
            <KV k={t('البريد', 'Email')} v={<span dir="ltr">{customer.email ?? '—'}</span>} />
            <KV k={t('المدينة', 'City')} v={L(cityById(customer.cityId).name)} />
            <KV k={t('رصيد المحفظة', 'Wallet')} v={<span className="num">{sar(customer.walletBalance)} SAR</span>} />
            <KV k={t('تقييم الكباتن له', 'Rating from captains')} v={<span className="num">★ {customer.rating.toFixed(2)} {given.length ? `(${given.length} ${t('جديد', 'new')})` : ''}</span>} />
            {customer.blockReason && <KV k={t('سبب الحظر', 'Block reason')} v={customer.blockReason} />}
          </section>
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-mute">
              {t('الشكاوى والتذاكر', 'Complaints & tickets')} <span className="num">({tickets.length})</span>
            </h3>
            {tickets.length === 0 && <p className="text-sm text-mute">{t('لا توجد', 'None')}</p>}
            {tickets.map((x) => (
              <button key={x.id} onClick={() => go(`/admin/support?id=${x.id}`)} className="mb-1.5 flex w-full items-center justify-between rounded-xl bg-road px-3 py-2 text-start text-sm">
                <span className="truncate">{x.subject}</span>
                <Badge tone={x.status === 'resolved' ? 'done' : 'warn'}>{x.status}</Badge>
              </button>
            ))}
          </section>
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-mute">{t('سجل الرحلات', 'Trip history')}</h3>
            {mine.slice(0, 10).map((x) => (
              <button key={x.id} onClick={() => go(`/admin/trips?id=${x.id}`)} className="flex w-full items-center gap-3 border-b border-line py-2.5 text-start text-sm last:border-0">
                <span className="num w-28 shrink-0 text-xs text-mute">{dateTime(x.createdAt, lang)}</span>
                <span className="min-w-0 flex-1 truncate">{L(x.dropoff.name)}</span>
                <TripStatusBadge status={x.status} />
              </button>
            ))}
            {mine.length === 0 && <p className="text-sm text-mute">{t('لا توجد رحلات', 'No trips')}</p>}
          </section>
        </div>
      )}
    </Drawer>
  )
}

/* ============================== VEHICLES ============================== */

export function VehiclesPage() {
  const { t, L } = useI18n()
  const vehicles = useEco((s) => s.vehicles)
  const [cls, setCls] = useState<'all' | VehicleClassId>('all')
  const [open, setOpen] = useState<string | null>(null)
  const rows = vehicles.filter((v) => cls === 'all' || v.classId === cls)
  const cols: Col<Vehicle>[] = [
    { key: 'plate', header: t('اللوحة', 'Plate'), cell: (v) => <Plate digits={v.plate.digits} lettersAr={v.plate.lettersAr} lettersEn={v.plate.lettersEn} size="sm" />, csv: (v) => `${v.plate.digits} ${v.plate.lettersEn}` },
    { key: 'model', header: t('الموديل', 'Model'), cell: (v) => <span className="font-semibold">{v.make} {v.model}</span>, sort: (v) => `${v.make} ${v.model}`, csv: (v) => `${v.make} ${v.model}` },
    { key: 'year', header: t('سنة الصنع', 'Year'), cell: (v) => <span className="num">{v.year}</span>, sort: (v) => v.year, csv: (v) => v.year },
    { key: 'color', header: t('اللون', 'Colour'), cell: (v) => <span className="flex items-center gap-2"><span className="size-3 rounded-full ring-1 ring-line-2" style={{ background: v.colorHex }} />{L(v.color)}</span>, csv: (v) => v.color.en },
    { key: 'class', header: t('الفئة', 'Class'), cell: (v) => <span dir="ltr">{classById(v.classId).name}</span>, sort: (v) => v.classId, csv: (v) => v.classId },
    { key: 'driver', header: t('الكابتن', 'Captain'), cell: (v) => (v.driverId ? L(getDriver(v.driverId)?.name) : <span className="text-mute-2">{t('غير مرتبطة', 'Unassigned')}</span>), csv: (v) => getDriver(v.driverId)?.name.en ?? '' },
    { key: 'status', header: t('الحالة', 'Status'), cell: (v) => <Badge tone={v.status === 'active' ? 'live' : v.status === 'inspection_due' ? 'warn' : 'outline'}>{v.status === 'active' ? t('نشطة', 'Active') : v.status === 'inspection_due' ? t('فحص مستحق', 'Inspection due') : t('غير نشطة', 'Inactive')}</Badge>, csv: (v) => v.status },
  ]
  return (
    <div>
      <PageHeader title={t('إدارة المركبات', 'Vehicle management')} sub={<span className="flex items-center gap-2">{t('فئات أورا والمركبات وربطها بالكباتن', 'AURA classes, vehicles and captain assignment')} <DemoBadge /></span>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {VEHICLE_CLASSES.map((c) => (
          <Panel key={c.id} pad={false}>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-display font-semibold" dir="ltr">{c.name}</p>
                <p className="text-xs text-mute">
                  {L(c.tagline)} · {c.seats} {t('مقاعد', 'seats')}
                </p>
                <p className="num mt-2 text-xl font-semibold">{vehicles.filter((v) => v.classId === c.id).length}</p>
                <p className="text-[11px] text-mute">{t('مركبة', 'vehicles')}</p>
              </div>
              <CarArt classId={c.id} width={110} color={c.id === 'black' ? '#141516' : '#F5F5F3'} />
            </div>
            <p className="border-t border-line px-4 py-2 text-[11.5px] text-mute">{c.examples}</p>
          </Panel>
        ))}
      </div>
      <DataTable
        rows={rows}
        cols={cols}
        rowKey={(v) => v.id}
        onRow={(v) => setOpen(v.id)}
        exportName="aura-vehicles"
        search={(v, q) => `${v.make} ${v.model} ${v.plate.digits} ${v.plate.lettersEn}`.toLowerCase().includes(q)}
        searchPlaceholder={t('الموديل أو اللوحة', 'Model or plate')}
        filters={<FilterChips value={cls} onChange={setCls} options={[{ value: 'all', label: t('الكل', 'All'), count: vehicles.length }, ...VEHICLE_CLASSES.map((c) => ({ value: c.id, label: c.name, count: vehicles.filter((v) => v.classId === c.id).length }))]} />}
      />
      <VehicleDrawer vehicle={vehicles.find((v) => v.id === open)} onClose={() => setOpen(null)} />
    </div>
  )
}

function VehicleDrawer({ vehicle, onClose }: { vehicle?: Vehicle; onClose: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const drivers = useEco((s) => s.drivers)
  const [draft, setDraft] = useState<Partial<Vehicle>>({})
  const v = vehicle ? { ...vehicle, ...draft } : undefined
  const editable = can('vehicles.edit')
  return (
    <Drawer
      open={!!vehicle}
      onClose={() => { setDraft({}); onClose() }}
      title={vehicle && `${vehicle.make} ${vehicle.model}`}
      footer={
        <Can perm="vehicles.edit">
          <Button size="sm" icon={<Pencil size={15} />} disabled={!Object.keys(draft).length} onClick={() => { actions.updateVehicle(vehicle!.id, draft, admin); setDraft({}); toast(t('تم حفظ المركبة', 'Vehicle saved')) }}>
            {t('حفظ التغييرات', 'Save changes')}
          </Button>
        </Can>
      }
    >
      {v && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-road py-5">
            <CarArt classId={v.classId} color={v.colorHex} width={220} />
            <Plate digits={v.plate.digits} lettersAr={v.plate.lettersAr} lettersEn={v.plate.lettersEn} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('الفئة', 'Class')}>
              <Select className="h-11 w-full" value={v.classId} onChange={(x) => editable && setDraft({ ...draft, classId: x as VehicleClassId })} options={VEHICLE_CLASSES.map((c) => ({ value: c.id, label: c.name }))} />
            </Field>
            <Field label={t('الحالة', 'Status')}>
              <Select className="h-11 w-full" value={v.status} onChange={(x) => editable && setDraft({ ...draft, status: x as Vehicle['status'] })} options={[{ value: 'active', label: t('نشطة', 'Active') }, { value: 'inspection_due', label: t('فحص مستحق', 'Inspection due') }, { value: 'inactive', label: t('غير نشطة', 'Inactive') }]} />
            </Field>
            <Field label={t('سنة الصنع', 'Year')}>
              <Input dir="ltr" className="num" disabled={!editable} value={String(v.year)} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) })} />
            </Field>
            <Field label={t('اللون', 'Colour')}>
              <Input disabled value={L(v.color)} />
            </Field>
          </div>
          <Field label={t('ربط المركبة بالكابتن', 'Assign to captain')}>
            <Select
              className="h-11 w-full"
              value={v.driverId ?? ''}
              onChange={(x) => editable && setDraft({ ...draft, driverId: x })}
              options={[{ value: '', label: t('— غير مرتبطة —', '— Unassigned —') }, ...drivers.map((d) => ({ value: d.id, label: `${L(d.name)} · ${d.id}` }))]}
            />
          </Field>
          {!editable && <p className="text-xs text-mute">{t('عرض فقط: لا تملك صلاحية تعديل المركبات.', 'Read-only: you cannot edit vehicles.')}</p>}
        </div>
      )}
    </Drawer>
  )
}

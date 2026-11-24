import { useEffect, useMemo, useState } from 'react'
import { Check, FileText, Plus, ShieldOff, ShieldCheck, UserPlus, X } from 'lucide-react'
import { Avatar, Badge, Button, DemoBadge, Field, Input, Select, useToast } from '../../../ds/ui'
import { CarArt, Plate } from '../../../ds/vehicle'
import { useI18n } from '../../../i18n/I18n'
import { actions, getVehicle, useAllTrips, useEco } from '../../../core/store'
import { classById, VEHICLE_CLASSES } from '../../../core/pricing'
import { CITIES, cityById } from '../../../core/geo'
import { day, int, sar } from '../../../core/format'
import type { CityId, Driver, DriverDoc, VehicleClassId } from '../../../core/types'
import { Can, DataTable, Drawer, FilterChips, KV, PageHeader, useAdmin, type Col } from '../kit'
import { driverStats } from '../analytics'
import { hashQuery } from '../../../app/router'

export const DRIVER_STATUS: Record<Driver['status'], { ar: string; en: string; tone: 'live' | 'pending' | 'danger' | 'outline' | 'warn' }> = {
  approved: { ar: 'مفعّل', en: 'Active', tone: 'live' },
  pending_review: { ar: 'قيد المراجعة', en: 'Pending review', tone: 'warn' },
  incomplete: { ar: 'غير مكتمل', en: 'Incomplete', tone: 'outline' },
  rejected: { ar: 'مرفوض', en: 'Rejected', tone: 'danger' },
  suspended: { ar: 'موقوف', en: 'Suspended', tone: 'danger' },
}

export function DriversPage() {
  const { t, L } = useI18n()
  const drivers = useEco((s) => s.drivers)
  const trips = useAllTrips()
  const [tab, setTab] = useState<'all' | 'applications' | 'online' | 'suspended'>('all')
  const [openId, setOpenId] = useState<string | null>(() => hashQuery().id ?? null)
  const [adding, setAdding] = useState(false)
  useEffect(() => {
    const on = () => setOpenId(hashQuery().id ?? null)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const stats = useMemo(() => new Map(drivers.map((d) => [d.id, driverStats(d.id, trips)])), [drivers, trips])
  const rows = drivers.filter((d) => (tab === 'all' ? true : tab === 'applications' ? d.status === 'pending_review' || d.status === 'incomplete' : tab === 'online' ? d.online : d.status === 'suspended' || d.status === 'rejected'))
  const pending = drivers.filter((d) => d.status === 'pending_review').length

  const cols: Col<Driver>[] = [
    {
      key: 'name',
      header: t('الكابتن', 'Captain'),
      cell: (d) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={L(d.name)} size={34} />
          <span>
            <span className="block font-semibold">{L(d.name)}</span>
            <span className="num block text-xs text-mute">{d.id}</span>
          </span>
        </span>
      ),
      sort: (d) => L(d.name),
      csv: (d) => d.name.en,
    },
    { key: 'phone', header: t('الجوال', 'Mobile'), cell: (d) => <span className="num whitespace-nowrap" dir="ltr">{d.phone}</span>, csv: (d) => d.phone },
    { key: 'city', header: t('المدينة', 'City'), cell: (d) => L(cityById(d.cityId).name), csv: (d) => d.cityId },
    {
      key: 'veh',
      header: t('المركبة', 'Vehicle'),
      cell: (d) => {
        const v = getVehicle(d.vehicleId)
        return v ? (
          <span className="whitespace-nowrap text-mute">
            {v.make} {v.model} · <span dir="ltr">{classById(v.classId).name}</span>
          </span>
        ) : (
          '—'
        )
      },
      csv: (d) => `${getVehicle(d.vehicleId)?.make ?? ''} ${getVehicle(d.vehicleId)?.model ?? ''}`,
    },
    { key: 'rating', header: t('التقييم', 'Rating'), cell: (d) => <span className="num">★ {d.rating.toFixed(2)}</span>, sort: (d) => d.rating, csv: (d) => d.rating },
    { key: 'trips', header: t('الرحلات', 'Trips'), cell: (d) => <span className="num">{int(stats.get(d.id)?.trips ?? 0)}</span>, sort: (d) => stats.get(d.id)?.trips ?? 0, csv: (d) => stats.get(d.id)?.trips ?? 0 },
    { key: 'earn', header: t('الأرباح', 'Earnings'), cell: (d) => <span className="num" dir="ltr">{sar(stats.get(d.id)?.net ?? 0, 0)}</span>, sort: (d) => stats.get(d.id)?.net ?? 0, csv: (d) => sar(stats.get(d.id)?.net ?? 0) },
    { key: 'online', header: t('الاتصال', 'Online'), cell: (d) => (d.online ? <Badge tone="live" dot>{t('متصل', 'Online')}</Badge> : <Badge tone="outline">{t('غير متصل', 'Offline')}</Badge>), sort: (d) => (d.online ? 1 : 0), csv: (d) => (d.online ? 'online' : 'offline') },
    { key: 'status', header: t('الحساب', 'Account'), cell: (d) => <Badge tone={DRIVER_STATUS[d.status].tone}>{L(DRIVER_STATUS[d.status])}</Badge>, sort: (d) => d.status, csv: (d) => d.status },
  ]

  return (
    <div>
      <PageHeader
        title={t('إدارة الكباتن', 'Captain management')}
        sub={<span className="flex items-center gap-2">{t('الحسابات والمستندات والمركبات والأداء', 'Accounts, documents, vehicles and performance')} <DemoBadge /></span>}
        actions={
          <Can perm="drivers.edit">
            <Button size="sm" icon={<UserPlus size={15} />} onClick={() => setAdding(true)}>
              {t('إضافة كابتن', 'Add captain')}
            </Button>
          </Can>
        }
      />
      <DataTable
        rows={rows}
        cols={cols}
        rowKey={(d) => d.id}
        onRow={(d) => setOpenId(d.id)}
        exportName="aura-captains"
        search={(d, q) => d.id.includes(q) || d.name.en.toLowerCase().includes(q) || d.name.ar.includes(q) || d.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))}
        searchPlaceholder={t('الاسم، الجوال أو رقم الكابتن', 'Name, mobile or captain ID')}
        filters={
          <FilterChips
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: t('الكل', 'All'), count: drivers.length },
              { value: 'applications', label: t('طلبات التسجيل', 'Applications'), count: pending },
              { value: 'online', label: t('المتصلون', 'Online'), count: drivers.filter((d) => d.online).length },
              { value: 'suspended', label: t('الموقوفون/المرفوضون', 'Suspended/rejected'), count: drivers.filter((d) => d.status === 'suspended' || d.status === 'rejected').length },
            ]}
          />
        }
      />
      <DriverDrawer driver={drivers.find((d) => d.id === openId)} stats={openId ? stats.get(openId) : undefined} onClose={() => { setOpenId(null); if (hashQuery().id) window.history.replaceState(null, '', '#/admin/drivers') }} />
      <AddDriverDrawer open={adding} onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); setOpenId(id) }} />
    </div>
  )
}

const DOC_LABEL: Record<DriverDoc['id'], { ar: string; en: string }> = {
  national_id: { ar: 'الهوية الوطنية / الإقامة', en: 'National ID / Iqama' },
  license: { ar: 'رخصة القيادة', en: 'Driving licence' },
  registration: { ar: 'استمارة المركبة', en: 'Vehicle registration' },
  insurance: { ar: 'وثيقة التأمين', en: 'Insurance' },
  photo: { ar: 'الصورة الشخصية', en: 'Profile photo' },
}

function DriverDrawer({ driver, stats, onClose }: { driver?: Driver; stats?: ReturnType<typeof driverStats>; onClose: () => void }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const v = getVehicle(driver?.vehicleId)
  const allDocsOk = driver?.docs.every((d) => d.status === 'approved' || d.status === 'uploaded')
  return (
    <Drawer
      open={!!driver}
      onClose={() => { setRejecting(false); onClose() }}
      width={580}
      title={driver && <span className="flex items-center gap-3">{L(driver.name)} <Badge tone={DRIVER_STATUS[driver.status].tone}>{L(DRIVER_STATUS[driver.status])}</Badge></span>}
      footer={
        driver && (
          <>
            {(driver.status === 'pending_review' || driver.status === 'incomplete') && (
              <Can perm="drivers.approve">
                <Button variant="secondary" size="sm" icon={<X size={15} />} onClick={() => setRejecting(true)}>
                  {t('رفض التسجيل', 'Reject')}
                </Button>
                <Button size="sm" icon={<Check size={15} />} disabled={!allDocsOk} onClick={() => { actions.setDriverStatus(driver.id, 'approved', admin); toast(t('تم قبول الكابتن وإشعاره', 'Captain approved and notified')) }}>
                  {t('قبول التسجيل', 'Approve')}
                </Button>
              </Can>
            )}
            {driver.status === 'approved' && (
              <Can perm="drivers.suspend">
                <Button variant="danger" size="sm" icon={<ShieldOff size={15} />} onClick={() => { actions.setDriverStatus(driver.id, 'suspended', admin, 'Suspended by admin'); toast(t('تم تعليق الحساب', 'Account suspended')) }}>
                  {t('تعليق الحساب', 'Suspend')}
                </Button>
              </Can>
            )}
            {(driver.status === 'suspended' || driver.status === 'rejected') && (
              <Can perm="drivers.suspend">
                <Button size="sm" icon={<ShieldCheck size={15} />} onClick={() => { actions.setDriverStatus(driver.id, 'approved', admin); toast(t('تم تفعيل الحساب', 'Account activated')) }}>
                  {t('تفعيل الحساب', 'Activate')}
                </Button>
              </Can>
            )}
          </>
        )
      }
    >
      {driver && (
        <div className="space-y-5">
          {rejecting && (
            <div className="rounded-2xl bg-danger-soft p-4">
              <Field label={t('سبب الرفض (يظهر للكابتن)', 'Reason (shown to captain)')}>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('مثال: صورة الرخصة غير واضحة', 'e.g. licence photo unclear')} />
              </Field>
              <Button variant="danger" size="sm" className="mt-3" disabled={reason.trim().length < 4} onClick={() => { actions.setDriverStatus(driver.id, 'rejected', admin, reason); setRejecting(false); toast(t('تم رفض الطلب', 'Application rejected'), 'info') }}>
                {t('تأكيد الرفض', 'Confirm rejection')}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Avatar name={L(driver.name)} size={64} />
            <div>
              <p className="font-display text-lg font-semibold">{L(driver.name)}</p>
              <p className="num text-sm text-mute">
                {driver.id} · ★ {driver.rating.toFixed(2)} ({int(driver.ratingsCount)})
              </p>
              <p className="mt-1">{driver.online ? <Badge tone="live" dot>{t('متصل الآن', 'Online now')}</Badge> : <Badge tone="outline">{t('غير متصل', 'Offline')}</Badge>}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [int(stats?.trips ?? 0), t('رحلة', 'Trips')],
              [sar(stats?.net ?? 0, 0), t('أرباح (SAR)', 'Earned (SAR)')],
              [`${Math.round(driver.acceptanceRate * 100)}%`, t('نسبة القبول', 'Acceptance')],
            ].map(([v2, k]) => (
              <div key={k} className="rounded-xl bg-road py-3">
                <p className="num font-semibold">{v2}</p>
                <p className="text-[11px] text-mute">{k}</p>
              </div>
            ))}
          </div>
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-mute">{t('البيانات الشخصية', 'Personal details')}</h3>
            <KV k={t('رقم الجوال', 'Mobile')} v={<span className="num" dir="ltr">{driver.phone}</span>} />
            <KV k={t('رقم الهوية', 'National ID')} v={<span className="num">{can('drivers.edit') ? driver.nationalId : `${driver.nationalId.slice(0, 2)}••••••${driver.nationalId.slice(-2)}`}</span>} />
            <KV k={t('البريد', 'Email')} v={<span dir="ltr">{driver.email ?? '—'}</span>} />
            <KV k={t('المدينة', 'City')} v={L(cityById(driver.cityId).name)} />
            <KV k={t('تاريخ الانضمام', 'Joined')} v={<span className="num">{day(driver.joinedAt, lang)} {new Date(driver.joinedAt).getFullYear()}</span>} />
            <KV k={t('نسبة الإلغاء', 'Cancellation rate')} v={<span className="num">{Math.round(driver.cancellationRate * 100)}%</span>} />
            {driver.rejectionReason && <KV k={t('سبب الرفض', 'Rejection reason')} v={driver.rejectionReason} />}
          </section>
          {v && (
            <section>
              <h3 className="mb-2 text-[13px] font-semibold text-mute">{t('المركبة', 'Vehicle')}</h3>
              <div className="flex items-center justify-between rounded-2xl bg-road p-3">
                <CarArt classId={v.classId} color={v.colorHex} width={130} />
                <div className="text-end text-sm">
                  <p className="font-semibold">
                    {v.make} {v.model} {v.year}
                  </p>
                  <p className="text-mute">
                    {L(v.color)} · <span dir="ltr">{classById(v.classId).name}</span>
                  </p>
                  <div className="mt-1.5">
                    <Plate digits={v.plate.digits} lettersAr={v.plate.lettersAr} lettersEn={v.plate.lettersEn} size="sm" />
                  </div>
                </div>
              </div>
            </section>
          )}
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-mute">{t('الوثائق والتراخيص', 'Documents & licences')}</h3>
            <div className="space-y-2">
              {driver.docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-line">
                  <FileText size={18} className="text-mute" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{L(DOC_LABEL[doc.id])}</p>
                    <p className="num truncate text-xs text-mute">
                      {doc.fileName ?? t('لم يُرفع', 'Not uploaded')}
                      {doc.expires ? ` · ${t('ينتهي', 'exp.')} ${doc.expires}` : ''}
                    </p>
                  </div>
                  <Badge tone={doc.status === 'approved' ? 'live' : doc.status === 'rejected' ? 'danger' : doc.status === 'missing' ? 'outline' : 'warn'}>
                    {{ approved: t('معتمد', 'Approved'), rejected: t('مرفوض', 'Rejected'), uploaded: t('بانتظار المراجعة', 'Needs review'), missing: t('ناقص', 'Missing') }[doc.status]}
                  </Badge>
                  {doc.status === 'uploaded' && can('drivers.approve') && (
                    <span className="flex gap-1">
                      <button aria-label={t('اعتماد', 'Approve')} onClick={() => actions.setDocStatus(driver.id, doc.id, 'approved', admin)} className="flex size-7 items-center justify-center rounded-lg bg-ink text-white">
                        <Check size={14} />
                      </button>
                      <button aria-label={t('رفض', 'Reject')} onClick={() => actions.setDocStatus(driver.id, doc.id, 'rejected', admin)} className="flex size-7 items-center justify-center rounded-lg bg-road">
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-mute">{t('عرض ملفات المستندات يتطلب ربط خدمة تخزين آمنة.', 'Viewing document files requires a secure storage integration.')}</p>
          </section>
        </div>
      )}
    </Drawer>
  )
}

function AddDriverDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const { admin } = useAdmin()
  const [f, setF] = useState({ nameAr: '', nameEn: '', phone: '', nid: '', city: 'riyadh' as CityId, make: 'Toyota', model: 'Camry', year: '2024', digits: '', letters: '', classId: 'go' as VehicleClassId })
  const valid = f.nameEn.length > 2 && /^5\d{8}$/.test(f.phone) && /^[12]\d{9}$/.test(f.nid) && f.digits.length >= 3 && f.letters.length >= 2
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('إضافة كابتن', 'Add captain')}
      footer={
        <Button
          icon={<Plus size={16} />}
          disabled={!valid}
          onClick={() => {
            const id = actions.addDriver(admin, {
              name: { ar: f.nameAr || f.nameEn, en: f.nameEn },
              phone: `+966 ${f.phone.slice(0, 2)} ${f.phone.slice(2, 5)} ${f.phone.slice(5)}`,
              nationalId: f.nid,
              cityId: f.city,
              vehicle: { make: f.make, model: f.model, year: Number(f.year), color: { ar: 'أبيض', en: 'White' }, colorHex: '#F5F5F3', plate: { digits: f.digits, lettersEn: f.letters.toUpperCase(), lettersAr: f.letters.toUpperCase() }, classId: f.classId },
            })
            toast(t('تم إنشاء الحساب. بانتظار رفع المستندات.', 'Account created. Awaiting documents.'))
            onCreated(id)
          }}
        >
          {t('إنشاء الحساب', 'Create account')}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('الاسم بالعربية', 'Name (Arabic)')}>
          <Input value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} />
        </Field>
        <Field label={t('الاسم بالإنجليزية', 'Name (English)')}>
          <Input dir="ltr" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
        </Field>
        <Field label={t('الجوال (5XXXXXXXX)', 'Mobile (5XXXXXXXX)')}>
          <Input dir="ltr" className="num" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
        </Field>
        <Field label={t('رقم الهوية', 'National ID')}>
          <Input dir="ltr" className="num" value={f.nid} onChange={(e) => setF({ ...f, nid: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
        </Field>
        <Field label={t('المدينة', 'City')}>
          <Select className="h-12 w-full" value={f.city} onChange={(v) => setF({ ...f, city: v as CityId })} options={CITIES.map((c) => ({ value: c.id, label: L(c.name) }))} />
        </Field>
        <Field label={t('الفئة', 'Class')}>
          <Select className="h-12 w-full" value={f.classId} onChange={(v) => setF({ ...f, classId: v as VehicleClassId })} options={VEHICLE_CLASSES.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label={t('الشركة', 'Make')}>
          <Input dir="ltr" value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} />
        </Field>
        <Field label={t('الطراز', 'Model')}>
          <Input dir="ltr" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
        </Field>
        <Field label={t('أرقام اللوحة', 'Plate digits')}>
          <Input dir="ltr" className="num" value={f.digits} onChange={(e) => setF({ ...f, digits: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
        </Field>
        <Field label={t('حروف اللوحة', 'Plate letters')}>
          <Input dir="ltr" className="uppercase" value={f.letters} onChange={(e) => setF({ ...f, letters: e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3) })} />
        </Field>
      </div>
      <p className="mt-4 text-xs text-mute">{t('يُنشأ الحساب بحالة «غير مكتمل» حتى يرفع الكابتن مستنداته ويتم اعتمادها.', 'The account starts as "Incomplete" until the captain uploads documents and they are approved.')}</p>
    </Drawer>
  )
}

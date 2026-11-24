import { useEffect, useMemo, useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'
import { CityMap } from '../../../map/CityMap'
import { Badge, Button, cx, DemoBadge, Field, Input, Money, Select, TripStatusBadge, useToast } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { actions, getCustomer, getDriver, useAllTrips, useEco } from '../../../core/store'
import { ACTIVE_STATUSES, CANCEL_REASONS, STATUS_LABEL, isActive } from '../../../core/trip'
import { classById, VEHICLE_CLASSES } from '../../../core/pricing'
import { CITIES, cityById, routeBetween } from '../../../core/geo'
import { dateTime, sar } from '../../../core/format'
import type { Trip } from '../../../core/types'
import { Can, DataTable, Drawer, FilterChips, KV, PageHeader, useAdmin, type Col } from '../kit'
import { hashQuery } from '../../../app/router'
import { PAYMENT_LABEL } from '../../passenger/Booking'

export function TripsPage() {
  const { t, L, lang } = useI18n()
  const all = useAllTrips()
  const [status, setStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [city, setCity] = useState('all')
  const [cls, setCls] = useState('all')
  const [openId, setOpenId] = useState<string | null>(() => hashQuery().id ?? null)
  useEffect(() => {
    const on = () => setOpenId(hashQuery().id ?? null)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const rows = useMemo(
    () => all.filter((x) => (status === 'all' ? true : status === 'active' ? isActive(x.status) : x.status === status) && (city === 'all' || x.cityId === city) && (cls === 'all' || x.vehicleClass === cls)),
    [all, status, city, cls],
  )
  const counts = useMemo(() => ({ all: all.length, active: all.filter((x) => isActive(x.status)).length, completed: all.filter((x) => x.status === 'completed').length, cancelled: all.filter((x) => x.status === 'cancelled').length }), [all])
  const open = all.find((x) => x.id === openId)

  const cols: Col<Trip>[] = [
    { key: 'id', header: t('رقم الرحلة', 'Trip ID'), cell: (r) => <span className="num font-semibold whitespace-nowrap">{r.id}</span>, csv: (r) => r.id },
    { key: 'at', header: t('التاريخ', 'Date'), cell: (r) => <span className="num whitespace-nowrap text-mute">{dateTime(r.createdAt, lang)}</span>, sort: (r) => r.createdAt, csv: (r) => new Date(r.createdAt).toISOString() },
    { key: 'cust', header: t('العميل', 'Customer'), cell: (r) => L(getCustomer(r.passengerId)?.name), sort: (r) => L(getCustomer(r.passengerId)?.name), csv: (r) => getCustomer(r.passengerId)?.name.en ?? '' },
    { key: 'cap', header: t('الكابتن', 'Captain'), cell: (r) => (r.driverId ? L(getDriver(r.driverId)?.name) : <span className="text-mute-2">—</span>), csv: (r) => getDriver(r.driverId)?.name.en ?? '' },
    { key: 'route', header: t('المسار', 'Route'), cell: (r) => <span className="block max-w-56 truncate text-mute">{L(r.pickup.name)} → {L(r.dropoff.name)}</span>, csv: (r) => `${r.pickup.name.en} → ${r.dropoff.name.en}` },
    { key: 'city', header: t('المدينة', 'City'), cell: (r) => L(cityById(r.cityId).name), csv: (r) => r.cityId },
    { key: 'class', header: t('الفئة', 'Class'), cell: (r) => <span dir="ltr">{classById(r.vehicleClass).name}</span>, csv: (r) => r.vehicleClass },
    { key: 'status', header: t('الحالة', 'Status'), cell: (r) => <TripStatusBadge status={r.status} />, sort: (r) => r.status, csv: (r) => r.status },
    { key: 'total', header: t('المبلغ', 'Total'), cell: (r) => <span className="num font-semibold" dir="ltr">{sar(r.status === 'cancelled' ? 0 : r.fare.total)}</span>, sort: (r) => r.fare.total, csv: (r) => sar(r.fare.total) },
    { key: 'comm', header: t('العمولة', 'Commission'), cell: (r) => <span className="num text-mute" dir="ltr">{r.status === 'completed' ? sar(r.fare.commission) : '—'}</span>, csv: (r) => (r.status === 'completed' ? sar(r.fare.commission) : '0') },
  ]

  return (
    <div>
      <PageHeader title={t('إدارة الرحلات', 'Trips management')} sub={<span className="flex items-center gap-2">{t('كل الرحلات عبر المدن مع السجل والمبالغ', 'Every trip across cities with history and amounts')} <DemoBadge /></span>} />
      <DataTable
        rows={rows}
        cols={cols}
        rowKey={(r) => r.id}
        onRow={(r) => setOpenId(r.id)}
        exportName="aura-trips"
        initialSort={{ key: 'at', dir: -1 }}
        search={(r, q) => r.id.toLowerCase().includes(q) || !!getCustomer(r.passengerId)?.name.en.toLowerCase().includes(q) || !!getCustomer(r.passengerId)?.name.ar.includes(q) || !!getDriver(r.driverId)?.name.en.toLowerCase().includes(q) || !!getDriver(r.driverId)?.name.ar.includes(q)}
        searchPlaceholder={t('رقم الرحلة، اسم العميل أو الكابتن', 'Trip ID, customer or captain')}
        filters={
          <>
            <FilterChips
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: t('الكل', 'All'), count: counts.all },
                { value: 'active', label: t('النشطة', 'Active'), count: counts.active },
                { value: 'completed', label: t('المكتملة', 'Completed'), count: counts.completed },
                { value: 'cancelled', label: t('الملغاة', 'Cancelled'), count: counts.cancelled },
              ]}
            />
            <Select value={city} onChange={setCity} options={[{ value: 'all', label: t('كل المدن', 'All cities') }, ...CITIES.map((c) => ({ value: c.id, label: L(c.name) }))]} />
            <Select value={cls} onChange={setCls} options={[{ value: 'all', label: t('كل الفئات', 'All classes') }, ...VEHICLE_CLASSES.map((c) => ({ value: c.id, label: c.name }))]} />
          </>
        }
      />
      <TripDrawer trip={open} onClose={() => { setOpenId(null); if (hashQuery().id) window.history.replaceState(null, '', '#/admin/trips') }} />
    </div>
  )
}

export function TripDrawer({ trip, onClose }: { trip?: Trip; onClose: () => void }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin } = useAdmin()
  const refunds = useEco((s) => s.refunds.filter((r) => r.tripId === trip?.id))
  const [mode, setMode] = useState<null | 'cancel' | 'refund'>(null)
  const [reason, setReason] = useState(CANCEL_REASONS.admin[0].en)
  const [amount, setAmount] = useState('')
  const c = getCustomer(trip?.passengerId)
  const d = getDriver(trip?.driverId)
  return (
    <Drawer
      open={!!trip}
      onClose={() => { setMode(null); onClose() }}
      width={600}
      title={
        trip && (
          <span className="flex items-center gap-3">
            <span className="num">{trip.id}</span>
            <TripStatusBadge status={trip.status} />
            {trip.seeded && <DemoBadge />}
          </span>
        )
      }
      footer={
        trip && (
          <>
            {ACTIVE_STATUSES.includes(trip.status) && (
              <Can perm="trips.cancel">
                <Button variant="danger" size="sm" icon={<Ban size={15} />} onClick={() => setMode('cancel')}>
                  {t('إلغاء الرحلة', 'Cancel trip')}
                </Button>
              </Can>
            )}
            {trip.status === 'completed' && (
              <Can perm="finance.settle">
                <Button variant="secondary" size="sm" icon={<RotateCcw size={15} />} onClick={() => { setAmount(sar(trip.fare.total)); setMode('refund') }}>
                  {t('استرداد مبلغ', 'Refund')}
                </Button>
              </Can>
            )}
          </>
        )
      }
    >
      {trip && (
        <div className="space-y-5">
          <div className="h-48 overflow-hidden rounded-2xl">
            {trip.cityId === 'riyadh' ? (
              <CityMap interactive={false} labels={false} fit={[trip.pickup.pos, trip.dropoff.pos]} padding={[30, 30, 30, 30]} routes={[{ id: 'r', pts: routeBetween(trip.pickup.pos, trip.dropoff.pos) }]} markers={[{ id: 'p', pos: trip.pickup.pos, kind: 'pickup' }, { id: 'd', pos: trip.dropoff.pos, kind: 'dropoff' }]} />
            ) : (
              <div className="aura-hatch flex h-full items-center justify-center bg-road px-6 text-center text-sm text-mute">
                {t(`خريطة ${L(cityById(trip.cityId).name)} تتوفر عند ربط مزوّد خرائط تجاري. الخريطة التجريبية تغطي الرياض.`, `${L(cityById(trip.cityId).name)} map is available once a commercial map provider is connected. The demo map covers Riyadh.`)}
              </div>
            )}
          </div>
          {mode === 'cancel' && (
            <div className="rounded-2xl bg-danger-soft p-4">
              <Field label={t('سبب الإلغاء', 'Cancellation reason')}>
                <Select className="w-full" value={reason} onChange={setReason} options={CANCEL_REASONS.admin.map((r) => ({ value: r.en, label: L(r) }))} />
              </Field>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" size="sm" onClick={() => { if (actions.adminCancelTrip(trip.id, reason, admin)) toast(t('تم إلغاء الرحلة وإشعار الطرفين', 'Trip cancelled, both parties notified')); setMode(null) }}>
                  {t('تأكيد الإلغاء', 'Confirm cancel')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                  {t('تراجع', 'Back')}
                </Button>
              </div>
            </div>
          )}
          {mode === 'refund' && (
            <div className="rounded-2xl bg-road p-4">
              <Field label={t('مبلغ الاسترداد (SAR)', 'Refund amount (SAR)')} hint={`${t('الحد الأقصى', 'Max')} ${sar(trip.fare.total)}`}>
                <Input dir="ltr" className="num" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
              </Field>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={!Number(amount) || Number(amount) * 100 > trip.fare.total}
                  onClick={() => {
                    actions.refundTrip(trip.id, Math.round(Number(amount) * 100), 'Admin refund', admin)
                    toast(t('تم تسجيل الاسترداد', 'Refund recorded'))
                    setMode(null)
                  }}
                >
                  {t('تأكيد الاسترداد', 'Confirm refund')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                  {t('تراجع', 'Back')}
                </Button>
              </div>
            </div>
          )}
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-mute">{t('بيانات الرحلة', 'Trip')}</h3>
            <KV k={t('الانطلاق', 'Pickup')} v={L(trip.pickup.name)} />
            <KV k={t('الوجهة', 'Destination')} v={L(trip.dropoff.name)} />
            <KV k={t('المدينة', 'City')} v={L(cityById(trip.cityId).name)} />
            <KV k={t('الفئة', 'Class')} v={<span dir="ltr">{classById(trip.vehicleClass).name}</span>} />
            <KV k={t('العميل', 'Customer')} v={c ? `${L(c.name)} · ${c.phone}` : '—'} />
            <KV k={t('الكابتن', 'Captain')} v={d ? `${L(d.name)} · ${d.id}` : '—'} />
            <KV k={t('الدفع', 'Payment')} v={L(PAYMENT_LABEL[trip.paymentMethod])} />
            <KV k={t('رمز التحقق', 'Trip code')} v={<span className="num">••{trip.otp.slice(2)}</span>} />
          </section>
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-mute">{t('المبالغ والعمولات', 'Amounts & commission')}</h3>
            <KV k={t('رسوم فتح الرحلة', 'Base fare')} v={<span className="num">{sar(trip.fare.base)}</span>} />
            <KV k={`${t('المسافة', 'Distance')} (${trip.fare.distanceKm} km)`} v={<span className="num">{sar(trip.fare.distance)}</span>} />
            <KV k={`${t('الوقت', 'Time')} (${trip.fare.durationMin} min)`} v={<span className="num">{sar(trip.fare.time)}</span>} />
            {trip.fare.surge > 0 && <KV k={`${t('طلب مرتفع', 'Surge')} ×${trip.fare.surgeMultiplier}`} v={<span className="num">{sar(trip.fare.surge)}</span>} />}
            <KV k={t('قيمة الرحلة', 'Subtotal')} v={<span className="num">{sar(trip.fare.subtotal)}</span>} />
            {trip.fare.discount > 0 && <KV k={`${t('خصم', 'Discount')} ${trip.fare.promoCode ?? ''}`} v={<span className="num">−{sar(trip.fare.discount)}</span>} />}
            <KV k={`${t('ضريبة القيمة المضافة', 'VAT')} ${Math.round(trip.fare.vatRate * 100)}%`} v={<span className="num">{sar(trip.fare.vat)}</span>} />
            <KV k={<b>{t('الإجمالي المدفوع', 'Total paid')}</b>} v={<Money h={trip.fare.total} />} />
            <KV k={`${t('عمولة المنصة', 'Platform commission')} ${Math.round(trip.fare.commissionRate * 100)}%`} v={<span className="num font-semibold text-go-deep">{sar(trip.fare.commission)}</span>} />
            <KV k={t('مستحقات الكابتن', 'Captain payout')} v={<span className="num">{sar(trip.fare.driverNet + (trip.passengerRating?.tip ?? 0))}</span>} />
            {refunds.map((r) => (
              <KV key={r.id} k={<span className="text-danger">{t('مسترد', 'Refunded')} · {r.by}</span>} v={<span className="num text-danger">−{sar(r.amount)}</span>} />
            ))}
          </section>
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-mute">{t('سجل الحالات', 'Status history')}</h3>
            <ol className="relative space-y-3 border-s-2 border-line ps-4">
              {trip.timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span className={cx('absolute -start-[23px] top-1 size-3 rounded-full ring-4 ring-white', e.status === 'cancelled' ? 'bg-danger' : e.status === 'completed' ? 'bg-ink' : 'bg-go')} />
                  <p className="text-sm font-semibold">{L(STATUS_LABEL[e.status])}</p>
                  <p className="num text-xs text-mute">
                    {dateTime(e.at, lang)} · {e.actor}
                    {e.note ? ` · ${e.note}` : ''}
                  </p>
                </li>
              ))}
            </ol>
            {trip.cancel && (
              <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                {t('سبب الإلغاء', 'Cancellation reason')}: {trip.cancel.reason} ({trip.cancel.by})
              </p>
            )}
          </section>
          {(trip.passengerRating || trip.driverRating) && (
            <section>
              <h3 className="mb-1 text-[13px] font-semibold text-mute">{t('التقييمات', 'Ratings')}</h3>
              {trip.passengerRating && <KV k={t('تقييم العميل للكابتن', 'Customer → captain')} v={<span className="num">{'★'.repeat(trip.passengerRating.stars)} {trip.passengerRating.tip ? `· tip ${sar(trip.passengerRating.tip)}` : ''}</span>} />}
              {trip.driverRating && <KV k={t('تقييم الكابتن للعميل', 'Captain → customer')} v={<span className="num">{'★'.repeat(trip.driverRating.stars)}</span>} />}
            </section>
          )}
          {trip.chat && trip.chat.length > 0 && (
            <section>
              <h3 className="mb-2 text-[13px] font-semibold text-mute">{t('سجل المحادثة', 'Chat log')}</h3>
              <div className="space-y-1.5">
                {trip.chat.map((m, i) => (
                  <p key={i} className="text-sm">
                    <Badge tone={m.from === 'driver' ? 'done' : 'neutral'}>{m.from === 'driver' ? t('الكابتن', 'Captain') : t('العميل', 'Customer')}</Badge> {m.text}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}

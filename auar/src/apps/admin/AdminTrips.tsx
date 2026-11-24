import { useState } from 'react'
import { X, Undo2, Ban, MessageSquare } from 'lucide-react'
import { Map, type MapCar } from '../../components/Map'
import { Avatar, Badge, Btn, PaymentIcon, PAY_LABEL } from '../../components/ui'
import { dayTime, money, km, mins, clock } from '../../lib/format'
import { slice } from '../../lib/geo'
import { busyDriverIds, cancelTrip, driverPose, isLive, refundTrip, tripProgress, useNow, useStore } from '../../store/store'
import type { Trip } from '../../store/types'
import { Card, PageTitle, SearchBox, TripStatus } from './AdminApp'

export function LiveMap({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useStore()
  const now = useNow(300)
  const [sel, setSel] = useState<string | null>(null)
  const busy = busyDriverIds(s)
  const live = s.trips.filter((t) => isLive(t))
  const selTrip = live.find((t) => t.id === sel)
  const cars: MapCar[] = s.drivers
    .filter((d) => d.online && d.status === 'active')
    .map((d) => {
      const p = driverPose(d, s, now)
      return { id: d.id, p: p.p, a: p.a, color: busy.has(d.id) ? '#2f5bff' : '#16a34a', focus: selTrip?.driverId === d.id, moto: d.categories.includes('moto') }
    })
  const t = selTrip
  const prog = t ? tripProgress(t, s.settings, now) : 0
  return (
    <>
      <PageTitle
        title="العمليات المباشرة"
        sub="مواقع الكباتن والرحلات لحظة بلحظة"
        right={
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ok" /> متاح ({cars.length - busy.size})</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky" /> في رحلة ({busy.size})</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff6b2c]/50" /> طلبات</span>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[560px] overflow-hidden rounded-2xl border border-line">
          <Map
            focus={t ? [t.pickup.p, t.dropoff.p, ...(t.approach.length ? [t.approach[0]] : [])] : [{ x: 0, y: 0 }, { x: 1000, y: 1400 }]}
            minSpan={300}
            insetTop={0}
            cars={cars}
            route={t ? (t.status === 'in_progress' ? slice(t.path, prog) : t.path) : undefined}
            approach={t && t.status === 'accepted' ? slice(t.approach, prog) : undefined}
            pickup={t ? { p: t.pickup.p, label: t.pickup.name } : undefined}
            dropoff={t ? { p: t.dropoff.p, label: t.dropoff.name } : undefined}
            heat={!t ? s.trips.filter((x) => x.status === 'searching' || now - x.requestedAt < 3 * 3600000).map((x) => x.pickup.p) : undefined}
          />
        </div>
        <Card title={`رحلات جارية (${live.length})`} className="max-h-[560px] overflow-y-auto">
          {live.length === 0 && <p className="text-sm text-mute">لا توجد رحلات جارية.</p>}
          <div className="space-y-2">
            {live.map((x) => {
              const d = s.drivers.find((y) => y.id === x.driverId)
              return (
                <button key={x.id} onClick={() => setSel(sel === x.id ? null : x.id)} className={`w-full rounded-xl border p-3 text-start text-sm ${sel === x.id ? 'border-ink bg-mist' : 'border-line hover:bg-mist/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-mute">{x.id}</span>
                    <TripStatus st={x.status} />
                  </div>
                  <p className="mt-1 truncate font-semibold">{x.pickup.name} ← {x.dropoff.name}</p>
                  <p className="text-xs text-mute">{d ? d.name : x.offeredTo ? `عُرضت على ${s.drivers.find((y) => y.id === x.offeredTo)?.name}` : 'بانتظار كابتن'}</p>
                  {sel === x.id && (
                    <span onClick={(e) => { e.stopPropagation(); onOpen(x.id) }} className="mt-2 inline-block text-xs font-semibold text-sky">
                      التفاصيل والإجراءات ←
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </>
  )
}

export function TripsPage({ focus, setFocus }: { focus: string | null; setFocus: (id: string | null) => void }) {
  const s = useStore()
  const [filter, setFilter] = useState<'all' | 'live' | 'completed' | 'cancelled' | 'scheduled'>('all')
  const [q, setQ] = useState('')
  const list = s.trips.filter((t) => {
    if (filter === 'live' && !isLive(t)) return false
    if (filter === 'completed' && t.status !== 'completed') return false
    if (filter === 'cancelled' && !['cancelled', 'no_drivers'].includes(t.status)) return false
    if (filter === 'scheduled' && t.status !== 'scheduled') return false
    if (q) {
      const r = s.riders.find((x) => x.id === t.riderId)?.name ?? ''
      const d = s.drivers.find((x) => x.id === t.driverId)?.name ?? ''
      if (![t.id, r, d, t.pickup.name, t.dropoff.name].some((v) => v.includes(q))) return false
    }
    return true
  })
  const sel = focus ? s.trips.find((t) => t.id === focus) : undefined
  return (
    <>
      <PageTitle title="الرحلات" sub={`${s.trips.length} رحلة في النظام`} right={<SearchBox value={q} onChange={setQ} placeholder="رقم الرحلة، راكب، كابتن…" />} />
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ['all', 'الكل'],
            ['live', 'جارية'],
            ['completed', 'مكتملة'],
            ['cancelled', 'ملغاة'],
            ['scheduled', 'مجدولة'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${filter === k ? 'bg-ink text-white' : 'border border-line bg-white'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-mist/60 text-start text-xs text-mute">
            <tr>
              {['الرحلة', 'الوقت', 'الراكب', 'الكابتن', 'المسار', 'الخدمة', 'الأجرة', 'الدفع', 'الحالة'].map((h) => (
                <th key={h} className="px-4 py-3 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.slice(0, 120).map((t) => (
              <tr key={t.id} onClick={() => setFocus(t.id)} className={`cursor-pointer hover:bg-mist/50 ${focus === t.id ? 'bg-mist' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-2.5 text-mute tnum">{dayTime(t.completedAt ?? t.cancelledAt ?? t.requestedAt)}</td>
                <td className="px-4 py-2.5">{s.riders.find((r) => r.id === t.riderId)?.name}</td>
                <td className="px-4 py-2.5">{s.drivers.find((d) => d.id === t.driverId)?.name ?? '—'}</td>
                <td className="max-w-[220px] truncate px-4 py-2.5 text-mute">
                  {t.pickup.name} ← {t.dropoff.name}
                </td>
                <td className="px-4 py-2.5" dir="auto">{s.categories.find((c) => c.id === t.category)?.name}</td>
                <td className="px-4 py-2.5 font-semibold tnum">{money(t.fare)}</td>
                <td className="px-4 py-2.5">{PAY_LABEL[t.payment].split(' ')[0]}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1">
                    <TripStatus st={t.status} />
                    {t.refunded && <Badge tone="info">مسترد</Badge>}
                    {t.sos && <Badge tone="bad">SOS</Badge>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-10 text-center text-sm text-mute">لا توجد نتائج</p>}
      </div>
      {sel && <TripDrawer trip={sel} onClose={() => setFocus(null)} />}
    </>
  )
}

function TripDrawer({ trip: t, onClose }: { trip: Trip; onClose: () => void }) {
  const s = useStore()
  const now = useNow(400)
  const r = s.riders.find((x) => x.id === t.riderId)
  const d = s.drivers.find((x) => x.id === t.driverId)
  const pose = d ? driverPose(d, s, now) : null
  const prog = tripProgress(t, s.settings, now)
  const timeline: [string, number | undefined][] = [
    ['طلب الرحلة', t.requestedAt],
    ['قبول الكابتن', t.acceptedAt],
    ['وصول الكابتن', t.arrivedAt],
    ['بدء الرحلة', t.startedAt],
    ['انتهاء الرحلة', t.completedAt],
    ['الإلغاء', t.cancelledAt],
  ]
  return (
    <div className="fade-in fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside className="absolute inset-y-0 left-0 w-full max-w-[460px] overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <div>
            <p className="font-mono text-xs text-mute">{t.id}</p>
            <div className="mt-1">
              <TripStatus st={t.status} />
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-mist" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="h-56">
          <Map
            focus={[t.pickup.p, t.dropoff.p, ...(pose ? [pose.p] : [])]}
            minSpan={200}
            insetTop={0}
            route={t.status === 'in_progress' ? slice(t.path, prog) : t.path}
            approach={t.status === 'accepted' ? slice(t.approach, prog) : undefined}
            pickup={{ p: t.pickup.p }}
            dropoff={{ p: t.dropoff.p }}
            cars={d && pose && isLive(t) ? [{ id: d.id, p: pose.p, a: pose.a, color: d.car.colorHex, focus: true }] : []}
            pois={false}
          />
        </div>
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-mist p-3">
              <p className="text-xs text-mute">الراكب</p>
              <div className="mt-1 flex items-center gap-2">
                {r && <Avatar name={r.name} color={r.color} size={30} />}
                <div>
                  <p className="text-sm font-semibold">{r?.name}</p>
                  <p className="text-xs text-mute" dir="ltr">{r?.phone}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-mist p-3">
              <p className="text-xs text-mute">الكابتن</p>
              {d ? (
                <div className="mt-1 flex items-center gap-2">
                  <Avatar name={d.name} color={d.color} size={30} />
                  <div>
                    <p className="text-sm font-semibold">{d.name}</p>
                    <p className="text-xs text-mute">{d.car.plate}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-mute">لم يُعيّن</p>
              )}
            </div>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.pickup.name}</p>
            <p className="text-xs text-mute">{t.pickup.sub}</p>
            <p className="mt-2 font-semibold">{t.dropoff.name}</p>
            <p className="text-xs text-mute">{t.dropoff.sub}</p>
            <p className="mt-2 text-mute">
              {km(t.distanceKm)} • {mins(t.durationMin)} • <span dir="auto">{s.categories.find((c) => c.id === t.category)?.name}</span>
            </p>
          </div>
          <div className="space-y-1.5 rounded-xl border border-line p-4 text-sm">
            <Line l="الأجرة" v={money(t.fare + t.discount, true)} />
            {t.surge > 1 && <Line l="معامل الطلب" v={`×${t.surge}`} />}
            {t.discount > 0 && <Line l={`خصم (${t.promo})`} v={`- ${money(t.discount, true)}`} />}
            {t.tip > 0 && <Line l="إكرامية" v={money(t.tip, true)} />}
            {t.cancelFee ? <Line l="رسوم إلغاء" v={money(t.cancelFee, true)} /> : null}
            <Line l="عمولة المنصة" v={money(t.commission, true)} />
            <Line l="صافي الكابتن" v={money(t.status === 'completed' ? t.fare - t.commission + t.tip : 0, true)} />
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="flex items-center gap-2 text-mute">
                <PaymentIcon m={t.payment} /> {PAY_LABEL[t.payment]}
              </span>
              <span className="font-bold tnum">{money(t.fare, true)}</span>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">المسار الزمني</p>
            <ol className="space-y-1.5 text-sm">
              {timeline
                .filter(([, v]) => v)
                .map(([l, v]) => (
                  <li key={l} className="flex justify-between">
                    <span>{l}</span>
                    <span className="text-mute tnum">{clock(v!)}</span>
                  </li>
                ))}
            </ol>
            {t.cancelReason && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">سبب الإلغاء: {t.cancelReason} ({t.cancelledBy === 'rider' ? 'الراكب' : t.cancelledBy === 'driver' ? 'الكابتن' : 'الإدارة'})</p>}
            {t.riderRating && (
              <p className="mt-2 text-sm">
                تقييم الراكب للكابتن: <b>{t.riderRating}★</b> {t.riderComment && <span className="text-mute">— {t.riderComment}</span>}
              </p>
            )}
          </div>
          {t.chat.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <MessageSquare size={15} /> المحادثة
              </p>
              <div className="space-y-1 rounded-xl bg-mist p-3 text-sm">
                {t.chat.map((m, i) => (
                  <p key={i}>
                    <b>{m.from === 'rider' ? 'الراكب' : 'الكابتن'}:</b> {m.text}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {(isLive(t) || t.status === 'scheduled') && (
              <Btn variant="danger" className="flex-1" onClick={() => cancelTrip(t.id, 'admin', 'ألغيت من الإدارة')}>
                <Ban size={16} /> إلغاء الرحلة
              </Btn>
            )}
            {(t.status === 'completed' || t.cancelFee) && (
              <Btn variant="secondary" className="flex-1" disabled={t.refunded} onClick={() => refundTrip(t.id)}>
                <Undo2 size={16} /> {t.refunded ? 'تم الاسترداد' : 'استرداد للمحفظة'}
              </Btn>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function Line({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-mute">{l}</span>
      <span className="tnum">{v}</span>
    </div>
  )
}

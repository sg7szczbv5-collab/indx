import { useState } from 'react'
import { Check, X, PauseCircle, PlayCircle, FileCheck2, FileX2, ShieldBan, ShieldCheck } from 'lucide-react'
import { Avatar, Badge, Btn, RatingPill, VehicleArt } from '../../components/ui'
import { day, money } from '../../lib/format'
import { busyDriverIds, setDriverStatus, toggleRiderBlock, useStore } from '../../store/store'
import type { Driver } from '../../store/types'
import { PageTitle, SearchBox } from './AdminApp'

export function DriversPage() {
  const s = useStore()
  const [tab, setTab] = useState<'all' | 'pending' | 'online' | 'suspended'>(s.drivers.some((d) => d.status === 'pending') ? 'pending' : 'all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const busy = busyDriverIds(s)
  const list = s.drivers.filter((d) => {
    if (tab === 'pending' && d.status !== 'pending') return false
    if (tab === 'online' && !(d.online && d.status === 'active')) return false
    if (tab === 'suspended' && !['suspended', 'rejected'].includes(d.status)) return false
    if (q && ![d.name, d.phone, d.car.plate, d.id].some((v) => v.includes(q))) return false
    return true
  })
  const tripsOf = (d: Driver) => s.trips.filter((t) => t.driverId === d.id && t.status === 'completed').length
  const sel = s.drivers.find((d) => d.id === open)

  return (
    <>
      <PageTitle title="الكباتن" sub={`${s.drivers.filter((d) => d.status === 'active').length} كابتن نشط • ${s.drivers.filter((d) => d.online && d.status === 'active').length} متصل الآن`} right={<SearchBox value={q} onChange={setQ} placeholder="اسم، جوال، لوحة…" />} />
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ['all', 'الكل', s.drivers.length],
            ['pending', 'طلبات الانضمام', s.drivers.filter((d) => d.status === 'pending').length],
            ['online', 'متصلون', s.drivers.filter((d) => d.online && d.status === 'active').length],
            ['suspended', 'موقوفون / مرفوضون', s.drivers.filter((d) => ['suspended', 'rejected'].includes(d.status)).length],
          ] as const
        ).map(([k, l, n]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${tab === k ? 'bg-ink text-white' : 'border border-line bg-white'}`}>
            {l} <span className="opacity-60 tnum">{n}</span>
          </button>
        ))}
      </div>

      {tab === 'pending' && list.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((d) => (
            <div key={d.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                <Avatar name={d.name} color={d.color} />
                <div className="flex-1">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-xs text-mute">
                    <span dir="ltr">{d.phone}</span> • {d.gender === 'f' ? 'كابتنة' : 'كابتن'} • قدّم {day(d.joinedAt)}
                  </p>
                </div>
                <Badge tone="warn">قيد المراجعة</Badge>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-mist p-3">
                <VehicleArt id={d.categories[0]} className="h-10 w-16" />
                <div className="text-sm">
                  <p className="font-semibold">
                    {d.car.make} {d.car.model} {d.car.year}
                  </p>
                  <p className="text-mute">
                    {d.car.color} • {d.car.plate}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-sm">
                {(
                  [
                    ['license', 'رخصة القيادة'],
                    ['idCard', 'الهوية'],
                    ['registration', 'الاستمارة'],
                    ['insurance', 'التأمين'],
                  ] as const
                ).map(([k, l]) => (
                  <span key={k} className={`flex items-center gap-1.5 ${d.docs[k] ? '' : 'text-bad'}`}>
                    {d.docs[k] ? <FileCheck2 size={15} className="text-ok" /> : <FileX2 size={15} />} {l}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Btn size="sm" className="flex-1" onClick={() => setDriverStatus(d.id, 'active')}>
                  <Check size={16} /> موافقة وتفعيل
                </Btn>
                <Btn size="sm" variant="secondary" className="flex-1" onClick={() => setDriverStatus(d.id, 'rejected')}>
                  <X size={16} /> رفض
                </Btn>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-mist/60 text-xs text-mute">
              <tr>
                {['الكابتن', 'المركبة', 'الخدمات', 'التقييم', 'الرحلات', 'القبول', 'الرصيد', 'الحالة', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((d) => (
                <tr key={d.id} className="hover:bg-mist/40">
                  <td className="px-4 py-2.5">
                    <button onClick={() => setOpen(d.id)} className="flex items-center gap-2.5 text-start">
                      <Avatar name={d.name} color={d.color} size={34} />
                      <span>
                        <span className="block font-semibold">
                          {d.name} {!d.bot && <Badge tone="lime">أنت</Badge>}
                        </span>
                        <span className="block text-xs text-mute" dir="ltr">
                          {d.phone}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    {d.car.make} {d.car.model}
                    <span className="block text-xs text-mute">{d.car.plate}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {d.categories.map((c) => (
                        <Badge key={c}>{s.categories.find((x) => x.id === c)?.name}</Badge>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <RatingPill value={d.rating} />
                  </td>
                  <td className="px-4 py-2.5 tnum">{tripsOf(d)}</td>
                  <td className="px-4 py-2.5 tnum">{Math.round(d.acceptRate * 100)}٪</td>
                  <td className={`px-4 py-2.5 font-semibold tnum ${d.balance < 0 ? 'text-bad' : ''}`}>{money(d.balance)}</td>
                  <td className="px-4 py-2.5">
                    {d.status === 'active' ? (
                      d.online ? (
                        busy.has(d.id) ? <Badge tone="info">في رحلة</Badge> : <Badge tone="ok">متصل</Badge>
                      ) : (
                        <Badge>غير متصل</Badge>
                      )
                    ) : d.status === 'pending' ? (
                      <Badge tone="warn">قيد المراجعة</Badge>
                    ) : d.status === 'suspended' ? (
                      <Badge tone="bad">موقوف</Badge>
                    ) : (
                      <Badge tone="bad">مرفوض</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {d.status === 'active' ? (
                      <button onClick={() => setDriverStatus(d.id, 'suspended')} className="flex items-center gap-1 text-xs font-semibold text-bad hover:underline">
                        <PauseCircle size={15} /> إيقاف
                      </button>
                    ) : (
                      <button onClick={() => setDriverStatus(d.id, 'active')} className="flex items-center gap-1 text-xs font-semibold text-ok hover:underline">
                        <PlayCircle size={15} /> تفعيل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="py-10 text-center text-sm text-mute">لا يوجد كباتن في هذا القسم</p>}
        </div>
      )}

      {sel && (
        <div className="fade-in fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(null)}>
          <aside className="absolute inset-y-0 left-0 w-full max-w-[420px] overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar name={sel.name} color={sel.color} size={56} />
              <div className="flex-1">
                <p className="text-lg font-bold">{sel.name}</p>
                <p className="text-sm text-mute">
                  {sel.id} • {sel.city}
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-mist" aria-label="إغلاق">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-mist p-3">
                <p className="text-lg font-bold tnum">{sel.rating.toFixed(2)}</p>
                <p className="text-xs text-mute">{sel.ratingsCount} تقييم</p>
              </div>
              <div className="rounded-xl bg-mist p-3">
                <p className="text-lg font-bold tnum">{tripsOf(sel)}</p>
                <p className="text-xs text-mute">رحلة</p>
              </div>
              <div className="rounded-xl bg-mist p-3">
                <p className="text-lg font-bold tnum">{Math.round(sel.balance)}</p>
                <p className="text-xs text-mute">الرصيد</p>
              </div>
            </div>
            <h3 className="mt-6 font-bold">آخر الرحلات</h3>
            <div className="mt-2 divide-y divide-line text-sm">
              {s.trips
                .filter((t) => t.driverId === sel.id)
                .slice(0, 8)
                .map((t) => (
                  <div key={t.id} className="flex justify-between py-2">
                    <span className="truncate">{t.dropoff.name}</span>
                    <span className="text-mute tnum">{money(t.fare)}</span>
                  </div>
                ))}
            </div>
            <h3 className="mt-6 font-bold">آخر التقييمات</h3>
            <div className="mt-2 space-y-2 text-sm">
              {s.trips
                .filter((t) => t.driverId === sel.id && t.riderComment)
                .slice(0, 5)
                .map((t) => (
                  <p key={t.id} className="rounded-lg bg-mist p-2">
                    {t.riderRating}★ — {t.riderComment}
                  </p>
                ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export function RidersPage() {
  const s = useStore()
  const [q, setQ] = useState('')
  const list = s.riders.filter((r) => !q || [r.name, r.phone, r.email, r.id].some((v) => v.includes(q)))
  return (
    <>
      <PageTitle title="الركاب" sub={`${s.riders.length} راكب مسجل`} right={<SearchBox value={q} onChange={setQ} placeholder="اسم، جوال، بريد…" />} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-mist/60 text-xs text-mute">
            <tr>
              {['الراكب', 'التواصل', 'الرحلات', 'الإنفاق', 'المحفظة', 'التقييم', 'انضم', 'الحالة', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((r) => {
              const ts = s.trips.filter((t) => t.riderId === r.id && t.status === 'completed')
              return (
                <tr key={r.id} className="hover:bg-mist/40">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={r.name} color={r.color} size={34} />
                      <span className="font-semibold">
                        {r.name} {r.id === s.me.riderId && <Badge tone="lime">أنت</Badge>}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-mute">
                    <span className="block" dir="ltr">
                      {r.phone}
                    </span>
                    <span className="block" dir="ltr">
                      {r.email}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tnum">{ts.length}</td>
                  <td className="px-4 py-2.5 tnum">{money(ts.reduce((a, t) => a + t.fare + t.tip, 0))}</td>
                  <td className="px-4 py-2.5 tnum">{money(r.wallet)}</td>
                  <td className="px-4 py-2.5">
                    <RatingPill value={r.rating} />
                  </td>
                  <td className="px-4 py-2.5 text-mute tnum">{day(r.joinedAt)}</td>
                  <td className="px-4 py-2.5">{r.blocked ? <Badge tone="bad">محظور</Badge> : <Badge tone="ok">نشط</Badge>}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleRiderBlock(r.id)} className={`flex items-center gap-1 text-xs font-semibold hover:underline ${r.blocked ? 'text-ok' : 'text-bad'}`}>
                      {r.blocked ? <ShieldCheck size={15} /> : <ShieldBan size={15} />}
                      {r.blocked ? 'إلغاء الحظر' : 'حظر'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

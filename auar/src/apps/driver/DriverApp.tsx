import { useEffect, useRef, useState } from 'react'
import { Menu, Shield, MessageCircle, Phone, X, Navigation, Send, Check, Flame, Home, Wallet, Inbox, User, Delete, CornerUpLeft, CornerUpRight, ArrowUp, MapPin } from 'lucide-react'
import { Map, type MapCar } from '../../components/Map'
import { Avatar, Btn, RatingPill, StatusBar, Stars, PaymentIcon, PAY_LABEL } from '../../components/ui'
import { MAJOR_H, MAJOR_V, slice, pathLength, KM_PER_UNIT, routeKm, kmToMin, route as routeLocal, type Point } from '../../lib/geo'
import { money, km, mins, clock } from '../../lib/format'
import { commissionOf } from '../../lib/pricing'
import {
  acceptOffer, cancelTrip, completeTrip, declineOffer, driverPose, etaMin, markArrived, rateRider, sendChat, setOnline, startTrip, tripProgress, useNow, useStore, useSession, getMode,
} from '../../store/store'
import type { Trip } from '../../store/types'
import { Loading } from '../../components/PhoneOtp'
import { DriverAuth, DriverPending, Earnings, DriverInbox, DriverAccount } from './DriverPages'

type Tab = 'home' | 'earnings' | 'inbox' | 'account'

export function DriverApp() {
  const s = useStore()
  const now = useNow(250)
  const [tab, setTab] = useState<Tab>('home')
  const [doneId, setDoneId] = useState<string | null>(null)
  const me = s.drivers.find((d) => d.id === s.me.driverId)
  const session = useSession('driver')

  const active = me ? s.trips.find((t) => t.driverId === me.id && ['accepted', 'arrived', 'in_progress'].includes(t.status)) : undefined
  const offer = me ? s.trips.find((t) => t.status === 'searching' && t.offeredTo === me.id) : undefined

  // when an active trip completes, show the summary
  const lastActive = useRef<string | null>(null)
  useEffect(() => {
    if (active) lastActive.current = active.id
    else if (lastActive.current) {
      const t = s.trips.find((x) => x.id === lastActive.current)
      if (t?.status === 'completed') setDoneId(t.id)
      lastActive.current = null
    }
  }, [active?.id, s.trips])

  if (session.loading) return <Loading dark />
  if (getMode() === 'remote' && session.signedIn && !s.me.driverId) return <DriverAuth key="register" registering />
  if (!s.me.driverSignedIn || !me) return <DriverAuth />
  if (me.status !== 'active') return <DriverPending />

  const done = doneId ? s.trips.find((t) => t.id === doneId) : undefined
  if (done) return <TripSummary trip={done} onClose={() => setDoneId(null)} />
  if (active) return <ActiveTrip trip={active} />

  const today = s.trips.filter((t) => t.driverId === me.id && t.status === 'completed' && t.completedAt && now - t.completedAt < 86400000)
  const todayNet = today.reduce((a, t) => a + t.fare - t.commission + t.tip, 0)
  const pose = driverPose(me, s, now)
  const others: MapCar[] = s.drivers
    .filter((d) => d.online && d.id !== me.id && d.status === 'active')
    .slice(0, 10)
    .map((d) => {
      const p = driverPose(d, s, now)
      return { id: d.id, p: p.p, a: p.a, color: '#3a3c38', dim: true }
    })
  const demand = s.trips.filter((t) => t.status === 'searching' || (t.requestedAt > now - 3600000 * 3)).map((t) => t.pickup.p).slice(0, 12)

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink text-white">
      <StatusBar dark />
      {tab === 'home' && (
        <>
          <div className="absolute inset-0 bottom-[68px]">
            <Map
              dark
              focus={offer ? [pose.p, offer.pickup.p, offer.dropoff.p] : [pose.p]}
              inset={offer ? 0.62 : 0.3}
              minSpan={offer ? 300 : 360}
              cars={[...others, { id: me.id, p: pose.p, a: pose.a, color: '#c8f31d', focus: true }]}
              heat={me.online && !offer ? demand : undefined}
              route={offer ? offer.path : undefined}
              approach={offer ? routeFrom(pose.p, offer.pickup.p) : undefined}
              pickup={offer ? { p: offer.pickup.p } : undefined}
              dropoff={offer ? { p: offer.dropoff.p } : undefined}
              pois={false}
            />
          </div>
          <div className="absolute inset-x-0 top-12 z-20 flex items-center justify-between px-4">
            <button onClick={() => setTab('account')} className="grid h-11 w-11 place-items-center rounded-full bg-ink-2 shadow-lg" aria-label="القائمة">
              <Menu size={20} />
            </button>
            <button onClick={() => setTab('earnings')} className="rounded-full bg-ink-2 px-5 py-2 shadow-lg">
              <span className="block text-center text-[11px] text-white/50">اليوم</span>
              <span className="block text-lg font-bold leading-tight tnum">{money(todayNet)}</span>
            </button>
            <button className="grid h-11 w-11 place-items-center rounded-full bg-ink-2 shadow-lg" aria-label="الأمان">
              <Shield size={19} className="text-sky" />
            </button>
          </div>
          {s.settings.surgeOn && me.online && !offer && (
            <div className="absolute inset-x-4 top-28 z-20 flex items-center gap-2 rounded-2xl bg-[#ff6b2c] px-4 py-2.5 text-sm font-semibold text-white">
              <Flame size={18} /> الطلب مرتفع — الأسعار ×{s.settings.surge} في المدينة
            </div>
          )}

          {!offer && (
            <div className="absolute inset-x-0 bottom-[68px] z-20">
              <div className="flex justify-center pb-4">
                <button
                  onClick={() => setOnline(!me.online)}
                  className={`grid h-[74px] w-[74px] place-items-center rounded-full text-lg font-bold shadow-[0_8px_30px_rgba(0,0,0,.5)] ring-4 transition ${me.online ? 'bg-bad text-white ring-bad/30' : 'bg-lime text-ink ring-lime/30'}`}
                >
                  {me.online ? 'إيقاف' : 'اتصل'}
                </button>
              </div>
              <div className="rounded-t-[26px] bg-ink-2 px-5 pb-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="w-8" />
                  <div className="text-center">
                    <p className="text-[18px] font-bold">{me.online ? 'أنت متصل' : 'أنت غير متصل'}</p>
                    <p className="text-[13px] text-white/55">{me.online ? 'جارٍ البحث عن رحلات قريبة…' : 'اتصل لتبدأ باستقبال الطلبات'}</p>
                  </div>
                  <span className="w-8" />
                </div>
                {me.online && (
                  <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                    <span className="search-bar absolute inset-y-0 w-1/3 rounded-full bg-lime" />
                  </div>
                )}
              </div>
            </div>
          )}
          {offer && <OfferCard trip={offer} now={now} />}
        </>
      )}
      {tab === 'earnings' && <Earnings />}
      {tab === 'inbox' && <DriverInbox />}
      {tab === 'account' && <DriverAccount />}

      <nav className="absolute inset-x-0 bottom-0 z-30 grid h-[68px] grid-cols-4 border-t border-white/10 bg-ink pb-2">
        {(
          [
            ['home', 'الرئيسية', Home],
            ['earnings', 'الأرباح', Wallet],
            ['inbox', 'الوارد', Inbox],
            ['account', 'الحساب', User],
          ] as [Tab, string, typeof Home][]
        ).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${tab === k ? 'text-white' : 'text-white/45'}`}>
            <I size={21} />
            {l}
          </button>
        ))}
      </nav>
    </div>
  )
}

const routeFrom = (a: Point, b: Point) => routeLocal(a, b)

/* ───────────── incoming request ───────────── */

function OfferCard({ trip, now }: { trip: Trip; now: number }) {
  const s = useStore()
  const me = s.drivers.find((d) => d.id === s.me.driverId)!
  const rider = s.riders.find((r) => r.id === trip.riderId)
  const total = s.settings.offerSec * 1000
  const left = Math.max(0, total - (now - (trip.offerAt ?? now)))
  const frac = left / total
  const pickKm = routeKm(routeLocal(driverPose(me, s, now).p, trip.pickup.p))
  const net = trip.fare - commissionOf(trip.fare, s.settings)
  const cat = s.categories.find((c) => c.id === trip.category)!
  return (
    <div className="slide-up absolute inset-x-0 bottom-[68px] z-30 rounded-t-[26px] bg-ink-2 px-5 pb-5 pt-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold" dir="auto">
          {cat.name}
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-white/60">
          {rider && <RatingPill value={rider.rating} dark />}
          {trip.payment === 'cash' ? 'نقداً' : 'دفع إلكتروني'}
        </span>
      </div>
      <p className="mt-3 text-center text-[40px] font-bold leading-none tnum">{money(net)}</p>
      <p className="mt-1 text-center text-[13px] text-white/55">
        صافي ربحك {trip.surge > 1 && <span className="font-semibold text-[#ff8a4c]">• يشمل ×{trip.surge}</span>}
      </p>
      <div className="mt-4 flex gap-3 rounded-2xl bg-white/5 p-3.5">
        <div className="flex flex-col items-center py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
          <span className="my-1 w-px flex-1 bg-white/30" />
          <span className="h-2.5 w-2.5 bg-white" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[13px] text-white/55 tnum">
              {mins(kmToMin(pickKm))} ({km(pickKm)}) للوصول
            </p>
            <p className="truncate font-semibold">{trip.pickup.name}</p>
          </div>
          <div>
            <p className="text-[13px] text-white/55 tnum">
              رحلة {mins(trip.durationMin)} ({km(trip.distanceKm)})
            </p>
            <p className="truncate font-semibold">{trip.dropoff.name}</p>
          </div>
        </div>
      </div>
      {trip.note && <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-[13px] text-white/70">ملاحظة: {trip.note}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={() => declineOffer(trip.id)} className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10" aria-label="رفض">
          <X size={24} />
        </button>
        <button onClick={() => acceptOffer(trip.id)} className="relative h-14 flex-1 overflow-hidden rounded-2xl bg-lime text-lg font-bold text-ink">
          <span className="absolute inset-y-0 right-0 bg-lime-2 transition-[width] duration-300 ease-linear" style={{ width: `${(1 - frac) * 100}%` }} />
          <span className="relative">قبول • {Math.ceil(left / 1000)}</span>
        </button>
      </div>
    </div>
  )
}

/* ───────────── active trip ───────────── */

function navHint(path: Point[], from: number): { icon: typeof ArrowUp; text: string; dist: string } {
  const rest = slice(path, from)
  if (rest.length < 2) return { icon: MapPin, text: 'وصلت إلى الوجهة', dist: '' }
  const a = rest[0]
  const b = rest[1]
  const segKm = Math.hypot(b.x - a.x, b.y - a.y) * KM_PER_UNIT
  const road = a.x === b.x ? MAJOR_V.find((r) => r.x === a.x)?.name : MAJOR_H.find((r) => r.y === a.y)?.name
  if (rest.length === 2) return { icon: MapPin, text: 'الوجهة على الطريق أمامك', dist: km(segKm) }
  const c = rest[2]
  const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
  const nextRoad = b.x === c.x ? MAJOR_V.find((r) => r.x === b.x)?.name : MAJOR_H.find((r) => r.y === b.y)?.name
  return { icon: cross > 0 ? CornerUpRight : CornerUpLeft, text: `انعطف ${cross > 0 ? 'يميناً' : 'يساراً'} إلى ${nextRoad ?? road ?? 'الشارع التالي'}`, dist: segKm < 1 ? `${Math.round(segKm * 1000 / 50) * 50} م` : km(segKm) }
}

function ActiveTrip({ trip }: { trip: Trip }) {
  const s = useStore()
  const now = useNow(250)
  const me = s.drivers.find((d) => d.id === s.me.driverId)!
  const rider = s.riders.find((r) => r.id === trip.riderId)!
  const pose = driverPose(me, s, now)
  const prog = tripProgress(trip, s.settings, now)
  const eta = etaMin(trip, s.settings, now)
  const [panel, setPanel] = useState<null | 'pin' | 'chat' | 'cancel' | 'call'>(null)
  const nav = trip.status === 'accepted' ? navHint(trip.approach, prog) : trip.status === 'in_progress' ? navHint(trip.path, prog) : null
  const NavI = nav?.icon ?? ArrowUp
  const leftKm = trip.status === 'accepted' ? (pathLength(trip.approach) * (1 - prog) * KM_PER_UNIT) : trip.distanceKm * (1 - prog)
  const waitSec = trip.arrivedAt ? Math.max(0, Math.floor((now - trip.arrivedAt) / 1000)) : 0

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink text-white">
      <StatusBar dark />
      <div className="absolute inset-0">
        <Map
          dark
          focus={trip.status === 'in_progress' ? [pose.p, trip.dropoff.p] : [pose.p, trip.pickup.p]}
          inset={0.42}
          insetTop={0.2}
          minSpan={220}
          route={trip.status === 'in_progress' ? slice(trip.path, prog) : undefined}
          approach={trip.status === 'accepted' ? slice(trip.approach, prog) : undefined}
          pickup={trip.status !== 'in_progress' ? { p: trip.pickup.p, label: trip.pickup.name } : undefined}
          dropoff={trip.status === 'in_progress' ? { p: trip.dropoff.p, label: trip.dropoff.name } : undefined}
          cars={[{ id: me.id, p: pose.p, a: pose.a, color: '#c8f31d', focus: true }]}
          pois={false}
        />
      </div>
      {nav && (
        <div className="absolute inset-x-3 top-12 z-20 flex items-center gap-3 rounded-2xl bg-[#1e7a46] px-4 py-3 shadow-xl">
          <NavI size={30} strokeWidth={2.6} />
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-bold tnum">{nav.dist}</p>
            <p className="truncate text-[14px] text-white/85">{nav.text}</p>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-[26px] bg-ink-2 px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[20px] font-bold">
              {trip.status === 'accepted' ? `${mins(eta)} • ${km(leftKm)}` : trip.status === 'arrived' ? 'بانتظار الراكب' : `${mins(eta)} • ${km(leftKm)}`}
            </p>
            <p className="text-[13px] text-white/55">
              {trip.status === 'accepted' ? `الالتقاء بـ ${rider.name.split(' ')[0]}` : trip.status === 'arrived' ? `مدة الانتظار ${Math.floor(waitSec / 60)}:${String(waitSec % 60).padStart(2, '0')}` : `توصيل ${rider.name.split(' ')[0]} • الوصول ${clock(now + eta * 60000)}`}
            </p>
          </div>
          <Navigation size={22} className="text-lime" />
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <Avatar name={rider.name} color={rider.color} size={46} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{rider.name}</p>
            <p className="flex items-center gap-1.5 truncate text-[13px] text-white/55">
              <RatingPill value={rider.rating} dark /> {trip.status === 'in_progress' ? trip.dropoff.name : trip.pickup.name}
            </p>
          </div>
          <button onClick={() => setPanel('chat')} className="relative grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="رسالة">
            <MessageCircle size={19} />
            {trip.chat.length > 0 && trip.chat[trip.chat.length - 1].from === 'rider' && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-lime" />}
          </button>
          <button onClick={() => setPanel('call')} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="اتصال">
            <Phone size={19} />
          </button>
        </div>
        {trip.note && <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-[13px] text-white/70">ملاحظة الراكب: {trip.note}</p>}
        <div className="mt-4 flex gap-2">
          {trip.status !== 'in_progress' && (
            <button onClick={() => setPanel('cancel')} className="h-14 rounded-2xl bg-white/10 px-4 text-[15px] font-semibold">
              إلغاء
            </button>
          )}
          {trip.status === 'accepted' && (
            <Btn variant="lime" size="lg" className="flex-1" onClick={() => markArrived(trip.id)}>
              وصلت لنقطة الالتقاء
            </Btn>
          )}
          {trip.status === 'arrived' && (
            <Btn variant="lime" size="lg" className="flex-1" onClick={() => setPanel('pin')}>
              بدء الرحلة
            </Btn>
          )}
          {trip.status === 'in_progress' && (
            <Btn variant={prog > 0.85 ? 'lime' : 'light'} size="lg" className="flex-1" onClick={() => completeTrip(trip.id)}>
              إنهاء الرحلة {prog <= 0.85 && <span className="text-sm font-normal opacity-60">(قبل الوصول)</span>}
            </Btn>
          )}
        </div>
      </div>
      {panel && <DriverOverlay trip={trip} panel={panel} onClose={() => setPanel(null)} riderName={rider.name} />}
    </div>
  )
}

function DriverOverlay({ trip, panel, onClose, riderName }: { trip: Trip; panel: 'pin' | 'chat' | 'cancel' | 'call'; onClose: () => void; riderName: string }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [trip.chat.length])

  if (panel === 'chat')
    return (
      <div className="fade-in absolute inset-0 z-50 flex flex-col bg-ink pt-12">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 pb-3">
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="إغلاق">
            <X size={22} />
          </button>
          <p className="flex-1 font-bold">{riderName}</p>
        </div>
        <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
          {trip.chat.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'driver' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] ${m.from === 'driver' ? 'bg-lime text-ink' : 'bg-white/10'}`}>{m.text}</div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {['أنا في الطريق', 'وصلت، بانتظارك', 'الزحام شديد، دقائق وأصل', 'أين تقف بالضبط؟'].map((q) => (
            <button key={q} onClick={() => sendChat(trip.id, 'driver', q)} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[13px]">
              {q}
            </button>
          ))}
        </div>
        <form className="flex gap-2 border-t border-white/10 p-3 pb-6" onSubmit={(e) => { e.preventDefault(); sendChat(trip.id, 'driver', text); setText('') }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب رسالة…" className="h-12 flex-1 rounded-full bg-white/10 px-4 text-white outline-none" />
          <button className="grid h-12 w-12 place-items-center rounded-full bg-lime text-ink" aria-label="إرسال">
            <Send size={18} className="-scale-x-100" />
          </button>
        </form>
      </div>
    )

  return (
    <div className="fade-in absolute inset-0 z-50 bg-black/60" onClick={onClose}>
      <div className="slide-up absolute inset-x-0 bottom-0 rounded-t-[26px] bg-ink-2 px-5 pb-7 pt-5" onClick={(e) => e.stopPropagation()}>
        {panel === 'pin' && (
          <>
            <h3 className="text-center text-lg font-bold">اطلب رمز التحقق من الراكب</h3>
            <p className="mt-1 text-center text-sm text-white/55">يظهر الرمز في تطبيق الراكب — للتأكد من أنه الشخص الصحيح</p>
            <div className="mt-4 flex justify-center gap-2" dir="ltr">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`grid h-14 w-12 place-items-center rounded-xl text-2xl font-bold tnum ${err ? 'bg-bad/30' : 'bg-white/10'}`}>
                  {pin[i] ?? ''}
                </span>
              ))}
            </div>
            {err && <p className="mt-2 text-center text-sm text-[#ff7a93]">الرمز غير صحيح</p>}
            <div className="mt-4 grid grid-cols-3 gap-2" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) =>
                k === '' ? (
                  <span key="sp" />
                ) : (
                  <button
                    key={k}
                    onClick={() => {
                      setErr(false)
                      if (k === 'del') return setPin((p) => p.slice(0, -1))
                      const next = (pin + k).slice(0, 4)
                      setPin(next)
                      if (next.length === 4) {
                        startTrip(trip.id, next)
                          .then((ok) => {
                            if (ok) onClose()
                            else {
                              setErr(true)
                              setPin('')
                            }
                          })
                          .catch(() => {
                            setErr(true)
                            setPin('')
                          })
                      }
                    }}
                    className="h-14 rounded-xl bg-white/5 text-xl font-semibold hover:bg-white/10"
                  >
                    {k === 'del' ? <Delete className="mx-auto" /> : k}
                  </button>
                ),
              )}
            </div>
          </>
        )}
        {panel === 'call' && (
          <div className="text-center">
            <h3 className="text-lg font-bold">اتصال بـ {riderName.split(' ')[0]}</h3>
            <p className="mt-1 text-sm text-white/55">الاتصال عبر رقم وسيط يحمي خصوصيتك وخصوصية الراكب.</p>
            <Btn variant="lime" full size="lg" className="mt-5" onClick={onClose}>
              <Phone size={18} /> اتصال
            </Btn>
          </div>
        )}
        {panel === 'cancel' && (
          <>
            <h3 className="text-lg font-bold">سبب الإلغاء</h3>
            <p className="mt-1 text-sm text-white/55">الإلغاء المتكرر يؤثر على معدل قبولك.</p>
            <div className="mt-3 space-y-1.5">
              {['الراكب لم يحضر', 'عدد الركاب أكثر من المسموح', 'الراكب طلب الإلغاء', 'مشكلة في السيارة', 'شعرت بعدم الأمان'].map((r) => (
                <button key={r} onClick={() => { cancelTrip(trip.id, 'driver', r); onClose() }} className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-start text-[15px] hover:bg-white/10">
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TripSummary({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const s = useStore()
  const rider = s.riders.find((r) => r.id === trip.riderId)!
  const [stars, setStars] = useState(5)
  const net = trip.fare - trip.commission
  return (
    <div className="relative flex h-full flex-col bg-ink text-white">
      <StatusBar dark />
      <div className="flex-1 overflow-y-auto px-6 pt-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-ink">
          <Check size={30} />
        </div>
        <h2 className="mt-4 text-2xl font-bold">اكتملت الرحلة</h2>
        {trip.payment === 'cash' ? (
          <div className="mt-5 rounded-3xl bg-white p-5 text-ink">
            <p className="text-sm font-semibold text-mute">حصّل من الراكب نقداً</p>
            <p className="mt-1 text-5xl font-bold tnum">{money(trip.fare)}</p>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl bg-white/5 p-5">
            <p className="flex items-center justify-center gap-2 text-sm text-white/60">
              <PaymentIcon m={trip.payment} /> دُفعت عبر {PAY_LABEL[trip.payment]}
            </p>
            <p className="mt-2 text-5xl font-bold tnum">{money(trip.fare)}</p>
          </div>
        )}
        <div className="mt-4 space-y-2 rounded-2xl bg-white/5 p-4 text-[14px]">
          <div className="flex justify-between">
            <span className="text-white/55">الأجرة</span>
            <span className="tnum">{money(trip.fare, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/55">عمولة AUAR ({Math.round(s.settings.commission * 100)}٪)</span>
            <span className="tnum">- {money(trip.commission, true)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
            <span>صافي ربحك</span>
            <span className="text-lime tnum">{money(net, true)}</span>
          </div>
        </div>
        <p className="mt-6 font-semibold">قيّم {rider.name.split(' ')[0]}</p>
        <div className="mt-2 [&_svg.fill-ink]:fill-lime [&_svg.fill-ink]:text-lime">
          <Stars value={stars} onChange={setStars} size={36} />
        </div>
      </div>
      <div className="p-5 pb-7">
        <Btn variant="lime" full size="lg" onClick={() => { rateRider(trip.id, stars); onClose() }}>
          تم — متابعة استقبال الطلبات
        </Btn>
      </div>
    </div>
  )
}


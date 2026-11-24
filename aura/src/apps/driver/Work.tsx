import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Bell, Banknote, CornerUpLeft, CornerUpRight, CreditCard, Eye, Headphones, MessageSquare, Navigation, Phone, Power, Satellite, Star, TriangleAlert } from 'lucide-react'
import { CityMap, type MapMarker } from '../../map/CityMap'
import { Avatar, Badge, Button, CountdownRing, cx, ICON, IconButton, Money, OtpInput, Sheet, Stars, SuccessMark, Surface, useToast } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { actions, earningsFor, getCustomer, legEtaMinutes, legProgress, store, tripDriverPose, useEco, useNow } from '../../core/store'
import { haversineKm, pathKm, remainingRoute, ROADS } from '../../core/geo'
import { classById } from '../../core/pricing'
import { sar, startOfDay } from '../../core/format'
import type { Driver, LatLng, Trip } from '../../core/types'
import { ChatSheet, CancelSheet } from '../passenger/LiveTrip'
import { PAYMENT_LABEL } from '../passenger/Booking'

/* ============================== HOME ============================== */

export function DriverHome({ driver, onInbox, inboxCount, onPerformance }: { driver: Driver; onInbox: () => void; inboxCount: number; onPerformance: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const pos = useEco((s) => s.positions[driver.id]) ?? { lat: 24.7372, lng: 46.6598 }
  const zones = useEco((s) => s.zones.filter((z) => z.active && z.kind === 'high_demand' && z.cityId === 'riyadh'))
  const rev = useEco((s) => s.rev)
  const today = useMemo(() => earningsFor(driver.id, startOfDay()), [driver.id, rev])
  const [toggling, setToggling] = useState(false)
  const online = driver.online
  const offer = useEco((s) => s.trips.find((x) => x.status === 'searching' && x.offer?.driverId === driver.id && x.offer.expiresAt > Date.now()))

  const toggle = () => {
    setToggling(true)
    setTimeout(() => {
      actions.setOnline(driver.id, !online)
      setToggling(false)
      toast(online ? t('أنت الآن غير متصل', 'You are offline') : t('أنت متصل الآن وتستقبل الطلبات', 'You are online and receiving trips'), online ? 'info' : 'success')
    }, 500)
  }

  const markers: MapMarker[] = [{ id: 'me', pos, kind: 'car', active: online, tone: online ? 'go' : 'white' }]
  return (
    <div className="absolute inset-0">
      <CityMap theme="dark" center={pos} zoom={online ? 75 : 95} markers={markers} zones={online ? zones.map((z) => ({ id: z.id, center: z.center, radiusKm: z.radiusKm, kind: z.kind, label: `${L(z.name)} ×${z.multiplier}` })) : []} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4" style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}>
        <IconButton tone="dark" label={t('الإشعارات', 'Notifications')} onClick={onInbox} className="pointer-events-auto relative">
          <Bell size={19} {...ICON} />
          {inboxCount > 0 && <span className="absolute top-2 end-2.5 size-2 rounded-full bg-go" />}
        </IconButton>
        <div className="pointer-events-auto flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-full bg-ink-2 px-4 py-2 text-white ring-1 ring-white/8">
            <span className="text-[11px] text-white/50">{t('اليوم', 'Today')}</span>
            <Money h={today.net} size="md" />
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-ink-2/90 px-2.5 py-1 text-[10.5px] font-semibold text-white/70 ring-1 ring-white/8">
            <Satellite size={12} className="text-go" /> GPS {t('قوي', 'strong')} · {t('موقع تجريبي', 'demo location')}
          </span>
        </div>
        <IconButton tone="dark" label={t('الأداء', 'Performance')} onClick={onPerformance} className="pointer-events-auto">
          <Star size={19} {...ICON} />
        </IconButton>
      </div>

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-ink-2 px-4 pt-4 text-white ring-1 ring-white/6" style={{ paddingBottom: 12 }}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className={cx('size-2.5 rounded-full', online ? 'animate-pulse bg-go' : 'bg-white/25')} />
          <p className="flex-1 font-display text-[17px] font-semibold">{online ? t('متصل · تستقبل الطلبات', 'Online · receiving trips') : t('غير متصل', "You're offline")}</p>
          {online && <Badge tone="live">{t('بانتظار طلب', 'Waiting for trips')}</Badge>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label={t('رحلات اليوم', 'Trips today')} value={String(today.count)} />
          <Kpi label={t('دخل اليوم', 'Earned today')} value={sar(today.net, 0)} unit="SAR" />
          <Kpi label={t('التقييم', 'Rating')} value={driver.rating.toFixed(2)} unit="★" />
        </div>
        <button
          onClick={toggle}
          disabled={toggling}
          className={cx('mt-3 flex h-16 w-full items-center justify-center gap-3 rounded-2xl font-display text-lg font-semibold transition active:scale-[0.99]', online ? 'bg-ink-4 text-white' : 'bg-go text-ink')}
          aria-pressed={online}
        >
          <Power size={22} strokeWidth={2.2} className={toggling ? 'animate-spin' : ''} />
          {online ? t('إنهاء الاتصال', 'Go offline') : t('اتصل الآن', 'Go online')}
        </button>
        {!online && <p className="mt-2 text-center text-[11.5px] text-white/45">{t('اتصل لاستقبال الطلبات القريبة منك', 'Go online to receive nearby requests')}</p>}
      </div>

      <Surface tone="light">
        <AnimatePresence>{offer && <OfferCard key={offer.id} trip={offer} driver={driver} pos={pos} />}</AnimatePresence>
      </Surface>
    </div>
  )
}

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-ink-3 px-3 py-2.5">
      <p className="num text-[19px] font-semibold leading-tight" dir="ltr" style={{ textAlign: 'start' }}>
        {value}
        {unit && <span className="ms-1 text-[10px] text-white/45">{unit}</span>}
      </p>
      <p className="text-[11px] text-white/50">{label}</p>
    </div>
  )
}

/* ============================== OFFER ============================== */

function OfferCard({ trip, driver, pos }: { trip: Trip; driver: Driver; pos: LatLng }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const now = useNow(250)
  const total = store.state.settings.offerSeconds
  const left = Math.max(0, ((trip.offer?.expiresAt ?? now) - now) / 1000)
  const toRiderKm = haversineKm(pos, trip.pickup.pos) * 1.2
  const toRiderMin = Math.max(2, Math.round((toRiderKm / 30) * 60))
  const rider = getCustomer(trip.passengerId)
  useEffect(() => {
    // gentle haptic where supported
    ;(navigator as Navigator & { vibrate?: (p: number[]) => void }).vibrate?.([80, 60, 80])
  }, [])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex flex-col justify-end bg-black/55">
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} className="rounded-t-[30px] bg-white px-5 pt-5 text-ink" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }} role="alertdialog" aria-label={t('طلب رحلة جديد', 'New trip request')}>
        <div className="flex items-start justify-between">
          <div>
            <Badge tone="live" dot>
              {t('طلب جديد', 'New request')} · <span dir="ltr">{classById(trip.vehicleClass).name}</span>
            </Badge>
            <p className="mt-2 text-[12px] text-mute">{t('العائد المتوقع لك', 'Your expected earning')}</p>
            <Money h={trip.fare.driverNet} size="xl" />
            <p className="mt-1 text-[11px] text-mute">
              {t('بعد عمولة المنصة', 'After platform commission')} {Math.round(trip.fare.commissionRate * 100)}% · {L(PAYMENT_LABEL[trip.paymentMethod])}
            </p>
          </div>
          <CountdownRing total={total} left={left} size={64} />
        </div>
        <div className="mt-4 flex gap-3">
          <div className="flex flex-col items-center pt-1.5">
            <span className="size-3 rounded-full border-[3px] border-ink" />
            <span className="my-1 w-0.5 flex-1 bg-go" />
            <span className="size-3 rounded-[3px] bg-ink" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[15px] font-semibold">{L(trip.pickup.name)}</p>
              <p className="num text-[12px] text-mute">
                {toRiderKm.toFixed(1)} {t('كم', 'km')} · {toRiderMin} {t('د إلى الراكب', 'min to rider')} {rider && <>· ★ {rider.rating.toFixed(1)}</>}
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold">{L(trip.dropoff.name)}</p>
              <p className="num text-[12px] text-mute">
                {trip.fare.distanceKm} {t('كم', 'km')} · {trip.fare.durationMin} {t('دقيقة', 'min')}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_2fr] gap-2">
          <Button
            variant="secondary"
            size="xl"
            onClick={() => {
              actions.declineOffer(trip.id, driver.id)
              toast(t('تم رفض الطلب', 'Request declined'), 'info')
            }}
          >
            {t('رفض', 'Decline')}
          </Button>
          <Button
            size="xl"
            onClick={() => {
              if (!actions.acceptOffer(trip.id, driver.id)) toast(t('انتهت صلاحية الطلب', 'Request expired'), 'error')
            }}
          >
            {t('قبول', 'Accept')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================== ACTIVE TRIP ============================== */

function instruction(route: LatLng[], t: (a: string, e: string) => string) {
  if (route.length < 2) return { icon: <ArrowUp size={30} />, text: t('تابع على المسار', 'Continue on route'), road: '' }
  const a = route[0]
  const b = route[1]
  const c = route[2]
  const near = ROADS.map((r) => ({ r, d: Math.min(...r.pts.map(([lat, lng]) => haversineKm(a, { lat, lng }))) })).sort((x, y) => x.d - y.d)[0]
  const dist = haversineKm(a, b)
  if (!c || dist > 0.6) {
    const dirN = Math.abs(b.lat - a.lat) > Math.abs(b.lng - a.lng) ? (b.lat > a.lat ? t('شمالاً', 'north') : t('جنوباً', 'south')) : b.lng > a.lng ? t('شرقاً', 'east') : t('غرباً', 'west')
    return { icon: <ArrowUp size={30} />, text: `${t('اتجه', 'Head')} ${dirN}`, road: `${dist.toFixed(1)} ${t('كم', 'km')} · ${t(near.r.name.ar, near.r.name.en)}` }
  }
  const cross = (b.lng - a.lng) * (c.lat - b.lat) - (b.lat - a.lat) * (c.lng - b.lng)
  const right = cross < 0
  return { icon: right ? <CornerUpRight size={30} /> : <CornerUpLeft size={30} />, text: `${t('بعد', 'In')} ${Math.round(dist * 1000)} ${t('م انعطف', 'm turn')} ${right ? t('يميناً', 'right') : t('يساراً', 'left')}`, road: t(near.r.name.ar, near.r.name.en) }
}

export function DriverActiveTrip({ trip, driver }: { trip: Trip; driver: Driver }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const now = useNow(500)
  const [sheet, setSheet] = useState<null | 'chat' | 'cancel' | 'support' | 'end'>(null)
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState(false)
  const [reveal, setReveal] = useState(false)
  const rider = getCustomer(trip.passengerId)
  const pose = tripDriverPose(trip, now)
  const prog = legProgress(trip, now)
  const eta = legEtaMinutes(trip, now)
  const route = trip.leg ? remainingRoute(trip.leg.route, prog) : [pose.pos]
  const remainKm = pathKm(route) * 1.12
  const ins = instruction(route, t)
  const onTrip = trip.status === 'in_progress'
  const arrived = trip.status === 'driver_arrived'
  const unread = (trip.chat ?? []).filter((m) => m.from === 'passenger').length

  useEffect(() => {
    if (!arrived || code.length < 4) return
    if (actions.startTrip(trip.id, code)) toast(t('تم التحقق. الرحلة بدأت', 'Verified. Trip started'))
    else setCodeErr(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <div className="absolute inset-0">
      <CityMap
        theme="dark"
        fit={arrived ? [trip.pickup.pos] : onTrip ? [pose.pos, trip.dropoff.pos] : [pose.pos, trip.pickup.pos]}
        fitKey={trip.status}
        padding={[200, 50, 330, 50]}
        routes={arrived ? [] : [{ id: 'r', pts: route, width: 7 }]}
        markers={[onTrip ? { id: 'd', pos: trip.dropoff.pos, kind: 'dropoff' } : { id: 'p', pos: trip.pickup.pos, kind: 'pickup', pulse: arrived }, { id: 'me', pos: pose.pos, kind: 'car', heading: pose.heading, tone: 'go', active: true }]}
      />
      {!arrived && (
        <div className="absolute inset-x-3 flex items-center gap-3 rounded-2xl bg-go px-4 py-3.5 text-ink shadow-xl" style={{ top: 'calc(var(--safe-top) + 6px)' }}>
          <span className="rtl:-scale-x-100">{ins.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[18px] font-semibold leading-tight">{ins.text}</p>
            <p className="truncate text-[12px] opacity-70">{ins.road}</p>
          </div>
          <Navigation size={18} className="opacity-60" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-ink-2 px-4 pt-4 text-white ring-1 ring-white/6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        {arrived ? (
          <>
            <p className="text-center font-display text-lg font-semibold">{t('تحقق من الراكب', 'Verify the rider')}</p>
            <p className="mt-1 text-center text-[12.5px] text-white/55">{t(`اطلب من ${rider ? L(rider.name).split(' ')[0] : 'الراكب'} رمز الرحلة المكوّن من ٤ أرقام`, `Ask ${rider ? L(rider.name).split(' ')[0] : 'the rider'} for their 4-digit trip code`)}</p>
            <div className="mt-4">
              <OtpInput value={code} onChange={(v) => { setCode(v); setCodeErr(false) }} invalid={codeErr} />
            </div>
            {codeErr && <p className="mt-2 text-center text-sm text-danger">{t('الرمز غير مطابق. تأكد من هوية الراكب.', 'Code does not match. Confirm the rider.')}</p>}
            <button onClick={() => setReveal(!reveal)} className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-white/45">
              <Eye size={14} /> {reveal ? <span className="num tracking-widest text-white">{trip.otp}</span> : t('تجريبي: إظهار رمز الراكب', 'Demo: reveal rider code')}
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="soft" onClick={() => setSheet('chat')} icon={<MessageSquare size={17} />}>
                {t('رسالة', 'Message')}
              </Button>
              <Button variant="soft" onClick={() => toast(t('الاتصال عبر رقم مُخفى غير مفعّل في التجربة', 'Masked calling not connected in demo'), 'info')} icon={<Phone size={17} />}>
                {t('اتصال', 'Call')}
              </Button>
              <Button variant="soft" onClick={() => setSheet('cancel')}>
                {t('إلغاء', 'Cancel')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar name={rider ? L(rider.name) : '?'} size={46} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{rider ? L(rider.name) : '—'}</p>
                <p className="truncate text-[12px] text-white/50">
                  {onTrip ? L(trip.dropoff.name) : L(trip.pickup.name)} · <span className="num">★ {rider?.rating.toFixed(1)}</span>
                </p>
              </div>
              <div className="text-end">
                <p className="num text-[22px] font-semibold leading-none text-go">
                  {eta}
                  <span className="ms-0.5 text-xs">{t('د', 'min')}</span>
                </p>
                <p className="num text-[11px] text-white/50">
                  {remainKm.toFixed(1)} {t('كم', 'km')}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {onTrip ? (
                <Button variant="soft" onClick={() => setSheet('support')} icon={<Headphones size={17} />}>
                  {t('الدعم', 'Support')}
                </Button>
              ) : (
                <Button variant="soft" onClick={() => toast(t('الاتصال عبر رقم مُخفى غير مفعّل في التجربة', 'Masked calling not connected in demo'), 'info')} icon={<Phone size={17} />}>
                  {t('اتصال', 'Call')}
                </Button>
              )}
              <Button variant="soft" onClick={() => setSheet('chat')} icon={<MessageSquare size={17} />} className="relative">
                {t('رسالة', 'Message')}
                {unread > 0 && <span className="absolute top-1 end-2 size-2 rounded-full bg-go" />}
              </Button>
              <Button variant="soft" onClick={() => (onTrip ? setSheet('support') : setSheet('cancel'))}>
                {onTrip ? t('بلاغ', 'Report') : t('إلغاء', 'Cancel')}
              </Button>
            </div>
            {onTrip ? (
              <Button size="xl" full className="mt-3" onClick={() => (prog >= 0.95 ? actions.completeTrip(trip.id) : setSheet('end'))}>
                {t('إنهاء الرحلة', 'End trip')}
              </Button>
            ) : (
              <Button size="xl" full className="mt-3" variant={prog >= 0.9 ? 'go' : 'primary'} onClick={() => actions.markArrived(trip.id)}>
                {t('وصلت إلى موقع الراكب', "I've arrived")}
              </Button>
            )}
          </>
        )}
      </div>

      <ChatSheet trip={trip} open={sheet === 'chat'} onClose={() => setSheet(null)} me="driver" />
      <CancelSheet trip={trip} actor="driver" open={sheet === 'cancel'} onClose={() => setSheet(null)} />
      <Sheet open={sheet === 'support'} onClose={() => setSheet(null)} title={t('الدعم أثناء الرحلة', 'In-trip support')}>
        <button onClick={() => toast(t('خط دعم الكباتن: غير مفعّل في التجربة', 'Captain hotline: not connected in demo'), 'info')} className="flex w-full items-center gap-3 rounded-2xl bg-ink-3 px-4 py-4 text-start">
          <Headphones size={20} className="text-go" />
          <span className="font-semibold">{t('الاتصال بدعم الكباتن', 'Call captain support')}</span>
        </button>
        <button
          onClick={() => {
            actions.createTicket({ requester: { kind: 'driver', id: driver.id }, subject: 'Incident reported during trip', category: 'report', tripId: trip.id, text: 'Captain reported an incident from the in-trip support menu.', priority: 'high' })
            toast(t('تم إرسال البلاغ', 'Report sent'))
            setSheet(null)
          }}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-ink-3 px-4 py-4 text-start"
        >
          <TriangleAlert size={20} className="text-danger" />
          <span className="font-semibold">{t('الإبلاغ عن حادثة أو سلوك', 'Report an incident or behaviour')}</span>
        </button>
      </Sheet>
      <Sheet open={sheet === 'end'} onClose={() => setSheet(null)} title={t('إنهاء الرحلة قبل الوجهة؟', 'End before destination?')}>
        <p className="text-sm text-white/60">{t('لم تصل إلى الوجهة بعد. السعر المتفق عليه لن يتغير. هل أنزلت الراكب؟', "You haven't reached the destination. The agreed price stays the same. Did the rider get out?")}</p>
        <Button full size="lg" className="mt-4" onClick={() => { actions.completeTrip(trip.id); setSheet(null) }}>
          {t('نعم، إنهاء الرحلة', 'Yes, end trip')}
        </Button>
      </Sheet>
    </div>
  )
}

/* ============================== SUMMARY ============================== */

export function DriverTripSummary({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [stars, setStars] = useState(5)
  const rider = getCustomer(trip.passengerId)
  const dur = Math.max(1, Math.round((trip.updatedAt - (trip.timeline.find((x) => x.status === 'in_progress')?.at ?? trip.createdAt)) / 60000))
  const cash = trip.paymentMethod === 'cash'
  return (
    <div className="absolute inset-0 flex flex-col bg-ink text-white">
      <div className="thin-scroll-dark flex-1 overflow-y-auto px-5" style={{ paddingTop: 'calc(var(--safe-top) + 18px)' }}>
        <div className="flex flex-col items-center text-center">
          <SuccessMark size={58} />
          <h1 className="mt-3 font-display text-[22px] font-semibold">{t('اكتملت الرحلة', 'Trip completed')}</h1>
          <p className="num text-xs text-white/45">{trip.id}</p>
        </div>
        <div className="mt-5 rounded-3xl bg-ink-2 p-5 ring-1 ring-white/6">
          <p className="text-xs text-white/50">{t('صافي مستحقاتك', 'Your net earning')}</p>
          <div className="mt-1 flex items-baseline gap-1.5" dir="ltr" style={{ justifyContent: 'flex-start' }}>
            <span className="num text-[44px] font-semibold leading-none text-go">{sar(trip.fare.driverNet)}</span>
            <span className="num text-sm font-semibold text-white/60">SAR</span>
          </div>
          <div className="mt-4 divide-y divide-white/8 text-sm">
            {[
              [t('المسافة', 'Distance'), `${trip.fare.distanceKm} ${t('كم', 'km')}`],
              [t('المدة', 'Duration'), `${trip.fare.durationMin} ${t('دقيقة', 'min')} · ${t('فعلية', 'actual')} ${dur}`],
              [t('قيمة الرحلة', 'Trip fare'), `${sar(trip.fare.subtotal)}`],
              [`${t('عمولة المنصة', 'Platform commission')} ${Math.round(trip.fare.commissionRate * 100)}%`, `−${sar(trip.fare.commission)}`],
              [t('صافي الكابتن', 'Captain net'), sar(trip.fare.driverNet)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5">
                <span className="text-white/55">{k}</span>
                <span className="num font-semibold" dir="ltr">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={cx('mt-3 flex items-center gap-3 rounded-2xl px-4 py-3', cash ? 'bg-go text-ink' : 'bg-ink-2')}>
          {cash ? <Banknote size={20} /> : <CreditCard size={20} className="text-go" />}
          <span className="flex-1 text-sm font-semibold">{cash ? t('استلم نقداً من الراكب', 'Collect cash from rider') : `${t('مدفوعة إلكترونياً', 'Paid electronically')} · ${L(PAYMENT_LABEL[trip.paymentMethod])}`}</span>
          {cash && <Money h={trip.fare.total} />}
        </div>
        <div className="mt-6 flex flex-col items-center">
          <p className="text-sm font-semibold">{t(`قيّم ${rider ? L(rider.name).split(' ')[0] : 'الراكب'}`, `Rate ${rider ? L(rider.name).split(' ')[0] : 'the rider'}`)}</p>
          <div className="mt-2">
            <Stars value={stars} onChange={setStars} size={34} />
          </div>
        </div>
      </div>
      <div className="px-5 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        <Button
          variant="go"
          size="xl"
          full
          onClick={() => {
            actions.rateRider(trip.id, { stars, tags: [] })
            toast(t('شكراً، أنت جاهز للرحلة التالية', 'Thanks, ready for the next trip'))
            onDone()
          }}
        >
          {t('تم', 'Done')}
        </Button>
      </div>
    </div>
  )
}

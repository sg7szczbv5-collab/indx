import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Phone, Send, Share2, ShieldCheck, Siren, Flag, X, MapPin, Receipt, ChevronDown } from 'lucide-react'
import { CityMap } from '../../map/CityMap'
import { Avatar, Badge, Button, cx, ICON, Input, Modal, Money, Sheet, Stars, SuccessMark, Surface, useToast } from '../../ds/ui'
import { CarArt, Plate } from '../../ds/vehicle'
import { useI18n } from '../../i18n/I18n'
import { actions, fleetSnapshot, getDriver, getVehicle, legEtaMinutes, legProgress, tripDriverPose, useNow } from '../../core/store'
import { CANCEL_REASONS, STATUS_LABEL } from '../../core/trip'
import { classById } from '../../core/pricing'
import { clock, sar } from '../../core/format'
import { haversineKm, pathKm, remainingRoute } from '../../core/geo'
import type { Trip } from '../../core/types'
import { PAYMENT_LABEL } from './Booking'

/* ============================== SEARCHING ============================== */

export function SearchingScreen({ trip }: { trip: Trip }) {
  const { t, L } = useI18n()
  const now = useNow(1000)
  const [cancelOpen, setCancelOpen] = useState(false)
  const near = useMemo(() => fleetSnapshot(now).filter((u) => u.status === 'available' && haversineKm(u.pos, trip.pickup.pos) < 7), [now, trip.pickup.pos])
  const elapsed = Math.floor((now - trip.createdAt) / 1000)
  const phases = [t('نبحث عن أقرب كابتن', 'Finding the nearest captain'), t(`تم إرسال طلبك إلى ${Math.max(1, Math.min(near.length, 4))} كباتن`, `Request sent to ${Math.max(1, Math.min(near.length, 4))} captains`), t('بانتظار قبول الكابتن', 'Waiting for a captain to accept')]
  const phase = phases[Math.min(2, Math.floor(elapsed / 4))]
  return (
    <Surface tone="dark">
      <div className="absolute inset-0 bg-ink text-white">
        <CityMap
          theme="dark"
          center={trip.pickup.pos}
          zoom={130}
          interactive={false}
          markers={[...near.map((u) => ({ id: u.driverId, pos: u.pos, kind: 'car' as const, heading: u.heading, tone: 'white' as const })), { id: 'p', pos: trip.pickup.pos, kind: 'pickup', pulse: true }]}
        />
        <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-ink-2 px-5 pt-3 ring-1 ring-white/6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
          <div className="flex items-center gap-3">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
              <svg width="34" height="28" viewBox="0 0 176 136" aria-hidden>
                <path d="M20 128 L88 12 L156 128" fill="none" stroke="#78B83F" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.p key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="font-display text-[17px] font-semibold">
                  {phase}
                </motion.p>
              </AnimatePresence>
              <p className="text-[12px] text-white/50">
                {near.length} {t('سيارات قريبة منك', 'cars near you')}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full w-1/3 rounded-full bg-go" animate={{ x: ['-100%', '300%'] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
            <Badge tone="neutral">
              <MapPin size={12} /> {L(trip.pickup.name)}
            </Badge>
            <Badge tone="neutral">
              <Flag size={12} /> {L(trip.dropoff.name)}
            </Badge>
            <Badge tone="neutral">
              <span dir="ltr">{classById(trip.vehicleClass).name}</span>
            </Badge>
            <Badge tone="neutral">
              <Money h={trip.fare.total} size="sm" />
            </Badge>
          </div>
          <Button variant="soft" size="lg" full className="mt-4" onClick={() => setCancelOpen(true)}>
            {t('إلغاء الطلب', 'Cancel request')}
          </Button>
        </div>
        <CancelSheet trip={trip} open={cancelOpen} onClose={() => setCancelOpen(false)} />
      </div>
    </Surface>
  )
}

/* ============================== CAPTAIN EN ROUTE / ON TRIP ============================== */

export function LiveTripScreen({ trip, customerId }: { trip: Trip; customerId: string }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const now = useNow(500)
  const driver = getDriver(trip.driverId)
  const vehicle = getVehicle(driver?.vehicleId)
  const pose = tripDriverPose(trip, now)
  const eta = legEtaMinutes(trip, now)
  const onTrip = trip.status === 'in_progress'
  const arrived = trip.status === 'driver_arrived'
  const [sheet, setSheet] = useState<null | 'chat' | 'safety' | 'cancel' | 'share' | 'call'>(null)
  const prog = legProgress(trip, now)
  const route = trip.leg?.route ?? [pose.pos, trip.pickup.pos]
  const remain = remainingRoute(route, prog)
  const remainKm = pathKm(remain) * 1.12
  const unread = (trip.chat ?? []).filter((m) => m.from === 'driver').length
  const lastSeen = useRef(unread)
  useEffect(() => {
    if (unread > lastSeen.current && sheet !== 'chat') toast(t('رسالة جديدة من الكابتن', 'New message from your captain'), 'info')
    lastSeen.current = unread
  }, [unread, sheet, toast, t])

  const headline = onTrip
    ? `${t('الوصول خلال', 'Arriving in')} ${eta} ${t('د', 'min')}`
    : arrived
      ? t('الكابتن وصل إلى موقعك', 'Your captain has arrived')
      : trip.status === 'driver_assigned'
        ? t('تم قبول طلبك', 'Your ride is confirmed')
        : `${t('كابتنك في الطريق إليك', 'Your captain is on the way')}`

  return (
    <div className="absolute inset-0">
      <CityMap
        fit={onTrip ? [pose.pos, trip.dropoff.pos] : [pose.pos, trip.pickup.pos]}
        fitKey={`${trip.status}`}
        padding={[120, 50, 380, 50]}
        routes={[{ id: 'rem', pts: remain }]}
        markers={[
          onTrip ? { id: 'd', pos: trip.dropoff.pos, kind: 'dropoff', label: L(trip.dropoff.name).slice(0, 26) } : { id: 'p', pos: trip.pickup.pos, kind: 'pickup', pulse: arrived },
          { id: 'car', pos: pose.pos, kind: 'car', heading: pose.heading, active: true },
        ]}
      />
      <div className="pointer-events-none absolute inset-x-4" style={{ top: 'calc(var(--safe-top) + 8px)' }}>
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-ink px-3.5 py-3 text-white shadow-xl">
          {!arrived && (
            <span className="num rounded-lg bg-go px-2 py-1 text-[13px] font-bold text-ink">
              {eta} {t('د', 'min')}
            </span>
          )}
          {arrived && <span className="size-2.5 animate-pulse rounded-full bg-go" />}
          <span className="flex-1 truncate text-[14px] font-semibold">{headline}</span>
          {onTrip && (
            <button onClick={() => setSheet('safety')} aria-label={t('طوارئ', 'Emergency')} className="pointer-events-auto flex h-8 items-center gap-1 rounded-lg bg-danger px-2.5 text-xs font-bold">
              <Siren size={15} /> SOS
            </button>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pt-2.5 shadow-[0_-8px_30px_rgba(16,17,18,.1)]" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-2" />
        {onTrip && (
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <Stat label={t('الوقت المتبقي', 'Time left')} value={`${eta}`} unit={t('د', 'min')} />
            <Stat label={t('المسافة المتبقية', 'Distance left')} value={remainKm.toFixed(1)} unit={t('كم', 'km')} />
            <Stat label={t('الوصول', 'Arrival')} value={clock(now + eta * 60_000, lang)} />
          </div>
        )}
        {onTrip && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-road px-3 py-2.5">
            <span className="size-3 rounded-[3px] bg-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-mute">{t('الوجهة', 'Destination')}</p>
              <p className="truncate text-sm font-semibold">{L(trip.dropoff.name)}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Avatar name={driver ? L(driver.name) : '?'} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{driver ? L(driver.name) : '—'}</p>
            <p className="truncate text-[12px] text-mute">
              <span className="num">★ {driver?.rating.toFixed(2)}</span> · {vehicle ? `${vehicle.make} ${vehicle.model} · ${L(vehicle.color)}` : ''}
            </p>
          </div>
          {vehicle && <Plate digits={vehicle.plate.digits} lettersAr={vehicle.plate.lettersAr} lettersEn={vehicle.plate.lettersEn} size="sm" />}
        </div>
        {vehicle && !onTrip && (
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-road px-3 py-1.5">
            <CarArt classId={vehicle.classId} color={vehicle.colorHex} width={86} />
            <div className="text-end">
              <p className="text-[11px] text-mute">{t('رمز التحقق للرحلة', 'Your trip code')}</p>
              <p className="num text-[26px] font-semibold tracking-[0.3em]" dir="ltr">
                {trip.otp}
              </p>
            </div>
          </div>
        )}
        {!onTrip && <p className="mt-1.5 text-center text-[11.5px] text-mute">{t('شارك الرمز مع الكابتن عند الركوب فقط.', 'Share this code with your captain only when you get in.')}</p>}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <ActionBtn icon={<Phone size={18} {...ICON} />} label={t('اتصال', 'Call')} onClick={() => setSheet('call')} />
          <ActionBtn icon={<MessageSquare size={18} {...ICON} />} label={t('رسالة', 'Message')} onClick={() => setSheet('chat')} badge={unread} />
          <ActionBtn icon={<Share2 size={18} {...ICON} />} label={t('مشاركة', 'Share')} onClick={() => setSheet('share')} />
          <ActionBtn icon={<ShieldCheck size={18} {...ICON} />} label={t('الأمان', 'Safety')} onClick={() => setSheet('safety')} dark />
        </div>
        {!onTrip && (
          <button onClick={() => setSheet('cancel')} className="mt-3 w-full text-center text-[13px] font-semibold text-mute">
            {t('إلغاء الرحلة', 'Cancel trip')}
          </button>
        )}
      </div>

      <ChatSheet trip={trip} open={sheet === 'chat'} onClose={() => setSheet(null)} me="passenger" />
      <SafetySheet trip={trip} customerId={customerId} open={sheet === 'safety'} onClose={() => setSheet(null)} />
      <CancelSheet trip={trip} open={sheet === 'cancel'} onClose={() => setSheet(null)} />
      <ShareSheet trip={trip} open={sheet === 'share'} onClose={() => setSheet(null)} />
      <Modal contained width={340} open={sheet === 'call'} onClose={() => setSheet(null)} title={t('اتصال بالكابتن', 'Call captain')}>
        <div className="text-center">
          <Avatar name={driver ? L(driver.name) : '?'} size={64} />
          <p className="mt-3 font-semibold">{driver ? L(driver.name) : ''}</p>
          <p className="mt-1 text-sm text-mute">{t('يتم الاتصال عبر رقم مُخفى لحماية خصوصيتك. الاتصال غير مفعّل في النسخة التجريبية.', 'Calls go through a masked number to protect your privacy. Calling is not connected in the demo.')}</p>
          <Button full className="mt-4" onClick={() => setSheet('chat')} icon={<MessageSquare size={17} />}>
            {t('أرسل رسالة بدلاً من ذلك', 'Send a message instead')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-road py-2">
      <p className="num text-lg font-semibold leading-tight" dir="ltr">
        {value}
        {unit && <span className="ms-0.5 text-xs text-mute">{unit}</span>}
      </p>
      <p className="text-[10.5px] text-mute">{label}</p>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, dark, badge }: { icon: React.ReactNode; label: string; onClick: () => void; dark?: boolean; badge?: number }) {
  return (
    <button onClick={onClick} className={cx('relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11.5px] font-semibold transition active:scale-95', dark ? 'bg-ink text-white' : 'bg-road text-ink')}>
      <span className={dark ? 'text-go' : ''}>{icon}</span>
      {label}
      {!!badge && <span className="absolute top-1.5 end-3 flex size-4 items-center justify-center rounded-full bg-go text-[9px] font-bold text-ink">{badge}</span>}
    </button>
  )
}

/* ---------- Sheets (shared with Driver app) ---------- */

export function ChatSheet({ trip, open, onClose, me }: { trip: Trip; open: boolean; onClose: () => void; me: 'passenger' | 'driver' }) {
  const { t, lang } = useI18n()
  const [text, setText] = useState('')
  const quick =
    me === 'passenger'
      ? [t('أنا في الطريق للنقطة', "I'm heading to the pickup"), t('أنتظرك عند المدخل', "I'm waiting at the entrance"), t('هل يمكنك الانتظار دقيقة؟', 'Can you wait a minute?')]
      : [t('وصلت، أنا بانتظارك', "I've arrived, waiting for you"), t('أنا في الطريق', "I'm on my way"), t('الزحام شديد، سأتأخر قليلاً', 'Heavy traffic, slight delay')]
  const send = (s: string) => {
    actions.sendChat(trip.id, me, s)
    setText('')
  }
  return (
    <Sheet open={open} onClose={onClose} title={t('الرسائل', 'Messages')}>
      <div className="thin-scroll flex max-h-64 min-h-32 flex-col gap-2 overflow-y-auto">
        {(trip.chat ?? []).length === 0 && <p className="py-6 text-center text-sm opacity-50">{t('لا توجد رسائل بعد', 'No messages yet')}</p>}
        {(trip.chat ?? []).map((m, i) => (
          <div key={i} className={cx('max-w-[80%] rounded-2xl px-3 py-2 text-sm', m.from === me ? 'self-end bg-ink text-white' : 'self-start bg-road text-ink')}>
            {m.text}
            <span className="num ms-2 text-[10px] opacity-50">{clock(m.at, lang)}</span>
          </div>
        ))}
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {quick.map((q) => (
          <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-current/20 px-3 py-1.5 text-xs font-medium opacity-80">
            {q}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('اكتب رسالة…', 'Type a message…')} />
        <Button type="submit" disabled={!text.trim()} aria-label={t('إرسال', 'Send')} className="w-12 shrink-0 px-0">
          <Send size={18} className="rtl:-scale-x-100" />
        </Button>
      </form>
    </Sheet>
  )
}

function SafetySheet({ trip, customerId, open, onClose }: { trip: Trip; customerId: string; open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [confirm911, setConfirm911] = useState(false)
  return (
    <Sheet open={open} onClose={onClose} title={t('أدوات الأمان', 'Safety toolkit')}>
      <button onClick={() => setConfirm911(true)} className="flex w-full items-center gap-3 rounded-2xl bg-danger px-4 py-4 text-start text-white">
        <Siren size={22} />
        <div>
          <p className="font-semibold">{t('اتصال بالطوارئ 911', 'Call emergency 911')}</p>
          <p className="text-xs opacity-80">{t('سيتم إبلاغ فريق أمان أورا بموقعك', 'AURA safety team will be alerted with your location')}</p>
        </div>
      </button>
      <div className="mt-3 divide-y divide-line">
        {[
          { icon: <Share2 size={18} />, title: t('مشاركة الرحلة مباشرة', 'Share live trip'), action: () => { navigator.clipboard?.writeText(`https://aura.demo/t/${trip.id}`).catch(() => {}); toast(t('تم نسخ رابط التتبع', 'Tracking link copied')) } },
          {
            icon: <Flag size={18} />,
            title: t('الإبلاغ عن مشكلة أمان', 'Report a safety issue'),
            action: () => {
              actions.createTicket({ requester: { kind: 'customer', id: customerId }, subject: 'Safety report during trip', category: 'safety', tripId: trip.id, text: 'Rider reported a safety concern from the in-trip safety toolkit.' })
              toast(t('تم إرسال البلاغ لفريق الأمان', 'Report sent to the safety team'))
              onClose()
            },
          },
        ].map((r) => (
          <button key={r.title} onClick={r.action} className="flex w-full items-center gap-3 py-3.5 text-start text-sm font-semibold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-road">{r.icon}</span>
            {r.title}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-mute">{t('كل الكباتن موثّقون، ولكل رحلة رمز تحقق، ويمكن مشاركة مسارك مع من تحب.', 'All captains are verified, every trip has a code, and you can share your route with anyone.')}</p>
      <Modal contained width={330} open={confirm911} onClose={() => setConfirm911(false)} title={t('تأكيد الاتصال بالطوارئ', 'Confirm emergency call')}>
        <p className="text-sm text-mute">{t('في النسخة الحقيقية يتم الاتصال بـ 911 ومشاركة موقعك وبيانات الرحلة فوراً. هذه نسخة تجريبية ولن يتم أي اتصال.', 'In production this dials 911 and shares your location and trip details. This is a demo, no call is placed.')}</p>
        <Button
          variant="danger"
          full
          className="mt-4"
          onClick={() => {
            actions.createTicket({ requester: { kind: 'customer', id: customerId }, subject: 'SOS triggered', category: 'safety', priority: 'urgent', tripId: trip.id, text: 'SOS button pressed by rider (demo).' })
            setConfirm911(false)
            onClose()
            toast(t('تم تنبيه فريق الأمان (تجريبي)', 'Safety team alerted (demo)'))
          }}
        >
          {t('نعم، تنبيه الطوارئ', 'Yes, alert emergency')}
        </Button>
      </Modal>
    </Sheet>
  )
}

function ShareSheet({ trip, open, onClose }: { trip: Trip; open: boolean; onClose: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const link = `https://aura.demo/t/${trip.id}`
  return (
    <Sheet open={open} onClose={onClose} title={t('مشاركة الرحلة', 'Share trip')}>
      <p className="text-sm text-mute">{t('يمكن لمن تشاركه الرابط متابعة موقع السيارة والوقت المتوقع للوصول حتى نهاية الرحلة.', 'Anyone with the link can follow the car and ETA until the trip ends.')}</p>
      <div className="mt-3 rounded-2xl bg-road p-3 text-sm">
        <p className="font-semibold">
          {L(trip.pickup.name)} → {L(trip.dropoff.name)}
        </p>
        <p className="num mt-1 truncate text-xs text-mute" dir="ltr">
          {link}
        </p>
      </div>
      <Button
        full
        size="lg"
        className="mt-3"
        icon={<Share2 size={18} />}
        onClick={() => {
          const nav = navigator as Navigator & { share?: (d: { title: string; url: string }) => Promise<void> }
          if (nav.share) nav.share({ title: 'AURA', url: link }).catch(() => {})
          else navigator.clipboard?.writeText(link).catch(() => {})
          toast(t('تم نسخ الرابط', 'Link copied'))
          onClose()
        }}
      >
        {t('مشاركة الرابط', 'Share link')}
      </Button>
    </Sheet>
  )
}

export function CancelSheet({ trip, open, onClose, actor = 'passenger' }: { trip: Trip; open: boolean; onClose: () => void; actor?: 'passenger' | 'driver' }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [reason, setReason] = useState<string | null>(null)
  return (
    <Sheet open={open} onClose={onClose} title={actor === 'passenger' ? t('لماذا تريد الإلغاء؟', 'Why are you cancelling?') : t('سبب الإلغاء', 'Cancellation reason')}>
      <div className="space-y-2">
        {CANCEL_REASONS[actor].map((r) => (
          <button key={r.en} onClick={() => setReason(r.en)} className={cx('flex w-full items-center rounded-2xl px-4 py-3.5 text-start text-sm font-medium', reason === r.en ? 'ring-2 ring-current' : 'ring-1 ring-current/15')}>
            {L(r)}
          </button>
        ))}
      </div>
      {actor === 'passenger' && trip.status !== 'searching' && <p className="mt-3 text-[12px] opacity-60">{t('الإلغاء مجاني خلال دقيقتين من قبول الكابتن (سياسة تجريبية).', 'Free cancellation within 2 minutes of acceptance (demo policy).')}</p>}
      <Button
        variant="danger"
        full
        size="lg"
        className="mt-4"
        disabled={!reason}
        onClick={() => {
          if (actions.cancelTrip(trip.id, actor, reason!)) toast(t('تم إلغاء الرحلة', 'Trip cancelled'))
          onClose()
        }}
      >
        {t('تأكيد الإلغاء', 'Confirm cancellation')}
      </Button>
    </Sheet>
  )
}

/* ============================== TRIP COMPLETE ============================== */

const TAGS = [
  { id: 'safe_driving', ar: 'قيادة آمنة', en: 'Safe driving' },
  { id: 'clean_car', ar: 'سيارة نظيفة', en: 'Clean car' },
  { id: 'on_time', ar: 'دقة المواعيد', en: 'On time' },
  { id: 'polite', ar: 'لبق', en: 'Polite' },
]

export function TripDoneScreen({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const driver = getDriver(trip.driverId)
  const [stars, setStars] = useState(5)
  const [tags, setTags] = useState<string[]>(['safe_driving'])
  const [cat, setCat] = useState({ cleanliness: 5, driving: 5, punctuality: 5 })
  const [tip, setTip] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [comment, setComment] = useState('')
  const [receipt, setReceipt] = useState(false)
  const tipH = tip === -1 ? Math.round(Number(custom || 0) * 100) : (tip ?? 0)
  const submit = () => {
    actions.rateDriver(trip.id, { stars, tags, comment: comment || undefined, tip: tipH || undefined, categories: cat })
    toast(t('شكراً لتقييمك', 'Thanks for your rating'))
    onClose()
  }
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="thin-scroll flex-1 overflow-y-auto px-5" style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}>
        <div className="flex flex-col items-center text-center">
          <SuccessMark size={60} />
          <h1 className="mt-3 font-display text-[24px] font-semibold">{t('وصلت بالسلامة', 'You arrived safely')}</h1>
          <p className="mt-0.5 text-[13px] text-mute">
            {L(trip.dropoff.name)} · {clock(trip.updatedAt, lang)}
          </p>
        </div>
        <button onClick={() => setReceipt(!receipt)} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-road px-4 py-3">
          <span className="text-sm text-mute">
            {t('تم الدفع عبر', 'Paid with')} {L(PAYMENT_LABEL[trip.paymentMethod])}
          </span>
          <span className="flex items-center gap-2">
            <Money h={trip.fare.total} />
            <ChevronDown size={16} className={cx('transition', receipt && 'rotate-180')} />
          </span>
        </button>
        <AnimatePresence>
          {receipt && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-1.5 px-2 pt-3 text-[13px]">
                {[
                  [t('المسافة', 'Distance'), `${trip.fare.distanceKm} ${t('كم', 'km')}`],
                  [t('المدة', 'Duration'), `${trip.fare.durationMin} ${t('دقيقة', 'min')}`],
                  [t('قيمة الرحلة', 'Trip fare'), sar(trip.fare.subtotal)],
                  ...(trip.fare.discount ? [[t('الخصم', 'Discount'), `−${sar(trip.fare.discount)}`]] : []),
                  [t('ضريبة القيمة المضافة', 'VAT'), sar(trip.fare.vat)],
                  [t('رقم الرحلة', 'Trip ID'), trip.id],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-mute">{k}</span>
                    <span className="num font-semibold" dir="ltr">
                      {v}
                    </span>
                  </div>
                ))}
                <p className="flex items-center gap-1.5 pt-1 text-[11px] text-mute">
                  <Receipt size={12} /> {t('تم إرسال الإيصال الضريبي إلى بريدك (تجريبي)', 'Tax invoice sent to your email (demo)')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex flex-col items-center">
          <Avatar name={driver ? L(driver.name) : '?'} size={52} />
          <p className="mt-2 font-semibold">{t(`كيف كانت رحلتك مع ${driver ? L(driver.name).split(' ')[0] : ''}؟`, `How was your trip with ${driver ? L(driver.name).split(' ')[0] : ''}?`)}</p>
          <div className="mt-2">
            <Stars value={stars} onChange={setStars} size={32} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {TAGS.map((tg) => {
            const on = tags.includes(tg.id)
            return (
              <button key={tg.id} onClick={() => setTags(on ? tags.filter((x) => x !== tg.id) : [...tags, tg.id])} className={cx('h-8 rounded-full px-3 text-xs font-semibold transition', on ? 'bg-ink text-white' : 'ring-1 ring-line-2')}>
                {lang === 'ar' ? tg.ar : tg.en}
              </button>
            )
          })}
        </div>
        <div className="mt-4 space-y-2 rounded-2xl bg-road p-3">
          {(
            [
              ['cleanliness', t('النظافة', 'Cleanliness')],
              ['driving', t('القيادة', 'Driving')],
              ['punctuality', t('الالتزام', 'Punctuality')],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{label}</span>
              <Stars value={cat[k]} onChange={(v) => setCat({ ...cat, [k]: v })} size={18} />
            </div>
          ))}
        </div>
        <p className="mt-4 mb-2 text-center text-[13px] font-semibold text-mute">{t('إكرامية للكابتن', 'Tip your captain')}</p>
        <div className="grid grid-cols-4 gap-2" dir="ltr">
          {[500, 1000, 1500, -1].map((v) => (
            <button key={v} onClick={() => setTip(tip === v ? null : v)} className={cx('num h-11 rounded-xl text-sm font-semibold transition', tip === v ? 'bg-go-soft ring-2 ring-go' : 'ring-1 ring-line')}>
              {v === -1 ? t('أخرى', 'Other') : v / 100}
            </button>
          ))}
        </div>
        {tip === -1 && <Input className="mt-2 text-center" inputMode="decimal" placeholder="SAR" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))} />}
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('أضف ملاحظة (اختياري)', 'Add a comment (optional)')} className="mt-3 h-20 w-full resize-none rounded-2xl bg-road p-3 text-sm outline-none focus:ring-2 focus:ring-ink" />
      </div>
      <div className="flex gap-2 border-t border-line px-5 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        <Button variant="soft" size="lg" onClick={onClose}>
          {t('تخطي', 'Skip')}
        </Button>
        <Button size="lg" className="flex-1" onClick={submit}>
          {t('إرسال التقييم', 'Submit rating')}
          {tipH > 0 && <span className="num opacity-70">· +{sar(tipH)}</span>}
        </Button>
      </div>
    </div>
  )
}

export function CancelledNotice({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { t, L } = useI18n()
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-ink/40">
      <div className="w-full rounded-t-[28px] bg-white px-5 pt-6 text-center" style={{ paddingBottom: 'calc(var(--safe-bottom) + 14px)' }}>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-road">
          <X size={26} />
        </div>
        <h2 className="mt-3 font-display text-xl font-semibold">{L(STATUS_LABEL.cancelled)}</h2>
        <p className="mt-1 text-sm text-mute">
          {trip.cancel?.by === 'system'
            ? t('لم نجد كابتن متاحاً حالياً. لم يتم خصم أي مبلغ.', 'No captain was available right now. You were not charged.')
            : trip.cancel?.by === 'driver'
              ? t('اعتذر الكابتن عن الرحلة. يمكنك الطلب مجدداً دون رسوم.', 'Your captain cancelled. You can request again at no charge.')
              : t('ألغت إدارة أورا هذه الرحلة. تواصل مع الدعم لمزيد من التفاصيل.', 'AURA operations cancelled this trip. Contact support for details.')}
        </p>
        <p className="mt-1 text-xs text-mute-2">{trip.cancel?.reason}</p>
        <Button full size="lg" className="mt-5" onClick={onClose}>
          {t('حسناً', 'OK')}
        </Button>
      </div>
    </div>
  )
}


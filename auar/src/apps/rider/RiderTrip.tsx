import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Phone, Share2, ShieldCheck, X, Send, Siren, UserRound, Check, Receipt, Flag, RotateCcw } from 'lucide-react'
import { Map, type MapCar } from '../../components/Map'
import { Avatar, Btn, IconBtn, RatingPill, Sheet, StatusBar, Stars, VehicleArt, PaymentIcon, PAY_LABEL, Row } from '../../components/ui'
import { along, slice } from '../../lib/geo'
import { clock, money, km, mins } from '../../lib/format'
import { cancelTrip, driverPose, etaMin, openTicket, rateTrip, requestTrip, sendChat, setSOS, shareTrip, tripProgress, useNow, useStore } from '../../store/store'
import type { Trip } from '../../store/types'

export function RiderTrip({ trip, onDone, onWatch }: { trip: Trip; onDone: () => void; onWatch: (id: string | null) => void }) {
  const s = useStore()
  const now = useNow(250)
  const driver = trip.driverId ? s.drivers.find((d) => d.id === trip.driverId) : undefined
  const [panel, setPanel] = useState<null | 'chat' | 'safety' | 'cancel' | 'call' | 'share'>(null)
  const cat = s.categories.find((c) => c.id === trip.category)!

  // keep this screen pinned to the trip until the rider finishes the rating / receipt
  useEffect(() => {
    onWatch(trip.id)
  }, [trip.id])

  const pose = driver ? driverPose(driver, s, now) : null
  const prog = tripProgress(trip, s.settings, now)
  const eta = etaMin(trip, s.settings, now)

  const cars: MapCar[] = []
  if (driver && pose && ['accepted', 'arrived', 'in_progress'].includes(trip.status)) cars.push({ id: driver.id, p: pose.p, a: pose.a, color: driver.car.colorHex, focus: true, moto: driver.categories.includes('moto') })
  if (trip.status === 'searching')
    s.drivers
      .filter((d) => d.online && d.bot && d.status === 'active')
      .slice(0, 8)
      .forEach((d) => {
        const p = driverPose(d, s, now)
        cars.push({ id: d.id, p: p.p, a: p.a, color: d.car.colorHex, dim: true })
      })

  if (trip.status === 'completed') return <RateScreen trip={trip} onDone={onDone} />
  if (trip.status === 'cancelled' || trip.status === 'no_drivers') return <EndedScreen trip={trip} onDone={onDone} />

  let focus = [trip.pickup.p, trip.dropoff.p]
  let mapRoute = trip.path
  let approach: typeof trip.path | undefined
  if (trip.status === 'searching') focus = [trip.pickup.p]
  if (trip.status === 'accepted' && pose) {
    const rest = slice(trip.approach, prog)
    approach = rest
    focus = [pose.p, trip.pickup.p]
    mapRoute = []
  }
  if (trip.status === 'arrived') {
    focus = [trip.pickup.p]
    mapRoute = []
  }
  if (trip.status === 'in_progress') {
    mapRoute = slice(trip.path, prog)
    focus = [along(trip.path, prog).p, trip.dropoff.p]
  }

  const headline =
    trip.status === 'searching'
      ? 'جارٍ البحث عن كابتن قريب…'
      : trip.status === 'accepted'
        ? `الكابتن يصل خلال ${eta} د`
        : trip.status === 'arrived'
          ? 'الكابتن بانتظارك'
          : `الوصول ${clock(now + eta * 60000)}`

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <StatusBar />
      <div className="absolute inset-0">
        <Map
          focus={focus}
          inset={0.55}
          minSpan={trip.status === 'searching' ? 300 : 200}
          route={mapRoute}
          approach={approach}
          pickup={trip.status !== 'in_progress' ? { p: trip.pickup.p, label: trip.status === 'searching' ? undefined : trip.pickup.name } : undefined}
          dropoff={trip.status === 'in_progress' || trip.status === 'searching' ? { p: trip.dropoff.p, label: trip.status === 'in_progress' ? trip.dropoff.name : undefined } : undefined}
          cars={cars}
          pois={false}
        />
        {trip.status === 'searching' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center pb-[50%]">
            <span className="pulse-ring block h-40 w-40 rounded-full bg-ink/20" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 top-12 z-20 flex justify-between px-4">
        <span />
        {trip.status !== 'searching' && (
          <button onClick={() => setPanel('safety')} className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold shadow-[0_2px_10px_rgba(0,0,0,.14)]">
            <ShieldCheck size={18} className="text-sky" /> الأمان
          </button>
        )}
      </div>
      {trip.sos && (
        <div className="absolute inset-x-4 top-28 z-20 flex items-center gap-2 rounded-2xl bg-bad px-4 py-3 text-sm font-semibold text-white">
          <Siren size={18} /> تم إرسال تنبيه الطوارئ — فريق AUAR يتابع رحلتك الآن
        </div>
      )}

      <Sheet className="pb-5">
        <div className="px-5 pt-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-bold">{headline}</h2>
            {trip.status === 'accepted' && <span className="rounded-lg bg-ink px-2.5 py-1 text-sm font-bold text-white tnum">{eta} د</span>}
          </div>
          {trip.status === 'searching' && (
            <>
              <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-mist">
                <span className="search-bar absolute inset-y-0 w-1/3 rounded-full bg-ink" />
              </div>
              <p className="mt-3 text-sm text-mute">نرسل طلبك لأقرب كباتن {cat.name} — عادةً خلال ثوانٍ.</p>
            </>
          )}
          {trip.status === 'in_progress' && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${prog * 100}%` }} />
              </div>
              <p className="mt-2 text-sm text-mute">متبقٍ {mins(eta)} • {km(trip.distanceKm * (1 - prog))} إلى {trip.dropoff.name}</p>
            </div>
          )}
        </div>

        {driver && trip.status !== 'searching' && (
          <div className="mx-5 mt-4 rounded-2xl border border-line p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={driver.name} color={driver.color} size={52} />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <RatingPill value={driver.rating} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold">{driver.name.split(' ')[0]}</p>
                <p className="truncate text-[13px] text-mute">
                  {driver.car.make} {driver.car.model} • {driver.car.color}
                </p>
              </div>
              <div className="text-end">
                <p className="rounded-lg bg-mist px-2.5 py-1 text-[15px] font-bold tracking-wider">{driver.car.plate}</p>
                <VehicleArt id={trip.category} className="ms-auto mt-1 h-7 w-14" />
              </div>
            </div>
            {(trip.status === 'accepted' || trip.status === 'arrived') && (
              <div className={`mt-4 flex items-center justify-between rounded-xl px-4 py-2.5 ${trip.status === 'arrived' ? 'bg-lime' : 'bg-mist'}`}>
                <span className="text-[13px] font-semibold">رمز التحقق — أعطه للكابتن عند الركوب</span>
                <span className="flex gap-1" dir="ltr">
                  {trip.pin.split('').map((c, i) => (
                    <span key={i} className="grid h-8 w-7 place-items-center rounded-md bg-white text-[17px] font-bold tnum">
                      {c}
                    </span>
                  ))}
                </span>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={() => setPanel('chat')} className="relative flex h-11 flex-1 items-center gap-2 rounded-full bg-mist px-4 text-sm text-mute">
                <MessageCircle size={17} /> أرسل رسالة…
                {trip.chat.some((m) => m.from === 'driver') && <span className="absolute left-3 top-3 h-2 w-2 rounded-full bg-sky" />}
              </button>
              <IconBtn onClick={() => setPanel('call')} aria-label="اتصال" className="!bg-mist !shadow-none">
                <Phone size={18} />
              </IconBtn>
              <IconBtn onClick={() => { shareTrip(trip.id); setPanel('share') }} aria-label="مشاركة" className="!bg-mist !shadow-none">
                <Share2 size={18} />
              </IconBtn>
            </div>
          </div>
        )}

        <div className="mx-5 mt-4 flex gap-3">
          <div className="flex flex-col items-center py-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" />
            <span className="my-1 w-px flex-1 bg-ink/30" />
            <span className="h-2 w-2 bg-ink" />
          </div>
          <div className="flex-1 space-y-2 text-[14px]">
            <p className="truncate">{trip.pickup.name}</p>
            <p className="truncate font-semibold">{trip.dropoff.name}</p>
          </div>
          <div className="text-end">
            <p className="text-[15px] font-bold tnum">{money(trip.fare)}</p>
            <p className="flex items-center justify-end gap-1 text-[12px] text-mute">
              <PaymentIcon m={trip.payment} className="!h-4 !w-6 !text-[7px]" /> {PAY_LABEL[trip.payment].split(' ')[0]}
            </p>
          </div>
        </div>
        {trip.status !== 'in_progress' && (
          <div className="mt-4 px-5">
            <Btn variant="secondary" full onClick={() => setPanel('cancel')}>
              إلغاء الرحلة
            </Btn>
          </div>
        )}
      </Sheet>

      {panel && <Overlay trip={trip} panel={panel} onClose={() => setPanel(null)} driverName={driver?.name ?? ''} />}
    </div>
  )
}

function Overlay({ trip, panel, onClose, driverName }: { trip: Trip; panel: 'chat' | 'safety' | 'cancel' | 'call' | 'share'; onClose: () => void; driverName: string }) {
  const s = useStore()
  const now = useNow(1000)
  const rider = s.riders.find((r) => r.id === trip.riderId)!
  const [text, setText] = useState('')
  const [reason, setReason] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [trip.chat.length])
  const lateFee = trip.acceptedAt && now - trip.acceptedAt > s.settings.freeCancelSec * 1000

  if (panel === 'chat')
    return (
      <div className="fade-in absolute inset-0 z-50 flex flex-col bg-white pt-12">
        <div className="flex items-center gap-3 border-b border-line px-4 pb-3">
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist" aria-label="إغلاق">
            <X size={22} />
          </button>
          <div className="flex-1">
            <p className="font-bold">{driverName}</p>
            <p className="text-xs text-mute">المحادثة مؤمّنة عبر AUAR — لا تظهر أرقام الهواتف</p>
          </div>
        </div>
        <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
          {trip.chat.length === 0 && <p className="py-8 text-center text-sm text-mute">ابدأ المحادثة مع الكابتن</p>}
          {trip.chat.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'rider' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] ${m.from === 'rider' ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-mist'}`}>
                {m.text}
                <span className="mt-0.5 block text-[10px] opacity-55 tnum">{clock(m.at)}</span>
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {['أنا عند نقطة الالتقاء', 'دقيقتين وأكون عندك', 'أين أنت الآن؟', 'شكراً'].map((q) => (
            <button key={q} onClick={() => sendChat(trip.id, 'rider', q)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[13px] hover:bg-mist">
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-line p-3 pb-6"
          onSubmit={(e) => {
            e.preventDefault()
            sendChat(trip.id, 'rider', text)
            setText('')
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب رسالة…" className="h-12 flex-1 rounded-full bg-mist px-4 outline-none" />
          <button className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white" aria-label="إرسال">
            <Send size={18} className="-scale-x-100" />
          </button>
        </form>
      </div>
    )

  return (
    <div className="fade-in absolute inset-0 z-50 bg-black/45" onClick={onClose}>
      <div className="slide-up absolute inset-x-0 bottom-0 rounded-t-[26px] bg-white px-5 pb-7 pt-5" onClick={(e) => e.stopPropagation()}>
        {panel === 'call' && (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mist">
              <Phone />
            </div>
            <h3 className="mt-3 text-lg font-bold">اتصال بـ {driverName.split(' ')[0]}</h3>
            <p className="mt-1 text-sm text-mute">يتم الاتصال عبر رقم وسيط من AUAR لحماية خصوصية الطرفين.</p>
            <Btn full size="lg" className="mt-5" onClick={onClose}>
              <Phone size={18} /> اتصال
            </Btn>
          </div>
        )}
        {panel === 'share' && (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime">
              <Check />
            </div>
            <h3 className="mt-3 text-lg font-bold">تمت مشاركة الرحلة</h3>
            <p className="mt-1 text-sm text-mute">يمكن لمن تشاركه الرابط متابعة موقعك ووقت الوصول مباشرة.</p>
            <p className="mt-3 rounded-xl bg-mist px-4 py-3 text-sm font-semibold" dir="ltr">
              auar.app/t/{trip.id.toLowerCase()}
            </p>
            <Btn full size="lg" className="mt-4" onClick={onClose}>
              تم
            </Btn>
          </div>
        )}
        {panel === 'safety' && (
          <>
            <h3 className="text-lg font-bold">أدوات الأمان</h3>
            <p className="mb-2 text-sm text-mute">رحلتك مراقبة على مدار الساعة من فريق AUAR.</p>
            <Row icon={<Siren size={18} className="text-bad" />} title="الاتصال بالطوارئ (911)" sub="سيتم إرسال موقعك وتفاصيل الرحلة للفريق" onClick={() => { setSOS(trip.id); onClose() }} />
            <Row icon={<Share2 size={18} />} title="مشاركة تفاصيل الرحلة" sub="أرسل موقعك المباشر لمن تثق به" onClick={() => shareTrip(trip.id)} />
            <Row icon={<UserRound size={18} />} title={rider.emergencyName ? `إبلاغ ${rider.emergencyName}` : 'أضف جهة اتصال للطوارئ'} sub={rider.emergencyPhone || 'من الإعدادات ← الأمان'} />
            <Row icon={<Flag size={18} />} title="الإبلاغ عن مشكلة أمان" sub="سيتواصل معك فريق مختص" onClick={() => { openTicket('rider', 'بلاغ أمان أثناء الرحلة', 'أرغب في الإبلاغ عن مشكلة أمان أثناء الرحلة.', trip.id); onClose() }} />
          </>
        )}
        {panel === 'cancel' && (
          <>
            <h3 className="text-lg font-bold">لماذا تريد الإلغاء؟</h3>
            {lateFee ? (
              <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">سيتم احتساب رسوم إلغاء {money(s.settings.cancelFee)} لأن الكابتن في الطريق منذ أكثر من {Math.round(s.settings.freeCancelSec / 60)} دقائق.</p>
            ) : (
              <p className="mt-1 text-sm text-mute">الإلغاء مجاني الآن.</p>
            )}
            <div className="mt-3 space-y-1.5">
              {['الكابتن بعيد جداً', 'تغيرت الخطط', 'طلبت بالخطأ', 'وجدت وسيلة أخرى', 'الكابتن طلب الإلغاء'].map((r) => (
                <button key={r} onClick={() => setReason(r)} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-start text-[15px] ${reason === r ? 'bg-ink text-white' : 'bg-mist'}`}>
                  {r}
                  {reason === r && <Check size={18} />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Btn variant="secondary" className="flex-1" onClick={onClose}>
                تراجع
              </Btn>
              <Btn variant="danger" className="flex-1" disabled={!reason} onClick={() => { cancelTrip(trip.id, 'rider', reason); onClose() }}>
                تأكيد الإلغاء
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EndedScreen({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const noDrivers = trip.status === 'no_drivers'
  const byDriver = trip.cancelledBy === 'driver' || trip.cancelledBy === 'admin'
  const again = () => {
    requestTrip({ pickup: trip.pickup, dropoff: trip.dropoff, category: trip.category, payment: trip.payment, promo: trip.promo })
    onDone()
  }
  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-white px-8 text-center">
      <StatusBar />
      <div className="grid h-20 w-20 place-items-center rounded-full bg-mist">{noDrivers ? <VehicleArt id={trip.category} className="h-10 w-16" /> : <X size={30} />}</div>
      <h2 className="mt-5 text-2xl font-bold">{noDrivers ? 'لا يوجد كباتن متاحون الآن' : byDriver ? 'أُلغيت رحلتك' : 'تم إلغاء الرحلة'}</h2>
      <p className="mt-2 text-sm text-mute">
        {noDrivers ? 'جميع الكباتن مشغولون حالياً. حاول مرة أخرى بعد قليل أو اختر فئة أخرى.' : byDriver ? 'نعتذر! يمكنك الطلب مجدداً وسنبحث لك عن كابتن آخر فوراً.' : trip.cancelFee ? `تم احتساب رسوم إلغاء ${money(trip.cancelFee)}` : 'لم يتم احتساب أي رسوم.'}
      </p>
      <div className="mt-8 w-full space-y-2">
        {(noDrivers || byDriver) && (
          <Btn full size="lg" onClick={again}>
            <RotateCcw size={18} /> اطلب مجدداً
          </Btn>
        )}
        <Btn full size="lg" variant="secondary" onClick={onDone}>
          العودة للرئيسية
        </Btn>
      </div>
    </div>
  )
}

function RateScreen({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const s = useStore()
  const driver = s.drivers.find((d) => d.id === trip.driverId)
  const [stars, setStars] = useState(trip.riderRating ?? 0)
  const [tip, setTip] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [step, setStep] = useState<'rate' | 'receipt'>(trip.riderRating ? 'receipt' : 'rate')
  const tagList = stars >= 4 ? ['قيادة آمنة', 'سيارة نظيفة', 'تعامل راقٍ', 'وصول سريع', 'معرفة بالطرق'] : ['قيادة متهورة', 'تأخر في الوصول', 'السيارة غير نظيفة', 'مسار أطول', 'تعامل غير لائق']

  if (step === 'receipt')
    return (
      <div className="relative h-full overflow-y-auto bg-mist">
        <StatusBar />
        <div className="px-5 pb-8 pt-14">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime">
              <Receipt />
            </div>
            <h2 className="mt-3 text-2xl font-bold">شكراً لركوبك مع AUAR</h2>
            <p className="text-sm text-mute">{new Date(trip.completedAt!).toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="mt-5 rounded-3xl bg-white p-5">
            <p className="text-center text-4xl font-bold tnum">{money(trip.fare + trip.tip, true)}</p>
            <div className="mt-5 space-y-2.5 text-[14px]">
              <Line l="أجرة الرحلة" v={money(trip.fare + trip.discount, true)} />
              {trip.discount > 0 && <Line l={`خصم ${trip.promo}`} v={`- ${money(trip.discount, true)}`} />}
              {trip.tip > 0 && <Line l="إكرامية للكابتن" v={money(trip.tip, true)} />}
              <Line l="ضريبة القيمة المضافة (مشمولة)" v={money((trip.fare * s.settings.vat) / (1 + s.settings.vat), true)} />
              <div className="h-px bg-line" />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-mute">
                  <PaymentIcon m={trip.payment} /> {PAY_LABEL[trip.payment]}
                </span>
                <span className="font-bold tnum">{money(trip.fare + trip.tip, true)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-3xl bg-white p-5 text-[14px]">
            <div className="flex gap-3">
              <div className="flex flex-col items-center py-1.5">
                <span className="h-2 w-2 rounded-full bg-ink" />
                <span className="my-1 w-px flex-1 bg-ink/30" />
                <span className="h-2 w-2 bg-ink" />
              </div>
              <div className="flex-1 space-y-3">
                <p>
                  {trip.pickup.name} <span className="text-mute tnum">• {clock(trip.startedAt!)}</span>
                </p>
                <p>
                  {trip.dropoff.name} <span className="text-mute tnum">• {clock(trip.completedAt!)}</span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-mute">
              {s.categories.find((c) => c.id === trip.category)?.name} • {km(trip.distanceKm)} • {mins(trip.durationMin)} • الكابتن {driver?.name}
            </p>
          </div>
          <Btn full size="lg" className="mt-5" onClick={onDone}>
            تم
          </Btn>
        </div>
      </div>
    )

  return (
    <div className="relative flex h-full flex-col bg-white">
      <StatusBar />
      <div className="flex-1 overflow-y-auto px-6 pt-16">
        <div className="text-center">
          {driver && <Avatar name={driver.name} color={driver.color} size={72} />}
          <h2 className="mt-4 text-[22px] font-bold">كيف كانت رحلتك مع {driver?.name.split(' ')[0]}؟</h2>
          <p className="mt-1 text-sm text-mute">
            {trip.dropoff.name} • {money(trip.fare)}
          </p>
          <div className="mt-5">
            <Stars value={stars} onChange={setStars} size={40} />
          </div>
        </div>
        {stars > 0 && (
          <div className="fade-in">
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {tagList.map((t) => (
                <button key={t} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold ${tags.includes(t) ? 'bg-ink text-white' : 'bg-mist'}`}>
                  {t}
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="أضف تعليقاً (اختياري)" rows={2} className="mt-4 w-full resize-none rounded-2xl bg-mist p-4 text-[15px] outline-none focus:ring-2 focus:ring-ink" />
            {stars >= 4 && trip.payment !== 'cash' && (
              <>
                <p className="mt-4 text-center font-semibold">أضف إكرامية — ١٠٠٪ تذهب للكابتن</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((t) => (
                    <button key={t} onClick={() => setTip(t)} className={`h-12 rounded-xl text-[15px] font-bold tnum ${tip === t ? 'bg-ink text-white' : 'bg-mist'}`}>
                      {t === 0 ? 'لا' : money(t)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="p-5 pb-7">
        <Btn
          full
          size="lg"
          disabled={!stars}
          onClick={() => {
            rateTrip(trip.id, stars, [tags.join('، '), comment].filter(Boolean).join(' — '), tip)
            if (stars <= 2) openTicket('rider', 'تقييم منخفض لرحلة', `${tags.join('، ')} ${comment}`.trim() || 'تقييم منخفض', trip.id)
            setStep('receipt')
          }}
        >
          إرسال التقييم
        </Btn>
        <button onClick={() => setStep('receipt')} className="mt-2 w-full py-2 text-sm font-semibold text-mute">
          تخطي
        </button>
      </div>
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

import { useState } from 'react'
import { Check, Clock, FileCheck2, FileWarning, LogOut, Star, Upload, Car, Gauge, ThumbsUp, ChevronLeft, LifeBuoy, Send } from 'lucide-react'
import { Avatar, Btn, Logo, RatingPill, StatusBar, VehicleArt, Badge } from '../../components/ui'
import { ago, clock, day, money } from '../../lib/format'
import { cashOut, demoLogin, getMode, getServerInfo, openTicket, registerDriver, registerDriverAccount, signInDriver, signOutDriver, useNow, useStore } from '../../store/store'
import { PhoneOtp } from '../../components/PhoneOtp'
import type { CategoryId } from '../../store/types'

/* ───────────── auth + onboarding ───────────── */

export function DriverAuth({ registering = false }: { registering?: boolean }) {
  const remote = getMode() === 'remote'
  const [step, setStep] = useState<'splash' | 'otp' | 'personal' | 'vehicle' | 'docs'>(registering ? 'personal' : 'splash')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ name: '', phone: '', gender: 'm' as 'm' | 'f', make: '', model: '', plate: '', year: 2023, color: 'أبيض', categories: ['go'] as CategoryId[] })
  const [docs, setDocs] = useState<Record<string, boolean>>({})
  const set = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }))
  const docList = [
    ['license', 'رخصة القيادة'],
    ['id', 'الهوية الوطنية / الإقامة'],
    ['reg', 'استمارة السيارة'],
    ['ins', 'تأمين المركبة'],
    ['photo', 'صورة شخصية'],
  ]

  if (step === 'splash')
    return (
      <div className="relative flex h-full flex-col bg-ink text-white">
        <StatusBar dark />
        <div className="flex flex-1 flex-col justify-center px-7">
          <Logo size={52} light tag="DRIVER" />
          <h1 className="mt-10 text-[38px] font-bold leading-[1.15]">
            قُد بوقتك.
            <br />
            <span className="text-lime">واكسب أكثر.</span>
          </h1>
          <ul className="mt-6 space-y-3 text-[15px] text-white/70">
            <li className="flex items-center gap-2"><Check size={18} className="text-lime" /> اختر ساعات عملك بحرية</li>
            <li className="flex items-center gap-2"><Check size={18} className="text-lime" /> سحب الأرباح فوراً في أي وقت</li>
            <li className="flex items-center gap-2"><Check size={18} className="text-lime" /> دعم على مدار الساعة وتأمين لكل رحلة</li>
          </ul>
        </div>
        <div className="space-y-2 px-6 pb-8">
          <Btn variant="lime" full size="lg" onClick={() => setStep(remote ? 'otp' : 'personal')}>
            سجّل ككابتن
          </Btn>
          {remote && (
            <Btn variant="light" full size="lg" onClick={() => setStep('otp')}>
              لدي حساب — تسجيل الدخول
            </Btn>
          )}
          {(!remote || getServerInfo().demo) && (
            <Btn variant="light" full size="lg" onClick={() => (remote ? demoLogin('driver').catch((e: Error) => setErr(e.message)) : signInDriver())}>
              دخول بحساب كابتن تجريبي
            </Btn>
          )}
          {err && <p className="text-center text-sm text-[#ff7a93]">{err}</p>}
        </div>
      </div>
    )

  if (step === 'otp') return <PhoneOtp role="driver" dark title="رقم جوالك ككابتن" onBack={() => setStep('splash')} onVerified={() => undefined} />

  const idx = ['personal', 'vehicle', 'docs'].indexOf(step)
  const inp = 'h-12 w-full rounded-xl bg-white/10 px-4 text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-lime'
  return (
    <div className="relative flex h-full flex-col bg-ink text-white">
      <StatusBar dark />
      <div className="px-6 pt-14">
        <button onClick={() => (idx === 0 ? (registering ? signOutDriver() : setStep('splash')) : setStep(['personal', 'vehicle'][idx - 1] as 'personal'))} className="text-sm font-semibold text-white/55">
          → رجوع
        </button>
        <div className="mt-4 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? 'bg-lime' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-6">
        {step === 'personal' && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">معلوماتك الشخصية</h2>
            <input className={inp} placeholder="الاسم الكامل" value={f.name} onChange={(e) => set('name', e.target.value)} />
            {!remote && <input className={inp} placeholder="رقم الجوال 05XXXXXXXX" dir="ltr" inputMode="numeric" value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />}
            {remote && <p className="text-sm text-lime">✓ تم التحقق من رقم جوالك</p>}
            <div className="flex gap-2">
              {(
                [
                  ['m', 'كابتن'],
                  ['f', 'كابتنة'],
                ] as const
              ).map(([g, l]) => (
                <button key={g} onClick={() => { set('gender', g); set('categories', g === 'f' ? ['her', 'go'] : ['go']) }} className={`h-12 flex-1 rounded-xl font-semibold ${f.gender === g ? 'bg-lime text-ink' : 'bg-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/45">المدينة: الرياض</p>
          </div>
        )}
        {step === 'vehicle' && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">بيانات المركبة</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="الشركة (تويوتا)" value={f.make} onChange={(e) => set('make', e.target.value)} />
              <input className={inp} placeholder="الطراز (كامري)" value={f.model} onChange={(e) => set('model', e.target.value)} />
              <input className={inp} placeholder="اللوحة (أ ب ج 1234)" value={f.plate} onChange={(e) => set('plate', e.target.value)} />
              <input className={inp} placeholder="سنة الصنع" inputMode="numeric" value={f.year} onChange={(e) => set('year', Number(e.target.value.replace(/\D/g, '').slice(0, 4)))} />
            </div>
            <input className={inp} placeholder="اللون" value={f.color} onChange={(e) => set('color', e.target.value)} />
            <p className="pt-2 text-sm font-semibold">الخدمات التي تريد تقديمها</p>
            <div className="grid grid-cols-3 gap-2">
              {(['go', 'comfort', 'xl', 'black', 'moto', 'courier', ...(f.gender === 'f' ? ['her'] : [])] as CategoryId[]).map((c) => {
                const on = f.categories.includes(c)
                return (
                  <button key={c} onClick={() => set('categories', on ? f.categories.filter((x) => x !== c) : [...f.categories, c])} className={`rounded-xl p-2 text-[12px] font-semibold ${on ? 'bg-white text-ink' : 'bg-white/10'}`}>
                    <VehicleArt id={c} className="mx-auto h-8 w-14" />
                    {{ go: 'Go', comfort: 'Comfort', xl: 'XL', black: 'Black', moto: 'Moto', courier: 'توصيل', her: 'Her' }[c]}
                  </button>
                )
              })}
            </div>
            {f.year > 0 && f.year < 2018 && <p className="text-sm text-[#ff7a93]">يجب أن تكون المركبة موديل ٢٠١٨ أو أحدث.</p>}
          </div>
        )}
        {step === 'docs' && (
          <div>
            <h2 className="text-2xl font-bold">المستندات المطلوبة</h2>
            <p className="mt-1 text-sm text-white/55">ارفع صوراً واضحة — تتم المراجعة خلال ٢٤ ساعة.</p>
            <div className="mt-4 space-y-2">
              {docList.map(([k, l]) => (
                <button key={k} onClick={() => setDocs((d) => ({ ...d, [k]: true }))} className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-4 text-start">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${docs[k] ? 'bg-lime text-ink' : 'bg-white/10'}`}>{docs[k] ? <Check size={18} /> : <Upload size={18} />}</span>
                  <span className="flex-1 font-semibold">{l}</span>
                  <span className="text-[13px] text-white/45">{docs[k] ? 'تم الرفع' : 'رفع'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-6">
        {err && <p className="mb-2 text-center text-sm text-[#ff7a93]">{err}</p>}
        <Btn
          variant="lime"
          full
          size="lg"
          disabled={
            busy ||
            (step === 'personal' && (f.name.trim().length < 3 || (!remote && f.phone.length < 10))) ||
            (step === 'vehicle' && (!f.make || !f.model || !f.plate || f.year < 2018 || f.categories.length === 0)) ||
            (step === 'docs' && docList.some(([k]) => !docs[k]))
          }
          onClick={() => {
            if (step === 'personal') setStep('vehicle')
            else if (step === 'vehicle') setStep('docs')
            else if (!remote) registerDriver({ ...f })
            else {
              setBusy(true)
              setErr('')
              registerDriverAccount({ ...f })
                .catch((e: Error) => setErr(e.message))
                .finally(() => setBusy(false))
            }
          }}
        >
          {step === 'docs' ? 'إرسال الطلب' : 'التالي'}
        </Btn>
      </div>
    </div>
  )
}

export function DriverPending() {
  const s = useStore()
  const me = s.drivers.find((d) => d.id === s.me.driverId)!
  const rejected = me.status === 'rejected'
  const suspended = me.status === 'suspended'
  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-ink px-8 text-center text-white">
      <StatusBar dark />
      <div className={`grid h-20 w-20 place-items-center rounded-full ${rejected || suspended ? 'bg-bad/20 text-[#ff7a93]' : 'bg-lime/15 text-lime'}`}>
        {rejected || suspended ? <FileWarning size={34} /> : <Clock size={34} />}
      </div>
      <h2 className="mt-5 text-2xl font-bold">{rejected ? 'لم تتم الموافقة على طلبك' : suspended ? 'تم إيقاف حسابك مؤقتاً' : 'طلبك قيد المراجعة'}</h2>
      <p className="mt-2 text-sm text-white/55">
        {rejected ? 'يمكنك التواصل مع الدعم لمعرفة السبب وإعادة التقديم.' : suspended ? 'تواصل مع فريق الدعم لإعادة تفعيل الحساب.' : `شكراً ${me.name.split(' ')[0]}! يراجع فريق AUAR مستنداتك الآن، وسنشعرك فور التفعيل.`}
      </p>
      {!rejected && !suspended && (
        <div className="mt-6 w-full space-y-2 text-start">
          {['استلام الطلب', 'التحقق من المستندات', 'فحص السجل', 'التفعيل'].map((t, i) => (
            <div key={t} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[12px] ${i === 0 ? 'bg-lime text-ink' : 'bg-white/10'}`}>{i === 0 ? <Check size={14} /> : i + 1}</span>
              <span className={i === 0 ? '' : 'text-white/55'}>{t}</span>
            </div>
          ))}
          <p className="pt-2 text-center text-xs text-white/40">للتجربة: افتح لوحة الإدارة ← الكباتن ← طلبات الانضمام، ووافق على الطلب.</p>
        </div>
      )}
      <button onClick={signOutDriver} className="mt-8 text-sm font-semibold text-white/55">
        تسجيل الخروج
      </button>
    </div>
  )
}

/* ───────────── earnings ───────────── */

export function Earnings() {
  const s = useStore()
  const now = useNow(5000)
  const me = s.drivers.find((d) => d.id === s.me.driverId)!
  const [out, setOut] = useState(false)
  const mine = s.trips.filter((t) => t.driverId === me.id && t.status === 'completed' && t.completedAt)
  const dayStart = (d: number) => {
    const x = new Date(now - d * 86400000)
    x.setHours(0, 0, 0, 0)
    return x.getTime()
  }
  const days = Array.from({ length: 7 }, (_, i) => 6 - i).map((d) => {
    const a = dayStart(d)
    const b = a + 86400000
    const ts = mine.filter((t) => t.completedAt! >= a && t.completedAt! < b)
    return { label: new Date(a).toLocaleDateString('ar-SA', { weekday: 'short' }), net: ts.reduce((x, t) => x + t.fare - t.commission + t.tip, 0), n: ts.length, today: d === 0 }
  })
  const week = days.reduce((a, d) => a + d.net, 0)
  const trips = days.reduce((a, d) => a + d.n, 0)
  const max = Math.max(50, ...days.map((d) => d.net))

  return (
    <div className="h-full overflow-y-auto pb-24 pt-14">
      <div className="px-5">
        <h1 className="text-2xl font-bold">الأرباح</h1>
        <div className="mt-4 rounded-3xl bg-ink-2 p-5">
          <p className="text-sm text-white/55">هذا الأسبوع</p>
          <p className="mt-1 text-4xl font-bold tnum">{money(week, true)}</p>
          <p className="mt-1 text-sm text-white/55 tnum">{trips} رحلة</p>
          <div className="mt-5 flex h-36 items-end gap-2" role="img" aria-label="أرباح آخر ٧ أيام">
            {days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-white/55 tnum">{d.net ? Math.round(d.net) : ''}</span>
                <div className={`w-full rounded-t-md ${d.today ? 'bg-lime' : 'bg-white/25'}`} style={{ height: `${Math.max(3, (d.net / max) * 100)}px` }} />
                <span className={`text-[11px] ${d.today ? 'font-bold text-white' : 'text-white/45'}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-3xl bg-ink-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/55">الرصيد القابل للسحب</p>
              <p className={`mt-1 text-2xl font-bold tnum ${me.balance < 0 ? 'text-[#ff7a93]' : ''}`}>{money(me.balance, true)}</p>
            </div>
            <Btn variant="lime" disabled={me.balance <= 0} onClick={() => { cashOut(me.balance); setOut(true) }}>
              سحب فوري
            </Btn>
          </div>
          {me.balance < 0 && <p className="mt-2 text-[13px] text-white/55">الرصيد السالب هو عمولة رحلات نقدية مستحقة لـ AUAR، تُخصم تلقائياً من الرحلات الإلكترونية القادمة.</p>}
          {out && <p className="mt-2 text-[13px] text-lime">✓ تم تحويل المبلغ إلى حسابك البنكي (IBAN •••• 4410)</p>}
        </div>
        <h3 className="mt-6 font-bold">الرحلات الأخيرة</h3>
        <div className="mt-2 divide-y divide-white/10">
          {mine.slice(0, 15).map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3">
              <VehicleArt id={t.category} className="h-8 w-12 shrink-0 rounded bg-white/90 p-0.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{t.dropoff.name}</p>
                <p className="text-[12px] text-white/45 tnum">
                  {day(t.completedAt!)} • {clock(t.completedAt!)} • {t.payment === 'cash' ? 'نقداً' : 'إلكتروني'}
                </p>
              </div>
              <div className="text-end">
                <p className="font-bold tnum">{money(t.fare - t.commission + t.tip)}</p>
                {t.tip > 0 && <p className="text-[11px] text-lime">+ إكرامية {money(t.tip)}</p>}
              </div>
            </div>
          ))}
          {mine.length === 0 && <p className="py-8 text-center text-sm text-white/45">لا توجد رحلات بعد</p>}
        </div>
      </div>
    </div>
  )
}

export function DriverInbox() {
  const s = useStore()
  const list = s.notices.filter((n) => n.audience !== 'riders')
  return (
    <div className="h-full overflow-y-auto px-5 pb-24 pt-14">
      <h1 className="text-2xl font-bold">الوارد</h1>
      <div className="mt-4 space-y-2">
        {list.map((n) => (
          <div key={n.id} className="rounded-2xl bg-ink-2 p-4">
            <div className="flex justify-between gap-2">
              <p className="font-bold">{n.title}</p>
              <span className="shrink-0 text-xs text-white/45">{ago(n.at)}</span>
            </div>
            <p className="mt-1 text-sm text-white/60">{n.body}</p>
          </div>
        ))}
        {list.length === 0 && <p className="py-16 text-center text-white/45">لا توجد رسائل</p>}
      </div>
    </div>
  )
}

export function DriverAccount() {
  const s = useStore()
  const me = s.drivers.find((d) => d.id === s.me.driverId)!
  const [support, setSupport] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const completed = s.trips.filter((t) => t.driverId === me.id && t.status === 'completed').length
  const cancelled = s.trips.filter((t) => t.driverId === me.id && t.status === 'cancelled' && t.cancelledBy === 'driver').length
  return (
    <div className="h-full overflow-y-auto px-5 pb-24 pt-14">
      <div className="flex items-center gap-4">
        <Avatar name={me.name} color={me.color} size={64} />
        <div>
          <h1 className="text-xl font-bold">{me.name}</h1>
          <p className="text-sm text-white/55">
            كابتن منذ {new Date(me.joinedAt).toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          [Star, me.rating.toFixed(2), 'التقييم'],
          [ThumbsUp, `${Math.round(me.acceptRate * 100)}٪`, 'القبول'],
          [Gauge, `${completed}`, 'رحلة'],
        ].map(([I, v, l], i) => {
          const Icon = I as typeof Star
          return (
            <div key={i} className="rounded-2xl bg-ink-2 p-3 text-center">
              <Icon size={18} className="mx-auto text-lime" />
              <p className="mt-1 text-lg font-bold tnum">{v as string}</p>
              <p className="text-[12px] text-white/45">{l as string}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-3 rounded-2xl bg-ink-2 p-4">
        <div className="flex items-center gap-3">
          <Car size={20} className="text-white/60" />
          <div className="flex-1">
            <p className="font-semibold">
              {me.car.make} {me.car.model} {me.car.year}
            </p>
            <p className="text-[13px] text-white/45">
              {me.car.color} • {me.car.plate}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {me.categories.map((c) => (
            <Badge key={c} tone="lime">
              {s.categories.find((x) => x.id === c)?.name}
            </Badge>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-2xl bg-ink-2 p-4">
        <p className="mb-2 font-semibold">المستندات</p>
        {[
          ['license', 'رخصة القيادة'],
          ['idCard', 'الهوية'],
          ['registration', 'استمارة المركبة'],
          ['insurance', 'التأمين'],
        ].map(([k, l]) => (
          <div key={k} className="flex items-center justify-between py-1.5 text-[14px]">
            <span className="flex items-center gap-2">
              <FileCheck2 size={16} className="text-white/45" /> {l}
            </span>
            {me.docs[k as keyof typeof me.docs] ? <span className="text-lime">سارية</span> : <span className="text-[#ff7a93]">مطلوبة</span>}
          </div>
        ))}
      </div>
      {cancelled > 0 && <p className="mt-3 text-[13px] text-white/45">ألغيت {cancelled} رحلة — حافظ على نسبة إلغاء منخفضة للحصول على المكافآت.</p>}
      <button onClick={() => setSupport(!support)} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-ink-2 p-4 text-start">
        <LifeBuoy size={20} className="text-white/60" />
        <span className="flex-1 font-semibold">الدعم الفني للكباتن</span>
        <ChevronLeft size={18} className="text-white/45" />
      </button>
      {support && (
        <div className="fade-in mt-2 rounded-2xl bg-ink-2 p-4">
          <textarea value={text} onChange={(e) => { setText(e.target.value); setSent(false) }} rows={3} placeholder="اكتب مشكلتك…" className="w-full resize-none rounded-xl bg-white/10 p-3 text-white outline-none" />
          <Btn variant="lime" full className="mt-2" disabled={!text.trim()} onClick={() => { openTicket('driver', 'طلب دعم من كابتن', text); setText(''); setSent(true) }}>
            <Send size={16} className="-scale-x-100" /> إرسال
          </Btn>
          {sent && <p className="mt-2 text-sm text-lime">✓ وصلت رسالتك لفريق الدعم</p>}
          {s.tickets
            .filter((t) => t.by === 'driver' && t.userId === me.id)
            .map((t) => (
              <div key={t.id} className="mt-3 border-t border-white/10 pt-3 text-[13px]">
                {t.messages.map((m, i) => (
                  <p key={i} className={m.from === 'admin' ? 'text-lime' : 'text-white/70'}>
                    {m.from === 'admin' ? 'الدعم: ' : 'أنت: '}
                    {m.text}
                  </p>
                ))}
              </div>
            ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-ink-2 p-4">
        <span className="text-sm text-white/55">تقييمك من الركاب</span>
        <RatingPill value={me.rating} dark />
      </div>
      <button onClick={signOutDriver} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-4 font-semibold text-[#ff7a93]">
        <LogOut size={18} /> تسجيل الخروج
      </button>
    </div>
  )
}

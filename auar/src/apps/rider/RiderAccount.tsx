import { useState } from 'react'
import { Clock, Wallet, Tag, ShieldCheck, LifeBuoy, Settings, Bell, LogOut, ChevronLeft, Plus, Car, Star, Check, Send } from 'lucide-react'
import { Avatar, Badge, Btn, Field, Header, PaymentIcon, PAY_LABEL, RatingPill, Row, Toggle, VehicleArt } from '../../components/ui'
import { ago, dayTime, money } from '../../lib/format'
import { findPromo, getMode, getServerInfo, openTicket, signOutRider, topUp, updateRider, useStore } from '../../store/store'
import type { PaymentMethod } from '../../store/types'

export type PageId = 'trips' | 'wallet' | 'promos' | 'safety' | 'support' | 'settings' | 'notifications'

export function RiderMenu({ onClose, onOpen }: { onClose: () => void; onOpen: (p: PageId) => void }) {
  const s = useStore()
  const r = s.riders.find((x) => x.id === s.me.riderId)!
  const items: [PageId, string, typeof Clock][] = [
    ['trips', 'رحلاتي', Clock],
    ['wallet', 'المحفظة والدفع', Wallet],
    ['promos', 'العروض', Tag],
    ['safety', 'الأمان', ShieldCheck],
    ['support', 'المساعدة', LifeBuoy],
    ['notifications', 'الإشعارات', Bell],
    ['settings', 'الإعدادات', Settings],
  ]
  return (
    <div className="fade-in absolute inset-0 z-50 bg-black/40" onClick={onClose}>
      <div className="absolute inset-y-0 right-0 flex w-[82%] flex-col bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: 'auar-fade .2s ease' }}>
        <div className="bg-ink px-5 pb-5 pt-14 text-white">
          <div className="flex items-center gap-3">
            <Avatar name={r.name} color={r.color} size={56} />
            <div>
              <p className="text-lg font-bold">{r.name}</p>
              <RatingPill value={r.rating} dark />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onOpen('wallet')} className="rounded-xl bg-white/10 p-3 text-start">
              <span className="block text-xs text-white/60">المحفظة</span>
              <span className="font-bold tnum">{money(r.wallet)}</span>
            </button>
            <button onClick={() => onOpen('trips')} className="rounded-xl bg-white/10 p-3 text-start">
              <span className="block text-xs text-white/60">الرحلات</span>
              <span className="font-bold tnum">{s.trips.filter((t) => t.riderId === r.id && t.status === 'completed').length}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.map(([id, l, I]) => (
            <Row key={id} icon={<I size={18} />} title={l} onClick={() => onOpen(id)} right={<ChevronLeft size={18} className="text-mute" />} />
          ))}
          <div className="my-2 h-px bg-line" />
          <a href="#driver" className="flex items-center gap-3.5 rounded-xl px-2 py-3 hover:bg-mist">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-lime">
              <Car size={18} />
            </span>
            <span>
              <span className="block font-semibold">اكسب مع AUAR</span>
              <span className="block text-[13px] text-mute">سجّل ككابتن وابدأ الآن</span>
            </span>
          </a>
        </div>
        <div className="border-t border-line p-4 text-center text-xs text-mute">AUAR v1.0</div>
      </div>
    </div>
  )
}

export function RiderPage({ page, onBack, onOpenTrip }: { page: PageId; onBack: () => void; onOpenTrip: (id: string) => void }) {
  return (
    <div className="fade-in h-full overflow-y-auto bg-white">
      {page === 'trips' && <Trips onBack={onBack} onOpenTrip={onOpenTrip} />}
      {page === 'wallet' && <WalletPage onBack={onBack} />}
      {page === 'promos' && <Promos onBack={onBack} />}
      {page === 'safety' && <Safety onBack={onBack} />}
      {page === 'support' && <Support onBack={onBack} />}
      {page === 'settings' && <SettingsPage onBack={onBack} />}
      {page === 'notifications' && <Notifications onBack={onBack} />}
    </div>
  )
}

const STATUS_AR: Record<string, [string, 'ok' | 'bad' | 'warn' | 'info' | 'neutral']> = {
  completed: ['مكتملة', 'ok'],
  cancelled: ['ملغاة', 'bad'],
  no_drivers: ['لم يتوفر كابتن', 'warn'],
  scheduled: ['مجدولة', 'info'],
  searching: ['جارٍ البحث', 'info'],
  accepted: ['الكابتن في الطريق', 'info'],
  arrived: ['الكابتن وصل', 'info'],
  in_progress: ['جارية', 'info'],
}
export const statusBadge = (st: string) => <Badge tone={STATUS_AR[st]?.[1] ?? 'neutral'}>{STATUS_AR[st]?.[0] ?? st}</Badge>

function Trips({ onBack, onOpenTrip }: { onBack: () => void; onOpenTrip: (id: string) => void }) {
  const s = useStore()
  const [tab, setTab] = useState<'past' | 'upcoming'>('past')
  const mine = s.trips.filter((t) => t.riderId === s.me.riderId)
  const list = tab === 'upcoming' ? mine.filter((t) => t.status === 'scheduled') : mine.filter((t) => t.status !== 'scheduled')
  return (
    <>
      <Header title="رحلاتي" onBack={onBack} />
      <div className="flex gap-2 px-5 pb-2">
        {(
          [
            ['past', 'السابقة'],
            ['upcoming', 'القادمة'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? 'bg-ink text-white' : 'bg-mist'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-3 px-5 pb-8 pt-2">
        {list.length === 0 && <p className="py-16 text-center text-mute">لا توجد رحلات {tab === 'upcoming' ? 'مجدولة' : ''}</p>}
        {list.map((t) => (
          <button key={t.id} onClick={() => t.status !== 'scheduled' && onOpenTrip(t.id)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-start hover:bg-mist/50">
            <span className="grid h-14 w-16 shrink-0 place-items-center rounded-xl bg-mist">
              <VehicleArt id={t.category} className="h-9 w-14" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{t.dropoff.name}</span>
              <span className="block text-[13px] text-mute tnum">{dayTime(t.scheduledFor ?? t.completedAt ?? t.cancelledAt ?? t.requestedAt)}</span>
              <span className="mt-1 block">{statusBadge(t.status)}</span>
            </span>
            <span className="text-end">
              <span className="block font-bold tnum">{t.status === 'completed' ? money(t.fare + t.tip) : t.cancelFee ? money(t.cancelFee) : '—'}</span>
              {t.riderRating && (
                <span className="mt-1 flex items-center justify-end gap-0.5 text-xs text-mute">
                  <Star size={11} className="fill-ink text-ink" /> {t.riderRating}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function WalletPage({ onBack }: { onBack: () => void }) {
  const s = useStore()
  const r = s.riders.find((x) => x.id === s.me.riderId)!
  const [amt, setAmt] = useState(50)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <>
      <Header title="المحفظة" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white">
          <svg viewBox="0 0 200 120" className="absolute -left-6 -top-4 h-40 opacity-25" aria-hidden>
            <path d="M10 110 L100 10 L190 110" fill="none" stroke="#c8f31d" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-white/60">رصيد AUAR Cash</p>
          <p className="mt-1 text-4xl font-bold tnum">{money(r.wallet, true)}</p>
          <p className="mt-6 text-xs text-white/50">يُستخدم الرصيد تلقائياً عند اختيار المحفظة كطريقة دفع</p>
        </div>
        <h3 className="mt-6 font-bold">شحن الرصيد</h3>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[25, 50, 100, 200].map((a) => (
            <button key={a} onClick={() => { setAmt(a); setDone(false) }} className={`h-12 rounded-xl font-bold tnum ${amt === a ? 'bg-ink text-white' : 'bg-mist'}`}>
              {a}
            </button>
          ))}
        </div>
        <Btn
          full
          size="lg"
          className="mt-3"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            setErr('')
            topUp(amt)
              .then((r) => {
                if (r.url) location.href = r.url
                else setDone(true)
              })
              .catch((e: Error) => setErr(e.message))
              .finally(() => setBusy(false))
          }}
        >
          {done ? <><Check size={18} /> تم الشحن</> : `شحن ${money(amt)} بالبطاقة`}
        </Btn>
        {err && <p className="mt-2 text-sm text-bad">{err}</p>}
        {getMode() === 'remote' && getServerInfo().payments === 'moyasar' && <p className="mt-2 text-xs text-mute">ستنتقل إلى صفحة دفع آمنة (مدى، فيزا، ماستركارد، Apple Pay) ثم تعود للتطبيق.</p>}
        <h3 className="mt-7 font-bold">طرق الدفع</h3>
        <div className="mt-1">
          {(['card', 'apple', 'wallet', 'cash'] as PaymentMethod[]).map((m) => (
            <Row key={m} icon={<PaymentIcon m={m} />} title={PAY_LABEL[m]} right={r.defaultPayment === m ? <Badge tone="dark">الافتراضية</Badge> : <button className="text-sm font-semibold text-mute" onClick={() => updateRider({ defaultPayment: m })}>تعيين</button>} />
          ))}
          <Row icon={<Plus size={18} />} title="إضافة بطاقة" sub="مدى، فيزا، ماستركارد" />
        </div>
      </div>
    </>
  )
}

function Promos({ onBack }: { onBack: () => void }) {
  const s = useStore()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <>
      <Header title="العروض" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="أدخل رمزاً ترويجياً" dir="ltr" className="h-12 flex-1 rounded-xl bg-mist px-4 text-center font-semibold tracking-widest outline-none focus:ring-2 focus:ring-ink" />
          <Btn
            onClick={() => {
              const p = findPromo(s, code)
              setMsg(p && p.active ? `✓ الرمز صالح: ${p.desc} — اختره عند الطلب` : 'الرمز غير صالح أو منتهي')
            }}
          >
            تحقق
          </Btn>
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
        <div className="mt-5 space-y-3">
          {s.promos.map((p) => (
            <div key={p.code} className={`rounded-2xl p-4 ${p.active ? 'bg-lime' : 'bg-mist opacity-60'}`}>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tracking-wider" dir="ltr">{p.code}</span>
                {!p.active && <Badge>منتهي</Badge>}
              </div>
              <p className="mt-1 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Safety({ onBack }: { onBack: () => void }) {
  const s = useStore()
  const r = s.riders.find((x) => x.id === s.me.riderId)!
  const [name, setName] = useState(r.emergencyName)
  const [phone, setPhone] = useState(r.emergencyPhone)
  const [saved, setSaved] = useState(false)
  return (
    <>
      <Header title="الأمان" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="rounded-2xl bg-mist p-4 text-sm">
          <p className="font-bold">ميزات الأمان في كل رحلة</p>
          <ul className="mt-2 space-y-1.5 text-mute">
            <li>• رمز تحقق PIN قبل بدء كل رحلة</li>
            <li>• مشاركة الرحلة المباشرة مع من تثق بهم</li>
            <li>• زر طوارئ يربطك بالفريق والجهات المختصة</li>
            <li>• اتصال ومحادثة بأرقام مخفية</li>
            <li>• التحقق من هوية الكباتن وفحص السجل</li>
          </ul>
        </div>
        <h3 className="mt-6 font-bold">جهة اتصال للطوارئ</h3>
        <div className="mt-3 space-y-3">
          <Field label="الاسم" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} />
          <Field label="رقم الجوال" value={phone} dir="ltr" onChange={(e) => { setPhone(e.target.value); setSaved(false) }} />
          <Btn full onClick={() => { updateRider({ emergencyName: name, emergencyPhone: phone }); setSaved(true) }}>
            {saved ? 'تم الحفظ ✓' : 'حفظ'}
          </Btn>
        </div>
      </div>
    </>
  )
}

function Support({ onBack }: { onBack: () => void }) {
  const s = useStore()
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const mine = s.tickets.filter((t) => t.by === 'rider' && t.userId === s.me.riderId)
  const last = s.trips.find((t) => t.riderId === s.me.riderId && t.status === 'completed')
  const topics = ['تم احتساب مبلغ خاطئ', 'نسيت غرضاً في السيارة', 'مشكلة مع الكابتن', 'مشكلة في الدفع', 'حسابي والإعدادات']
  const ticket = mine.find((t) => t.id === open)
  if (ticket)
    return (
      <>
        <Header title={ticket.subject} onBack={() => setOpen(null)} />
        <div className="space-y-2 px-5 pb-8">
          {ticket.messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] ${m.from === 'user' ? 'bg-ink text-white' : 'bg-mist'}`}>
                {m.from === 'admin' && <span className="mb-0.5 block text-[11px] font-bold">فريق دعم AUAR</span>}
                {m.text}
              </div>
            </div>
          ))}
          {ticket.status === 'closed' && <p className="pt-3 text-center text-xs text-mute">تم إغلاق هذه التذكرة</p>}
        </div>
      </>
    )
  return (
    <>
      <Header title="المساعدة" onBack={onBack} />
      <div className="px-5 pb-8">
        {last && (
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs text-mute">آخر رحلة</p>
            <p className="font-semibold">{last.dropoff.name}</p>
            <p className="text-sm text-mute tnum">
              {dayTime(last.completedAt!)} • {money(last.fare)}
            </p>
          </div>
        )}
        <h3 className="mt-5 font-bold">بماذا يمكننا مساعدتك؟</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {topics.map((t) => (
            <button key={t} onClick={() => setSubject(t)} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold ${subject === t ? 'bg-ink text-white' : 'bg-mist'}`}>
              {t}
            </button>
          ))}
        </div>
        {subject && (
          <div className="fade-in mt-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="اشرح المشكلة باختصار…" className="w-full resize-none rounded-2xl bg-mist p-4 outline-none focus:ring-2 focus:ring-ink" />
            <Btn full className="mt-2" disabled={!text.trim()} onClick={() => { openTicket('rider', subject, text, last?.id); setSubject(''); setText('') }}>
              <Send size={16} className="-scale-x-100" /> إرسال للدعم
            </Btn>
          </div>
        )}
        {mine.length > 0 && (
          <>
            <h3 className="mt-6 font-bold">تذاكري</h3>
            {mine.map((t) => (
              <Row key={t.id} icon={<LifeBuoy size={18} />} title={t.subject} sub={`${ago(t.at)} • ${t.messages.length} رسائل`} right={<Badge tone={t.status === 'open' ? (t.messages.some((m) => m.from === 'admin') ? 'info' : 'warn') : 'ok'}>{t.status === 'open' ? (t.messages.some((m) => m.from === 'admin') ? 'تم الرد' : 'مفتوحة') : 'مغلقة'}</Badge>} onClick={() => setOpen(t.id)} />
            ))}
          </>
        )}
      </div>
    </>
  )
}

function SettingsPage({ onBack }: { onBack: () => void }) {
  const s = useStore()
  const r = s.riders.find((x) => x.id === s.me.riderId)!
  const [name, setName] = useState(r.name)
  const [email, setEmail] = useState(r.email)
  const [quiet, setQuiet] = useState(false)
  return (
    <>
      <Header title="الإعدادات" onBack={onBack} />
      <div className="space-y-3 px-5 pb-8">
        <Field label="الاسم" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => updateRider({ name })} />
        <Field label="البريد الإلكتروني" value={email} dir="ltr" onChange={(e) => setEmail(e.target.value)} onBlur={() => updateRider({ email })} />
        <Field label="الجوال" value={r.phone} dir="ltr" disabled />
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-mute">الجنس (لخدمة AUAR Her)</span>
          <div className="flex gap-2">
            {(
              [
                ['m', 'ذكر'],
                ['f', 'أنثى'],
              ] as const
            ).map(([g, l]) => (
              <button key={g} onClick={() => updateRider({ gender: g })} className={`h-11 flex-1 rounded-xl font-semibold ${r.gender === g ? 'bg-ink text-white' : 'bg-mist'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-mist px-4 py-3">
          <span className="font-semibold">رحلة هادئة (تفضيل عدم المحادثة)</span>
          <Toggle on={quiet} onChange={setQuiet} />
        </div>
        <Btn variant="secondary" full onClick={signOutRider} className="!text-bad">
          <LogOut size={18} /> تسجيل الخروج
        </Btn>
      </div>
    </>
  )
}

function Notifications({ onBack }: { onBack: () => void }) {
  const s = useStore()
  const list = s.notices.filter((n) => n.audience !== 'drivers')
  return (
    <>
      <Header title="الإشعارات" onBack={onBack} />
      <div className="px-5 pb-8">
        {list.length === 0 && <p className="py-16 text-center text-mute">لا توجد إشعارات</p>}
        {list.map((n) => (
          <div key={n.id} className="border-b border-line py-3">
            <div className="flex justify-between gap-2">
              <p className="font-bold">{n.title}</p>
              <span className="shrink-0 text-xs text-mute">{ago(n.at)}</span>
            </div>
            <p className="mt-0.5 text-sm text-mute">{n.body}</p>
          </div>
        ))}
      </div>
    </>
  )
}

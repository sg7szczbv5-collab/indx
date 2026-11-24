import { useState } from 'react'
import { Zap, Trash2, Send, CheckCircle2, RotateCcw, Plus } from 'lucide-react'
import { Badge, Btn, Toggle, VehicleArt, Avatar } from '../../components/ui'
import { ago, money } from '../../lib/format'
import { baseFare } from '../../lib/pricing'
import { deletePromo, replyTicket, resetDemo, savePromo, sendNotice, updateCategory, updateSettings, useStore } from '../../store/store'
import type { Promo } from '../../store/types'
import { Card, PageTitle } from './AdminApp'

function Num({ value, onChange, step = 0.1, min = 0, suffix }: { value: number; onChange: (v: number) => void; step?: number; min?: number; suffix?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <input type="number" value={value} step={step} min={min} onChange={(e) => onChange(Math.max(min, Number(e.target.value)))} className="h-9 w-20 rounded-lg border border-line bg-white px-2 text-center text-sm outline-none focus:border-ink tnum" dir="ltr" />
      {suffix && <span className="text-xs text-mute">{suffix}</span>}
    </span>
  )
}

export function PricingPage() {
  const s = useStore()
  const st = s.settings
  return (
    <>
      <PageTitle title="التسعير والخدمات" sub="تعديل الأسعار يُطبَّق فوراً على كل الطلبات الجديدة في تطبيق الراكب" />
      <Card
        title="التسعير الديناميكي (وقت الذروة)"
        right={<Toggle on={st.surgeOn} onChange={(v) => updateSettings({ surgeOn: v })} label="تفعيل التسعير الديناميكي" />}
        className="mb-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Zap className={st.surgeOn ? 'text-warn' : 'text-mute'} />
          <label className="flex flex-1 items-center gap-3 text-sm">
            المعامل
            <input type="range" min={1.1} max={3} step={0.1} value={st.surge} onChange={(e) => updateSettings({ surge: Number(e.target.value) })} className="flex-1 accent-ink" />
            <b className="w-12 text-lg tnum">×{st.surge.toFixed(1)}</b>
          </label>
          <p className="w-full text-xs text-mute">عند التفعيل يرى الركاب شارة «الطلب مرتفع» ويرى الكباتن تنبيه الأرباح الإضافية.</p>
        </div>
      </Card>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-mist/60 text-xs text-mute">
            <tr>
              {['الخدمة', 'فتح العداد', 'لكل كم', 'لكل دقيقة', 'الحد الأدنى', 'مثال ١٠ كم / ١٨ د', 'الكباتن', 'مفعّلة'].map((h) => (
                <th key={h} className="px-4 py-3 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.categories.map((c) => (
              <tr key={c.id} className={c.enabled ? '' : 'opacity-50'}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <VehicleArt id={c.id} className="h-8 w-14" />
                    <span>
                      <span className="block font-semibold" dir="auto">{c.name}</span>
                      <span className="block max-w-[180px] truncate text-xs text-mute">{c.desc}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Num value={c.base} onChange={(v) => updateCategory(c.id, { base: v })} step={0.5} />
                </td>
                <td className="px-4 py-3">
                  <Num value={c.perKm} onChange={(v) => updateCategory(c.id, { perKm: v })} />
                </td>
                <td className="px-4 py-3">
                  <Num value={c.perMin} onChange={(v) => updateCategory(c.id, { perMin: v })} step={0.05} />
                </td>
                <td className="px-4 py-3">
                  <Num value={c.minFare} onChange={(v) => updateCategory(c.id, { minFare: v })} step={1} />
                </td>
                <td className="px-4 py-3 font-semibold tnum">{money(baseFare(c, 10, 18) * (st.surgeOn ? st.surge : 1))}</td>
                <td className="px-4 py-3 tnum">{s.drivers.filter((d) => d.status === 'active' && d.categories.includes(c.id)).length}</td>
                <td className="px-4 py-3">
                  <Toggle on={c.enabled} onChange={(v) => updateCategory(c.id, { enabled: v })} label={`تفعيل ${c.name}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function PromosPage() {
  const s = useStore()
  const empty: Promo = { code: '', kind: 'percent', value: 15, maxDiscount: 20, active: true, uses: 0, limit: 500, desc: '' }
  const [f, setF] = useState<Promo>(empty)
  const valid = /^[A-Z0-9]{3,12}$/.test(f.code) && f.value > 0
  return (
    <>
      <PageTitle title="العروض والأكواد" sub="أنشئ رموزاً ترويجية يستخدمها الركاب عند الطلب" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-mist/60 text-xs text-mute">
              <tr>
                {['الرمز', 'الخصم', 'الاستخدام', 'الوصف', 'الحالة', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {s.promos.map((p) => (
                <tr key={p.code}>
                  <td className="px-4 py-3 font-bold tracking-wider" dir="ltr">
                    {p.code}
                  </td>
                  <td className="px-4 py-3 tnum">{p.kind === 'percent' ? `${p.value}٪ (حد ${p.maxDiscount})` : money(p.value)}</td>
                  <td className="px-4 py-3">
                    <span className="tnum">
                      {p.uses} / {p.limit}
                    </span>
                    <div className="mt-1 h-1.5 w-24 rounded-full bg-mist">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, (p.uses / p.limit) * 100)}%` }} />
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-mute">{p.desc}</td>
                  <td className="px-4 py-3">
                    <Toggle on={p.active} onChange={(v) => savePromo({ ...p, active: v })} label={`تفعيل ${p.code}`} />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deletePromo(p.code)} className="text-mute hover:text-bad" aria-label="حذف">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card title="رمز جديد">
          <div className="space-y-3 text-sm">
            <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="SUMMER25" dir="ltr" className="h-11 w-full rounded-xl border border-line px-3 font-bold tracking-wider outline-none focus:border-ink" />
            <div className="flex gap-2">
              {(
                [
                  ['percent', 'نسبة ٪'],
                  ['flat', 'مبلغ ثابت'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} onClick={() => setF({ ...f, kind: k })} className={`h-10 flex-1 rounded-xl font-semibold ${f.kind === k ? 'bg-ink text-white' : 'bg-mist'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span>القيمة</span>
              <Num value={f.value} onChange={(v) => setF({ ...f, value: v })} step={1} suffix={f.kind === 'percent' ? '٪' : 'ر.س'} />
              {f.kind === 'percent' && (
                <>
                  <span>الحد الأقصى</span>
                  <Num value={f.maxDiscount} onChange={(v) => setF({ ...f, maxDiscount: v })} step={1} suffix="ر.س" />
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>عدد الاستخدامات</span>
              <Num value={f.limit} onChange={(v) => setF({ ...f, limit: v })} step={50} />
            </div>
            <input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="وصف يظهر للراكب" className="h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-ink" />
            <Btn
              full
              disabled={!valid}
              onClick={() => {
                savePromo({ ...f, desc: f.desc || (f.kind === 'percent' ? `خصم ${f.value}٪ حتى ${f.maxDiscount} ر.س` : `خصم ${f.value} ر.س`) })
                setF(empty)
              }}
            >
              <Plus size={16} /> إنشاء الرمز
            </Btn>
          </div>
        </Card>
      </div>
    </>
  )
}

export function SupportPage() {
  const s = useStore()
  const [sel, setSel] = useState<string | null>(s.tickets.find((t) => t.status === 'open')?.id ?? null)
  const [text, setText] = useState('')
  const t = s.tickets.find((x) => x.id === sel)
  const who = (by: 'rider' | 'driver', id: string) => (by === 'rider' ? s.riders.find((r) => r.id === id) : s.drivers.find((d) => d.id === id))
  return (
    <>
      <PageTitle title="الدعم والشكاوى" sub={`${s.tickets.filter((x) => x.status === 'open').length} تذكرة مفتوحة`} />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="max-h-[620px] space-y-2 overflow-y-auto">
          {s.tickets.map((x) => {
            const u = who(x.by, x.userId)
            return (
              <button key={x.id} onClick={() => setSel(x.id)} className={`w-full rounded-2xl border p-4 text-start ${sel === x.id ? 'border-ink bg-white' : 'border-line bg-white/70 hover:bg-white'}`}>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={x.by === 'rider' ? 'info' : 'lime'}>{x.by === 'rider' ? 'راكب' : 'كابتن'}</Badge>
                  <span className="text-xs text-mute">{ago(x.at)}</span>
                </div>
                <p className="mt-2 font-semibold">{x.subject}</p>
                <p className="text-sm text-mute">{u?.name}</p>
                <div className="mt-2">{x.status === 'open' ? <Badge tone="warn">مفتوحة</Badge> : <Badge tone="ok">مغلقة</Badge>}</div>
              </button>
            )
          })}
          {s.tickets.length === 0 && <p className="text-sm text-mute">لا توجد تذاكر</p>}
        </div>
        {t ? (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <Avatar name={who(t.by, t.userId)?.name ?? '؟'} color={who(t.by, t.userId)?.color} />
                <div>
                  <p className="font-bold">{t.subject}</p>
                  <p className="text-sm text-mute">
                    {who(t.by, t.userId)?.name} {t.tripId && <>• الرحلة <span className="font-mono">{t.tripId}</span></>}
                  </p>
                </div>
              </div>
              {t.status === 'open' && (
                <Btn size="sm" variant="secondary" onClick={() => replyTicket(t.id, '', true)}>
                  <CheckCircle2 size={16} /> إغلاق التذكرة
                </Btn>
              )}
            </div>
            <div className="space-y-2 py-4">
              {t.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.from === 'admin' ? 'bg-ink text-white' : 'bg-mist'}`}>
                    {m.text}
                    <span className="mt-1 block text-[10px] opacity-50">{ago(m.at)}</span>
                  </div>
                </div>
              ))}
            </div>
            {t.status === 'open' && (
              <>
                <div className="mb-2 flex flex-wrap gap-2">
                  {['تمت مراجعة طلبك وإضافة رصيد تعويضي لمحفظتك.', 'نعتذر عن التجربة، تم التواصل مع الكابتن.', 'تم تحويل المبلغ، سيصلك خلال ٢٤ ساعة.'].map((q) => (
                    <button key={q} onClick={() => setText(q)} className="rounded-full border border-line px-3 py-1 text-xs hover:bg-mist">
                      {q}
                    </button>
                  ))}
                </div>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); replyTicket(t.id, text); setText('') }}>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب ردك…" className="h-11 flex-1 rounded-xl border border-line px-3 outline-none focus:border-ink" />
                  <Btn disabled={!text.trim()}>
                    <Send size={16} className="-scale-x-100" /> إرسال
                  </Btn>
                </form>
              </>
            )}
          </Card>
        ) : (
          <Card>
            <p className="py-16 text-center text-mute">اختر تذكرة لعرضها</p>
          </Card>
        )}
      </div>
    </>
  )
}

export function NoticesPage() {
  const s = useStore()
  const [aud, setAud] = useState<'riders' | 'drivers' | 'all'>('riders')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  return (
    <>
      <PageTitle title="الإشعارات" sub="أرسل إشعارات فورية تظهر في تطبيق الراكب أو الكابتن" />
      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        <Card title="إشعار جديد">
          <div className="space-y-3">
            <div className="flex gap-2">
              {(
                [
                  ['riders', 'الركاب'],
                  ['drivers', 'الكباتن'],
                  ['all', 'الجميع'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} onClick={() => setAud(k)} className={`h-10 flex-1 rounded-xl text-sm font-semibold ${aud === k ? 'bg-ink text-white' : 'bg-mist'}`}>
                  {l}
                </button>
              ))}
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان" className="h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-ink" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="نص الإشعار" className="w-full resize-none rounded-xl border border-line p-3 outline-none focus:border-ink" />
            <Btn full disabled={!title.trim() || !body.trim()} onClick={() => { sendNotice(aud, title, body); setTitle(''); setBody('') }}>
              <Send size={16} className="-scale-x-100" /> إرسال الآن
            </Btn>
          </div>
        </Card>
        <Card title="المرسلة">
          <div className="divide-y divide-line">
            {s.notices.map((n) => (
              <div key={n.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{n.title}</p>
                  <span className="flex items-center gap-2">
                    <Badge tone={n.audience === 'drivers' ? 'lime' : n.audience === 'riders' ? 'info' : 'dark'}>{n.audience === 'drivers' ? 'الكباتن' : n.audience === 'riders' ? 'الركاب' : 'الجميع'}</Badge>
                    <span className="text-xs text-mute">{ago(n.at)}</span>
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-mute">{n.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

export function SettingsPage() {
  const s = useStore()
  const st = s.settings
  const [confirm, setConfirm] = useState(false)
  const row = (l: string, sub: string, c: React.ReactNode) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0">
      <div>
        <p className="font-semibold">{l}</p>
        <p className="text-xs text-mute">{sub}</p>
      </div>
      {c}
    </div>
  )
  return (
    <>
      <PageTitle title="إعدادات المنصة" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="العمولات والرسوم">
          {row('عمولة المنصة', 'تُخصم من أجرة كل رحلة مكتملة', <Num value={Math.round(st.commission * 100)} onChange={(v) => updateSettings({ commission: Math.min(60, v) / 100 })} step={1} suffix="٪" />)}
          {row('رسوم الإلغاء المتأخر', 'تُدفع للكابتن إذا ألغى الراكب بعد المهلة', <Num value={st.cancelFee} onChange={(v) => updateSettings({ cancelFee: v })} step={1} suffix="ر.س" />)}
          {row('مهلة الإلغاء المجاني', 'بعد قبول الكابتن للطلب', <Num value={st.freeCancelSec} onChange={(v) => updateSettings({ freeCancelSec: v })} step={30} suffix="ث" />)}
          {row('ضريبة القيمة المضافة', 'مشمولة في الأسعار المعروضة', <Num value={Math.round(st.vat * 100)} onChange={(v) => updateSettings({ vat: v / 100 })} step={1} suffix="٪" />)}
        </Card>
        <Card title="التوزيع (Dispatch)">
          {row('مهلة قبول الطلب', 'الوقت المتاح للكابتن قبل تحويل الطلب لغيره', <Num value={st.offerSec} onChange={(v) => updateSettings({ offerSec: Math.max(5, v) })} step={5} suffix="ث" />)}
          {row('كباتن المحاكاة', 'كباتن افتراضيون يقبلون الطلبات ويكملون الرحلات تلقائياً', <Toggle on={st.autoBots} onChange={(v) => updateSettings({ autoBots: v })} label="كباتن المحاكاة" />)}
          {row('سرعة المحاكاة', 'تسريع الزمن للعرض التجريبي (×١ = واقعي)', <Num value={st.speed} onChange={(v) => updateSettings({ speed: Math.max(1, v) })} step={1} suffix="×" />)}
        </Card>
        <Card title="البيانات التجريبية" className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">إعادة المنصة لحالتها الأولى (الرحلات، الكباتن، الأسعار، التذاكر…). تُحفظ البيانات في هذا المتصفح وتتزامن بين النوافذ المفتوحة.</p>
            {confirm ? (
              <span className="flex gap-2">
                <Btn variant="danger" size="sm" onClick={() => { resetDemo(); setConfirm(false) }}>
                  تأكيد إعادة الضبط
                </Btn>
                <Btn variant="secondary" size="sm" onClick={() => setConfirm(false)}>
                  إلغاء
                </Btn>
              </span>
            ) : (
              <Btn variant="secondary" size="sm" onClick={() => setConfirm(true)}>
                <RotateCcw size={15} /> إعادة ضبط البيانات
              </Btn>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

export function LogPage() {
  const s = useStore()
  return (
    <>
      <PageTitle title="سجل النشاط" sub="آخر ٨٠ عملية على المنصة" />
      <Card>
        <div className="divide-y divide-line text-sm">
          {s.log.map((l, i) => (
            <div key={i} className="flex justify-between gap-3 py-2.5">
              <span>{l.text}</span>
              <span className="shrink-0 text-xs text-mute">{new Date(l.at).toLocaleString('ar-SA-u-nu-latn-ca-gregory')}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

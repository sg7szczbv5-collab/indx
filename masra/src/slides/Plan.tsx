import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import {
  AlertTriangle,
  Building2,
  CarFront,
  CheckCircle2,
  CreditCard,
  FileSignature,
  Landmark,
  Lock,
  Network,
  Play,
  ShieldPlus,
  Smartphone,
  FileText,
  Target,
} from 'lucide-react'
import { GhostButton, PrimaryButton, SlideHeader, SlideShell, ease, sar } from '../components/ui'
import { Logo, LogoMark } from '../components/Logo'
import { BUDGET, BUDGET_CAP, COMPLIANCE, ROADMAP } from '../data/content'
import type { SlideProps } from './types'

/* ───────────── 11 BUDGET ───────────── */

export function Budget() {
  const [sel, setSel] = useState<string>('guarantee')
  const total = BUDGET.reduce((a, b) => a + b.value, 0)
  const item = BUDGET.find((b) => b.id === sel)!
  const opex = total - BUDGET.filter((b) => b.nonOpex).reduce((a, b) => a + b.value, 0)

  return (
    <SlideShell>
      <SlideHeader index={11} eyebrow="الميزانية الاستثمارية" title={<>ميزانية تخطيطية بسقف <span className="num text-green-3">{sar(BUDGET_CAP)}</span> ر.س</>} subtitle="تمويل ذاتي من المؤسس — أقل من مليون ريال. اضغط على أي بند لعرض تفاصيله." />

      <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease }} className="relative mx-auto aspect-square w-full max-w-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={BUDGET}
                dataKey="value"
                nameKey="label"
                innerRadius="64%"
                outerRadius="94%"
                paddingAngle={1.2}
                stroke="#0b0d0c"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                onClick={(d) => setSel((d as unknown as { id: string }).id)}
                onMouseEnter={(d) => setSel((d as unknown as { id: string }).id)}
              >
                {BUDGET.map((b) => (
                  <Cell key={b.id} fill={b.color} opacity={sel === b.id ? 1 : 0.38} style={{ cursor: 'pointer', outline: 'none' }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <AnimatePresence mode="wait">
              <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="px-16">
                <div className="num text-4xl font-bold">{((item.value / total) * 100).toFixed(1)}%</div>
                <div className="num mt-1 text-sm text-white/70">{sar(item.value)} ر.س</div>
                <div className="mt-1 text-xs leading-5 text-white/45">{item.short}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {BUDGET.map((b, i) => (
              <motion.button
                key={b.id}
                type="button"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                onClick={() => setSel(b.id)}
                onMouseEnter={() => setSel(b.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${sel === b.id ? 'bg-ink-3 ring-1 ring-white/15' : 'hover:bg-ink-2'}`}
              >
                <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: b.color }} />
                <span className="flex-1 text-[13px] leading-5 text-white/80">{b.label}</span>
                <span className="num text-[13px] font-semibold">{sar(b.value / 1000)}k</span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`rounded-2xl border p-4 text-sm leading-7 ${item.nonOpex ? 'border-gold/40 bg-gold/10 text-white/85' : 'border-line bg-ink-2/80 text-white/70'}`}>
              {item.nonOpex && (
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-gold">
                  <AlertTriangle size={14} /> ليس مصروفاً تشغيلياً
                </div>
              )}
              <span className="font-semibold text-white">{item.label}: </span>
              {item.note}
            </motion.div>
          </AnimatePresence>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-line p-3">
              <div className="text-[11px] text-white/45">الإجمالي</div>
              <div className="num text-lg font-bold">{sar(total)}</div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="text-[11px] text-white/45">مصروفات وتأسيس</div>
              <div className="num text-lg font-bold">{sar(opex)}</div>
            </div>
            <div className="rounded-xl border border-gold/30 p-3">
              <div className="text-[11px] text-gold/80">ضمان محتمل</div>
              <div className="num text-lg font-bold">{sar(total - opex)}</div>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  )
}

/* ───────────── 12 ROADMAP ───────────── */

export function Roadmap() {
  const [sel, setSel] = useState(0)
  const p = ROADMAP[sel]
  return (
    <SlideShell>
      <SlideHeader index={12} eyebrow="خطة الإطلاق" title="سبع مراحل من الفكرة إلى التوسع." subtitle="جدول زمني تقديري — اضغط على أي مرحلة لعرض تفاصيلها." />
      <div className="relative mt-10">
        <div className="absolute top-6 right-6 left-6 hidden h-px bg-line md:block" />
        <motion.div className="absolute top-6 right-6 hidden h-px origin-right bg-green-3 md:block" animate={{ width: `calc(${(sel / (ROADMAP.length - 1)) * 100}% - ${(sel / (ROADMAP.length - 1)) * 48}px)` }} transition={{ duration: 0.5, ease }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7 md:gap-2">
          {ROADMAP.map((r, i) => {
            const on = i === sel
            const done = i < sel
            return (
              <button key={r.n} type="button" onClick={() => setSel(i)} className="group relative flex flex-col items-start text-start md:items-center md:text-center">
                <motion.span
                  animate={{ scale: on ? 1.1 : 1 }}
                  className={`num relative z-10 grid h-12 w-12 place-items-center rounded-full border-2 text-sm font-bold transition ${on ? 'border-green-3 bg-green-3 text-ink' : done ? 'border-green-3 bg-ink text-green-3' : 'border-line bg-ink text-white/50 group-hover:border-white/40'}`}
                >
                  {done ? <CheckCircle2 size={18} /> : r.n}
                </motion.span>
                <span className={`mt-3 text-[13px] leading-5 font-semibold ${on ? 'text-white' : 'text-white/55'}`}>{r.title}</span>
                <span className="num mt-1 text-[11px] text-white/35">{r.window}</span>
              </button>
            )
          })}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={sel} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }} className="mt-10 grid gap-4 rounded-3xl border border-line bg-ink-2/80 p-6 md:grid-cols-[1fr_1.4fr_1fr]">
          <div>
            <div className="text-xs text-green-3">المرحلة {p.n}</div>
            <div className="mt-1 text-2xl font-bold">{p.title}</div>
            <div className="num mt-1 text-sm text-white/45">{p.window} · تقديري</div>
          </div>
          <ul className="space-y-2">
            {p.items.map((it) => (
              <li key={it} className="flex items-center gap-2 text-[15px] text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-green-3" /> {it}
              </li>
            ))}
          </ul>
          <div className="rounded-2xl bg-ink-3 p-4">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Target size={14} /> مؤشر الإنجاز
            </div>
            <div className="mt-1 font-semibold">{p.kpi}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </SlideShell>
  )
}

/* ───────────── 13 COMPLIANCE ───────────── */

const C_ICONS = [Building2, FileSignature, CarFront, Network, Lock, CreditCard, ShieldPlus]

export function Compliance() {
  const [open, setOpen] = useState<number | null>(1)
  return (
    <SlideShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <SlideHeader index={13} eyebrow="التراخيص والامتثال" title="متطلبات نظامية يجب التحقق منها قبل الإطلاق." />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-5">
            <div className="flex items-center gap-2 font-bold text-gold">
              <AlertTriangle size={18} /> إفصاح مهم
            </div>
            <p className="mt-2 text-sm leading-7 text-white/80">
              المشروع <b>غير مرخّص حالياً</b>، ولم تصدر أي موافقات. القائمة أدناه إرشادية، والمتطلبات النهائية — بما فيها أي ضمان مالي — يجب التحقق منها لدى <b>الهيئة العامة للنقل</b> والجهات المختصة قبل الإطلاق.
            </p>
          </motion.div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
            <Landmark size={14} /> الحالة لجميع البنود: بانتظار التحقق
          </div>
        </div>
        <div className="space-y-2">
          {COMPLIANCE.map((c, i) => {
            const I = C_ICONS[i]
            const on = open === i
            return (
              <motion.div key={c.t} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05, ease }} className={`overflow-hidden rounded-2xl border transition ${on ? 'border-white/20 bg-ink-3' : 'border-line bg-ink-2/70'}`}>
                <button type="button" onClick={() => setOpen(on ? null : i)} className="flex w-full items-center gap-3 p-4 text-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-4 text-white/80">
                    <I size={18} />
                  </span>
                  <span className="flex-1 font-semibold">{c.t}</span>
                  <span className="hidden rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-300 sm:inline">يتطلب التحقق</span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 pb-4 ps-[68px] text-sm text-white/60">
                        <span>{c.d}</span>
                        <span className="text-xs text-white/40">الجهة المرجعية: {c.who}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </SlideShell>
  )
}

/* ───────────── 14 CLOSING ───────────── */

export function Closing({ go, openSummary }: SlideProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 glow-green" />
      <svg viewBox="0 0 1200 600" className="pointer-events-none absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <motion.path key={i} d={`M-50 ${520 - i * 60} C 300 ${420 - i * 80}, 700 ${560 - i * 40}, 1250 ${200 - i * 30}`} fill="none" stroke="#1fa36a" strokeOpacity={0.5 - i * 0.1} strokeWidth="1.2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, delay: i * 0.2 }} />
        ))}
      </svg>
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease }}>
          <LogoMark size={76} animate />
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }} className="mt-6 text-5xl font-bold sm:text-6xl">
          مَسْرى <span className="text-white/25">|</span> <span className="tracking-[0.18em]">MASRA</span>
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease }} className="mt-5 text-xl font-semibold text-green-3 sm:text-2xl">
          نحو تجربة تنقل سعودية أكثر ذكاءً.
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8, ease }} className="mt-2 text-white/55 sm:text-lg">
          من فكرة محلية إلى منصة قابلة للتوسع.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease }} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={() => go(4)}>
            <Smartphone size={18} /> استكشف نموذج التطبيق
          </PrimaryButton>
          <GhostButton onClick={openSummary}>
            <FileText size={16} /> عرض الملخص الاستثماري
          </GhostButton>
        </motion.div>
        <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={() => go(0)} className="mt-6 flex items-center gap-2 text-sm text-white/40 hover:text-white">
          <Play size={14} className="rotate-180" /> العودة إلى البداية
        </motion.button>
        <div className="absolute bottom-6">
          <Logo size={22} />
        </div>
      </div>
    </div>
  )
}


import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MousePointerClick, RotateCcw } from 'lucide-react'
import { PhoneFrame } from '../components/PhoneFrame'
import { DemoBadge, SlideHeader, SlideShell, ease } from '../components/ui'
import { RIDER_STEPS, RiderApp, type RiderScreen } from '../apps/rider/RiderApp'
import { DRIVER_STEPS, DriverApp, type DriverScreen } from '../apps/driver/DriverApp'

function StepList({
  steps,
  activeIdx,
  onPick,
}: {
  steps: { label: string }[]
  activeIdx: number
  onPick: (i: number) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1">
      {steps.map((s, i) => {
        const on = i === activeIdx
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-start text-[13px] transition ${
              on ? 'bg-white text-ink' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`num grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${on ? 'bg-ink text-white' : 'bg-ink-4 text-white/60'}`}>
              {i + 1}
            </span>
            <span className="leading-5 font-medium">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Controls({ onPrev, onNext, onReset, canPrev, canNext }: { onPrev: () => void; onNext: () => void; onReset: () => void; canPrev: boolean; canNext: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled={!canPrev} onClick={onPrev} aria-label="الشاشة السابقة" className="grid h-10 w-10 place-items-center rounded-full border border-line text-white/80 hover:bg-white/5 disabled:opacity-30">
        <ChevronRight size={18} />
      </button>
      <button type="button" disabled={!canNext} onClick={onNext} aria-label="الشاشة التالية" className="grid h-10 w-10 place-items-center rounded-full border border-line text-white/80 hover:bg-white/5 disabled:opacity-30">
        <ChevronLeft size={18} />
      </button>
      <button type="button" onClick={onReset} className="flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-white/70 hover:bg-white/5">
        <RotateCcw size={14} /> من البداية
      </button>
    </div>
  )
}

/* ───────────── 05 RIDER ───────────── */

export function RiderShowcase() {
  const [screen, setScreen] = useState<RiderScreen>('welcome')
  const idx = RIDER_STEPS.findIndex((s) => s.id === screen)
  const onScreen = useCallback((s: RiderScreen) => setScreen(s), [])

  return (
    <SlideShell className="!justify-start lg:!justify-center">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <div className="order-1">
          <SlideHeader index={5} eyebrow="تطبيق الراكب" title="جرّب رحلة كاملة." subtitle="نموذج تفاعلي حي — اضغط داخل الهاتف كما تفعل في التطبيق الحقيقي، أو اختر الشاشة من القائمة." />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 flex flex-wrap items-center gap-3">
            <DemoBadge label="نموذج تجريبي — لا دفع ولا رحلات فعلية" />
          </motion.div>
          <div className="mt-6 hidden lg:block">
            <Controls
              canPrev={idx > 0}
              canNext={idx < RIDER_STEPS.length - 1}
              onPrev={() => setScreen(RIDER_STEPS[Math.max(0, idx - 1)].id)}
              onNext={() => setScreen(RIDER_STEPS[Math.min(RIDER_STEPS.length - 1, idx + 1)].id)}
              onReset={() => setScreen('welcome')}
            />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="order-2 flex justify-center">
          <PhoneFrame statusDark={screen !== 'welcome'}>
            <RiderApp screen={screen} onScreen={onScreen} />
          </PhoneFrame>
        </motion.div>

        <div className="order-3">
          <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
            <MousePointerClick size={14} /> رحلة الراكب في 9 شاشات
          </div>
          <StepList steps={RIDER_STEPS} activeIdx={idx} onPick={(i) => setScreen(RIDER_STEPS[i].id)} />
          <div className="mt-4 flex justify-center lg:hidden">
            <Controls
              canPrev={idx > 0}
              canNext={idx < RIDER_STEPS.length - 1}
              onPrev={() => setScreen(RIDER_STEPS[Math.max(0, idx - 1)].id)}
              onNext={() => setScreen(RIDER_STEPS[Math.min(RIDER_STEPS.length - 1, idx + 1)].id)}
              onReset={() => setScreen('welcome')}
            />
          </div>
        </div>
      </div>
    </SlideShell>
  )
}

/* ───────────── 06 DRIVER ───────────── */

export function DriverShowcase() {
  const [screen, setScreen] = useState<DriverScreen>('signup')
  const [online, setOnline] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)

  // keep the highlighted step in sync with the actual screen
  const syncIdx = (s: DriverScreen, on: boolean) => {
    const cur = DRIVER_STEPS[stepIdx]
    if (cur && cur.screen === s && (cur.online === undefined || cur.online === on)) return stepIdx
    const i = DRIVER_STEPS.findIndex((x) => x.screen === s && (x.online === undefined || x.online === on))
    return i === -1 ? stepIdx : i
  }
  const onScreen = useCallback(
    (s: DriverScreen) => {
      setScreen(s)
      setStepIdx((prev) => {
        const cur = DRIVER_STEPS[prev]
        if (cur && cur.screen === s) return prev
        const i = DRIVER_STEPS.findIndex((x) => x.screen === s)
        return i === -1 ? prev : i
      })
    },
    [],
  )
  const pick = (i: number) => {
    const st = DRIVER_STEPS[i]
    setStepIdx(i)
    if (st.online !== undefined) setOnline(st.online)
    setScreen(st.screen)
  }
  const activeIdx = syncIdx(screen, online)

  return (
    <SlideShell className="!justify-start lg:!justify-center">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <div className="order-1">
          <SlideHeader index={6} eyebrow="تطبيق السائق" title="من التسجيل إلى الأرباح." subtitle="انضم كسائق، اتصل بالشبكة، استقبل طلباً، وأكمل رحلة افتراضية حتى التسوية." />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 space-y-3">
            <DemoBadge label="محاكاة — لا تحقق ولا تحويلات فعلية" />
            <div className="rounded-2xl border border-line bg-ink-2/70 p-4 text-sm leading-7 text-white/60">
              <span className="font-semibold text-white">جرّب الآن:</span> من الصفحة الرئيسية اضغط <span className="text-green-3">ابدأ العمل</span> — سيصلك طلب رحلة خلال ثوانٍ. اقبله، توجّه للراكب، ابدأ الرحلة ثم أنهِها.
            </div>
          </motion.div>
          <div className="mt-6 hidden lg:block">
            <Controls
              canPrev={activeIdx > 0}
              canNext={activeIdx < DRIVER_STEPS.length - 1}
              onPrev={() => pick(Math.max(0, activeIdx - 1))}
              onNext={() => pick(Math.min(DRIVER_STEPS.length - 1, activeIdx + 1))}
              onReset={() => {
                setOnline(false)
                pick(0)
              }}
            />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="order-2 flex justify-center">
          <PhoneFrame statusDark={false}>
            <DriverApp screen={screen} onScreen={onScreen} online={online} setOnline={setOnline} />
          </PhoneFrame>
        </motion.div>

        <div className="order-3">
          <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
            <MousePointerClick size={14} /> تجربة السائق في 15 خطوة
          </div>
          <div className="max-h-none overflow-y-auto thin-scroll lg:max-h-[62vh]">
            <StepList steps={DRIVER_STEPS} activeIdx={activeIdx} onPick={pick} />
          </div>
          <div className="mt-4 flex justify-center lg:hidden">
            <Controls
              canPrev={activeIdx > 0}
              canNext={activeIdx < DRIVER_STEPS.length - 1}
              onPrev={() => pick(Math.max(0, activeIdx - 1))}
              onNext={() => pick(Math.min(DRIVER_STEPS.length - 1, activeIdx + 1))}
              onReset={() => {
                setOnline(false)
                pick(0)
              }}
            />
          </div>
        </div>
      </div>
    </SlideShell>
  )
}

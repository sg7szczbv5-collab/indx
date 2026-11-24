import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, FileText, Home, Maximize, Menu, Minimize, X } from 'lucide-react'
import { Logo } from './components/Logo'
import { Summary } from './components/Summary'
import { Cover, Problem, Solution, Vision } from './slides/Intro'
import { DriverShowcase, RiderShowcase } from './slides/Apps'
import { Admin } from './slides/Admin'
import { HowItWorks } from './slides/HowItWorks'
import { Revenue } from './slides/Revenue'
import { Market } from './slides/Market'
import { Budget, Closing, Compliance, Roadmap } from './slides/Plan'
import type { SlideProps } from './slides/types'

type SlideDef = { id: string; title: string; C: ComponentType<SlideProps>; group: string }

const SLIDES: SlideDef[] = [
  { id: 'cover', title: 'الغلاف', C: Cover, group: 'المقدمة' },
  { id: 'vision', title: 'الرؤية', C: Vision, group: 'المقدمة' },
  { id: 'problem', title: 'المشكلة', C: Problem, group: 'المقدمة' },
  { id: 'solution', title: 'الحل', C: Solution, group: 'المقدمة' },
  { id: 'rider', title: 'تطبيق الراكب', C: RiderShowcase, group: 'المنتج' },
  { id: 'driver', title: 'تطبيق السائق', C: DriverShowcase, group: 'المنتج' },
  { id: 'admin', title: 'نظام الإدارة', C: Admin, group: 'المنتج' },
  { id: 'how', title: 'كيف تعمل المنصة؟', C: HowItWorks, group: 'المنتج' },
  { id: 'revenue', title: 'نموذج الإيرادات', C: Revenue, group: 'الأعمال' },
  { id: 'market', title: 'السوق المستهدف', C: Market, group: 'الأعمال' },
  { id: 'budget', title: 'الميزانية الاستثمارية', C: Budget, group: 'الأعمال' },
  { id: 'roadmap', title: 'خطة الإطلاق', C: Roadmap, group: 'الأعمال' },
  { id: 'compliance', title: 'التراخيص والامتثال', C: Compliance, group: 'الأعمال' },
  { id: 'closing', title: 'الخاتمة', C: Closing, group: 'الخاتمة' },
]

function indexFromHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  const i = SLIDES.findIndex((s) => s.id === h)
  return i === -1 ? 0 : i
}

export default function App() {
  const [[index, dir], setState] = useState<[number, number]>(() => [indexFromHash(), 1])
  const [menu, setMenu] = useState(false)
  const [summary, setSummary] = useState(false)
  const [fs, setFs] = useState(false)

  const go = useCallback((i: number) => {
    setState(([cur]) => {
      const n = Math.max(0, Math.min(SLIDES.length - 1, i))
      return [n, n >= cur ? 1 : -1]
    })
    setMenu(false)
  }, [])
  const next = useCallback(() => setState(([c]) => [Math.min(SLIDES.length - 1, c + 1), 1]), [])
  const prev = useCallback(() => setState(([c]) => [Math.max(0, c - 1), -1]), [])

  useEffect(() => {
    const id = SLIDES[index].id
    if (window.location.hash.replace(/^#\/?/, '') !== id) {
      try {
        history.replaceState(null, '', `#${id}`)
      } catch {
        /* sandboxed frames may refuse history updates */
      }
    }
  }, [index])

  useEffect(() => {
    const onHash = () => go(indexFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go])

  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }, [])
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (summary || menu) {
        if (e.key === 'Escape') {
          setSummary(false)
          setMenu(false)
        }
        return
      }
      // RTL: left arrow moves forward, right arrow moves back
      if (['ArrowLeft', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        next()
      } else if (['ArrowRight', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(SLIDES.length - 1)
      else if (e.key === 'f' || e.key === 'F') toggleFs()
      else if (e.key === 'm' || e.key === 'M') setMenu(true)
      else if (e.key === 's' || e.key === 'S') setSummary(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, go, toggleFs, summary, menu])

  const S = SLIDES[index]
  const progress = ((index + 1) / SLIDES.length) * 100

  return (
    <div className="relative flex h-full w-full flex-col bg-ink" dir="rtl">
      {/* top bar */}
      <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 px-3 sm:px-5">
        <button type="button" onClick={() => setMenu(true)} aria-label="قائمة الأقسام" className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/5 hover:text-white">
          <Menu size={19} />
        </button>
        <button type="button" onClick={() => go(0)} aria-label="العودة إلى البداية">
          <Logo size={28} />
        </button>
        <div className="mx-auto hidden items-center gap-2 text-[13px] text-white/40 md:flex">
          <span>{S.group}</span>
          <ChevronLeft size={13} />
          <span className="text-white/80">{S.title}</span>
        </div>
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <button type="button" onClick={() => setSummary(true)} className="hidden h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[13px] text-white/75 hover:bg-white/5 sm:flex">
            <FileText size={14} /> الملخص الاستثماري
          </button>
          <button type="button" onClick={() => go(0)} aria-label="العودة إلى البداية" className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/5 hover:text-white">
            <Home size={17} />
          </button>
          <button type="button" onClick={toggleFs} aria-label="ملء الشاشة" className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/5 hover:text-white">
            {fs ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
        </div>
      </header>

      {/* slide stage */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.section
            key={S.id}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60, filter: 'blur(8px)' }),
              center: { opacity: 1, x: 0, filter: 'blur(0px)' },
              exit: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60, filter: 'blur(8px)' }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            aria-label={S.title}
          >
            <S.C go={go} next={next} openSummary={() => setSummary(true)} />
          </motion.section>
        </AnimatePresence>
      </main>

      {/* bottom nav */}
      <footer className="relative z-40 shrink-0">
        <div className="h-[2px] w-full bg-white/5">
          <motion.div className="h-full bg-green-3" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button type="button" onClick={prev} disabled={index === 0} aria-label="الشريحة السابقة" className="grid h-10 w-10 place-items-center rounded-full border border-line text-white/80 hover:bg-white/5 disabled:opacity-25">
            <ChevronRight size={19} />
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={s.title}
                title={s.title}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-white' : i < index ? 'w-1.5 bg-green-3/70 hover:bg-green-3' : 'w-1.5 bg-white/15 hover:bg-white/40'} ${Math.abs(i - index) > 4 ? 'hidden sm:block' : ''}`}
              />
            ))}
          </div>
          <span className="num hidden text-xs text-white/40 sm:inline">
            {String(index + 1).padStart(2, '0')} / {SLIDES.length}
          </span>
          <button type="button" onClick={next} disabled={index === SLIDES.length - 1} aria-label="الشريحة التالية" className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink hover:bg-mist disabled:opacity-25">
            <ChevronLeft size={19} />
          </button>
        </div>
      </footer>

      {/* side menu */}
      <AnimatePresence>
        {menu && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[86vw] max-w-sm flex-col border-l border-line bg-ink-2"
              aria-label="أقسام العرض"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Logo size={30} />
                <button type="button" onClick={() => setMenu(false)} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/5">
                  <X size={19} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-6 thin-scroll">
                {['المقدمة', 'المنتج', 'الأعمال', 'الخاتمة'].map((g) => (
                  <div key={g} className="mt-4">
                    <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-white/35">{g}</div>
                    {SLIDES.map((s, i) =>
                      s.group !== g ? null : (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => go(i)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[14px] transition ${i === index ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                        >
                          <span className={`num text-[11px] ${i === index ? 'text-ink/50' : 'text-white/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                          {s.title}
                        </button>
                      ),
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-line p-4 text-[11px] leading-6 text-white/40">
                <div className="font-semibold text-white/60">اختصارات لوحة المفاتيح</div>
                ← التالي · → السابق · F ملء الشاشة · M القائمة · S الملخص · Home البداية
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>{summary && <Summary onClose={() => setSummary(false)} go={go} />}</AnimatePresence>
    </div>
  )
}

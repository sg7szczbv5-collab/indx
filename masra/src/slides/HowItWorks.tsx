import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Car, MapPin, Smartphone, Star, Tag, UserCheck } from 'lucide-react'
import { SlideHeader, SlideShell, ease } from '../components/ui'
import { LogoMark } from '../components/Logo'

const STEPS = [
  { I: Smartphone, t: 'فتح التطبيق', d: 'يفتح الراكب مَسْرى ويُحدَّد موقعه تلقائياً.' },
  { I: MapPin, t: 'تحديد الوجهة', d: 'يبحث عن وجهته أو يختار من الأماكن المقترحة.' },
  { I: Tag, t: 'معرفة السعر', d: 'سعر تقديري واضح ووقت وصول قبل أي التزام.' },
  { I: UserCheck, t: 'اختيار السائق', d: 'النظام يطابق أقرب سائق موثّق ومتاح.' },
  { I: Car, t: 'تنفيذ الرحلة', d: 'تتبع مباشر للمسار ومشاركة الرحلة مع العائلة.' },
  { I: Star, t: 'الدفع والتقييم', d: 'دفع سلس ثم تقييم متبادل لضمان الجودة.' },
]

function Visual({ step }: { step: number }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px]">
      <div className="absolute inset-0 rounded-[40px] border border-line bg-ink-2" />
      <div className="absolute inset-6 rounded-[32px] bg-gradient-to-b from-ink-3 to-ink-2" />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease }}
          className="absolute inset-0 grid place-items-center"
        >
          {step === 0 && (
            <div className="flex flex-col items-center gap-4">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
                <LogoMark size={96} animate />
              </motion.div>
              <div className="text-sm text-white/50">تحديد الموقع…</div>
            </div>
          )}
          {step === 1 && (
            <svg viewBox="0 0 300 300" className="h-[78%] w-[78%]">
              <path d="M40 250 C 90 200, 80 120, 150 110 S 240 70, 260 50" fill="none" stroke="#2c332f" strokeWidth="14" strokeLinecap="round" />
              <motion.path d="M40 250 C 90 200, 80 120, 150 110 S 240 70, 260 50" fill="none" stroke="#1fa36a" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
              <circle cx="40" cy="250" r="10" fill="#fff" />
              <motion.g initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 1.2, type: 'spring' }} style={{ originX: '260px', originY: '50px' }}>
                <path d="M260 50 m-14 -20 a14 14 0 1 1 28 0 c0 12 -14 22 -14 22 s-14 -10 -14 -22z" fill="#1fa36a" />
                <circle cx="260" cy="30" r="5" fill="#0b0d0c" />
              </motion.g>
            </svg>
          )}
          {step === 2 && (
            <div className="w-[70%] space-y-2">
              {[['اقتصادي', 28], ['مريح', 35], ['عائلي', 39]].map(([n, p], i) => (
                <motion.div key={n} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${i === 0 ? 'bg-white text-ink' : 'bg-ink-4'}`}>
                  <span className="font-semibold">{n}</span>
                  <span className="num font-bold">{p} ر.س</span>
                </motion.div>
              ))}
              <div className="pt-1 text-center text-[11px] text-white/40">أسعار توضيحية</div>
            </div>
          )}
          {step === 3 && (
            <div className="relative grid h-[70%] w-[70%] place-items-center">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="absolute inset-0 rounded-full border border-green-3" initial={{ scale: 0.2, opacity: 0.8 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }} />
              ))}
              {[[-80, -40], [70, -70], [60, 70], [-60, 80]].map(([x, y], i) => (
                <motion.span key={i} className={`absolute grid h-9 w-9 place-items-center rounded-full ${i === 1 ? 'bg-green-3 text-ink' : 'bg-ink-4 text-white/60'}`} style={{ x, y }} animate={i === 1 ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1.4 }}>
                  <Car size={16} />
                </motion.span>
              ))}
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink"><UserCheck size={20} /></span>
            </div>
          )}
          {step === 4 && (
            <svg viewBox="0 0 300 300" className="h-[80%] w-[80%]">
              <path id="hw-r" d="M40 240 L40 160 Q40 140 60 140 L240 140 Q260 140 260 120 L260 50" fill="none" stroke="#2c332f" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M40 240 L40 160 Q40 140 60 140 L240 140 Q260 140 260 120 L260 50" fill="none" stroke="#1fa36a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="route-dash" />
              <g>
                <rect x="-9" y="-6" width="18" height="12" rx="4" fill="#fff" />
                <animateMotion dur="4s" repeatCount="indefinite" rotate="auto" path="M40 240 L40 160 Q40 140 60 140 L240 140 Q260 140 260 120 L260 50" />
              </g>
              <rect x="250" y="38" width="20" height="20" rx="4" fill="#1fa36a" />
            </svg>
          )}
          {step === 5 && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink">
                <Banknote size={20} />
                <span className="num text-2xl font-bold">35 ر.س</span>
              </div>
              <div className="flex gap-1.5" dir="ltr">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span key={i} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + i * 0.12, type: 'spring' }}>
                    <Star size={30} className="fill-gold text-gold" />
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function HowItWorks() {
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto) return
    const iv = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2800)
    return () => clearInterval(iv)
  }, [auto])

  return (
    <SlideShell>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <SlideHeader index={8} eyebrow="كيف تعمل المنصة؟" title="رحلة العميل في 6 خطوات." />
          <div className="mt-8 space-y-1.5">
            {STEPS.map(({ I, t, d }, i) => {
              const on = i === step
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setAuto(false)
                    setStep(i)
                  }}
                  className={`relative flex w-full items-center gap-4 overflow-hidden rounded-2xl p-3.5 text-start transition ${on ? 'bg-ink-3' : 'hover:bg-ink-2'}`}
                >
                  <span className={`num grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold transition ${on ? 'bg-green-3 text-ink' : 'bg-ink-4 text-white/50'}`}>
                    {on ? <I size={20} /> : i + 1}
                  </span>
                  <span>
                    <span className={`block font-bold ${on ? 'text-white' : 'text-white/60'}`}>{t}</span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden text-sm text-white/55">
                          {d}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  {on && auto && (
                    <motion.span key={step} className="absolute bottom-0 right-0 h-0.5 bg-green-3" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.8, ease: 'linear' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <Visual step={step} />
      </div>
    </SlideShell>
  )
}

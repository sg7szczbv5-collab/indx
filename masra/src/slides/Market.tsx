import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Info, MapPin } from 'lucide-react'
import { EasternMap } from '../components/EasternMap'
import { SlideHeader, SlideShell, ease, sar } from '../components/ui'
import { CITIES, MARKET_FACTS } from '../data/content'

const NATIONAL_TRIPS_2024 = 80_500_000

export function Market() {
  const [city, setCity] = useState<string>('dammam')
  const [daily, setDaily] = useState(500)
  const c = CITIES.find((x) => x.id === city)!
  const yearly = daily * 365
  const share = (yearly / NATIONAL_TRIPS_2024) * 100

  return (
    <SlideShell>
      <SlideHeader index={10} eyebrow="السوق المستهدف" title="نبدأ من المنطقة الشرقية." subtitle="ثلاث مدن متصلة عمرانياً، ونمو موثّق في سوق تطبيقات نقل الركاب على مستوى المملكة." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* map */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease }} className="relative overflow-hidden rounded-3xl border border-line">
          <div className="aspect-[480/440] w-full">
            <EasternMap active={city} onCity={setCity} trips />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-ink/85 p-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-green-3" />
                <span className="text-lg font-bold">{c.name}</span>
                <span className="ms-auto rounded-full bg-green-3/15 px-2.5 py-0.5 text-[11px] text-green-3">{c.phase}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="num text-2xl font-bold">{c.pop}</span>
                <span className="text-xs text-white/50">نسمة</span>
              </div>
              <div className="mt-1 text-[11px] leading-5 text-white/40">المصدر: {c.popSrc}</div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute top-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-[11px] text-white/60 backdrop-blur">اضغط على المدينة · خريطة توضيحية</div>
        </motion.div>

        <div className="space-y-4">
          <div className="text-xs font-semibold text-white/45">مؤشرات موثّقة — سوق المملكة الإجمالي</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MARKET_FACTS.map((f, i) => (
              <motion.a
                key={f.l}
                href={f.href}
                target="_blank"
                rel="noreferrer noopener"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, ease }}
                className="group rounded-2xl border border-line bg-ink-2/80 p-4 transition hover:border-white/20"
              >
                <div className="flex items-baseline gap-2">
                  <span className="num text-3xl font-bold">{f.v}</span>
                  <span className="text-sm text-white/60">{f.u}</span>
                </div>
                <div className="mt-1.5 text-[13px] leading-6 text-white/70">{f.l}</div>
                <div className="mt-2 flex items-center gap-1 text-[10.5px] text-white/35 group-hover:text-green-3">
                  <ExternalLink size={10} /> {f.src}
                </div>
              </motion.a>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease }} className="rounded-2xl border border-green-3/30 bg-green/10 p-4">
            <div className="text-xs font-semibold text-green-3">الحصة القابلة للتحقيق (سيناريو تخطيطي — وليس رقماً موثقاً)</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[250, 500, 1000].map((d) => (
                <button key={d} type="button" onClick={() => setDaily(d)} className={`num rounded-full px-3 py-1 text-xs font-semibold ${daily === d ? 'bg-green-3 text-ink' : 'bg-ink-4 text-white/60'}`}>
                  {sar(d)} رحلة/يوم
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-white/50">رحلات سنوية</div>
                <div className="num text-2xl font-bold">{sar(yearly)}</div>
              </div>
              <div>
                <div className="text-[11px] text-white/50">من إجمالي رحلات المملكة 2024</div>
                <div className="num text-2xl font-bold text-green-3">{share.toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-4">
              <motion.div className="h-full bg-green-3" animate={{ width: `${Math.max(share * 20, 1)}%` }} />
            </div>
            <div className="mt-1 text-[10px] text-white/35">الشريط مكبّر ×20 لسهولة القراءة</div>
          </motion.div>

          <div className="flex items-start gap-2 text-[11.5px] leading-6 text-white/40">
            <Info size={14} className="mt-1 shrink-0" />
            حصة المنطقة الشرقية من رحلات المملكة غير منشورة في المصادر التي راجعناها، وتُستكمل من تقارير الهيئة العامة للنقل قبل اعتماد أي توقعات.
          </div>
        </div>
      </div>
    </SlideShell>
  )
}

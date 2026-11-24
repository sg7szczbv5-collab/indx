import { motion } from 'framer-motion';
import { impactSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';
import { useCountUp } from '../../hooks/useCountUp';
import { accentStyles, formatNumber } from '../accent';

type Counter = (typeof d.counters)[number];

function CounterCard({ c, i }: { c: Counter; i: number }) {
  const v = useCountUp(c.value, 2.4, 0.3 + i * 0.15);
  const a = accentStyles[c.accent];
  const Icon = c.icon;
  return (
    <motion.div variants={item} whileHover={{ y: -4 }} className={`glass relative overflow-hidden rounded-3xl p-6`}>
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: `${a.hex}40` }} />
      <span className={`relative mb-4 grid h-12 w-12 place-items-center rounded-2xl border ${a.border} ${a.bg} ${a.text}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className={`relative text-5xl font-black tabular-nums ${a.text}`} dir="ltr" style={{ textAlign: 'right' }}>
        {c.prefix}
        {formatNumber(v)}
        {c.suffix}
      </div>
      <div className="relative mt-2 text-lg font-bold text-white">{c.label}</div>
      <div className="relative mt-1 font-plex text-sm text-slate-400">{c.caption}</div>
    </motion.div>
  );
}

export default function ImpactSlide() {
  return (
    <SlideLayout header={d.header}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {d.counters.map((c, i) => (
          <CounterCard key={c.label} c={c} i={i} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div variants={item} className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-white">{d.jobsBreakdown.title}</h3>
          <ul className="space-y-3">
            {d.jobsBreakdown.items.map((j, i) => (
              <li key={j.label} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3 text-sm">
                <span className="truncate font-semibold text-slate-200">{j.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-l from-saudi-light to-saudi"
                    initial={{ width: 0 }}
                    animate={{ width: `${j.share}%` }}
                    transition={{ duration: 1, delay: 0.8 + i * 0.12 }}
                  />
                </div>
                <span className="text-left font-mono font-bold text-white">{j.share}%</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={item} className="flex flex-col justify-center rounded-3xl border border-saudi/40 bg-gradient-to-br from-saudi/30 to-saudi/5 p-6">
          <div className="mb-1 text-sm font-bold text-green-200">رؤية المملكة</div>
          <div className="mb-5 text-5xl font-black text-white">2030</div>
          <div className="grid grid-cols-3 gap-2">
            {d.visionPillars.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-navy/40 p-3 text-center">
                <Icon className="h-5 w-5 text-white" />
                <span className="text-[11px] font-bold text-green-100">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <p className="mt-4 text-xs text-slate-500">* مؤشرات مستهدفة تقديرية قابلة للتحديث وفق دراسات الجدوى المعتمدة.</p>
    </SlideLayout>
  );
}

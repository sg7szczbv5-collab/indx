import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownLeft } from 'lucide-react';
import { revenueSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';
import { formatNumber } from '../accent';

const R = 40;
const C = 2 * Math.PI * R;
const total = d.streams.reduce((s, x) => s + x.value, 0);
const maxYear = Math.max(...d.growth.years.map((y) => y.value));

function Donut({ active, setActive }: { active: number | null; setActive: (i: number | null) => void }) {
  let offset = 0;
  const gap = 1.2;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="توزيع مصادر الدخل">
      <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="12" />
      {d.streams.map((s, i) => {
        const len = (s.value / total) * C;
        const dash = Math.max(len - gap, 0);
        const el = (
          <motion.circle
            key={s.id}
            cx="50" cy="50" r={R} fill="none" stroke={s.color}
            strokeDashoffset={-offset}
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={{
              strokeDasharray: `${dash} ${C - dash}`,
              strokeWidth: active === i ? 16 : 12,
              opacity: active === null || active === i ? 1 : 0.35,
            }}
            transition={{ duration: 0.9, delay: active === null ? 0.3 + i * 0.15 : 0 }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(active === i ? null : i)}
            className="cursor-pointer"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export default function RevenueSlide() {
  const [active, setActive] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const sel = active !== null ? d.streams[active] : null;

  return (
    <SlideLayout header={d.header}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* مصادر الدخل */}
        <motion.div variants={item} className="glass grid items-center gap-6 rounded-3xl p-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:p-6">
          <div className="relative mx-auto aspect-square w-full max-w-[15rem]">
            <Donut active={active} setActive={setActive} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <AnimatePresence mode="wait">
                <motion.div key={active ?? 'total'} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-3xl font-black text-white">{formatNumber(sel ? sel.value : total)}</div>
                  <div className="text-[11px] text-slate-400">{d.currencyUnit}</div>
                  <div className="mt-1 max-w-[8rem] text-xs font-bold" style={{ color: sel?.color ?? '#F59E0B' }}>
                    {sel ? `${Math.round((sel.value / total) * 100)}%` : d.totalLabel}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <ul className="space-y-2">
            {d.streams.map((s, i) => {
              const Icon = s.icon;
              const on = active === i;
              return (
                <li key={s.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className={`focus-ring w-full rounded-2xl border p-3 text-right transition ${on ? 'border-white/30 bg-white/10' : 'border-transparent bg-white/[0.03]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${s.color}33`, color: s.color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-bold text-white">{s.label}</span>
                      <span className="font-mono text-sm font-bold tabular-nums text-slate-300">{s.value}</span>
                    </div>
                    <AnimatePresence>
                      {on && (
                        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2 font-plex text-xs text-slate-400">
                          {s.note}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* إعادة الاستثمار */}
          <motion.div variants={item} className="glass rounded-3xl p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
              <ArrowDownLeft className="h-5 w-5 text-saudi-light" />
              {d.reinvestTitle}
            </h3>
            <div className="mb-4 flex h-4 overflow-hidden rounded-full bg-white/10">
              {d.reinvest.map((r, i) => (
                <motion.div
                  key={r.label}
                  style={{ backgroundColor: r.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${r.share}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.12 }}
                  title={`${r.label}: ${r.share}%`}
                />
              ))}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.reinvest.map(({ icon: Icon, label, share, color }, i) => (
                <li key={label} className={`flex items-center gap-2 rounded-xl p-2 ${i === 0 ? 'bg-saudi/15 ring-1 ring-saudi/50' : 'bg-white/[0.03]'}`}>
                  <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                  <span className="flex-1 text-xs font-semibold text-slate-200">{label}</span>
                  <span className="font-mono text-xs font-bold text-white">{share}%</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* النمو */}
          <motion.div variants={item} className="glass flex-1 rounded-3xl p-5 sm:p-6">
            <h3 className="mb-4 text-base font-bold text-white">{d.growth.title}</h3>
            <div className="flex h-36 items-end gap-3 sm:gap-5">
              {d.growth.years.map((y, i) => (
                <button
                  key={y.year}
                  onMouseEnter={() => setYear(i)}
                  onMouseLeave={() => setYear(null)}
                  onFocus={() => setYear(i)}
                  onBlur={() => setYear(null)}
                  className="focus-ring group flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-lg"
                >
                  <span className={`font-mono text-xs font-bold transition ${year === i ? 'text-sand-light' : 'text-slate-400'}`}>{y.value}</span>
                  <motion.div
                    className={`w-full rounded-t-lg ${i === d.growth.years.length - 1 ? 'bg-gradient-to-t from-saudi to-saudi-light' : 'bg-gradient-to-t from-sand/60 to-sand-light'} ${year === i ? 'brightness-125' : ''}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${(y.value / maxYear) * 80}%` }}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <span className="text-xs font-semibold text-slate-300">{y.year}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

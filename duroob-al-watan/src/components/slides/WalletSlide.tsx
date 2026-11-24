import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, LockOpen, PlayCircle, RotateCcw } from 'lucide-react';
import { walletSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';
import { formatNumber } from '../accent';

export default function WalletSlide() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const timers = useRef<number[]>([]);
  const allMet = d.conditions.every((c) => checked[c.id]);
  const metCount = d.conditions.filter((c) => checked[c.id]).length;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const simulate = () => {
    timers.current.forEach(clearTimeout);
    setChecked({});
    timers.current = d.conditions.map((c, i) =>
      window.setTimeout(() => setChecked((p) => ({ ...p, [c.id]: true })), 600 + i * 800),
    );
  };
  const reset = () => {
    timers.current.forEach(clearTimeout);
    setChecked({});
  };

  const Payer = d.payer.icon;

  return (
    <SlideLayout header={d.header}>
      <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_1.2fr_1fr]">
        {/* الشاحن */}
        <motion.div variants={item} className="glass flex flex-col items-center justify-center rounded-3xl p-6 text-center">
          <span className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white">
            <Payer className="h-8 w-8" />
          </span>
          <h3 className="text-xl font-bold text-white">{d.payer.title}</h3>
          <p className="mb-4 text-sm text-slate-400">{d.payer.caption}</p>
          <div className="rounded-xl bg-white/5 px-4 py-2 font-mono text-2xl font-black text-white">
            {formatNumber(d.tripAmount)} <span className="text-sm text-slate-400">{d.currency}</span>
          </div>
          <motion.div
            className="mt-4 text-xs font-bold text-saudi-light"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            ← إيداع في حساب الضمان
          </motion.div>
        </motion.div>

        {/* حساب الضمان */}
        <motion.div
          variants={item}
          className={`relative flex flex-col rounded-3xl border-2 p-6 transition-colors duration-500 ${
            allMet ? 'border-saudi-light bg-saudi/15' : 'border-sand/50 bg-sand/[0.08]'
          }`}
        >
          <div className="mb-4 flex items-center gap-3">
            <motion.span
              key={String(allMet)}
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              className={`grid h-12 w-12 place-items-center rounded-2xl ${allMet ? 'bg-saudi text-white' : 'bg-sand text-navy'}`}
            >
              {allMet ? <LockOpen className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </motion.span>
            <div>
              <h3 className="text-lg font-bold text-white">{d.escrowLabel}</h3>
              <p className="text-sm text-slate-400">
                {allMet ? 'تم تحرير المستحقات آلياً ✓' : `الشروط المستوفاة: ${metCount} / ${d.conditions.length}`}
              </p>
            </div>
          </div>

          <ul className="mb-5 space-y-2.5">
            {d.conditions.map((c) => {
              const Icon = c.icon;
              const on = !!checked[c.id];
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setChecked((p) => ({ ...p, [c.id]: !p[c.id] }))}
                    aria-pressed={on}
                    className={`focus-ring flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${
                      on ? 'border-saudi-light/60 bg-saudi/20' : 'border-white/10 bg-navy-800/60 hover:border-white/25'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${on ? 'text-saudi-light' : 'text-slate-400'}`} />
                    <span className="flex-1 text-sm font-semibold text-slate-100">{c.label}</span>
                    <span className={`grid h-6 w-6 place-items-center rounded-md border-2 ${on ? 'border-saudi-light bg-saudi-light text-navy' : 'border-white/30'}`}>
                      {on && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto flex flex-wrap gap-2">
            <button
              onClick={simulate}
              className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sand px-4 py-2.5 text-sm font-bold text-navy transition hover:bg-sand-light"
            >
              <PlayCircle className="h-4 w-4" />
              محاكاة رحلة مكتملة
            </button>
            <button
              onClick={reset}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              aria-label="إعادة الضبط"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* التوزيع */}
        <motion.div variants={item} className="glass flex flex-col rounded-3xl p-6">
          <h3 className="mb-4 text-lg font-bold text-white">الصرف الآلي للمستحقات</h3>
          <ul className="flex-1 space-y-3">
            {d.payouts.map((p, i) => {
              const Icon = p.icon;
              const amount = (d.tripAmount * p.share) / 100;
              return (
                <li key={p.title} className="rounded-2xl bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: `${p.color}33`, color: p.color }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-sm font-bold text-white">{p.title}</span>
                    <span className="text-xs text-slate-400">{p.share}%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: p.color }}
                        animate={{ width: allMet ? `${p.share}%` : '0%' }}
                        transition={{ duration: 0.8, delay: allMet ? i * 0.2 : 0 }}
                      />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={String(allMet)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`w-20 text-left font-mono text-sm font-bold tabular-nums ${allMet ? 'text-saudi-light' : 'text-slate-500'}`}
                      >
                        {allMet ? formatNumber(amount) : '— —'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-2">
            {d.guarantees.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Icon className="h-4 w-4 text-sand-light" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

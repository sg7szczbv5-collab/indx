import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Pause, Play, ShieldCheck } from 'lucide-react';
import { journeySlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';

/** رمز QR زخرفي (توضيحي) مولّد بشكل حتمي */
function QrGlyph({ seed = 7 }: { seed?: number }) {
  const n = 21;
  const cells = useMemo(() => {
    const out: [number, number][] = [];
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const finder = (x: number, y: number) =>
      (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) out.push([x, y]);
    return out;
  }, [seed]);
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width="7" height="7" fill="#0F172A" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0F172A" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-full w-full" shapeRendering="crispEdges" aria-hidden>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0F172A" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={n - 7} y={0} />
      <Finder x={0} y={n - 7} />
    </svg>
  );
}

export default function JourneySlide() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const s = d.steps[step];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((v) => (v + 1) % d.steps.length), 3500);
    return () => clearInterval(t);
  }, [auto]);

  const progress = step / (d.steps.length - 1);

  return (
    <SlideLayout header={d.header}>
      {/* الخط الزمني */}
      <motion.div variants={item} className="relative mb-8">
        <div className="absolute inset-x-[12.5%] top-7 h-1 rounded-full bg-white/10" />
        <motion.div
          className="absolute right-[12.5%] top-7 h-1 rounded-full bg-gradient-to-l from-saudi-light to-sand"
          animate={{ width: `${progress * 75}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <ol className="relative grid grid-cols-4">
          {d.steps.map((st, i) => {
            const Icon = st.icon;
            const done = i < step;
            const active = i === step;
            return (
              <li key={st.title} className="flex justify-center">
                <button
                  onClick={() => {
                    setStep(i);
                    setAuto(false);
                  }}
                  aria-current={active ? 'step' : undefined}
                  className="focus-ring group flex flex-col items-center gap-2 rounded-2xl px-1 text-center"
                >
                  <motion.span
                    animate={{ scale: active ? 1.12 : 1 }}
                    className={`relative grid h-14 w-14 place-items-center rounded-full border-2 transition ${
                      active
                        ? 'border-sand bg-sand text-navy shadow-[0_0_30px_rgba(217,119,6,.55)]'
                        : done
                          ? 'border-saudi-light bg-saudi text-white'
                          : 'border-white/20 bg-navy-800 text-slate-300 group-hover:border-white/40'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    <span className="absolute -top-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-[10px] font-bold text-white ring-1 ring-white/30">
                      {i + 1}
                    </span>
                  </motion.span>
                  <span className={`text-xs font-bold sm:text-sm ${active ? 'text-white' : 'text-slate-400'}`}>{st.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-3xl p-6 sm:p-8"
          >
            <div className="mb-3 text-sm font-bold text-sand-light">الخطوة {step + 1} من {d.steps.length}</div>
            <h3 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">{s.title}</h3>
            <p className="mb-6 font-plex text-lg leading-relaxed text-slate-300">{s.description}</p>
            <ul className="mb-6 space-y-2.5">
              {s.points.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3 font-semibold text-slate-200"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-saudi-light" />
                  {p}
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
              <div>
                <div className="text-3xl font-black text-sand-light" dir="auto" style={{ textAlign: 'right' }}>{s.metric.value}</div>
                <div className="text-sm text-slate-400">{s.metric.label}</div>
              </div>
              <button
                onClick={() => setAuto((v) => !v)}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                {auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {d.autoplayLabel}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* بطاقة التصريح */}
        <motion.div variants={item} className="flex items-center justify-center">
          <div className="relative w-full max-w-xs">
            <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-navy-800 to-navy-950 p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-white">{d.permitSample.title}</span>
                <motion.span
                  animate={{ opacity: step >= 2 ? 1 : 0.35 }}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${step >= 2 ? 'bg-saudi text-white' : 'bg-white/10 text-slate-400'}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {step >= 2 ? d.permitSample.status : 'بانتظار التحقق'}
                </motion.span>
              </div>
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl bg-white p-3">
                <motion.div
                  animate={{ filter: step >= 2 ? 'blur(0px)' : 'blur(6px)', opacity: step >= 2 ? 1 : 0.4 }}
                  transition={{ duration: 0.5 }}
                  className="h-full w-full"
                >
                  <QrGlyph />
                </motion.div>
                {step === 3 && (
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-saudi-light shadow-[0_0_16px_#22C55E]"
                    initial={{ top: '0%' }}
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                {[
                  ['اللوحة', d.permitSample.plate],
                  ['النافذة الزمنية', d.permitSample.window],
                  ['البوابة', d.permitSample.gate],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="font-bold text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

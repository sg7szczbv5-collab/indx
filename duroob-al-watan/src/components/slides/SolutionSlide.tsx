import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Route } from 'lucide-react';
import { solutionSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';

// مواضع الأطراف حول المحور (نِسب مئوية)
const positions = [
  { x: 50, y: 13 },
  { x: 85, y: 80 },
  { x: 15, y: 80 },
];

export default function SolutionSlide() {
  const [active, setActive] = useState(0);
  const party = d.parties[active];

  return (
    <SlideLayout header={d.header}>
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* مخطط الربط */}
        <motion.div variants={item} className="relative mx-auto aspect-[1/0.92] w-full max-w-xl">
          <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full" aria-hidden>
            {/* مثلث الربط الخارجي */}
            <polygon
              points={positions.map((p) => `${p.x},${p.y * 0.92}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="0.4" strokeDasharray="1 1.5"
            />
            {positions.map((p, i) => {
              const isActive = i === active;
              return (
                <g key={i}>
                  <line
                    x1="50" y1={52 * 0.92} x2={p.x} y2={p.y * 0.92}
                    stroke={isActive ? '#D97706' : 'rgba(255,255,255,.15)'} strokeWidth={isActive ? 0.7 : 0.4}
                    strokeDasharray="1.5 1.5"
                    className="road-dash"
                  />
                  {/* حزمة بيانات متحركة */}
                  <motion.circle
                    r="1.1" fill={isActive ? '#F59E0B' : '#22C55E'}
                    animate={{ cx: [p.x, 50, p.x], cy: [p.y * 0.92, 52 * 0.92, p.y * 0.92] }}
                    transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.9, ease: 'easeInOut' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* المحور المركزي */}
          <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="absolute inset-0 rounded-full bg-saudi/40"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            <div className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-saudi-light/60 bg-gradient-to-br from-saudi to-saudi-dark text-center shadow-[0_0_60px_rgba(21,128,61,.5)] sm:h-36 sm:w-36">
              <div>
                <Route className="mx-auto mb-1 h-7 w-7 text-white sm:h-9 sm:w-9" />
                <div className="text-sm font-black text-white sm:text-lg">{d.hub.title}</div>
                <div className="text-[10px] text-green-100 sm:text-xs">{d.hub.caption}</div>
              </div>
            </div>
          </div>

          {/* الأطراف */}
          {d.parties.map((p, i) => {
            const Icon = p.icon;
            const isActive = i === active;
            return (
              <button
                key={p.id}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className="focus-ring absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl"
                style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
                aria-pressed={isActive}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  className={`flex w-28 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition sm:w-36 sm:p-4 ${
                    isActive ? 'border-sand bg-sand/20 shadow-[0_0_40px_rgba(217,119,6,.35)]' : 'border-white/15 bg-navy-800/90 hover:border-white/30'
                  }`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-xl sm:h-12 sm:w-12 ${isActive ? 'bg-sand text-navy' : 'bg-white/10 text-slate-200'}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <span className="text-xs font-bold text-white sm:text-sm">{p.title}</span>
                </motion.div>
              </button>
            );
          })}
        </motion.div>

        {/* لوحة التفاصيل */}
        <motion.div variants={item}>
          <div className="mb-4 flex flex-wrap gap-2">
            {d.parties.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActive(i)}
                className={`focus-ring rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  i === active ? 'bg-sand text-navy' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={party.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="glass rounded-3xl p-6 sm:p-7"
            >
              <div className="mb-1 flex items-center gap-3">
                <party.icon className="h-6 w-6 text-sand-light" />
                <h3 className="text-2xl font-extrabold text-white">{party.title}</h3>
              </div>
              <p className="mb-5 font-plex text-slate-400">{party.role}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {party.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-saudi-light" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 grid grid-cols-5 gap-2">
            {d.pillars.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-navy-800/60 py-3"
              >
                <Icon className="h-5 w-5 text-saudi-light" />
                <span className="text-[11px] font-semibold text-slate-300 sm:text-xs">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { problemSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';
import Modal from '../Modal';
import { accentStyles } from '../accent';

export default function ProblemSlide() {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = d.cards.find((c) => c.id === openId);

  return (
    <SlideLayout header={d.header}>
      <div className="grid gap-5 md:grid-cols-3">
        {d.cards.map((c, i) => {
          const a = accentStyles[c.accent];
          const Icon = c.icon;
          return (
            <motion.button
              key={c.id}
              variants={item}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOpenId(c.id)}
              className={`focus-ring group glass relative flex flex-col overflow-hidden rounded-3xl p-6 text-right transition hover:border-white/25 sm:p-7`}
            >
              <span className="absolute -left-6 -top-6 font-black text-white/[0.04] text-[8rem] leading-none">{i + 1}</span>
              <span className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl border ${a.border} ${a.bg} ${a.text}`}>
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">{c.title}</h3>
              <p className="mb-6 font-plex leading-relaxed text-slate-400">{c.summary}</p>
              <div className="mt-auto border-t border-white/10 pt-5">
                <div className={`text-3xl font-black ${a.text}`} dir="auto" style={{ textAlign: 'right' }}>
                  {c.stat.value}
                </div>
                <div className="text-sm text-slate-400">{c.stat.label}</div>
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sand-light">
                عرض التفاصيل
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
              </span>
            </motion.button>
          );
        })}
      </div>

      <Modal open={!!active} onClose={() => setOpenId(null)} title={active?.title ?? ''}>
        {active && (
          <div>
            <span className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl border ${accentStyles[active.accent].border} ${accentStyles[active.accent].bg} ${accentStyles[active.accent].text}`}>
              <active.icon className="h-7 w-7" />
            </span>
            <h3 className="mb-2 text-2xl font-extrabold text-white">{active.title}</h3>
            <p className="mb-6 font-plex text-slate-300">{active.summary}</p>
            <ul className="space-y-3">
              {active.details.map((t, i) => (
                <motion.li
                  key={t}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="flex items-start gap-3 rounded-xl bg-white/5 p-3 font-plex text-slate-200"
                >
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-sand-light" />
                  {t}
                </motion.li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-sand/30 bg-sand/10 p-4">
              <div className="text-2xl font-black text-sand-light" dir="auto" style={{ textAlign: 'right' }}>{active.stat.value}</div>
              <div className="text-sm text-slate-300">{active.stat.label}</div>
            </div>
          </div>
        )}
      </Modal>
    </SlideLayout>
  );
}

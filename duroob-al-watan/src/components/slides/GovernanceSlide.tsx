import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Columns2, Repeat } from 'lucide-react';
import { governanceSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';
import { formatNumber } from '../accent';

type View = 'public' | 'private' | 'both';
const maxFine = Math.max(...d.fines.map((f) => f.amount));
const severityColor = ['#22C55E', '#F59E0B', '#EF4444'];

export default function GovernanceSlide() {
  const [view, setView] = useState<View>('both');
  const [fineIdx, setFineIdx] = useState<number | null>(null);

  const tabs: { id: View; label: string; icon: typeof Columns2 }[] = [
    ...d.categories.map((c) => ({ id: c.id as View, label: c.label, icon: c.icon })),
    { id: 'both', label: 'مقارنة', icon: Columns2 },
  ];

  return (
    <SlideLayout header={d.header}>
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <motion.div variants={item} className="glass overflow-hidden rounded-3xl">
          <div className="flex flex-wrap gap-2 border-b border-white/10 p-3" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={view === t.id}
                onClick={() => setView(t.id)}
                className={`focus-ring relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  view === t.id ? 'text-navy' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {view === t.id && <motion.span layoutId="govTab" className="absolute inset-0 rounded-xl bg-sand" />}
                <t.icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-right text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="px-4 py-3 font-semibold">المعيار</th>
                  {(view === 'both' || view === 'public') && <th className="px-4 py-3 font-semibold text-sand-light">النقل العام</th>}
                  {(view === 'both' || view === 'private') && <th className="px-4 py-3 font-semibold text-saudi-light">النقل الخاص</th>}
                </tr>
              </thead>
              <AnimatePresence mode="wait">
                <motion.tbody key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {d.requirements.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <motion.tr
                        key={r.criterion}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-t border-white/5 hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="flex items-center gap-2 font-bold text-white">
                            <Icon className="h-4 w-4 text-slate-400" />
                            {r.criterion}
                          </span>
                        </td>
                        {(view === 'both' || view === 'public') && <td className="px-4 py-3 font-plex text-slate-200">{r.public}</td>}
                        {(view === 'both' || view === 'private') && <td className="px-4 py-3 font-plex text-slate-200">{r.private}</td>}
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </AnimatePresence>
            </table>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass flex flex-col rounded-3xl p-5">
          <h3 className="mb-4 text-base font-bold text-white">{d.finesTitle}</h3>
          <ul className="space-y-2">
            {d.fines.map((f, i) => {
              const Icon = f.icon;
              const on = fineIdx === i;
              return (
                <li key={f.violation}>
                  <button
                    onMouseEnter={() => setFineIdx(i)}
                    onMouseLeave={() => setFineIdx(null)}
                    onFocus={() => setFineIdx(i)}
                    onBlur={() => setFineIdx(null)}
                    className={`focus-ring w-full rounded-xl p-2.5 text-right transition ${on ? 'bg-white/10' : 'bg-white/[0.03]'}`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: severityColor[f.severity - 1] }} />
                      <span className="flex-1 text-xs font-semibold text-slate-200 sm:text-sm">{f.violation}</span>
                      <span className="font-mono text-sm font-black tabular-nums text-white">
                        {formatNumber(f.amount)} <span className="text-[10px] text-slate-400">{d.currency}</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: severityColor[f.severity - 1] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.amount / maxFine) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.4 + i * 0.07 }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold leading-relaxed text-red-200">
            <Repeat className="mt-0.5 h-4 w-4 shrink-0" />
            {d.repeatNote}
          </p>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { parkingSlide as d } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';
import { useCountUp } from '../../hooks/useCountUp';
import { formatNumber } from '../accent';

const UNIT = 10; // كل خلية تمثل 10 شاحنات

export default function ParkingSlide() {
  const [zoneId, setZoneId] = useState<string | null>(null);
  const capacity = useCountUp(d.totalCapacity, 2.2, 0.3);
  const zone = d.zones.find((z) => z.id === zoneId);

  const cells = useMemo(
    () => d.zones.flatMap((z) => Array.from({ length: Math.round(z.capacity / UNIT) }, (_, i) => ({ zone: z, key: `${z.id}-${i}` }))),
    [],
  );

  return (
    <SlideLayout header={d.header}>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <motion.div variants={item} className="glass rounded-3xl p-4 sm:p-6">
          {/* مسار الدخول */}
          <div className="relative mb-6">
            <div className="absolute inset-x-6 top-5 h-1 rounded-full bg-white/10" />
            <motion.div
              className="absolute top-1.5 text-sand-light"
              initial={{ right: '0%' }}
              animate={{ right: ['2%', '88%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
            >
              <Truck className="h-7 w-7 -scale-x-100 drop-shadow-[0_0_8px_rgba(245,158,11,.8)]" />
            </motion.div>
            <ol className="relative flex justify-between">
              {d.flow.map(({ icon: Icon, label }, i) => (
                <li key={label} className="flex w-16 flex-col items-center gap-2 text-center sm:w-20">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-navy ${i === 2 ? 'border-sand text-sand-light' : 'border-white/20 text-slate-300'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-slate-400 sm:text-xs">{label}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* مخطط الموقف */}
          <div className="rounded-2xl border border-dashed border-white/15 bg-navy-950/50 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>مخطط الموقف — كل مربع = {UNIT} شاحنات</span>
              <span className="rounded-full bg-saudi/20 px-2 py-0.5 font-bold text-saudi-light">مخطط تفاعلي</span>
            </div>
            <div className="grid grid-cols-10 gap-1 sm:grid-cols-[repeat(20,minmax(0,1fr))] sm:gap-1.5">
              {cells.map((c, i) => {
                const dim = zoneId && c.zone.id !== zoneId;
                return (
                  <motion.button
                    key={c.key}
                    onClick={() => setZoneId(c.zone.id === zoneId ? null : c.zone.id)}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: dim ? 0.15 : 1, scale: 1 }}
                    transition={{ delay: zoneId === null ? 0.3 + i * 0.012 : 0, duration: 0.3 }}
                    className="aspect-square rounded-[3px] sm:aspect-[1/1.15] focus:outline-none"
                    style={{ backgroundColor: c.zone.color, boxShadow: zoneId === c.zone.id ? `0 0 10px ${c.zone.color}` : undefined }}
                    aria-label={c.zone.name}
                    tabIndex={-1}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {d.zones.map((z) => (
                <span key={z.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: z.color }} />
                  {z.name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <motion.div variants={item} className="rounded-3xl border border-sand/40 bg-gradient-to-br from-sand/25 to-sand/5 p-5">
            <div className="text-5xl font-black tabular-nums text-white sm:text-6xl" dir="ltr" style={{ textAlign: 'right' }}>
              {formatNumber(capacity)}
            </div>
            <div className="mt-1 font-semibold text-sand-pale">{d.capacityLabel}</div>
          </motion.div>

          <motion.div variants={item} className="space-y-2">
            {d.zones.map((z) => {
              const Icon = z.icon;
              const active = z.id === zoneId;
              return (
                <button
                  key={z.id}
                  onClick={() => setZoneId(active ? null : z.id)}
                  aria-pressed={active}
                  className={`focus-ring w-full rounded-2xl border px-3 py-2 text-right transition ${
                    active ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${z.color}33`, color: z.color }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-sm font-bold text-white">{z.name}</span>
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-300">{z.capacity}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: z.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(z.capacity / d.totalCapacity) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <AnimatePresence>
                    {active && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pt-2 font-plex text-sm leading-relaxed text-slate-300"
                      >
                        {z.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </motion.div>

          <motion.div variants={item}>
            <h3 className="mb-2 text-sm font-bold text-slate-400">الخدمات المساندة للسائقين</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {d.services.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-navy-800/60 px-1 py-2.5 text-center">
                  <Icon className="h-5 w-5 text-saudi-light" />
                  <span className="text-[10px] font-semibold leading-tight text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      {zone && <span className="sr-only" aria-live="polite">{zone.name}</span>}
    </SlideLayout>
  );
}

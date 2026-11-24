import { motion } from 'framer-motion';
import { closingSlide as d, projectMeta } from '../../data/slidesData';
import SlideLayout, { item } from '../SlideLayout';

export default function ClosingSlide() {
  const CtaIcon = d.cta.icon;
  return (
    <SlideLayout header={d.header}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {d.values.map(({ icon: Icon, title, text }) => (
          <motion.div key={title} variants={item} whileHover={{ y: -4 }} className="glass rounded-3xl p-5">
            <Icon className="mb-3 h-7 w-7 text-sand-light" />
            <h3 className="mb-1 text-lg font-bold text-white">{title}</h3>
            <p className="font-plex text-sm leading-relaxed text-slate-400">{text}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-3xl border border-sand/50 bg-gradient-to-l from-sand/30 via-sand/10 to-saudi/20 p-6 sm:p-8"
        >
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-saudi/30 blur-3xl" />
          <h3 className="relative mb-3 text-2xl font-black text-white sm:text-3xl">{d.cta.title}</h3>
          <p className="relative mb-6 max-w-xl font-plex text-base leading-relaxed text-slate-200">{d.cta.text}</p>
          <motion.a
            href={`mailto:${d.contact.find((c) => c.value.includes('@'))?.value ?? ''}`}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="focus-ring relative inline-flex items-center gap-2 rounded-2xl bg-sand px-6 py-3 text-base font-black text-navy shadow-[0_10px_40px_rgba(217,119,6,.45)] hover:bg-sand-light"
          >
            <CtaIcon className="h-5 w-5" />
            {d.cta.button}
          </motion.a>
        </motion.div>

        <motion.div variants={item} className="glass rounded-3xl p-6">
          <h3 className="mb-4 text-base font-bold text-white">بيانات التواصل</h3>
          <ul className="space-y-3">
            {d.contact.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-saudi-light">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="truncate font-bold text-white" dir="auto">{value}</div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div variants={item} className="mt-8 text-center">
        <div className="text-gradient-gold text-4xl font-black sm:text-5xl">{d.thanks}</div>
        <div className="mt-2 text-sm font-semibold text-slate-400">
          {projectMeta.name} — {projectMeta.nameEn}
        </div>
      </motion.div>
    </SlideLayout>
  );
}

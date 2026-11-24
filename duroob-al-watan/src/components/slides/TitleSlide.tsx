import { motion } from 'framer-motion';
import { Award, Keyboard } from 'lucide-react';
import { projectMeta, titleSlide as d } from '../../data/slidesData';
import { item, stagger } from '../SlideLayout';

function RouteEmblem() {
  return (
    <svg viewBox="0 0 420 420" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="210" cy="210" r="190" fill="none" stroke="url(#ring)" strokeWidth="1.5" strokeDasharray="4 10"
        animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '210px', originY: '210px' }}
      />
      <circle cx="210" cy="210" r="150" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" />
      {/* شبكة الطرق */}
      {[
        'M70 300 C 140 280 170 200 210 210 S 300 120 350 110',
        'M90 140 C 150 170 180 230 210 210 S 290 290 340 310',
        'M210 60 L 210 360',
      ].map((p, i) => (
        <g key={i}>
          <path d={p} fill="none" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
          <motion.path
            d={p} fill="none" stroke={i === 2 ? '#15803D' : '#D97706'} strokeWidth="3" strokeLinecap="round"
            pathLength={1} strokeDasharray="1 1" initial={{ strokeDashoffset: 1 }} animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.8, delay: 0.4 + i * 0.25, ease: 'easeInOut' }}
          />
        </g>
      ))}
      {[
        [70, 300], [350, 110], [90, 140], [340, 310], [210, 60], [210, 360],
      ].map(([x, y], i) => (
        <motion.circle
          key={i} cx={x} cy={y} r="7" fill="#0F172A" stroke="#F59E0B" strokeWidth="3"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6 + i * 0.08 }}
        />
      ))}
      <motion.circle
        cx="210" cy="210" r="22" fill="#15803D"
        initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ delay: 1.2, duration: 0.6 }}
      />
      <motion.circle
        cx="210" cy="210" r="22" fill="none" stroke="#22C55E" strokeWidth="2"
        animate={{ r: [22, 60], opacity: [0.8, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 2 }}
      />
      <circle cx="210" cy="210" r="8" fill="#fff" />
    </svg>
  );
}

export default function TitleSlide() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto grid min-h-full w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:px-12"
    >
      <div>
        <motion.div variants={item} className="mb-6 inline-flex items-center gap-2 rounded-full border border-saudi/50 bg-saudi/15 px-4 py-2 text-sm font-bold text-saudi-light">
          <Award className="h-4 w-4" />
          {d.badge}
        </motion.div>
        <motion.p variants={item} className="mb-3 text-lg font-semibold text-slate-400">
          {d.kicker}
        </motion.p>
        <motion.h1 variants={item} className="text-gradient-gold pb-3 text-6xl font-black leading-[1.15] sm:text-7xl lg:text-8xl">
          {d.title}
        </motion.h1>
        <motion.p variants={item} className="mb-6 font-mono text-sm tracking-[0.4em] text-slate-500" dir="ltr" style={{ textAlign: 'right' }}>
          {d.titleEn}
        </motion.p>
        <motion.div variants={item} className="mb-8 h-1 w-24 rounded-full bg-gradient-to-l from-sand to-saudi" />
        <motion.p variants={item} className="max-w-2xl text-xl font-semibold leading-relaxed text-white sm:text-2xl">
          {d.subtitle}
        </motion.p>

        <motion.ul variants={item} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.highlights.map(({ icon: Icon, label }) => (
            <li key={label} className="glass flex flex-col items-start gap-2 rounded-2xl p-4">
              <Icon className="h-5 w-5 text-sand-light" />
              <span className="text-sm font-semibold text-slate-200">{label}</span>
            </li>
          ))}
        </motion.ul>

        <motion.p variants={item} className="mt-8 hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <Keyboard className="h-4 w-4" />
          {d.hint}
        </motion.p>
      </div>

      <motion.div variants={item} className="relative mx-auto aspect-square w-full max-w-sm lg:max-w-md">
        <RouteEmblem />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-navy-800/80 px-4 py-1.5 text-xs text-slate-400">
          {projectMeta.confidentiality} • {projectMeta.year}
        </div>
      </motion.div>
    </motion.div>
  );
}

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { SlideHeader } from '../data/slidesData';

interface Props {
  header: SlideHeader;
  children: ReactNode;
}

export const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

export default function SlideLayout({ header, children }: Props) {
  const Icon = header.icon;
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pb-8 pt-6 sm:px-8 lg:px-12 lg:pt-8"
    >
      <motion.header variants={item} className="mb-5 lg:mb-7">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-sand/40 bg-sand/15 text-sand-light">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-wide text-sand-light">{header.eyebrow}</span>
          <span className="h-px flex-1 bg-gradient-to-l from-sand/40 to-transparent" />
        </div>
        <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{header.title}</h2>
        {header.subtitle && (
          <p className="mt-3 max-w-3xl font-plex text-base leading-relaxed text-slate-300 sm:text-lg">{header.subtitle}</p>
        )}
      </motion.header>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}

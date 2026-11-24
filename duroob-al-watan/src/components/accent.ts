import type { Accent } from '../data/slidesData';

export const accentStyles: Record<Accent, { text: string; bg: string; border: string; ring: string; hex: string }> = {
  green: { text: 'text-saudi-light', bg: 'bg-saudi/15', border: 'border-saudi/40', ring: 'ring-saudi', hex: '#15803D' },
  gold: { text: 'text-sand-light', bg: 'bg-sand/15', border: 'border-sand/40', ring: 'ring-sand', hex: '#D97706' },
  navy: { text: 'text-slate-300', bg: 'bg-navy-700/40', border: 'border-white/15', ring: 'ring-white', hex: '#334155' },
  white: { text: 'text-white', bg: 'bg-white/10', border: 'border-white/30', ring: 'ring-white', hex: '#FFFFFF' },
};

export const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

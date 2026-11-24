import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2, Minimize2 } from 'lucide-react';
import { projectMeta, slidesNav } from '../data/slidesData';

interface Props {
  index: number;
  total: number;
  onGo: (i: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  onToggleFullscreen: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function NavBar({
  index,
  total,
  onGo,
  onNext,
  onPrev,
  isFullscreen,
  fullscreenSupported,
  onToggleFullscreen,
  menuOpen,
  setMenuOpen,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menuOpen, setMenuOpen]);

  const btn =
    'focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-sand/50 hover:bg-sand/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/5';

  return (
    <nav className="relative z-40 border-t border-white/10 bg-navy-950/80 backdrop-blur-xl" aria-label="التنقل بين الشرائح">
      {/* شريط التقدم */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-white/5">
        <motion.div
          className="h-full origin-right bg-gradient-to-l from-saudi via-saudi-light to-sand"
          animate={{ scaleX: (index + 1) / total }}
          style={{ transformOrigin: 'right' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-6">
        <button className={btn} onClick={onPrev} disabled={index === 0} aria-label="الشريحة السابقة">
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 sm:flex-none sm:basis-64">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-sand-light" dir="ltr">
              {pad(index + 1)}
              <span className="text-sm text-slate-500"> / {pad(total)}</span>
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="truncate text-xs font-semibold text-slate-300 sm:text-sm"
            >
              {slidesNav[index]?.title}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* نقاط التنقل */}
        <div className="hidden flex-1 items-center justify-center gap-1.5 md:flex">
          {slidesNav.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onGo(i)}
              className="focus-ring group relative grid h-6 place-items-center rounded-full px-0.5"
              aria-label={`${i + 1}: ${s.title}`}
              aria-current={i === index ? 'step' : undefined}
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-8 bg-sand' : i < index ? 'w-2 bg-saudi-light/70' : 'w-2 bg-white/20 group-hover:bg-white/50'
                }`}
              />
              <span className="pointer-events-none absolute bottom-8 whitespace-nowrap rounded-lg border border-white/10 bg-navy-800 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                {s.title}
              </span>
            </button>
          ))}
        </div>

        <span className="hidden text-xs font-semibold text-slate-500 lg:block">{projectMeta.name}</span>

        <div className="relative" ref={menuRef}>
          <button
            className={btn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="قائمة الشرائح"
            aria-expanded={menuOpen}
            title="قائمة الشرائح (G)"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.ul
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="glass-strong absolute bottom-14 left-0 max-h-[70vh] w-72 overflow-y-auto rounded-2xl p-2 shadow-2xl"
              >
                {slidesNav.map((s, i) => (
                  <li key={s.id}>
                    <button
                      onClick={() => {
                        onGo(i);
                        setMenuOpen(false);
                      }}
                      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition ${
                        i === index ? 'bg-sand/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
                          i === index ? 'bg-sand text-navy' : 'bg-white/10'
                        }`}
                      >
                        {pad(i + 1)}
                      </span>
                      <span className="font-semibold">{s.title}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {fullscreenSupported && (
          <button
            className={btn}
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
            title="ملء الشاشة (F)"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        )}

        <button
          className={`${btn} !border-sand/60 !bg-sand !text-navy hover:!bg-sand-light`}
          onClick={onNext}
          disabled={index === total - 1}
          aria-label="الشريحة التالية"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}

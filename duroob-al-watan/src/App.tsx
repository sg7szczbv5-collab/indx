import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Background from './components/Background';
import NavBar from './components/NavBar';
import { useFullscreen } from './hooks/useFullscreen';
import { slidesNav, type SlideId } from './data/slidesData';
import TitleSlide from './components/slides/TitleSlide';
import ProblemSlide from './components/slides/ProblemSlide';
import SolutionSlide from './components/slides/SolutionSlide';
import ParkingSlide from './components/slides/ParkingSlide';
import JourneySlide from './components/slides/JourneySlide';
import WalletSlide from './components/slides/WalletSlide';
import GovernanceSlide from './components/slides/GovernanceSlide';
import RevenueSlide from './components/slides/RevenueSlide';
import ImpactSlide from './components/slides/ImpactSlide';
import ClosingSlide from './components/slides/ClosingSlide';

const registry: Record<SlideId, ComponentType> = {
  title: TitleSlide,
  problem: ProblemSlide,
  solution: SolutionSlide,
  parking: ParkingSlide,
  journey: JourneySlide,
  wallet: WalletSlide,
  governance: GovernanceSlide,
  revenue: RevenueSlide,
  impact: ImpactSlide,
  closing: ClosingSlide,
};

const total = slidesNav.length;

const readHash = () => {
  const n = parseInt(window.location.hash.replace('#', ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= total ? n - 1 : 0;
};

// في الاتجاه RTL: الشريحة التالية تدخل من اليسار
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '-12%' : '12%', opacity: 0, filter: 'blur(6px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ x: dir > 0 ? '12%' : '-12%', opacity: 0, filter: 'blur(6px)' }),
};

export default function App() {
  const [[index, direction], setState] = useState<[number, number]>(() => [readHash(), 0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isFullscreen, toggle, supported } = useFullscreen();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((target: number) => {
    setState(([cur]) => {
      const next = Math.max(0, Math.min(total - 1, target));
      return next === cur ? [cur, 0] : [next, next > cur ? 1 : -1];
    });
  }, []);
  const next = useCallback(() => setState(([cur]) => (cur < total - 1 ? [cur + 1, 1] : [cur, 0])), []);
  const prev = useCallback(() => setState(([cur]) => (cur > 0 ? [cur - 1, -1] : [cur, 0])), []);

  useEffect(() => {
    window.history.replaceState(null, '', `#${index + 1}`);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const onHash = () => go(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[data-modal-open]')) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowRight':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(total - 1);
          break;
        case 'f':
        case 'F':
          toggle();
          break;
        case 'g':
        case 'G':
          setMenuOpen((v) => !v);
          break;
        case 'Escape':
          setMenuOpen(false);
          break;
        default:
          if (/^[0-9]$/.test(e.key)) go(e.key === '0' ? 9 : Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, toggle]);

  const Current = registry[slidesNav[index].id];

  return (
    <div className="relative flex h-full flex-col overflow-hidden" dir="rtl">
      <Background />
      <main
        className="relative z-10 flex-1 overflow-hidden"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x;
          const dy = e.changedTouches[0].clientY - touch.current.y;
          touch.current = null;
          if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx > 0) next();
            else prev();
          }
        }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
            aria-roledescription="slide"
            aria-label={`${index + 1} من ${total}: ${slidesNav[index].title}`}
          >
            <div ref={scrollRef} className="slide-scroll h-full overflow-y-auto overflow-x-hidden">
              <Current />
            </div>
          </motion.section>
        </AnimatePresence>
      </main>
      <NavBar
        index={index}
        total={total}
        onGo={go}
        onNext={next}
        onPrev={prev}
        isFullscreen={isFullscreen}
        fullscreenSupported={supported}
        onToggleFullscreen={toggle}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
    </div>
  );
}

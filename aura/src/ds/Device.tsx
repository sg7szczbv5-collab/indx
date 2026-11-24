import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { cx } from './ui'

export const PHONE_W = 390
export const PHONE_H = 844

export function useIsMobile(bp = 560) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const on = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [bp])
  return m
}

function useFit(reserveH: number, reserveW: number) {
  const calc = () => {
    if (typeof window === 'undefined') return 1
    return Math.min(1, (window.innerHeight - reserveH) / (PHONE_H + 24), (window.innerWidth - reserveW) / (PHONE_W + 24))
  }
  const [s, setS] = useState(calc)
  useEffect(() => {
    const on = () => setS(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reserveH, reserveW])
  return s
}

/**
 * Hosts a mobile app. On phones it fills the screen (the real experience);
 * on desktop it renders inside a device frame scaled to fit.
 */
export function Device({ children, statusTone = 'dark', scale: fixedScale, reserveH = 120, reserveW = 40, forceFrame }: { children: ReactNode; statusTone?: 'dark' | 'light'; scale?: number; reserveH?: number; reserveW?: number; forceFrame?: boolean }) {
  const mobile = useIsMobile()
  const fit = useFit(reserveH, reserveW)
  const scale = fixedScale ?? Math.max(0.5, fit)

  if (mobile && !forceFrame) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden" style={{ ['--safe-top' as string]: 'max(env(safe-area-inset-top), 14px)', ['--safe-bottom' as string]: 'max(env(safe-area-inset-bottom), 10px)' } as CSSProperties}>
        {children}
      </div>
    )
  }
  const W = PHONE_W + 24
  const H = PHONE_H + 24
  return (
    <div data-device className="relative shrink-0" style={{ width: W * scale, height: H * scale }}>
      <div className="absolute start-0 top-0 origin-top-left" style={{ transform: `scale(${scale})`, width: W, height: H }} dir="ltr">
        <div className="relative h-full w-full rounded-[58px] bg-[#1b1c1e] p-[3px] shadow-[0_40px_100px_-30px_rgba(16,17,18,0.55),0_0_0_1px_rgba(16,17,18,0.2)]">
          <div className="relative h-full w-full rounded-[55px] bg-black p-[9px]">
            <span className="absolute top-[140px] -left-[4px] h-14 w-[3px] rounded-l bg-[#2a2b2e]" />
            <span className="absolute top-[210px] -left-[4px] h-14 w-[3px] rounded-l bg-[#2a2b2e]" />
            <span className="absolute top-[180px] -right-[4px] h-24 w-[3px] rounded-r bg-[#2a2b2e]" />
            <div
              className="relative overflow-hidden rounded-[47px] bg-white"
              style={{ width: PHONE_W, height: PHONE_H, ['--safe-top' as string]: '50px', ['--safe-bottom' as string]: '22px' } as CSSProperties}
            >
              <div className={cx('pointer-events-none absolute inset-x-0 top-0 z-[100] flex h-[50px] items-center justify-between px-8 pt-1 text-[15px] font-semibold', statusTone === 'dark' ? 'text-ink' : 'text-white')}>
                <span className="num">9:41</span>
                <span className="flex items-center gap-1.5">
                  <Signal size={15} strokeWidth={2.4} />
                  <Wifi size={15} strokeWidth={2.4} />
                  <BatteryFull size={20} strokeWidth={1.8} />
                </span>
              </div>
              <div className="pointer-events-none absolute top-[11px] left-1/2 z-[100] h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
              <div className="absolute inset-0">{children}</div>
              <div className={cx('pointer-events-none absolute bottom-[8px] left-1/2 z-[100] h-[5px] w-[130px] -translate-x-1/2 rounded-full', statusTone === 'dark' ? 'bg-ink/85' : 'bg-white/85')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { Signal, Wifi, BatteryFull } from 'lucide-react'

export const PHONE_W = 320
export const PHONE_H = 668

/** Scales a fixed-size device so it always fits the viewport (desktop: height, mobile: width). */
export function useFitScale(w: number, h: number, reserveH = 190, reserveW = 32) {
  const calc = () => {
    if (typeof window === 'undefined') return 1
    const vw = window.innerWidth
    const vh = window.innerHeight
    const byH = (vh - reserveH) / h
    const byW = (vw - reserveW) / w
    const s = vw < 1024 ? Math.min(1, byW, Math.max(byH, 0.78)) : Math.min(1, byH, byW)
    return Math.max(0.55, s)
  }
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const on = () => setScale(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, reserveH, reserveW])
  return scale
}

export function PhoneFrame({
  children,
  statusDark = true,
  label,
}: {
  children: ReactNode
  statusDark?: boolean
  label?: string
}) {
  const scale = useFitScale(PHONE_W + 24, PHONE_H + 24)
  return (
    <div
      className="relative shrink-0"
      style={{ width: (PHONE_W + 24) * scale, height: (PHONE_H + 24) * scale }}
    >
      <div
        className="absolute top-0 right-0 origin-top-right"
        style={{ transform: `scale(${scale})`, width: PHONE_W + 24, height: PHONE_H + 24 }}
      >
        {/* body */}
        <div className="relative h-full w-full rounded-[54px] bg-gradient-to-b from-[#3a403d] via-[#1c201e] to-[#2b302d] p-[3px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="relative h-full w-full rounded-[51px] bg-black p-[9px]">
            {/* side buttons */}
            <span className="absolute top-[120px] -left-[5px] h-12 w-[3px] rounded-l bg-[#2b302d]" />
            <span className="absolute top-[180px] -left-[5px] h-12 w-[3px] rounded-l bg-[#2b302d]" />
            <span className="absolute top-[150px] -right-[5px] h-20 w-[3px] rounded-r bg-[#2b302d]" />
            {/* screen */}
            <div
              className="relative h-full w-full overflow-hidden rounded-[43px] bg-white text-ink"
              style={{ width: PHONE_W, height: PHONE_H }}
            >
              {/* status bar */}
              <div
                dir="ltr"
                className={`pointer-events-none absolute inset-x-0 top-0 z-50 flex h-11 items-center justify-between px-7 text-[13px] font-semibold ${
                  statusDark ? 'text-ink' : 'text-white'
                }`}
              >
                <span className="num">9:41</span>
                <span className="flex items-center gap-1">
                  <Signal size={14} strokeWidth={2.5} />
                  <Wifi size={14} strokeWidth={2.5} />
                  <BatteryFull size={18} strokeWidth={2} />
                </span>
              </div>
              {/* dynamic island */}
              <div className="pointer-events-none absolute top-[9px] left-1/2 z-50 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
              <div className="absolute inset-0">{children}</div>
              {/* home indicator */}
              <div
                className={`pointer-events-none absolute bottom-[7px] left-1/2 z-50 h-[4px] w-[110px] -translate-x-1/2 rounded-full ${
                  statusDark ? 'bg-ink/80' : 'bg-white/80'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
      {label && (
        <div className="absolute -bottom-7 inset-x-0 text-center text-xs text-white/40">{label}</div>
      )}
    </div>
  )
}

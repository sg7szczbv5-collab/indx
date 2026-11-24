import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/** Stylized, fully offline city map (no tiles / API keys). Coordinates in a 320×668 space. */
export const TRIP_D = 'M110 470 L110 352 Q110 340 122 340 L178 340 Q190 340 190 328 L190 242 Q190 230 202 230 L248 230 Q260 230 260 218 L260 150'
export const APPROACH_D = 'M40 640 L40 572 Q40 560 52 560 L98 560 Q110 560 110 548 L110 470'
export const PICKUP = { x: 110, y: 470 }
export const DROPOFF = { x: 260, y: 150 }

const V_ROADS = [40, 110, 190, 260]
const H_ROADS = [120, 230, 340, 450, 560]

function useCarPose(d: string, progress: number) {
  const ref = useRef<SVGPathElement>(null)
  const [pose, setPose] = useState({ x: 0, y: 0, a: 0 })
  useLayoutEffect(() => {
    const p = ref.current
    if (!p) return
    const len = p.getTotalLength()
    const t = Math.min(Math.max(progress, 0), 1) * len
    const a = p.getPointAtLength(t)
    const b = p.getPointAtLength(Math.min(len, t + 2))
    const c = t + 2 > len ? p.getPointAtLength(Math.max(0, t - 2)) : a
    const ang =
      t + 2 > len
        ? (Math.atan2(a.y - c.y, a.x - c.x) * 180) / Math.PI
        : (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
    setPose({ x: a.x, y: a.y, a: ang })
  }, [d, progress])
  return { ref, pose }
}

export function CarIcon({ x, y, a, color = '#0b0d0c', scale = 1 }: { x: number; y: number; a: number; color?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a + 90}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="8" ry="12" fill="rgba(0,0,0,0.18)" />
      <rect x="-7" y="-12" width="14" height="24" rx="5" fill={color} />
      <rect x="-5.5" y="-7" width="11" height="6" rx="2" fill="#9fd9bd" opacity="0.9" />
      <rect x="-5.5" y="4" width="11" height="4" rx="1.5" fill="#9fd9bd" opacity="0.6" />
    </g>
  )
}

export function MapCanvas({
  mode = 'idle',
  progress = 0,
  showUser = true,
  showNearby = true,
  showPickup = false,
  showDropoff = false,
  routeColor = '#0b0d0c',
  className = '',
}: {
  mode?: 'idle' | 'approach' | 'trip' | 'preview'
  progress?: number
  showUser?: boolean
  showNearby?: boolean
  showPickup?: boolean
  showDropoff?: boolean
  routeColor?: string
  className?: string
}) {
  const activePath = mode === 'approach' ? APPROACH_D : TRIP_D
  const { ref, pose } = useCarPose(activePath, progress)

  return (
    <svg viewBox="0 0 320 668" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`}>
      <defs>
        <pattern id="blocks" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#e8ebe9" />
          <rect x="1" y="1" width="8" height="8" rx="1.5" fill="#e1e5e2" />
        </pattern>
      </defs>
      <rect width="320" height="668" fill="#eef1ef" />
      {/* city blocks */}
      {V_ROADS.slice(0, -1).map((x, i) =>
        H_ROADS.slice(0, -1).map((y, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + 8}
            y={y + 8}
            width={V_ROADS[i + 1] - x - 16}
            height={H_ROADS[j + 1] - y - 16}
            rx="6"
            fill={(i + j) % 4 === 1 ? '#d8ede2' : 'url(#blocks)'}
          />
        )),
      )}
      {/* sea (Arabian Gulf, east) */}
      <path d="M292 0 C 284 90, 300 160, 288 250 S 296 420, 284 520 S 296 620, 290 668 L320 668 L320 0 Z" fill="#cfe3ec" />
      <path d="M292 0 C 284 90, 300 160, 288 250 S 296 420, 284 520 S 296 620, 290 668" fill="none" stroke="#b9d5e1" strokeWidth="1.5" />
      {/* minor roads */}
      {[75, 150, 225].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="668" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
      ))}
      {[175, 285, 395, 505, 615].map((y) => (
        <line key={y} x1="0" y1={y} x2="290" y2={y} stroke="#ffffff" strokeWidth="3" opacity="0.8" />
      ))}
      {/* main roads */}
      {V_ROADS.map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="668" stroke="#d5dad7" strokeWidth="11" />
          <line x1={x} y1="0" x2={x} y2="668" stroke="#ffffff" strokeWidth="8" />
        </g>
      ))}
      {H_ROADS.map((y) => (
        <g key={y}>
          <line x1="0" y1={y} x2="292" y2={y} stroke="#d5dad7" strokeWidth="11" />
          <line x1="0" y1={y} x2="292" y2={y} stroke="#ffffff" strokeWidth="8" />
        </g>
      ))}
      {/* highway */}
      <path d="M-10 420 C 80 400, 150 300, 330 60" fill="none" stroke="#f3dfae" strokeWidth="12" opacity="0.9" />
      <path d="M-10 420 C 80 400, 150 300, 330 60" fill="none" stroke="#fff6df" strokeWidth="6" />

      {/* hidden measuring path */}
      <path ref={ref} d={activePath} fill="none" stroke="none" />

      {/* routes */}
      {(mode === 'trip' || mode === 'preview') && (
        <>
          <path d={TRIP_D} fill="none" stroke={routeColor} strokeOpacity="0.15" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <motion.path
            d={TRIP_D}
            fill="none"
            stroke={routeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        </>
      )}
      {mode === 'approach' && (
        <path d={APPROACH_D} fill="none" stroke="#1fa36a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="route-dash" />
      )}

      {/* nearby idle cars */}
      {showNearby && (
        <g>
          {[
            'M40 0 L40 668',
            'M0 230 L292 230',
            'M190 668 L190 0',
            'M292 560 L0 560',
            'M260 0 L260 668',
          ].map((d, i) => (
            <g key={i} transform={`translate(${i % 2 ? 3 : -3} 0)`}>
              <g>
                <rect x="-8" y="-5" width="16" height="10" rx="3.5" fill="#1a1e1c" />
                <rect x="1" y="-3.5" width="4" height="7" rx="1" fill="#9fd9bd" opacity="0.8" />
                <animateMotion dur={`${14 + i * 3}s`} repeatCount="indefinite" path={d} rotate="auto" begin={`-${i * 2.3}s`} />
              </g>
            </g>
          ))}
        </g>
      )}

      {/* pickup / dropoff */}
      {showPickup && (
        <g transform={`translate(${PICKUP.x} ${PICKUP.y})`}>
          <circle r="11" fill="#0b0d0c" />
          <circle r="4.5" fill="#fff" />
        </g>
      )}
      {showDropoff && (
        <g transform={`translate(${DROPOFF.x} ${DROPOFF.y})`}>
          <rect x="-10" y="-10" width="20" height="20" rx="3" fill="#0f5b3a" />
          <rect x="-4" y="-4" width="8" height="8" fill="#fff" />
        </g>
      )}

      {/* user location */}
      {showUser && !showPickup && (
        <g transform={`translate(${PICKUP.x} ${PICKUP.y})`}>
          <circle r="10" fill="#1fa36a" className="ping-soft" />
          <circle r="22" fill="#1fa36a" opacity="0.12" />
          <circle r="8.5" fill="#fff" />
          <circle r="6" fill="#1fa36a" />
        </g>
      )}

      {/* active car */}
      {(mode === 'approach' || mode === 'trip') && <CarIcon x={pose.x} y={pose.y} a={pose.a} />}
    </svg>
  )
}

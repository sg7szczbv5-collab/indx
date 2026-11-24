import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/** Fully offline vector city map (no tiles / API keys). Coordinates live in a 320×668 space. */
export const TRIP_D = 'M110 470 L110 352 Q110 340 122 340 L178 340 Q190 340 190 328 L190 242 Q190 230 202 230 L248 230 Q260 230 260 218 L260 150'
export const APPROACH_D = 'M40 640 L40 572 Q40 560 52 560 L98 560 Q110 560 110 548 L110 470'
export const PICKUP = { x: 110, y: 470 }
export const DROPOFF = { x: 260, y: 150 }

const V_ROADS = [40, 110, 190, 260]
const H_ROADS = [120, 230, 340, 450, 560]

const STREETS_H: { y: number; name: string }[] = [
  { y: 120, name: 'شارع الأمير محمد' },
  { y: 230, name: 'طريق الملك سعود' },
  { y: 340, name: 'شارع الخليج' },
  { y: 450, name: 'شارع ١١' },
  { y: 560, name: 'طريق الأمير نايف' },
]
const STREETS_V: { x: number; name: string }[] = [
  { x: 40, name: 'شارع ٢٢' },
  { x: 190, name: 'طريق الملك فهد' },
]
const POIS = [
  { x: 150, y: 400, t: 'مسجد الحي' },
  { x: 228, y: 290, t: 'حديقة الشاطئ' },
  { x: 74, y: 190, t: 'مركز تجاري' },
  { x: 150, y: 610, t: 'مستشفى' },
]

function useCarPose(d: string, progress: number) {
  const ref = useRef<SVGPathElement>(null)
  const [pose, setPose] = useState({ x: 0, y: 0, a: 0 })
  useLayoutEffect(() => {
    const p = ref.current
    if (!p) return
    const len = p.getTotalLength()
    const t = Math.min(Math.max(progress, 0), 1) * len
    const a = p.getPointAtLength(t)
    const atEnd = t + 2 > len
    const b = atEnd ? p.getPointAtLength(Math.max(0, t - 2)) : p.getPointAtLength(t + 2)
    const ang = atEnd ? Math.atan2(a.y - b.y, a.x - b.x) : Math.atan2(b.y - a.y, b.x - a.x)
    setPose({ x: a.x, y: a.y, a: (ang * 180) / Math.PI })
  }, [d, progress])
  return { ref, pose }
}

/** Top-down car marker. */
export function CarIcon({ x, y, a, color = '#ffffff', scale = 1 }: { x: number; y: number; a: number; color?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a + 90}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="9" ry="13" fill="rgba(0,0,0,0.22)" />
      <rect x="-7.5" y="-13" width="15" height="26" rx="5.5" fill={color} stroke="#0b0d0c" strokeOpacity="0.35" strokeWidth="1" />
      <rect x="-5.5" y="-7.5" width="11" height="6" rx="2" fill="#0b0d0c" opacity="0.8" />
      <rect x="-5.5" y="4.5" width="11" height="4" rx="1.5" fill="#0b0d0c" opacity="0.55" />
    </g>
  )
}

/** Rounded label used for pickup / dropoff names and ETA chips. Arabic text, right-to-left. */
function Tag({ x, y, text, sub, eta, dark = false, anchor = 'start' }: { x: number; y: number; text: string; sub?: string; eta?: string; dark?: boolean; anchor?: 'start' | 'end' }) {
  const w = Math.max(text.length, (sub ?? '').length) * 5.3 + 22 + (eta ? 30 : 0)
  const h = sub ? 32 : 22
  const left = anchor === 'start' ? x + 14 : x - 14 - w
  const top = y - h / 2
  return (
    <g>
      <rect x={left} y={top} width={w} height={h} rx="6" fill={dark ? '#0b0d0c' : '#ffffff'} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }} />
      {eta && (
        <g>
          <rect x={left} y={top} width="28" height={h} rx="6" fill="#0b0d0c" />
          <text x={left + 14} y={top + (sub ? 15 : 14)} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#fff">{eta}</text>
          {sub && <text x={left + 14} y={top + 25} textAnchor="middle" fontSize="7" fill="#fff" opacity="0.7">دقيقة</text>}
        </g>
      )}
      <text x={left + w - 8} y={top + (sub ? 13 : 14.5)} direction="rtl" textAnchor="start" fontSize="9.5" fontWeight="600" fill={dark ? '#fff' : '#0b0d0c'}>
        {text}
      </text>
      {sub && (
        <text x={left + w - 8} y={top + 25} direction="rtl" textAnchor="start" fontSize="8" fill={dark ? '#ffffff' : '#0b0d0c'} opacity="0.55">
          {sub}
        </text>
      )}
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
  pickupLabel,
  pickupSub,
  pickupEta,
  dropoffLabel,
  routeEta,
  pickupBubble,
  labels = true,
  dark = false,
  view,
  className = '',
}: {
  mode?: 'idle' | 'approach' | 'trip' | 'preview'
  progress?: number
  showUser?: boolean
  showNearby?: boolean
  showPickup?: boolean
  showDropoff?: boolean
  routeColor?: string
  pickupLabel?: string
  pickupSub?: string
  pickupEta?: string
  dropoffLabel?: string
  routeEta?: string
  pickupBubble?: string
  labels?: boolean
  dark?: boolean
  /** Camera: the vertical slice of the 320×668 map to frame (defaults to the whole map). */
  view?: { y: number; h: number; w?: number }
  className?: string
}) {
  const activePath = mode === 'approach' ? APPROACH_D : TRIP_D
  const { ref, pose } = useCarPose(activePath, progress)

  const C = dark
    ? { bg: '#1b1f1d', block: '#222725', park: '#1f2c25', sea: '#132027', road: '#2e3431', roadEdge: '#262b29', minor: '#272c2a', text: '#ffffff', hw: '#3a3f2f' }
    : { bg: '#eceeed', block: '#e4e7e5', park: '#d6ead9', sea: '#c9dfe8', road: '#ffffff', roadEdge: '#d9dcda', minor: '#f7f8f7', text: '#0b0d0c', hw: '#f6e6b8' }

  return (
    <svg viewBox={view ? `${(320 - (view.w ?? 320)) / 2} ${view.y} ${view.w ?? 320} ${view.h}` : '0 0 320 668'} preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`}>
      <rect x="-100" y="-200" width="520" height="1068" fill={C.bg} />
      {/* city blocks */}
      {V_ROADS.slice(0, -1).map((x, i) =>
        H_ROADS.slice(0, -1).map((y, j) => (
          <rect key={`${i}-${j}`} x={x + 7} y={y + 7} width={V_ROADS[i + 1] - x - 14} height={H_ROADS[j + 1] - y - 14} rx="4" fill={(i + j) % 4 === 1 ? C.park : C.block} />
        )),
      )}
      {/* sea (Arabian Gulf, east) */}
      <path d="M292 0 C 284 90, 300 160, 288 250 S 296 420, 284 520 S 296 620, 290 668 L320 668 L320 0 Z" fill={C.sea} />
      {/* minor streets */}
      {[75, 150, 225].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="668" stroke={C.minor} strokeWidth="3" />
      ))}
      {[175, 285, 395, 505, 615].map((y) => (
        <line key={y} x1="0" y1={y} x2="290" y2={y} stroke={C.minor} strokeWidth="3" />
      ))}
      {/* main roads */}
      {V_ROADS.map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="668" stroke={C.roadEdge} strokeWidth="10" />
          <line x1={x} y1="0" x2={x} y2="668" stroke={C.road} strokeWidth="7.5" />
        </g>
      ))}
      {H_ROADS.map((y) => (
        <g key={y}>
          <line x1="0" y1={y} x2="292" y2={y} stroke={C.roadEdge} strokeWidth="10" />
          <line x1="0" y1={y} x2="292" y2={y} stroke={C.road} strokeWidth="7.5" />
        </g>
      ))}
      {/* highway */}
      <path d="M-10 420 C 80 400, 150 300, 330 60" fill="none" stroke={C.hw} strokeWidth="11" />
      <path d="M-10 420 C 80 400, 150 300, 330 60" fill="none" stroke={dark ? '#4a4f3d' : '#fdf3d6'} strokeWidth="5" />

      {/* street names + POIs */}
      {labels && (
        <g fill={C.text} opacity="0.42" fontSize="7.5" fontWeight="500">
          {STREETS_H.map((s) => (
            <text key={s.name} x="150" y={s.y - 7} direction="rtl" textAnchor="middle">{s.name}</text>
          ))}
          {STREETS_V.map((s) => (
            <text key={s.name} transform={`translate(${s.x + 3} 300) rotate(-90)`} direction="rtl" textAnchor="middle">{s.name}</text>
          ))}
          <text x="306" y="380" direction="rtl" textAnchor="middle" transform="rotate(-90 306 380)" fontSize="8" letterSpacing="2">الخليج العربي</text>
        </g>
      )}
      {labels &&
        POIS.map((p) => (
          <g key={p.t} transform={`translate(${p.x} ${p.y})`} opacity="0.75">
            <circle r="5" fill={dark ? '#3a403d' : '#c4cac6'} />
            <circle r="2" fill={dark ? '#1b1f1d' : '#ffffff'} />
            <text x="8" y="3" fontSize="7.5" fill={C.text} opacity="0.55" direction="rtl" textAnchor="end">{p.t}</text>
          </g>
        ))}

      {/* hidden measuring path */}
      <path ref={ref} d={activePath} fill="none" stroke="none" />

      {/* routes */}
      {(mode === 'trip' || mode === 'preview') && (
        <>
          <path d={TRIP_D} fill="none" stroke={routeColor} strokeOpacity="0.18" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <motion.path d={TRIP_D} fill="none" stroke={routeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
        </>
      )}
      {mode === 'approach' && (
        <path d={APPROACH_D} fill="none" stroke={routeColor === '#0b0d0c' ? '#0b0d0c' : routeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="route-dash" />
      )}

      {/* nearby idle cars */}
      {showNearby &&
        ['M40 0 L40 668', 'M0 230 L292 230', 'M190 668 L190 0', 'M292 560 L0 560', 'M260 0 L260 668'].map((d, i) => (
          <g key={i}>
            <g>
              <rect x="-8" y="-5" width="16" height="10" rx="3.5" fill={dark ? '#e9ecea' : '#ffffff'} stroke="#0b0d0c" strokeOpacity="0.35" />
              <rect x="1" y="-3.5" width="4" height="7" rx="1" fill="#0b0d0c" opacity="0.7" />
              <animateMotion dur={`${14 + i * 3}s`} repeatCount="indefinite" path={d} rotate="auto" begin={`-${i * 2.3}s`} />
            </g>
          </g>
        ))}

      {/* walking path from the rider to the pickup pin */}
      {pickupBubble && <path d={`M${PICKUP.x - 34} ${PICKUP.y + 46} L${PICKUP.x} ${PICKUP.y + 6}`} stroke="#0b0d0c" strokeWidth="3" strokeDasharray="0.1 7" strokeLinecap="round" />}

      {/* pickup / dropoff */}
      {showPickup && (
        <g transform={`translate(${PICKUP.x} ${PICKUP.y})`}>
          <circle r="10" fill="#0b0d0c" />
          <circle r="4" fill="#fff" />
        </g>
      )}
      {showDropoff && (
        <g transform={`translate(${DROPOFF.x} ${DROPOFF.y})`}>
          <rect x="-9" y="-9" width="18" height="18" rx="2" fill="#0b0d0c" />
          <rect x="-3.5" y="-3.5" width="7" height="7" fill="#fff" />
        </g>
      )}
      {pickupLabel && <Tag x={PICKUP.x} y={PICKUP.y} text={pickupLabel} sub={pickupSub} eta={pickupEta} />}
      {dropoffLabel && <Tag x={DROPOFF.x} y={DROPOFF.y} text={dropoffLabel} anchor="end" />}
      {routeEta && (
        <g transform="translate(150 340)">
          <rect x="-24" y="-11" width="48" height="22" rx="6" fill="#1fa36a" />
          <text y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" direction="rtl">{routeEta}</text>
        </g>
      )}
      {pickupBubble && (
        <g transform={`translate(${PICKUP.x} ${PICKUP.y - 32})`}>
          <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#0f5b3a" />
          <path d="M-5 11 L0 17 L5 11 Z" fill="#0f5b3a" />
          <text y="4" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" direction="rtl">{pickupBubble}</text>
        </g>
      )}

      {/* rider location */}
      {showUser && !showPickup && (
        <g transform={pickupBubble ? `translate(${PICKUP.x - 34} ${PICKUP.y + 50})` : `translate(${PICKUP.x} ${PICKUP.y})`}>
          <circle r="10" fill="#1fa36a" className="ping-soft" />
          <circle r="20" fill="#1fa36a" opacity="0.12" />
          <circle r="8" fill="#fff" />
          <circle r="5.5" fill="#1fa36a" />
        </g>
      )}
      {pickupBubble && (
        <g transform={`translate(${PICKUP.x} ${PICKUP.y})`}>
          <circle r="7" fill="#0f5b3a" stroke="#fff" strokeWidth="3" />
        </g>
      )}

      {/* active car */}
      {(mode === 'approach' || mode === 'trip') && <CarIcon x={pose.x} y={pose.y} a={pose.a} />}
    </svg>
  )
}

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CITIES } from '../data/content'

const COAST = 'M318 0 C 306 60, 326 112, 304 165 S 340 232, 352 292 S 366 382, 346 440'

function seeded(n: number) {
  let s = n
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const ROUTES = [
  'M205 150 C 230 210, 280 250, 300 300',
  'M205 150 C 200 220, 215 290, 225 330',
  'M225 330 C 255 325, 280 315, 300 300',
  'M300 300 C 260 260, 240 200, 205 150',
  'M120 120 C 150 140, 180 145, 205 150',
  'M225 330 C 200 300, 205 220, 205 150',
]

export function EasternMap({
  active,
  onCity,
  trips = true,
  light = false,
  className = '',
}: {
  active?: string | null
  onCity?: (id: string) => void
  trips?: boolean
  light?: boolean
  className?: string
}) {
  const dots = useMemo(() => {
    const r = seeded(7)
    return CITIES.flatMap((c) =>
      Array.from({ length: c.id === 'dhahran' ? 10 : 18 }, () => ({
        x: c.x + (r() - 0.5) * 80,
        y: c.y + (r() - 0.5) * 70,
        d: r() * 3,
        city: c.id,
      })),
    ).filter((d) => d.x < 330)
  }, [])

  const land = light ? '#f2f4f3' : '#151917'
  const sea = light ? '#dfeaf0' : '#0d1416'
  const road = light ? '#d6dbd8' : '#2a312d'
  const text = light ? '#0b0d0c' : '#ffffff'

  return (
    <svg viewBox="0 0 480 440" className={`h-full w-full ${className}`} role="img" aria-label="خريطة توضيحية للدمام والخبر والظهران">
      <rect width="480" height="440" fill={sea} />
      <path d={`${COAST} L0 440 L0 0 Z`} fill={land} />
      <path d={COAST} fill="none" stroke={light ? '#c5d7e0' : '#1e2a2e'} strokeWidth="2" />
      {/* Bahrain hint + causeway */}
      <path d="M420 330 C 440 320, 462 340, 458 372 S 430 410, 418 388 S 404 340, 420 330 Z" fill={land} opacity="0.85" />
      <path d="M330 345 L 418 358" stroke={road} strokeWidth="3" strokeDasharray="4 4" />
      <text x="438" y="420" textAnchor="middle" fontSize="10" fill={text} opacity="0.35">البحرين</text>
      <text x="410" y="120" textAnchor="middle" fontSize="11" fill={text} opacity="0.3" letterSpacing="2">الخليج العربي</text>
      {/* grid hint */}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={i * 40} y1="0" x2={i * 40} y2="440" stroke={text} opacity="0.03" />
      ))}
      {/* roads */}
      <path d="M0 95 C 60 105, 100 115, 205 150" stroke={road} strokeWidth="5" fill="none" />
      <path d="M0 330 C 80 330, 150 332, 225 330" stroke={road} strokeWidth="4" fill="none" />
      {ROUTES.slice(0, 3).map((d, i) => (
        <path key={i} d={d} stroke={road} strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
      {/* trip dots */}
      {trips &&
        dots.map((d, i) => (
          <motion.circle
            key={i}
            cx={d.x}
            cy={d.y}
            r="2.6"
            fill="#1fa36a"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.25, 1] }}
            transition={{ duration: 3, delay: d.d, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
      {/* moving vehicles */}
      {trips &&
        ROUTES.map((d, i) => (
          <circle key={`m${i}`} r="3.4" fill={light ? '#0b0d0c' : '#ffffff'}>
            <animateMotion dur={`${6 + i * 1.7}s`} repeatCount="indefinite" path={d} begin={`-${i}s`} />
          </circle>
        ))}
      {/* cities */}
      {CITIES.map((c) => {
        const on = active === c.id
        return (
          <g
            key={c.id}
            transform={`translate(${c.x} ${c.y})`}
            onClick={() => onCity?.(c.id)}
            style={{ cursor: onCity ? 'pointer' : 'default' }}
            role={onCity ? 'button' : undefined}
            aria-label={c.name}
          >
            <circle r="34" fill="transparent" />
            <circle r={on ? 26 : 18} fill="#1fa36a" opacity={on ? 0.18 : 0.1} style={{ transition: 'all .4s' }} />
            <circle r="9" fill="#1fa36a" className="ping-soft" opacity="0.5" />
            <circle r="6.5" fill={on ? '#1fa36a' : text} stroke={land} strokeWidth="2.5" />
            <text y={c.id === 'dhahran' ? 30 : -18} textAnchor="middle" fontSize="15" fontWeight="700" fill={text}>
              {c.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

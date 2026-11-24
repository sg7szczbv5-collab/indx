import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CITY, DISTRICTS, GRID, MAJOR_H, MAJOR_V, PLACES, type Point } from '../lib/geo'

export interface MapCar {
  id: string
  p: Point
  a: number
  color?: string
  focus?: boolean
  moto?: boolean
  dim?: boolean
}

interface Props {
  /** Points the camera should frame. */
  focus: Point[]
  /** Fraction of the map height covered by a bottom sheet (the camera keeps points above it). */
  inset?: number
  /** Fraction of the map height covered by top chrome (status bar, buttons). */
  insetTop?: number
  /** Minimum span (map units) so the camera never zooms in too far. */
  minSpan?: number
  route?: Point[]
  approach?: Point[]
  pickup?: { p: Point; label?: string; sub?: string }
  dropoff?: { p: Point; label?: string; sub?: string }
  user?: Point
  cars?: MapCar[]
  dark?: boolean
  pois?: boolean
  heat?: Point[]
  className?: string
  onTap?: (p: Point) => void
}

type View = { x: number; y: number; w: number; h: number }

function fit(points: Point[], W: number, H: number, inset: number, minSpan: number, top: number): View {
  const pts = points.length ? points : [{ x: CITY.w / 2, y: CITY.h / 2 }]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  let x0 = Math.min(...xs)
  let x1 = Math.max(...xs)
  let y0 = Math.min(...ys)
  let y1 = Math.max(...ys)
  const pad = 60
  x0 -= pad
  x1 += pad
  y0 -= pad * 1.4
  y1 += pad
  const bw = Math.max(minSpan, x1 - x0)
  const bh = Math.max(minSpan * 0.6, y1 - y0)
  const cx = (x0 + x1) / 2
  const f = Math.max(0.25, 1 - inset - top)
  const aspect = W / Math.max(1, H)
  let w = Math.max(bw, (bh / f) * aspect)
  let h = w / aspect
  if (h * f < bh) {
    h = bh / f
    w = h * aspect
  }
  const visH = h * f
  const y = (y0 + y1) / 2 - visH / 2 - h * top
  return { x: cx - w / 2, y, w, h }
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 360, h: 640 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setSize({ w: el.clientWidth || 360, h: el.clientHeight || 640 })
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, size }
}

/** Smoothly animates the camera toward its target. */
function useCamera(target: View) {
  const [v, setV] = useState(target)
  const cur = useRef(target)
  const tgt = useRef(target)
  tgt.current = target
  useEffect(() => {
    let raf = 0
    const step = () => {
      const c = cur.current
      const t = tgt.current
      const k = 0.14
      const n = { x: c.x + (t.x - c.x) * k, y: c.y + (t.y - c.y) * k, w: c.w + (t.w - c.w) * k, h: c.h + (t.h - c.h) * k }
      const done = Math.abs(n.x - t.x) + Math.abs(n.y - t.y) + Math.abs(n.w - t.w) < 0.5
      cur.current = done ? t : n
      setV(cur.current)
      if (!done) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target.x, target.y, target.w, target.h])
  return v
}

const toD = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

export function Map({ focus, inset = 0, insetTop = 0.12, minSpan = 260, route, approach, pickup, dropoff, user, cars = [], dark = false, pois = true, heat, className = '', onTap }: Props) {
  const { ref, size } = useSize<HTMLDivElement>()
  const target = fit(focus, size.w, size.h, inset, minSpan, insetTop)
  const v = useCamera(target)
  const u = v.w / Math.max(1, size.w) // map units per screen px

  const C = dark
    ? { bg: '#141514', block: '#1b1d1b', park: '#17261c', wadi: '#16222a', road: '#2b2d2b', major: '#3a3c38', edge: '#101110', text: '#f5f5f2', route: '#c8f31d', label: '#a3a39d' }
    : { bg: '#ecece8', block: '#f6f6f3', park: '#dcebd5', wadi: '#d5e4ec', road: '#ffffff', major: '#ffffff', edge: '#d9d9d3', text: '#0a0a0a', route: '#0a0a0a', label: '#6b6b66' }

  const tap = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onTap) return
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
    onTap({ x: v.x + ((e.clientX - r.left) / r.width) * v.w, y: v.y + ((e.clientY - r.top) / r.height) * v.h })
  }

  const xs = Array.from({ length: CITY.w / GRID + 1 }, (_, i) => i * GRID)
  const ys = Array.from({ length: CITY.h / GRID + 1 }, (_, i) => i * GRID)
  const fs = 11 * u

  return (
    <div ref={ref} className={`relative h-full w-full overflow-hidden ${className}`} style={{ background: C.bg }}>
      <svg viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" onClick={tap} role="img" aria-label="خريطة">
        <rect x={-600} y={-600} width={CITY.w + 1200} height={CITY.h + 1200} fill={C.bg} />
        {/* blocks */}
        {xs.slice(0, -1).map((x, i) =>
          ys.slice(0, -1).map((y, j) => (
            <rect key={`${i}-${j}`} x={x + 9} y={y + 9} width={GRID - 18} height={GRID - 18} rx={6} fill={(i * 3 + j * 5) % 11 === 2 ? C.park : C.block} />
          )),
        )}
        {/* Wadi Hanifa */}
        <path d="M-80 700 C 40 760, 20 900, 60 1000 S 20 1260, 90 1480" fill="none" stroke={C.wadi} strokeWidth={34} strokeLinecap="round" />
        {/* minor roads */}
        {xs.map((x) => (
          <line key={`v${x}`} x1={x} y1={-40} x2={x} y2={CITY.h + 40} stroke={C.road} strokeWidth={7} />
        ))}
        {ys.map((y) => (
          <line key={`h${y}`} x1={-40} y1={y} x2={CITY.w + 40} y2={y} stroke={C.road} strokeWidth={7} />
        ))}
        {/* major roads */}
        {MAJOR_V.map((r) => (
          <g key={r.name}>
            <line x1={r.x} y1={-40} x2={r.x} y2={CITY.h + 40} stroke={C.edge} strokeWidth={17} />
            <line x1={r.x} y1={-40} x2={r.x} y2={CITY.h + 40} stroke={C.major} strokeWidth={14} />
          </g>
        ))}
        {MAJOR_H.map((r) => (
          <g key={r.name}>
            <line x1={-40} y1={r.y} x2={CITY.w + 40} y2={r.y} stroke={C.edge} strokeWidth={17} />
            <line x1={-40} y1={r.y} x2={CITY.w + 40} y2={r.y} stroke={C.major} strokeWidth={14} />
          </g>
        ))}
        {/* labels */}
        <g fill={C.label} fontSize={fs * 0.95} fontWeight={500} style={{ pointerEvents: 'none' }}>
          {DISTRICTS.map((d) => (
            <text key={d.name} x={d.p.x} y={d.p.y} textAnchor="middle" fontSize={fs * 1.05} fontWeight={600} opacity={0.55} letterSpacing={0}>
              {d.name}
            </text>
          ))}
          {MAJOR_H.map((r) => (
            <text key={r.name} x={350} y={r.y - 12} textAnchor="middle" opacity={0.75}>
              {r.name}
            </text>
          ))}
          {MAJOR_V.map((r) => (
            <text key={r.name} transform={`translate(${r.x - 12} 650) rotate(-90)`} textAnchor="middle" opacity={0.75}>
              {r.name}
            </text>
          ))}
        </g>
        {pois &&
          PLACES.filter((p) => !['home', 'work', 'district'].includes(p.kind)).map((p) => (
            <g key={p.id} transform={`translate(${p.p.x} ${p.p.y})`} style={{ pointerEvents: 'none' }}>
              <circle r={5 * u} fill={dark ? '#4b4d48' : '#b9b9b2'} />
              <circle r={2 * u} fill={dark ? '#141514' : '#fff'} />
              <text x={-8 * u} y={4 * u} fontSize={fs * 0.9} fill={C.label} textAnchor="start" direction="rtl">
                {p.name}
              </text>
            </g>
          ))}

        {/* demand heat (admin) */}
        {heat?.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={70} fill="#ff6b2c" opacity={0.12} />)}

        {/* approach route (driver → pickup) */}
        {approach && approach.length > 1 && (
          <path d={toD(approach)} fill="none" stroke={dark ? '#c8f31d' : '#2f5bff'} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round" className="route-dash" style={{ strokeDasharray: `${8 * u} ${7 * u}` }} />
        )}
        {/* trip route */}
        {route && route.length > 1 && (
          <g>
            <path d={toD(route)} fill="none" stroke={C.route} strokeOpacity={0.18} strokeWidth={13 * u} strokeLinecap="round" strokeLinejoin="round" />
            <path d={toD(route)} fill="none" stroke={C.route} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {user && (
          <g transform={`translate(${user.x} ${user.y})`}>
            <circle r={9 * u} fill="#2f5bff" className="pulse-ring" />
            <circle r={9 * u} fill="#fff" />
            <circle r={6 * u} fill="#2f5bff" />
          </g>
        )}

        {pickup && <Pin p={pickup.p} u={u} kind="pickup" label={pickup.label} sub={pickup.sub} dark={dark} />}
        {dropoff && <Pin p={dropoff.p} u={u} kind="dropoff" label={dropoff.label} sub={dropoff.sub} dark={dark} />}

        {cars.map((c) => (
          <g key={c.id} className="car-move" style={{ transform: `translate(${c.p.x}px, ${c.p.y}px)` }} opacity={c.dim ? 0.55 : 1}>
            <g transform={`rotate(${c.a + 90}) scale(${u * (c.focus ? 1.25 : 1)})`}>
              {c.focus && <circle r={20} fill={dark ? '#c8f31d' : '#0a0a0a'} opacity={0.12} />}
              {c.moto ? (
                <g>
                  <ellipse cx={0} cy={1} rx={5} ry={11} fill="rgba(0,0,0,.25)" />
                  <rect x={-3.5} y={-10} width={7} height={20} rx={3.5} fill={c.color ?? '#111'} stroke="#0a0a0a" strokeOpacity={0.4} />
                  <circle cx={0} cy={-2} r={3} fill="#0a0a0a" />
                </g>
              ) : (
                <g>
                  <ellipse cx={0} cy={2} rx={9.5} ry={14} fill="rgba(0,0,0,.22)" />
                  <rect x={-8} y={-14} width={16} height={28} rx={6} fill={c.color ?? '#111'} stroke="#0a0a0a" strokeOpacity={0.45} strokeWidth={1} />
                  <rect x={-6} y={-8} width={12} height={6} rx={2} fill="#0a0a0a" opacity={0.78} />
                  <rect x={-6} y={5} width={12} height={4} rx={1.5} fill="#0a0a0a" opacity={0.55} />
                </g>
              )}
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}

function Pin({ p, u, kind, label, sub, dark }: { p: Point; u: number; kind: 'pickup' | 'dropoff'; label?: string; sub?: string; dark: boolean }) {
  const fs = 11.5 * u
  const textW = label ? Math.min(190, Math.max(label.length, (sub ?? '').length * 0.85) * 6.6 + 26) * u : 0
  const h = (sub ? 38 : 26) * u
  const bx = p.x - textW / 2
  const by = p.y - h - 16 * u
  return (
    <g>
      {kind === 'pickup' ? (
        <g transform={`translate(${p.x} ${p.y})`}>
          <circle r={9 * u} fill="#0a0a0a" />
          <circle r={3.6 * u} fill="#fff" />
        </g>
      ) : (
        <g transform={`translate(${p.x} ${p.y})`}>
          <rect x={-8.5 * u} y={-8.5 * u} width={17 * u} height={17 * u} rx={2 * u} fill="#0a0a0a" />
          <rect x={-3.5 * u} y={-3.5 * u} width={7 * u} height={7 * u} fill="#fff" />
        </g>
      )}
      {label && (
        <g style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.18))' }}>
          <rect x={bx} y={by} width={textW} height={h} rx={8 * u} fill={dark ? '#ffffff' : '#ffffff'} />
          <text x={bx + textW - 10 * u} y={by + (sub ? 16 : 17) * u} fontSize={fs} fontWeight={700} fill="#0a0a0a" direction="rtl" textAnchor="start">
            {label}
          </text>
          {sub && (
            <text x={bx + textW - 10 * u} y={by + 30 * u} fontSize={fs * 0.82} fill="#6b6b66" direction="rtl" textAnchor="start">
              {sub}
            </text>
          )}
        </g>
      )}
    </g>
  )
}

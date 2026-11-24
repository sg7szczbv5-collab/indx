/**
 * AURA CityMap: an offline, vector map of Riyadh drawn in the brand's map language
 * (Road Gray blocks, white streets, green route, circle = pickup, square = destination).
 *
 * Works with no API key. All inputs are real lat/lng, so swapping in a commercial map SDK
 * (Mapbox GL / Google Maps) only replaces this component, not the apps.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { DISTRICTS, PARKS, RIYADH_BOUNDS, ROADS } from '../core/geo'
import type { LatLng } from '../core/types'
import { MARK_PATH } from '../ds/logoPaths'
import { useI18n } from '../i18n/I18n'
import { cx } from '../ds/ui'

const LAT0 = (RIYADH_BOUNDS.minLat + RIYADH_BOUNDS.maxLat) / 2
const KY = 111.32
const KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180)
const WORLD_W = (RIYADH_BOUNDS.maxLng - RIYADH_BOUNDS.minLng) * KX
const WORLD_H = (RIYADH_BOUNDS.maxLat - RIYADH_BOUNDS.minLat) * KY

export const project = (p: LatLng) => ({ x: (p.lng - RIYADH_BOUNDS.minLng) * KX, y: (RIYADH_BOUNDS.maxLat - p.lat) * KY })
export const unproject = (x: number, y: number): LatLng => ({ lat: RIYADH_BOUNDS.maxLat - y / KY, lng: RIYADH_BOUNDS.minLng + x / KX })

export type MapMarker = {
  id: string
  pos: LatLng
  kind: 'car' | 'pickup' | 'dropoff' | 'pin' | 'me' | 'dot' | 'cluster'
  heading?: number
  tone?: 'ink' | 'go' | 'mute' | 'white' | 'danger'
  label?: string
  sub?: string
  active?: boolean
  pulse?: boolean
  onClick?: () => void
}
export type MapRoute = { id: string; pts: LatLng[]; tone?: 'go' | 'ink' | 'mute'; dashed?: boolean; width?: number }
export type MapZone = { id: string; center: LatLng; radiusKm: number; kind: 'service' | 'restricted' | 'high_demand' | 'airport'; label?: string; active?: boolean; selected?: boolean; onClick?: () => void }

type View = { cx: number; cy: number; z: number } // z = px per km

export type CityMapProps = {
  theme?: 'light' | 'dark'
  markers?: MapMarker[]
  routes?: MapRoute[]
  zones?: MapZone[]
  heat?: LatLng[]
  /** Fit these points in view (re-fits whenever `fitKey` changes). */
  fit?: LatLng[]
  fitKey?: string
  /** Pixel padding when fitting: [top, right, bottom, left]. */
  padding?: [number, number, number, number]
  center?: LatLng
  zoom?: number
  interactive?: boolean
  controls?: boolean
  labels?: boolean
  onPick?: (p: LatLng) => void
  /** Reports the geographic centre while the user pans (for "move map to set pickup"). */
  onCenterChange?: (p: LatLng) => void
  className?: string
  children?: ReactNode
  minZoom?: number
  maxZoom?: number
}

const MINOR_STEP = 0.85 // km between local streets

export function CityMap({
  theme = 'light',
  markers = [],
  routes = [],
  zones = [],
  heat,
  fit,
  fitKey,
  padding = [80, 40, 120, 40],
  center,
  zoom = 70,
  interactive = true,
  controls = false,
  labels = true,
  onPick,
  onCenterChange,
  className,
  children,
  minZoom = 9,
  maxZoom = 260,
}: CityMapProps) {
  const { lang, t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 390, h: 600 })
  const initial = center ? project(center) : project({ lat: 24.73, lng: 46.67 })
  const [view, setView] = useState<View>({ cx: initial.x, cy: initial.y, z: zoom })
  const viewRef = useRef(view)
  viewRef.current = view
  const anim = useRef<number>(0)
  const dark = theme === 'dark'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const animateTo = useCallback((target: View, ms = 650) => {
    cancelAnimationFrame(anim.current)
    const from = { ...viewRef.current }
    const t0 = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setView({ cx: from.cx + (target.cx - from.cx) * e, cy: from.cy + (target.cy - from.cy) * e, z: from.z * Math.pow(target.z / from.z, e) })
      if (k < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }, [])

  // Fit to points
  const fitSig = fitKey ?? (fit ? fit.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|') : '')
  useEffect(() => {
    if (!fit || !fit.length || size.w < 10) return
    const pts = fit.map(project)
    const minX = Math.min(...pts.map((p) => p.x))
    const maxX = Math.max(...pts.map((p) => p.x))
    const minY = Math.min(...pts.map((p) => p.y))
    const maxY = Math.max(...pts.map((p) => p.y))
    const [pt, pr, pb, pl] = padding
    const availW = Math.max(60, size.w - pl - pr)
    const availH = Math.max(60, size.h - pt - pb)
    const z = Math.min(maxZoom * 0.6, Math.max(minZoom, Math.min(availW / Math.max(0.6, maxX - minX), availH / Math.max(0.6, maxY - minY))))
    // centre of the padded box, converted back to world units
    const cx = (minX + maxX) / 2 - (pl - pr) / 2 / z
    const cy = (minY + maxY) / 2 - (pt - pb) / 2 / z
    animateTo({ cx, cy, z })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSig, size.w, size.h])

  useEffect(() => {
    if (!center || fit) return
    const p = project(center)
    animateTo({ cx: p.x, cy: p.y, z: zoom })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, zoom])

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  // Interaction: drag to pan, wheel to zoom, click to pick
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean; id: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return
    cancelAnimationFrame(anim.current)
    drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false, id: e.pointerId }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) > 4) {
      d.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(d.id)
    }
    if (d.moved) {
      const rtlFix = 1
      setView((v) => clampView({ ...v, cx: d.cx - (dx * rtlFix) / v.z, cy: d.cy - dy / v.z }, size))
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved) {
      onCenterChange?.(unproject(viewRef.current.cx, viewRef.current.cy))
    } else if (onPick && ref.current) {
      const r = ref.current.getBoundingClientRect()
      const x = view.cx + (e.clientX - r.left - size.w / 2) / view.z
      const y = view.cy + (e.clientY - r.top - size.h / 2) / view.z
      onPick(unproject(x, y))
    }
  }
  const zoomBy = (f: number) => {
    const v = viewRef.current
    animateTo({ ...v, z: Math.min(maxZoom, Math.max(minZoom, v.z * f)) }, 260)
  }
  useEffect(() => {
    const el = ref.current
    if (!el || !interactive) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const v = viewRef.current
      const f = Math.exp(-e.deltaY * 0.0015)
      const z = Math.min(maxZoom, Math.max(minZoom, v.z * f))
      const mx = e.clientX - r.left - r.width / 2
      const my = e.clientY - r.top - r.height / 2
      // keep the point under the cursor fixed
      const wx = v.cx + mx / v.z
      const wy = v.cy + my / v.z
      setView({ cx: wx - mx / z, cy: wy - my / z, z })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [interactive, minZoom, maxZoom])

  const k = 1 / view.z // world units per pixel
  const vb = `${view.cx - size.w / 2 / view.z} ${view.cy - size.h / 2 / view.z} ${size.w / view.z} ${size.h / view.z}`

  const palette = dark
    ? { bg: '#141517', block: '#1b1d20', minor: '#24272b', major: '#30343a', majorEdge: '#141517', park: '#1d2a17', label: 'rgba(255,255,255,0.38)', road: 'rgba(255,255,255,0.32)' }
    : { bg: '#E9EAE7', block: '#EDEEEB', minor: '#FFFFFF', major: '#FFFFFF', majorEdge: '#DCDDD9', park: '#DCE9CF', label: 'rgba(16,17,18,0.42)', road: 'rgba(16,17,18,0.38)' }

  const base = useMemo(() => {
    const minor: string[] = []
    for (let x = 0; x <= WORLD_W; x += MINOR_STEP) minor.push(`M${x.toFixed(2)} 0V${WORLD_H.toFixed(2)}`)
    for (let y = 0; y <= WORLD_H; y += MINOR_STEP) minor.push(`M0 ${y.toFixed(2)}H${WORLD_W.toFixed(2)}`)
    const roads = ROADS.map((r) => ({ ...r, d: r.pts.map(([lat, lng], i) => { const p = project({ lat, lng }); return `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}` }).join('') }))
    const parks = PARKS.map((p) => {
      const a = project({ lat: p.pos.lat + p.h / 2, lng: p.pos.lng - p.w / 2 })
      return { x: a.x, y: a.y, w: p.w * KX, h: p.h * KY }
    })
    return { minor: minor.join(''), roads, parks }
  }, [])

  const showMinor = view.z > 22
  const showDistricts = labels && view.z > 16 && view.z < 160
  const showRoadNames = labels && view.z > 40

  return (
    <div
      ref={ref}
      className={cx('relative h-full w-full touch-none select-none overflow-hidden', interactive && 'cursor-grab active:cursor-grabbing', className)}
      style={{ background: palette.bg }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      dir="ltr"
    >
      <svg width="100%" height="100%" viewBox={vb} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 block">
        <defs>
          <filter id={`heat-${theme}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={0.6} />
          </filter>
        </defs>
        <rect x={-50} y={-50} width={WORLD_W + 100} height={WORLD_H + 100} fill={palette.bg} />
        <rect x={0} y={0} width={WORLD_W} height={WORLD_H} fill={palette.block} />
        {base.parks.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={0.15} fill={palette.park} />
        ))}
        {showMinor && <path d={base.minor} stroke={palette.minor} strokeWidth={Math.max(0.04, 3 * k)} fill="none" opacity={dark ? 1 : 0.95} />}
        {base.roads.map((r) => (
          <g key={r.id}>
            <path d={r.d} stroke={palette.majorEdge} strokeWidth={(r.tier === 1 ? 11 : 8) * k + 0.05} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={r.d} stroke={palette.major} strokeWidth={(r.tier === 1 ? 9 : 6) * k + 0.05} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}

        {/* zones */}
        {zones.map((z) => {
          const c = project(z.center)
          const col = z.kind === 'restricted' ? '#D64541' : z.kind === 'high_demand' ? '#78B83F' : z.kind === 'airport' ? (dark ? '#ffffff' : '#101112') : dark ? '#ffffff' : '#101112'
          return (
            <g key={z.id} onClick={z.onClick} style={{ cursor: z.onClick ? 'pointer' : undefined }} opacity={z.active === false ? 0.35 : 1}>
              <circle
                cx={c.x}
                cy={c.y}
                r={z.radiusKm}
                fill={col}
                fillOpacity={z.kind === 'service' ? 0.025 : z.kind === 'restricted' ? 0.1 : 0.14}
                stroke={col}
                strokeOpacity={z.selected ? 0.95 : 0.55}
                strokeWidth={(z.selected ? 3 : 1.5) * k}
                strokeDasharray={z.kind === 'service' || z.kind === 'restricted' ? `${6 * k} ${5 * k}` : undefined}
              />
              {z.kind === 'restricted' && <path d={`M${c.x - z.radiusKm * 0.5} ${c.y - z.radiusKm * 0.5}L${c.x + z.radiusKm * 0.5} ${c.y + z.radiusKm * 0.5}`} stroke={col} strokeOpacity={0.5} strokeWidth={2 * k} />}
              {z.label && labels && (
                <text x={c.x} y={c.y - z.radiusKm - 6 * k} textAnchor="middle" fontSize={11 * k} fontWeight={600} fill={col} fontFamily="IBM Plex Sans Arabic, sans-serif">
                  {z.label}
                </text>
              )}
            </g>
          )
        })}

        {/* demand heat */}
        {heat && (
          <g filter={`url(#heat-${theme})`}>
            {heat.map((p, i) => {
              const c = project(p)
              return <circle key={i} cx={c.x} cy={c.y} r={0.9} fill="#78B83F" opacity={dark ? 0.16 : 0.2} />
            })}
          </g>
        )}

        {showDistricts &&
          DISTRICTS.map((d) => {
            const c = project(d.pos)
            return (
              <text key={d.name.en} x={c.x} y={c.y} textAnchor="middle" fontSize={11 * k} fontWeight={500} fill={palette.label} fontFamily="IBM Plex Sans Arabic, sans-serif" style={{ letterSpacing: lang === 'en' ? `${0.6 * k}px` : undefined }}>
                {lang === 'en' ? d.name.en.toUpperCase() : d.name.ar}
              </text>
            )
          })}
        {showRoadNames &&
          base.roads
            .filter((r) => r.tier === 1)
            .map((r) => {
              const [lat, lng] = r.pts[Math.floor(r.pts.length / 2)]
              const c = project({ lat, lng })
              return (
                <text key={r.id} x={c.x} y={c.y - 8 * k} textAnchor="middle" fontSize={9 * k} fill={palette.road} fontFamily="IBM Plex Sans Arabic, sans-serif">
                  {r.name[lang]}
                </text>
              )
            })}

        {/* routes */}
        {routes.map((r) => {
          const d = r.pts.map((p, i) => { const c = project(p); return `${i ? 'L' : 'M'}${c.x.toFixed(3)} ${c.y.toFixed(3)}` }).join('')
          const col = r.tone === 'ink' ? (dark ? '#ffffff' : '#101112') : r.tone === 'mute' ? (dark ? 'rgba(255,255,255,.35)' : 'rgba(16,17,18,.35)') : '#78B83F'
          const w = (r.width ?? 5) * k
          return (
            <g key={r.id}>
              {!r.dashed && <path d={d} stroke={dark ? '#0b0c0d' : '#ffffff'} strokeWidth={w + 4 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />}
              <path d={d} stroke={col} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.dashed ? `${0.1 * k} ${9 * k}` : undefined} />
            </g>
          )
        })}

        {/* markers */}
        {markers.map((m) => (
          <MarkerGlyph key={m.id} m={m} k={k} dark={dark} />
        ))}
      </svg>

      {children}

      {controls && (
        <div className="absolute end-3 bottom-3 z-10 flex flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <MapBtn dark={dark} label={t('تكبير', 'Zoom in')} onClick={() => zoomBy(1.5)}>
            <Plus size={18} />
          </MapBtn>
          <MapBtn dark={dark} label={t('تصغير', 'Zoom out')} onClick={() => zoomBy(1 / 1.5)}>
            <Minus size={18} />
          </MapBtn>
          {fit && (
            <MapBtn
              dark={dark}
              label={t('إعادة التوسيط', 'Recenter')}
              onClick={() => {
                setView((v) => ({ ...v, z: v.z * 1.0001 }))
                const pts = fit.map(project)
                const cx0 = (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2
                const cy0 = (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2
                animateTo({ cx: cx0, cy: cy0, z: viewRef.current.z })
              }}
            >
              <LocateFixed size={18} />
            </MapBtn>
          )}
        </div>
      )}
    </div>
  )
}

function clampView(v: View, size: { w: number; h: number }): View {
  const hw = size.w / 2 / v.z
  const hh = size.h / 2 / v.z
  return { ...v, cx: Math.min(WORLD_W + hw * 0.5, Math.max(-hw * 0.5, v.cx)), cy: Math.min(WORLD_H + hh * 0.5, Math.max(-hh * 0.5, v.cy)) }
}

function MapBtn({ children, onClick, label, dark }: { children: ReactNode; onClick: () => void; label: string; dark: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cx('flex size-10 items-center justify-center rounded-xl shadow-md transition active:scale-95', dark ? 'bg-ink-3 text-white' : 'bg-white text-ink')}>
      {children}
    </button>
  )
}

function MarkerGlyph({ m, k, dark }: { m: MapMarker; k: number; dark: boolean }) {
  const c = project(m.pos)
  const ink = dark ? '#ffffff' : '#101112'
  const paper = dark ? '#101112' : '#ffffff'
  const s = k // 1 px in world units
  const click = m.onClick ? { onClick: (e: React.MouseEvent) => { e.stopPropagation(); m.onClick!() }, onPointerUp: (e: React.PointerEvent) => e.stopPropagation(), style: { cursor: 'pointer' } } : {}
  const label = m.label ? <MarkerLabel x={c.x} y={c.y} k={k} text={m.label} sub={m.sub} dark={dark} /> : null

  if (m.kind === 'car') {
    const col = m.tone === 'go' ? '#78B83F' : m.tone === 'mute' ? (dark ? '#5b5f63' : '#9b9ea1') : m.tone === 'white' ? '#ffffff' : ink
    const sc = m.active ? 1.3 : 1
    return (
      <g {...click}>
        {m.active && <circle cx={c.x} cy={c.y} r={20 * s} fill="#78B83F" opacity={0.18} />}
        <g transform={`translate(${c.x} ${c.y}) rotate(${m.heading ?? 0}) scale(${s * sc})`}>
          <rect x={-6.5} y={-11} width={13} height={22} rx={4.5} fill={col} stroke={paper} strokeWidth={1.6} />
          <rect x={-4.6} y={-6.5} width={9.2} height={5} rx={1.6} fill={paper} opacity={0.85} />
          <rect x={-4.6} y={4} width={9.2} height={3} rx={1.2} fill={paper} opacity={0.6} />
        </g>
        {label}
      </g>
    )
  }
  if (m.kind === 'pickup') {
    return (
      <g {...click}>
        {m.pulse && (
          <>
            <circle cx={c.x} cy={c.y} r={28 * s} fill="#78B83F" className="aura-pulse" opacity={0.35} />
            <circle cx={c.x} cy={c.y} r={28 * s} fill="#78B83F" className="aura-pulse aura-pulse-2" opacity={0.35} />
          </>
        )}
        <circle cx={c.x} cy={c.y} r={10 * s} fill={paper} />
        <circle cx={c.x} cy={c.y} r={7 * s} fill={ink} />
        {label}
      </g>
    )
  }
  if (m.kind === 'dropoff') {
    return (
      <g {...click}>
        <rect x={c.x - 11 * s} y={c.y - 11 * s} width={22 * s} height={22 * s} rx={5 * s} fill={ink} stroke={paper} strokeWidth={2 * s} />
        <g transform={`translate(${c.x - 6.5 * s} ${c.y - 5 * s}) scale(${(13 * s) / 175.8})`}>
          <path d={MARK_PATH} fill={paper} fillRule="evenodd" />
        </g>
        {label}
      </g>
    )
  }
  if (m.kind === 'pin') {
    return (
      <g {...click}>
        <ellipse cx={c.x} cy={c.y} rx={5 * s} ry={2 * s} fill="#101112" opacity={0.25} />
        <rect x={c.x - 1.2 * s} y={c.y - 22 * s} width={2.4 * s} height={22 * s} rx={1.2 * s} fill={ink} />
        <circle cx={c.x} cy={c.y - 32 * s} r={16 * s} fill={ink} />
        <g transform={`translate(${c.x - 8 * s} ${c.y - 38 * s}) scale(${(16 * s) / 175.8})`}>
          <path d={MARK_PATH} fill={paper} fillRule="evenodd" />
        </g>
        {label}
      </g>
    )
  }
  if (m.kind === 'me') {
    return (
      <g>
        {m.pulse !== false && <circle cx={c.x} cy={c.y} r={22 * s} fill="#78B83F" className="aura-pulse" opacity={0.3} />}
        <circle cx={c.x} cy={c.y} r={11 * s} fill="#ffffff" />
        <circle cx={c.x} cy={c.y} r={7.5 * s} fill="#78B83F" />
        {label}
      </g>
    )
  }
  if (m.kind === 'cluster') {
    return (
      <g {...click}>
        <circle cx={c.x} cy={c.y} r={14 * s} fill={ink} />
        <text x={c.x} y={c.y + 4 * s} textAnchor="middle" fontSize={11 * s} fontWeight={700} fill={paper}>
          {m.label}
        </text>
      </g>
    )
  }
  const col = m.tone === 'go' ? '#78B83F' : m.tone === 'danger' ? '#D64541' : m.tone === 'mute' ? '#9b9ea1' : ink
  return (
    <g {...click}>
      {m.pulse && <circle cx={c.x} cy={c.y} r={14 * s} fill={col} className="aura-pulse" opacity={0.4} />}
      <circle cx={c.x} cy={c.y} r={(m.active ? 7 : 5) * s} fill={col} stroke={paper} strokeWidth={2 * s} />
      {label}
    </g>
  )
}

function MarkerLabel({ x, y, k, text, sub, dark }: { x: number; y: number; k: number; text: string; sub?: string; dark: boolean }) {
  const w = Math.max(text.length * 6.4, (sub?.length ?? 0) * 5.6) + 20
  const h = sub ? 34 : 24
  return (
    <g transform={`translate(${x} ${y - 20 * k}) scale(${k})`} style={{ pointerEvents: 'none' }}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={8} fill={dark ? '#ffffff' : '#101112'} />
      <text x={0} y={sub ? -h + 14 : -8} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={dark ? '#101112' : '#ffffff'} fontFamily="IBM Plex Sans Arabic, sans-serif">
        {text}
      </text>
      {sub && (
        <text x={0} y={-7} textAnchor="middle" fontSize={9.5} fill={dark ? '#101112' : '#ffffff'} opacity={0.65} fontFamily="IBM Plex Sans Arabic, sans-serif">
          {sub}
        </text>
      )}
    </g>
  )
}

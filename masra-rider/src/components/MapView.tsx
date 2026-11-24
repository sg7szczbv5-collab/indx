import { memo, useMemo } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg'
import { colors, fonts } from '@/theme'
import { useLoopClock } from '@/hooks/useProgress'

/**
 * Offline vector map (no tiles, no API keys) in a 320×668 coordinate space.
 * For production, replace this component with react-native-maps behind the same props.
 */
type Pt = { x: number; y: number }
export const PICKUP: Pt = { x: 110, y: 470 }
export const DROPOFF: Pt = { x: 260, y: 150 }
const TRIP_PTS: Pt[] = [PICKUP, { x: 110, y: 340 }, { x: 190, y: 340 }, { x: 190, y: 230 }, { x: 260, y: 230 }, DROPOFF]
const APPROACH_PTS: Pt[] = [{ x: 40, y: 640 }, { x: 40, y: 560 }, { x: 110, y: 560 }, PICKUP]
const NEARBY: Pt[][] = [
  [{ x: 40, y: -20 }, { x: 40, y: 700 }],
  [{ x: -20, y: 230 }, { x: 292, y: 230 }],
  [{ x: 190, y: 700 }, { x: 190, y: -20 }],
  [{ x: 292, y: 560 }, { x: -20, y: 560 }],
  [{ x: 260, y: -20 }, { x: 260, y: 700 }],
]

const V_ROADS = [40, 110, 190, 260]
const H_ROADS = [120, 230, 340, 450, 560]
const STREETS_H = [
  { y: 120, name: 'شارع الأمير محمد' },
  { y: 230, name: 'طريق الملك سعود' },
  { y: 340, name: 'شارع الخليج' },
  { y: 560, name: 'طريق الأمير نايف' },
]
const POIS = [
  { x: 150, y: 400, t: 'مسجد الحي' },
  { x: 228, y: 290, t: 'حديقة الشاطئ' },
  { x: 74, y: 190, t: 'مركز تجاري' },
]

const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')

/** Position and heading at fraction t (0..1) along a polyline. */
export function pointAt(pts: Pt[], t: number) {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y))
  const total = segs.reduce((a, b) => a + b, 0)
  let d = Math.min(Math.max(t, 0), 1) * total
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const a = pts[i]
      const b = pts[i + 1]
      const k = segs[i] ? Math.min(d / segs[i], 1) : 0
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
    }
    d -= segs[i]
  }
  return { x: pts[0].x, y: pts[0].y, angle: 0 }
}

function Car({ x, y, angle, scale = 1 }: { x: number; y: number; angle: number; scale?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle + 90}) scale(${scale})`}>
      <Ellipse cx={0} cy={2} rx={9} ry={13} fill="rgba(0,0,0,0.22)" />
      <Rect x={-7.5} y={-13} width={15} height={26} rx={5.5} fill="#FFFFFF" stroke="rgba(11,13,12,0.35)" strokeWidth={1} />
      <Rect x={-5.5} y={-7.5} width={11} height={6} rx={2} fill="rgba(11,13,12,0.8)" />
      <Rect x={-5.5} y={4.5} width={11} height={4} rx={1.5} fill="rgba(11,13,12,0.55)" />
    </G>
  )
}

/** Label next to a point: name, optional subtitle and a black ETA box. */
function Tag({ at, text, sub, eta, side = 'right' }: { at: Pt; text: string; sub?: string; eta?: string; side?: 'right' | 'left' }) {
  const w = Math.max(text.length, (sub ?? '').length) * 5.3 + 22 + (eta ? 30 : 0)
  const h = sub ? 32 : 22
  const left = side === 'right' ? at.x + 14 : at.x - 14 - w
  const top = at.y - h / 2
  return (
    <G>
      <Rect x={left} y={top} width={w} height={h} rx={6} fill="#FFFFFF" stroke="rgba(0,0,0,0.06)" />
      {eta ? (
        <G>
          <Rect x={left} y={top} width={28} height={h} rx={6} fill={colors.ink} />
          <SvgText x={left + 14} y={top + (sub ? 15 : 14.5)} textAnchor="middle" fontSize={10.5} fontFamily={fonts.bold} fill="#FFFFFF">{eta}</SvgText>
          {sub ? <SvgText x={left + 14} y={top + 26} textAnchor="middle" fontSize={7} fontFamily={fonts.regular} fill="rgba(255,255,255,0.7)">دقيقة</SvgText> : null}
        </G>
      ) : null}
      <SvgText x={left + (eta ? 28 : 0) + (w - (eta ? 28 : 0)) / 2} y={top + (sub ? 13.5 : 14.5)} textAnchor="middle" fontSize={9.5} fontFamily={fonts.semibold} fill={colors.ink}>{text}</SvgText>
      {sub ? <SvgText x={left + (eta ? 28 : 0) + (w - (eta ? 28 : 0)) / 2} y={top + 25.5} textAnchor="middle" fontSize={8} fontFamily={fonts.regular} fill="rgba(11,13,12,0.55)">{sub}</SvgText> : null}
    </G>
  )
}

export type MapViewProps = {
  mode?: 'idle' | 'preview' | 'approach' | 'trip'
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
  pickupBubble?: string
  /** Camera: which part of the 320×668 map to frame. */
  view?: { y: number; h: number; w?: number }
  style?: StyleProp<ViewStyle>
}

function MapViewInner({
  mode = 'idle',
  progress = 0,
  showUser = true,
  showNearby = true,
  showPickup = false,
  showDropoff = false,
  routeColor = colors.ink,
  pickupLabel,
  pickupSub,
  pickupEta,
  dropoffLabel,
  pickupBubble,
  view,
  style,
}: MapViewProps) {
  const clock = useLoopClock(showNearby)
  const car = useMemo(() => (mode === 'approach' ? pointAt(APPROACH_PTS, progress) : mode === 'trip' ? pointAt(TRIP_PTS, progress) : null), [mode, progress])
  const vb = view ? `${(320 - (view.w ?? 320)) / 2} ${view.y} ${view.w ?? 320} ${view.h}` : '0 0 320 668'
  const userAt = pickupBubble ? { x: PICKUP.x - 34, y: PICKUP.y + 50 } : PICKUP

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={vb} preserveAspectRatio="xMidYMid slice">
        <Rect x={-100} y={-200} width={520} height={1068} fill="#ECEEED" />
        {V_ROADS.slice(0, -1).map((x, i) =>
          H_ROADS.slice(0, -1).map((y, j) => (
            <Rect key={`${i}-${j}`} x={x + 7} y={y + 7} width={V_ROADS[i + 1] - x - 14} height={H_ROADS[j + 1] - y - 14} rx={4} fill={(i + j) % 4 === 1 ? '#D6EAD9' : '#E4E7E5'} />
          )),
        )}
        <Path d="M292 -200 C 284 90, 300 160, 288 250 S 296 420, 284 520 S 296 620, 290 868 L420 868 L420 -200 Z" fill="#C9DFE8" />
        {[75, 150, 225].map((x) => (
          <Line key={x} x1={x} y1={-200} x2={x} y2={868} stroke="#F7F8F7" strokeWidth={3} />
        ))}
        {[175, 285, 395, 505, 615].map((y) => (
          <Line key={y} x1={-100} y1={y} x2={290} y2={y} stroke="#F7F8F7" strokeWidth={3} />
        ))}
        {V_ROADS.map((x) => (
          <G key={x}>
            <Line x1={x} y1={-200} x2={x} y2={868} stroke="#D9DCDA" strokeWidth={10} />
            <Line x1={x} y1={-200} x2={x} y2={868} stroke="#FFFFFF" strokeWidth={7.5} />
          </G>
        ))}
        {H_ROADS.map((y) => (
          <G key={y}>
            <Line x1={-100} y1={y} x2={292} y2={y} stroke="#D9DCDA" strokeWidth={10} />
            <Line x1={-100} y1={y} x2={292} y2={y} stroke="#FFFFFF" strokeWidth={7.5} />
          </G>
        ))}
        <Path d="M-60 430 C 80 400, 150 300, 360 20" fill="none" stroke="#F6E6B8" strokeWidth={11} />
        <Path d="M-60 430 C 80 400, 150 300, 360 20" fill="none" stroke="#FDF3D6" strokeWidth={5} />

        {STREETS_H.map((s) => (
          <SvgText key={s.name} x={150} y={s.y - 7} textAnchor="middle" fontSize={7.5} fontFamily={fonts.medium} fill="rgba(11,13,12,0.42)">{s.name}</SvgText>
        ))}
        {POIS.map((p) => (
          <G key={p.t}>
            <Circle cx={p.x} cy={p.y} r={5} fill="#C4CAC6" />
            <Circle cx={p.x} cy={p.y} r={2} fill="#FFFFFF" />
            <SvgText x={p.x - 8 - p.t.length * 2.1} y={p.y + 3} textAnchor="middle" fontSize={7.5} fontFamily={fonts.regular} fill="rgba(11,13,12,0.45)">{p.t}</SvgText>
          </G>
        ))}

        {(mode === 'trip' || mode === 'preview') && (
          <G>
            <Path d={toPath(TRIP_PTS)} fill="none" stroke={routeColor} strokeOpacity={0.18} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
            <Path d={toPath(TRIP_PTS)} fill="none" stroke={routeColor} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </G>
        )}
        {mode === 'approach' && <Path d={toPath(APPROACH_PTS)} fill="none" stroke={routeColor} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" strokeLinejoin="round" />}

        {showNearby &&
          NEARBY.map((line, i) => {
            const t = ((clock / (14 + i * 3)) + i * 0.17) % 1
            const p = pointAt(line, t)
            return (
              <G key={i} transform={`translate(${p.x + (i % 2 ? 3 : -3)} ${p.y}) rotate(${p.angle})`}>
                <Rect x={-8} y={-5} width={16} height={10} rx={3.5} fill="#FFFFFF" stroke="rgba(11,13,12,0.35)" />
                <Rect x={1} y={-3.5} width={4} height={7} rx={1} fill="rgba(11,13,12,0.7)" />
              </G>
            )
          })}

        {pickupBubble ? <Path d={`M${userAt.x} ${userAt.y - 4} L${PICKUP.x} ${PICKUP.y + 6}`} stroke={colors.ink} strokeWidth={3} strokeDasharray="0.1 7" strokeLinecap="round" /> : null}

        {showPickup && (
          <G>
            <Circle cx={PICKUP.x} cy={PICKUP.y} r={10} fill={colors.ink} />
            <Circle cx={PICKUP.x} cy={PICKUP.y} r={4} fill="#FFFFFF" />
          </G>
        )}
        {showDropoff && (
          <G>
            <Rect x={DROPOFF.x - 9} y={DROPOFF.y - 9} width={18} height={18} rx={2} fill={colors.ink} />
            <Rect x={DROPOFF.x - 3.5} y={DROPOFF.y - 3.5} width={7} height={7} fill="#FFFFFF" />
          </G>
        )}
        {pickupLabel ? <Tag at={PICKUP} text={pickupLabel} sub={pickupSub} eta={pickupEta} /> : null}
        {dropoffLabel ? <Tag at={DROPOFF} text={dropoffLabel} side="left" /> : null}
        {pickupBubble ? (
          <G>
            <Rect x={PICKUP.x - 40} y={PICKUP.y - 44} width={80} height={24} rx={12} fill={colors.green} />
            <Polygon points={`${PICKUP.x - 5},${PICKUP.y - 21} ${PICKUP.x},${PICKUP.y - 15} ${PICKUP.x + 5},${PICKUP.y - 21}`} fill={colors.green} />
            <SvgText x={PICKUP.x} y={PICKUP.y - 28.5} textAnchor="middle" fontSize={9.5} fontFamily={fonts.bold} fill="#FFFFFF">{pickupBubble}</SvgText>
            <Circle cx={PICKUP.x} cy={PICKUP.y} r={7} fill={colors.green} stroke="#FFFFFF" strokeWidth={3} />
          </G>
        ) : null}

        {showUser && !showPickup && (
          <G>
            <Circle cx={userAt.x} cy={userAt.y} r={20} fill={colors.green3} opacity={0.14} />
            <Circle cx={userAt.x} cy={userAt.y} r={8} fill="#FFFFFF" />
            <Circle cx={userAt.x} cy={userAt.y} r={5.5} fill={colors.green3} />
          </G>
        )}

        {car && <Car x={car.x} y={car.y} angle={car.angle} />}
      </Svg>
    </View>
  )
}

export const MapView = memo(MapViewInner)

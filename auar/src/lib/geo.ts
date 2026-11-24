/**
 * Offline city model for the demo (no map tiles, no API keys).
 * The city is a 1000 × 1400 grid; roads run every 100 units in both directions.
 * 100 map units ≈ 2 km.
 */
export type Point = { x: number; y: number }

export const CITY = { w: 1000, h: 1400 }
export const GRID = 100
export const KM_PER_UNIT = 2 / GRID

export type PlaceKind = 'airport' | 'mall' | 'landmark' | 'uni' | 'hospital' | 'park' | 'home' | 'work' | 'district' | 'hotel'

export interface Place {
  id: string
  name: string
  sub: string
  p: Point
  kind: PlaceKind
}

/** Every place sits on a road (x or y is a multiple of 100) so routes can follow streets. */
export const PLACES: Place[] = [
  { id: 'home', name: 'المنزل', sub: 'حي الياسمين، شارع الثمامة', p: { x: 400, y: 340 }, kind: 'home' },
  { id: 'work', name: 'العمل', sub: 'مركز الملك عبدالله المالي', p: { x: 600, y: 760 }, kind: 'work' },
  { id: 'airport', name: 'مطار الملك خالد الدولي', sub: 'الصالة ٥ — المغادرة', p: { x: 900, y: 120 }, kind: 'airport' },
  { id: 'kingdom', name: 'برج المملكة', sub: 'طريق الملك فهد، العليا', p: { x: 500, y: 880 }, kind: 'landmark' },
  { id: 'faisaliah', name: 'برج الفيصلية', sub: 'العليا', p: { x: 500, y: 1040 }, kind: 'landmark' },
  { id: 'boulevard', name: 'بوليفارد رياض سيتي', sub: 'حطين', p: { x: 160, y: 600 }, kind: 'landmark' },
  { id: 'nakheel', name: 'النخيل مول', sub: 'طريق عثمان بن عفان', p: { x: 700, y: 480 }, kind: 'mall' },
  { id: 'hayat', name: 'حياة مول', sub: 'طريق الملك سلمان', p: { x: 620, y: 600 }, kind: 'mall' },
  { id: 'ksu', name: 'جامعة الملك سعود', sub: 'الدرعية', p: { x: 100, y: 940 }, kind: 'uni' },
  { id: 'murabba', name: 'قصر المربع', sub: 'المربع — وسط المدينة', p: { x: 540, y: 1300 }, kind: 'landmark' },
  { id: 'kfsh', name: 'مستشفى الملك فيصل التخصصي', sub: 'المعذر', p: { x: 300, y: 1160 }, kind: 'hospital' },
  { id: 'riyadhpark', name: 'الرياض بارك', sub: 'طريق الملك عبدالعزيز', p: { x: 760, y: 900 }, kind: 'mall' },
  { id: 'salam', name: 'حديقة السلام', sub: 'الملز', p: { x: 800, y: 1220 }, kind: 'park' },
  { id: 'diriyah', name: 'البجيري — الدرعية', sub: 'الدرعية التاريخية', p: { x: 0, y: 1040 }, kind: 'landmark' },
  { id: 'hotel', name: 'فندق الفيصلية', sub: 'شارع العليا العام', p: { x: 400, y: 1000 }, kind: 'hotel' },
  { id: 'malqa', name: 'الملقا', sub: 'حي الملقا', p: { x: 300, y: 200 }, kind: 'district' },
  { id: 'sahafa', name: 'الصحافة', sub: 'حي الصحافة', p: { x: 580, y: 300 }, kind: 'district' },
  { id: 'rabwa', name: 'الربوة', sub: 'حي الربوة', p: { x: 900, y: 1100 }, kind: 'district' },
]

export const placeById = (id: string) => PLACES.find((p) => p.id === id)

export const DISTRICTS: { name: string; p: Point }[] = [
  { name: 'الملقا', p: { x: 250, y: 250 } },
  { name: 'الياسمين', p: { x: 450, y: 250 } },
  { name: 'النرجس', p: { x: 650, y: 150 } },
  { name: 'حطين', p: { x: 150, y: 450 } },
  { name: 'الصحافة', p: { x: 550, y: 450 } },
  { name: 'النخيل', p: { x: 350, y: 650 } },
  { name: 'العقيق', p: { x: 750, y: 650 } },
  { name: 'العليا', p: { x: 450, y: 950 } },
  { name: 'الورود', p: { x: 650, y: 1050 } },
  { name: 'المعذر', p: { x: 250, y: 1150 } },
  { name: 'الملز', p: { x: 850, y: 1250 } },
  { name: 'المربع', p: { x: 450, y: 1350 } },
]

export const MAJOR_V: { x: number; name: string }[] = [
  { x: 200, name: 'طريق الأمير تركي' },
  { x: 500, name: 'طريق الملك فهد' },
  { x: 800, name: 'طريق الدائري الشرقي' },
]
export const MAJOR_H: { y: number; name: string }[] = [
  { y: 200, name: 'طريق أنس بن مالك' },
  { y: 500, name: 'طريق الملك عبدالله' },
  { y: 800, name: 'طريق العروبة' },
  { y: 1100, name: 'طريق مكة المكرمة' },
]

const snap = (v: number) => Math.round(v / GRID) * GRID
const onV = (p: Point) => p.x % GRID === 0
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** Snap any point to the nearest point on a road. */
export function snapToRoad(p: Point): Point {
  const x = clamp(p.x, 0, CITY.w)
  const y = clamp(p.y, 0, CITY.h)
  const dx = Math.abs(x - snap(x))
  const dy = Math.abs(y - snap(y))
  return dx < dy ? { x: snap(x), y } : { x, y: snap(y) }
}

/** The intersection to leave a point by, preferring the direction of the target. */
function exitIntersection(p: Point, toward: Point): Point {
  if (onV(p)) {
    const up = Math.floor(p.y / GRID) * GRID
    const down = Math.ceil(p.y / GRID) * GRID
    return { x: p.x, y: toward.y < p.y ? up : down }
  }
  const l = Math.floor(p.x / GRID) * GRID
  const r = Math.ceil(p.x / GRID) * GRID
  return { x: toward.x < p.x ? l : r, y: p.y }
}

function dedupe(pts: Point[]): Point[] {
  const out: Point[] = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (!last || last.x !== p.x || last.y !== p.y) out.push(p)
  }
  // drop collinear middle points
  const res: Point[] = []
  for (let i = 0; i < out.length; i++) {
    const a = res[res.length - 1]
    const b = out[i]
    const c = out[i + 1]
    if (a && c && ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y))) continue
    res.push(b)
  }
  return res
}

/** Street-following route between two road points (Z-shaped through the grid). */
export function route(aIn: Point, bIn: Point): Point[] {
  const a = snapToRoad(aIn)
  const b = snapToRoad(bIn)
  if (a.x === b.x && onV(a) && onV(b)) return dedupe([a, b])
  if (a.y === b.y && !onV(a) && !onV(b)) return dedupe([a, b])
  const i1 = exitIntersection(a, b)
  const i2 = exitIntersection(b, a)
  const midX = snap((i1.x + i2.x) / 2)
  return dedupe([a, i1, { x: midX, y: i1.y }, { x: midX, y: i2.y }, i2, b])
}

export function pathLength(pts: Point[]): number {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  return L
}

/** Position and heading (degrees, 0 = east) at fraction t of the polyline. */
export function along(pts: Point[], t: number): { p: Point; a: number } {
  if (pts.length === 0) return { p: { x: 0, y: 0 }, a: 0 }
  if (pts.length === 1) return { p: pts[0], a: 0 }
  const total = pathLength(pts)
  let d = clamp(t, 0, 1) * total
  for (let i = 1; i < pts.length; i++) {
    const s = pts[i - 1]
    const e = pts[i]
    const seg = Math.hypot(e.x - s.x, e.y - s.y)
    if (d <= seg || i === pts.length - 1) {
      const f = seg === 0 ? 0 : Math.min(1, d / seg)
      return { p: { x: s.x + (e.x - s.x) * f, y: s.y + (e.y - s.y) * f }, a: (Math.atan2(e.y - s.y, e.x - s.x) * 180) / Math.PI }
    }
    d -= seg
  }
  return { p: pts[pts.length - 1], a: 0 }
}

/** Remaining part of a polyline from fraction t. */
export function slice(pts: Point[], t: number): Point[] {
  if (pts.length < 2) return pts
  const total = pathLength(pts)
  let d = clamp(t, 0, 1) * total
  for (let i = 1; i < pts.length; i++) {
    const s = pts[i - 1]
    const e = pts[i]
    const seg = Math.hypot(e.x - s.x, e.y - s.y)
    if (d <= seg) {
      const f = seg === 0 ? 0 : d / seg
      return [{ x: s.x + (e.x - s.x) * f, y: s.y + (e.y - s.y) * f }, ...pts.slice(i)]
    }
    d -= seg
  }
  return [pts[pts.length - 1]]
}

export const routeKm = (pts: Point[]) => pathLength(pts) * KM_PER_UNIT

/** Average city speed used for ETAs (km/h). */
export const CITY_KMH = 38
export const kmToMin = (km: number) => Math.max(2, Math.round((km / CITY_KMH) * 60 + 1))

export function bbox(points: Point[], pad = 80) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x0 = Math.min(...xs) - pad
  const y0 = Math.min(...ys) - pad
  const x1 = Math.max(...xs) + pad
  const y1 = Math.max(...ys) + pad
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export const dist = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/** A random point on a road within the city, deterministic from a seed. */
export function roadPointFromSeed(seed: number): Point {
  const r = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280
    return x - Math.floor(x)
  }
  const vertical = r(1) > 0.5
  if (vertical) return { x: snap(r(2) * CITY.w), y: Math.round(r(3) * CITY.h) }
  return { x: Math.round(r(2) * CITY.w), y: snap(r(3) * CITY.h) }
}

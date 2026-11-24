import type { City, CityId, LatLng, Place } from './types'

/**
 * Offline geography for the demo map of Riyadh.
 * Coordinates are real WGS84 lat/lng (approximate), so a production map provider
 * (Mapbox / Google / HERE) can replace the SVG renderer without changing the data model.
 */

export const RIYADH_BOUNDS = { minLat: 24.58, maxLat: 24.99, minLng: 46.52, maxLng: 46.84 }

export const CITIES: City[] = [
  { id: 'riyadh', name: { ar: 'الرياض', en: 'Riyadh' }, status: 'live', center: { lat: 24.7136, lng: 46.6753 }, districts: 186 },
  { id: 'jeddah', name: { ar: 'جدة', en: 'Jeddah' }, status: 'live', center: { lat: 21.5433, lng: 39.1728 }, districts: 137 },
  { id: 'dammam', name: { ar: 'الدمام', en: 'Dammam' }, status: 'live', center: { lat: 26.4207, lng: 50.0888 }, districts: 92 },
  { id: 'khobar', name: { ar: 'الخبر', en: 'Khobar' }, status: 'pilot', center: { lat: 26.2172, lng: 50.1971 }, districts: 48 },
  { id: 'makkah', name: { ar: 'مكة المكرمة', en: 'Makkah' }, status: 'pilot', center: { lat: 21.3891, lng: 39.8579 }, districts: 74 },
  { id: 'madinah', name: { ar: 'المدينة المنورة', en: 'Madinah' }, status: 'planned', center: { lat: 24.5247, lng: 39.5692 }, districts: 61 },
]

export const cityById = (id: CityId) => CITIES.find((c) => c.id === id)!

const P = (id: string, ar: string, en: string, subAr: string, subEn: string, lat: number, lng: number, kind?: Place['kind']): Place => ({
  id,
  name: { ar, en },
  sub: { ar: subAr, en: subEn },
  pos: { lat, lng },
  kind,
})

export const PLACES: Place[] = [
  P('ruh', 'مطار الملك خالد الدولي', 'King Khalid International Airport', 'الصالات ١–٥', 'Terminals 1–5', 24.9576, 46.6988, 'airport'),
  P('kingdom', 'برج المملكة', 'Kingdom Centre', 'العليا، طريق الملك فهد', 'Olaya, King Fahd Rd', 24.7113, 46.6744, 'landmark'),
  P('faisaliah', 'برج الفيصلية', 'Al Faisaliah Tower', 'العليا', 'Olaya', 24.6903, 46.6853, 'landmark'),
  P('kafd', 'مركز الملك عبدالله المالي', 'KAFD', 'العقيق', 'Al Aqiq', 24.7633, 46.6407, 'office'),
  P('riyadhpark', 'الرياض بارك', 'Riyadh Park', 'العقيق، طريق الملك عبدالعزيز', 'Al Aqiq', 24.7556, 46.6297, 'mall'),
  P('boulevard', 'بوليفارد رياض سيتي', 'Boulevard Riyadh City', 'حطين', 'Hittin', 24.7687, 46.6009, 'landmark'),
  P('front', 'واجهة الرياض', 'Riyadh Front', 'طريق المطار', 'Airport Rd', 24.8356, 46.7265, 'mall'),
  P('nakheelmall', 'النخيل مول', 'Al Nakheel Mall', 'المغرزات', 'Al Mughrizat', 24.7695, 46.7114, 'mall'),
  P('panorama', 'بانوراما مول', 'Panorama Mall', 'التخصصي', 'Takhassusi St', 24.6935, 46.6693, 'mall'),
  P('bujairi', 'حي البجيري، الدرعية', 'Al Bujairi, Diriyah', 'الدرعية التاريخية', 'Historic Diriyah', 24.7334, 46.5747, 'landmark'),
  P('ksu', 'جامعة الملك سعود', 'King Saud University', 'الدرعية', 'Diriyah', 24.7229, 46.6198, 'university'),
  P('pnu', 'جامعة الأميرة نورة', 'Princess Nourah University', 'طريق المطار', 'Airport Rd', 24.8466, 46.7247, 'university'),
  P('masmak', 'قصر المصمك', 'Masmak Fortress', 'الديرة', 'Al Dirah', 24.6312, 46.7134, 'landmark'),
  P('museum', 'المتحف الوطني', 'National Museum', 'المربع', 'Al Murabba', 24.6476, 46.7101, 'landmark'),
  P('granada', 'غرناطة مول', 'Granada Mall', 'الشهداء', 'Al Shuhada', 24.7743, 46.7347, 'mall'),
  P('sahafa', 'حي الصحافة', 'Al Sahafa', 'شمال الرياض', 'North Riyadh', 24.8063, 46.6402),
  P('hittin', 'حي حطين', 'Hittin', 'شمال غرب الرياض', 'North-west Riyadh', 24.7681, 46.6123),
  P('malqa', 'حي الملقا', 'Al Malqa', 'طريق أنس بن مالك', 'Anas Ibn Malik Rd', 24.8095, 46.6185),
]

export const placeById = (id: string) => PLACES.find((p) => p.id === id)

export const DEMO_HOME: Place = P('home', 'المنزل', 'Home', 'حي الياسمين، شارع الثمامة', 'Al Yasmin, Thumamah St', 24.8251, 46.6438, 'home')
export const DEMO_WORK: Place = P('work', 'العمل', 'Work', 'مركز الملك عبدالله المالي', 'KAFD', 24.7633, 46.6407, 'work')

/** Default "current location" for the demo rider. */
export const DEMO_CURRENT: Place = P('current', 'موقعك الحالي', 'Current location', 'طريق الملك فهد، العليا', 'King Fahd Rd, Olaya', 24.7262, 46.6655, 'pin')

export type Road = { id: string; name: { ar: string; en: string }; tier: 1 | 2; pts: [number, number][] }

/** Major roads (lat, lng). Approximate alignment for illustration. */
export const ROADS: Road[] = [
  { id: 'kfr', tier: 1, name: { ar: 'طريق الملك فهد', en: 'King Fahd Rd' }, pts: [[24.6, 46.735], [24.65, 46.705], [24.69, 46.685], [24.711, 46.674], [24.76, 46.648], [24.8, 46.627], [24.86, 46.6], [24.92, 46.575]] },
  { id: 'olaya', tier: 2, name: { ar: 'شارع العليا', en: 'Olaya St' }, pts: [[24.66, 46.712], [24.69, 46.692], [24.73, 46.672], [24.77, 46.652], [24.81, 46.633]] },
  { id: 'takh', tier: 2, name: { ar: 'شارع التخصصي', en: 'Takhassusi St' }, pts: [[24.67, 46.676], [24.7, 46.664], [24.74, 46.644], [24.78, 46.622]] },
  { id: 'nrr', tier: 1, name: { ar: 'الطريق الدائري الشمالي', en: 'Northern Ring Rd' }, pts: [[24.757, 46.55], [24.775, 46.59], [24.787, 46.63], [24.795, 46.68], [24.795, 46.73], [24.78, 46.775]] },
  { id: 'err', tier: 1, name: { ar: 'الطريق الدائري الشرقي', en: 'Eastern Ring Rd' }, pts: [[24.78, 46.775], [24.74, 46.785], [24.7, 46.79], [24.65, 46.795], [24.6, 46.8]] },
  { id: 'wrr', tier: 1, name: { ar: 'الطريق الدائري الغربي', en: 'Western Ring Rd' }, pts: [[24.6, 46.64], [24.64, 46.61], [24.69, 46.585], [24.757, 46.55]] },
  { id: 'srr', tier: 1, name: { ar: 'الطريق الدائري الجنوبي', en: 'Southern Ring Rd' }, pts: [[24.6, 46.64], [24.605, 46.7], [24.6, 46.8]] },
  { id: 'makkah', tier: 1, name: { ar: 'طريق مكة المكرمة', en: 'Makkah Rd' }, pts: [[24.665, 46.58], [24.672, 46.63], [24.684, 46.68], [24.694, 46.73], [24.7, 46.79]] },
  { id: 'kar', tier: 1, name: { ar: 'طريق الملك عبدالله', en: 'King Abdullah Rd' }, pts: [[24.725, 46.57], [24.731, 46.62], [24.737, 46.66], [24.744, 46.71], [24.752, 46.785]] },
  { id: 'ksr', tier: 1, name: { ar: 'طريق الملك سلمان', en: 'King Salman Rd' }, pts: [[24.818, 46.57], [24.822, 46.62], [24.826, 46.67], [24.83, 46.72], [24.835, 46.77]] },
  { id: 'airport', tier: 1, name: { ar: 'طريق المطار', en: 'Airport Rd' }, pts: [[24.75, 46.73], [24.795, 46.715], [24.84, 46.712], [24.9, 46.706], [24.957, 46.699]] },
  { id: 'anas', tier: 2, name: { ar: 'طريق أنس بن مالك', en: 'Anas Ibn Malik Rd' }, pts: [[24.81, 46.58], [24.812, 46.63], [24.815, 46.69]] },
  { id: 'thumamah', tier: 2, name: { ar: 'طريق الثمامة', en: 'Thumamah Rd' }, pts: [[24.84, 46.58], [24.845, 46.64], [24.85, 46.72]] },
  { id: 'abubakr', tier: 2, name: { ar: 'طريق أبو بكر الصديق', en: 'Abu Bakr Rd' }, pts: [[24.74, 46.69], [24.79, 46.676], [24.85, 46.668], [24.9, 46.66]] },
  { id: 'kkr', tier: 2, name: { ar: 'طريق الملك خالد', en: 'King Khalid Rd' }, pts: [[24.64, 46.65], [24.7, 46.632], [24.76, 46.608], [24.8, 46.59]] },
]

export const DISTRICTS: { name: { ar: string; en: string }; pos: LatLng }[] = [
  { name: { ar: 'العليا', en: 'Olaya' }, pos: { lat: 24.698, lng: 46.68 } },
  { name: { ar: 'الملقا', en: 'Al Malqa' }, pos: { lat: 24.807, lng: 46.605 } },
  { name: { ar: 'حطين', en: 'Hittin' }, pos: { lat: 24.775, lng: 46.605 } },
  { name: { ar: 'الياسمين', en: 'Al Yasmin' }, pos: { lat: 24.832, lng: 46.645 } },
  { name: { ar: 'النخيل', en: 'Al Nakheel' }, pos: { lat: 24.747, lng: 46.633 } },
  { name: { ar: 'السليمانية', en: 'Al Sulimaniyah' }, pos: { lat: 24.704, lng: 46.705 } },
  { name: { ar: 'المربع', en: 'Al Murabba' }, pos: { lat: 24.652, lng: 46.715 } },
  { name: { ar: 'الملز', en: 'Al Malaz' }, pos: { lat: 24.665, lng: 46.74 } },
  { name: { ar: 'الروضة', en: 'Al Rawdah' }, pos: { lat: 24.735, lng: 46.765 } },
  { name: { ar: 'قرطبة', en: 'Qurtubah' }, pos: { lat: 24.81, lng: 46.75 } },
  { name: { ar: 'النرجس', en: 'Al Narjis' }, pos: { lat: 24.87, lng: 46.66 } },
  { name: { ar: 'العقيق', en: 'Al Aqiq' }, pos: { lat: 24.77, lng: 46.63 } },
  { name: { ar: 'الورود', en: 'Al Wurud' }, pos: { lat: 24.722, lng: 46.66 } },
  { name: { ar: 'الدرعية', en: 'Diriyah' }, pos: { lat: 24.74, lng: 46.575 } },
  { name: { ar: 'الصحافة', en: 'Al Sahafa' }, pos: { lat: 24.8, lng: 46.645 } },
  { name: { ar: 'الديرة', en: 'Al Dirah' }, pos: { lat: 24.628, lng: 46.712 } },
]

export const PARKS: { pos: LatLng; w: number; h: number }[] = [
  { pos: { lat: 24.668, lng: 46.722 }, w: 0.012, h: 0.008 },
  { pos: { lat: 24.745, lng: 46.615 }, w: 0.01, h: 0.007 },
  { pos: { lat: 24.79, lng: 46.705 }, w: 0.014, h: 0.008 },
  { pos: { lat: 24.715, lng: 46.745 }, w: 0.009, h: 0.009 },
  { pos: { lat: 24.835, lng: 46.6 }, w: 0.012, h: 0.007 },
  { pos: { lat: 24.88, lng: 46.735 }, w: 0.03, h: 0.012 },
]

/* ---------- Math ---------- */

const R = 6371
const rad = (d: number) => (d * Math.PI) / 180

export function haversineKm(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function pathKm(pts: LatLng[]) {
  let d = 0
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i])
  return d
}

/**
 * Demo router: an orthogonal "city grid" path with two bends, matching the brand's route style
 * (constant weight, rounded corners). A real routing API replaces this function only.
 */
export function routeBetween(a: LatLng, b: LatLng): LatLng[] {
  const midLat = a.lat + (b.lat - a.lat) * 0.55
  if (Math.abs(a.lat - b.lat) < 0.002 || Math.abs(a.lng - b.lng) < 0.002) return [a, b]
  return [a, { lat: midLat, lng: a.lng }, { lat: midLat, lng: b.lng }, b]
}

/** Road distance estimate: grid path length × detour factor. */
export const roadKm = (route: LatLng[]) => pathKm(route) * 1.12

/** Average urban speed used for demo ETAs (km/h). */
export const AVG_KMH = 38

export const minutesFor = (km: number) => Math.max(3, Math.round((km / AVG_KMH) * 60 + 2))

export function pointAlong(pts: LatLng[], t: number): { pos: LatLng; heading: number } {
  if (pts.length === 1) return { pos: pts[0], heading: 0 }
  const clamped = Math.min(1, Math.max(0, t))
  const segs: number[] = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const d = haversineKm(pts[i - 1], pts[i])
    segs.push(d)
    total += d
  }
  let target = clamped * total
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : Math.min(1, target / segs[i])
      const a = pts[i]
      const b = pts[i + 1]
      const pos = { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f }
      // heading in screen terms: 0 = north/up, clockwise degrees
      const heading = (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI
      return { pos, heading }
    }
    target -= segs[i]
  }
  return { pos: pts[pts.length - 1], heading: 0 }
}

/** Slice of a route from fraction t to the end (remaining path). */
export function remainingRoute(pts: LatLng[], t: number): LatLng[] {
  if (t <= 0) return pts
  if (t >= 1) return [pts[pts.length - 1]]
  const { pos } = pointAlong(pts, t)
  let total = 0
  const segs: number[] = []
  for (let i = 1; i < pts.length; i++) {
    const d = haversineKm(pts[i - 1], pts[i])
    segs.push(d)
    total += d
  }
  let target = t * total
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) return [pos, ...pts.slice(i + 1)]
    target -= segs[i]
  }
  return [pos, pts[pts.length - 1]]
}

/** Offset a point by km east/north. */
export function offsetKm(p: LatLng, eastKm: number, northKm: number): LatLng {
  return {
    lat: p.lat + northKm / 111.32,
    lng: p.lng + eastKm / (111.32 * Math.cos(rad(p.lat))),
  }
}

export function nearestPlaceName(p: LatLng, lang: 'ar' | 'en') {
  let best = PLACES[0]
  let bd = Infinity
  for (const pl of PLACES) {
    const d = haversineKm(p, pl.pos)
    if (d < bd) {
      bd = d
      best = pl
    }
  }
  let dist = DISTRICTS[0]
  let dd = Infinity
  for (const di of DISTRICTS) {
    const d = haversineKm(p, di.pos)
    if (d < dd) {
      dd = d
      dist = di
    }
  }
  return bd < 0.6 ? best.name[lang] : `${lang === 'ar' ? 'حي ' : ''}${dist.name[lang]}`
}

export function pinPlace(p: LatLng): Place {
  const district = DISTRICTS.reduce((a, b) => (haversineKm(p, a.pos) < haversineKm(p, b.pos) ? a : b))
  return {
    id: `pin-${p.lat.toFixed(4)}-${p.lng.toFixed(4)}`,
    name: { ar: `موقع محدد · ${district.name.ar}`, en: `Dropped pin · ${district.name.en}` },
    sub: { ar: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`, en: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` },
    pos: p,
    kind: 'pin',
  }
}

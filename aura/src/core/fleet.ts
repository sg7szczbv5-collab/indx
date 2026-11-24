/**
 * DEMO fleet simulation. Seeded captains in Riyadh move along deterministic loops computed
 * purely from the clock, so every open tab (Admin, Passenger, Driver) sees the same fleet
 * without any server. A production build replaces this with live GPS from the dispatch backend.
 */
import { PLACES, minutesFor, offsetKm, pointAlong, roadKm, routeBetween } from './geo'
import { rng } from './seed'
import type { Driver, LatLng, Place, TripStatus, VehicleClassId } from './types'

export type FleetStatus = 'available' | Exclude<TripStatus, 'searching' | 'completed' | 'cancelled'>

export type FleetUnit = {
  driverId: string
  pos: LatLng
  heading: number
  status: FleetStatus | 'offline'
  classId: VehicleClassId
  tripId?: string
  pickup?: Place
  dropoff?: Place
  route?: LatLng[]
  progress?: number
}

const PERIOD = 420_000

function endpoint(sim: number, cycle: number): LatLng {
  const r = rng(sim * 7919 + cycle * 104729)
  const base = PLACES[Math.floor(r() * (PLACES.length - 1)) + 1].pos // skip airport mostly
  return offsetKm(base, (r() - 0.5) * 1.6, (r() - 0.5) * 1.6)
}

export function simulateUnit(d: Driver, classId: VehicleClassId, now: number): FleetUnit {
  const sim = d.sim ?? 1
  const offset = sim * 37_123
  const t = now + offset
  const cycle = Math.floor(t / PERIOD)
  const f = (t % PERIOD) / PERIOD
  const start = endpoint(sim, cycle - 1)
  const r = rng(sim * 31 + cycle * 17)
  const pickupPos = offsetKm(start, (r() - 0.5) * 4, (r() - 0.5) * 4)
  const dropPos = endpoint(sim, cycle)
  const pickup: Place = { id: `sp-${sim}-${cycle}`, name: { ar: 'نقطة انطلاق', en: 'Pickup' }, sub: { ar: '', en: '' }, pos: pickupPos }
  const dropoff: Place = { id: `sd-${sim}-${cycle}`, name: { ar: 'وجهة', en: 'Destination' }, sub: { ar: '', en: '' }, pos: dropPos }
  const tripId = `SIM-${String(sim).padStart(2, '0')}${String(cycle % 10000).padStart(4, '0')}`
  // ~30% of cycles are idle (no trip) for variety
  const idleCycle = r() < 0.3
  if (idleCycle || f < 0.15) {
    const wobble = offsetKm(start, Math.sin(t / 50_000 + sim) * 0.5, Math.cos(t / 60_000 + sim) * 0.5)
    return { driverId: d.id, pos: wobble, heading: ((t / 1000) * 6 + sim * 40) % 360, status: 'available', classId }
  }
  if (f < 0.35) {
    const route = routeBetween(start, pickupPos)
    const p = pointAlong(route, (f - 0.15) / 0.2)
    return { driverId: d.id, pos: p.pos, heading: p.heading, status: 'driver_arriving', classId, tripId, pickup, dropoff, route, progress: (f - 0.15) / 0.2 }
  }
  if (f < 0.4) {
    return { driverId: d.id, pos: pickupPos, heading: 0, status: 'driver_arrived', classId, tripId, pickup, dropoff }
  }
  if (f < 0.92) {
    const route = routeBetween(pickupPos, dropPos)
    const p = pointAlong(route, (f - 0.4) / 0.52)
    return { driverId: d.id, pos: p.pos, heading: p.heading, status: 'in_progress', classId, tripId, pickup, dropoff, route, progress: (f - 0.4) / 0.52 }
  }
  return { driverId: d.id, pos: dropPos, heading: 0, status: 'available', classId }
}

/** Rough demand heat: points of recent requests, deterministic per 10-minute window. */
export function demandPoints(now: number, n = 70): LatLng[] {
  const r = rng(Math.floor(now / 600_000))
  const pts: LatLng[] = []
  for (let i = 0; i < n; i++) {
    const p = PLACES[Math.floor(Math.pow(r(), 1.6) * PLACES.length)]
    pts.push(offsetKm(p.pos, (r() - 0.5) * 2.4, (r() - 0.5) * 2.4))
  }
  return pts
}

export function simTripStats(km: number) {
  return { km, min: minutesFor(km) }
}

export { roadKm }

import { DAY, startOfDay } from '../../core/format'
import { CITIES } from '../../core/geo'
import { VEHICLE_CLASSES } from '../../core/pricing'
import type { Customer, Driver, Trip } from '../../core/types'

export type Period = { from: number; to: number }

export const inRange = (t: Trip, p: Period) => t.createdAt >= p.from && t.createdAt < p.to

export function summarize(trips: Trip[]) {
  const done = trips.filter((t) => t.status === 'completed')
  const cancelled = trips.filter((t) => t.status === 'cancelled')
  const gmv = done.reduce((a, t) => a + t.fare.total, 0)
  const subtotal = done.reduce((a, t) => a + t.fare.subtotal, 0)
  const commission = done.reduce((a, t) => a + t.fare.commission, 0)
  const driverNet = done.reduce((a, t) => a + t.fare.driverNet, 0)
  const vat = done.reduce((a, t) => a + t.fare.vat, 0)
  const discounts = done.reduce((a, t) => a + t.fare.discount, 0)
  const tips = done.reduce((a, t) => a + (t.passengerRating?.tip ?? 0), 0)
  const etas = done
    .map((t) => {
      const a = t.timeline.find((x) => x.status === 'driver_assigned')?.at
      const b = t.timeline.find((x) => x.status === 'driver_arrived')?.at
      return a && b ? (b - a) / 60000 : null
    })
    .filter((x): x is number => x !== null)
  const offered = trips.filter((t) => t.timeline.some((x) => x.status === 'driver_assigned')).length
  return {
    total: trips.length,
    completed: done.length,
    cancelled: cancelled.length,
    gmv,
    subtotal,
    commission,
    driverNet,
    vat,
    discounts,
    tips,
    avgValue: done.length ? Math.round(gmv / done.length) : 0,
    avgEta: etas.length ? etas.reduce((a, b) => a + b, 0) / etas.length : 0,
    cancelRate: trips.length ? cancelled.length / trips.length : 0,
    acceptRate: trips.length ? offered / trips.length : 0,
  }
}

export function dailySeries(trips: Trip[], days: number, lang: 'ar' | 'en') {
  const s0 = startOfDay() - (days - 1) * DAY
  const buckets = Array.from({ length: days }).map((_, i) => ({ t: s0 + i * DAY, completed: 0, cancelled: 0, gmv: 0, commission: 0, driverNet: 0 }))
  for (const t of trips) {
    const i = Math.floor((t.createdAt - s0) / DAY)
    if (i < 0 || i >= days) continue
    const b = buckets[i]
    if (t.status === 'completed') {
      b.completed++
      b.gmv += t.fare.total
      b.commission += t.fare.commission
      b.driverNet += t.fare.driverNet
    } else if (t.status === 'cancelled') b.cancelled++
  }
  return buckets.map((b) => ({
    ...b,
    label: new Date(b.t).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short' }),
    gmvSar: b.gmv / 100,
    commissionSar: b.commission / 100,
    driverSar: b.driverNet / 100,
  }))
}

export function growthSeries(items: { joinedAt: number }[], months: number, lang: 'ar' | 'en') {
  const now = new Date()
  const out: { label: string; total: number; added: number }[] = []
  for (let m = months - 1; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1).getTime()
    const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 1).getTime()
    out.push({
      label: new Date(start).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { month: 'short' }),
      total: items.filter((x) => x.joinedAt < end).length,
      added: items.filter((x) => x.joinedAt >= start && x.joinedAt < end).length,
    })
  }
  return out
}

export function classMix(trips: Trip[]) {
  return VEHICLE_CLASSES.map((c) => ({ id: c.id, name: c.name, value: trips.filter((t) => t.vehicleClass === c.id && t.status === 'completed').length }))
}

export function cityMix(trips: Trip[], lang: 'ar' | 'en') {
  return CITIES.map((c) => {
    const ts = trips.filter((t) => t.cityId === c.id)
    const s = summarize(ts)
    return { id: c.id, name: c.name[lang], trips: ts.length, completed: s.completed, gmv: s.gmv, commission: s.commission, cancelRate: s.cancelRate, status: c.status }
  }).sort((a, b) => b.trips - a.trips)
}

export function topDrivers(trips: Trip[], drivers: Driver[], n = 10) {
  const m = new Map<string, { trips: number; net: number }>()
  for (const t of trips) {
    if (t.status !== 'completed' || !t.driverId) continue
    const x = m.get(t.driverId) ?? { trips: 0, net: 0 }
    x.trips++
    x.net += t.fare.driverNet
    m.set(t.driverId, x)
  }
  return [...m.entries()]
    .map(([id, v]) => ({ driver: drivers.find((d) => d.id === id)!, ...v }))
    .filter((x) => x.driver)
    .sort((a, b) => b.trips - a.trips)
    .slice(0, n)
}

export function customerStats(c: Customer, trips: Trip[]) {
  const mine = trips.filter((t) => t.passengerId === c.id)
  const done = mine.filter((t) => t.status === 'completed')
  return { trips: mine.length, completed: done.length, spend: done.reduce((a, t) => a + t.fare.total, 0), cancelled: mine.filter((t) => t.status === 'cancelled').length }
}

export function driverStats(id: string, trips: Trip[]) {
  const mine = trips.filter((t) => t.driverId === id)
  const done = mine.filter((t) => t.status === 'completed')
  return { trips: done.length, net: done.reduce((a, t) => a + t.fare.driverNet + (t.passengerRating?.tip ?? 0), 0), commission: done.reduce((a, t) => a + t.fare.commission, 0), cash: done.filter((t) => t.paymentMethod === 'cash').reduce((a, t) => a + t.fare.total, 0) }
}

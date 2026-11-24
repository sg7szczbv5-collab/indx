import { describe, expect, it, beforeEach } from 'vitest'
import { canTransition, TRIP_STATUSES } from '../src/core/trip'
import { DEFAULT_PRICING, quoteFare, promoDiscount } from '../src/core/pricing'
import { PLACES, routeBetween, pointAlong, haversineKm } from '../src/core/geo'
import { actions, store, getDriver } from '../src/core/store'
import { DEMO_DRIVER_ID, DEMO_PASSENGER_ID } from '../src/core/seed'
import type { Promo } from '../src/core/types'

describe('trip state machine', () => {
  it('uses exactly the seven unified statuses', () => {
    expect(TRIP_STATUSES).toEqual(['searching', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled'])
  })
  it('allows the happy path only for the right actors', () => {
    expect(canTransition('searching', 'driver_assigned', 'driver')).toBe(true)
    expect(canTransition('searching', 'driver_assigned', 'passenger')).toBe(false)
    expect(canTransition('driver_arrived', 'in_progress', 'driver')).toBe(true)
    expect(canTransition('in_progress', 'completed', 'driver')).toBe(true)
  })
  it('blocks illegal jumps and terminal changes', () => {
    expect(canTransition('searching', 'in_progress', 'driver')).toBe(false)
    expect(canTransition('completed', 'cancelled', 'admin')).toBe(false)
    expect(canTransition('in_progress', 'cancelled', 'passenger')).toBe(false)
    expect(canTransition('in_progress', 'cancelled', 'admin')).toBe(true)
  })
})

describe('pricing', () => {
  const base = { config: DEFAULT_PRICING, cityId: 'riyadh' as const, classId: 'go' as const }
  it('builds subtotal, VAT 15% and commission consistently', () => {
    const q = quoteFare({ ...base, distanceKm: 10, durationMin: 20 })
    expect(q.subtotal % 100).toBe(0) // whole riyals
    expect(q.subtotal).toBeGreaterThanOrEqual(q.base + q.distance + q.time)
    expect(q.vat).toBe(Math.round(q.subtotal * 0.15))
    expect(q.total).toBe(q.subtotal + q.vat)
    expect(q.commission + q.driverNet).toBe(q.subtotal)
    expect(q.minFareTopUp).toBeGreaterThanOrEqual(0)
  })
  it('applies the minimum fare on short trips', () => {
    const q = quoteFare({ ...base, distanceKm: 0.5, durationMin: 2 })
    expect(q.subtotal).toBe(DEFAULT_PRICING.cities.riyadh.go.minFare)
  })
  it('applies surge to distance and time only', () => {
    const a = quoteFare({ ...base, distanceKm: 10, durationMin: 20 })
    const b = quoteFare({ ...base, distanceKm: 10, durationMin: 20, surgeMultiplier: 1.5 })
    expect(b.surge).toBe(Math.round((a.distance + a.time) * 0.5))
  })
  it('caps percentage promos and keeps VAT on the discounted amount', () => {
    const promo: Promo = { id: 'p', code: 'AURA50', title: { ar: '', en: '' }, kind: 'percent', value: 50, maxDiscount: 2500, audience: 'new', active: true, startsAt: 0, endsAt: Infinity, used: 0 }
    expect(promoDiscount(promo, 10000)).toBe(2500)
    const q = quoteFare({ ...base, distanceKm: 30, durationMin: 40, promo })
    expect(q.discount).toBe(2500)
    expect(q.vat).toBe(Math.round((q.subtotal - 2500) * 0.15))
    expect(q.driverNet).toBe(q.subtotal - q.commission) // platform funds discounts
  })
})

describe('geo', () => {
  it('routes with bends and interpolates along the path', () => {
    const r = routeBetween(PLACES[1].pos, PLACES[3].pos)
    expect(r.length).toBe(4)
    expect(pointAlong(r, 0).pos).toEqual(r[0])
    const end = pointAlong(r, 1).pos
    expect(haversineKm(end, r[3])).toBeLessThan(0.001)
  })
})

describe('store: full trip lifecycle shared by the three apps', () => {
  beforeEach(() => actions.resetDemo())

  it('passenger request → captain offer → accept → arrive → OTP → complete', () => {
    const kingdom = PLACES.find((p) => p.id === 'kingdom')!
    const park = PLACES.find((p) => p.id === 'riyadhpark')!
    actions.setOnline(DEMO_DRIVER_ID, true)
    const res = actions.requestTrip({ passengerId: DEMO_PASSENGER_ID, pickup: kingdom, dropoff: park, classId: 'comfort', payment: 'mada' })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const id = res.trip.id
    // a second active trip for the same rider is rejected
    expect(actions.requestTrip({ passengerId: DEMO_PASSENGER_ID, pickup: kingdom, dropoff: park, classId: 'go', payment: 'mada' })).toEqual({ ok: false, error: 'active_exists' })
    // simulate the dispatcher making an offer
    store.commit((s) => {
      s.trips[0].offer = { driverId: DEMO_DRIVER_ID, expiresAt: Date.now() + 15000, declined: [] }
    })
    expect(actions.acceptOffer(id, DEMO_DRIVER_ID)).toBe(true)
    expect(store.state.trips[0].status).toBe('driver_assigned')
    expect(store.state.trips[0].leg?.kind).toBe('approach')
    expect(actions.markArrived(id)).toBe(true)
    expect(actions.startTrip(id, '0000')).toBe(store.state.trips[0].otp === '0000')
    expect(actions.startTrip(id, store.state.trips[0].otp)).toBe(true)
    expect(store.state.trips[0].status).toBe('in_progress')
    expect(actions.completeTrip(id)).toBe(true)
    const t = store.state.trips[0]
    expect(t.status).toBe('completed')
    expect(t.timeline.map((e) => e.status)).toEqual(['searching', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'in_progress', 'completed'])
    // cannot move a completed trip
    expect(actions.cancelTrip(id, 'admin', 'x')).toBe(false)
  })

  it('rejects pickups inside a restricted zone', () => {
    const dq = { id: 'dq', name: { ar: 'x', en: 'x' }, sub: { ar: '', en: '' }, pos: { lat: 24.684, lng: 46.622 } }
    const r = actions.requestTrip({ passengerId: DEMO_PASSENGER_ID, pickup: dq, dropoff: PLACES[1], classId: 'go', payment: 'cash' })
    expect(r).toEqual({ ok: false, error: 'restricted' })
  })

  it('admin approval moves a new captain application to approved', () => {
    const admin = store.state.admins[0]
    const id = actions.submitDriverApplication({
      name: { ar: 'تجربة', en: 'Test' },
      phone: '+966 50 000 0000',
      nationalId: '1234567890',
      cityId: 'riyadh',
      docs: [],
      vehicle: { make: 'Kia', model: 'K5', year: 2024, color: { ar: 'أبيض', en: 'White' }, colorHex: '#fff', plate: { digits: '1111', lettersAr: 'أ', lettersEn: 'A' }, classId: 'go' },
    })
    expect(getDriver(id)?.status).toBe('pending_review')
    actions.setDriverStatus(id, 'approved', admin)
    expect(getDriver(id)?.status).toBe('approved')
    expect(store.state.audit[0].action).toBe('driver.approved')
  })

  it('pricing edits are applied and written to the audit log', () => {
    const admin = store.state.admins[0]
    actions.updateTariff('riyadh', 'go', { perKm: 200 }, admin)
    expect(store.state.pricing.cities.riyadh.go.perKm).toBe(200)
    expect(store.state.audit[0].action).toBe('pricing.update')
    expect(store.state.audit[0].detail).toContain('perKm 165 → 200')
  })
})

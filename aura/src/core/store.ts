/**
 * AURA ecosystem store.
 *
 * One state, three products. Passenger, Driver and Admin call the same actions, which
 * enforce the shared trip state machine (core/trip.ts). State is persisted to localStorage
 * and synchronised across browser tabs, so you can open the three apps side by side
 * (or in separate tabs) and watch one trip move through all of them.
 *
 * This is the DEMO backend. Replace `EcoStore` actions with API calls (REST/WebSocket)
 * to connect a real dispatch service; the UI only depends on the action signatures.
 */
import { useSyncExternalStore, useEffect, useState } from 'react'
import { canTransition, isActive, newOtp, newTripId } from './trip'
import { DEFAULT_PRICING, quoteFare, SERVES, type ClassTariff, type PricingConfig } from './pricing'
import { haversineKm, minutesFor, offsetKm, pointAlong, roadKm, routeBetween } from './geo'
import { simulateUnit, type FleetUnit } from './fleet'
import {
  DEFAULT_ROLE_PERMISSIONS,
  DEMO_DRIVER_ID,
  seedAdmins,
  seedAudit,
  seedCampaigns,
  seedCustomers,
  seedFleet,
  seedHistory,
  seedPromos,
  seedTickets,
  seedZones,
} from './seed'
import type {
  Actor,
  AdminRole,
  AdminUser,
  AuditEntry,
  Campaign,
  CityId,
  Customer,
  Driver,
  DriverDoc,
  FareBreakdown,
  InboxItem,
  LatLng,
  PaymentMethodId,
  Payout,
  Permission,
  Place,
  Promo,
  Refund,
  Reservation,
  Ticket,
  TicketMessage,
  Trip,
  TripRating,
  TripStatus,
  Vehicle,
  VehicleClassId,
  Zone,
} from './types'

export type Settings = {
  autoDispatch: boolean
  offerSeconds: number
  /** Demo time acceleration for trip legs. 1 = real time. */
  demoSpeed: number
  requireOtp: boolean
  twoFactorRequired: boolean
  sessionMinutes: number
  languages: { ar: boolean; en: boolean }
  defaultLanguage: 'ar' | 'en'
  gateways: Record<'mada' | 'apple_pay' | 'stc_pay' | 'cash' | 'wallet', boolean>
  notify: { tripUpdates: boolean; marketing: boolean; driverDocsExpiry: boolean; payoutReady: boolean }
  company: { name: string; legalName: string; cr: string; vatNumber: string; email: string; phone: string; address: string }
  searchTimeoutSec: number
}

export type EcoState = {
  version: number
  rev: number
  savedAt: number
  seededAt: number
  trips: Trip[]
  drivers: Driver[]
  vehicles: Vehicle[]
  customers: Customer[]
  positions: Record<string, LatLng>
  pricing: PricingConfig
  audit: AuditEntry[]
  promos: Promo[]
  campaigns: Campaign[]
  inbox: InboxItem[]
  tickets: Ticket[]
  zones: Zone[]
  admins: AdminUser[]
  rolePerms: Record<AdminRole, Permission[]>
  payouts: Payout[]
  refunds: Refund[]
  reservations: Reservation[]
  settings: Settings
}

const KEY = 'aura.ecosystem.v1'
const VERSION = 4

const DEFAULT_SETTINGS: Settings = {
  autoDispatch: true,
  offerSeconds: 15,
  demoSpeed: 12,
  requireOtp: true,
  twoFactorRequired: true,
  sessionMinutes: 30,
  languages: { ar: true, en: true },
  defaultLanguage: 'ar',
  gateways: { mada: true, apple_pay: true, stc_pay: false, cash: true, wallet: true },
  notify: { tripUpdates: true, marketing: true, driverDocsExpiry: true, payoutReady: true },
  company: {
    name: 'AURA',
    legalName: 'AURA Smart Mobility (demo entity)',
    cr: '— (to be issued)',
    vatNumber: '— (to be issued)',
    email: 'hello@aura.demo',
    phone: '+966 9200 00000',
    address: 'Riyadh, Kingdom of Saudi Arabia',
  },
  searchTimeoutSec: 90,
}

function seedState(now: number): EcoState {
  const { drivers, vehicles } = seedFleet(now)
  const customers = seedCustomers(now)
  return {
    version: VERSION,
    rev: 1,
    savedAt: now,
    seededAt: now,
    trips: [],
    drivers,
    vehicles,
    customers,
    positions: { [DEMO_DRIVER_ID]: { lat: 24.7372, lng: 46.6598 } },
    pricing: DEFAULT_PRICING,
    audit: seedAudit(now),
    promos: seedPromos(now),
    campaigns: seedCampaigns(now),
    inbox: [
      {
        id: 'in-1',
        to: 'all',
        title: { ar: 'أهلاً بك في أورا', en: 'Welcome to AURA' },
        body: { ar: 'هذه نسخة تجريبية. كل البيانات للعرض فقط.', en: 'This is a demo build. All data is for demonstration only.' },
        at: now - 3600_000,
      },
    ],
    tickets: [],
    zones: seedZones(),
    admins: seedAdmins(now),
    rolePerms: DEFAULT_ROLE_PERMISSIONS,
    payouts: [],
    refunds: [],
    reservations: [],
    settings: DEFAULT_SETTINGS,
  }
}

/* ------------------------------------------------------------------ */

type Listener = () => void

class EcoStore {
  state: EcoState
  history: Trip[]
  private listeners = new Set<Listener>()
  private allCache: { key: EcoState | null; trips: Trip[] } = { key: null, trips: [] }

  constructor() {
    const now = Date.now()
    this.state = this.load() ?? seedState(now)
    this.history = seedHistory(this.state.seededAt, this.state.drivers, this.state.customers)
    if (!this.state.tickets.length) this.state.tickets = seedTickets(this.state.seededAt, this.history)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key !== KEY || !e.newValue) return
        try {
          const next = JSON.parse(e.newValue) as EcoState
          if (next.version === VERSION) {
            this.state = next
            this.emit()
          }
        } catch {
          /* ignore malformed */
        }
      })
    }
  }

  private load(): EcoState | null {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
      if (!raw) return null
      const s = JSON.parse(raw) as EcoState
      return s.version === VERSION ? s : null
    } catch {
      return null
    }
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state))
    } catch {
      /* storage may be unavailable (private mode); the demo still works in-memory */
    }
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  getState = () => this.state

  private emit() {
    this.listeners.forEach((l) => l())
  }

  /** Apply an immutable update, bump revision, persist and notify all apps. */
  commit(mutate: (s: EcoState) => EcoState | void) {
    const draft = structuredClone(this.state)
    const out = mutate(draft) ?? draft
    out.rev = this.state.rev + 1
    out.savedAt = Date.now()
    this.state = out
    this.persist()
    this.emit()
  }

  reset() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* noop */
    }
    this.state = seedState(Date.now())
    this.history = seedHistory(this.state.seededAt, this.state.drivers, this.state.customers)
    this.state.tickets = seedTickets(this.state.seededAt, this.history)
    this.persist()
    this.emit()
  }

  /** Session trips + seeded demo history, newest first. */
  allTrips(): Trip[] {
    if (this.allCache.key === this.state) return this.allCache.trips
    const trips = [...this.state.trips, ...this.history].sort((a, b) => b.createdAt - a.createdAt)
    this.allCache = { key: this.state, trips }
    return trips
  }
}

export const store = new EcoStore()

/* ------------------------------------------------------------------ */
/* Hooks                                                               */

export function useEco<T>(selector: (s: EcoState) => T): T {
  return selector(useSyncExternalStore(store.subscribe, store.getState, store.getState))
}

export function useAllTrips(): Trip[] {
  useSyncExternalStore(store.subscribe, store.getState, store.getState)
  return store.allTrips()
}

/** Re-render on an interval (for live maps, timers, ETAs). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const getDriver = (id?: string) => store.state.drivers.find((d) => d.id === id)
export const getVehicle = (id?: string) => store.state.vehicles.find((v) => v.id === id)
export const getCustomer = (id?: string) => store.state.customers.find((c) => c.id === id)
export const vehicleOf = (d?: Driver) => (d ? getVehicle(d.vehicleId) : undefined)

export function zoneAt(p: LatLng, cityId: CityId = 'riyadh'): { surge?: Zone; restricted?: Zone; airport?: Zone; inService: boolean } {
  const zones = store.state.zones.filter((z) => z.cityId === cityId && z.active)
  const hit = (z: Zone) => haversineKm(p, z.center) <= z.radiusKm
  const surgeZones = zones.filter((z) => z.kind === 'high_demand' && hit(z))
  const svc = zones.filter((z) => z.kind === 'service')
  return {
    surge: surgeZones.sort((a, b) => (b.multiplier ?? 1) - (a.multiplier ?? 1))[0],
    restricted: zones.find((z) => z.kind === 'restricted' && hit(z)),
    airport: zones.find((z) => z.kind === 'airport' && hit(z)),
    inService: svc.length === 0 || svc.some(hit) || zones.some((z) => z.kind === 'airport' && hit(z)),
  }
}

export function findPromo(code?: string) {
  if (!code) return undefined
  const now = Date.now()
  return store.state.promos.find((p) => p.code.toUpperCase() === code.trim().toUpperCase() && p.active && p.startsAt <= now && p.endsAt >= now)
}

export function quoteTrip(pickup: Place, dropoff: Place, classId: VehicleClassId, promoCode?: string, cityId: CityId = 'riyadh'): FareBreakdown {
  const route = routeBetween(pickup.pos, dropoff.pos)
  const km = Math.max(1.5, roadKm(route))
  const min = minutesFor(km)
  const z = zoneAt(pickup.pos, cityId)
  return quoteFare({
    config: store.state.pricing,
    cityId,
    classId,
    distanceKm: km,
    durationMin: min,
    surgeMultiplier: z.surge?.multiplier ?? 1,
    promo: findPromo(promoCode),
  })
}

export function busyDriverIds(): Set<string> {
  return new Set(store.state.trips.filter((t) => isActive(t.status) && t.driverId).map((t) => t.driverId!))
}

/** Live position + state for every captain (session trips override the simulation). */
export function fleetSnapshot(now: number): FleetUnit[] {
  const s = store.state
  const active = s.trips.filter((t) => isActive(t.status) && t.driverId)
  const byDriver = new Map(active.map((t) => [t.driverId!, t]))
  return s.drivers
    .filter((d) => d.cityId === 'riyadh' && d.status === 'approved')
    .map((d) => {
      const v = getVehicle(d.vehicleId)
      const classId = v?.classId ?? 'go'
      const trip = byDriver.get(d.id)
      if (trip) {
        const lp = tripDriverPose(trip, now)
        return {
          driverId: d.id,
          pos: lp.pos,
          heading: lp.heading,
          status: trip.status as FleetUnit['status'],
          classId,
          tripId: trip.id,
          pickup: trip.pickup,
          dropoff: trip.dropoff,
          route: trip.leg?.route,
          progress: legProgress(trip, now),
        }
      }
      if (!d.online) return { driverId: d.id, pos: s.positions[d.id] ?? offsetKm({ lat: 24.72, lng: 46.68 }, ((d.avatarHue ?? 0) % 9) - 4, ((d.avatarHue ?? 0) % 7) - 3), heading: 0, status: 'offline' as const, classId }
      if (d.appUser || d.sim === undefined) return { driverId: d.id, pos: s.positions[d.id] ?? { lat: 24.7372, lng: 46.6598 }, heading: 0, status: 'available' as const, classId }
      return simulateUnit(d, classId, now)
    })
}

export function legProgress(t: Trip, now: number) {
  if (!t.leg) return 0
  return Math.min(1, Math.max(0, (now - t.leg.startedAt) / t.leg.durationMs))
}

export function tripDriverPose(t: Trip, now: number): { pos: LatLng; heading: number } {
  if (t.leg) return pointAlong(t.leg.route, legProgress(t, now))
  if (t.status === 'driver_arrived') return { pos: t.pickup.pos, heading: 0 }
  if (t.status === 'completed') return { pos: t.dropoff.pos, heading: 0 }
  return { pos: t.driverStartPos ?? t.pickup.pos, heading: 0 }
}

/** Remaining real-world minutes on the current leg (for ETA display). */
export function legEtaMinutes(t: Trip, now: number) {
  if (!t.leg) return 0
  return Math.max(0, Math.ceil(t.leg.realMinutes * (1 - legProgress(t, now))))
}

export function nearbyAvailable(p: LatLng, now: number, radiusKm = 6) {
  return fleetSnapshot(now).filter((u) => u.status === 'available' && haversineKm(u.pos, p) <= radiusKm)
}

export function earningsFor(driverId: string, from: number, to = Date.now()) {
  const trips = store.allTrips().filter((t) => t.driverId === driverId && t.createdAt >= from && t.createdAt <= to)
  const done = trips.filter((t) => t.status === 'completed')
  const gross = done.reduce((a, t) => a + t.fare.subtotal, 0)
  const commission = done.reduce((a, t) => a + t.fare.commission, 0)
  const tips = done.reduce((a, t) => a + (t.passengerRating?.tip ?? 0), 0)
  const net = gross - commission + tips
  const cash = done.filter((t) => t.paymentMethod === 'cash').reduce((a, t) => a + t.fare.total, 0)
  return { trips: done, cancelled: trips.filter((t) => t.status === 'cancelled'), gross, commission, tips, net, cash, count: done.length }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */

function pushTimeline(t: Trip, status: TripStatus, actor: Actor, note?: string) {
  t.status = status
  t.updatedAt = Date.now()
  t.timeline.push({ status, at: t.updatedAt, actor, note })
}

function legFor(kind: 'approach' | 'ride', from: LatLng, to: LatLng, speed: number) {
  const route = routeBetween(from, to)
  const km = Math.max(0.8, roadKm(route))
  const realMinutes = kind === 'approach' ? Math.max(2, Math.round((km / 32) * 60)) : minutesFor(km)
  const durationMs = Math.min(110_000, Math.max(14_000, (realMinutes * 60_000) / Math.max(1, speed)))
  return { kind, route, startedAt: Date.now(), durationMs, realMinutes }
}

function audit(s: EcoState, e: Omit<AuditEntry, 'id' | 'at'>) {
  s.audit.unshift({ ...e, id: uid('au'), at: Date.now() })
  if (s.audit.length > 400) s.audit.length = 400
}

function transition(tripId: string, to: TripStatus, actor: Actor, patch?: (t: Trip, s: EcoState) => void, note?: string): boolean {
  const cur = store.state.trips.find((t) => t.id === tripId)
  if (!cur || !canTransition(cur.status, to, actor)) return false
  store.commit((s) => {
    const t = s.trips.find((x) => x.id === tripId)!
    pushTimeline(t, to, actor, note)
    patch?.(t, s)
  })
  return true
}

export type TripRequest = {
  passengerId: string
  pickup: Place
  dropoff: Place
  classId: VehicleClassId
  payment: PaymentMethodId
  promoCode?: string
  cityId?: CityId
  scheduledFor?: number
}

export const actions = {
  /* ---------- Passenger ---------- */
  requestTrip(req: TripRequest): { ok: true; trip: Trip } | { ok: false; error: 'restricted' | 'out_of_service' | 'blocked' | 'active_exists' } {
    const cust = getCustomer(req.passengerId)
    if (cust?.status === 'blocked') return { ok: false, error: 'blocked' }
    if (store.state.trips.some((t) => t.passengerId === req.passengerId && isActive(t.status))) return { ok: false, error: 'active_exists' }
    const z = zoneAt(req.pickup.pos, req.cityId ?? 'riyadh')
    if (z.restricted) return { ok: false, error: 'restricted' }
    if (!z.inService) return { ok: false, error: 'out_of_service' }
    const now = Date.now()
    const fare = quoteTrip(req.pickup, req.dropoff, req.classId, req.promoCode, req.cityId)
    const trip: Trip = {
      id: newTripId(now),
      status: 'searching',
      cityId: req.cityId ?? 'riyadh',
      vehicleClass: req.classId,
      pickup: req.pickup,
      dropoff: req.dropoff,
      passengerId: req.passengerId,
      otp: newOtp(),
      fare,
      paymentMethod: req.payment,
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'searching', at: now, actor: 'passenger' }],
      scheduledFor: req.scheduledFor,
    }
    store.commit((s) => {
      s.trips.unshift(trip)
      if (fare.promoCode) {
        const p = s.promos.find((x) => x.code === fare.promoCode)
        if (p) p.used += 1
      }
    })
    return { ok: true, trip }
  },

  cancelTrip(tripId: string, actor: Actor, reason: string) {
    return transition(tripId, 'cancelled', actor, (t, s) => {
      t.cancel = { by: actor, reason, at: Date.now() }
      t.offer = undefined
      if (t.driverId) {
        const pose = tripDriverPose(t, Date.now())
        s.positions[t.driverId] = pose.pos
      }
      t.leg = undefined
    }, reason)
  },

  rateDriver(tripId: string, rating: TripRating) {
    store.commit((s) => {
      const t = s.trips.find((x) => x.id === tripId)
      if (!t) return
      t.passengerRating = rating
      const d = s.drivers.find((x) => x.id === t.driverId)
      if (d) {
        d.rating = Math.round(((d.rating * d.ratingsCount + rating.stars) / (d.ratingsCount + 1)) * 100) / 100
        d.ratingsCount += 1
      }
    })
  },

  registerCustomer(input: { name: { ar: string; en: string }; phone: string; email?: string }): string {
    const id = `cus-${String(store.state.customers.length + 1).padStart(3, '0')}`
    store.commit((s) => {
      s.customers.push({ id, name: input.name, phone: input.phone, email: input.email, cityId: 'riyadh', status: 'active', joinedAt: Date.now(), rating: 5, walletBalance: 0, tier: 'standard', saved: { others: [] } })
      audit(s, { actor: input.name.en || input.name.ar, role: 'passenger', action: 'customer.signup', target: id })
    })
    return id
  },

  sendChat(tripId: string, from: 'passenger' | 'driver', text: string) {
    if (!text.trim()) return
    store.commit((s) => {
      const t = s.trips.find((x) => x.id === tripId)
      if (t) t.chat = [...(t.chat ?? []), { from, text: text.trim(), at: Date.now() }]
    })
  },

  scheduleRide(r: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'estimate'>) {
    const estimate = quoteTrip(r.pickup, r.dropoff, r.vehicleClass).total
    store.commit((s) => {
      s.reservations.unshift({ ...r, id: uid('rsv'), createdAt: Date.now(), status: 'scheduled', estimate })
    })
  },

  cancelReservation(id: string) {
    store.commit((s) => {
      const r = s.reservations.find((x) => x.id === id)
      if (r) r.status = 'cancelled'
    })
  },

  saveCustomerPlace(customerId: string, slot: 'home' | 'work' | 'other', place: Place) {
    store.commit((s) => {
      const c = s.customers.find((x) => x.id === customerId)
      if (!c) return
      if (slot === 'other') c.saved.others = [place, ...c.saved.others.filter((p) => p.id !== place.id)].slice(0, 8)
      else c.saved[slot] = place
    })
  },

  updateCustomer(customerId: string, patch: Partial<Pick<Customer, 'name' | 'email' | 'phone'>>) {
    store.commit((s) => {
      const c = s.customers.find((x) => x.id === customerId)
      if (c) Object.assign(c, patch)
    })
  },

  topUpWallet(customerId: string, amount: number) {
    store.commit((s) => {
      const c = s.customers.find((x) => x.id === customerId)
      if (c) c.walletBalance += amount
    })
  },

  createTicket(t: { requester: Ticket['requester']; subject: string; category: Ticket['category']; tripId?: string; text: string; priority?: Ticket['priority'] }) {
    const now = Date.now()
    const ticket: Ticket = {
      id: `TCK-${4200 + store.state.tickets.length}`,
      subject: t.subject,
      category: t.category,
      status: 'open',
      priority: t.priority ?? (t.category === 'safety' ? 'urgent' : 'normal'),
      createdAt: now,
      updatedAt: now,
      requester: t.requester,
      tripId: t.tripId,
      messages: [{ from: t.requester.kind, text: t.text, at: now }],
    }
    store.commit((s) => {
      s.tickets.unshift(ticket)
    })
    return ticket
  },

  /* ---------- Driver ---------- */
  setOnline(driverId: string, online: boolean) {
    store.commit((s) => {
      const d = s.drivers.find((x) => x.id === driverId)
      if (d && d.status === 'approved') d.online = online
    })
  },

  acceptOffer(tripId: string, driverId: string) {
    const t = store.state.trips.find((x) => x.id === tripId)
    if (!t || t.status !== 'searching' || t.offer?.driverId !== driverId || t.offer.expiresAt < Date.now()) return false
    return transition(tripId, 'driver_assigned', 'driver', (trip, s) => assign(trip, s, driverId))
  },

  declineOffer(tripId: string, driverId: string) {
    store.commit((s) => {
      const t = s.trips.find((x) => x.id === tripId)
      if (!t || t.offer?.driverId !== driverId) return
      t.offer = { driverId: '', expiresAt: 0, declined: [...t.offer.declined, driverId] }
      const d = s.drivers.find((x) => x.id === driverId)
      if (d) d.acceptanceRate = Math.max(0, Math.round((d.acceptanceRate - 0.002) * 1000) / 1000)
    })
  },

  markArrived(tripId: string, actor: Actor = 'driver') {
    return transition(tripId, 'driver_arrived', actor, (t) => {
      t.leg = undefined
    })
  },

  /** Captain enters the rider's 4-digit code. Returns false on mismatch. */
  startTrip(tripId: string, otp: string | null, actor: Actor = 'driver') {
    const t = store.state.trips.find((x) => x.id === tripId)
    if (!t) return false
    if (store.state.settings.requireOtp && actor === 'driver' && otp !== t.otp) return false
    return transition(tripId, 'in_progress', actor, (trip, s) => {
      trip.leg = legFor('ride', trip.pickup.pos, trip.dropoff.pos, s.settings.demoSpeed)
    }, actor === 'driver' ? 'OTP verified' : undefined)
  },

  completeTrip(tripId: string, actor: Actor = 'driver') {
    return transition(tripId, 'completed', actor, (t, s) => {
      t.leg = undefined
      if (t.driverId) s.positions[t.driverId] = t.dropoff.pos
      if (t.paymentMethod === 'wallet') {
        const c = s.customers.find((x) => x.id === t.passengerId)
        if (c) c.walletBalance = Math.max(0, c.walletBalance - t.fare.total)
      }
    })
  },

  rateRider(tripId: string, rating: TripRating) {
    store.commit((s) => {
      const t = s.trips.find((x) => x.id === tripId)
      if (t) t.driverRating = rating
    })
  },

  /** New captain application from the Driver app. */
  submitDriverApplication(app: {
    name: { ar: string; en: string }
    phone: string
    nationalId: string
    email?: string
    cityId: CityId
    docs: DriverDoc[]
    vehicle: Omit<Vehicle, 'id' | 'status' | 'driverId'>
  }): string {
    const n = store.state.drivers.length + 1
    const id = `cap-${String(n).padStart(3, '0')}`
    const vid = `veh-${String(n).padStart(3, '0')}`
    store.commit((s) => {
      s.vehicles.push({ ...app.vehicle, id: vid, status: 'active', driverId: id })
      s.drivers.push({
        id,
        name: app.name,
        phone: app.phone,
        nationalId: app.nationalId,
        email: app.email,
        cityId: app.cityId,
        status: 'pending_review',
        online: false,
        rating: 5,
        ratingsCount: 0,
        joinedAt: Date.now(),
        vehicleId: vid,
        docs: app.docs,
        acceptanceRate: 1,
        cancellationRate: 0,
        punctuality: 1,
        appUser: true,
        avatarHue: Math.floor(Math.random() * 360),
      })
      audit(s, { actor: app.name.en || app.name.ar, role: 'driver', action: 'driver.apply', target: id })
    })
    return id
  },

  /* ---------- Admin ---------- */
  adminCancelTrip(tripId: string, reason: string, admin: AdminUser) {
    const ok = actions.cancelTrip(tripId, 'admin', reason)
    if (ok) store.commit((s) => audit(s, { actor: admin.name, role: admin.role, action: 'trip.cancel', target: tripId, detail: reason }))
    return ok
  },

  setDriverStatus(driverId: string, status: Driver['status'], admin: AdminUser, reason?: string) {
    store.commit((s) => {
      const d = s.drivers.find((x) => x.id === driverId)
      if (!d) return
      d.status = status
      d.rejectionReason = status === 'rejected' ? reason : undefined
      if (status !== 'approved') d.online = false
      if (status === 'approved') d.docs = d.docs.map((x) => ({ ...x, status: x.status === 'rejected' ? 'rejected' : 'approved' }))
      audit(s, { actor: admin.name, role: admin.role, action: `driver.${status}`, target: driverId, detail: reason })
    })
  },

  setDocStatus(driverId: string, docId: DriverDoc['id'], status: DriverDoc['status'], admin: AdminUser) {
    store.commit((s) => {
      const d = s.drivers.find((x) => x.id === driverId)
      const doc = d?.docs.find((x) => x.id === docId)
      if (doc) doc.status = status
      audit(s, { actor: admin.name, role: admin.role, action: `document.${status}`, target: `${driverId}/${docId}` })
    })
  },

  addDriver(admin: AdminUser, input: { name: { ar: string; en: string }; phone: string; nationalId: string; cityId: CityId; vehicle: Omit<Vehicle, 'id' | 'status' | 'driverId'> }) {
    const id = actions.submitDriverApplication({ ...input, docs: (['national_id', 'license', 'registration', 'insurance', 'photo'] as const).map((x) => ({ id: x, status: 'missing' as const })) })
    store.commit((s) => {
      const d = s.drivers.find((x) => x.id === id)
      if (d) {
        d.appUser = false
        d.status = 'incomplete'
      }
      audit(s, { actor: admin.name, role: admin.role, action: 'driver.create', target: id })
    })
    return id
  },

  setCustomerStatus(customerId: string, status: Customer['status'], admin: AdminUser, reason?: string) {
    store.commit((s) => {
      const c = s.customers.find((x) => x.id === customerId)
      if (!c) return
      c.status = status
      c.blockReason = status === 'blocked' ? reason : undefined
      audit(s, { actor: admin.name, role: admin.role, action: `customer.${status === 'blocked' ? 'block' : 'activate'}`, target: customerId, detail: reason })
    })
  },

  updateVehicle(vehicleId: string, patch: Partial<Vehicle>, admin: AdminUser) {
    store.commit((s) => {
      const v = s.vehicles.find((x) => x.id === vehicleId)
      if (!v) return
      if (patch.driverId !== undefined && patch.driverId !== v.driverId) {
        // unlink previous holder, link new one
        s.drivers.forEach((d) => {
          if (d.vehicleId === vehicleId) d.vehicleId = undefined
        })
        const nd = s.drivers.find((d) => d.id === patch.driverId)
        if (nd) {
          s.vehicles.forEach((x) => {
            if (x.id !== vehicleId && x.driverId === nd.id) x.driverId = undefined
          })
          nd.vehicleId = vehicleId
        }
      }
      Object.assign(v, patch)
      audit(s, { actor: admin.name, role: admin.role, action: 'vehicle.update', target: vehicleId, detail: Object.keys(patch).join(', ') })
    })
  },

  updateTariff(cityId: CityId, classId: VehicleClassId, patch: Partial<ClassTariff>, admin: AdminUser) {
    const before = store.state.pricing.cities[cityId][classId]
    const changes = (Object.keys(patch) as (keyof ClassTariff)[])
      .filter((k) => patch[k] !== undefined && patch[k] !== before[k])
      .map((k) => `${k} ${before[k]} → ${patch[k]}`)
    if (!changes.length) return
    store.commit((s) => {
      Object.assign(s.pricing.cities[cityId][classId], patch)
      audit(s, { actor: admin.name, role: admin.role, action: 'pricing.update', target: `${cityId} · ${classId}`, detail: changes.join('; ') })
    })
  },

  setVat(rate: number, admin: AdminUser) {
    store.commit((s) => {
      const prev = s.pricing.vatRate
      s.pricing.vatRate = rate
      audit(s, { actor: admin.name, role: admin.role, action: 'tax.update', target: 'VAT', detail: `${prev} → ${rate}` })
    })
  },

  upsertZone(z: Zone, admin: AdminUser) {
    store.commit((s) => {
      const i = s.zones.findIndex((x) => x.id === z.id)
      if (i >= 0) s.zones[i] = z
      else s.zones.push(z)
      audit(s, { actor: admin.name, role: admin.role, action: i >= 0 ? 'zone.update' : 'zone.create', target: z.name.en })
    })
  },

  deleteZone(id: string, admin: AdminUser) {
    store.commit((s) => {
      const z = s.zones.find((x) => x.id === id)
      s.zones = s.zones.filter((x) => x.id !== id)
      audit(s, { actor: admin.name, role: admin.role, action: 'zone.delete', target: z?.name.en })
    })
  },

  upsertPromo(p: Promo, admin: AdminUser) {
    store.commit((s) => {
      const i = s.promos.findIndex((x) => x.id === p.id)
      if (i >= 0) s.promos[i] = p
      else s.promos.unshift(p)
      audit(s, { actor: admin.name, role: admin.role, action: i >= 0 ? 'promo.update' : 'promo.create', target: p.code })
    })
  },

  sendCampaign(c: Campaign, admin: AdminUser) {
    const now = Date.now()
    store.commit((s) => {
      const audienceSize = c.audience === 'captains' ? s.drivers.length : c.audience === 'passengers' ? s.customers.length : s.drivers.length + s.customers.length
      const sent: Campaign = { ...c, status: 'sent', sentAt: now, metrics: { sent: audienceSize, opened: 0, converted: 0 } }
      const i = s.campaigns.findIndex((x) => x.id === c.id)
      if (i >= 0) s.campaigns[i] = sent
      else s.campaigns.unshift(sent)
      s.inbox.unshift({ id: uid('in'), to: c.audience, title: c.title, body: c.body, at: now })
      audit(s, { actor: admin.name, role: admin.role, action: 'campaign.send', target: c.name, detail: `${audienceSize} recipients` })
    })
  },

  saveCampaignDraft(c: Campaign, admin: AdminUser) {
    store.commit((s) => {
      const i = s.campaigns.findIndex((x) => x.id === c.id)
      if (i >= 0) s.campaigns[i] = c
      else s.campaigns.unshift(c)
      audit(s, { actor: admin.name, role: admin.role, action: 'campaign.save', target: c.name })
    })
  },

  replyTicket(ticketId: string, msg: Omit<TicketMessage, 'at'>, status?: Ticket['status'], admin?: AdminUser) {
    store.commit((s) => {
      const t = s.tickets.find((x) => x.id === ticketId)
      if (!t) return
      if (msg.text.trim()) t.messages.push({ ...msg, at: Date.now() })
      if (status) t.status = status
      if (admin && !t.assignee) t.assignee = admin.name
      t.updatedAt = Date.now()
      if (admin) audit(s, { actor: admin.name, role: admin.role, action: status ? `ticket.${status}` : 'ticket.reply', target: ticketId })
    })
  },

  updateTicket(ticketId: string, patch: Partial<Pick<Ticket, 'status' | 'priority' | 'assignee'>>, admin: AdminUser) {
    store.commit((s) => {
      const t = s.tickets.find((x) => x.id === ticketId)
      if (!t) return
      Object.assign(t, patch)
      t.updatedAt = Date.now()
      audit(s, { actor: admin.name, role: admin.role, action: 'ticket.update', target: ticketId, detail: JSON.stringify(patch) })
    })
  },

  settleDriver(driverId: string, amount: number, admin: AdminUser) {
    store.commit((s) => {
      s.payouts.unshift({ id: uid('po'), driverId, amount, at: Date.now(), status: 'processing', reference: `PO-${Math.floor(Math.random() * 900000 + 100000)}` })
      audit(s, { actor: admin.name, role: admin.role, action: 'payout.create', target: driverId, detail: `${(amount / 100).toFixed(2)} SAR` })
    })
  },

  refundTrip(tripId: string, amount: number, reason: string, admin: AdminUser) {
    const r: Refund = { id: uid('rf'), tripId, amount, at: Date.now(), reason, by: admin.name }
    store.commit((s) => {
      s.refunds.unshift(r)
      audit(s, { actor: admin.name, role: admin.role, action: 'refund.create', target: tripId, detail: `${(amount / 100).toFixed(2)} SAR · ${reason}` })
    })
  },

  setRolePermissions(role: AdminRole, perms: Permission[], admin: AdminUser) {
    if (role === 'super_admin') return
    store.commit((s) => {
      s.rolePerms[role] = perms
      audit(s, { actor: admin.name, role: admin.role, action: 'role.update', target: role, detail: `${perms.length} permissions` })
    })
  },

  upsertAdmin(u: AdminUser, admin: AdminUser) {
    store.commit((s) => {
      const i = s.admins.findIndex((x) => x.id === u.id)
      if (i >= 0) s.admins[i] = u
      else s.admins.push(u)
      audit(s, { actor: admin.name, role: admin.role, action: i >= 0 ? 'user.update' : 'user.create', target: u.email, detail: u.role })
    })
  },

  updateSettings(patch: Partial<Settings>, admin: AdminUser, what: string) {
    store.commit((s) => {
      s.settings = { ...s.settings, ...patch }
      audit(s, { actor: admin.name, role: admin.role, action: 'settings.update', target: what })
    })
  },

  logAdmin(admin: AdminUser, action: string, target?: string, detail?: string) {
    store.commit((s) => audit(s, { actor: admin.name, role: admin.role, action, target, detail }))
  },

  resetDemo() {
    store.reset()
  },
}

function assign(trip: Trip, s: EcoState, driverId: string) {
  const now = Date.now()
  const d = s.drivers.find((x) => x.id === driverId)!
  let start: LatLng
  if (d.sim !== undefined && !d.appUser) {
    const v = s.vehicles.find((x) => x.id === d.vehicleId)
    start = simulateUnit(d, v?.classId ?? 'go', now).pos
    // keep the simulated captain close enough for a realistic pickup ETA
    if (haversineKm(start, trip.pickup.pos) > 4.5) start = offsetKm(trip.pickup.pos, 1.6, -1.2)
  } else {
    start = s.positions[driverId] ?? offsetKm(trip.pickup.pos, 1.4, 1)
  }
  trip.driverId = driverId
  trip.offer = undefined
  trip.driverStartPos = start
  trip.leg = legFor('approach', start, trip.pickup.pos, s.settings.demoSpeed)
}

/* ------------------------------------------------------------------ */
/* Dispatcher: matching, offers, and auto-progress for simulated captains.
 * Runs in exactly one tab at a time (Web Locks leader election) so the
 * three apps never double-assign a trip. */

let dispatcherStarted = false

export function startDispatcher() {
  if (dispatcherStarted || typeof window === 'undefined') return
  dispatcherStarted = true
  const run = () => {
    const id = setInterval(tick, 1000)
    tick()
    return id
  }
  const nav = navigator as Navigator & { locks?: { request: (n: string, cb: () => Promise<void>) => Promise<void> } }
  if (nav.locks?.request) {
    nav.locks.request('aura-dispatcher', () => {
      run()
      return new Promise<void>(() => {}) // hold the lock while this tab lives
    })
  } else {
    run()
  }
}

function tick() {
  const now = Date.now()
  const s = store.state
  const busy = busyDriverIds()
  for (const t of s.trips) {
    if (t.status === 'searching') {
      const age = now - t.createdAt
      if (age > s.settings.searchTimeoutSec * 1000) {
        actions.cancelTrip(t.id, 'system', 'No captains available')
        continue
      }
      const declined = t.offer?.declined ?? []
      // 1) offer to an online captain using the Driver app (real interaction)
      if (!t.offer?.driverId || t.offer.expiresAt < now) {
        if (t.offer?.driverId && t.offer.expiresAt < now) {
          // expired → counts as a decline
          store.commit((st) => {
            const x = st.trips.find((y) => y.id === t.id)
            if (x?.offer) x.offer = { driverId: '', expiresAt: 0, declined: [...x.offer.declined, x.offer.driverId] }
          })
          continue
        }
        const candidate = s.drivers.find((d) => {
          if (!d.appUser || !d.online || d.status !== 'approved' || busy.has(d.id) || declined.includes(d.id)) return false
          const v = getVehicle(d.vehicleId)
          return !!v && SERVES[v.classId].includes(t.vehicleClass)
        })
        if (candidate) {
          store.commit((st) => {
            const x = st.trips.find((y) => y.id === t.id)
            if (x) x.offer = { driverId: candidate.id, expiresAt: now + st.settings.offerSeconds * 1000, declined }
          })
          continue
        }
        // 2) no app captain → a simulated captain accepts (demo auto-dispatch)
        const waitedLongEnough = age > 6000 || declined.length > 0
        if (s.settings.autoDispatch && waitedLongEnough) {
          const units = fleetSnapshot(now)
            .filter((u) => u.status === 'available' && !busy.has(u.driverId))
            .filter((u) => {
              const d = getDriver(u.driverId)
              return d && !d.appUser && SERVES[u.classId].includes(t.vehicleClass)
            })
            .sort((a, b) => haversineKm(a.pos, t.pickup.pos) - haversineKm(b.pos, t.pickup.pos))
          const pick = units[0]
          if (pick) transition(t.id, 'driver_assigned', 'system', (trip, st) => assign(trip, st, pick.driverId), 'Auto-dispatch (demo)')
        }
      }
      continue
    }
    const d = getDriver(t.driverId)
    const simulated = d && !d.appUser
    if (t.status === 'driver_assigned' && now - t.updatedAt > 2500) {
      transition(t.id, 'driver_arriving', 'system')
      continue
    }
    if (!simulated) continue
    if (t.status === 'driver_arriving' && legProgress(t, now) >= 1) actions.markArrived(t.id, 'system')
    else if (t.status === 'driver_arrived' && now - t.updatedAt > 7000) actions.startTrip(t.id, null, 'system')
    else if (t.status === 'in_progress' && legProgress(t, now) >= 1) actions.completeTrip(t.id, 'system')
  }
}

/* Session (which account each app is signed in as). Kept per-browser. */
const SKEY = 'aura.session.v1'
type Session = { passengerId?: string; driverId?: string; adminId?: string; adminVerified?: boolean }

export function getSession(): Session {
  try {
    return JSON.parse(localStorage.getItem(SKEY) ?? '{}') as Session
  } catch {
    return {}
  }
}
export function setSession(patch: Partial<Session>) {
  const next = { ...getSession(), ...patch }
  try {
    localStorage.setItem(SKEY, JSON.stringify(next))
  } catch {
    /* noop */
  }
  return next
}
export function clearSession(keys: (keyof Session)[]) {
  const s = getSession()
  keys.forEach((k) => delete s[k])
  try {
    localStorage.setItem(SKEY, JSON.stringify(s))
  } catch {
    /* noop */
  }
}

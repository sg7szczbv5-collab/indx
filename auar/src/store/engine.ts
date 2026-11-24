/**
 * AUAR business engine: pure functions over State, shared by the browser (local/demo mode)
 * and the Node server (production mode). No React, DOM or storage access here.
 */
import { along, dist, kmToMin, route, routeKm, type Point } from '../lib/geo'
import { commissionOf, quote } from '../lib/pricing'
import { pin4, uid } from '../lib/format'
import { makeDriver } from './seed'
import type { CategoryId, Driver, Loc, PaymentMethod, Settings, State, Trip, Category, Promo, Rider, Payment } from './types'

export type Role = 'rider' | 'driver' | 'admin'
export interface Actor {
  role: Role
  riderId?: string
  driverId?: string
  phone?: string
}

/* ───────────── derived helpers ───────────── */

export const ACTIVE: Trip['status'][] = ['searching', 'accepted', 'arrived', 'in_progress']
export const isLive = (t: Trip) => ACTIVE.includes(t.status)

/** `speed` compresses trip minutes for demos; production uses 1 (real time). */
export const approachMs = (t: Trip, s: Settings) => (kmToMin(routeKm(t.approach)) * 60000) / s.speed
export const tripMs = (t: Trip, s: Settings) => (t.durationMin * 60000) / s.speed

export function tripProgress(t: Trip, s: Settings, now: number) {
  if (t.status === 'accepted' && t.acceptedAt) return Math.min(1, (now - t.acceptedAt) / Math.max(1, approachMs(t, s)))
  if (t.status === 'in_progress' && t.startedAt) return Math.min(1, (now - t.startedAt) / Math.max(1, tripMs(t, s)))
  if (t.status === 'arrived' || t.status === 'completed') return 1
  return 0
}

/** ETA in real minutes. */
export function etaMin(t: Trip, s: Settings, now: number) {
  const p = tripProgress(t, s, now)
  if (t.status === 'accepted') return Math.max(1, Math.ceil(kmToMin(routeKm(t.approach)) * (1 - p)))
  if (t.status === 'in_progress') return Math.max(1, Math.ceil(t.durationMin * (1 - p)))
  return 0
}

const hashId = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h % 1000)
}

export function driverPose(d: Driver, s: State, now: number): { p: Point; a: number } {
  const t = s.trips.find((x) => x.driverId === d.id && (x.status === 'accepted' || x.status === 'arrived' || x.status === 'in_progress'))
  if (t && t.approach.length) {
    if (t.status === 'accepted') return along(t.approach, tripProgress(t, s.settings, now))
    if (t.status === 'arrived') return along(t.approach, 1)
    return along(t.path, tripProgress(t, s.settings, now))
  }
  if (!d.online || !d.bot) return { p: d.pos, a: d.heading }
  // simulated drivers cruise gently along their own street
  const seedN = hashId(d.id)
  const w = Math.sin(now / 9000 + seedN) * 28
  const vertical = d.pos.x % 100 === 0
  const dw = Math.cos(now / 9000 + seedN)
  return vertical ? { p: { x: d.pos.x, y: d.pos.y + w }, a: dw >= 0 ? 90 : -90 } : { p: { x: d.pos.x + w, y: d.pos.y }, a: dw >= 0 ? 0 : 180 }
}

export const busyDriverIds = (s: State) =>
  new Set(s.trips.filter((t) => ['accepted', 'arrived', 'in_progress'].includes(t.status) && t.driverId).map((t) => t.driverId!))

export const offeredDriverIds = (s: State) => new Set(s.trips.filter((t) => t.status === 'searching' && t.offeredTo).map((t) => t.offeredTo!))

export function nearbyFor(s: State, p: Point, cat: CategoryId, now: number) {
  const busy = busyDriverIds(s)
  return s.drivers
    .filter((d) => d.status === 'active' && d.online && !busy.has(d.id) && d.categories.includes(cat) && (d.bot ? s.settings.autoBots : true))
    .map((d) => ({ d, km: (dist(driverPose(d, s, now).p, p) * 2) / 100 }))
    .sort((a, b) => a.km - b.km)
}

export const findPromo = (s: State, code?: string) => (code ? s.promos.find((p) => p.code.toUpperCase() === code.toUpperCase()) : undefined)

export const fareFor = (s: State, cat: Category, km: number, min: number, promoCode?: string) => quote(cat, km, min, s.settings, findPromo(s, promoCode))

function log(s: State, text: string) {
  s.log.unshift({ at: Date.now(), text })
  s.log = s.log.slice(0, 200)
}

export function pay(s: State, p: Omit<Payment, 'id' | 'at'> & { at?: number }) {
  s.payments.unshift({ id: uid('P'), at: Date.now(), ...p })
  s.payments = s.payments.slice(0, 2000)
}

const me = (s: State) => s.riders.find((r) => r.id === s.me.riderId)
const meDriver = (s: State) => s.drivers.find((d) => d.id === s.me.driverId)

/* ───────────── mutations (each runs on a draft; `s.me` is the acting user) ───────────── */

function acceptInto(s: State, t: Trip, d: Driver, now: number) {
  const from = driverPose(d, s, now).p
  d.pos = from
  t.driverId = d.id
  t.status = 'accepted'
  t.acceptedAt = now
  t.offeredTo = undefined
  t.approach = route(from, t.pickup.p)
  if (t.approach.length < 2) t.approach = [t.pickup.p, t.pickup.p]
}

function completeInto(s: State, t: Trip, now: number) {
  t.status = 'completed'
  t.completedAt = now
  t.commission = commissionOf(t.fare, s.settings)
  const d = s.drivers.find((x) => x.id === t.driverId)
  const r = s.riders.find((x) => x.id === t.riderId)
  if (r && t.payment === 'wallet') r.wallet = Math.round((r.wallet - t.fare) * 100) / 100
  if (d) {
    d.pos = t.dropoff.p
    // cash: the driver keeps the fare and owes commission; otherwise AUAR pays the driver's share
    d.balance = Math.round((d.balance + (t.payment === 'cash' ? -t.commission : t.fare - t.commission)) * 100) / 100
  }
  pay(s, { kind: 'trip', tripId: t.id, riderId: t.riderId, driverId: t.driverId, method: t.payment, amount: t.fare, status: 'paid', provider: t.payment === 'cash' ? 'cash' : 'internal' })
}

export const actions = {
  /* rider */
  signInRider(s: State, name: string, phone: string) {
    const r = me(s)
    if (!r) return
    if (name.trim()) r.name = name.trim()
    if (phone.trim()) r.phone = phone.trim()
    s.me.riderSignedIn = true
  },
  signOutRider(s: State) {
    s.me.riderSignedIn = false
  },
  updateRider(s: State, patch: Partial<Pick<Rider, 'name' | 'email' | 'gender' | 'defaultPayment' | 'emergencyName' | 'emergencyPhone'>>) {
    const r = me(s)
    if (!r) return
    const allowed = ['name', 'email', 'gender', 'defaultPayment', 'emergencyName', 'emergencyPhone'] as const
    for (const k of allowed) if (k in patch) (r as unknown as Record<string, unknown>)[k] = patch[k]
  },
  requestTrip(s: State, o: { pickup: Loc; dropoff: Loc; category: CategoryId; payment: PaymentMethod; promo?: string; scheduledFor?: number; note?: string; forOther?: string }): string | null {
    const r = me(s)
    if (!r || r.blocked) return null
    if (s.trips.some((t) => t.riderId === r.id && isLive(t))) return null
    const cat = s.categories.find((c) => c.id === o.category && c.enabled)
    if (!cat) return null
    if (cat.id === 'her' && r.gender !== 'f') return null
    const path = route(o.pickup.p, o.dropoff.p)
    const km = routeKm(path)
    const min = kmToMin(km)
    const promo = findPromo(s, o.promo)
    const q = quote(cat, km, min, s.settings, promo)
    if (o.payment === 'wallet' && r.wallet < q.fare) return null
    if (promo && q.discount > 0) promo.uses++
    const id = uid('T')
    const now = Date.now()
    s.trips.unshift({
      id,
      riderId: r.id,
      category: cat.id,
      pickup: o.pickup,
      dropoff: o.dropoff,
      path,
      approach: [],
      distanceKm: km,
      durationMin: min,
      fare: q.fare,
      surge: q.surge,
      discount: q.discount,
      promo: q.discount > 0 ? promo?.code : undefined,
      tip: 0,
      payment: o.payment,
      status: o.scheduledFor && o.scheduledFor > now ? 'scheduled' : 'searching',
      pin: pin4(),
      requestedAt: now,
      scheduledFor: o.scheduledFor,
      chat: [],
      declined: [],
      commission: 0,
      note: o.note?.slice(0, 200),
      forOther: o.forOther,
    })
    return id
  },
  cancelTrip(s: State, id: string, by: Trip['cancelledBy'], reason: string) {
    const t = s.trips.find((x) => x.id === id)
    if (!t || !(isLive(t) || t.status === 'scheduled')) return
    if (by === 'rider' && t.riderId !== s.me.riderId) return
    if (by === 'driver' && (t.driverId !== s.me.driverId || !t.driverId)) return
    const now = Date.now()
    const drv = t.driverId ? s.drivers.find((x) => x.id === t.driverId) : undefined
    if (drv) drv.pos = driverPose(drv, s, now).p
    t.status = 'cancelled'
    t.cancelledAt = now
    t.cancelledBy = by
    t.cancelReason = reason.slice(0, 200)
    t.offeredTo = undefined
    if (by === 'rider' && t.acceptedAt && drv && now - t.acceptedAt > s.settings.freeCancelSec * 1000) {
      t.cancelFee = s.settings.cancelFee
      drv.balance += t.cancelFee * (1 - s.settings.commission)
      const r = s.riders.find((x) => x.id === t.riderId)
      if (r && t.payment === 'wallet') r.wallet -= t.cancelFee
      pay(s, { kind: 'cancel_fee', tripId: t.id, riderId: t.riderId, driverId: drv.id, method: t.payment, amount: t.cancelFee, status: 'paid', provider: t.payment === 'cash' ? 'cash' : 'internal' })
    }
    log(s, `أُلغيت الرحلة ${t.id} بواسطة ${by === 'rider' ? 'الراكب' : by === 'driver' ? 'الكابتن' : by === 'admin' ? 'الإدارة' : 'النظام'}`)
  },
  sendChat(s: State, id: string, from: 'rider' | 'driver', text: string) {
    const t = s.trips.find((x) => x.id === id)
    if (!t || !text.trim()) return
    if (from === 'rider' && t.riderId !== s.me.riderId) return
    if (from === 'driver' && t.driverId !== s.me.driverId) return
    t.chat.push({ from, text: text.trim().slice(0, 500), at: Date.now() })
  },
  rateTrip(s: State, id: string, rating: number, comment: string, tip: number) {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.riderId !== s.me.riderId || t.status !== 'completed' || t.riderRating) return
    t.riderRating = Math.max(1, Math.min(5, Math.round(rating)))
    t.riderComment = comment.slice(0, 300)
    t.tip = t.payment === 'cash' ? 0 : Math.max(0, Math.min(200, tip))
    const d = s.drivers.find((x) => x.id === t.driverId)
    if (d) {
      d.rating = Math.round(((d.rating * d.ratingsCount + t.riderRating) / (d.ratingsCount + 1)) * 100) / 100
      d.ratingsCount++
      d.balance += t.tip
    }
    if (t.tip > 0) pay(s, { kind: 'tip', tripId: t.id, riderId: t.riderId, driverId: t.driverId, method: t.payment, amount: t.tip, status: 'paid', provider: 'internal' })
  },
  setSOS(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (t && t.riderId === s.me.riderId) {
      t.sos = true
      log(s, `🚨 تنبيه طوارئ من الرحلة ${t.id}`)
    }
  },
  shareTrip(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (t && t.riderId === s.me.riderId) t.shared = true
  },
  /** Credits the wallet. In production this runs only after the payment provider confirms. */
  topUp(s: State, amount: number, provider: Payment['provider'] = 'internal', ref?: string) {
    const r = me(s)
    if (!r || !(amount > 0) || amount > 5000) return
    r.wallet = Math.round((r.wallet + amount) * 100) / 100
    pay(s, { kind: 'topup', riderId: r.id, method: 'card', amount, status: 'paid', provider, ref })
  },
  openTicket(s: State, by: 'rider' | 'driver', subject: string, text: string, tripId?: string) {
    const userId = by === 'rider' ? s.me.riderId : s.me.driverId
    if (!userId) return
    s.tickets.unshift({ id: uid('TK'), by, userId, tripId, subject: subject.slice(0, 120), messages: [{ from: 'user', text: text.slice(0, 2000), at: Date.now() }], status: 'open', at: Date.now() })
  },

  /* driver */
  signInDriver(s: State) {
    s.me.driverId = 'D100'
    s.me.driverSignedIn = true
  },
  signOutDriver(s: State) {
    const d = meDriver(s)
    if (d) d.online = false
    s.me.driverSignedIn = false
  },
  registerDriver(s: State, o: { name: string; phone: string; make: string; model: string; plate: string; year: number; color: string; gender: 'm' | 'f'; categories: CategoryId[] }): string {
    const d = makeDriver(s.drivers.length + 60, o.name.slice(0, 60), o.gender, false, { x: 300, y: 420 })
    d.id = uid('D')
    d.phone = o.phone
    d.car = { ...d.car, make: o.make.slice(0, 30), model: o.model.slice(0, 30), plate: o.plate.slice(0, 20), year: o.year, color: o.color.slice(0, 20) }
    d.categories = o.categories.filter((c) => c !== 'her' || o.gender === 'f')
    d.status = 'pending'
    d.online = false
    d.balance = 0
    d.rating = 5
    d.ratingsCount = 0
    d.joinedAt = Date.now()
    d.docs = { license: true, idCard: true, registration: true, insurance: true }
    s.drivers.push(d)
    s.me.driverId = d.id
    s.me.driverSignedIn = true
    log(s, `طلب انضمام كابتن جديد: ${d.name}`)
    return d.id
  },
  setOnline(s: State, on: boolean) {
    const d = meDriver(s)
    if (d && d.status === 'active') d.online = on
  },
  acceptOffer(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    const d = meDriver(s)
    if (!t || !d || t.status !== 'searching' || t.offeredTo !== d.id) return
    acceptInto(s, t, d, Date.now())
  },
  declineOffer(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.status !== 'searching' || t.offeredTo !== s.me.driverId) return
    t.declined.push(t.offeredTo)
    t.offeredTo = undefined
  },
  markArrived(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (t && t.status === 'accepted' && t.driverId === s.me.driverId) {
      t.status = 'arrived'
      t.arrivedAt = Date.now()
    }
  },
  startTrip(s: State, id: string, pin: string): boolean {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.status !== 'arrived' || t.driverId !== s.me.driverId || t.pin !== pin) return false
    t.status = 'in_progress'
    t.startedAt = Date.now()
    return true
  },
  completeTrip(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (t && t.status === 'in_progress' && t.driverId === s.me.driverId) completeInto(s, t, Date.now())
  },
  rateRider(s: State, id: string, rating: number) {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.driverId !== s.me.driverId || t.driverRating) return
    t.driverRating = Math.max(1, Math.min(5, Math.round(rating)))
    const r = s.riders.find((x) => x.id === t.riderId)
    if (r) r.rating = Math.round(((r.rating * 20 + t.driverRating) / 21) * 100) / 100
  },
  cashOut(s: State, amount: number) {
    const d = meDriver(s)
    if (d && amount > 0 && amount <= d.balance + 0.001) {
      d.balance = Math.round((d.balance - amount) * 100) / 100
      pay(s, { kind: 'payout', driverId: d.id, method: 'card', amount, status: 'pending', provider: 'internal' })
      log(s, `طلب سحب أرباح ${amount} ر.س — ${d.name}`)
    }
  },

  /* admin */
  setDriverStatus(s: State, id: string, status: Driver['status']) {
    const d = s.drivers.find((x) => x.id === id)
    if (!d) return
    d.status = status
    if (status !== 'active') d.online = false
    log(s, `${status === 'active' ? 'تفعيل' : status === 'suspended' ? 'إيقاف' : 'رفض'} الكابتن ${d.name}`)
  },
  toggleRiderBlock(s: State, id: string) {
    const r = s.riders.find((x) => x.id === id)
    if (r) {
      r.blocked = !r.blocked
      log(s, `${r.blocked ? 'حظر' : 'إلغاء حظر'} الراكب ${r.name}`)
    }
  },
  refundTrip(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.refunded) return
    t.refunded = true
    const amount = (t.status === 'completed' ? t.fare : 0) + (t.cancelFee ?? 0)
    const r = s.riders.find((x) => x.id === t.riderId)
    if (r) r.wallet += amount
    pay(s, { kind: 'refund', tripId: t.id, riderId: t.riderId, method: 'wallet', amount, status: 'paid', provider: 'internal' })
    log(s, `استرداد ${amount} ر.س لمحفظة الراكب — ${t.id}`)
  },
  updateCategory(s: State, id: CategoryId, patch: Partial<Category>) {
    const c = s.categories.find((x) => x.id === id)
    if (!c) return
    for (const k of ['base', 'perKm', 'perMin', 'minFare', 'enabled', 'desc'] as const) if (k in patch) (c as unknown as Record<string, unknown>)[k] = patch[k]
  },
  updateSettings(s: State, patch: Partial<Settings>) {
    Object.assign(s.settings, patch)
    if ('surgeOn' in patch) log(s, patch.surgeOn ? `تفعيل التسعير الديناميكي ×${s.settings.surge}` : 'إيقاف التسعير الديناميكي')
  },
  savePromo(s: State, p: Promo) {
    const i = s.promos.findIndex((x) => x.code === p.code)
    if (i >= 0) s.promos[i] = p
    else s.promos.unshift(p)
  },
  deletePromo(s: State, code: string) {
    s.promos = s.promos.filter((p) => p.code !== code)
  },
  replyTicket(s: State, id: string, text: string, close = false) {
    const t = s.tickets.find((x) => x.id === id)
    if (!t) return
    if (text.trim()) t.messages.push({ from: 'admin', text: text.trim(), at: Date.now() })
    if (close) t.status = 'closed'
  },
  sendNotice(s: State, audience: 'riders' | 'drivers' | 'all', title: string, body: string) {
    s.notices.unshift({ id: uid('N'), audience, title, body, at: Date.now() })
    log(s, `إرسال إشعار: ${title}`)
  },
  resolveSOS(s: State, id: string) {
    const t = s.trips.find((x) => x.id === id)
    if (t) t.sos = false
  },
  markPayout(s: State, id: string) {
    const p = s.payments.find((x) => x.id === id)
    if (p && p.kind === 'payout') p.status = 'paid'
  },
}

export type ActionName = keyof typeof actions

/** Who may call each action on the server. */
export const ACTION_ROLES: Record<ActionName, Role[]> = {
  signInRider: [],
  signOutRider: [],
  signInDriver: [],
  signOutDriver: ['driver'],
  registerDriver: [],
  updateRider: ['rider'],
  requestTrip: ['rider'],
  cancelTrip: ['rider', 'driver', 'admin'],
  sendChat: ['rider', 'driver'],
  rateTrip: ['rider'],
  setSOS: ['rider'],
  shareTrip: ['rider'],
  topUp: [],
  openTicket: ['rider', 'driver'],
  setOnline: ['driver'],
  acceptOffer: ['driver'],
  declineOffer: ['driver'],
  markArrived: ['driver'],
  startTrip: ['driver'],
  completeTrip: ['driver'],
  rateRider: ['driver'],
  cashOut: ['driver'],
  setDriverStatus: ['admin'],
  toggleRiderBlock: ['admin'],
  refundTrip: ['admin'],
  updateCategory: ['admin'],
  updateSettings: ['admin'],
  savePromo: ['admin'],
  deletePromo: ['admin'],
  replyTicket: ['admin'],
  sendNotice: ['admin'],
  resolveSOS: ['admin'],
  markPayout: ['admin'],
}

/* ───────────── dispatch + simulated drivers (runs every ~700 ms) ───────────── */

export function tick(s: State, now: number): boolean {
  let dirty = false
  for (const t of s.trips) {
    if (t.status === 'scheduled' && t.scheduledFor && now >= t.scheduledFor) {
      t.status = 'searching'
      t.requestedAt = now
      dirty = true
    }
    if (t.status === 'searching') {
      if (t.offeredTo && t.offerAt && now - t.offerAt > s.settings.offerSec * 1000) {
        t.declined.push(t.offeredTo)
        t.offeredTo = undefined
        dirty = true
      }
      const offered = t.offeredTo ? s.drivers.find((d) => d.id === t.offeredTo) : undefined
      if (offered?.bot && t.offerAt && now - t.offerAt > 2600) {
        acceptInto(s, t, offered, now)
        dirty = true
        continue
      }
      if (offered && (!offered.online || offered.status !== 'active')) {
        t.declined.push(offered.id)
        t.offeredTo = undefined
        dirty = true
      }
      if (!t.offeredTo) {
        const offeredSet = offeredDriverIds(s)
        const cands = nearbyFor(s, t.pickup.p, t.category, now).filter(({ d }) => !t.declined.includes(d.id) && !offeredSet.has(d.id) && (t.category !== 'her' || d.gender === 'f'))
        // real drivers are offered before simulated ones
        cands.sort((a, b) => Number(a.d.bot) - Number(b.d.bot) || a.km - b.km)
        if (cands.length) {
          t.offeredTo = cands[0].d.id
          t.offerAt = now
          dirty = true
        } else if (now - t.requestedAt > 60000) {
          t.status = 'no_drivers'
          dirty = true
        }
      }
    }
    const d = t.driverId ? s.drivers.find((x) => x.id === t.driverId) : undefined
    if (!d?.bot) continue
    // simulated driver chat reply
    const last = t.chat[t.chat.length - 1]
    if (isLive(t) && last?.from === 'rider' && now - last.at > 1800) {
      const replies = ['تمام، في الطريق إليك 👍', 'أبشر', 'وصلت قريب، دقيقة وأكون عندك', 'حاضر، شكراً لك']
      t.chat.push({ from: 'driver', text: replies[t.chat.length % replies.length], at: now })
      dirty = true
    }
    if (t.status === 'accepted' && tripProgress(t, s.settings, now) >= 1) {
      t.status = 'arrived'
      t.arrivedAt = now
      dirty = true
    } else if (t.status === 'arrived' && t.arrivedAt && now - t.arrivedAt > 6000) {
      t.status = 'in_progress'
      t.startedAt = now
      dirty = true
    } else if (t.status === 'in_progress' && tripProgress(t, s.settings, now) >= 1) {
      completeInto(s, t, now)
      t.driverRating = 5
      dirty = true
    }
  }
  return dirty
}

/* ───────────── per-user views (what the server sends to each app) ───────────── */

const publicDriver = (d: Driver): Driver => ({
  ...d,
  name: '',
  phone: '',
  balance: 0,
  ratingsCount: 0,
  acceptRate: 0,
  car: { ...d.car, plate: '', make: '', model: '' },
  docs: { license: true, idCard: true, registration: true, insurance: true },
})

export function viewFor(s: State, a: Actor): State {
  if (a.role === 'admin') return { ...s, me: { ...s.me, riderSignedIn: false, driverSignedIn: false } }
  const base = {
    v: s.v,
    categories: s.categories,
    settings: s.settings,
    promos: s.promos.filter((p) => p.active),
    log: [],
    payments: [] as Payment[],
  }
  if (a.role === 'rider') {
    const trips = s.trips.filter((t) => t.riderId === a.riderId)
    const assigned = new Set(trips.filter((t) => t.driverId).map((t) => t.driverId!))
    return {
      ...base,
      riders: s.riders.filter((r) => r.id === a.riderId),
      drivers: s.drivers.filter((d) => d.status === 'active' && (d.online || assigned.has(d.id))).map((d) => (assigned.has(d.id) ? { ...d, phone: '', balance: 0 } : publicDriver(d))),
      trips,
      tickets: s.tickets.filter((t) => t.by === 'rider' && t.userId === a.riderId),
      notices: s.notices.filter((n) => n.audience !== 'drivers'),
      payments: s.payments.filter((p) => p.riderId === a.riderId),
      me: { riderId: a.riderId ?? '', driverId: '', riderSignedIn: !!a.riderId, driverSignedIn: false },
    }
  }
  if (!a.driverId) {
    // phone verified, registration not finished yet
    return { ...base, riders: [], drivers: [], trips: [], tickets: [], notices: [], me: { riderId: '', driverId: '', riderSignedIn: false, driverSignedIn: false } }
  }
  const trips = s.trips.filter((t) => t.driverId === a.driverId || (t.status === 'searching' && t.offeredTo === a.driverId)).map((t) => ({ ...t, pin: '' }))
  const riderIds = new Set(trips.map((t) => t.riderId))
  return {
    ...base,
    riders: s.riders.filter((r) => riderIds.has(r.id)).map((r) => ({ ...r, phone: '', email: '', wallet: 0, emergencyName: '', emergencyPhone: '' })),
    drivers: s.drivers.filter((d) => d.id === a.driverId || (d.online && d.status === 'active')).map((d) => (d.id === a.driverId ? d : publicDriver(d))),
    trips,
    tickets: s.tickets.filter((t) => t.by === 'driver' && t.userId === a.driverId),
    notices: s.notices.filter((n) => n.audience !== 'riders'),
    payments: s.payments.filter((p) => p.driverId === a.driverId),
    me: { riderId: '', driverId: a.driverId ?? '', riderSignedIn: false, driverSignedIn: !!a.driverId },
  }
}

/** Runs an action for an actor on a draft state, setting `me` from the actor. */
export function runAs(s: State, a: Actor, name: ActionName, args: unknown[]): unknown {
  const saved = s.me
  s.me = { riderId: a.riderId ?? '', driverId: a.driverId ?? '', riderSignedIn: a.role === 'rider', driverSignedIn: a.role === 'driver' }
  try {
    return (actions[name] as (s: State, ...x: unknown[]) => unknown)(s, ...args)
  } finally {
    // registerDriver sets me.driverId; callers read it from the return value
    s.me = saved
  }
}

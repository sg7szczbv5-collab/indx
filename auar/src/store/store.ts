import { useEffect, useState, useSyncExternalStore } from 'react'
import { along, dist, kmToMin, route, routeKm, type Point } from '../lib/geo'
import { commissionOf, quote } from '../lib/pricing'
import { pin4, uid } from '../lib/format'
import { makeDriver, seed } from './seed'
import type { CategoryId, Driver, Loc, PaymentMethod, Settings, State, Trip, Category, Promo, Rider } from './types'

/* ───────────── persistence + cross-tab sync ───────────── */

const KEY = 'auar-state-v3'
const TAB = Math.random().toString(36).slice(2)

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as State
    return s && s.v === 3 ? s : null
  } catch {
    return null
  }
}

let state: State = load() ?? seed()
const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null
try {
  channel = new BroadcastChannel('auar')
  channel.onmessage = (e) => {
    if (e.data?.tab !== TAB && e.data?.state) {
      state = e.data.state
      listeners.forEach((l) => l())
    }
  }
} catch {
  channel = null
}
try {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue && !channel) {
      try {
        state = JSON.parse(e.newValue)
        listeners.forEach((l) => l())
      } catch {
        /* ignore */
      }
    }
  })
} catch {
  /* ignore */
}

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: keep in memory */
  }
  try {
    channel?.postMessage({ tab: TAB, state: next })
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function update(fn: (s: State) => void) {
  const draft = structuredClone(state)
  fn(draft)
  commit(draft)
}

export const getState = () => state
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getState)
}

/** Re-render on an interval for live movement and countdowns. */
export function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/* ───────────── derived helpers ───────────── */

export const ACTIVE: Trip['status'][] = ['searching', 'accepted', 'arrived', 'in_progress']
export const isLive = (t: Trip) => ACTIVE.includes(t.status)

/** Simulated real-time: `speed` compresses trip minutes into seconds for the demo. */
export const approachMs = (t: Trip, s: Settings) => (kmToMin(routeKm(t.approach)) * 60000) / s.speed
export const tripMs = (t: Trip, s: Settings) => (t.durationMin * 60000) / s.speed

export function tripProgress(t: Trip, s: Settings, now: number) {
  if (t.status === 'accepted' && t.acceptedAt) return Math.min(1, (now - t.acceptedAt) / Math.max(1, approachMs(t, s)))
  if (t.status === 'in_progress' && t.startedAt) return Math.min(1, (now - t.startedAt) / Math.max(1, tripMs(t, s)))
  if (t.status === 'arrived' || t.status === 'completed') return 1
  return 0
}

/** ETA in real minutes (what the user would see in a live app). */
export function etaMin(t: Trip, s: Settings, now: number) {
  const p = tripProgress(t, s, now)
  if (t.status === 'accepted') return Math.max(1, Math.ceil(kmToMin(routeKm(t.approach)) * (1 - p)))
  if (t.status === 'in_progress') return Math.max(1, Math.ceil(t.durationMin * (1 - p)))
  return 0
}

export function driverPose(d: Driver, s: State, now: number): { p: Point; a: number } {
  const t = s.trips.find((x) => x.driverId === d.id && (x.status === 'accepted' || x.status === 'arrived' || x.status === 'in_progress'))
  if (t) {
    if (t.status === 'accepted') return along(t.approach, tripProgress(t, s.settings, now))
    if (t.status === 'arrived') return along(t.approach, 1)
    return along(t.path, tripProgress(t, s.settings, now))
  }
  // idle cruising: drift gently along the driver's own street
  if (!d.online || !d.bot) return { p: d.pos, a: d.heading }
  const seedN = parseInt(d.id.slice(1), 10)
  const w = Math.sin(now / 9000 + seedN) * 28
  const vertical = d.pos.x % 100 === 0
  const dw = Math.cos(now / 9000 + seedN)
  return vertical
    ? { p: { x: d.pos.x, y: d.pos.y + w }, a: dw >= 0 ? 90 : -90 }
    : { p: { x: d.pos.x + w, y: d.pos.y }, a: dw >= 0 ? 0 : 180 }
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

/* ───────────── rider actions ───────────── */

export function signInRider(name: string, phone: string) {
  update((s) => {
    const r = s.riders.find((x) => x.id === s.me.riderId)!
    if (name.trim()) r.name = name.trim()
    if (phone.trim()) r.phone = phone.trim()
    s.me.riderSignedIn = true
  })
}

export function signOutRider() {
  update((s) => {
    s.me.riderSignedIn = false
  })
}

export function updateRider(patch: Partial<Rider>) {
  update((s) => {
    const r = s.riders.find((x) => x.id === s.me.riderId)!
    Object.assign(r, patch)
  })
}

export function requestTrip(o: {
  pickup: Loc
  dropoff: Loc
  category: CategoryId
  payment: PaymentMethod
  promo?: string
  scheduledFor?: number
  note?: string
  forOther?: string
}): string {
  const id = uid('T')
  update((s) => {
    const cat = s.categories.find((c) => c.id === o.category)!
    const path = route(o.pickup.p, o.dropoff.p)
    const km = routeKm(path)
    const min = kmToMin(km)
    const promo = findPromo(s, o.promo)
    const q = quote(cat, km, min, s.settings, promo)
    if (promo && q.discount > 0) promo.uses++
    const now = Date.now()
    s.trips.unshift({
      id,
      riderId: s.me.riderId,
      category: o.category,
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
      status: o.scheduledFor ? 'scheduled' : 'searching',
      pin: pin4(),
      requestedAt: now,
      scheduledFor: o.scheduledFor,
      chat: [],
      declined: [],
      commission: 0,
      note: o.note,
      forOther: o.forOther,
    })
  })
  return id
}

export function cancelTrip(id: string, by: Trip['cancelledBy'], reason: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (!t || !(isLive(t) || t.status === 'scheduled')) return
    const now = Date.now()
    const drv = t.driverId ? s.drivers.find((x) => x.id === t.driverId) : undefined
    if (drv) drv.pos = driverPose(drv, s, now).p
    t.status = 'cancelled'
    t.cancelledAt = now
    t.cancelledBy = by
    t.cancelReason = reason
    t.offeredTo = undefined
    // late rider cancellation → fee goes to the driver (minus commission)
    if (by === 'rider' && t.acceptedAt && t.driverId && now - t.acceptedAt > s.settings.freeCancelSec * 1000) {
      t.cancelFee = s.settings.cancelFee
      const d = s.drivers.find((x) => x.id === t.driverId)
      if (d) d.balance += t.cancelFee * (1 - s.settings.commission)
      const r = s.riders.find((x) => x.id === t.riderId)
      if (r && t.payment === 'wallet') r.wallet -= t.cancelFee
    }
    log(s, `أُلغيت الرحلة ${t.id} بواسطة ${by === 'rider' ? 'الراكب' : by === 'driver' ? 'الكابتن' : by === 'admin' ? 'الإدارة' : 'النظام'}`)
  })
}

export function sendChat(id: string, from: 'rider' | 'driver', text: string) {
  if (!text.trim()) return
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (t) t.chat.push({ from, text: text.trim(), at: Date.now() })
  })
  // simulated driver reply when a bot driver is chatting
  const t = getState().trips.find((x) => x.id === id)
  const d = t?.driverId ? getState().drivers.find((x) => x.id === t.driverId) : undefined
  if (from === 'rider' && d?.bot) {
    const replies = ['تمام، في الطريق إليك 👍', 'أبشر', 'وصلت قريب، دقيقة وأكون عندك', 'حاضر، شكراً لك']
    setTimeout(() => {
      update((s) => {
        const tt = s.trips.find((x) => x.id === id)
        if (tt && isLive(tt)) tt.chat.push({ from: 'driver', text: replies[tt.chat.length % replies.length], at: Date.now() })
      })
    }, 1800)
  }
}

export function rateTrip(id: string, rating: number, comment: string, tip: number) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (!t) return
    t.riderRating = rating
    t.riderComment = comment
    t.tip = tip
    const d = s.drivers.find((x) => x.id === t.driverId)
    if (d) {
      d.rating = Math.round(((d.rating * d.ratingsCount + rating) / (d.ratingsCount + 1)) * 100) / 100
      d.ratingsCount++
      d.balance += tip
    }
  })
}

export function setSOS(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (t) {
      t.sos = true
      log(s, `🚨 تنبيه طوارئ من الرحلة ${t.id}`)
    }
  })
}

export function shareTrip(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (t) t.shared = true
  })
}

export function topUp(amount: number) {
  update((s) => {
    const r = s.riders.find((x) => x.id === s.me.riderId)!
    r.wallet += amount
  })
}

export function openTicket(by: 'rider' | 'driver', subject: string, text: string, tripId?: string) {
  update((s) => {
    s.tickets.unshift({
      id: uid('TK'),
      by,
      userId: by === 'rider' ? s.me.riderId : s.me.driverId,
      tripId,
      subject,
      messages: [{ from: 'user', text, at: Date.now() }],
      status: 'open',
      at: Date.now(),
    })
  })
}

/* ───────────── driver actions ───────────── */

export function signInDriver() {
  update((s) => {
    s.me.driverId = 'D100'
    s.me.driverSignedIn = true
  })
}

export function signOutDriver() {
  update((s) => {
    const d = s.drivers.find((x) => x.id === s.me.driverId)
    if (d) d.online = false
    s.me.driverSignedIn = false
  })
}

export function registerDriver(o: { name: string; phone: string; make: string; model: string; plate: string; year: number; color: string; gender: 'm' | 'f'; categories: CategoryId[] }) {
  update((s) => {
    const n = s.drivers.length + 60
    const d = makeDriver(n, o.name, o.gender, false, { x: 300, y: 420 })
    d.id = uid('D')
    d.phone = o.phone
    d.car = { ...d.car, make: o.make, model: o.model, plate: o.plate, year: o.year, color: o.color }
    d.categories = o.categories
    d.status = 'pending'
    d.online = false
    d.balance = 0
    d.rating = 5
    d.ratingsCount = 0
    d.joinedAt = Date.now()
    s.drivers.push(d)
    s.me.driverId = d.id
    s.me.driverSignedIn = true
    log(s, `طلب انضمام كابتن جديد: ${o.name}`)
  })
}

export function setOnline(on: boolean) {
  update((s) => {
    const d = s.drivers.find((x) => x.id === s.me.driverId)
    if (d && d.status === 'active') d.online = on
  })
}

function acceptInto(s: State, t: Trip, d: Driver, now: number) {
  // read the driver's position before this trip makes them "busy"
  const from = driverPose(d, s, now).p
  d.pos = from
  t.driverId = d.id
  t.status = 'accepted'
  t.acceptedAt = now
  t.offeredTo = undefined
  t.approach = route(from, t.pickup.p)
  if (t.approach.length < 2) t.approach = [t.pickup.p, t.pickup.p]
}

export function acceptOffer(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    const d = s.drivers.find((x) => x.id === s.me.driverId)
    if (!t || !d || t.status !== 'searching' || t.offeredTo !== d.id) return
    acceptInto(s, t, d, Date.now())
  })
}

export function declineOffer(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.status !== 'searching') return
    if (t.offeredTo) t.declined.push(t.offeredTo)
    t.offeredTo = undefined
  })
}

export function markArrived(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (t && t.status === 'accepted') {
      t.status = 'arrived'
      t.arrivedAt = Date.now()
    }
  })
}

export function startTrip(id: string, pin: string): boolean {
  const t = getState().trips.find((x) => x.id === id)
  if (!t || t.status !== 'arrived' || t.pin !== pin) return false
  update((s) => {
    const tt = s.trips.find((x) => x.id === id)!
    tt.status = 'in_progress'
    tt.startedAt = Date.now()
  })
  return true
}

function completeInto(s: State, t: Trip, now: number) {
  t.status = 'completed'
  t.completedAt = now
  t.commission = commissionOf(t.fare, s.settings)
  const d = s.drivers.find((x) => x.id === t.driverId)
  const r = s.riders.find((x) => x.id === t.riderId)
  if (r && t.payment === 'wallet') {
    r.wallet = Math.round((r.wallet - t.fare) * 100) / 100
  }
  if (d) {
    d.pos = t.dropoff.p
    // cash: driver collects the fare and owes the commission; otherwise AUAR pays the driver's share
    d.balance = Math.round((d.balance + (t.payment === 'cash' ? -t.commission : t.fare - t.commission)) * 100) / 100
  }
}

export function completeTrip(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (t && t.status === 'in_progress') completeInto(s, t, Date.now())
  })
}

export function rateRider(id: string, rating: number) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (!t) return
    t.driverRating = rating
    const r = s.riders.find((x) => x.id === t.riderId)
    if (r) r.rating = Math.round(((r.rating * 20 + rating) / 21) * 100) / 100
  })
}

export function cashOut(amount: number) {
  update((s) => {
    const d = s.drivers.find((x) => x.id === s.me.driverId)
    if (d && amount > 0 && amount <= d.balance) {
      d.balance = Math.round((d.balance - amount) * 100) / 100
      log(s, `سحب أرباح ${amount} ر.س — ${d.name}`)
    }
  })
}

/* ───────────── admin actions ───────────── */

function log(s: State, text: string) {
  s.log.unshift({ at: Date.now(), text })
  s.log = s.log.slice(0, 80)
}

export function setDriverStatus(id: string, status: Driver['status']) {
  update((s) => {
    const d = s.drivers.find((x) => x.id === id)
    if (!d) return
    d.status = status
    if (status !== 'active') d.online = false
    if (status === 'active') d.docs = { license: true, idCard: true, registration: true, insurance: true }
    log(s, `${status === 'active' ? 'تفعيل' : status === 'suspended' ? 'إيقاف' : 'رفض'} الكابتن ${d.name}`)
  })
}

export function toggleRiderBlock(id: string) {
  update((s) => {
    const r = s.riders.find((x) => x.id === id)
    if (r) {
      r.blocked = !r.blocked
      log(s, `${r.blocked ? 'حظر' : 'إلغاء حظر'} الراكب ${r.name}`)
    }
  })
}

export function refundTrip(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (!t || t.refunded) return
    t.refunded = true
    const r = s.riders.find((x) => x.id === t.riderId)
    if (r) r.wallet += t.fare + (t.cancelFee ?? 0)
    log(s, `استرداد ${t.fare} ر.س لمحفظة الراكب — ${t.id}`)
  })
}

export function updateCategory(id: CategoryId, patch: Partial<Category>) {
  update((s) => {
    const c = s.categories.find((x) => x.id === id)
    if (c) Object.assign(c, patch)
  })
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => {
    Object.assign(s.settings, patch)
    if ('surgeOn' in patch) log(s, patch.surgeOn ? `تفعيل التسعير الديناميكي ×${s.settings.surge}` : 'إيقاف التسعير الديناميكي')
  })
}

export function savePromo(p: Promo) {
  update((s) => {
    const i = s.promos.findIndex((x) => x.code === p.code)
    if (i >= 0) s.promos[i] = p
    else s.promos.unshift(p)
  })
}

export function deletePromo(code: string) {
  update((s) => {
    s.promos = s.promos.filter((p) => p.code !== code)
  })
}

export function replyTicket(id: string, text: string, close = false) {
  update((s) => {
    const t = s.tickets.find((x) => x.id === id)
    if (!t) return
    if (text.trim()) t.messages.push({ from: 'admin', text: text.trim(), at: Date.now() })
    if (close) t.status = 'closed'
  })
}

export function sendNotice(audience: 'riders' | 'drivers' | 'all', title: string, body: string) {
  update((s) => {
    s.notices.unshift({ id: uid('N'), audience, title, body, at: Date.now() })
    log(s, `إرسال إشعار: ${title}`)
  })
}

export function resolveSOS(id: string) {
  update((s) => {
    const t = s.trips.find((x) => x.id === id)
    if (t) t.sos = false
  })
}

export function resetDemo() {
  commit(seed())
}

/* ───────────── simulation (dispatch + bot drivers) ───────────── */

let leader = false
const LKEY = 'auar-leader'
function electLeader() {
  try {
    const raw = localStorage.getItem(LKEY)
    const cur = raw ? (JSON.parse(raw) as { id: string; ts: number }) : null
    const now = Date.now()
    if (!cur || cur.id === TAB || now - cur.ts > 2500) {
      localStorage.setItem(LKEY, JSON.stringify({ id: TAB, ts: now }))
      leader = true
    } else leader = false
  } catch {
    leader = true
  }
}

function tick() {
  electLeader()
  if (!leader) return
  const s = state
  const now = Date.now()
  let dirty = false
  const draft = structuredClone(s)

  for (const t of draft.trips) {
    if (t.status === 'scheduled' && t.scheduledFor && now >= t.scheduledFor) {
      t.status = 'searching'
      t.requestedAt = now
      dirty = true
    }
    if (t.status === 'searching') {
      // offer timed out
      if (t.offeredTo && t.offerAt && now - t.offerAt > draft.settings.offerSec * 1000) {
        t.declined.push(t.offeredTo)
        t.offeredTo = undefined
        dirty = true
      }
      const offered = t.offeredTo ? draft.drivers.find((d) => d.id === t.offeredTo) : undefined
      if (offered?.bot && t.offerAt && now - t.offerAt > 2600) {
        acceptInto(draft, t, offered, now)
        dirty = true
        continue
      }
      if (offered && (!offered.online || offered.status !== 'active')) {
        t.declined.push(offered.id)
        t.offeredTo = undefined
        dirty = true
      }
      if (!t.offeredTo) {
        const offeredSet = offeredDriverIds(draft)
        const cands = nearbyFor(draft, t.pickup.p, t.category, now).filter(
          ({ d }) =>
            !t.declined.includes(d.id) &&
            !offeredSet.has(d.id) &&
            (t.category !== 'her' || d.gender === 'f'),
        )
        // the human demo driver (you) gets priority when online so the full flow can be tried
        cands.sort((a, b) => Number(a.d.bot) - Number(b.d.bot) || a.km - b.km)
        if (cands.length) {
          t.offeredTo = cands[0].d.id
          t.offerAt = now
          dirty = true
        } else if (now - t.requestedAt > 40000) {
          t.status = 'no_drivers'
          dirty = true
        }
      }
    }
    const d = t.driverId ? draft.drivers.find((x) => x.id === t.driverId) : undefined
    if (!d?.bot) continue
    if (t.status === 'accepted' && tripProgress(t, draft.settings, now) >= 1) {
      t.status = 'arrived'
      t.arrivedAt = now
      dirty = true
    } else if (t.status === 'arrived' && t.arrivedAt && now - t.arrivedAt > 6000) {
      t.status = 'in_progress'
      t.startedAt = now
      dirty = true
    } else if (t.status === 'in_progress' && tripProgress(t, draft.settings, now) >= 1) {
      completeInto(draft, t, now)
      t.driverRating = 5
      dirty = true
    }
  }
  if (dirty) commit(draft)
}

let started = false
export function startSimulation() {
  if (started) return
  started = true
  tick()
  setInterval(tick, 700)
}

export const fareFor = (s: State, cat: Category, km: number, min: number, promoCode?: string) => quote(cat, km, min, s.settings, findPromo(s, promoCode))

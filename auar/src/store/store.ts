/**
 * Client store. Two modes, chosen at start-up:
 *  - local:  no server found → the whole platform runs in this browser (demo), synced across tabs.
 *  - remote: an AUAR server answered /api/health → state comes from the server over WebSocket,
 *            actions are sent to the server, and each app (rider / driver / admin) has its own session.
 */
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { actions, runAs, tick, type ActionName, type Role } from './engine'
import { CATEGORIES, seed } from './seed'
import type { State } from './types'

export * from './engine'

export type Mode = 'local' | 'remote'
let mode: Mode = 'local'
let serverInfo: { demo: boolean; payments: string; sms: string } = { demo: true, payments: 'mock', sms: 'console' }
export const getMode = () => mode
export const getServerInfo = () => serverInfo

/** Which app a component belongs to (needed in remote mode, where each app has its own session). */
export const RoleCtx = createContext<Role>('rider')

/* ───────────── clock (server time in remote mode) ───────────── */

let skew = 0
export const nowMs = () => Date.now() + skew

export function useNow(ms = 250) {
  const [now, setNow] = useState(nowMs())
  useEffect(() => {
    const t = setInterval(() => setNow(nowMs()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/* ───────────── safe storage ───────────── */

const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string | null) {
    try {
      if (v === null) localStorage.removeItem(k)
      else localStorage.setItem(k, v)
    } catch {
      /* storage unavailable */
    }
  },
}

/* ───────────── local mode ───────────── */

const KEY = 'auar-state-v4'
const TAB = Math.random().toString(36).slice(2)
const localListeners = new Set<() => void>()
let local: State = (() => {
  try {
    const raw = ls.get(KEY)
    const s = raw ? (JSON.parse(raw) as State) : null
    return s && s.v === 4 ? s : seed()
  } catch {
    return seed()
  }
})()
let channel: BroadcastChannel | null = null

function commitLocal(next: State) {
  local = next
  ls.set(KEY, JSON.stringify(next))
  try {
    channel?.postMessage({ tab: TAB, state: next })
  } catch {
    /* ignore */
  }
  localListeners.forEach((l) => l())
}

function updateLocal<T>(fn: (s: State) => T): T {
  const draft = structuredClone(local)
  const r = fn(draft)
  commitLocal(draft)
  return r
}

let leader = false
function electLeader() {
  try {
    const raw = localStorage.getItem('auar-leader')
    const cur = raw ? (JSON.parse(raw) as { id: string; ts: number }) : null
    const now = Date.now()
    if (!cur || cur.id === TAB || now - cur.ts > 2500) {
      localStorage.setItem('auar-leader', JSON.stringify({ id: TAB, ts: now }))
      leader = true
    } else leader = false
  } catch {
    leader = true
  }
}

function startLocal() {
  try {
    channel = new BroadcastChannel('auar')
    channel.onmessage = (e) => {
      if (e.data?.tab !== TAB && e.data?.state) {
        local = e.data.state
        localListeners.forEach((l) => l())
      }
    }
  } catch {
    channel = null
  }
  setInterval(() => {
    electLeader()
    if (!leader) return
    const draft = structuredClone(local)
    if (tick(draft, Date.now())) commitLocal(draft)
  }, 700)
}

/* ───────────── remote mode ───────────── */

const API = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ?? '').replace(/\/$/, '')

function emptyState(): State {
  return {
    v: 4,
    riders: [],
    drivers: [],
    trips: [],
    promos: [],
    tickets: [],
    notices: [],
    categories: CATEGORIES,
    settings: { commission: 0.2, cancelFee: 10, freeCancelSec: 120, vat: 0.15, surgeOn: false, surge: 1.4, autoBots: false, speed: 1, offerSec: 20, riderOnlyWomenDrivers: true },
    log: [],
    payments: [],
    me: { riderId: '', driverId: '', riderSignedIn: false, driverSignedIn: false },
  }
}

interface Session {
  token: string | null
  state: State
  ws: WebSocket | null
  listeners: Set<() => void>
  retry: number
  status: 'idle' | 'connecting' | 'open'
  loaded: boolean
}
const sessions: Record<Role, Session> = {
  rider: { token: null, state: emptyState(), ws: null, listeners: new Set(), retry: 0, status: 'idle', loaded: false },
  driver: { token: null, state: emptyState(), ws: null, listeners: new Set(), retry: 0, status: 'idle', loaded: false },
  admin: { token: null, state: emptyState(), ws: null, listeners: new Set(), retry: 0, status: 'idle', loaded: false },
}
const emit = (r: Role) => sessions[r].listeners.forEach((l) => l())

function connect(role: Role) {
  const s = sessions[role]
  s.ws?.close()
  s.ws = null
  if (!s.token) {
    s.state = emptyState()
    s.status = 'idle'
    emit(role)
    return
  }
  const base = API || location.origin
  const url = base.replace(/^http/, 'ws') + `/ws?token=${encodeURIComponent(s.token)}`
  s.status = 'connecting'
  const ws = new WebSocket(url)
  s.ws = ws
  ws.onopen = () => {
    s.retry = 0
    s.status = 'open'
  }
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(e.data)
      if (m.type === 'state') {
        skew = m.now - Date.now()
        s.state = m.state
        s.loaded = true
        emit(role)
      }
    } catch {
      /* ignore */
    }
  }
  ws.onclose = (e) => {
    if (s.ws !== ws) return
    s.ws = null
    s.status = 'idle'
    if (e.code === 4001) {
      // token rejected
      setToken(role, null)
      return
    }
    s.retry = Math.min(s.retry + 1, 6)
    setTimeout(() => s.token && !s.ws && connect(role), 500 * 2 ** s.retry)
  }
}

function setToken(role: Role, token: string | null) {
  sessions[role].token = token
  sessions[role].loaded = false
  ls.set(`auar-token-${role}`, token)
  connect(role)
}

async function api<T = Record<string, unknown>>(path: string, body: unknown, role?: Role): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  const tok = role ? sessions[role].token : null
  if (tok) headers.authorization = `Bearer ${tok}`
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body ?? {}) })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

/* ───────────── start-up ───────────── */

export async function initStore() {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 1500)
    const res = await fetch(`${API}/api/health`, { signal: ctl.signal })
    clearTimeout(timer)
    const info = res.ok ? await res.json() : null
    if (info?.app === 'auar') {
      mode = 'remote'
      serverInfo = info
      skew = info.now - Date.now()
      for (const r of ['rider', 'driver', 'admin'] as Role[]) {
        sessions[r].token = ls.get(`auar-token-${r}`)
        connect(r)
      }
      return
    }
  } catch {
    /* no server: local mode */
  }
  mode = 'local'
  startLocal()
}

/* ───────────── hooks ───────────── */

const localSub = (l: () => void) => {
  localListeners.add(l)
  return () => {
    localListeners.delete(l)
  }
}

export function useStore(): State {
  const role = useContext(RoleCtx)
  const sub = mode === 'local' ? localSub : (l: () => void) => {
    sessions[role].listeners.add(l)
    return () => {
      sessions[role].listeners.delete(l)
    }
  }
  return useSyncExternalStore(sub, () => (mode === 'local' ? local : sessions[role].state))
}

export const getState = (role: Role = 'rider') => (mode === 'local' ? local : sessions[role].state)

/* ───────────── actions ───────────── */

function call<T>(role: Role, name: ActionName, args: unknown[]): Promise<T> {
  if (mode === 'local') {
    return Promise.resolve(updateLocal((s) => (actions[name] as (s: State, ...x: unknown[]) => T)(s, ...args)))
  }
  return api<{ result: T }>('/api/action', { name, args }, role).then((r) => r.result)
}

// sign-in helpers are local-only shortcuts; remote mode uses the auth functions below
export const signInRider = (name: string, phone: string) => call('rider', 'signInRider', [name, phone])
export const signInDriver = () => call('driver', 'signInDriver', [])
export const updateRider = (patch: Parameters<typeof actions.updateRider>[1]) => call('rider', 'updateRider', [patch])
export const requestTrip = (o: Parameters<typeof actions.requestTrip>[1]) => call<string | null>('rider', 'requestTrip', [o])
export const cancelTrip = (id: string, by: 'rider' | 'driver' | 'admin', reason: string) => call(by, 'cancelTrip', [id, by, reason])
export const sendChat = (id: string, from: 'rider' | 'driver', text: string) => call(from, 'sendChat', [id, from, text])
export const rateTrip = (id: string, rating: number, comment: string, tip: number) => call('rider', 'rateTrip', [id, rating, comment, tip])
export const setSOS = (id: string) => call('rider', 'setSOS', [id])
export const shareTrip = (id: string) => call('rider', 'shareTrip', [id])
export const openTicket = (by: 'rider' | 'driver', subject: string, text: string, tripId?: string) => call(by, 'openTicket', [by, subject, text, tripId])
export const setOnline = (on: boolean) => call('driver', 'setOnline', [on])
export const acceptOffer = (id: string) => call('driver', 'acceptOffer', [id])
export const declineOffer = (id: string) => call('driver', 'declineOffer', [id])
export const markArrived = (id: string) => call('driver', 'markArrived', [id])
export const startTrip = (id: string, pin: string) => call<boolean>('driver', 'startTrip', [id, pin])
export const completeTrip = (id: string) => call('driver', 'completeTrip', [id])
export const rateRider = (id: string, rating: number) => call('driver', 'rateRider', [id, rating])
export const cashOut = (amount: number) => call('driver', 'cashOut', [amount])
export const setDriverStatus = (id: string, status: Parameters<typeof actions.setDriverStatus>[2]) => call('admin', 'setDriverStatus', [id, status])
export const toggleRiderBlock = (id: string) => call('admin', 'toggleRiderBlock', [id])
export const refundTrip = (id: string) => call('admin', 'refundTrip', [id])
export const updateCategory = (id: Parameters<typeof actions.updateCategory>[1], patch: Parameters<typeof actions.updateCategory>[2]) => call('admin', 'updateCategory', [id, patch])
export const updateSettings = (patch: Parameters<typeof actions.updateSettings>[1]) => call('admin', 'updateSettings', [patch])
export const savePromo = (p: Parameters<typeof actions.savePromo>[1]) => call('admin', 'savePromo', [p])
export const deletePromo = (code: string) => call('admin', 'deletePromo', [code])
export const replyTicket = (id: string, text: string, close = false) => call('admin', 'replyTicket', [id, text, close])
export const sendNotice = (aud: 'riders' | 'drivers' | 'all', title: string, body: string) => call('admin', 'sendNotice', [aud, title, body])
export const resolveSOS = (id: string) => call('admin', 'resolveSOS', [id])
export const markPayout = (id: string) => call('admin', 'markPayout', [id])

/** Local mode: registers immediately. Remote mode: use registerDriverAccount (needs a verified phone). */
export const registerDriver = (o: Parameters<typeof actions.registerDriver>[1]) => call('driver', 'registerDriver', [o])

export function signOutRider() {
  if (mode === 'local') return call('rider', 'signOutRider', [])
  setToken('rider', null)
  return Promise.resolve()
}
export function signOutDriver() {
  if (mode === 'local') return call('driver', 'signOutDriver', [])
  return call('driver', 'setOnline', [false]).finally(() => setToken('driver', null))
}
export function signOutAdmin() {
  setToken('admin', null)
}

/** Wallet top-up. Local: credited at once. Remote: may return a payment page URL (card gateway). */
export async function topUp(amount: number): Promise<{ url?: string; credited: boolean }> {
  if (mode === 'local') {
    updateLocal((s) => runAs(s, { role: 'rider', riderId: s.me.riderId }, 'topUp', [amount, 'mock']))
    return { credited: true }
  }
  return api('/api/payments/topup', { amount }, 'rider')
}

/* ───────────── remote authentication ───────────── */

export async function requestOtp(role: 'rider' | 'driver', phone: string) {
  return api<{ ok: boolean; devCode?: string; retryIn?: number }>('/api/auth/otp', { role, phone })
}

export async function verifyOtp(role: 'rider' | 'driver', phone: string, code: string) {
  const r = await api<{ token: string; isNew?: boolean; needsRegistration?: boolean }>('/api/auth/verify', { role, phone, code })
  setToken(role, r.token)
  return r
}

export async function demoLogin(role: Role) {
  const r = await api<{ token: string }>('/api/auth/demo', { role })
  setToken(role, r.token)
}

export async function adminLogin(email: string, password: string) {
  const r = await api<{ token: string }>('/api/auth/admin', { email, password })
  setToken('admin', r.token)
}

export async function registerDriverAccount(o: Parameters<typeof actions.registerDriver>[1]) {
  const r = await api<{ token: string }>('/api/driver/register', o, 'driver')
  setToken('driver', r.token)
}

export const hasSession = (role: Role) => (mode === 'local' ? true : !!sessions[role].token)

/** Remote session status for an app: signed in, and whether its first state has arrived. */
export function useSession(role: Role) {
  useStore()
  if (mode === 'local') return { signedIn: true, loading: false }
  const ss = sessions[role]
  return { signedIn: !!ss.token, loading: !!ss.token && !ss.loaded }
}

export const resetDemo = () => {
  if (mode === 'local') commitLocal(seed())
}

/** Kept for components that update local state directly (local mode only). */
export const update = (fn: (s: State) => void) => {
  if (mode === 'local') updateLocal(fn)
}

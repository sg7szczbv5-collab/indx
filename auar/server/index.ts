/**
 * AUAR server: REST + WebSocket API, SQLite storage, OTP sign-in, payments, dispatch loop.
 * Serves the built web apps from ../dist as well, so one process runs the whole platform.
 *
 *   npm run build && npm run server
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, type WebSocket } from 'ws'
import { ACTION_ROLES, actions, runAs, tick, viewFor, pay, type Actor, type ActionName } from '../src/store/engine'
import { seed, seedProduction } from '../src/store/seed'
import type { CategoryId, Rider, State } from '../src/store/types'
import { uid } from '../src/lib/format'
import { Store } from './db'
import { Auth, normalizePhone, otpCode, safeEqual } from './auth'
import { smsFromEnv } from './sms'
import { paymentsFromEnv } from './payments'

const env = process.env
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const PROD = env.NODE_ENV === 'production'
const DEMO = (env.AUAR_DEMO ?? (PROD ? '0' : '1')) === '1'
const PORT = Number(env.PORT ?? 8080)
const DIST = resolve(ROOT, env.STATIC_DIR ?? 'dist')

const store = new Store(env.DB_FILE ?? join(ROOT, 'data', 'auar.db'))
let secret = env.AUTH_SECRET ?? store.kvGet('auth_secret')
if (!secret) {
  secret = Auth.newSecret()
  store.kvSet('auth_secret', secret)
}
const auth = new Auth(secret)
const sms = smsFromEnv(env)
const gateway = paymentsFromEnv(env)

const ADMIN_EMAIL = env.ADMIN_EMAIL ?? (DEMO ? 'admin@auar.app' : '')
const ADMIN_PASSWORD = env.ADMIN_PASSWORD ?? (DEMO ? 'auar-admin' : '')
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) console.warn('⚠ ADMIN_EMAIL / ADMIN_PASSWORD are not set: admin sign-in is disabled.')
if (PROD && sms.name === 'console') console.warn('⚠ SMS_PROVIDER is console: sign-in codes are only printed to this log.')
if (PROD && gateway.name === 'mock') console.warn('⚠ PAYMENTS_PROVIDER is mock: wallet top-ups are credited without charging a card.')

let state: State = store.load() ?? (DEMO ? seed() : seedProduction())
state.me = { riderId: '', driverId: '', riderSignedIn: false, driverSignedIn: false }
store.save(state)

/* ───────────── realtime ───────────── */

const clients = new Map<WebSocket, Actor>()
let pending: NodeJS.Timeout | null = null

function broadcast() {
  pending = null
  const now = Date.now()
  for (const [ws, actor] of clients) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'state', now, state: viewFor(state, actor) }))
  }
}

function commit() {
  store.save(state)
  if (!pending) pending = setTimeout(broadcast, 25)
}

setInterval(() => {
  if (tick(state, Date.now())) commit()
}, 700)

/* ───────────── http helpers ───────────── */

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...cors() })
  res.end(JSON.stringify(body))
}

const cors = () => ({
  'access-control-allow-origin': env.CORS_ORIGIN ?? '*',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
})

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const c of req) {
    size += (c as Buffer).length
    if (size > 100_000) throw new HttpError(413, 'الطلب كبير جداً')
    chunks.push(c as Buffer)
  }
  if (!chunks.length) return {}
  const text = Buffer.concat(chunks).toString()
  if ((req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(text))
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'صيغة الطلب غير صحيحة')
  }
}

function actorOf(req: IncomingMessage): Actor | null {
  const h = req.headers.authorization ?? ''
  const p = auth.verify(h.startsWith('Bearer ') ? h.slice(7) : null)
  if (!p) return null
  // the account must still exist
  if (p.role === 'rider' && !state.riders.some((r) => r.id === p.riderId)) return null
  if (p.role === 'driver' && p.driverId && !state.drivers.some((d) => d.id === p.driverId)) return null
  return { role: p.role, riderId: p.riderId, driverId: p.driverId, phone: p.phone }
}

function need(req: IncomingMessage, role: Actor['role']): Actor {
  const a = actorOf(req)
  if (!a) throw new HttpError(401, 'يرجى تسجيل الدخول')
  if (a.role !== role) throw new HttpError(403, 'غير مسموح')
  return a
}

/* ───────────── routes ───────────── */

const OTP_TTL = 5 * 60_000
const OTP_GAP = 30_000

async function api(req: IncomingMessage, res: ServerResponse, path: string, url: URL) {
  if (req.method === 'GET' && path === '/api/health') return send(res, 200, { app: 'auar', now: Date.now(), demo: DEMO, payments: gateway.name, sms: sms.name })

  if (req.method === 'GET' && path === '/api/payments/moyasar/return') {
    const id = url.searchParams.get('invoice_id') ?? url.searchParams.get('id') ?? ''
    if (id) await creditInvoice(id).catch((e) => console.error(e))
    res.writeHead(302, { location: '/#rider' })
    return res.end()
  }

  if (req.method !== 'POST') throw new HttpError(404, 'غير موجود')
  const body = await readBody(req)

  switch (path) {
    case '/api/auth/otp': {
      const role = body.role === 'driver' ? 'driver' : 'rider'
      const phone = normalizePhone(String(body.phone ?? ''))
      if (!phone) throw new HttpError(400, 'رقم الجوال غير صحيح — استخدم صيغة 05XXXXXXXX')
      const prev = store.db.prepare('SELECT sent_at FROM otp WHERE phone = ? AND role = ?').get(phone, role) as { sent_at: number } | undefined
      if (prev && Date.now() - prev.sent_at < OTP_GAP) return send(res, 429, { error: 'انتظر قليلاً قبل طلب رمز جديد', retryIn: Math.ceil((OTP_GAP - (Date.now() - prev.sent_at)) / 1000) })
      const code = otpCode()
      store.db
        .prepare('INSERT INTO otp (phone, role, code_hash, expires, attempts, sent_at) VALUES (?, ?, ?, ?, 0, ?) ON CONFLICT(phone, role) DO UPDATE SET code_hash = excluded.code_hash, expires = excluded.expires, attempts = 0, sent_at = excluded.sent_at')
        .run(phone, role, auth.hashCode(phone, code), Date.now() + OTP_TTL, Date.now())
      await sms.send(phone, `رمز الدخول إلى AUAR: ${code}\nلا تشاركه مع أحد.`)
      return send(res, 200, { ok: true, ...(DEMO && sms.name === 'console' ? { devCode: code } : {}) })
    }

    case '/api/auth/verify': {
      const role = body.role === 'driver' ? 'driver' : 'rider'
      const phone = normalizePhone(String(body.phone ?? ''))
      const code = String(body.code ?? '').replace(/\D/g, '')
      if (!phone) throw new HttpError(400, 'رقم الجوال غير صحيح')
      const row = store.db.prepare('SELECT code_hash, expires, attempts FROM otp WHERE phone = ? AND role = ?').get(phone, role) as { code_hash: string; expires: number; attempts: number } | undefined
      if (!row || row.expires < Date.now()) throw new HttpError(400, 'انتهت صلاحية الرمز — اطلب رمزاً جديداً')
      if (row.attempts >= 5) throw new HttpError(429, 'محاولات كثيرة — اطلب رمزاً جديداً')
      if (!safeEqual(row.code_hash, auth.hashCode(phone, code))) {
        store.db.prepare('UPDATE otp SET attempts = attempts + 1 WHERE phone = ? AND role = ?').run(phone, role)
        throw new HttpError(400, 'الرمز غير صحيح')
      }
      store.db.prepare('DELETE FROM otp WHERE phone = ? AND role = ?').run(phone, role)

      if (role === 'rider') {
        let r = state.riders.find((x) => x.phone === phone)
        const isNew = !r
        if (!r) {
          r = newRider(phone)
          state.riders.push(r)
          commit()
        }
        return send(res, 200, { token: auth.sign({ role: 'rider', riderId: r.id, phone }), isNew })
      }
      const d = state.drivers.find((x) => x.phone === phone)
      if (d) return send(res, 200, { token: auth.sign({ role: 'driver', driverId: d.id, phone }) })
      return send(res, 200, { token: auth.sign({ role: 'driver', phone }, 1), needsRegistration: true })
    }

    case '/api/auth/demo': {
      if (!DEMO) throw new HttpError(403, 'الحسابات التجريبية غير مفعلة')
      const role = String(body.role)
      if (role === 'rider') return send(res, 200, { token: auth.sign({ role: 'rider', riderId: 'R100' }) })
      if (role === 'driver') return send(res, 200, { token: auth.sign({ role: 'driver', driverId: 'D100' }) })
      if (role === 'admin') return send(res, 200, { token: auth.sign({ role: 'admin' }, 1) })
      throw new HttpError(400, 'نوع حساب غير معروف')
    }

    case '/api/auth/admin': {
      const ok = ADMIN_EMAIL && ADMIN_PASSWORD && safeEqual(String(body.email ?? '').toLowerCase(), ADMIN_EMAIL.toLowerCase()) && safeEqual(String(body.password ?? ''), ADMIN_PASSWORD)
      if (!ok) {
        await new Promise((r) => setTimeout(r, 600))
        throw new HttpError(401, 'البريد أو كلمة المرور غير صحيحة')
      }
      return send(res, 200, { token: auth.sign({ role: 'admin' }, 1) })
    }

    case '/api/driver/register': {
      const a = need(req, 'driver')
      if (a.driverId || !a.phone) throw new HttpError(400, 'هذا الحساب مسجل مسبقاً')
      if (state.drivers.some((d) => d.phone === a.phone)) throw new HttpError(409, 'رقم الجوال مسجل لكابتن آخر')
      const str = (k: string, max = 40) => String(body[k] ?? '').trim().slice(0, max)
      const year = Number(body.year)
      const cats = (Array.isArray(body.categories) ? body.categories : []).filter((c): c is CategoryId => state.categories.some((x) => x.id === c))
      const o = { name: str('name', 60), phone: a.phone, make: str('make'), model: str('model'), plate: str('plate', 20), year, color: str('color', 20), gender: (body.gender === 'f' ? 'f' : 'm') as 'm' | 'f', categories: cats }
      if (o.name.length < 3 || !o.make || !o.model || !o.plate || !(year >= 2018 && year <= new Date().getFullYear() + 1) || !cats.length) throw new HttpError(400, 'بيانات التسجيل غير مكتملة')
      const id = runAs(state, { role: 'driver' }, 'registerDriver', [o]) as string
      commit()
      return send(res, 200, { token: auth.sign({ role: 'driver', driverId: id, phone: a.phone }) })
    }

    case '/api/action': {
      const a = actorOf(req)
      if (!a) throw new HttpError(401, 'يرجى تسجيل الدخول')
      const name = String(body.name) as ActionName
      const args = Array.isArray(body.args) ? [...body.args] : []
      if (!(name in actions) || !ACTION_ROLES[name]?.includes(a.role)) throw new HttpError(403, 'غير مسموح')
      if (a.role === 'driver' && !a.driverId) throw new HttpError(403, 'أكمل التسجيل أولاً')
      if (a.role === 'driver' && name !== 'signOutDriver' && state.drivers.find((d) => d.id === a.driverId)?.status !== 'active' && !['openTicket'].includes(name)) throw new HttpError(403, 'الحساب غير مفعل')
      if (a.role === 'rider' && state.riders.find((r) => r.id === a.riderId)?.blocked && name !== 'openTicket') throw new HttpError(403, 'الحساب موقوف')
      // the acting role always decides who is cancelling / chatting / opening a ticket
      if (name === 'cancelTrip') args[1] = a.role
      if (name === 'sendChat') args[1] = a.role
      if (name === 'openTicket') args[0] = a.role
      const result = runAs(state, a, name, args)
      commit()
      return send(res, 200, { ok: true, result: result ?? null })
    }

    case '/api/payments/topup': {
      const a = need(req, 'rider')
      const amount = Math.round(Number(body.amount) * 100) / 100
      if (!(amount >= 5 && amount <= 5000)) throw new HttpError(400, 'المبلغ يجب أن يكون بين ٥ و ٥٠٠٠ ر.س')
      const inv = await gateway.createTopUp({ amount, riderId: a.riderId!, description: `شحن محفظة AUAR — ${amount} ر.س` })
      if (!inv) {
        runAs(state, a, 'topUp', [amount, 'mock'])
        commit()
        return send(res, 200, { credited: true })
      }
      pay(state, { kind: 'topup', riderId: a.riderId, method: 'card', amount, status: 'pending', provider: gateway.name, ref: inv.id })
      commit()
      return send(res, 200, { credited: false, url: inv.url })
    }

    case '/api/payments/moyasar/webhook': {
      const data = (body.data ?? body) as Record<string, unknown>
      const id = String(data.invoice_id ?? body.invoice_id ?? data.id ?? '')
      if (id) await creditInvoice(id)
      return send(res, 200, { ok: true })
    }
  }
  throw new HttpError(404, 'غير موجود')
}

/** Credits a wallet once the gateway confirms the invoice is paid. Safe to call repeatedly. */
async function creditInvoice(invoiceId: string) {
  const p = state.payments.find((x) => x.ref === invoiceId && x.kind === 'topup')
  if (!p || p.status === 'paid') return
  const ok = await gateway.confirm(invoiceId)
  if (!ok || ok.riderId !== p.riderId) return
  const r = state.riders.find((x) => x.id === p.riderId)
  if (!r) return
  r.wallet = Math.round((r.wallet + ok.amount) * 100) / 100
  p.status = 'paid'
  p.amount = ok.amount
  p.at = Date.now()
  commit()
}

function newRider(phone: string): Rider {
  return {
    id: uid('R'),
    name: '',
    phone,
    email: '',
    rating: 5,
    wallet: 0,
    blocked: false,
    joinedAt: Date.now(),
    color: ['#2F5BFF', '#0EA5A4', '#F97316', '#8B5CF6', '#E11D48', '#16A34A'][Math.floor(Math.random() * 6)],
    defaultPayment: 'card',
    emergencyName: '',
    emergencyPhone: '',
    gender: 'm',
  }
}

/* ───────────── static files ───────────── */

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' }

async function serveStatic(res: ServerResponse, path: string) {
  const rel = normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, '')
  let file = join(DIST, rel)
  if (!file.startsWith(DIST)) file = join(DIST, 'index.html')
  try {
    if (!(await stat(file)).isFile()) file = join(DIST, 'index.html')
  } catch {
    file = join(DIST, 'index.html')
  }
  try {
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' })
    res.end(data)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('Build the web app first: npm run build')
  }
}

/* ───────────── server ───────────── */

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors())
    return res.end()
  }
  if (url.pathname.startsWith('/api/')) {
    try {
      await api(req, res, url.pathname, url)
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500
      if (status === 500) console.error(e)
      send(res, status, { error: e instanceof HttpError ? e.message : 'خطأ في الخادم' })
    }
    return
  }
  await serveStatic(res, url.pathname)
})

const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', 'http://x')
  const p = auth.verify(url.searchParams.get('token'))
  if (!p || (p.role === 'rider' && !state.riders.some((r) => r.id === p.riderId))) {
    ws.close(4001, 'unauthorized')
    return
  }
  const actor: Actor = { role: p.role, riderId: p.riderId, driverId: p.driverId, phone: p.phone }
  clients.set(ws, actor)
  ws.send(JSON.stringify({ type: 'state', now: Date.now(), state: viewFor(state, actor) }))
  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => clients.delete(ws))
})

server.listen(PORT, () => {
  console.log(`AUAR server on http://localhost:${PORT}  (demo=${DEMO}, sms=${sms.name}, payments=${gateway.name})`)
})

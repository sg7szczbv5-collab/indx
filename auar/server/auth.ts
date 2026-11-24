import { createHmac, randomBytes, randomInt, timingSafeEqual, createHash } from 'node:crypto'
import type { Actor } from '../src/store/engine'

/** Signed session token: base64url(payload).base64url(hmac). Stateless, verified on every request. */
export interface TokenPayload extends Actor {
  exp: number
}

export class Auth {
  constructor(private secret: string) {}

  static newSecret() {
    return randomBytes(32).toString('base64url')
  }

  sign(a: Actor, days = 60): string {
    const payload: TokenPayload = { ...a, exp: Date.now() + days * 86400000 }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const mac = createHmac('sha256', this.secret).update(body).digest('base64url')
    return `${body}.${mac}`
  }

  verify(token: string | undefined | null): TokenPayload | null {
    if (!token) return null
    const [body, mac] = token.split('.')
    if (!body || !mac) return null
    const expect = createHmac('sha256', this.secret).update(body).digest()
    const got = Buffer.from(mac, 'base64url')
    if (got.length !== expect.length || !timingSafeEqual(got, expect)) return null
    try {
      const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload
      return p.exp > Date.now() ? p : null
    } catch {
      return null
    }
  }

  hashCode(phone: string, code: string) {
    return createHash('sha256').update(`${this.secret}:${phone}:${code}`).digest('hex')
  }
}

export const otpCode = () => String(randomInt(100000, 1000000))

/** Normalises Saudi numbers to 05XXXXXXXX. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('00966')) d = d.slice(5)
  else if (d.startsWith('966')) d = d.slice(3)
  if (d.startsWith('5') && d.length === 9) d = '0' + d
  return /^05\d{8}$/.test(d) ? d : null
}

export const toE164 = (phone: string) => '+966' + phone.slice(1)

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

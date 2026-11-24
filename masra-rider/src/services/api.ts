/**
 * Mock backend for the prototype. Every function mirrors an endpoint a real
 * MASRA backend would expose, so screens stay unchanged when it is swapped in.
 * No network calls, no real OTP, payments or dispatch.
 */
import { PLACES, type Place } from '@/data/places'
import { DEMO_DRIVER, RIDE_TYPES, fareFor, type Driver, type RideType } from '@/data/rides'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function sendOtp(phone: string): Promise<{ ok: boolean }> {
  await wait(400)
  return { ok: phone.length >= 9 }
}

/** Demo accepts any 4-digit code. */
export async function verifyOtp(code: string): Promise<{ ok: boolean; token?: string }> {
  await wait(500)
  return code.length === 4 ? { ok: true, token: 'demo-token' } : { ok: false }
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim()
  if (!q) return PLACES
  return PLACES.filter((p) => p.name.includes(q) || p.area.includes(q) || p.addr.includes(q))
}

export type FareQuote = { ride: RideType; fare: number }

export async function getFareQuotes(place: Place): Promise<FareQuote[]> {
  await wait(250)
  return RIDE_TYPES.map((ride) => ({ ride, fare: fareFor(place, ride) }))
}

export async function requestRide(_args: { placeId: string; rideId: string; paymentId: string }): Promise<{ tripId: string; driver: Driver }> {
  await wait(3600)
  return { tripId: `MS-${Math.floor(10000 + Math.random() * 89999)}`, driver: DEMO_DRIVER }
}

export async function rateTrip(_args: { tripId: string; stars: number; comment: string; tip: number }) {
  await wait(300)
  return { ok: true }
}

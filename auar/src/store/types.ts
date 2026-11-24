import type { Point } from '../lib/geo'

export type CategoryId = 'go' | 'comfort' | 'xl' | 'black' | 'her' | 'moto' | 'courier'

export interface Category {
  id: CategoryId
  name: string
  desc: string
  seats: number
  base: number
  perKm: number
  perMin: number
  minFare: number
  enabled: boolean
}

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'apple'

export interface Loc {
  name: string
  sub: string
  p: Point
}

export interface Rider {
  id: string
  name: string
  phone: string
  email: string
  rating: number
  wallet: number
  blocked: boolean
  joinedAt: number
  color: string
  defaultPayment: PaymentMethod
  emergencyName: string
  emergencyPhone: string
  gender: 'm' | 'f'
}

export type DriverStatus = 'pending' | 'active' | 'suspended' | 'rejected'

export interface Driver {
  id: string
  name: string
  phone: string
  city: string
  rating: number
  ratingsCount: number
  car: { make: string; model: string; color: string; colorHex: string; plate: string; year: number }
  categories: CategoryId[]
  status: DriverStatus
  online: boolean
  bot: boolean
  pos: Point
  heading: number
  balance: number
  acceptRate: number
  docs: { license: boolean; idCard: boolean; registration: boolean; insurance: boolean }
  joinedAt: number
  gender: 'm' | 'f'
  color: string
}

export type TripStatus = 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_drivers' | 'scheduled'

export interface ChatMsg {
  from: 'rider' | 'driver'
  text: string
  at: number
}

export interface Trip {
  id: string
  riderId: string
  driverId?: string
  category: CategoryId
  pickup: Loc
  dropoff: Loc
  path: Point[]
  approach: Point[]
  distanceKm: number
  durationMin: number
  fare: number
  surge: number
  discount: number
  promo?: string
  tip: number
  payment: PaymentMethod
  status: TripStatus
  pin: string
  requestedAt: number
  scheduledFor?: number
  acceptedAt?: number
  arrivedAt?: number
  startedAt?: number
  completedAt?: number
  cancelledAt?: number
  cancelledBy?: 'rider' | 'driver' | 'admin' | 'system'
  cancelReason?: string
  cancelFee?: number
  riderRating?: number
  riderComment?: string
  driverRating?: number
  chat: ChatMsg[]
  offeredTo?: string
  offerAt?: number
  declined: string[]
  commission: number
  sos?: boolean
  shared?: boolean
  note?: string
  refunded?: boolean
  forOther?: string
}

export interface Promo {
  code: string
  kind: 'percent' | 'flat'
  value: number
  maxDiscount: number
  active: boolean
  uses: number
  limit: number
  desc: string
}

export interface TicketMsg {
  from: 'user' | 'admin'
  text: string
  at: number
}

export interface Ticket {
  id: string
  by: 'rider' | 'driver'
  userId: string
  tripId?: string
  subject: string
  messages: TicketMsg[]
  status: 'open' | 'closed'
  at: number
}

export interface Notice {
  id: string
  audience: 'riders' | 'drivers' | 'all'
  title: string
  body: string
  at: number
}

export interface Settings {
  commission: number
  cancelFee: number
  freeCancelSec: number
  vat: number
  surgeOn: boolean
  surge: number
  autoBots: boolean
  speed: number
  offerSec: number
  riderOnlyWomenDrivers: boolean
}

export interface AdminLog {
  at: number
  text: string
}

export interface State {
  v: number
  riders: Rider[]
  drivers: Driver[]
  trips: Trip[]
  promos: Promo[]
  tickets: Ticket[]
  notices: Notice[]
  categories: Category[]
  settings: Settings
  log: AdminLog[]
  me: { riderId: string; driverId: string; riderSignedIn: boolean; driverSignedIn: boolean }
}

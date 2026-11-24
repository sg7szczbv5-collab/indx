/**
 * Shared domain model for the AURA ecosystem.
 * Passenger, Driver and Admin all read and write these exact shapes,
 * so a trip means the same thing in all three products.
 */

export type LatLng = { lat: number; lng: number }

export type Bilingual = { ar: string; en: string }

/** Unified trip lifecycle. These exact values are shared by all three apps. */
export type TripStatus =
  | 'searching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type Actor = 'passenger' | 'driver' | 'admin' | 'system'

export type VehicleClassId = 'go' | 'comfort' | 'black' | 'xl'

export type PaymentMethodId = 'mada' | 'apple_pay' | 'wallet' | 'cash'

export type CityId = 'riyadh' | 'jeddah' | 'dammam' | 'khobar' | 'makkah' | 'madinah'

export type Place = {
  id: string
  name: Bilingual
  sub: Bilingual
  pos: LatLng
  kind?: 'airport' | 'mall' | 'office' | 'home' | 'work' | 'landmark' | 'university' | 'pin'
}

/** All money is stored in halalas (1 SAR = 100 halalas) to avoid float drift. */
export type Halalas = number

export type FareBreakdown = {
  base: Halalas
  distance: Halalas
  time: Halalas
  surge: Halalas
  minFareTopUp: Halalas
  subtotal: Halalas
  discount: Halalas
  vat: Halalas
  total: Halalas
  /** Platform commission, charged on the subtotal (discounts are funded by the platform). */
  commission: Halalas
  /** What the captain earns from the fare (subtotal minus commission). Tips are added separately. */
  driverNet: Halalas
  vatRate: number
  commissionRate: number
  surgeMultiplier: number
  distanceKm: number
  durationMin: number
  promoCode?: string
}

export type TripLeg = {
  kind: 'approach' | 'ride'
  route: LatLng[]
  startedAt: number
  /** Simulated duration in ms (demo time runs faster than real time). */
  durationMs: number
  /** Real-world equivalent duration in minutes, for display. */
  realMinutes: number
}

export type TimelineEntry = { status: TripStatus; at: number; actor: Actor; note?: string }

export type TripRating = {
  stars: number
  tags: string[]
  comment?: string
  tip?: Halalas
  categories?: { cleanliness: number; driving: number; punctuality: number }
}

export type Trip = {
  id: string
  status: TripStatus
  cityId: CityId
  vehicleClass: VehicleClassId
  pickup: Place
  dropoff: Place
  passengerId: string
  driverId?: string
  otp: string
  fare: FareBreakdown
  paymentMethod: PaymentMethodId
  createdAt: number
  updatedAt: number
  timeline: TimelineEntry[]
  /** Current offer to a captain while searching. */
  offer?: { driverId: string; expiresAt: number; declined: string[] }
  leg?: TripLeg
  driverStartPos?: LatLng
  cancel?: { by: Actor; reason: string; at: number }
  passengerRating?: TripRating
  driverRating?: TripRating
  scheduledFor?: number
  /** In-trip messages between rider and captain (shared by both apps). */
  chat?: ChatMessage[]
  /** True for trips generated as demo history (not created in this session). */
  seeded?: boolean
}

export type ChatMessage = { from: 'passenger' | 'driver'; text: string; at: number }

export type Reservation = {
  id: string
  passengerId: string
  pickup: Place
  dropoff: Place
  vehicleClass: VehicleClassId
  at: number
  createdAt: number
  status: 'scheduled' | 'cancelled'
  estimate: Halalas
}

export type DocStatus = 'missing' | 'uploaded' | 'approved' | 'rejected'

export type DriverDoc = {
  id: 'national_id' | 'license' | 'registration' | 'insurance' | 'photo'
  status: DocStatus
  fileName?: string
  expires?: string
  note?: string
}

export type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  color: Bilingual
  colorHex: string
  plate: { digits: string; lettersAr: string; lettersEn: string }
  classId: VehicleClassId
  status: 'active' | 'inspection_due' | 'inactive'
  driverId?: string
}

export type DriverAccountStatus = 'pending_review' | 'approved' | 'rejected' | 'suspended' | 'incomplete'

export type Driver = {
  id: string
  name: Bilingual
  phone: string
  nationalId: string
  email?: string
  cityId: CityId
  status: DriverAccountStatus
  rejectionReason?: string
  online: boolean
  rating: number
  ratingsCount: number
  joinedAt: number
  vehicleId?: string
  docs: DriverDoc[]
  acceptanceRate: number
  cancellationRate: number
  punctuality: number
  /** Captain operated from the AURA Driver app in this browser (receives real offers). */
  appUser?: boolean
  /** Index into the simulated fleet loop (for seeded captains). */
  sim?: number
  avatarHue?: number
}

export type CustomerStatus = 'active' | 'blocked'

export type Customer = {
  id: string
  name: Bilingual
  phone: string
  email?: string
  cityId: CityId
  status: CustomerStatus
  blockReason?: string
  joinedAt: number
  rating: number
  walletBalance: Halalas
  tier: 'standard' | 'gold'
  saved: { home?: Place; work?: Place; others: Place[] }
}

export type TicketCategory = 'complaint' | 'report' | 'help' | 'dispute' | 'lost_item' | 'safety'
export type TicketStatus = 'open' | 'pending' | 'resolved'

export type TicketMessage = { from: 'customer' | 'driver' | 'agent' | 'system'; text: string; at: number; author?: string }

export type Ticket = {
  id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: number
  updatedAt: number
  requester: { kind: 'customer' | 'driver'; id: string }
  tripId?: string
  assignee?: string
  messages: TicketMessage[]
}

export type Promo = {
  id: string
  code: string
  title: Bilingual
  kind: 'percent' | 'fixed'
  value: number
  maxDiscount?: Halalas
  audience: 'new' | 'all' | 'gold'
  active: boolean
  startsAt: number
  endsAt: number
  used: number
  limit?: number
}

export type Campaign = {
  id: string
  name: string
  audience: 'passengers' | 'captains' | 'all'
  channel: 'push' | 'sms' | 'in_app'
  title: Bilingual
  body: Bilingual
  status: 'draft' | 'scheduled' | 'sent'
  sentAt?: number
  metrics: { sent: number; opened: number; converted: number }
  promoCode?: string
}

export type InboxItem = {
  id: string
  to: 'passengers' | 'captains' | 'all'
  title: Bilingual
  body: Bilingual
  at: number
}

export type ZoneKind = 'service' | 'restricted' | 'high_demand' | 'airport'

export type Zone = {
  id: string
  cityId: CityId
  name: Bilingual
  kind: ZoneKind
  center: LatLng
  radiusKm: number
  active: boolean
  multiplier?: number
}

export type City = {
  id: CityId
  name: Bilingual
  status: 'live' | 'pilot' | 'planned'
  center: LatLng
  districts: number
}

export type AdminRole =
  | 'super_admin'
  | 'operations_manager'
  | 'finance_manager'
  | 'customer_support'
  | 'driver_manager'
  | 'marketing_manager'

export type Permission =
  | 'dashboard.view'
  | 'livemap.view'
  | 'trips.view'
  | 'trips.cancel'
  | 'drivers.view'
  | 'drivers.edit'
  | 'drivers.approve'
  | 'drivers.suspend'
  | 'customers.view'
  | 'customers.block'
  | 'vehicles.view'
  | 'vehicles.edit'
  | 'finance.view'
  | 'finance.settle'
  | 'pricing.view'
  | 'pricing.edit'
  | 'zones.view'
  | 'zones.edit'
  | 'support.view'
  | 'support.reply'
  | 'marketing.view'
  | 'marketing.edit'
  | 'reports.view'
  | 'reports.export'
  | 'roles.manage'
  | 'settings.view'
  | 'settings.edit'
  | 'audit.view'

export type AdminUser = {
  id: string
  name: string
  email: string
  role: AdminRole
  active: boolean
  lastSeen?: number
  twoFactor: boolean
}

export type AuditEntry = {
  id: string
  at: number
  actor: string
  role: AdminRole | 'system' | 'driver' | 'passenger'
  action: string
  target?: string
  detail?: string
}

export type Payout = {
  id: string
  driverId: string
  amount: Halalas
  at: number
  status: 'paid' | 'processing'
  reference: string
}

export type Refund = {
  id: string
  tripId: string
  amount: Halalas
  at: number
  reason: string
  by: string
}

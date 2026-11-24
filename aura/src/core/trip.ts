import type { Actor, Bilingual, TripStatus } from './types'

/**
 * The single source of truth for the trip lifecycle.
 * Every app transitions trips through `canTransition` so the rules never drift apart.
 */
export const TRIP_STATUSES: TripStatus[] = [
  'searching',
  'driver_assigned',
  'driver_arriving',
  'driver_arrived',
  'in_progress',
  'completed',
  'cancelled',
]

export const ACTIVE_STATUSES: TripStatus[] = [
  'searching',
  'driver_assigned',
  'driver_arriving',
  'driver_arrived',
  'in_progress',
]

const TRANSITIONS: Record<TripStatus, Partial<Record<TripStatus, Actor[]>>> = {
  searching: {
    driver_assigned: ['driver', 'system'],
    cancelled: ['passenger', 'admin', 'system'],
  },
  driver_assigned: {
    driver_arriving: ['driver', 'system'],
    cancelled: ['passenger', 'driver', 'admin'],
  },
  driver_arriving: {
    driver_arrived: ['driver', 'system'],
    cancelled: ['passenger', 'driver', 'admin'],
  },
  driver_arrived: {
    in_progress: ['driver', 'system'],
    cancelled: ['passenger', 'driver', 'admin'],
  },
  in_progress: {
    completed: ['driver', 'system'],
    cancelled: ['admin'],
  },
  completed: {},
  cancelled: {},
}

export function canTransition(from: TripStatus, to: TripStatus, actor: Actor): boolean {
  return (TRANSITIONS[from][to] ?? []).includes(actor)
}

export function isActive(s: TripStatus) {
  return ACTIVE_STATUSES.includes(s)
}

export const STATUS_LABEL: Record<TripStatus, Bilingual> = {
  searching: { ar: 'جارٍ البحث عن كابتن', en: 'Searching' },
  driver_assigned: { ar: 'تم تعيين كابتن', en: 'Captain assigned' },
  driver_arriving: { ar: 'الكابتن في الطريق', en: 'Captain arriving' },
  driver_arrived: { ar: 'الكابتن وصل', en: 'Captain arrived' },
  in_progress: { ar: 'الرحلة جارية', en: 'In progress' },
  completed: { ar: 'مكتملة', en: 'Completed' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled' },
}

/** Visual tone per status. Green = live movement (brand rule), ink = done, red only for cancelled. */
export const STATUS_TONE: Record<TripStatus, 'live' | 'pending' | 'done' | 'danger' | 'neutral'> = {
  searching: 'pending',
  driver_assigned: 'live',
  driver_arriving: 'live',
  driver_arrived: 'live',
  in_progress: 'live',
  completed: 'done',
  cancelled: 'danger',
}

export const CANCEL_REASONS: Record<'passenger' | 'driver' | 'admin', Bilingual[]> = {
  passenger: [
    { ar: 'تغيّرت خططي', en: 'My plans changed' },
    { ar: 'وقت الوصول طويل', en: 'Wait time too long' },
    { ar: 'طلبت بالخطأ', en: 'Requested by mistake' },
    { ar: 'الكابتن طلب الإلغاء', en: 'Captain asked me to cancel' },
  ],
  driver: [
    { ar: 'الراكب لم يحضر', en: 'Rider no-show' },
    { ar: 'عطل في المركبة', en: 'Vehicle issue' },
    { ar: 'الموقع غير آمن للتوقف', en: 'Pickup spot unsafe' },
    { ar: 'طلب الراكب الإلغاء', en: 'Rider asked to cancel' },
  ],
  admin: [
    { ar: 'بلاغ أمان', en: 'Safety report' },
    { ar: 'احتيال مشتبه', en: 'Suspected fraud' },
    { ar: 'خطأ تقني', en: 'Technical error' },
    { ar: 'طلب العميل عبر الدعم', en: 'Customer request via support' },
  ],
}

export function newTripId(now = Date.now()) {
  const n = Math.floor((now / 1000) % 1_000_000)
    .toString()
    .padStart(6, '0')
  const r = Math.floor(Math.random() * 90 + 10)
  return `AUR-${n}${r}`
}

export function newOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

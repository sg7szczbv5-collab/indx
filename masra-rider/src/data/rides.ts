import type { Place } from './places'

// Illustrative planning tariffs for the prototype — NOT approved prices.
export type RideType = {
  id: 'eco' | 'comfort' | 'lux' | 'family' | 'xl'
  name: string
  desc: string
  seats: number
  mult: number
  eta: number
  section: 'rec' | 'pop'
  car: 'sedan' | 'suv' | 'van' | 'lux'
  color: string
  tag?: string
}

export const RIDE_TYPES: RideType[] = [
  { id: 'eco', name: 'اقتصادي', desc: 'رحلات يومية بسعر مناسب', seats: 4, mult: 1, eta: 3, section: 'rec', car: 'sedan', color: '#F4F6F5', tag: 'الأوفر' },
  { id: 'comfort', name: 'مريح', desc: 'سيارات أحدث ومساحة أكبر للأرجل', seats: 4, mult: 1.25, eta: 5, section: 'rec', car: 'sedan', color: '#9AA39E' },
  { id: 'lux', name: 'فاخر', desc: 'سيارات فاخرة وسائقون بتقييم عالٍ', seats: 4, mult: 2.2, eta: 9, section: 'rec', car: 'lux', color: '#1A1E1C' },
  { id: 'family', name: 'عائلي', desc: 'مقاعد إضافية ومقعد أطفال عند الطلب', seats: 6, mult: 1.4, eta: 7, section: 'pop', car: 'suv', color: '#E9ECEA' },
  { id: 'xl', name: 'XL', desc: 'مركبات واسعة للمجموعات والأمتعة', seats: 7, mult: 1.6, eta: 8, section: 'pop', car: 'van', color: '#0F5B3A' },
]

const BASE = 8
const PER_KM = 1.9
const PER_MIN = 0.35
const MIN_FARE = 14

export const fareFor = (p: Place, r: RideType) =>
  Math.max(MIN_FARE, Math.round((BASE + p.km * PER_KM + p.min * PER_MIN) * r.mult))

export type PaymentMethod = { id: 'card' | 'wallet' | 'cash'; name: string; detail: string }

export const PAYMENTS: PaymentMethod[] = [
  { id: 'card', name: 'بطاقة مصرفية', detail: '•••• 4821' },
  { id: 'wallet', name: 'محفظة مَسْرى', detail: 'الرصيد 120 ر.س' },
  { id: 'cash', name: 'نقداً', detail: 'الدفع للسائق' },
]

export type Driver = {
  name: string
  initials: string
  model: string
  plateAr: string
  plateArNum: string
  plateEn: string
  plateNum: string
  rating: number
  trips: number
  pin: string
}

export const DEMO_DRIVER: Driver = {
  name: 'فهد العتيبي',
  initials: 'ف ع',
  model: 'تويوتا كامري · أبيض',
  plateAr: 'ب ر ح',
  plateArNum: '٤٨٢٧',
  plateEn: 'B R H',
  plateNum: '4827',
  rating: 4.92,
  trips: 1284,
  pin: '7586',
}

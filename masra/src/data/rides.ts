// All values below are illustrative planning assumptions for the prototype — NOT approved tariffs.

export type Place = { id: string; name: string; area: string; addr: string; km: number; min: number; kind?: 'airport' | 'recent' | 'place' }

export const PLACES: Place[] = [
  { id: 'airport', name: 'مطار الملك فهد الدولي', area: 'الدمام', addr: 'طريق المطار، الدمام', kind: 'airport', km: 31.5, min: 28 },
  { id: 'corniche-k', name: 'كورنيش الخبر', area: 'الخبر', addr: 'طريق الكورنيش، الخبر الشمالية', kind: 'recent', km: 14.2, min: 18 },
  { id: 'kfupm', name: 'جامعة الملك فهد للبترول والمعادن', area: 'الظهران', addr: 'شارع الجامعة، الظهران', kind: 'place', km: 11.8, min: 15 },
  { id: 'waterfront', name: 'الواجهة البحرية', area: 'الدمام', addr: 'طريق الخليج، حي الشاطئ', kind: 'recent', km: 6.4, min: 11 },
  { id: 'station', name: 'محطة قطار الدمام', area: 'الدمام', addr: 'طريق الملك سعود، حي العدامة', kind: 'place', km: 8.9, min: 14 },
  { id: 'causeway', name: 'مدخل جسر الملك فهد', area: 'الخبر', addr: 'طريق جسر الملك فهد، الخبر', kind: 'place', km: 24.6, min: 24 },
]

export type RideType = {
  id: string
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
  { id: 'eco', name: 'اقتصادي', desc: 'رحلات يومية بسعر مناسب', seats: 4, mult: 1, eta: 3, section: 'rec', car: 'sedan', color: '#f4f6f5', tag: 'الأوفر' },
  { id: 'comfort', name: 'مريح', desc: 'سيارات أحدث ومساحة أكبر للأرجل', seats: 4, mult: 1.25, eta: 5, section: 'rec', car: 'sedan', color: '#9aa39e' },
  { id: 'lux', name: 'فاخر', desc: 'سيارات فاخرة وسائقون بتقييم عالٍ', seats: 4, mult: 2.2, eta: 9, section: 'rec', car: 'lux', color: '#1a1e1c' },
  { id: 'family', name: 'عائلي', desc: 'مقاعد إضافية ومقعد أطفال عند الطلب', seats: 6, mult: 1.4, eta: 7, section: 'pop', car: 'suv', color: '#e9ecea' },
  { id: 'xl', name: 'XL', desc: 'مركبات واسعة للمجموعات والأمتعة', seats: 7, mult: 1.6, eta: 8, section: 'pop', car: 'van', color: '#0f5b3a' },
]

const BASE = 8
const PER_KM = 1.9
const PER_MIN = 0.35
const MIN_FARE = 14

export const fareFor = (p: Place, r: RideType) =>
  Math.max(MIN_FARE, Math.round((BASE + p.km * PER_KM + p.min * PER_MIN) * r.mult))

export const PAYMENTS = [
  { id: 'card', name: 'بطاقة مصرفية', detail: '•••• 4821' },
  { id: 'wallet', name: 'محفظة مَسْرى', detail: 'الرصيد 120 ر.س' },
  { id: 'cash', name: 'نقداً', detail: 'الدفع للسائق' },
]

export const DEMO_DRIVER = {
  name: 'فهد العتيبي',
  initials: 'ف ع',
  car: 'سيدان · أبيض · 2024',
  model: 'تويوتا كامري · أبيض',
  pin: '7586',
  plateAr: 'ب ر ح',
  plateNum: '4827',
  plateEn: 'B R H',
  rating: 4.92,
  trips: 1284,
}

/** Demo clock: the phone status bar shows 9:41, every ETA is computed from it. */
export const clockAt = (addMin: number) => {
  const t = 9 * 60 + 41 + Math.round(addMin)
  return `${Math.floor(t / 60) % 12 || 12}:${String(t % 60).padStart(2, '0')}`
}

// All values below are illustrative planning assumptions for the prototype — NOT approved tariffs.

export type Place = { id: string; name: string; area: string; km: number; min: number }

export const PLACES: Place[] = [
  { id: 'airport', name: 'مطار الملك فهد الدولي', area: 'الدمام', km: 31.5, min: 28 },
  { id: 'corniche-k', name: 'كورنيش الخبر', area: 'الخبر', km: 14.2, min: 18 },
  { id: 'kfupm', name: 'جامعة الملك فهد للبترول والمعادن', area: 'الظهران', km: 11.8, min: 15 },
  { id: 'waterfront', name: 'الواجهة البحرية', area: 'الدمام', km: 6.4, min: 11 },
  { id: 'station', name: 'محطة قطار الدمام', area: 'الدمام', km: 8.9, min: 14 },
  { id: 'causeway', name: 'مدخل جسر الملك فهد', area: 'الخبر', km: 24.6, min: 24 },
]

export type RideType = {
  id: string
  name: string
  desc: string
  seats: number
  mult: number
  eta: number
}

export const RIDE_TYPES: RideType[] = [
  { id: 'eco', name: 'اقتصادي', desc: 'رحلات يومية بسعر مناسب', seats: 4, mult: 1, eta: 3 },
  { id: 'comfort', name: 'مريح', desc: 'سيارات أحدث ومساحة أكبر', seats: 4, mult: 1.25, eta: 5 },
  { id: 'family', name: 'عائلي', desc: 'مقاعد إضافية للعائلة', seats: 6, mult: 1.4, eta: 7 },
  { id: 'xl', name: 'XL', desc: 'مركبات واسعة للمجموعات', seats: 7, mult: 1.6, eta: 8 },
  { id: 'lux', name: 'فاخر', desc: 'تجربة راقية وسائقون مميزون', seats: 4, mult: 2.2, eta: 9 },
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
  plateAr: 'ب ر ح',
  plateNum: '4827',
  plateEn: 'B R H',
  rating: 4.92,
  trips: 1284,
}

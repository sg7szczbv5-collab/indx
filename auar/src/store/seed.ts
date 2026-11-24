import { PLACES, roadPointFromSeed, route, routeKm, kmToMin, type Point } from '../lib/geo'
import { quote, commissionOf } from '../lib/pricing'
import type { Category, Driver, Rider, State, Trip, CategoryId, PaymentMethod } from './types'

export const CATEGORIES: Category[] = [
  { id: 'go', name: 'AUAR Go', desc: 'رحلات يومية بأسعار مناسبة', seats: 4, base: 6, perKm: 1.6, perMin: 0.35, minFare: 12, enabled: true },
  { id: 'comfort', name: 'Comfort', desc: 'سيارات أحدث ومساحة أوسع للأرجل', seats: 4, base: 8, perKm: 2.0, perMin: 0.45, minFare: 16, enabled: true },
  { id: 'xl', name: 'AUAR XL', desc: 'سيارات عائلية حتى ٦ ركاب', seats: 6, base: 10, perKm: 2.4, perMin: 0.5, minFare: 20, enabled: true },
  { id: 'black', name: 'Black', desc: 'سيارات فاخرة وسائقون بتقييم عالٍ', seats: 4, base: 18, perKm: 3.6, perMin: 0.8, minFare: 40, enabled: true },
  { id: 'her', name: 'AUAR Her', desc: 'سائقات لراكبات فقط', seats: 4, base: 7, perKm: 1.8, perMin: 0.4, minFare: 14, enabled: true },
  { id: 'moto', name: 'Moto', desc: 'دراجة نارية — الأسرع في الزحام', seats: 1, base: 3, perKm: 0.9, perMin: 0.2, minFare: 7, enabled: true },
  { id: 'courier', name: 'توصيل طرود', desc: 'أرسل غرضاً لأي مكان في المدينة', seats: 0, base: 5, perKm: 1.4, perMin: 0.25, minFare: 10, enabled: true },
]

const COLORS = ['#2F5BFF', '#0EA5A4', '#F97316', '#8B5CF6', '#E11D48', '#16A34A', '#CA8A04', '#0284C7']

const NAMES_M = ['فهد العتيبي', 'سلطان القحطاني', 'خالد الشمري', 'عبدالله الدوسري', 'ماجد الحربي', 'تركي المطيري', 'نايف الزهراني', 'بندر الغامدي', 'سعود العنزي', 'محمد السبيعي', 'ياسر الشهري', 'عمر باوزير']
const NAMES_F = ['نورة السالم', 'ريم العمري', 'هيفاء الرشيد']
const CARS: [string, string, string, string, CategoryId[]][] = [
  ['تويوتا', 'كامري', 'أبيض', '#f4f4f4', ['go', 'comfort']],
  ['هيونداي', 'سوناتا', 'فضي', '#c7ccd1', ['go', 'comfort']],
  ['كيا', 'K5', 'أسود', '#1d1d1f', ['go', 'comfort']],
  ['جي إم سي', 'يوكن', 'أسود', '#111111', ['xl', 'black']],
  ['لكزس', 'ES 350', 'أسود', '#151515', ['black', 'comfort']],
  ['نيسان', 'صني', 'أبيض', '#f4f4f4', ['go']],
  ['تويوتا', 'إنوفا', 'رمادي', '#8a9097', ['xl', 'go']],
  ['هوندا', 'أكورد', 'أزرق', '#1e3a8a', ['comfort', 'go']],
  ['شيفروليه', 'تاهو', 'أبيض', '#f4f4f4', ['xl', 'black']],
  ['ياماها', 'NMAX', 'أحمر', '#dc2626', ['moto', 'courier']],
  ['تويوتا', 'يارس', 'أبيض', '#f4f4f4', ['go', 'courier']],
  ['مرسيدس', 'E-Class', 'أسود', '#121212', ['black']],
]
const PLATE_L = ['أ ب ج', 'ر س ع', 'ط ك ل', 'ه و ي', 'د ر ص', 'ق ن ب', 'ح ل م', 'ع ي س']

export function plate(i: number) {
  return `${PLATE_L[i % PLATE_L.length]} ${1000 + ((i * 7919) % 8999)}`
}

export function makeDriver(i: number, name: string, gender: 'm' | 'f', bot: boolean, pos?: Point): Driver {
  const car = gender === 'f' ? (['تويوتا', 'كورولا', 'أبيض', '#f4f4f4', ['her', 'go']] as (typeof CARS)[number]) : CARS[i % CARS.length]
  return {
    id: `D${100 + i}`,
    name,
    phone: `05${String(50000000 + i * 1234567).slice(0, 8)}`,
    city: 'الرياض',
    rating: Math.round((4.6 + ((i * 37) % 40) / 100) * 100) / 100,
    ratingsCount: 120 + ((i * 131) % 1800),
    car: { make: car[0], model: car[1], color: car[2], colorHex: car[3], plate: plate(i), year: 2020 + (i % 6) },
    categories: car[4],
    status: 'active',
    online: true,
    bot,
    pos: pos ?? roadPointFromSeed(i + 3),
    heading: 0,
    balance: Math.round((((i * 53) % 400) - 80) * 100) / 100,
    acceptRate: 0.82 + ((i * 7) % 17) / 100,
    docs: { license: true, idCard: true, registration: true, insurance: true },
    joinedAt: Date.now() - (30 + i * 40) * 86400000,
    gender,
    color: COLORS[i % COLORS.length],
  }
}

function makeRider(i: number, name: string, gender: 'm' | 'f'): Rider {
  return {
    id: `R${100 + i}`,
    name,
    phone: `05${String(40000000 + i * 2345671).slice(0, 8)}`,
    email: `user${100 + i}@mail.com`,
    rating: Math.round((4.5 + ((i * 29) % 50) / 100) * 100) / 100,
    wallet: (i * 37) % 120,
    blocked: false,
    joinedAt: Date.now() - (10 + i * 25) * 86400000,
    color: COLORS[(i + 3) % COLORS.length],
    defaultPayment: 'card',
    emergencyName: '',
    emergencyPhone: '',
    gender,
  }
}

const RIDER_NAMES: [string, 'm' | 'f'][] = [
  ['عبدالرحمن الفايز', 'm'],
  ['سارة الحمدان', 'f'],
  ['أحمد الجهني', 'm'],
  ['لمى القرني', 'f'],
  ['يوسف المالكي', 'm'],
  ['دانة الخالدي', 'f'],
  ['راكان العسيري', 'm'],
  ['مشاعل البقمي', 'f'],
  ['حسن الأحمدي', 'm'],
]

/** Builds a past (completed or cancelled) trip for history and reports. */
function pastTrip(s: State, i: number, now: number): Trip {
  const rider = s.riders[i % s.riders.length]
  const drivers = s.drivers.filter((d) => d.bot)
  const driver = drivers[(i * 5) % drivers.length]
  const a = PLACES[(i * 3) % PLACES.length]
  let b = PLACES[(i * 7 + 2) % PLACES.length]
  if (b.id === a.id) b = PLACES[(i + 5) % PLACES.length]
  const path = route(a.p, b.p)
  const km = routeKm(path)
  const min = kmToMin(km)
  const cat = s.categories.find((c) => driver.categories.includes(c.id))!
  const q = quote(cat, km, min, { ...s.settings, surgeOn: i % 6 === 0, surge: 1.3 })
  const hoursAgo = i * 2.7 + (i % 3)
  const t = now - hoursAgo * 3600000
  const cancelled = i % 11 === 4
  const pays: PaymentMethod[] = ['card', 'cash', 'wallet', 'apple']
  return {
    id: `T${5000 + i}`,
    riderId: rider.id,
    driverId: driver.id,
    category: cat.id,
    pickup: { name: a.name, sub: a.sub, p: a.p },
    dropoff: { name: b.name, sub: b.sub, p: b.p },
    path,
    approach: [],
    distanceKm: km,
    durationMin: min,
    fare: q.fare,
    surge: q.surge,
    discount: 0,
    tip: i % 4 === 0 && !cancelled ? 5 : 0,
    payment: pays[i % 4],
    status: cancelled ? 'cancelled' : 'completed',
    pin: '0000',
    requestedAt: t - min * 60000 - 300000,
    acceptedAt: t - min * 60000 - 280000,
    arrivedAt: cancelled ? undefined : t - min * 60000 - 30000,
    startedAt: cancelled ? undefined : t - min * 60000,
    completedAt: cancelled ? undefined : t,
    cancelledAt: cancelled ? t : undefined,
    cancelledBy: cancelled ? 'rider' : undefined,
    cancelReason: cancelled ? 'تغيرت الخطط' : undefined,
    riderRating: cancelled ? undefined : 5 - (i % 5 === 0 ? 1 : 0),
    driverRating: cancelled ? undefined : 5,
    chat: [],
    declined: [],
    commission: cancelled ? 0 : commissionOf(q.fare, s.settings),
  }
}

/** Production start: services and settings only, no people or trips. */
export function seedProduction(): State {
  return {
    v: 4,
    riders: [],
    drivers: [],
    trips: [],
    promos: [{ code: 'WELCOME', kind: 'flat', value: 10, maxDiscount: 10, active: true, uses: 0, limit: 5000, desc: '١٠ ر.س على رحلتك الأولى' }],
    tickets: [],
    notices: [],
    categories: structuredClone(CATEGORIES),
    settings: { commission: 0.2, cancelFee: 10, freeCancelSec: 120, vat: 0.15, surgeOn: false, surge: 1.4, autoBots: false, speed: 1, offerSec: 20, riderOnlyWomenDrivers: true },
    log: [{ at: Date.now(), text: 'تم تشغيل المنصة' }],
    payments: [],
    me: { riderId: '', driverId: '', riderSignedIn: false, driverSignedIn: false },
  }
}

export function seed(): State {
  const now = Date.now()
  const drivers: Driver[] = []
  // the demo driver account (you)
  const me = makeDriver(0, 'عبدالعزيز الحربي', 'm', false, { x: 300, y: 420 })
  me.online = false
  me.balance = 245.5
  me.rating = 4.93
  drivers.push(me)
  NAMES_M.forEach((n, i) => drivers.push(makeDriver(i + 1, n, 'm', true)))
  NAMES_F.forEach((n, i) => drivers.push(makeDriver(i + 20, n, 'f', true)))
  // applications waiting for admin review
  const pend1 = makeDriver(40, 'مازن الرويلي', 'm', true)
  pend1.status = 'pending'
  pend1.online = false
  pend1.docs.insurance = false
  const pend2 = makeDriver(41, 'وعد الحارثي', 'f', true)
  pend2.status = 'pending'
  pend2.online = false
  drivers.push(pend1, pend2)
  // a few bots offline
  drivers[5].online = false
  drivers[9].online = false

  const riders: Rider[] = [
    {
      ...makeRider(0, 'محمد العمري', 'm'),
      id: 'R100',
      wallet: 85,
      rating: 4.91,
      emergencyName: 'أبو فيصل',
      emergencyPhone: '0551234567',
    },
    ...RIDER_NAMES.map(([n, g], i) => makeRider(i + 1, n, g)),
  ]

  const s: State = {
    v: 4,
    riders,
    drivers,
    trips: [],
    promos: [
      { code: 'AUAR20', kind: 'percent', value: 20, maxDiscount: 15, active: true, uses: 134, limit: 1000, desc: 'خصم ٢٠٪ حتى ١٥ ر.س' },
      { code: 'WELCOME', kind: 'flat', value: 10, maxDiscount: 10, active: true, uses: 412, limit: 5000, desc: '١٠ ر.س على رحلتك' },
      { code: 'RAMADAN', kind: 'percent', value: 30, maxDiscount: 25, active: false, uses: 980, limit: 1000, desc: 'عرض رمضان — منتهي' },
    ],
    tickets: [],
    notices: [
      { id: 'N1', audience: 'drivers', title: 'ساعات الذروة الليلة', body: 'الطلب مرتفع قرب بوليفارد رياض سيتي من ٩ مساءً — أرباح إضافية ×١.٣', at: now - 3600000 * 3 },
      { id: 'N2', audience: 'riders', title: 'خصم ٢٠٪', body: 'استخدم الرمز AUAR20 على رحلاتك هذا الأسبوع', at: now - 3600000 * 20 },
    ],
    categories: structuredClone(CATEGORIES),
    settings: {
      commission: 0.2,
      cancelFee: 10,
      freeCancelSec: 120,
      vat: 0.15,
      surgeOn: false,
      surge: 1.4,
      autoBots: true,
      speed: 12,
      offerSec: 20,
      riderOnlyWomenDrivers: true,
    },
    log: [{ at: now - 600000, text: 'تم تشغيل المنصة' }],
    payments: [],
    me: { riderId: 'R100', driverId: 'D100', riderSignedIn: false, driverSignedIn: false },
  }
  s.trips = Array.from({ length: 46 }, (_, i) => pastTrip(s, i + 1, now))
  // a few trips for the demo rider & driver
  s.trips.slice(0, 8).forEach((t, i) => {
    if (i % 2 === 0) t.riderId = 'R100'
    if (i % 3 === 0 && t.status === 'completed') t.driverId = 'D100'
  })
  s.payments = s.trips
    .filter((t) => t.status === 'completed')
    .map((t, i) => ({ id: `P${9000 + i}`, kind: 'trip' as const, tripId: t.id, riderId: t.riderId, driverId: t.driverId, method: t.payment, amount: t.fare, status: 'paid' as const, provider: (t.payment === 'cash' ? 'cash' : 'internal') as 'cash' | 'internal', at: t.completedAt! }))
  s.tickets = [
    {
      id: 'TK101',
      by: 'rider',
      userId: 'R102',
      tripId: s.trips[3].id,
      subject: 'تم احتساب مبلغ أعلى من المتوقع',
      messages: [{ from: 'user', text: 'السعر النهائي أعلى من التقدير بـ ٨ ريال، أرجو المراجعة.', at: now - 7200000 }],
      status: 'open',
      at: now - 7200000,
    },
    {
      id: 'TK102',
      by: 'driver',
      userId: 'D103',
      subject: 'تأخر تحويل الأرباح',
      messages: [{ from: 'user', text: 'طلبت سحب الأرباح من يومين ولم يصل.', at: now - 86400000 }],
      status: 'open',
      at: now - 86400000,
    },
  ]
  return s
}

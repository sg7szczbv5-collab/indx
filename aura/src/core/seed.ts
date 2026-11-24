/**
 * DEMO DATA. Everything in this file is generated for interface design and demonstration.
 * None of these people, vehicles, trips, amounts or metrics are real.
 * Generation is deterministic (seeded) so the demo looks the same on every load.
 */
import { DEFAULT_PRICING, quoteFare, VEHICLE_CLASSES } from './pricing'
import { CITIES, DEMO_HOME, DEMO_WORK, PLACES, minutesFor, offsetKm, roadKm, routeBetween } from './geo'
import { DAY } from './format'
import type {
  AdminRole,
  AdminUser,
  AuditEntry,
  Campaign,
  CityId,
  Customer,
  Driver,
  DriverDoc,
  PaymentMethodId,
  Permission,
  Place,
  Promo,
  Ticket,
  Trip,
  Vehicle,
  VehicleClassId,
  Zone,
} from './types'

export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)]

const FIRST: [string, string][] = [
  ['فيصل', 'Faisal'], ['عبدالله', 'Abdullah'], ['محمد', 'Mohammed'], ['خالد', 'Khalid'], ['سعود', 'Saud'],
  ['تركي', 'Turki'], ['ناصر', 'Nasser'], ['سلطان', 'Sultan'], ['ماجد', 'Majed'], ['فهد', 'Fahad'],
  ['يوسف', 'Yousef'], ['عمر', 'Omar'], ['بندر', 'Bandar'], ['راكان', 'Rakan'], ['زياد', 'Ziyad'],
  ['حمد', 'Hamad'], ['مشعل', 'Mishal'], ['نواف', 'Nawaf'], ['عبدالرحمن', 'Abdulrahman'], ['إبراهيم', 'Ibrahim'],
]
const FIRST_F: [string, string][] = [
  ['سارة', 'Sarah'], ['نورة', 'Noura'], ['ريم', 'Reem'], ['لمى', 'Lama'], ['هيفاء', 'Haifa'],
  ['جود', 'Joud'], ['دانة', 'Dana'], ['أمل', 'Amal'], ['منيرة', 'Munira'], ['شهد', 'Shahad'],
]
const LAST: [string, string][] = [
  ['العتيبي', 'Al-Otaibi'], ['القحطاني', 'Al-Qahtani'], ['الشهري', 'Al-Shehri'], ['الدوسري', 'Al-Dosari'],
  ['الغامدي', 'Al-Ghamdi'], ['الزهراني', 'Al-Zahrani'], ['الحربي', 'Al-Harbi'], ['المطيري', 'Al-Mutairi'],
  ['السبيعي', 'Al-Subaie'], ['العنزي', 'Al-Anazi'], ['الشمري', 'Al-Shammari'], ['المالكي', 'Al-Maliki'],
  ['البقمي', 'Al-Buqami'], ['السهلي', 'Al-Sahli'], ['الرشيدي', 'Al-Rashidi'],
]

const CARS: Record<VehicleClassId, [string, string][]> = {
  go: [['Toyota', 'Camry'], ['Hyundai', 'Elantra'], ['Kia', 'Cerato'], ['Nissan', 'Altima']],
  comfort: [['Toyota', 'Camry'], ['Kia', 'K5'], ['Hyundai', 'Sonata'], ['Honda', 'Accord']],
  black: [['Lexus', 'ES 350'], ['Mercedes-Benz', 'E 200'], ['Genesis', 'G80']],
  xl: [['GMC', 'Yukon'], ['Hyundai', 'Staria'], ['Chevrolet', 'Tahoe']],
}
const COLORS: { ar: string; en: string; hex: string }[] = [
  { ar: 'أبيض', en: 'White', hex: '#F5F5F3' },
  { ar: 'أسود', en: 'Black', hex: '#141516' },
  { ar: 'فضي', en: 'Silver', hex: '#B9BCBE' },
  { ar: 'رمادي', en: 'Grey', hex: '#6E7174' },
]
const PLATE_LETTERS: [string, string][] = [
  ['ر ح ب', 'RHB'], ['أ ب د', 'ABD'], ['س ع د', 'SED'], ['ن و ر', 'NWR'], ['ك م ل', 'KML'], ['ط ي ب', 'TYB'], ['ه ـ ل', 'HEL'],
]

function docs(status: 'approved' | 'uploaded' | 'mixed', r: () => number): DriverDoc[] {
  const ids: DriverDoc['id'][] = ['national_id', 'license', 'registration', 'insurance', 'photo']
  return ids.map((id) => ({
    id,
    status: status === 'approved' ? 'approved' : status === 'uploaded' ? 'uploaded' : r() > 0.3 ? 'approved' : 'uploaded',
    fileName: `${id}.pdf`,
    expires: id === 'photo' ? undefined : `${2026 + Math.floor(r() * 3) + 1}-0${1 + Math.floor(r() * 9)}-15`,
  }))
}

export const DEMO_DRIVER_ID = 'cap-001'
export const DEMO_PASSENGER_ID = 'cus-001'

export function seedFleet(now: number) {
  const r = rng(7)
  const drivers: Driver[] = []
  const vehicles: Vehicle[] = []
  const cityPlan: CityId[] = [
    ...Array(30).fill('riyadh'),
    ...Array(6).fill('jeddah'),
    ...Array(4).fill('dammam'),
    ...Array(2).fill('khobar'),
    ...Array(2).fill('makkah'),
  ]
  cityPlan.forEach((cityId, i) => {
    const [fa, fe] = i === 0 ? FIRST[0] : pick(r, FIRST)
    const [la, le] = i === 0 ? LAST[0] : pick(r, LAST)
    const classId: VehicleClassId = i === 0 ? 'comfort' : pick(r, ['go', 'go', 'go', 'comfort', 'comfort', 'black', 'xl'] as VehicleClassId[])
    const [make, model] = i === 0 ? ['Toyota', 'Camry'] : pick(r, CARS[classId])
    const color = i === 0 ? COLORS[1] : classId === 'black' ? COLORS[1] : pick(r, COLORS)
    const letters = i === 0 ? PLATE_LETTERS[0] : pick(r, PLATE_LETTERS)
    const id = `cap-${String(i + 1).padStart(3, '0')}`
    const vid = `veh-${String(i + 1).padStart(3, '0')}`
    const status: Driver['status'] = i === 0 ? 'approved' : i >= 40 ? 'pending_review' : i === 37 ? 'suspended' : 'approved'
    vehicles.push({
      id: vid,
      make,
      model,
      year: i === 0 ? 2024 : 2020 + Math.floor(r() * 6),
      color: { ar: color.ar, en: color.en },
      colorHex: color.hex,
      plate: { digits: i === 0 ? '1234' : String(1000 + Math.floor(r() * 8999)), lettersAr: letters[0], lettersEn: letters[1] },
      classId,
      status: i === 12 ? 'inspection_due' : 'active',
      driverId: id,
    })
    drivers.push({
      id,
      name: { ar: `${fa} ${la}`, en: `${fe} ${le}` },
      phone: i === 0 ? '+966 55 123 4567' : `+966 5${Math.floor(r() * 9)} ${Math.floor(100 + r() * 899)} ${Math.floor(1000 + r() * 8999)}`,
      nationalId: `1${Math.floor(100000000 + r() * 899999999)}`,
      email: `${fe.toLowerCase()}.${le.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      cityId,
      status,
      online: status === 'approved' && cityId === 'riyadh' && i !== 0 ? r() > 0.25 : false,
      rating: i === 0 ? 4.96 : Math.round((4.55 + r() * 0.44) * 100) / 100,
      ratingsCount: i === 0 ? 1268 : Math.floor(80 + r() * 2400),
      joinedAt: now - Math.floor((30 + r() * 600) * DAY),
      vehicleId: vid,
      docs: docs(status === 'pending_review' ? 'uploaded' : 'approved', r),
      acceptanceRate: i === 0 ? 0.94 : Math.round((0.78 + r() * 0.2) * 100) / 100,
      cancellationRate: i === 0 ? 0.02 : Math.round((0.01 + r() * 0.07) * 100) / 100,
      punctuality: i === 0 ? 0.97 : Math.round((0.86 + r() * 0.13) * 100) / 100,
      appUser: i === 0,
      sim: cityId === 'riyadh' && i !== 0 ? i : undefined,
      avatarHue: Math.floor(r() * 360),
    })
  })
  return { drivers, vehicles }
}

export function seedCustomers(now: number): Customer[] {
  const r = rng(11)
  const list: Customer[] = []
  for (let i = 0; i < 72; i++) {
    const female = i === 0 || r() > 0.55
    const [fa, fe] = i === 0 ? FIRST_F[0] : pick(r, female ? FIRST_F : FIRST)
    const [la, le] = i === 0 ? LAST[1] : pick(r, LAST)
    const cityId: CityId = i < 50 ? 'riyadh' : pick(r, ['jeddah', 'dammam', 'khobar', 'makkah'] as CityId[])
    list.push({
      id: `cus-${String(i + 1).padStart(3, '0')}`,
      name: { ar: `${fa} ${la}`, en: `${fe} ${le}` },
      phone: i === 0 ? '+966 55 765 4321' : `+966 5${Math.floor(r() * 9)} ${Math.floor(100 + r() * 899)} ${Math.floor(1000 + r() * 8999)}`,
      email: `${fe.toLowerCase()}${i}@example.com`,
      cityId,
      status: i === 9 || i === 31 ? 'blocked' : 'active',
      blockReason: i === 9 || i === 31 ? 'Repeated no-shows (demo)' : undefined,
      joinedAt: now - Math.floor((2 + r() * 330) * DAY),
      rating: Math.round((4.4 + r() * 0.6) * 100) / 100,
      walletBalance: i === 0 ? 8650 : Math.floor(r() * 12000),
      tier: i === 0 || r() > 0.8 ? 'gold' : 'standard',
      saved: i === 0 ? { home: DEMO_HOME, work: DEMO_WORK, others: [PLACES[3], PLACES[4]] } : { others: [] },
    })
  }
  return list
}

/** Deterministic historical trips over the last 30 days (DEMO). */
export function seedHistory(now: number, drivers: Driver[], customers: Customer[]): Trip[] {
  const r = rng(23)
  const trips: Trip[] = []
  const today0 = new Date(now)
  today0.setHours(0, 0, 0, 0)
  const cityWeights: CityId[] = ['riyadh', 'riyadh', 'riyadh', 'riyadh', 'riyadh', 'jeddah', 'jeddah', 'dammam', 'khobar', 'makkah']
  const approved = drivers.filter((d) => d.status === 'approved' || d.status === 'suspended')
  for (let dayBack = 29; dayBack >= 0; dayBack--) {
    const dayStart = today0.getTime() - dayBack * DAY
    const weekday = new Date(dayStart).getDay()
    const growth = 1 + (29 - dayBack) * 0.018
    const weekend = weekday === 4 || weekday === 5 ? 1.25 : 1
    const count = Math.round((34 + r() * 8) * growth * weekend)
    for (let k = 0; k < count; k++) {
      const hour = Math.min(23, Math.floor(6 + Math.pow(r(), 0.8) * 18))
      const createdAt = dayStart + hour * 3600_000 + Math.floor(r() * 3600_000)
      if (createdAt > now - 15 * 60_000) continue
      const cityId = pick(r, cityWeights)
      const cityDrivers = approved.filter((d) => d.cityId === cityId)
      const driver = cityId === 'riyadh' && r() < 0.12 ? approved[0] : pick(r, cityDrivers.length ? cityDrivers : approved)
      const cityCustomers = customers.filter((c) => c.cityId === cityId)
      const customer = cityId === 'riyadh' && r() < 0.05 ? customers[0] : pick(r, cityCustomers.length ? cityCustomers : customers)
      const vClass = (pick(r, ['go', 'go', 'go', 'go', 'comfort', 'comfort', 'black', 'xl']) as VehicleClassId)
      let pickup: Place
      let dropoff: Place
      if (cityId === 'riyadh') {
        pickup = pick(r, PLACES)
        dropoff = pick(r, PLACES.filter((p) => p.id !== pickup.id))
      } else {
        const c = CITIES.find((x) => x.id === cityId)!
        const a = offsetKm(c.center, (r() - 0.5) * 14, (r() - 0.5) * 14)
        const b = offsetKm(c.center, (r() - 0.5) * 16, (r() - 0.5) * 16)
        pickup = { id: `p${k}`, name: { ar: 'موقع انطلاق', en: 'Pickup point' }, sub: { ar: c.name.ar, en: c.name.en }, pos: a }
        dropoff = { id: `d${k}`, name: { ar: 'وجهة', en: 'Destination' }, sub: { ar: c.name.ar, en: c.name.en }, pos: b }
      }
      const route = routeBetween(pickup.pos, dropoff.pos)
      const km = Math.max(2.2, roadKm(route))
      const min = minutesFor(km)
      const cancelled = r() < 0.075
      const promo = r() < 0.06
      const fare = quoteFare({
        config: DEFAULT_PRICING,
        cityId,
        classId: vClass,
        distanceKm: km,
        durationMin: min,
        surgeMultiplier: hour >= 17 && hour <= 20 && r() > 0.6 ? 1.2 : 1,
        promo: promo
          ? { id: 'x', code: 'AURA50', title: { ar: '', en: '' }, kind: 'percent', value: 50, maxDiscount: 2500, audience: 'new', active: true, startsAt: 0, endsAt: Infinity, used: 0 }
          : undefined,
      })
      const pay = pick(r, ['mada', 'mada', 'apple_pay', 'apple_pay', 'wallet', 'cash'] as PaymentMethodId[])
      const assignedAt = createdAt + 20_000 + Math.floor(r() * 60_000)
      const endAt = assignedAt + (4 + min) * 60_000
      const cancelStage = cancelled ? Math.floor(r() * 3) : -1
      const stars = r() > 0.15 ? 5 : r() > 0.4 ? 4 : 3
      trips.push({
        id: `AUR-${String(100000 + trips.length * 7 + Math.floor(r() * 6)).slice(-6)}${String(10 + Math.floor(r() * 89))}`,
        status: cancelled ? 'cancelled' : 'completed',
        cityId,
        vehicleClass: vClass,
        pickup,
        dropoff,
        passengerId: customer.id,
        driverId: cancelled && cancelStage === 0 ? undefined : driver.id,
        otp: String(1000 + Math.floor(r() * 8999)),
        fare,
        paymentMethod: pay,
        createdAt,
        updatedAt: cancelled ? assignedAt : endAt,
        timeline: cancelled
          ? [
              { status: 'searching', at: createdAt, actor: 'passenger' },
              ...(cancelStage > 0 ? [{ status: 'driver_assigned' as const, at: assignedAt, actor: 'driver' as const }] : []),
              { status: 'cancelled', at: assignedAt + 60_000, actor: cancelStage === 2 ? 'driver' : 'passenger' },
            ]
          : [
              { status: 'searching', at: createdAt, actor: 'passenger' },
              { status: 'driver_assigned', at: assignedAt, actor: 'driver' },
              { status: 'driver_arriving', at: assignedAt + 5000, actor: 'system' },
              { status: 'driver_arrived', at: assignedAt + 4 * 60_000, actor: 'driver' },
              { status: 'in_progress', at: assignedAt + 5 * 60_000, actor: 'driver' },
              { status: 'completed', at: endAt, actor: 'driver' },
            ],
        cancel: cancelled
          ? {
              by: cancelStage === 2 ? 'driver' : 'passenger',
              reason: pick(r, cancelStage === 2 ? ['Rider no-show', 'Vehicle issue'] : ['My plans changed', 'Wait time too long', 'Requested by mistake']),
              at: assignedAt + 60_000,
            }
          : undefined,
        passengerRating: cancelled
          ? undefined
          : {
              stars,
              tags: stars === 5 ? [pick(r, ['safe_driving', 'clean_car', 'on_time', 'polite'])] : [],
              tip: r() > 0.8 ? pick(r, [500, 1000, 1500]) : undefined,
            },
        seeded: true,
      })
    }
  }
  return trips.sort((a, b) => b.createdAt - a.createdAt)
}

export function seedTickets(now: number, history: Trip[]): Ticket[] {
  const r = rng(31)
  const subjects: { s: string; c: Ticket['category']; p: Ticket['priority']; k: 'customer' | 'driver' }[] = [
    { s: 'Charged twice for the same trip', c: 'dispute', p: 'high', k: 'customer' },
    { s: 'Left my bag in the car', c: 'lost_item', p: 'normal', k: 'customer' },
    { s: 'Captain took a longer route', c: 'complaint', p: 'normal', k: 'customer' },
    { s: 'Rider was rude and damaged seat', c: 'report', p: 'high', k: 'driver' },
    { s: 'How do I update my insurance document?', c: 'help', p: 'low', k: 'driver' },
    { s: 'Promo code AURA50 did not apply', c: 'help', p: 'low', k: 'customer' },
    { s: 'Unsafe driving reported', c: 'safety', p: 'urgent', k: 'customer' },
    { s: 'Weekly payout not received', c: 'dispute', p: 'high', k: 'driver' },
    { s: 'Car smelled of smoke', c: 'complaint', p: 'normal', k: 'customer' },
    { s: 'Cannot verify rider code', c: 'help', p: 'normal', k: 'driver' },
    { s: 'Cancellation fee charged unfairly', c: 'dispute', p: 'normal', k: 'customer' },
    { s: 'Rider asked for extra stop not in app', c: 'dispute', p: 'normal', k: 'driver' },
  ]
  return subjects.map((x, i) => {
    const at = now - Math.floor((0.05 + r() * 6) * DAY)
    const trip = history[Math.floor(r() * Math.min(200, history.length))]
    const status: Ticket['status'] = i < 5 ? 'open' : i < 8 ? 'pending' : 'resolved'
    return {
      id: `TCK-${4100 + i}`,
      subject: x.s,
      category: x.c,
      status,
      priority: x.p,
      createdAt: at,
      updatedAt: at + 3600_000,
      requester: { kind: x.k, id: x.k === 'customer' ? trip.passengerId : (trip.driverId ?? DEMO_DRIVER_ID) },
      tripId: trip.id,
      assignee: status === 'open' ? undefined : 'Huda Al-Harbi',
      messages: [
        { from: x.k, text: `${x.s}. Trip ${trip.id}. (demo ticket)`, at },
        ...(status !== 'open' ? [{ from: 'agent' as const, author: 'Huda Al-Harbi', text: 'Thanks for reaching out. We are reviewing the trip log now.', at: at + 1800_000 }] : []),
        ...(status === 'resolved' ? [{ from: 'agent' as const, author: 'Huda Al-Harbi', text: 'Resolved. A refund/credit has been applied where applicable.', at: at + 3600_000 }] : []),
      ],
    }
  })
}

export function seedPromos(now: number): Promo[] {
  return [
    { id: 'pr1', code: 'AURA50', title: { ar: 'خصم ٥٠٪ على أول رحلة', en: '50% off your first ride' }, kind: 'percent', value: 50, maxDiscount: 2500, audience: 'new', active: true, startsAt: now - 40 * DAY, endsAt: now + 50 * DAY, used: 1832, limit: 5000 },
    { id: 'pr2', code: 'RIYADH15', title: { ar: '١٥ ريال على رحلات الرياض', en: 'SAR 15 off in Riyadh' }, kind: 'fixed', value: 1500, audience: 'all', active: true, startsAt: now - 10 * DAY, endsAt: now + 20 * DAY, used: 644, limit: 2000 },
    { id: 'pr3', code: 'GOLD20', title: { ar: '٢٠٪ لعملاء Gold', en: '20% for Gold members' }, kind: 'percent', value: 20, maxDiscount: 3000, audience: 'gold', active: true, startsAt: now - 5 * DAY, endsAt: now + 25 * DAY, used: 212 },
    { id: 'pr4', code: 'NATIONALDAY', title: { ar: 'عرض اليوم الوطني', en: 'National Day offer' }, kind: 'percent', value: 25, maxDiscount: 2000, audience: 'all', active: false, startsAt: now - 70 * DAY, endsAt: now - 55 * DAY, used: 4210, limit: 5000 },
  ]
}

export function seedCampaigns(now: number): Campaign[] {
  return [
    { id: 'cm1', name: 'Welcome series', audience: 'passengers', channel: 'push', title: { ar: 'رحلتك الأولى بنصف السعر', en: 'Half price first ride' }, body: { ar: 'استخدم AURA50 عند الطلب.', en: 'Use AURA50 at checkout.' }, status: 'sent', sentAt: now - 12 * DAY, metrics: { sent: 18400, opened: 7360, converted: 1832 }, promoCode: 'AURA50' },
    { id: 'cm2', name: 'Weekend peak bonus', audience: 'captains', channel: 'push', title: { ar: 'حافز نهاية الأسبوع', en: 'Weekend peak bonus' }, body: { ar: '٥٠ ريال إضافية عند إكمال ٢٠ رحلة.', en: 'Extra SAR 50 for 20 trips.' }, status: 'sent', sentAt: now - 4 * DAY, metrics: { sent: 2300, opened: 1940, converted: 610 } },
    { id: 'cm3', name: 'Riyadh Season', audience: 'passengers', channel: 'in_app', title: { ar: 'مشاويرك لموسم الرياض', en: 'Rides to Riyadh Season' }, body: { ar: 'خصم ١٥ ريال على رحلات البوليفارد.', en: 'SAR 15 off Boulevard trips.' }, status: 'scheduled', metrics: { sent: 0, opened: 0, converted: 0 }, promoCode: 'RIYADH15' },
  ]
}

export function seedZones(): Zone[] {
  return [
    { id: 'z-ruh', cityId: 'riyadh', name: { ar: 'منطقة المطار', en: 'Airport zone' }, kind: 'airport', center: { lat: 24.9576, lng: 46.6988 }, radiusKm: 3.2, active: true },
    { id: 'z-kafd', cityId: 'riyadh', name: { ar: 'المركز المالي', en: 'KAFD' }, kind: 'high_demand', center: { lat: 24.7633, lng: 46.6407 }, radiusKm: 1.6, active: true, multiplier: 1.2 },
    { id: 'z-olaya', cityId: 'riyadh', name: { ar: 'العليا', en: 'Olaya' }, kind: 'high_demand', center: { lat: 24.7, lng: 46.682 }, radiusKm: 2.2, active: true, multiplier: 1.15 },
    { id: 'z-boulevard', cityId: 'riyadh', name: { ar: 'البوليفارد', en: 'Boulevard' }, kind: 'high_demand', center: { lat: 24.7687, lng: 46.6009 }, radiusKm: 1.4, active: false, multiplier: 1.3 },
    { id: 'z-dq', cityId: 'riyadh', name: { ar: 'الحي الدبلوماسي', en: 'Diplomatic Quarter' }, kind: 'restricted', center: { lat: 24.684, lng: 46.622 }, radiusKm: 1.3, active: true },
    { id: 'z-svc', cityId: 'riyadh', name: { ar: 'نطاق الخدمة', en: 'Service area' }, kind: 'service', center: { lat: 24.76, lng: 46.68 }, radiusKm: 19, active: true },
  ]
}

export const ROLE_LABEL: Record<AdminRole, { ar: string; en: string }> = {
  super_admin: { ar: 'مدير عام', en: 'Super Admin' },
  operations_manager: { ar: 'مدير العمليات', en: 'Operations Manager' },
  finance_manager: { ar: 'المدير المالي', en: 'Finance Manager' },
  customer_support: { ar: 'خدمة العملاء', en: 'Customer Support' },
  driver_manager: { ar: 'مدير الكباتن', en: 'Driver Manager' },
  marketing_manager: { ar: 'مدير التسويق', en: 'Marketing Manager' },
}

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view', 'livemap.view', 'trips.view', 'trips.cancel', 'drivers.view', 'drivers.edit', 'drivers.approve', 'drivers.suspend',
  'customers.view', 'customers.block', 'vehicles.view', 'vehicles.edit', 'finance.view', 'finance.settle', 'pricing.view', 'pricing.edit',
  'zones.view', 'zones.edit', 'support.view', 'support.reply', 'marketing.view', 'marketing.edit', 'reports.view', 'reports.export',
  'roles.manage', 'settings.view', 'settings.edit', 'audit.view',
]

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  operations_manager: ['dashboard.view', 'livemap.view', 'trips.view', 'trips.cancel', 'drivers.view', 'customers.view', 'vehicles.view', 'zones.view', 'zones.edit', 'pricing.view', 'support.view', 'reports.view', 'reports.export'],
  finance_manager: ['dashboard.view', 'trips.view', 'finance.view', 'finance.settle', 'pricing.view', 'pricing.edit', 'reports.view', 'reports.export', 'audit.view'],
  customer_support: ['dashboard.view', 'trips.view', 'customers.view', 'customers.block', 'drivers.view', 'support.view', 'support.reply'],
  driver_manager: ['dashboard.view', 'livemap.view', 'drivers.view', 'drivers.edit', 'drivers.approve', 'drivers.suspend', 'vehicles.view', 'vehicles.edit', 'trips.view'],
  marketing_manager: ['dashboard.view', 'marketing.view', 'marketing.edit', 'customers.view', 'reports.view'],
}

export function seedAdmins(now: number): AdminUser[] {
  return [
    { id: 'adm-1', name: 'Salih Al-Hamami', email: 'admin@aura.demo', role: 'super_admin', active: true, twoFactor: true, lastSeen: now },
    { id: 'adm-2', name: 'Abdulaziz Al-Saud', email: 'ops@aura.demo', role: 'operations_manager', active: true, twoFactor: true, lastSeen: now - 3600_000 },
    { id: 'adm-3', name: 'Mona Al-Rashid', email: 'finance@aura.demo', role: 'finance_manager', active: true, twoFactor: true, lastSeen: now - 7200_000 },
    { id: 'adm-4', name: 'Huda Al-Harbi', email: 'support@aura.demo', role: 'customer_support', active: true, twoFactor: false, lastSeen: now - 900_000 },
    { id: 'adm-5', name: 'Yazeed Al-Omari', email: 'captains@aura.demo', role: 'driver_manager', active: true, twoFactor: true, lastSeen: now - 86_400_000 },
    { id: 'adm-6', name: 'Lulwa Al-Faisal', email: 'marketing@aura.demo', role: 'marketing_manager', active: true, twoFactor: false, lastSeen: now - 2 * 86_400_000 },
  ]
}

export function seedAudit(now: number): AuditEntry[] {
  return [
    { id: 'au1', at: now - 2 * DAY, actor: 'Mona Al-Rashid', role: 'finance_manager', action: 'pricing.update', target: 'Riyadh · Aura Black', detail: 'perKm 2.80 → 3.00' },
    { id: 'au2', at: now - 1.5 * DAY, actor: 'Yazeed Al-Omari', role: 'driver_manager', action: 'driver.approve', target: 'cap-031' },
    { id: 'au3', at: now - DAY, actor: 'Abdulaziz Al-Saud', role: 'operations_manager', action: 'zone.update', target: 'KAFD', detail: 'multiplier 1.1 → 1.2' },
    { id: 'au4', at: now - 0.5 * DAY, actor: 'Huda Al-Harbi', role: 'customer_support', action: 'customer.block', target: 'cus-010', detail: 'Repeated no-shows' },
  ]
}

export const DEMO_CLASS_ORDER = VEHICLE_CLASSES.map((c) => c.id)

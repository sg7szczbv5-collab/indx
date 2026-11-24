import type { Bilingual, CityId, FareBreakdown, Halalas, Promo, VehicleClassId } from './types'

/**
 * Pricing engine shared by Passenger (quote), Driver (earnings) and Admin (configuration).
 * All amounts are DEMO values for interface design. Real tariffs must be set by the business
 * and approved under applicable TGA regulations before launch.
 */

export type ClassTariff = {
  base: Halalas
  perKm: Halalas
  perMin: Halalas
  minFare: Halalas
  commissionRate: number
}

export type PricingConfig = {
  vatRate: number
  /** Tariffs per city per vehicle class. */
  cities: Record<CityId, Record<VehicleClassId, ClassTariff>>
}

export type VehicleClass = {
  id: VehicleClassId
  name: string
  seats: number
  tagline: Bilingual
  description: Bilingual
  examples: string
  /** Multiplier on pickup ETA for presentation (premium classes have fewer cars). */
  etaFactor: number
  active: boolean
}

export const VEHICLE_CLASSES: VehicleClass[] = [
  {
    id: 'go',
    name: 'Aura Go',
    seats: 4,
    tagline: { ar: 'اقتصادية', en: 'Everyday' },
    description: { ar: 'سيارة حديثة بسعر مناسب لمشاويرك اليومية.', en: 'A modern car at an everyday price.' },
    examples: 'Toyota Camry · Hyundai Elantra',
    etaFactor: 1,
    active: true,
  },
  {
    id: 'comfort',
    name: 'Aura Comfort',
    seats: 4,
    tagline: { ar: 'أوسع وأهدأ', en: 'More room' },
    description: { ar: 'مساحة أكبر للأرجل وسيارات أحدث وكباتن بتقييم عالٍ.', en: 'Extra legroom, newer cars, top-rated captains.' },
    examples: 'Toyota Camry 2024 · Kia K5',
    etaFactor: 1.2,
    active: true,
  },
  {
    id: 'black',
    name: 'Aura Black',
    seats: 4,
    tagline: { ar: 'فاخرة', en: 'Premium' },
    description: { ar: 'سيارات فاخرة سوداء وكابتن محترف لرحلات الأعمال.', en: 'Black luxury cars with professional captains.' },
    examples: 'Lexus ES · Mercedes E-Class',
    etaFactor: 1.6,
    active: true,
  },
  {
    id: 'xl',
    name: 'Aura XL',
    seats: 7,
    tagline: { ar: 'عائلية', en: 'Family' },
    description: { ar: 'حتى ٧ ركاب مع مساحة للأمتعة، مثالية للعائلة والمطار.', en: 'Up to 7 riders with luggage space.' },
    examples: 'GMC Yukon · Hyundai Staria',
    etaFactor: 1.4,
    active: true,
  },
]

export const classById = (id: VehicleClassId) => VEHICLE_CLASSES.find((c) => c.id === id)!

/** Classes a vehicle may serve (a higher class can accept a lower-class request). */
export const SERVES: Record<VehicleClassId, VehicleClassId[]> = {
  go: ['go'],
  comfort: ['comfort', 'go'],
  black: ['black', 'comfort'],
  xl: ['xl', 'go'],
}

const RIYADH: Record<VehicleClassId, ClassTariff> = {
  go: { base: 600, perKm: 165, perMin: 30, minFare: 1200, commissionRate: 0.2 },
  comfort: { base: 800, perKm: 190, perMin: 35, minFare: 1500, commissionRate: 0.2 },
  black: { base: 1500, perKm: 300, perMin: 55, minFare: 3000, commissionRate: 0.22 },
  xl: { base: 1200, perKm: 260, perMin: 45, minFare: 2500, commissionRate: 0.2 },
}

const scaleTariffs = (t: Record<VehicleClassId, ClassTariff>, f: number) =>
  Object.fromEntries(
    Object.entries(t).map(([k, v]) => [
      k,
      { ...v, perKm: Math.round(v.perKm * f), perMin: Math.round(v.perMin * f), base: Math.round(v.base * f) },
    ]),
  ) as Record<VehicleClassId, ClassTariff>

export const DEFAULT_PRICING: PricingConfig = {
  vatRate: 0.15,
  cities: {
    riyadh: RIYADH,
    jeddah: scaleTariffs(RIYADH, 1),
    dammam: scaleTariffs(RIYADH, 0.95),
    khobar: scaleTariffs(RIYADH, 0.95),
    makkah: scaleTariffs(RIYADH, 1.05),
    madinah: scaleTariffs(RIYADH, 0.95),
  },
}

export function promoDiscount(promo: Promo | undefined, subtotal: Halalas): Halalas {
  if (!promo || !promo.active) return 0
  const raw = promo.kind === 'percent' ? Math.round((subtotal * promo.value) / 100) : promo.value
  const capped = promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw
  return Math.min(capped, subtotal)
}

export function quoteFare(opts: {
  config: PricingConfig
  cityId: CityId
  classId: VehicleClassId
  distanceKm: number
  durationMin: number
  surgeMultiplier?: number
  promo?: Promo
}): FareBreakdown {
  const t = opts.config.cities[opts.cityId][opts.classId]
  const surgeMultiplier = opts.surgeMultiplier ?? 1
  const base = t.base
  const distance = Math.round(opts.distanceKm * t.perKm)
  const time = Math.round(opts.durationMin * t.perMin)
  const surge = Math.round((distance + time) * (surgeMultiplier - 1))
  const raw = base + distance + time + surge
  const minFareTopUp = Math.max(0, t.minFare - raw)
  // Round the subtotal up to whole riyals so the upfront price is clean and stays fixed.
  const subtotal = Math.ceil((raw + minFareTopUp) / 100) * 100
  const discount = promoDiscount(opts.promo, subtotal)
  const taxable = subtotal - discount
  const vat = Math.round(taxable * opts.config.vatRate)
  const total = taxable + vat
  const commission = Math.round(subtotal * t.commissionRate)
  return {
    base,
    distance,
    time,
    surge,
    minFareTopUp: subtotal - (base + distance + time + surge),
    subtotal,
    discount,
    vat,
    total,
    commission,
    driverNet: subtotal - commission,
    vatRate: opts.config.vatRate,
    commissionRate: t.commissionRate,
    surgeMultiplier,
    distanceKm: Math.round(opts.distanceKm * 10) / 10,
    durationMin: Math.round(opts.durationMin),
    promoCode: discount > 0 ? opts.promo?.code : undefined,
  }
}

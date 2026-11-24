import type { Category, Promo, Settings } from '../store/types'

export function baseFare(c: Category, km: number, min: number) {
  return Math.max(c.minFare, c.base + c.perKm * km + c.perMin * min)
}

export function quote(c: Category, km: number, min: number, s: Settings, promo?: Promo) {
  const surge = s.surgeOn ? s.surge : 1
  const raw = baseFare(c, km, min) * surge
  const subtotal = Math.round(raw * 100) / 100
  let discount = 0
  if (promo && promo.active && promo.uses < promo.limit) {
    discount = promo.kind === 'percent' ? Math.min(promo.maxDiscount, (subtotal * promo.value) / 100) : Math.min(promo.value, subtotal)
    discount = Math.round(discount * 100) / 100
  }
  const fare = Math.max(0, Math.round((subtotal - discount) * 100) / 100)
  return { subtotal, discount, fare, surge }
}

/** Platform share of a completed fare (tips go fully to the driver). */
export const commissionOf = (fare: number, s: Settings) => Math.round(fare * s.commission * 100) / 100

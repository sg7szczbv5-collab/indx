import type { Halalas } from './types'

export type Lang = 'ar' | 'en'

/** 4600 → "46.00" */
export const sar = (h: Halalas, decimals = 2) => (h / 100).toFixed(decimals)

/** 4600 → "46" (drops .00 when whole) */
export const sarShort = (h: Halalas) => (h % 100 === 0 ? String(h / 100) : (h / 100).toFixed(2))

export const sarCompact = (h: Halalas) => {
  const v = h / 100
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 10_000) return `${(v / 1000).toFixed(1)}K`
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export const int = (n: number) => Math.round(n).toLocaleString('en-US')

export const pct = (n: number, d = 0) => `${(n * 100).toFixed(d)}%`

export function clock(t: number, lang: Lang) {
  return new Date(t).toLocaleTimeString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function day(t: number, lang: Lang) {
  return new Date(t).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function dateTime(t: number, lang: Lang) {
  return `${day(t, lang)} · ${clock(t, lang)}`
}

export function relative(t: number, lang: Lang, now = Date.now()) {
  const s = Math.round((now - t) / 1000)
  const ar = lang === 'ar'
  if (s < 45) return ar ? 'الآن' : 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return ar ? `قبل ${m} د` : `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return ar ? `قبل ${h} س` : `${h}h ago`
  const d = Math.round(h / 24)
  return ar ? `قبل ${d} يوم` : `${d}d ago`
}

export const startOfDay = (t = Date.now()) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const DAY = 86_400_000

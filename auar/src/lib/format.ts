export const CUR = 'ر.س'

const nf = new Intl.NumberFormat('ar-SA-u-nu-latn', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('ar-SA-u-nu-latn', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

export const money = (v: number, fixed = false) => `${(fixed ? nf2 : nf).format(Math.round(v * 100) / 100)} ${CUR}`
export const num = (v: number) => nf.format(v)
export const km = (v: number) => `${nf.format(Math.round(v * 10) / 10)} كم`
export const mins = (v: number) => `${Math.max(1, Math.round(v))} د`

export function clock(t: number) {
  return new Date(t).toLocaleTimeString('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' })
}
export function day(t: number) {
  return new Date(t).toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'short' })
}
export function dayTime(t: number) {
  return `${day(t)}، ${clock(t)}`
}
export function ago(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return 'الآن'
  const m = Math.round(s / 60)
  if (m < 60) return `قبل ${m} د`
  const h = Math.round(m / 60)
  if (h < 24) return `قبل ${h} س`
  return `قبل ${Math.round(h / 24)} يوم`
}

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join(' ')

export const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
export const pin4 = () => String(Math.floor(1000 + Math.random() * 9000))

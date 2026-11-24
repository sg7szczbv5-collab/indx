/** Clock time `addMin` minutes from now, as h:mm. */
export function clockAt(addMin: number, from: Date = new Date()) {
  const d = new Date(from.getTime() + Math.round(addMin) * 60_000)
  const h = d.getHours() % 12 || 12
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}`
}

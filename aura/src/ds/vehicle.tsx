import type { VehicleClassId } from '../core/types'

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

/** Saudi licence plate (Arabic + Latin rows), as shown in the brand book trip screens. */
export function Plate({ digits, lettersAr, lettersEn, size = 'md' }: { digits: string; lettersAr: string; lettersEn: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 0.75, md: 1, lg: 1.35 }[size]
  return (
    <div
      dir="ltr"
      aria-label={`Plate ${digits} ${lettersEn}`}
      className="inline-flex overflow-hidden rounded-[5px] border-[1.5px] border-ink bg-white text-ink"
      style={{ fontSize: 11 * s, lineHeight: 1 }}
    >
      <div className="grid grid-cols-2 divide-x-[1.5px] divide-ink">
        <div className="flex flex-col divide-y-[1.5px] divide-ink">
          <span className="num px-1.5 py-[3px] text-center font-semibold">{toArabicDigits(digits)}</span>
          <span className="num px-1.5 py-[3px] text-center font-semibold">{digits}</span>
        </div>
        <div className="flex flex-col divide-y-[1.5px] divide-ink">
          <span className="px-1.5 py-[3px] text-center font-semibold" dir="rtl">{lettersAr}</span>
          <span className="num px-1.5 py-[3px] text-center font-semibold tracking-wider">{lettersEn}</span>
        </div>
      </div>
      <div className="flex w-[1.6em] flex-col items-center justify-center border-s-[1.5px] border-ink bg-ink text-[0.55em] font-bold leading-tight text-white">
        <span>K</span>
        <span>S</span>
        <span>A</span>
      </div>
    </div>
  )
}

/** Side-view vehicle illustration (brand book 08 fleet style): flat, door sticker, green sill line. */
export function CarArt({ classId, color = '#F5F5F3', width = 120, branded = true }: { classId: VehicleClassId; color?: string; width?: number; branded?: boolean }) {
  const suv = classId === 'xl'
  const dark = ['#141516', '#101112', '#6E7174'].includes(color) || classId === 'black'
  const body = classId === 'black' ? '#141516' : color
  const glass = '#22252A'
  const h = width * (suv ? 0.5 : 0.42)
  return (
    <svg viewBox={suv ? '0 0 240 120' : '0 0 240 100'} width={width} height={h} aria-hidden>
      <ellipse cx="120" cy={suv ? 108 : 90} rx="104" ry="5" fill="#101112" opacity="0.12" />
      {suv ? (
        <g>
          <path d="M18 88 L18 56 Q20 44 34 42 L62 40 L84 18 Q88 14 96 14 L196 14 Q206 14 210 24 L222 48 Q228 52 228 62 L228 88 Q228 94 222 94 L24 94 Q18 94 18 88Z" fill={body} stroke={dark ? 'none' : '#D6D8D4'} strokeWidth="1.2" />
          <path d="M90 22 L130 22 L130 46 L70 46 Z" fill={glass} />
          <path d="M136 22 L176 22 L176 46 L136 46 Z" fill={glass} />
          <path d="M182 22 L198 22 Q204 22 207 30 L214 46 L182 46 Z" fill={glass} />
          <rect x="132" y="46" width="2" height="44" fill={dark ? '#000' : '#D6D8D4'} />
          <circle cx="62" cy="94" r="17" fill="#101112" />
          <circle cx="62" cy="94" r="8" fill="#5b5f63" />
          <circle cx="188" cy="94" r="17" fill="#101112" />
          <circle cx="188" cy="94" r="8" fill="#5b5f63" />
          {branded && <rect x="84" y="80" width="88" height="3" rx="1.5" fill="#78B83F" />}
          <rect x="18" y="58" width="6" height="8" rx="1" fill="#7a1f1f" />
        </g>
      ) : (
        <g>
          <path d="M14 70 L14 58 Q16 50 30 48 L66 44 L92 24 Q98 20 108 20 L156 20 Q166 20 174 28 L192 44 L214 48 Q226 50 226 62 L226 70 Q226 78 218 78 L22 78 Q14 78 14 70Z" fill={body} stroke={dark ? 'none' : '#D6D8D4'} strokeWidth="1.2" />
          <path d="M100 27 Q104 26 110 26 L128 26 L128 44 L78 44 Z" fill={glass} />
          <path d="M134 26 L154 26 Q162 26 168 32 L180 44 L134 44 Z" fill={glass} />
          <rect x="130" y="44" width="2" height="32" fill={dark ? '#000' : '#D6D8D4'} />
          <circle cx="60" cy="78" r="15" fill="#101112" />
          <circle cx="60" cy="78" r="7" fill="#5b5f63" />
          <circle cx="182" cy="78" r="15" fill="#101112" />
          <circle cx="182" cy="78" r="7" fill="#5b5f63" />
          {branded && <rect x="80" y="66" width="84" height="3" rx="1.5" fill="#78B83F" />}
          <rect x="14" y="54" width="6" height="7" rx="1" fill="#7a1f1f" />
          <path d="M216 52 L224 56 L222 60 L214 58Z" fill={dark ? '#e8e8e8' : '#cfd2cd'} />
        </g>
      )}
    </svg>
  )
}

import { MARK_PATH, MARK_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from './logoPaths'

type Tone = 'black' | 'white'
const fill = (t: Tone) => (t === 'white' ? '#FFFFFF' : '#101112')

/** Primary wordmark. Min width 80 px (brand rule); below that use <LogoMark/>. */
export function Wordmark({ tone = 'black', width = 120, className = '' }: { tone?: Tone; width?: number; className?: string }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} width={Math.max(80, width)} className={className} role="img" aria-label="AURA">
      <path fill={fill(tone)} fillRule="evenodd" d={WORDMARK_PATH} />
    </svg>
  )
}

/** Λ symbol alone (min 16 px). */
export function LogoMark({ tone = 'black', size = 24, className = '' }: { tone?: Tone; size?: number; className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} width={Math.max(16, size)} height={Math.max(16, size) * (135.7 / 175.8)} className={className} aria-hidden>
      <path fill={fill(tone)} fillRule="evenodd" d={MARK_PATH} />
    </svg>
  )
}

/** App icon: Λ with the green rider dot underneath (brand book 03). */
export function AppIcon({ size = 48, variant = 'primary' }: { size?: number; variant?: 'primary' | 'light' | 'campaign' }) {
  const bg = variant === 'primary' ? '#101112' : variant === 'light' ? '#FFFFFF' : '#78B83F'
  const mark = variant === 'primary' ? '#FFFFFF' : '#101112'
  const dot = variant === 'campaign' ? '#FFFFFF' : '#78B83F'
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-label="AURA app icon">
      <rect width="512" height="512" rx="114" fill={bg} stroke={variant === 'light' ? '#E5E6E3' : 'none'} strokeWidth="6" />
      <g transform="translate(150 150) scale(1.2)">
        <path fill={mark} fillRule="evenodd" d={MARK_PATH} />
      </g>
      <circle cx="256" cy="282" r="22" fill={dot} />
    </svg>
  )
}

/** Bilingual lockup: Aura | أورا */
export function BilingualLockup({ tone = 'black', height = 40 }: { tone?: Tone; height?: number }) {
  const w = height * (478.21 / 136.84)
  return (
    <div className="flex items-center" style={{ gap: height * 0.45 }} dir="ltr">
      <Wordmark tone={tone} width={w} />
      <span style={{ width: 1.5, height: height * 1.1, background: tone === 'white' ? 'rgba(255,255,255,.3)' : 'rgba(16,17,18,.25)' }} />
      <span className="font-display font-semibold leading-none" style={{ fontSize: height * 1.25, color: fill(tone) }} dir="rtl">
        أورا
      </span>
    </div>
  )
}

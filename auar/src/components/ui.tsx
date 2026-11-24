import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import { Star } from 'lucide-react'
import type { CategoryId } from '../store/types'
import { initials } from '../lib/format'

/** AUAR mark: a lime route-chevron inside an ink tile, plus the wordmark. */
export function Logo({ size = 28, word = true, light = false, tag }: { size?: number; word?: boolean; light?: boolean; tag?: string }) {
  return (
    <div className="flex items-center gap-2" dir="ltr">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="11" fill={light ? '#fff' : '#0a0a0a'} />
        <path d="M10 29 L20 10 L30 29" fill="none" stroke="#c8f31d" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="25" r="3" fill={light ? '#0a0a0a' : '#fff'} />
      </svg>
      {word && (
        <span className={`font-bold tracking-[0.18em] ${light ? 'text-white' : 'text-ink'}`} style={{ fontSize: size * 0.62, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          AUAR
          {tag && <span className="ms-1.5 rounded bg-lime px-1.5 py-0.5 align-middle text-[0.55em] tracking-normal text-ink">{tag}</span>}
        </span>
      )}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'lime' | 'danger' | 'light'; size?: 'sm' | 'md' | 'lg'; full?: boolean }

export function Btn({ variant = 'primary', size = 'md', full, className = '', ...p }: BtnProps) {
  const v = {
    primary: 'bg-ink text-white hover:bg-ink-3 disabled:bg-mist-2 disabled:text-mute',
    secondary: 'bg-mist text-ink hover:bg-mist-2 disabled:opacity-50',
    ghost: 'bg-transparent text-ink hover:bg-mist',
    lime: 'bg-lime text-ink hover:bg-lime-2 disabled:opacity-50',
    danger: 'bg-bad text-white hover:brightness-110 disabled:opacity-50',
    light: 'bg-white/10 text-white hover:bg-white/15 disabled:opacity-50',
  }[variant]
  const s = { sm: 'h-9 px-3 text-sm rounded-lg', md: 'h-12 px-4 text-[15px] rounded-xl', lg: 'h-14 px-5 text-base rounded-2xl' }[size]
  return <button {...p} className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors ${v} ${s} ${full ? 'w-full' : ''} ${className}`} />
}

export function IconBtn({ className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={`grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-[0_2px_10px_rgba(0,0,0,.14)] hover:bg-mist ${className}`} />
}

export function Avatar({ name, color = '#0a0a0a', size = 44, ring }: { name: string; color?: string; size?: number; ring?: boolean }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

export function Stars({ value, onChange, size = 34 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} نجوم`} className="disabled:cursor-default">
          <Star size={size} strokeWidth={1.5} className={n <= value ? 'fill-ink text-ink' : 'text-mist-2'} />
        </button>
      ))}
    </div>
  )
}

export function RatingPill({ value, dark }: { value: number; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tnum ${dark ? 'bg-white/10 text-white' : 'bg-mist text-ink'}`}>
      <Star size={11} className={dark ? 'fill-white' : 'fill-ink'} strokeWidth={0} />
      {value.toFixed(2)}
    </span>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-ink' : 'bg-mist-2'}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'right-6' : 'right-1'}`} />
    </button>
  )
}

export function Field({ label, className = '', ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-mute">{label}</span>}
      <input {...p} className="h-12 w-full rounded-xl border border-transparent bg-mist px-4 text-[15px] outline-none transition focus:border-ink focus:bg-white" />
    </label>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'lime' | 'dark' }) {
  const t = {
    neutral: 'bg-mist text-ink',
    ok: 'bg-green-100 text-green-800',
    warn: 'bg-amber-100 text-amber-800',
    bad: 'bg-rose-100 text-rose-800',
    info: 'bg-blue-100 text-blue-800',
    lime: 'bg-lime text-ink',
    dark: 'bg-ink text-white',
  }[tone]
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>
}

/** Side-view vehicle illustrations for the ride picker. */
export function VehicleArt({ id, className = '' }: { id: CategoryId; className?: string }) {
  if (id === 'moto')
    return (
      <svg viewBox="0 0 80 44" className={className} aria-hidden>
        <circle cx="18" cy="32" r="9" fill="none" stroke="#0a0a0a" strokeWidth="4" />
        <circle cx="62" cy="32" r="9" fill="none" stroke="#0a0a0a" strokeWidth="4" />
        <path d="M18 32 L34 20 H50 L62 32" fill="none" stroke="#0a0a0a" strokeWidth="4" strokeLinejoin="round" />
        <path d="M30 20 Q40 10 54 16 L58 22 H34 Z" fill="#c8f31d" stroke="#0a0a0a" strokeWidth="2" />
        <path d="M54 12 L60 10" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  if (id === 'courier')
    return (
      <svg viewBox="0 0 80 44" className={className} aria-hidden>
        <rect x="16" y="6" width="44" height="30" rx="5" fill="#d9b88a" stroke="#0a0a0a" strokeWidth="2.5" />
        <path d="M16 16 H60 M38 6 V16" stroke="#0a0a0a" strokeWidth="2.5" />
        <rect x="30" y="22" width="16" height="6" rx="1.5" fill="#fff" stroke="#0a0a0a" strokeWidth="1.5" />
        <path d="M8 40 H72" stroke="#0a0a0a" strokeOpacity=".15" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  const body = { go: '#f4f4f1', comfort: '#c9ced4', xl: '#2b2d31', black: '#0a0a0a', her: '#f6dce6' }[id]
  const big = id === 'xl'
  const lux = id === 'black'
  return (
    <svg viewBox="0 0 80 44" className={className} aria-hidden>
      <ellipse cx="40" cy="38" rx="34" ry="3.5" fill="#000" opacity=".12" />
      <path
        d={big ? 'M6 30 V20 Q6 12 14 11 L24 6 H60 Q68 6 72 14 L75 20 V30 Z' : lux ? 'M5 30 V24 Q6 19 14 18 L26 10 H52 Q58 10 64 17 L73 20 Q76 22 76 26 V30 Z' : 'M6 30 V24 Q7 19 14 18 L24 10 H50 Q57 10 63 17 L72 20 Q75 22 75 26 V30 Z'}
        fill={body}
        stroke="#0a0a0a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d={big ? 'M16 12 L25 8 H58 Q63 8 66 14 L67 18 H16 Z' : 'M18 18 L27 12 H49 Q54 12 59 18 Z'} fill={lux ? '#3a3d42' : '#1f2937'} opacity=".85" />
      <path d={big ? 'M41 8 V18' : 'M38 12 V18'} stroke={body} strokeWidth="2" />
      <circle cx="20" cy="31" r="6.5" fill="#0a0a0a" />
      <circle cx="20" cy="31" r="2.6" fill="#9ca3af" />
      <circle cx="61" cy="31" r="6.5" fill="#0a0a0a" />
      <circle cx="61" cy="31" r="2.6" fill="#9ca3af" />
      {id === 'her' && <circle cx="66" cy="12" r="4" fill="#e11d48" />}
      {lux && <path d="M70 22 H75" stroke="#c8f31d" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  )
}

/** Phone-shaped frame used on desktop; on small screens the app fills the viewport. */
export function PhoneFrame({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className="relative mx-auto h-[min(860px,calc(100dvh-40px))] w-[min(400px,calc((100dvh-40px)*0.465))] min-h-[640px] min-w-[320px] rounded-[48px] bg-ink p-[11px] shadow-[0_30px_80px_-20px_rgba(0,0,0,.45),inset_0_0_0_2px_#2a2a2a]">
      <div className={`relative h-full w-full overflow-hidden rounded-[38px] ${dark ? 'bg-ink' : 'bg-white'}`}>
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-50 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  )
}

export function StatusBar({ dark }: { dark?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 z-40 flex h-11 items-center justify-between px-7 pt-1 text-[13px] font-semibold ${dark ? 'text-white' : 'text-ink'}`} dir="ltr">
      <span className="tnum">9:41</span>
      <span className="flex items-center gap-1">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
          <rect x=".5" y=".5" width="21" height="11" rx="3" stroke="currentColor" opacity=".4" />
          <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
          <rect x="23" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" />
        </svg>
      </span>
    </div>
  )
}

export function Sheet({ children, className = '', dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={`slide-up absolute inset-x-0 bottom-0 z-30 rounded-t-[26px] ${dark ? 'bg-ink-2 text-white' : 'bg-white'} shadow-[0_-8px_30px_rgba(0,0,0,.12)] ${className}`}>
      <div className={`mx-auto mt-2.5 h-1.5 w-10 rounded-full ${dark ? 'bg-white/20' : 'bg-mist-2'}`} />
      {children}
    </div>
  )
}

export function Row({ icon, title, sub, right, onClick, dark }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; dark?: boolean }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp onClick={onClick} className={`flex w-full items-center gap-3.5 py-3 text-start ${onClick ? (dark ? 'hover:bg-white/5' : 'hover:bg-mist/60') : ''} -mx-2 rounded-xl px-2`}>
      {icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${dark ? 'bg-white/10' : 'bg-mist'}`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{title}</span>
        {sub && <span className={`block truncate text-[13px] ${dark ? 'text-white/55' : 'text-mute'}`}>{sub}</span>}
      </span>
      {right}
    </Comp>
  )
}

export function Header({ title, onBack, right, dark }: { title: string; onBack?: () => void; right?: ReactNode; dark?: boolean }) {
  return (
    <div className={`sticky top-0 z-20 flex items-center gap-2 px-4 pb-3 pt-12 ${dark ? 'bg-ink text-white' : 'bg-white'}`}>
      {onBack && (
        <button onClick={onBack} aria-label="رجوع" className={`grid h-10 w-10 place-items-center rounded-full ${dark ? 'hover:bg-white/10' : 'hover:bg-mist'}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-[22px] font-bold">{title}</h1>
      {right}
    </div>
  )
}

export function PaymentIcon({ m, className = '' }: { m: 'cash' | 'card' | 'wallet' | 'apple'; className?: string }) {
  if (m === 'cash')
    return (
      <span className={`grid h-7 w-10 place-items-center rounded-md bg-green-600 text-[11px] font-bold text-white ${className}`}>
        <svg width="20" height="12" viewBox="0 0 20 12" aria-hidden>
          <rect x=".75" y=".75" width="18.5" height="10.5" rx="2" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="10" cy="6" r="2.4" fill="#fff" />
        </svg>
      </span>
    )
  if (m === 'card')
    return (
      <span className={`grid h-7 w-10 place-items-center rounded-md bg-[#1a1f71] text-[10px] font-bold italic text-white ${className}`} dir="ltr">
        VISA
      </span>
    )
  if (m === 'apple')
    return (
      <span className={`grid h-7 w-10 place-items-center rounded-md bg-ink text-[10px] font-semibold text-white ${className}`} dir="ltr">
        Pay
      </span>
    )
  return (
    <span className={`grid h-7 w-10 place-items-center rounded-md bg-lime text-ink ${className}`}>
      <svg width="16" height="16" viewBox="0 0 40 40" aria-hidden>
        <path d="M10 29 L20 10 L30 29" fill="none" stroke="#0a0a0a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export const PAY_LABEL = { cash: 'نقداً', card: 'فيزا •••• 4821', wallet: 'محفظة AUAR', apple: 'Apple Pay' } as const

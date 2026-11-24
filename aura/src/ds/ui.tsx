/**
 * AURA Design System primitives.
 * Shared by Passenger (light), Driver (dark) and Admin (light, dense).
 * Surface tone comes from <Surface tone> so the same component adapts to each product.
 */
import { createContext, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, CircleCheck, Inbox, Loader2, Star, X } from 'lucide-react'
import { STATUS_LABEL, STATUS_TONE } from '../core/trip'
import type { TripStatus } from '../core/types'
import { useI18n } from '../i18n/I18n'

/* ---------- Surface tone ---------- */
type Tone = 'light' | 'dark'
const ToneCtx = createContext<Tone>('light')
export const useTone = () => useContext(ToneCtx)
export function Surface({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <ToneCtx.Provider value={tone}>{children}</ToneCtx.Provider>
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Icon defaults from the brand book: single 1.8 stroke, rounded joins, 24 grid. */
export const ICON = { strokeWidth: 1.8 } as const

/* ---------- Buttons ---------- */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'go' | 'danger' | 'soft'
type BtnSize = 'sm' | 'md' | 'lg' | 'xl'

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconEnd,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean; icon?: ReactNode; iconEnd?: ReactNode; full?: boolean }) {
  const tone = useTone()
  const dark = tone === 'dark'
  const v: Record<BtnVariant, string> = {
    primary: dark ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white hover:bg-ink-3',
    secondary: dark ? 'border border-white/15 text-white hover:bg-white/5' : 'border border-line-2 bg-white text-ink hover:bg-road',
    ghost: dark ? 'text-white/80 hover:bg-white/5' : 'text-ink hover:bg-road',
    go: 'bg-go text-ink hover:bg-go-2',
    danger: 'bg-danger text-white hover:opacity-90',
    soft: dark ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-road text-ink hover:bg-road-2',
  }
  const s: Record<BtnSize, string> = {
    sm: 'h-9 px-3 text-[13px] rounded-xl gap-1.5',
    md: 'h-11 px-4 text-sm rounded-xl gap-2',
    lg: 'h-13 px-5 text-[15px] rounded-2xl gap-2',
    xl: 'h-16 px-6 text-lg rounded-2xl gap-2.5',
  }
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition-[background,opacity,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
        v[variant],
        s[size],
        full && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      {children}
      {iconEnd}
    </button>
  )
}

export function IconButton({ label, children, className, tone: forced, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: Tone }) {
  const ctxTone = useTone()
  const tone = forced ?? ctxTone
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40',
        tone === 'dark' ? 'bg-ink-3 text-white hover:bg-ink-4' : 'bg-white text-ink shadow-[0_2px_10px_rgba(16,17,18,0.08)] hover:bg-road',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ---------- Cards ---------- */
export function Card({ children, className, pad = true, onClick }: { children: ReactNode; className?: string; pad?: boolean; onClick?: () => void }) {
  const tone = useTone()
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-2xl',
        tone === 'dark' ? 'bg-ink-2 ring-1 ring-white/6' : 'bg-white ring-1 ring-line',
        pad && 'p-4',
        onClick && 'cursor-pointer transition hover:ring-line-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Form fields ---------- */
export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  const tone = useTone()
  return (
    <label className={cx('block', className)}>
      {label && <span className={cx('mb-1.5 block text-[13px] font-medium', tone === 'dark' ? 'text-white/70' : 'text-mute')}>{label}</span>}
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-xs text-danger">
          <AlertTriangle size={13} /> {error}
        </span>
      ) : hint ? (
        <span className={cx('mt-1.5 block text-xs', tone === 'dark' ? 'text-white/45' : 'text-mute-2')}>{hint}</span>
      ) : null}
    </label>
  )
}

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const tone = useTone()
  return (
    <input
      {...rest}
      className={cx(
        'h-12 w-full rounded-xl px-4 text-[15px] outline-none transition placeholder:font-normal',
        tone === 'dark'
          ? 'bg-ink-3 text-white placeholder:text-white/35 focus:ring-2 focus:ring-go/70'
          : 'bg-road text-ink placeholder:text-mute-2 focus:bg-white focus:ring-2 focus:ring-ink',
        invalid && 'ring-2 ring-danger/70',
        className,
      )}
    />
  )
}

export function Select({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  const tone = useTone()
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        'h-10 rounded-xl px-3 text-sm outline-none',
        tone === 'dark' ? 'bg-ink-3 text-white' : 'border border-line bg-white text-ink focus:ring-2 focus:ring-ink',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Saudi mobile number with fixed +966 prefix. */
export function PhoneInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const tone = useTone()
  const dark = tone === 'dark'
  return (
    <div dir="ltr" className={cx('flex h-14 items-center gap-3 rounded-2xl px-4', dark ? 'bg-ink-3 text-white' : 'bg-road text-ink')}>
      <span className="flex items-center gap-2 text-[15px] font-semibold">
        <span className="inline-flex h-4 w-6 items-center justify-center rounded-[3px] bg-[#0f7a3b] text-[7px] font-bold text-white">KSA</span>
        +966
      </span>
      <span className={cx('h-6 w-px', dark ? 'bg-white/15' : 'bg-line-2')} />
      <input
        autoFocus={autoFocus}
        inputMode="numeric"
        aria-label="Mobile number"
        placeholder="5X XXX XXXX"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
        className={cx('num h-full flex-1 bg-transparent text-[17px] tracking-wider outline-none', dark ? 'placeholder:text-white/30' : 'placeholder:text-mute-2')}
      />
    </div>
  )
}

export const validSaudiMobile = (v: string) => /^5\d{8}$/.test(v)

export function OtpInput({ length = 4, value, onChange, invalid, autoFocus = true }: { length?: number; value: string; onChange: (v: string) => void; invalid?: boolean; autoFocus?: boolean }) {
  const tone = useTone()
  const dark = tone === 'dark'
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!autoFocus) return
    const id = setTimeout(() => ref.current?.focus(), 350)
    return () => clearTimeout(id)
  }, [autoFocus])
  return (
    <div dir="ltr" className="relative flex justify-center gap-2.5" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Verification code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        className="absolute inset-0 opacity-0"
      />
      {Array.from({ length }).map((_, i) => {
        const active = i === Math.min(value.length, length - 1)
        return (
          <div
            key={i}
            className={cx(
              'num flex size-14 items-center justify-center rounded-2xl text-2xl font-semibold transition',
              dark ? 'bg-ink-3 text-white' : 'bg-road text-ink',
              active && (dark ? 'ring-2 ring-go' : 'ring-2 ring-ink'),
              invalid && 'ring-2 ring-danger',
            )}
          >
            {value[i] ?? ''}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Badges ---------- */
type BadgeTone = 'neutral' | 'live' | 'done' | 'warn' | 'danger' | 'outline' | 'pending'
export function Badge({ tone = 'neutral', children, dot, className }: { tone?: BadgeTone; children: ReactNode; dot?: boolean; className?: string }) {
  const surface = useTone()
  const dark = surface === 'dark'
  const m: Record<BadgeTone, string> = {
    neutral: dark ? 'bg-white/8 text-white/80' : 'bg-road text-ink',
    live: dark ? 'bg-go/15 text-go' : 'bg-go-soft text-go-deep',
    done: dark ? 'bg-white text-ink' : 'bg-ink text-white',
    pending: dark ? 'bg-white/8 text-white' : 'bg-road-2 text-ink',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    outline: dark ? 'ring-1 ring-white/20 text-white/80' : 'ring-1 ring-line-2 text-mute',
  }
  return (
    <span className={cx('inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold', m[tone], className)}>
      {dot && <span className={cx('size-1.5 rounded-full', tone === 'live' ? 'animate-pulse bg-go' : 'bg-current')} />}
      {children}
    </span>
  )
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const { L } = useI18n()
  const tone = STATUS_TONE[status]
  return (
    <Badge tone={tone === 'live' ? 'live' : tone === 'done' ? 'done' : tone === 'danger' ? 'danger' : 'pending'} dot={tone === 'live' || tone === 'pending'}>
      {L(STATUS_LABEL[status])}
    </Badge>
  )
}

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span title={t('بيانات تجريبية لأغراض العرض فقط', 'Demo data for presentation only')} className={cx('inline-flex h-5 items-center rounded-md border border-dashed border-current px-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-60', className)}>
      {t('بيانات تجريبية', 'Demo data')}
    </span>
  )
}

/* ---------- Segmented & switch ---------- */
export function Segmented<T extends string>({ value, onChange, options, size = 'md', className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; size?: 'sm' | 'md'; className?: string }) {
  const tone = useTone()
  const dark = tone === 'dark'
  return (
    <div className={cx('inline-flex rounded-xl p-1', dark ? 'bg-ink-3' : 'bg-road', className)} role="tablist">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative flex-1 whitespace-nowrap rounded-lg font-semibold transition',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-[13px]',
              on ? (dark ? 'bg-white text-ink' : 'bg-white text-ink shadow-[0_1px_4px_rgba(16,17,18,0.1)]') : dark ? 'text-white/60' : 'text-mute',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  const tone = useTone()
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40',
        checked ? 'bg-go' : tone === 'dark' ? 'bg-ink-5' : 'bg-line-2',
      )}
    >
      <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'start-[22px]' : 'start-0.5')} />
    </button>
  )
}

/* ---------- Overlays ---------- */

/** Bottom sheet. `contained` keeps it inside a phone frame (absolute) instead of the viewport. */
export function Sheet({ open, onClose, children, title, contained = true }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; contained?: boolean }) {
  const tone = useTone()
  const dark = tone === 'dark'
  return (
    <AnimatePresence>
      {open && (
        <div className={cx(contained ? 'absolute' : 'fixed', 'inset-0 z-[60] flex flex-col justify-end')}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className={cx('relative max-h-[88%] overflow-y-auto rounded-t-[28px] px-5 pt-3 pb-8 no-scrollbar', dark ? 'bg-ink-2 text-white' : 'bg-white text-ink')}
          >
            <div className={cx('mx-auto mb-3 h-1 w-10 rounded-full', dark ? 'bg-white/15' : 'bg-line-2')} />
            {title && <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Modal({ open, onClose, title, children, footer, width = 520, contained }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number; contained?: boolean }) {
  const tone = useTone()
  const dark = tone === 'dark'
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <div className={cx(contained ? 'absolute' : 'fixed', 'inset-0 z-[70] flex items-center justify-center p-4')}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/45" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: width }}
            className={cx('relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl shadow-2xl', dark ? 'bg-ink-2 text-white' : 'bg-white text-ink')}
          >
            <div className={cx('flex items-center justify-between gap-4 border-b px-6 py-4', dark ? 'border-white/8' : 'border-line')}>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <IconButton label={t('إغلاق', 'Close')} onClick={onClose} className="size-8 shadow-none">
                <X size={18} {...ICON} />
              </IconButton>
            </div>
            <div className="thin-scroll overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className={cx('flex justify-end gap-2 border-t px-6 py-4', dark ? 'border-white/8' : 'border-line')}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Toasts ---------- */
type ToastItem = { id: number; text: string; tone: 'success' | 'error' | 'info' }
const ToastCtx = createContext<(text: string, tone?: ToastItem['tone']) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastHost({ children, contained }: { children: ReactNode; contained?: boolean }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = (text: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, text, tone }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200)
  }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className={cx(contained ? 'absolute top-14' : 'fixed top-5', 'pointer-events-none inset-x-0 z-[90] flex flex-col items-center gap-2 px-4')}>
        <AnimatePresence>
          {items.map((i) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              role="status"
              className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl"
            >
              {i.tone === 'success' ? <CircleCheck size={18} className="shrink-0 text-go" /> : i.tone === 'error' ? <AlertTriangle size={18} className="shrink-0 text-danger" /> : <span className="size-2 shrink-0 rounded-full bg-go" />}
              {i.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- States ---------- */
export function Skeleton({ className }: { className?: string }) {
  const tone = useTone()
  return <div className={cx('rounded-xl', tone === 'dark' ? 'aura-skeleton-dark' : 'aura-skeleton', className)} />
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  const tone = useTone()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className={cx('aura-hatch mb-4 flex size-16 items-center justify-center rounded-2xl', tone === 'dark' ? 'bg-ink-3 text-white/60' : 'bg-road text-mute')}>
        {icon ?? <Inbox size={26} {...ICON} />}
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      {body && <p className={cx('mt-1 max-w-xs text-sm', tone === 'dark' ? 'text-white/55' : 'text-mute')}>{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ title, body, onRetry }: { title: string; body?: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-danger">
      <AlertTriangle size={20} className="mt-0.5 shrink-0" {...ICON} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {body && <p className="mt-0.5 text-[13px] opacity-80">{body}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-semibold underline">
          {t('إعادة المحاولة', 'Retry')}
        </button>
      )}
    </div>
  )
}

export function SuccessMark({ size = 64 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 220 }}
      className="flex items-center justify-center rounded-full bg-go text-ink"
      style={{ width: size, height: size }}
    >
      <Check size={size * 0.45} strokeWidth={2.6} />
    </motion.div>
  )
}

/* ---------- Data display ---------- */
export function Avatar({ name, size = 40, hue }: { name: string; size?: number; hue?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  const tone = useTone()
  return (
    <div
      aria-hidden
      className={cx('flex shrink-0 items-center justify-center rounded-full font-display font-semibold', tone === 'dark' ? 'bg-ink-4 text-white' : 'bg-road-2 text-ink')}
      style={{ width: size, height: size, fontSize: size * 0.36, boxShadow: hue !== undefined ? `inset 0 0 0 2px hsla(${hue},8%,50%,.15)` : undefined }}
    >
      {initials}
    </div>
  )
}

export function Stars({ value, onChange, size = 28 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const tone = useTone()
  return (
    <div className="flex gap-1.5" dir="ltr" role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}`}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cx('transition', onChange && 'active:scale-90')}
        >
          <Star size={size} strokeWidth={1.6} className={n <= value ? (tone === 'dark' ? 'fill-white text-white' : 'fill-ink text-ink') : tone === 'dark' ? 'text-white/25' : 'text-line-2'} />
        </button>
      ))}
    </div>
  )
}

export function Row({ icon, title, sub, end, onClick, danger }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; end?: ReactNode; onClick?: () => void; danger?: boolean }) {
  const tone = useTone()
  const dark = tone === 'dark'
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cx('flex w-full items-center gap-3 py-3 text-start', onClick && 'transition active:opacity-70')}>
      {icon && <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', danger ? 'bg-danger-soft text-danger' : dark ? 'bg-ink-3 text-white' : 'bg-road text-ink')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate text-[15px] font-medium', danger && 'text-danger')}>{title}</span>
        {sub && <span className={cx('block truncate text-[13px]', dark ? 'text-white/50' : 'text-mute')}>{sub}</span>}
      </span>
      {end}
    </Tag>
  )
}

export function Divider({ className }: { className?: string }) {
  const tone = useTone()
  return <div className={cx('h-px', tone === 'dark' ? 'bg-white/8' : 'bg-line', className)} />
}

export function Money({ h, size = 'md', className, unit = true }: { h: number; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; unit?: boolean }) {
  const s = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl', xl: 'text-[40px] leading-none' }[size]
  return (
    <span dir="ltr" className={cx('num inline-flex items-baseline gap-1 font-semibold', s, className)}>
      {(h / 100).toFixed(2)}
      {unit && <span className="text-[0.45em] font-semibold tracking-wide opacity-60">SAR</span>}
    </span>
  )
}

/** Circular countdown (offer timer). */
export function CountdownRing({ total, left, size = 56 }: { total: number; left: number; size?: number }) {
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  const f = Math.max(0, Math.min(1, left / total))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#78B83F" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <span className="num absolute inset-0 flex items-center justify-center text-lg font-semibold">{Math.ceil(left)}</span>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const tone = useTone()
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className={cx('text-[13px] font-semibold', tone === 'dark' ? 'text-white/55' : 'text-mute')}>{children}</h3>
      {action}
    </div>
  )
}

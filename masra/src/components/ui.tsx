import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'

export const ease = [0.22, 1, 0.36, 1] as const

export function SlideShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden thin-scroll">
      <div
        className={`mx-auto flex min-h-full w-full max-w-[1320px] flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 lg:py-10 ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

export function SlideHeader({
  index,
  eyebrow,
  title,
  subtitle,
  align = 'start',
  className = '',
}: {
  index: number
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'start' | 'center'
  className?: string
}) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className={`flex items-center gap-3 text-[13px] font-medium text-green-3 ${align === 'center' ? 'justify-center' : ''}`}
      >
        <span className="num tracking-widest text-white/40">{String(index).padStart(2, '0')}</span>
        <span className="h-px w-8 bg-green-3/60" />
        <span>{eyebrow}</span>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05, ease }}
        className="mt-3 text-[28px] leading-[1.25] font-bold text-white sm:text-4xl lg:text-[44px]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease }}
          className={`mt-3 max-w-2xl text-[15px] leading-7 text-white/60 sm:text-base ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

export function DemoBadge({ label = 'بيانات تجريبية', light = false }: { label?: string; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        light ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-gold/10 text-gold ring-1 ring-gold/25'
      }`}
    >
      <FlaskConical size={12} />
      {label}
    </span>
  )
}

export function Card({
  children,
  className = '',
  delay = 0,
  onClick,
  active,
}: {
  children: ReactNode
  className?: string
  delay?: number
  onClick?: () => void
  active?: boolean
}) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className={`rounded-2xl border bg-ink-2/80 p-5 text-start backdrop-blur transition-colors ${
        active ? 'border-green-3/60 bg-green/15' : 'border-line hover:border-white/20'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Comp>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-3 px-3 py-1 text-xs text-white/70 ${className}`}>
      {children}
    </span>
  )
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-ink shadow-[0_10px_40px_-10px_rgba(255,255,255,0.35)] transition hover:bg-mist active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  )
}

export const sar = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })

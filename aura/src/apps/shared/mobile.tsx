import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../../i18n/I18n'
import { cx, ICON, IconButton, useTone } from '../../ds/ui'

/** Full-height mobile screen with safe-area aware header/footer slots. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  const tone = useTone()
  return <div className={cx('absolute inset-0 flex flex-col', tone === 'dark' ? 'bg-ink text-white' : 'bg-white text-ink', className)}>{children}</div>
}

export function BackIcon({ size = 22 }: { size?: number }) {
  const { dir } = useI18n()
  return dir === 'rtl' ? <ChevronRight size={size} {...ICON} /> : <ChevronLeft size={size} {...ICON} />
}

export function TopBar({ title, onBack, end, transparent }: { title?: ReactNode; onBack?: () => void; end?: ReactNode; transparent?: boolean }) {
  const { t } = useI18n()
  const tone = useTone()
  return (
    <div className={cx('relative z-20 flex shrink-0 items-center gap-2 px-4 pb-2', !transparent && (tone === 'dark' ? 'bg-ink' : 'bg-white'))} style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}>
      <div className="w-10">
        {onBack && (
          <IconButton label={t('رجوع', 'Back')} onClick={onBack} className={cx(!transparent && 'shadow-none', !transparent && tone !== 'dark' && 'bg-road')}>
            <BackIcon />
          </IconButton>
        )}
      </div>
      <div className="min-w-0 flex-1 truncate text-center font-display text-[17px] font-semibold">{title}</div>
      <div className="flex w-10 justify-end">{end}</div>
    </div>
  )
}

export type TabItem<T extends string> = { id: T; label: string; icon: ReactNode; badge?: number }

export function TabBar<T extends string>({ items, value, onChange }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void }) {
  const tone = useTone()
  const dark = tone === 'dark'
  return (
    <nav className={cx('relative z-30 flex shrink-0 border-t px-2 pt-1.5', dark ? 'border-white/8 bg-ink' : 'border-line bg-white')} style={{ paddingBottom: 'calc(var(--safe-bottom) + 6px)' }}>
      {items.map((it) => {
        const on = it.id === value
        return (
          <button key={it.id} onClick={() => onChange(it.id)} aria-current={on ? 'page' : undefined} className={cx('relative flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-semibold transition', on ? (dark ? 'text-white' : 'text-ink') : dark ? 'text-white/40' : 'text-mute-2')}>
            <span className="relative">
              {it.icon}
              {!!it.badge && <span className="absolute -top-1 -end-1.5 flex size-4 items-center justify-center rounded-full bg-go text-[9px] font-bold text-ink">{it.badge}</span>}
            </span>
            {it.label}
            {on && <motion.span layoutId={`tab-ind-${dark}`} className="absolute -top-1.5 h-0.5 w-8 rounded-full bg-go" />}
          </button>
        )
      })}
    </nav>
  )
}

/** Slide-in sub page (account settings, details). */
export function Panel({ children, onClose, title, end }: { children: ReactNode; onClose: () => void; title: ReactNode; end?: ReactNode }) {
  const { dir } = useI18n()
  const tone = useTone()
  const from = dir === 'rtl' ? '-100%' : '100%'
  return (
    <motion.div
      initial={{ x: from }}
      animate={{ x: 0 }}
      exit={{ x: from }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cx('absolute inset-0 z-50 flex flex-col', tone === 'dark' ? 'bg-ink text-white' : 'bg-white text-ink')}
    >
      <TopBar title={title} onBack={onClose} end={end} />
      <div className="thin-scroll flex-1 overflow-y-auto px-5 pb-10">{children}</div>
    </motion.div>
  )
}

export const screenMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

/** Info strip shown in demo builds so nothing is mistaken for live data. */
export function DemoStrip({ text }: { text: string }) {
  return <div className="mx-auto mt-2 w-fit rounded-full border border-dashed border-current px-3 py-1 text-[10.5px] font-medium opacity-50">{text}</div>
}

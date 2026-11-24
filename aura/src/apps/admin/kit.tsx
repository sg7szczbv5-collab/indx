import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Lock, Search, X } from 'lucide-react'
import { Button, cx, EmptyState, ICON, IconButton, Skeleton } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import type { AdminUser, Permission } from '../../core/types'
import { useEco } from '../../core/store'

/* ---------- Admin session & permissions ---------- */
type AdminCtx = { admin: AdminUser; can: (p: Permission) => boolean }
const Ctx = createContext<AdminCtx | null>(null)
export function AdminProvider({ admin, children }: { admin: AdminUser; children: ReactNode }) {
  const perms = useEco((s) => s.rolePerms[admin.role])
  const value = useMemo(() => ({ admin, can: (p: Permission) => perms.includes(p) }), [admin, perms])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useAdmin() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAdmin outside provider')
  return c
}

export function Forbidden({ what }: { what?: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center ring-1 ring-line">
      <div className="aura-hatch flex size-16 items-center justify-center rounded-2xl bg-road">
        <Lock size={26} {...ICON} />
      </div>
      <p className="mt-4 font-display text-lg font-semibold">{t('لا تملك صلاحية الوصول', "You don't have access")}</p>
      <p className="mt-1 max-w-sm text-sm text-mute">{what ?? t('هذه الصفحة غير متاحة لدورك. تواصل مع المدير العام لطلب الصلاحية.', 'This page is not available for your role. Ask a Super Admin for access.')}</p>
    </div>
  )
}

/** Renders children only with permission; otherwise a disabled clone with a lock tooltip. */
export function Can({ perm, children, fallback }: { perm: Permission; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAdmin()
  const { t } = useI18n()
  if (can(perm)) return <>{children}</>
  return fallback !== undefined ? <>{fallback}</> : <span title={t('لا تملك الصلاحية', 'No permission')} className="inline-flex cursor-not-allowed items-center gap-1 text-xs text-mute-2"><Lock size={12} /> {t('مقيّد', 'Restricted')}</span>
}

/* ---------- Layout ---------- */
export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[26px] font-semibold leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className, pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx('rounded-2xl bg-white ring-1 ring-line', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, unit, delta, live, icon, hint }: { label: string; value: ReactNode; unit?: string; delta?: number; live?: boolean; icon?: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line" title={hint}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium text-mute">{label}</span>
        {live ? <span className="flex items-center gap-1 text-[10.5px] font-semibold text-go-deep"><span className="size-1.5 animate-pulse rounded-full bg-go" />LIVE</span> : icon && <span className="text-mute-2">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5" dir="ltr" style={{ justifyContent: 'flex-start' }}>
        <span className="num text-[26px] font-semibold leading-none">{value}</span>
        {unit && <span className="num text-xs font-semibold text-mute">{unit}</span>}
      </div>
      {delta !== undefined && (
        <p className={cx('num mt-1.5 flex items-center gap-0.5 text-[11.5px] font-semibold', delta >= 0 ? 'text-go-deep' : 'text-danger')} dir="ltr" style={{ justifyContent: 'flex-start' }}>
          {delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(delta * 100).toFixed(1)}%
          <span className="ms-1 font-normal text-mute-2">vs 7d</span>
        </p>
      )}
    </div>
  )
}

/* ---------- Drawer ---------- */
export function Drawer({ open, onClose, title, children, footer, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  const { dir, t } = useI18n()
  useEffect(() => {
    if (!open) return
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [open, onClose])
  const from = dir === 'rtl' ? '-100%' : '100%'
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/35" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: width }}
            className="absolute inset-y-0 end-0 flex w-full flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div className="min-w-0 font-display text-lg font-semibold">{title}</div>
              <IconButton label={t('إغلاق', 'Close')} onClick={onClose} className="size-9 shadow-none">
                <X size={18} />
              </IconButton>
            </div>
            <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Data table ---------- */
export type Col<T> = { key: string; header: string; cell: (r: T) => ReactNode; sort?: (r: T) => number | string; className?: string; csv?: (r: T) => string | number }

export function toCsv<T>(rows: T[], cols: Col<T>[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const withCsv = cols.filter((c) => c.csv)
  return [withCsv.map((c) => esc(c.header)).join(','), ...rows.map((r) => withCsv.map((c) => esc(c.csv!(r))).join(','))].join('\n')
}

export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DataTable<T>({
  rows,
  cols,
  rowKey,
  search,
  searchPlaceholder,
  filters,
  onRow,
  pageSize = 10,
  exportName,
  empty,
  initialSort,
  dense,
}: {
  rows: T[]
  cols: Col<T>[]
  rowKey: (r: T) => string
  search?: (r: T, q: string) => boolean
  searchPlaceholder?: string
  filters?: ReactNode
  onRow?: (r: T) => void
  pageSize?: number
  exportName?: string
  empty?: { title: string; body?: string }
  initialSort?: { key: string; dir: 1 | -1 }
  dense?: boolean
}) {
  const { t, dir } = useI18n()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | undefined>(initialSort)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 320)
    return () => clearTimeout(id)
  }, [])
  const filtered = useMemo(() => {
    let r = search && q.trim() ? rows.filter((x) => search(x, q.trim().toLowerCase())) : rows
    const col = sort && cols.find((c) => c.key === sort.key)
    if (col?.sort) {
      const f = col.sort
      r = [...r].sort((a, b) => {
        const va = f(a)
        const vb = f(b)
        return (va > vb ? 1 : va < vb ? -1 : 0) * sort!.dir
      })
    }
    return r
  }, [rows, q, sort, cols, search])
  useEffect(() => setPage(0), [q, rows.length])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const cur = Math.min(page, pages - 1)
  const slice = filtered.slice(cur * pageSize, cur * pageSize + pageSize)
  const Prev = dir === 'rtl' ? ChevronRight : ChevronLeft
  const Next = dir === 'rtl' ? ChevronLeft : ChevronRight
  return (
    <div className="rounded-2xl bg-white ring-1 ring-line">
      {(search || filters || exportName) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {search && (
            <div className="relative min-w-52 flex-1 sm:max-w-80">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute-2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder ?? t('بحث…', 'Search…')} aria-label={t('بحث', 'Search')} className="h-10 w-full rounded-xl bg-road ps-9 pe-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-ink" />
            </div>
          )}
          {filters}
          {exportName && (
            <Button variant="secondary" size="sm" className="ms-auto" icon={<Download size={15} />} onClick={() => downloadFile(`${exportName}.csv`, toCsv(filtered, cols))}>
              CSV
            </Button>
          )}
        </div>
      )}
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-[12px] text-mute">
              {cols.map((c) => (
                <th key={c.key} className={cx('px-4 py-2.5 text-start font-medium whitespace-nowrap', c.className)}>
                  {c.sort ? (
                    <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: -1 }))}>
                      {c.header}
                      {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                  <tr key={i} className="border-b border-line/70">
                    {cols.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-32" />
                      </td>
                    ))}
                  </tr>
                ))
              : slice.map((r) => (
                  <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined} className={cx('border-b border-line/70 last:border-0', onRow && 'cursor-pointer transition hover:bg-road/70')}>
                    {cols.map((c) => (
                      <td key={c.key} className={cx('px-4 align-middle', dense ? 'py-2' : 'py-3', c.className)}>
                        {c.cell(r)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <EmptyState title={empty?.title ?? t('لا توجد نتائج', 'No results')} body={empty?.body ?? (q ? t('جرّب كلمة بحث مختلفة أو أزل الفلاتر.', 'Try a different search or clear filters.') : undefined)} />}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12.5px] text-mute">
        <span className="num">
          {filtered.length === 0 ? 0 : cur * pageSize + 1}–{Math.min(filtered.length, (cur + 1) * pageSize)} {t('من', 'of')} {filtered.length.toLocaleString('en-US')}
        </span>
        <div className="flex items-center gap-1" dir="ltr">
          <button aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="flex size-8 items-center justify-center rounded-lg hover:bg-road disabled:opacity-30">
            {dir === 'rtl' ? <Next size={16} /> : <Prev size={16} />}
          </button>
          {Array.from({ length: pages })
            .map((_, i) => i)
            .filter((i) => i === 0 || i === pages - 1 || Math.abs(i - cur) <= 1)
            .map((i, k, arr) => (
              <span key={i} className="flex items-center">
                {k > 0 && arr[k - 1] !== i - 1 && <span className="px-1">…</span>}
                <button onClick={() => setPage(i)} className={cx('num size-8 rounded-lg text-[12.5px] font-semibold', i === cur ? 'bg-ink text-white' : 'hover:bg-road')}>
                  {i + 1}
                </button>
              </span>
            ))}
          <button aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="flex size-8 items-center justify-center rounded-lg hover:bg-road disabled:opacity-30">
            {dir === 'rtl' ? <Prev size={16} /> : <Next size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilterChips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cx('h-8 rounded-lg px-3 text-[12.5px] font-semibold transition', value === o.value ? 'bg-ink text-white' : 'bg-road text-ink hover:bg-road-2')}>
          {o.label}
          {o.count !== undefined && <span className="num ms-1.5 opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function KV({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-mute">{k}</span>
      <span className="text-end font-medium">{v}</span>
    </div>
  )
}

/** Chart colours: ink-led monochrome with Motion Green reserved for live/highlight series (brand rule). */
export const CHART = { ink: '#101112', mid: '#6b6e71', light: '#b5b8ba', faint: '#e5e6e3', go: '#78B83F', grid: '#eeefec' }
export const CLASS_COLORS: Record<string, string> = { go: '#101112', comfort: '#6b6e71', black: '#b5b8ba', xl: '#78B83F' }

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Bilingual } from '../core/types'
import type { Lang } from '../core/format'

type Ctx = {
  lang: Lang
  dir: 'rtl' | 'ltr'
  setLang: (l: Lang) => void
  toggle: () => void
  /** Inline bilingual string: t('الرئيسية', 'Home'). Keeps both languages side by side in code. */
  t: (ar: string, en: string) => string
  /** Pick from a Bilingual object. */
  L: (b: Bilingual | undefined) => string
}

const I18nCtx = createContext<Ctx | null>(null)
const KEY = 'aura.lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(KEY)
      return v === 'en' ? 'en' : 'ar'
    } catch {
      return 'ar'
    }
  })
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* noop */
    }
  }, [])
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === 'ar' || e.newValue === 'en')) setLangState(e.newValue)
    }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])
  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir,
      setLang,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      t: (ar, en) => (lang === 'ar' ? ar : en),
      L: (b) => (b ? b[lang] : ''),
    }),
    [lang, dir, setLang],
  )
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  const c = useContext(I18nCtx)
  if (!c) throw new Error('useI18n outside provider')
  return c
}

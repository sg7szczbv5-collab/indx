import { useEffect, useState } from 'react'

/** Minimal hash router: #/admin/trips → ['admin', 'trips']. Works on static hosting with no server config. */
export function useHashRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean)
  const [parts, setParts] = useState(read)
  useEffect(() => {
    const on = () => setParts(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return parts
}

export const go = (path: string) => {
  window.location.hash = path.startsWith('/') ? path : `/${path}`
}

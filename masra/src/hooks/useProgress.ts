import { useEffect, useRef, useState } from 'react'

/** Animates a value 0 → 1 over `duration` ms while `active`. Resets to 0 whenever `resetKey` changes. */
export function useProgress(active: boolean, duration: number, resetKey: unknown = 0, onDone?: () => void) {
  const [p, setP] = useState(0)
  const pRef = useRef(0)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    pRef.current = 0
    setP(0)
  }, [resetKey])

  useEffect(() => {
    if (!active) return
    let raf = 0
    const from = pRef.current >= 1 ? 0 : pRef.current
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t - from * duration
      const v = Math.min(1, (t - start) / duration)
      pRef.current = v
      setP(v)
      if (v < 1) raf = requestAnimationFrame(tick)
      else done.current?.()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, duration, resetKey])

  return p
}

import { useEffect, useRef, useState } from 'react'

/** Animates 0 → 1 over `duration` ms while `active`; calls `onDone` once at the end. */
export function useProgress(active: boolean, duration: number, onDone?: () => void) {
  const [p, setP] = useState(0)
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })
  useEffect(() => {
    if (!active) return
    let raf = 0
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const v = Math.min(1, (t - start) / duration)
      setP(v)
      if (v < 1) raf = requestAnimationFrame(tick)
      else done.current?.()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, duration])
  return p
}

/** A looping clock (seconds) for ambient animation such as nearby cars. */
export function useLoopClock(active: boolean, fps = 24) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const iv = setInterval(() => setT((Date.now() - start) / 1000), 1000 / fps)
    return () => clearInterval(iv)
  }, [active, fps])
  return t
}

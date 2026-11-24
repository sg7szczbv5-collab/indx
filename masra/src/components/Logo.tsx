import { motion } from 'framer-motion'

/** MASRA geometric mark: an origin point, a curving road, and a forward direction chevron. */
export function LogoMark({
  size = 40,
  dark = false,
  animate = false,
}: {
  size?: number
  dark?: boolean
  animate?: boolean
}) {
  const bg = dark ? '#ffffff' : '#0b0d0c'
  const road = dark ? '#0b0d0c' : '#ffffff'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill={bg} />
      <motion.path
        d="M13 35c0-9 9-8 13-13s3-9 9-9"
        fill="none"
        stroke={road}
        strokeWidth="4.5"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      <motion.path
        d="M29 11.5l6.5 1.5-1.5 6.5"
        fill="none"
        stroke="#1fa36a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: animate ? 1.05 : 0, duration: 0.4 }}
      />
      <circle cx="13" cy="35" r="3.2" fill="#1fa36a" />
    </svg>
  )
}

export function Logo({
  size = 36,
  dark = false,
  showLatin = true,
  className = '',
}: {
  size?: number
  dark?: boolean
  showLatin?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} dark={dark} />
      <div className="leading-none">
        <div
          className={`font-bold ${dark ? 'text-ink' : 'text-white'}`}
          style={{ fontSize: size * 0.58 }}
        >
          مَسْرى
        </div>
        {showLatin && (
          <div
            className={`mt-1 font-semibold tracking-[0.32em] ${dark ? 'text-ink/60' : 'text-white/55'}`}
            style={{ fontSize: size * 0.24 }}
          >
            MASRA
          </div>
        )}
      </div>
    </div>
  )
}

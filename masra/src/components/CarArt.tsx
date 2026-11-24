/** Original side-view vehicle illustrations for the ride picker (sedan, SUV, van, luxury). Facing left. */
export function CarArt({ kind = 'sedan', color = '#f4f6f5', width = 64 }: { kind?: 'sedan' | 'suv' | 'van' | 'lux'; color?: string; width?: number }) {
  const dark = ['#1a1e1c', '#0f5b3a', '#0b0d0c'].includes(color)
  const glass = dark ? '#5b6560' : '#2a302d'
  const line = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'
  const bodies: Record<string, { body: string; glass: string; wheels: [number, number] }> = {
    sedan: {
      body: 'M6 30 L9 23 Q12 19 20 18 L30 11 Q34 9 42 9 L58 9 Q66 9 72 15 L80 19 Q90 20 92 26 L92 32 Q92 34 90 34 L8 34 Q6 34 6 32 Z',
      glass: 'M32 12.5 L42 11.5 L42 18 L25 18.5 Z M45 11.5 L57 11.5 Q63 11.5 68 17.5 L45 18 Z',
      wheels: [24, 74],
    },
    suv: {
      body: 'M5 31 L6 21 Q8 16 18 15 L26 7 Q29 5 36 5 L70 5 Q76 5 80 10 L84 16 Q92 17 93 23 L93 32 Q93 34 91 34 L7 34 Q5 34 5 31 Z',
      glass: 'M29 8 L44 8 L44 15 L22 15.5 Z M47 8 L66 8 L66 15 L47 15 Z M69 8 Q74 8 78 14.5 L69 14.5 Z',
      wheels: [23, 75],
    },
    van: {
      body: 'M4 31 L4 16 Q4 7 12 5 L20 3 Q23 2 28 2 L86 2 Q93 2 93 9 L93 32 Q93 34 91 34 L6 34 Q4 34 4 31 Z',
      glass: 'M10 15 Q10 8 17 6.5 L24 5.5 L24 15 Z M28 5.5 L48 5.5 L48 15 L28 15 Z M52 5.5 L70 5.5 L70 15 L52 15 Z M74 5.5 L89 5.5 L89 15 L74 15 Z',
      wheels: [21, 77],
    },
    lux: {
      body: 'M5 29 L8 24 Q12 20 22 19 L33 12 Q37 10 46 10 L60 10 Q68 10 74 15 L82 19 Q92 20 94 26 L94 31 Q94 33 92 33 L7 33 Q5 33 5 29 Z',
      glass: 'M35 13.5 L45 12.5 L45 18.5 L28 19 Z M48 12.5 L59 12.5 Q65 12.5 70 18 L48 18.5 Z',
      wheels: [25, 77],
    },
  }
  const b = bodies[kind]
  return (
    <svg viewBox="0 0 100 42" width={width} height={(width * 42) / 100} aria-hidden="true">
      <ellipse cx="50" cy="38" rx="44" ry="3" fill="rgba(0,0,0,0.14)" />
      <path d={b.body} fill={color} stroke={line} strokeWidth="1" />
      <path d={b.glass} fill={glass} />
      <path d={`M10 25 L90 25`} stroke={line} strokeWidth="0.8" />
      <rect x="6" y="24" width="5" height="2.4" rx="1.2" fill="#fff6df" />
      <rect x={kind === 'van' ? 89 : 88} y="23.5" width="4" height="2.6" rx="1.2" fill="#d9534f" />
      {kind === 'lux' && <path d="M14 29 L86 29" stroke="#c9a45c" strokeWidth="0.8" />}
      {b.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy="34" r="7" fill="#0b0d0c" />
          <circle cx={x} cy="34" r="3.4" fill={kind === 'lux' ? '#c9a45c' : '#9aa39e'} />
        </g>
      ))}
    </svg>
  )
}

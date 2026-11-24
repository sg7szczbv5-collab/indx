import { TEXTS } from "../constants";
import { LOGO_FONT, M } from "./theme";

/**
 * Line-art storefront of the real branch (striped facade, green-framed
 * entrance, roof lamps, bollards). `draw` traces strokes, `fill` adds colour.
 * viewBox 0 0 1000 900.
 */
export const LineStore: React.FC<{ draw: number; fill: number; frame: number; doorOpen?: number }> = ({
  draw,
  fill,
  frame,
  doorOpen = 0,
}) => {
  const st = (d: number, extra: { stroke?: string; strokeWidth?: number; opacity?: number } = {}) => ({
    pathLength: 1,
    strokeDasharray: `${Math.max(0, Math.min(1, draw * 1.4 - d))} 1`,
    fill: "none",
    visibility: (draw * 1.4 - d > 0.005 ? "visible" : "hidden") as "visible" | "hidden",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...extra,
  });
  const slide = doorOpen * 70;
  return (
    <svg viewBox="0 0 1000 900" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="lsLamp">
          <stop offset="0" stopColor="#FEF9C3" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FEF9C3" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="lsGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E3A2B" />
          <stop offset="1" stopColor="#0B2216" />
        </linearGradient>
      </defs>
      {/* fills */}
      <g opacity={fill}>
        <rect x={0} y={130} width={1000} height={350} rx={14} fill="#3A3F45" />
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={8} x2={992} y1={150 + i * 23} y2={150 + i * 23} stroke="#2E3237" strokeWidth={6} />
        ))}
        <rect x={0} y={480} width={1000} height={310} fill="#E8EDEA" />
        <rect x={70} y={505} width={250} height={280} fill="url(#lsGlass)" />
        <rect x={700} y={505} width={230} height={280} fill="url(#lsGlass)" />
        <rect x={340} y={470} width={320} height={320} fill="#FFF3C4" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={150 + i * 233} cy={50} r={70} fill="url(#lsLamp)" opacity={0.7 + 0.3 * Math.sin(frame * 0.2 + i)} />
        ))}
      </g>
      <g stroke={M.text} strokeWidth={4}>
        {/* lamps */}
        {[150, 383, 617, 850].map((x, i) => (
          <g key={x}>
            <path d={`M ${x} 130 L ${x} 90`} {...st(0.05 + i * 0.03)} />
            <ellipse cx={x} cy={50} rx={16} ry={40} transform={`rotate(${i < 2 ? 18 : -18} ${x} 50)`} {...st(0.1 + i * 0.03)} />
          </g>
        ))}
        {/* facade */}
        <path d="M 14 130 H 986 Q 1000 130 1000 144 V 480 H 0 V 144 Q 0 130 14 130 Z" {...st(0)} />
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M 20 ${175 + i * 50} H 980`} {...st(0.12 + i * 0.03, { strokeWidth: 2, opacity: 0.45 })} />
        ))}
        {/* lower walls + windows */}
        <path d="M 0 480 V 790 H 1000 V 480" {...st(0.2)} />
        <path d="M 70 505 H 320 V 785 H 70 Z" {...st(0.3, { stroke: M.glow, strokeWidth: 8 })} />
        <path d="M 700 505 H 930 V 785 H 700 Z" {...st(0.32, { stroke: M.glow, strokeWidth: 8 })} />
        <path d="M 100 760 L 170 540 M 730 760 L 800 540" {...st(0.4, { strokeWidth: 3, opacity: 0.5 })} />
        {/* entrance frame rising above the band */}
        <path d="M 330 790 V 420 H 670 V 790" {...st(0.25, { stroke: M.glow, strokeWidth: 12 })} />
        <path d="M 0 480 H 1000" {...st(0.22, { stroke: M.glow, strokeWidth: 12 })} />
        {/* sliding doors */}
        <path d={`M ${500 - slide} 470 V 790 M ${500 + slide} 470 V 790`} {...st(0.45, { strokeWidth: 3 })} />
        {/* sidewalk + bollards */}
        <path d="M -30 800 H 1030" {...st(0.35)} />
        {[365, 455, 545, 635].map((x, i) => (
          <path key={x} d={`M ${x} 760 V 860`} {...st(0.5 + i * 0.03, { strokeWidth: 14, stroke: "#9CA3AF" })} />
        ))}
        <path d="M 40 820 L 220 820 L 160 880 L -20 880 Z" {...st(0.55, { stroke: M.glow })} />
        <path d="M 780 820 L 960 820 L 1020 880 L 840 880 Z" {...st(0.55, { stroke: M.glow })} />
      </g>
      {/* sign letters */}
      <g opacity={fill} style={{ fontFamily: LOGO_FONT }}>
        <text x={650} y={380} textAnchor="middle" direction="rtl" fontSize={200} fill={M.red}>
          {TEXTS.logoAlfa}
        </text>
        <text x={330} y={380} textAnchor="middle" direction="rtl" fontSize={150} fill={M.glow}>
          {TEXTS.logoMarket}
        </text>
      </g>
    </svg>
  );
};

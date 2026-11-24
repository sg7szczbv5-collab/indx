import { AbsoluteFill } from "remotion";
import { COLORS } from "../../constants";
import { wave } from "../../anim";

export const Cloud: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  opacity = 1,
}) => {
  const blobs = [
    [0, 0, 60],
    [55, -25, 70],
    [120, 0, 58],
    [60, 20, 60],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <ellipse cx={60} cy={58} rx={130} ry={14} fill="#000" opacity={0.05} />
      {blobs.map(([cx, cy, r], i) => (
        <circle key={`o${i}`} cx={cx} cy={cy} r={r + 5} fill={COLORS.outline} opacity={0.12} />
      ))}
      {blobs.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" />
      ))}
      <ellipse cx={40} cy={-30} rx={22} ry={10} fill="#fff" opacity={0.9} />
    </g>
  );
};

export const Sparkle: React.FC<{ x: number; y: number; size?: number; color?: string; rot?: number }> = ({
  x,
  y,
  size = 30,
  color = COLORS.yellow,
  rot = 0,
}) => {
  const s = size;
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rot})`}
      d={`M 0 ${-s} Q ${s * 0.18} ${-s * 0.18} ${s} 0 Q ${s * 0.18} ${s * 0.18} 0 ${s} Q ${-s * 0.18} ${s * 0.18} ${-s} 0 Q ${-s * 0.18} ${-s * 0.18} 0 ${-s} Z`}
      fill={color}
      stroke={COLORS.outline}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  );
};

export const Sun: React.FC<{ x: number; y: number; frame: number; r?: number }> = ({ x, y, frame, r = 90 }) => (
  <g transform={`translate(${x} ${y})`}>
    <g transform={`rotate(${frame * 0.6})`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x={-9}
          y={-r - 48}
          width={18}
          height={34}
          rx={9}
          fill="#FDE047"
          stroke={COLORS.outline}
          strokeWidth={3}
          transform={`rotate(${i * 30})`}
        />
      ))}
    </g>
    <circle r={r} fill="#FDE047" stroke={COLORS.outline} strokeWidth={5} />
    <circle r={r - 14} fill="#FACC15" opacity={0.5} />
  </g>
);

/** Warm cream backdrop with soft blobs and drifting clouds. */
export const CartoonBackground: React.FC<{
  frame: number;
  top?: string;
  bottom?: string;
  clouds?: boolean;
}> = ({ frame, top = COLORS.cream, bottom = "#FFFFFF", clouds = true }) => {
  const drift = (frame * 0.6) % 1400;
  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={bottom} />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#bgGrad)" />
        <circle cx={980 + wave(frame, 0.03, 12)} cy={420} r={220} fill={COLORS.greenPale} opacity={0.45} />
        <circle cx={80} cy={1200 + wave(frame, 0.025, 14)} r={260} fill="#FECACA" opacity={0.35} />
        <circle cx={900} cy={1750} r={200} fill="#FDE68A" opacity={0.4} />
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 211) % 1080}
            cy={(i * 457) % 1920}
            r={6 + (i % 3) * 3}
            fill={i % 2 ? COLORS.greenLight : COLORS.red}
            opacity={0.18 + 0.1 * Math.sin(frame * 0.08 + i)}
          />
        ))}
        {clouds && (
          <>
            <Cloud x={((-260 + drift) % 1400) - 100} y={210} s={0.9} />
            <Cloud x={((500 + drift * 0.7) % 1400) - 200} y={330} s={0.6} opacity={0.9} />
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

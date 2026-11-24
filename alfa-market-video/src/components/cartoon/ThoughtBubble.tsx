import { COLORS } from "../../constants";

const O = COLORS.outline;

type Props = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** 0..1 global grow of the bubble */
  scale: number;
  /** points from the bubble down to the thinker's head */
  tail: { x: number; y: number }[];
  tailProgress: number[];
  children?: React.ReactNode;
};

/** Fluffy thought cloud – outline drawn once around the union of circles. */
export const ThoughtBubble: React.FC<Props> = ({ cx, cy, w, h, scale, tail, tailProgress, children }) => {
  const rx = w / 2;
  const ry = h / 2;
  const n = 11;
  const bumps = Array.from({ length: n }).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * rx * 0.82, Math.sin(a) * ry * 0.78, Math.min(rx, ry) * 0.42] as const;
  });
  return (
    <g>
      {tail.map((p, i) => {
        const s = tailProgress[i] ?? 0;
        const r = 18 + i * 10;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${s})`}>
            <circle r={r} fill="#fff" stroke={O} strokeWidth={6} />
          </g>
        );
      })}
      <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
        <ellipse cx={10} cy={ry + 18} rx={rx * 0.8} ry={18} fill="#000" opacity={0.08} />
        {bumps.map(([x, y, r], i) => (
          <circle key={`o${i}`} cx={x} cy={y} r={r + 7} fill={O} />
        ))}
        <ellipse cx={0} cy={0} rx={rx * 0.86 + 7} ry={ry * 0.8 + 7} fill={O} />
        {bumps.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff" />
        ))}
        <ellipse cx={0} cy={0} rx={rx * 0.86} ry={ry * 0.8} fill="#fff" />
        {children}
      </g>
    </g>
  );
};

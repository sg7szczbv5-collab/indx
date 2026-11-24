import { random } from "remotion";
import { COLORS } from "../../constants";

/** Deterministic falling confetti (SVG, 1080x1920 space). */
export const Confetti: React.FC<{ frame: number; count?: number; seed?: string; start?: number }> = ({
  frame,
  count = 40,
  seed = "c",
  start = 0,
}) => {
  const f = frame - start;
  if (f < 0) return null;
  const palette = [COLORS.red, COLORS.green, COLORS.greenLight, COLORS.yellow, "#38BDF8", "#fff"];
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x0 = random(`${seed}x${i}`) * 1080;
        const speed = 5 + random(`${seed}s${i}`) * 7;
        const delay = random(`${seed}d${i}`) * 50;
        const y = -60 + (f - delay) * speed;
        if (f < delay || y > 1980) return null;
        const x = x0 + Math.sin((f + i * 7) * 0.08) * 40;
        const rot = (f + i * 20) * (4 + (i % 5));
        const shape = i % 3;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            {shape === 0 ? (
              <rect x={-10} y={-5} width={20} height={10} rx={2} fill={palette[i % palette.length]} />
            ) : shape === 1 ? (
              <circle r={7} fill={palette[i % palette.length]} />
            ) : (
              <path d="M 0 -10 Q 14 -18 18 -4 Q 6 6 0 -10 Z" fill={COLORS.greenLight} />
            )}
          </g>
        );
      })}
    </g>
  );
};

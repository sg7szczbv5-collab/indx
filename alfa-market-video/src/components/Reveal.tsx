import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, TRANSITION_FRAMES } from "../constants";
import { ci, easeInOut } from "../anim";

/**
 * Cartoon scene transition: the new scene is revealed through a growing circle
 * framed by a green ring – or a spinning starburst when kind = "burst".
 */
export const Reveal: React.FC<{ kind?: "circle" | "burst"; children: React.ReactNode }> = ({
  kind = "circle",
  children,
}) => {
  const frame = useCurrentFrame();
  const p = ci(frame, [0, TRANSITION_FRAMES], [0, 1], easeInOut);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = p * 1150;
  const rays = 18;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at 50% 50%)` }}>{children}</AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(540 960)">
          {kind === "burst" &&
            Array.from({ length: rays }).map((_, i) => {
              const a = (i / rays) * Math.PI * 2 + frame * 0.08;
              const a1 = a - 0.07;
              const a2 = a + 0.07;
              const r0 = r + 10;
              const r1 = r + 140 * (1 - p * 0.4);
              return (
                <polygon
                  key={i}
                  points={`${Math.cos(a1) * r0},${Math.sin(a1) * r0} ${Math.cos(a) * r1},${Math.sin(a) * r1} ${Math.cos(a2) * r0},${Math.sin(a2) * r0}`}
                  fill={i % 2 ? COLORS.red : COLORS.yellow}
                  stroke={COLORS.outline}
                  strokeWidth={4}
                  strokeLinejoin="round"
                />
              );
            })}
          <circle r={r} fill="none" stroke={COLORS.outline} strokeWidth={36} />
          <circle r={r} fill="none" stroke={COLORS.green} strokeWidth={24} />
          <circle r={r + 6} fill="none" stroke="#fff" strokeWidth={5} opacity={0.6} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

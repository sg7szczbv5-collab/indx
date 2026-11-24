import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION_TEXTS as T } from "../../constants";
import { M, tw, keys, out, inOut } from "../theme";
import { BlurText, DirBlur, GlowDot, Pill, Stage, Thread, drop, flash } from "../primitives";
import { Icon } from "../icons";
import { whip } from "../camera";

const RINGS = [
  { y: 1210, w: 420, at: 12 },
  { y: 1060, w: 330, at: 20 },
  { y: 930, w: 250, at: 28 },
];

const PILLS = [
  { x: 600, y: 760, at: 98, icon: "cup" as const },
  { x: 470, y: 1060, at: 122, icon: "bread" as const },
  { x: 610, y: 1360, at: 146, icon: "milk" as const },
];

/** 1 – "ناقصك شيء في البيت؟": dot rises with glowing rings, then the missing items chain in. */
export const M1Home: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cam = whip(f, durationInFrames, { enter: false });

  const dome = tw(f, 0, 18, 0, 1, out) * (1 - tw(f, 88, 110, 0, 0.85, inOut));
  const domeRise = tw(f, 0, 20, 0, 1, out);
  const dotY = keys(f, [[4, 1600], [40, 820], [92, 820], [100, 640]], inOut);
  const ringsOut = tw(f, 86, 98, 0, 1, inOut);

  return (
    <AbsoluteFill>
      <Stage frame={f} dome={dome} domeRise={domeRise} />
      <DirBlur y={cam.v * 0.5} style={{ transform: `translateY(${cam.y}px)` }}>
        <AbsoluteFill style={{ top: 230 }}>
          <BlurText text={T.q1} frame={f} at={4} size={96} />
          <BlurText text={T.q2} frame={f} at={12} size={116} color={M.mint} glow="rgba(74,222,128,0.5)" />
        </AbsoluteFill>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* rising thread + rings */}
          {f < 104 && (
            <g opacity={1 - ringsOut}>
              <path
                d={`M 540 1600 C 600 1450 480 1300 540 1150 S 500 950 540 ${dotY}`}
                stroke={M.line}
                strokeWidth={3}
                fill="none"
              />
              {RINGS.map((r, i) => {
                const p = tw(f, r.at, r.at + 14, 0, 1, out);
                const pulse = 1 + Math.sin(f * 0.15 + i) * 0.04;
                const w = r.w * p * pulse * (1 - ringsOut);
                return (
                  <g key={i}>
                    <ellipse cx={540} cy={r.y} rx={w * 0.6} ry={w * 0.09} fill={M.glow} opacity={0.18 * p} />
                    <ellipse cx={540} cy={r.y} rx={w * 0.5} ry={w * 0.06} fill="url(#ringGrad)" opacity={p} />
                  </g>
                );
              })}
              <defs>
                <radialGradient id="ringGrad">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="0.35" stopColor={M.mint} />
                  <stop offset="1" stopColor={M.green} stopOpacity={0.2} />
                </radialGradient>
              </defs>
              <GlowDot x={540} y={dotY} r={8} />
            </g>
          )}
          {/* threads between the item pills */}
          {PILLS.slice(1).map((p, i) => {
            const prev = PILLS[i];
            const prog = tw(f, p.at - 4, p.at + 14, 0, 1, inOut);
            return (
              <Thread
                key={i}
                a={{ x: prev.x - 150, y: prev.y + 75 }}
                b={{ x: p.x + 120, y: p.y - 75 }}
                p={prog}
                bend={-120}
              />
            );
          })}
        </svg>
        {PILLS.map((p, i) => {
          const d = drop(f, p.at, -700);
          const morph = tw(f, p.at, p.at + 14, 0, 1, out);
          return (
            <DirBlur key={i} y={d.v * 0.45}>
              <Pill
                cx={p.x}
                cy={p.y + d.dy}
                title={T.missing[i].title}
                sub={T.missing[i].sub}
                icon={<Icon name={p.icon} size={46} />}
                appear={d.p * (0.35 + 0.65 * morph)}
                fill={flash(f, p.at + 6)}
                text={tw(f, p.at + 8, p.at + 20)}
                w={520}
                h={150}
              />
            </DirBlur>
          );
        })}
      </DirBlur>
    </AbsoluteFill>
  );
};

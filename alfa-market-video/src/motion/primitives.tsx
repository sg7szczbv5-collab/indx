import { useId } from "react";
import { AbsoluteFill, random } from "remotion";
import { FONT, M, Pt, cubic, tw, out } from "./theme";

/** Directional (motion) blur wrapper using an SVG gaussian filter. */
export const DirBlur: React.FC<{
  x?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x = 0, y = 0, children, style }) => {
  const raw = useId();
  const id = "db" + raw.replace(/[^a-zA-Z0-9]/g, "");
  const bx = Math.min(60, Math.abs(x));
  const by = Math.min(60, Math.abs(y));
  const on = bx > 0.4 || by > 0.4;
  return (
    <>
      {on && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation={`${bx} ${by}`} />
          </filter>
        </svg>
      )}
      <div style={{ position: "absolute", inset: 0, filter: on ? `url(#${id})` : undefined, ...style }}>{children}</div>
    </>
  );
};

/** Dark stage with the glowing "planet" dome and drifting particles. */
export const Stage: React.FC<{ frame: number; dome?: number; domeRise?: number; light?: boolean }> = ({
  frame,
  dome = 0,
  domeRise = 1,
  light = false,
}) => (
  <AbsoluteFill style={{ background: light ? M.light : M.bg }}>
    {!light && (
      <>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 90% 40% at 50% 108%, rgba(34,197,94,0.22), transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -180,
            width: 1440,
            height: 900,
            top: 1920 - 330 * domeRise,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 50% 0%, #22C55E 0%, #15803D 35%, #064E25 70%)`,
            opacity: dome,
            boxShadow: `0 -40px 160px rgba(34,197,94,${0.5 * dome})`,
          }}
        />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 26 }).map((_, i) => {
            const x = random(`px${i}`) * 1080;
            const y0 = random(`py${i}`) * 1920;
            const y = (y0 - frame * (0.3 + random(`ps${i}`) * 0.6) + 1920) % 1920;
            const o = 0.15 + 0.35 * Math.abs(Math.sin(frame * 0.03 + i));
            return <circle key={i} cx={x} cy={y} r={1.6 + random(`pr${i}`) * 2} fill={M.mint} opacity={o} />;
          })}
        </svg>
      </>
    )}
  </AbsoluteFill>
);

/** Glowing particle dot. */
export const GlowDot: React.FC<{ x: number; y: number; r?: number; color?: string; o?: number }> = ({
  x,
  y,
  r = 7,
  color = M.mint,
  o = 1,
}) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r * 5} fill={color} opacity={0.12} />
    <circle cx={x} cy={y} r={r * 2.4} fill={color} opacity={0.35} />
    <circle cx={x} cy={y} r={r} fill="#fff" />
  </g>
);

/** Thin S-curved thread from a → b drawn up to `p`, with a glowing head. */
export const Thread: React.FC<{
  a: Pt;
  b: Pt;
  p: number;
  bend?: number;
  color?: string;
  head?: boolean;
  width?: number;
}> = ({ a, b, p, bend = 160, color = M.line, head = true, width = 3 }) => {
  if (p <= 0) return null;
  const c1 = { x: a.x + bend, y: a.y + (b.y - a.y) * 0.45 };
  const c2 = { x: b.x - bend, y: b.y - (b.y - a.y) * 0.45 };
  const d = `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
  const h = cubic(a, c1, c2, b, Math.min(1, p));
  return (
    <g>
      <path d={d} stroke={color} strokeWidth={width} fill="none" pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
      {head && p < 1 && <GlowDot x={h.x} y={h.y} r={6} />}
    </g>
  );
};

/** Words fade in from a blur and rise slightly (RTL). */
export const BlurText: React.FC<{
  text: string;
  frame: number;
  at: number;
  size?: number;
  color?: string;
  weight?: number;
  stagger?: number;
  exitAt?: number;
  font?: string;
  glow?: string;
}> = ({ text, frame, at, size = 80, color = M.text, weight = 900, stagger = 3, exitAt, font = FONT, glow }) => {
  const words = text.split(" ");
  return (
    <div dir="rtl" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: size * 0.26 }}>
      {words.map((w, i) => {
        const p = tw(frame, at + i * stagger, at + i * stagger + 14, 0, 1, out);
        const e = exitAt !== undefined ? tw(frame, exitAt, exitAt + 10, 0, 1) : 0;
        const blur = (1 - p) * 16 + e * 18;
        return (
          <span
            key={i}
            style={{
              fontFamily: font,
              fontWeight: weight,
              fontSize: size,
              lineHeight: 1.35,
              color,
              display: "inline-block",
              opacity: p * (1 - e),
              filter: `blur(${blur}px)`,
              transform: `translateY(${(1 - p) * 30 - e * 30}px)`,
              textShadow: glow ? `0 0 30px ${glow}` : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export type Tone = "green" | "red";

/**
 * UI pill that morphs: dot → glowing bar → full pill → text.
 * `appear` 0..1 controls the morph, `fill` the bright gradient highlight,
 * `text` the content reveal.
 */
export const Pill: React.FC<{
  cx: number;
  cy: number;
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  appear: number;
  fill: number;
  text: number;
  w?: number;
  h?: number;
  tone?: Tone;
  onLight?: boolean;
}> = ({ cx, cy, title, sub, icon, appear, fill, text, w = 640, h = 150, tone = "green", onLight = false }) => {
  if (appear <= 0) return null;
  const a = Math.min(1, appear);
  const ww = h * 0.35 + (w - h * 0.35) * a;
  const hh = h * 0.35 + h * 0.65 * Math.min(1, a * 1.6);
  const grad =
    tone === "green"
      ? `linear-gradient(90deg, #15803D, #22C55E 55%, #4ADE80)`
      : `linear-gradient(90deg, #991B1B, #DC2626 55%, #F87171)`;
  const glowC = tone === "green" ? "34,197,94" : "220,38,38";
  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        left: cx - ww / 2,
        top: cy - hh / 2,
        width: ww,
        height: hh,
        borderRadius: hh / 2,
        background: onLight ? M.ink : M.pillDark,
        border: `3px solid rgba(${glowC},${0.55 + 0.45 * fill})`,
        boxShadow: `0 0 ${30 + 50 * fill}px rgba(${glowC},${0.25 + 0.45 * fill})${onLight ? ", 0 24px 50px rgba(10,26,17,0.25)" : ""}`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: `0 ${h * 0.3}px`,
        gap: 24,
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: grad, opacity: fill }} />
      <div
        style={{
          position: "relative",
          flex: 1,
          opacity: text,
          filter: `blur(${(1 - text) * 10}px)`,
          transform: `translateX(${(1 - text) * 30}px)`,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: h * 0.34, color: "#fff", lineHeight: 1.25 }}>{title}</div>
        {sub && (
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: h * 0.19,
              color: fill > 0.5 ? "rgba(255,255,255,0.85)" : tone === "red" ? M.redGlow : M.mint,
              lineHeight: 1.45,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {icon && (
        <div
          style={{
            position: "relative",
            width: h * 0.56,
            height: h * 0.56,
            borderRadius: "50%",
            border: `3px solid ${fill > 0.5 ? "#fff" : tone === "red" ? M.redGlow : M.mint}`,
            color: fill > 0.5 ? "#fff" : tone === "red" ? M.redGlow : M.mint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: text,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

/** Pill drop-in from above (or below) with velocity for motion blur. */
export const drop = (f: number, at: number, dist = -650, len = 12) => {
  const fn = (x: number) => tw(x, at, at + len, dist, 0, out);
  return { dy: fn(f), v: fn(f) - fn(f - 1), p: tw(f, at, at + 2, 0, 1) };
};

/** Bright flash on arrival that settles to an outline. */
export const flash = (f: number, at: number) => tw(f, at, at + 4, 0, 1) * (1 - tw(f, at + 14, at + 34, 0, 1));

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION_TEXTS as T, TRANSITION_FRAMES } from "../../constants";
import { FONT, M, tw, keys, out, inOut, inn, cubic } from "../theme";
import { BlurText, DirBlur, GlowDot, Stage } from "../primitives";
import { Icon } from "../icons";

/** Step indicator like the reference's "فكرة • نص • صوت • فيديو". */
const Stepper: React.FC<{ steps: readonly string[]; active: number; p: number }> = ({ steps, active, p }) => {
  const w = 760;
  const x0 = (1080 - w) / 2;
  return (
    <div style={{ position: "absolute", top: 200, left: 0, right: 0, opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>
      <svg width={1080} height={60} style={{ position: "absolute", top: 0 }}>
        <line x1={x0} x2={x0 + w} y1={30} y2={30} stroke="rgba(220,255,232,0.18)" strokeWidth={3} />
        <line x1={x0 + w} x2={x0 + w - (w * Math.min(active, steps.length - 1)) / (steps.length - 1)} y1={30} y2={30} stroke={M.mint} strokeWidth={4} />
        {steps.map((_, i) => {
          const x = x0 + w - (w * i) / (steps.length - 1);
          const on = active >= i - 0.01;
          return on ? <GlowDot key={i} x={x} y={30} r={7} /> : <circle key={i} cx={x} cy={30} r={7} fill="rgba(220,255,232,0.4)" />;
        })}
      </svg>
      {steps.map((s, i) => {
        const x = x0 + w - (w * i) / (steps.length - 1);
        const on = active >= i - 0.01;
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              top: 62,
              left: x - 150,
              width: 300,
              textAlign: "center",
              fontFamily: FONT,
              fontWeight: on ? 900 : 700,
              fontSize: 40,
              color: on ? M.text : M.muted,
            }}
          >
            {s}
          </div>
        );
      })}
    </div>
  );
};

/** 4 – near & easy: stepper, home card morphs into a route that grows the store card. */
export const M4Near: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const v = f - TRANSITION_FRAMES;

  // white → dark: a green gradient bar sweeps right-to-left
  const sweep = tw(f, 0, 16, 1180, -260, inOut);

  const active = keys(f, [[10, 0], [48, 0], [58, 1], [92, 1], [102, 2]], inOut);
  const homeCard = tw(f, 10, 26, 0, 1, out) * (1 - tw(f, 46, 56, 0, 1, inn));
  const route = tw(f, 52, 96, 0, 1, inOut);
  const storeCard = tw(f, 96, 112, 0, 1, out);
  const pinHop = Math.abs(Math.sin(Math.max(0, f - 108) * 0.18)) * -22;
  const exit = tw(f, durationInFrames - 12, durationInFrames, 0, 1, inn);

  const A = { x: 830, y: 900 };
  const B = { x: 250, y: 900 };
  const c1 = { x: 700, y: 650 };
  const c2 = { x: 380, y: 1150 };
  const head = cubic(A, c1, c2, B, route);

  const card = (x: number, y: number, p: number, w: number, h: number, children: React.ReactNode, glow = 0) =>
    p > 0 && (
      <div
        style={{
          position: "absolute",
          left: x - (w * (0.4 + 0.6 * p)) / 2,
          top: y - (h * (0.4 + 0.6 * p)) / 2,
          width: w * (0.4 + 0.6 * p),
          height: h * (0.4 + 0.6 * p),
          borderRadius: 40 * p + 10,
          border: `3px solid ${M.mint}`,
          background: M.pillDark,
          boxShadow: `0 0 ${40 + glow * 40}px rgba(34,197,94,${0.25 + glow * 0.3})`,
          opacity: Math.min(1, p * 1.5),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          color: M.mint,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 44,
          overflow: "hidden",
        }}
      >
        <div style={{ opacity: tw(p, 0.6, 1), color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {children}
        </div>
      </div>
    );

  return (
    <AbsoluteFill>
      <Stage frame={f} dome={0.2} />
      <DirBlur x={0} y={0} style={{ opacity: 1 - exit, filter: `blur(${exit * 30}px)`, transform: `scale(${1 - exit * 0.2})` }}>
        <Stepper steps={T.steps} active={active} p={tw(f, 8, 22)} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path
            d={`M ${A.x} ${A.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${B.x} ${B.y}`}
            stroke="rgba(74,222,128,0.18)"
            strokeWidth={26}
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${route} 1`}
          />
          <path
            d={`M ${A.x} ${A.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${B.x} ${B.y}`}
            stroke={M.mint}
            strokeWidth={4}
            fill="none"
            strokeDasharray="14 16"
            strokeDashoffset={-f * 2}
            opacity={route > 0 ? 1 : 0}
          />
          {route > 0 && route < 1 && <GlowDot x={head.x} y={head.y} r={10} />}
          {route > 0 && <GlowDot x={A.x} y={A.y} r={7} />}
        </svg>
        {card(540, 900, homeCard, 380, 380, (<><Icon name="home" size={130} /><span style={{ color: M.text }}>{T.steps[0]}</span></>))}
        {card(B.x, 900, storeCard, 330, 420, (<><Icon name="store" size={120} /><span style={{ color: M.text, fontSize: 40 }}>{T.steps[2]}</span></>), storeCard)}
        {storeCard > 0 && (
          <div style={{ position: "absolute", left: B.x - 55, top: 560 + pinHop, color: M.red, opacity: storeCard, filter: "drop-shadow(0 0 20px rgba(220,38,38,0.7))" }}>
            <Icon name="pin" size={110} />
          </div>
        )}
        {route > 0.2 && route < 1 && (
          <div style={{ position: "absolute", left: 600, top: 1060, color: M.mint, opacity: tw(route, 0.2, 0.4) * (1 - tw(route, 0.85, 1)) }}>
            <Icon name="clock" size={80} />
          </div>
        )}
        <AbsoluteFill style={{ top: 1300 }}>
          <BlurText text={T.near} frame={v} at={4} size={70} color={M.text} />
        </AbsoluteFill>
      </DirBlur>
      {sweep > -260 && (
        <>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: Math.max(0, sweep), background: M.light }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: sweep,
              width: 260,
              background: `linear-gradient(90deg, ${M.light}, #4ADE80 20%, #16A34A 55%, rgba(2,13,7,0))`,
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

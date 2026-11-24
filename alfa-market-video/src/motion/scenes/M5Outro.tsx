import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MOTION_TEXTS as T, STORE_INFO, TEXTS } from "../../constants";
import { FONT, LOGO_FONT, M, tw, out, inOut } from "../theme";
import { BlurText, Stage } from "../primitives";
import { Icon } from "../icons";

const LEAF = "M 0 60 Q -80 10 -20 -60 Q 20 -90 70 -70 Q 80 0 0 60 Z";

/** 5 – two blurred blobs (green & red) merge into the logo badge, then the welcome line. */
export const M5Outro: React.FC = () => {
  const f = useCurrentFrame();
  const merge = tw(f, 0, 30, 0, 1, inOut);
  const badge = tw(f, 24, 42, 0, 1, out);
  const ang = f * 0.12;
  const r = 220 * (1 - merge);
  const blob = (dx: number, color: string) => (
    <div
      style={{
        position: "absolute",
        left: 540 + dx - 90,
        top: 720 - 90,
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: color,
        filter: `blur(${28 - merge * 10}px)`,
        opacity: 0.95 * (1 - badge),
      }}
    />
  );
  const lines = [
    { k: "pin" as const, t: STORE_INFO.location },
    { k: "clock" as const, t: STORE_INFO.hours },
    { k: "home" as const, t: STORE_INFO.phone },
  ].filter((l) => l.t.trim());

  return (
    <AbsoluteFill>
      <Stage frame={f} dome={tw(f, 20, 60, 0, 0.35)} />
      {blob(Math.cos(ang) * r, M.glow)}
      {blob(-Math.cos(ang) * r, M.red)}
      {badge > 0 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 190,
            top: 720 - 190,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 35%, #0F3A22, ${M.bg} 75%)`,
            border: `5px solid ${M.glow}`,
            boxShadow: `0 0 80px rgba(34,197,94,0.55), inset 0 0 50px rgba(34,197,94,0.25)`,
            transform: `scale(${0.6 + 0.4 * badge})`,
            opacity: badge,
            filter: `blur(${(1 - badge) * 14}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={240} height={240} viewBox="-100 -100 200 200">
            <g transform={`rotate(${Math.sin(f * 0.08) * 6})`}>
              <path d={LEAF} fill={M.green} stroke="#fff" strokeWidth={6} />
              <path d="M 0 60 Q 20 0 60 -60" stroke={M.mint} strokeWidth={6} fill="none" />
            </g>
          </svg>
        </div>
      )}
      <div
        dir="rtl"
        style={{
          position: "absolute",
          top: 960,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 22,
          fontFamily: LOGO_FONT,
          fontSize: 150,
          lineHeight: 1.3,
          opacity: tw(f, 34, 48),
          filter: `blur(${(1 - tw(f, 34, 48)) * 16}px)`,
        }}
      >
        <span style={{ color: M.red, textShadow: "0 0 36px rgba(220,38,38,0.5)" }}>{TEXTS.logoAlfa}</span>
        <span style={{ color: M.glow, textShadow: "0 0 36px rgba(34,197,94,0.5)" }}>{TEXTS.logoMarket}</span>
      </div>
      <AbsoluteFill style={{ top: 1200 }}>
        <BlurText text={T.welcome} frame={f} at={48} size={74} color={M.text} />
      </AbsoluteFill>
      {lines.length > 0 && (
        <div dir="rtl" style={{ position: "absolute", top: 1420, left: 120, right: 120, display: "flex", flexDirection: "column", gap: 16, opacity: tw(f, 64, 80), fontFamily: FONT, fontWeight: 700, fontSize: 40, color: M.muted }}>
          {lines.map((l) => (
            <div key={l.k} style={{ display: "flex", alignItems: "center", gap: 18, justifyContent: "center", color: M.text }}>
              <span style={{ color: M.mint }}><Icon name={l.k} size={44} /></span>
              {l.t}
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

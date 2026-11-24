import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, STORE_INFO, TEXTS, TRANSITION_FRAMES } from "../constants";
import { bouncy, ci, pop, wave } from "../anim";
import { CartoonBackground, Sparkle } from "../components/cartoon/Background";
import { Storefront } from "../components/cartoon/Storefront";
import { AlfaLogo } from "../components/cartoon/Logo";
import { Ribbon } from "../components/cartoon/Banners";
import { Confetti } from "../components/cartoon/Confetti";

const InfoIcon: React.FC<{ kind: "pin" | "clock" | "phone" }> = ({ kind }) => (
  <svg width={56} height={56} viewBox="-30 -30 60 60">
    <circle r={28} fill={kind === "clock" ? COLORS.green : COLORS.red} />
    {kind === "pin" && <path d="M 0 16 C -6 6 -14 0 -14 -6 A 14 14 0 1 1 14 -6 C 14 0 6 6 0 16 Z M 0 -1 A 5 5 0 1 0 0 -11 A 5 5 0 1 0 0 -1 Z" fill="#fff" fillRule="evenodd" />}
    {kind === "clock" && (
      <g stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none">
        <circle r={15} />
        <path d="M 0 -9 L 0 0 L 7 4" />
      </g>
    )}
    {kind === "phone" && <path d="M -12 -14 L -5 -16 L -1 -6 L -6 -2 Q -1 8 6 11 L 10 6 L 18 10 L 15 17 Q -16 14 -12 -14 Z" fill="#fff" />}
  </svg>
);

/** Scene 5 – doors open, logo, ribbon, confetti and the branch info strip. */
export const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = frame - TRANSITION_FRAMES;

  const buildingIn = pop(frame, fps, 0, { damping: 14, stiffness: 80 });
  const doorOpen = ci(v, [8, 40], [0, 1]);
  const alfa = bouncy(frame, fps, 8);
  const market = bouncy(frame, fps, 16);
  const leaf = pop(frame, fps, 26, { damping: 6 });
  const breathe = 1 + wave(frame, 0.1, 0.02);
  const ribbon = pop(frame, fps, 30, { damping: 9 });
  const info = pop(frame, fps, 50, { damping: 14 });
  const lines = [
    { kind: "pin" as const, text: STORE_INFO.location },
    { kind: "clock" as const, text: STORE_INFO.hours },
    { kind: "phone" as const, text: STORE_INFO.phone },
  ].filter((l) => l.text.trim().length > 0);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <CartoonBackground frame={frame} clouds={false} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540 470) rotate(${frame * 0.5})`} opacity={0.5}>
          {Array.from({ length: 16 }).map((_, i) => (
            <path key={i} d="M 0 0 L -70 -1100 L 70 -1100 Z" fill={i % 2 ? "#FDE68A" : "#FEF3C7"} transform={`rotate(${i * 22.5})`} />
          ))}
        </g>
        <rect x={0} y={1780} width={1080} height={140} fill="#E7D3B3" />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 900, transform: `translateY(${(1 - buildingIn) * 900}px)` }}>
        <Storefront frame={frame} width={1080} height={972} doorOpen={doorOpen} lamps={1} showSign />
        {/* warm welcome glow from the open doors */}
        <div
          style={{
            position: "absolute",
            left: 540 - 200,
            top: 560,
            width: 400,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(254,249,195,0.95), rgba(254,249,195,0))",
            opacity: doorOpen * (0.8 + wave(frame, 0.2, 0.2)),
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 250,
          width: 960,
          transform: `scale(${breathe})`,
          filter: "drop-shadow(0 14px 0 rgba(43,33,24,0.18))",
        }}
      >
        <AlfaLogo frame={frame} alfa={alfa} market={market} leaf={leaf} width={960} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 660,
          transform: `scale(${ribbon}) rotate(${(1 - ribbon) * -10}deg)`,
        }}
      >
        <Ribbon text={TEXTS.welcome} frame={frame} width={960} fontSize={76} />
      </div>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Confetti frame={frame} start={28} count={46} seed="outro" />
        <Sparkle x={110} y={300} size={26 + wave(frame, 0.3, 8)} />
        <Sparkle x={980} y={560} size={22 + wave(frame, 0.3, 7, 2)} color="#fff" />
      </svg>
      {lines.length > 0 && (
        <div
          dir="rtl"
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            bottom: 40,
            transform: `translateY(${(1 - info) * 300}px)`,
            background: "#fff",
            border: `7px solid ${COLORS.outline}`,
            borderRadius: 36,
            boxShadow: `0 10px 0 ${COLORS.green}`,
            padding: "22px 34px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontFamily: "Cairo, sans-serif",
            fontWeight: 700,
            fontSize: 40,
            color: COLORS.outline,
          }}
        >
          {lines.map((l) => (
            <div key={l.kind} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <InfoIcon kind={l.kind} />
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

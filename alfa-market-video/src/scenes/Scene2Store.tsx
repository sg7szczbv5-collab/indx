import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTS, TRANSITION_FRAMES } from "../constants";
import { bouncy, ci, pop, wave } from "../anim";
import { Cloud, Sparkle, Sun } from "../components/cartoon/Background";
import { Storefront } from "../components/cartoon/Storefront";
import { AlfaLogo } from "../components/cartoon/Logo";
import { HangingSign } from "../components/cartoon/Banners";

/** Scene 2 – starburst reveal, the Alfa Market storefront rises, logo drops in. */
export const Scene2Store: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = frame - TRANSITION_FRAMES; // voice-aligned frame

  const rise = pop(frame, fps, 2, { damping: 12, stiffness: 90 });
  const lamps = ci(v, [10, 25], [0, 1]);
  const alfa = bouncy(frame, fps, 26);
  const market = bouncy(frame, fps, 36);
  const leaf = pop(frame, fps, 52, { damping: 6 });
  const signDrop = pop(v, fps, 99, { damping: 13, stiffness: 70 });
  const st = v - 99;
  const swing = st < 0 ? 0 : 16 * Math.exp(-st / 28) * Math.cos(st * 0.17) + wave(frame, 0.07, 1.5);
  const doorOpen = ci(v, [190, 225], [0, 0.55]);
  const zoom = ci(frame, [0, 320], [1, 1.06]);
  const landed = frame > 46;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 60%" }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="s2sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7DD3FC" />
              <stop offset="0.6" stopColor="#E0F2FE" />
              <stop offset="1" stopColor={COLORS.cream} />
            </linearGradient>
          </defs>
          <rect width={1080} height={1920} fill="url(#s2sky)" />
          <Sun x={140} y={150} frame={frame} r={70} />
          <Cloud x={((frame * 1.2) % 1300) - 260} y={680} s={0.7} />
          <Cloud x={760 - ((frame * 0.8) % 1300)} y={250} s={0.55} />
          <rect x={0} y={1640} width={1080} height={280} fill="#E7D3B3" />
          <path d="M 0 1640 L 1080 1640" stroke={COLORS.outline} strokeWidth={6} />
        </svg>
        <div style={{ position: "absolute", left: 40, top: 760, transform: `translateY(${(1 - rise) * 1100}px)` }}>
          <Storefront frame={frame} width={1000} height={900} lamps={lamps} doorOpen={doorOpen} showSign={false} />
        </div>
        <div style={{ position: "absolute", left: 110, top: 905, width: 860 }}>
          <AlfaLogo frame={frame} alfa={alfa} market={market} leaf={leaf} width={860} />
        </div>
        {landed && (
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
            <g opacity={ci(frame, [46, 52, 75, 90], [0, 1, 1, 0])}>
              {[
                [140, 900],
                [960, 930],
                [520, 860],
                [180, 1220],
                [930, 1210],
              ].map(([x, y], i) => (
                <Sparkle key={i} x={x} y={y - (frame - 46) * 1.2} size={24 + wave(frame, 0.4, 8, i)} color={i % 2 ? "#fff" : COLORS.yellow} />
              ))}
            </g>
            {doorOpen > 0 && (
              <g opacity={doorOpen * 1.6}>
                <Sparkle x={540} y={1430} size={30 + wave(frame, 0.3, 8)} color="#fff" />
              </g>
            )}
          </svg>
        )}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 100, top: 330 }}>
        <HangingSign text={TEXTS.oneStop} swing={swing} drop={signDrop} width={880} />
      </div>
    </AbsoluteFill>
  );
};

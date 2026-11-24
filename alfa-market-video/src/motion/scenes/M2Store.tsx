import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION_TEXTS as T, TEXTS } from "../../constants";
import { LOGO_FONT, M, tw, keys, out, inOut, inn } from "../theme";
import { DirBlur, GlowDot, Pill, Stage } from "../primitives";
import { Icon } from "../icons";
import { whip } from "../camera";
import { LineStore } from "../LineStore";

/** The leaf mark as a stroke/fill path, centred on 0,0 (~120 tall). */
const LEAF = "M 0 60 Q -80 10 -20 -60 Q 20 -90 70 -70 Q 80 0 0 60 Z";

/** 2 – reveal of the brand: drawn circle, logo, morph to leaf → pill → line-art storefront. */
export const M2Store: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cam = whip(f, durationInFrames, { enter: false });

  // green gradient wash sweeping up (the reference's blue flash)
  const washY = tw(f, 0, 18, 0, -1920, inOut);

  const circle = tw(f, 8, 34, 0, 1, inOut);
  const logoIn = tw(f, 14, 30, 0, 1, out);
  const toLeaf = tw(f, 70, 86, 0, 1, inOut);
  const leafToDot = tw(f, 90, 100, 0, 1, inn);
  const logoY = keys(f, [[70, 800], [92, 300]], inOut);
  const logoScale = keys(f, [[70, 1], [92, 0.62]], inOut);
  const pillAppear = tw(f, 100, 116, 0, 1, out);
  const pillY = keys(f, [[100, 800], [150, 800], [168, 610]], inOut);
  const storeDraw = tw(f, 150, 230, 0, 1, inOut);
  const storeFill = tw(f, 225, 255, 0, 1, out);

  const orbit = (i: number) => {
    const a = f * 0.05 + (i / 6) * Math.PI * 2;
    const r = 330 + Math.sin(f * 0.08 + i) * 16;
    return { x: 540 + Math.cos(a) * r, y: 800 + Math.sin(a) * r * 0.95 };
  };

  return (
    <AbsoluteFill>
      <Stage frame={f} dome={0} />
      <DirBlur y={cam.v * 0.5} style={{ transform: `translateY(${cam.y}px)` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* drawn circle + orbiting particles */}
          {f < 96 && (
            <g opacity={1 - toLeaf}>
              <circle
                cx={540}
                cy={800}
                r={320}
                fill="none"
                stroke={M.glow}
                strokeWidth={6}
                pathLength={1}
                strokeDasharray={`${circle} 1`}
                transform="rotate(-90 540 800)"
                style={{ filter: "drop-shadow(0 0 18px rgba(34,197,94,0.8))" }}
              />
              {Array.from({ length: 6 }).map((_, i) => {
                const o = orbit(i);
                return <GlowDot key={i} x={o.x} y={o.y} r={4} o={circle} />;
              })}
            </g>
          )}
          {/* morph: leaf grows from the circle, then collapses into a dot */}
          {toLeaf > 0 && leafToDot < 1 && (
            <g transform={`translate(540 800) scale(${(0.4 + toLeaf * 1.6) * (1 - leafToDot)}) rotate(${(1 - toLeaf) * -40})`}>
              <path d={LEAF} fill={M.green} opacity={0.25} />
              <path d={LEAF} fill="none" stroke={M.mint} strokeWidth={4} style={{ filter: "drop-shadow(0 0 12px rgba(74,222,128,0.9))" }} />
              <path d="M 0 60 Q 20 0 60 -60" stroke={M.mint} strokeWidth={3} fill="none" />
            </g>
          )}
          {leafToDot > 0.6 && pillAppear < 0.3 && <GlowDot x={540} y={800} r={9} />}
        </svg>
        {/* logo */}
        <div
          dir="rtl"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: logoY - 120,
            display: "flex",
            justifyContent: "center",
            gap: 26,
            fontFamily: LOGO_FONT,
            fontSize: 180,
            lineHeight: 1.3,
            transform: `scale(${logoScale})`,
            opacity: logoIn,
            filter: `blur(${(1 - logoIn) * 20}px)`,
          }}
        >
          <span style={{ color: M.red, textShadow: "0 0 40px rgba(220,38,38,0.55)" }}>{TEXTS.logoAlfa}</span>
          <span style={{ color: M.glow, textShadow: "0 0 40px rgba(34,197,94,0.55)" }}>{TEXTS.logoMarket}</span>
        </div>
        <Pill
          cx={540}
          cy={pillY}
          title={T.oneStopTitle}
          sub={T.oneStopSub}
          icon={<Icon name="basket" size={50} />}
          appear={pillAppear}
          fill={tw(f, 100, 106) * (1 - tw(f, 124, 146))}
          text={tw(f, 112, 126)}
          w={760}
          h={170}
        />
        <div style={{ position: "absolute", left: 90, top: 900, width: 900, height: 810 }}>
          <LineStore draw={storeDraw} fill={storeFill} frame={f} />
        </div>
      </DirBlur>
      {/* gradient wash */}
      {washY > -1920 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: washY,
            height: 1920,
            background: `linear-gradient(180deg, #16A34A 0%, #0B5E2B 55%, ${M.bg} 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

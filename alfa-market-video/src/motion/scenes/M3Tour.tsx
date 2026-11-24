import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION_TEXTS as T, TOUR_PHASES } from "../../constants";
import { M, tw, keys, out, inOut, inn } from "../theme";
import { DirBlur, GlowDot, Pill, Stage, Thread, flash } from "../primitives";
import { Icon } from "../icons";
import { IconCard } from "../IconCard";
import { whip } from "../camera";

const V = TOUR_PHASES.variety;
const P = TOUR_PHASES.prices;
const GAP = 560;

/**
 * 3 – the aisle tour as a growing chain of pills (camera follows the newest),
 * then a dot bursts into a white stage for prices & offers.
 */
export const M3Tour: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = whip(f, durationInFrames, { exit: false });

  // ---------- dark part: chain ----------
  const camFn = (x: number) => keys(x, [[V - 2, 0], [V + 12, GAP]], inOut);
  const camY = camFn(f);
  const camV = camFn(f) - camFn(f - 1);
  const p1 = { x: 560, y: 760 };
  const p2 = { x: 520, y: 760 - GAP };

  // collapse to a dot, then the white circle burst
  const collapse = tw(f, P - 14, P - 4, 0, 1, inn);
  const burst = tw(f, P - 2, P + 14, 0, 1, out);
  const light = f >= P + 2;

  // ---------- light part ----------
  const lf = f - P;
  const lcamFn = (x: number) => keys(x, [[40, 0], [54, GAP]], inOut);
  const lcam = lcamFn(lf);
  const lcamV = lcamFn(lf) - lcamFn(lf - 1);
  const q1 = { x: 540, y: 820 };
  const q2 = { x: 560, y: 820 - GAP };

  const dark = (
    <AbsoluteFill>
      <Stage frame={f} dome={0.15} />
      <DirBlur
        y={camV * 0.6 + enter.v * 0.5}
        style={{
          transform: `translateY(${enter.y + camY}px) scale(${1 - collapse})`,
          transformOrigin: "50% 40%",
          opacity: 1 - collapse * 0.6,
        }}
      >
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Thread a={{ x: p1.x, y: 1950 }} b={{ x: p1.x + 180, y: p1.y + 75 }} p={tw(f, 0, 20, 0, 1, inOut)} bend={140} />
          <Thread a={{ x: p1.x - 200, y: p1.y - 75 }} b={{ x: p2.x + 200, y: p2.y + 75 }} p={tw(f, V, V + 16, 0, 1, inOut)} bend={-160} />
        </svg>
        <Pill
          cx={p1.x}
          cy={p1.y}
          title={T.fresh.title}
          sub={T.fresh.sub}
          icon={<Icon name="leaf" size={48} />}
          appear={tw(f, 4, 18, 0, 1, out)}
          fill={flash(f, 6)}
          text={tw(f, 14, 26)}
          w={600}
          h={160}
        />
        {(["apple", "carrot", "lettuce"] as const).map((ic, i) => (
          <IconCard key={ic} x={p1.x - 180 + i * 180} y={p1.y + 240} icon={ic} p={tw(f, 24 + i * 6, 38 + i * 6, 0, 1, out)} active={flash(f, 34 + i * 6)} />
        ))}
        <Pill
          cx={p2.x}
          cy={p2.y}
          title={T.variety.title}
          sub={T.variety.sub}
          icon={<Icon name="basket" size={48} />}
          appear={tw(f, V + 6, V + 20, 0, 1, out)}
          fill={flash(f, V + 10)}
          text={tw(f, V + 16, V + 28)}
          w={800}
          h={160}
          tone="green"
        />
        {(["bottle", "can", "spray"] as const).map((ic, i) => (
          <IconCard key={ic} x={p2.x - 180 + i * 180} y={p2.y + 240} icon={ic} p={tw(f, V + 30 + i * 8, V + 44 + i * 8, 0, 1, out)} active={flash(f, V + 40 + i * 8)} />
        ))}
      </DirBlur>
      {collapse > 0 && <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><GlowDot x={540} y={760} r={10 + collapse * 6} /></svg>}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill>
      {!light && dark}
      {burst > 0 && (
        <AbsoluteFill style={{ clipPath: `circle(${burst * 1250}px at 50% 39.6%)` }}>
          <Stage frame={f} light />
          <DirBlur y={lcamV * 0.6} style={{ transform: `translateY(${lcam}px)` }}>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <Thread a={{ x: q1.x - 120, y: 1950 }} b={{ x: q1.x + 150, y: q1.y + 80 }} p={tw(lf, 10, 30, 0, 1, inOut)} bend={-120} color="rgba(10,26,17,0.25)" />
              <Thread a={{ x: q1.x - 200, y: q1.y - 80 }} b={{ x: q2.x + 200, y: q2.y + 80 }} p={tw(lf, 40, 56, 0, 1, inOut)} bend={-160} color="rgba(10,26,17,0.25)" />
            </svg>
            <Pill
              cx={q1.x}
              cy={q1.y}
              title={T.prices.title}
              sub={T.prices.sub}
              icon={<Icon name="tag" size={48} />}
              appear={tw(lf, 6, 20, 0, 1, out)}
              fill={flash(lf, 8)}
              text={tw(lf, 16, 28)}
              w={680}
              h={160}
              tone="red"
              onLight
            />
            <Pill
              cx={q2.x}
              cy={q2.y}
              title={T.offers.title}
              sub={T.offers.sub}
              icon={<Icon name="percent" size={48} />}
              appear={tw(lf, 46, 60, 0, 1, out)}
              fill={flash(lf, 50)}
              text={tw(lf, 56, 68)}
              w={640}
              h={160}
              tone="red"
              onLight
            />
            {[0, 1, 2].map((i) => (
              <IconCard
                key={i}
                x={q2.x - 180 + i * 180}
                y={q2.y + 240}
                icon={i === 1 ? "percent" : "tag"}
                p={tw(lf, 70 + i * 7, 84 + i * 7, 0, 1, out)}
                active={flash(lf, 80 + i * 7)}
                onLight
                tone="red"
              />
            ))}
          </DirBlur>
        </AbsoluteFill>
      )}
      {burst > 0 && burst < 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={540} cy={760} r={burst * 1250} fill="none" stroke={M.mint} strokeWidth={14 * (1 - burst)} opacity={0.8} />
          <circle cx={540} cy={760} r={Math.max(0, burst * 1250 - 120)} fill="none" stroke="#A7F3D0" strokeWidth={4} opacity={0.6 * (1 - burst)} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTS, TOUR_PHASES, TRANSITION_FRAMES } from "../constants";
import { bouncy, ci, isBlinking, pop, squash, wave } from "../anim";
import { ShoppingCart } from "../components/cartoon/ShoppingCart";
import { Apple, Carrot, Lettuce } from "../components/cartoon/Veggies";
import { CannedFood, Detergent, JuiceBox } from "../components/cartoon/Groceries";
import { PercentBadge, PriceTag } from "../components/cartoon/Deals";
import { PillLabel } from "../components/cartoon/Banners";
import { Sparkle } from "../components/cartoon/Background";

const SHELF_W = 360;

/** Parallax supermarket aisle that scrolls past the cart. */
const Aisle: React.FC<{ scroll: number }> = ({ scroll }) => {
  const off = scroll % SHELF_W;
  const colors = [COLORS.red, COLORS.greenLight, "#FACC15", "#38BDF8", COLORS.orange, "#A78BFA"];
  return (
    <g opacity={0.55}>
      {Array.from({ length: 5 }).map((_, i) => {
        const x = i * SHELF_W - SHELF_W + off;
        return (
          <g key={i} transform={`translate(${x} 560)`}>
            <rect x={10} y={0} width={SHELF_W - 20} height={900} rx={18} fill="#FDE7C2" stroke={COLORS.outline} strokeWidth={5} />
            {[200, 420, 640, 860].map((sy, r) => (
              <g key={sy}>
                <rect x={20} y={sy} width={SHELF_W - 40} height={14} fill="#D6A76B" />
                {Array.from({ length: 6 }).map((__, j) => (
                  <rect
                    key={j}
                    x={32 + j * 52}
                    y={sy - 70 - ((j + r) % 2) * 20}
                    width={40}
                    height={70 + ((j + r) % 2) * 20}
                    rx={8}
                    fill={colors[(i + j + r) % colors.length]}
                    stroke={COLORS.outline}
                    strokeWidth={3}
                  />
                ))}
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
};

type Drop = { at: number; x: number; y: number; rot: number; el: (f: number) => React.ReactNode };

const DROPS: Drop[] = [
  { at: TOUR_PHASES.fresh + 6, x: -175, y: -320, rot: -12, el: (f) => <Apple blink={isBlinking(f, 70, 0)} /> },
  { at: TOUR_PHASES.fresh + 20, x: -20, y: -360, rot: 8, el: (f) => <Carrot blink={isBlinking(f, 70, 17)} /> },
  { at: TOUR_PHASES.fresh + 34, x: 130, y: -320, rot: 6, el: (f) => <Lettuce blink={isBlinking(f, 70, 33)} /> },
  { at: TOUR_PHASES.variety + 8, x: -230, y: -440, rot: 10, el: (f) => <JuiceBox blink={isBlinking(f, 70, 9)} /> },
  { at: TOUR_PHASES.variety + 26, x: -60, y: -450, rot: -6, el: (f) => <CannedFood blink={isBlinking(f, 70, 25)} /> },
  { at: TOUR_PHASES.variety + 44, x: 110, y: -470, rot: 8, el: (f) => <Detergent frame={f} blink={isBlinking(f, 70, 41)} /> },
];

const LABELS = [
  { start: TOUR_PHASES.fresh, end: TOUR_PHASES.variety, text: TEXTS.fresh, color: COLORS.green, size: 92 },
  { start: TOUR_PHASES.variety, end: TOUR_PHASES.prices, text: TEXTS.variety, color: "#F59E0B", size: 80 },
  { start: TOUR_PHASES.prices, end: 9999, text: TEXTS.prices, color: COLORS.red, size: 66 },
];

/** Scene 3 – a shopping cart rolls through the aisles, products bounce in. */
export const Scene3Tour: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = frame - TRANSITION_FRAMES;

  const enter = pop(frame, fps, 0, { damping: 15, stiffness: 70 });
  const cartX = 560 + (1 - enter) * 900 + wave(frame, 0.05, 14);
  const scroll = frame * 5;
  const wheel = ((scroll + (1 - enter) * 900) / (2 * Math.PI * 46)) * -360;
  const cartBob = Math.abs(Math.sin(frame * 0.35)) * -6;

  const percent = bouncy(v, fps, TOUR_PHASES.prices + 10);
  const tag = bouncy(v, fps, TOUR_PHASES.prices + 26);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: COLORS.cream }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill={COLORS.cream} />
        <rect x={0} y={0} width={1080} height={460} fill="#DCFCE7" />
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d={`M ${i * 100 - 20} 460 q 50 40 100 0`}
            fill={i % 2 ? COLORS.green : COLORS.red}
            stroke={COLORS.outline}
            strokeWidth={4}
          />
        ))}
        <Aisle scroll={scroll} />
        {/* floor */}
        <rect x={0} y={1680} width={1080} height={240} fill="#F1E4CC" />
        <path d="M 0 1680 L 1080 1680" stroke={COLORS.outline} strokeWidth={6} />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={((i * 160 + scroll) % 1600) - 160} y={1700} width={80} height={200} fill="#E7D3B3" />
        ))}
        {/* speed lines */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${cartX + 380 + ((frame * 9 + i * 60) % 120)} ${1420 + i * 70} l 90 0`}
            stroke={COLORS.outline}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={0.25}
          />
        ))}
        <g transform={`translate(${cartX} ${1740 + cartBob})`}>
          <ShoppingCart wheelRotation={wheel}>
            {DROPS.map((d, i) => {
              const p = bouncy(v, fps, d.at);
              if (p <= 0) return null;
              const y = -1900 + (d.y + 1900) * p;
              const landFrame = d.at + 9;
              const [sx, sy] = squash(v, landFrame, 0.2);
              const spin = (1 - Math.min(1, p)) * 300;
              return (
                <g key={i} transform={`translate(${d.x} ${y}) rotate(${d.rot + spin}) scale(${1.25 * sx} ${1.25 * sy})`}>
                  {d.el(frame)}
                </g>
              );
            })}
          </ShoppingCart>
        </g>
        {/* deals */}
        {percent > 0 && (
          <g transform={`translate(250 ${860 + wave(frame, 0.12, 22)}) scale(${percent * 1.15})`}>
            <PercentBadge frame={frame} />
          </g>
        )}
        {tag > 0 && (
          <g transform={`translate(800 ${900 + wave(frame, 0.12, 18, 2)}) rotate(${wave(frame, 0.1, 10)}) scale(${tag * 1.25})`}>
            <PriceTag blink={isBlinking(frame, 70, 5)} />
          </g>
        )}
        {percent > 0.5 && (
          <g>
            <Sparkle x={130} y={680} size={22 + wave(frame, 0.35, 7)} />
            <Sparkle x={960} y={740} size={20 + wave(frame, 0.35, 7, 2)} color="#fff" />
            <Sparkle x={540} y={1000} size={18 + wave(frame, 0.35, 6, 4)} />
          </g>
        )}
      </svg>
      <AbsoluteFill style={{ top: 180, height: 200, alignItems: "center", justifyContent: "center" }}>
        {LABELS.map((l) => {
          if (v < l.start - 2 || v > l.end + 8) return null;
          const inP = pop(v, fps, l.start);
          const outP = v > l.end ? ci(v, [l.end, l.end + 8], [1, 0]) : 1;
          return (
            <div key={l.text} style={{ position: "absolute" }}>
              <PillLabel
                text={l.text}
                color={l.color}
                scale={inP * outP}
                rot={wave(frame, 0.08, 2) + (1 - inP) * -12}
                fontSize={l.size}
              />
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

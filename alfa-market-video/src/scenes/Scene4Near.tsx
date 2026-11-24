import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTS, TRANSITION_FRAMES } from "../constants";
import { bouncy, ci, easeInOut, pop, squash, wave } from "../anim";
import {
  CartoonClock,
  House,
  MapPin,
  ROAD,
  Tree,
  Van,
  bezier,
  roadPath,
} from "../components/cartoon/NeighborhoodMap";
import { Storefront } from "../components/cartoon/Storefront";
import { CartoonText } from "../components/cartoon/CartoonText";
import { Sparkle } from "../components/cartoon/Background";

/** Scene 4 – cute neighbourhood: home → winding road → Alfa Market, pin + winking clock. */
export const Scene4Near: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = frame - TRANSITION_FRAMES;

  const roadP = ci(frame, [4, 30], [0, 1], easeInOut);
  const t = ci(v, [10, 95], [0, 1], easeInOut);
  const pos = bezier(...ROAD, t);
  const ahead = bezier(...ROAD, Math.min(1, t + 0.01));
  const angle = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI;
  const flip = Math.abs(angle) > 90;
  const arrived = v > 95;

  const storeIn = pop(frame, fps, 6, { damping: 11 });
  const pinDrop = bouncy(frame, fps, 14);
  const hop = frame > 40 ? Math.abs(Math.sin((frame - 40) * 0.16)) * -30 : 0;
  const [sx, sy] = squash(frame, 24, 0.25);
  const clockIn = pop(frame, fps, 24, { damping: 8 });
  const spin = frame < 70 ? frame * 14 : 70 * 14 + (frame - 70) * 1;
  const wink = v >= 70 && v < 88;
  const doorOpen = ci(v, [95, 115], [0, 0.6]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#DCFCE7" />
        <rect width={1080} height={420} fill={COLORS.cream} />
        <path d="M 0 420 Q 270 380 540 420 T 1080 420 L 1080 460 L 0 460 Z" fill="#BBF7D0" stroke={COLORS.outline} strokeWidth={5} />
        {/* grass patches */}
        {[
          [160, 1080, 120],
          [900, 1250, 150],
          [560, 1820, 180],
          [980, 560, 90],
        ].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.5} fill="#BBF7D0" />
        ))}
        {/* road */}
        <path d={roadPath()} stroke={COLORS.outline} strokeWidth={150} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${roadP} 1`} />
        <path d={roadPath()} stroke="#6B7280" strokeWidth={130} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${roadP} 1`} />
        <path
          d={roadPath()}
          stroke="#fff"
          strokeWidth={12}
          fill="none"
          strokeDasharray="36 34"
          strokeDashoffset={-frame * 3}
          opacity={ci(frame, [24, 32], [0, 1])}
        />
        {/* trees & houses */}
        <Tree x={940} y={1530} s={0.9} frame={frame} />
        <Tree x={60} y={1100} s={0.8} frame={frame} />
        <Tree x={420} y={980} s={0.7} frame={frame} />
        <Tree x={1010} y={1060} s={0.75} frame={frame} />
        <House x={130} y={1470} s={0.95} wall="#FDE68A" roof={COLORS.red} frame={frame} />
        <House x={470} y={1790} s={0.85} wall="#FBCFE8" roof={COLORS.green} frame={frame} />
        <House x={850} y={1830} s={0.8} wall="#BAE6FD" roof="#F59E0B" frame={frame} />
        <Tree x={240} y={1860} s={0.8} frame={frame} />
        {/* store at the end of the road */}
        <g transform={`translate(790 ${890}) scale(${storeIn}) translate(-190 -342)`}>
          <Storefront frame={frame} width={380} height={342} doorOpen={doorOpen} />
        </g>
        {/* van */}
        <g transform={`translate(${pos.x} ${pos.y + 10}) rotate(${flip ? angle + 180 : angle}) scale(${flip ? -1.2 : 1.2} 1.2)`}>
          <Van frame={frame} />
        </g>
        {/* pin */}
        <g transform={`translate(790 ${545 + (1 - pinDrop) * -700 + hop})`}>
          <ellipse cx={0} cy={-hop + 8} rx={50 + hop * 0.6} ry={12} fill="#000" opacity={0.15} />
          <g transform="scale(0.78)">
            <MapPin squashX={sx} squashY={sy} />
          </g>
        </g>
        {/* clock */}
        <g transform={`translate(220 ${770 + wave(frame, 0.1, 10)}) scale(${clockIn * 0.95}) rotate(${wave(frame, 0.12, 6)})`}>
          <CartoonClock frame={frame} spin={spin} wink={wink} />
        </g>
        {arrived && (
          <g opacity={ci(v, [95, 100, 140, 150], [0, 1, 1, 0])}>
            {[
              [640, 640],
              [960, 700],
              [700, 900],
              [930, 930],
            ].map(([x, y], i) => (
              <Sparkle key={i} x={x} y={y} size={22 + wave(frame, 0.4, 8, i)} color={i % 2 ? "#fff" : COLORS.yellow} />
            ))}
          </g>
        )}
      </svg>
      <AbsoluteFill style={{ top: 120, height: 220 }}>
        <CartoonText text={TEXTS.near} size={96} delay={TRANSITION_FRAMES} color={COLORS.green} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import { COLORS } from "../../constants";
import { isBlinking } from "../../anim";
import { Face } from "./Face";
import { Leaf } from "./Logo";

const O = COLORS.outline;

export type Pt = { x: number; y: number };

/** Cubic bezier helpers for the winding road. */
export const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

export const ROAD: [Pt, Pt, Pt, Pt] = [
  { x: 250, y: 1560 },
  { x: 1080, y: 1420 },
  { x: -60, y: 1060 },
  { x: 790, y: 880 },
];

export const roadPath = () => {
  const [a, b, c, d] = ROAD;
  return `M ${a.x} ${a.y} C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
};

export const House: React.FC<{ x: number; y: number; s?: number; wall: string; roof: string; frame: number }> = ({
  x,
  y,
  s = 1,
  wall,
  roof,
  frame,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={110} ry={14} fill="#000" opacity={0.1} />
    <rect x={-90} y={-150} width={180} height={150} rx={10} fill={wall} stroke={O} strokeWidth={6} />
    <path d="M -115 -140 L 0 -240 L 115 -140 Z" fill={roof} stroke={O} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-26} y={-80} width={52} height={80} rx={10} fill="#92400E" stroke={O} strokeWidth={5} />
    <circle cx={14} cy={-40} r={4} fill="#FACC15" />
    <rect x={-74} y={-120} width={40} height={40} rx={6} fill={COLORS.sky} stroke={O} strokeWidth={4} />
    <rect x={34} y={-120} width={40} height={40} rx={6} fill={COLORS.sky} stroke={O} strokeWidth={4} />
    <Face x={0} y={-170} scale={0.6} blink={isBlinking(frame, 70, x)} blush={false} />
  </g>
);

export const Tree: React.FC<{ x: number; y: number; s?: number; frame: number }> = ({ x, y, s = 1, frame }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(frame * 0.08 + x) * 3})`}>
    <rect x={-12} y={-70} width={24} height={70} rx={8} fill="#92400E" stroke={O} strokeWidth={5} />
    <circle cx={0} cy={-110} r={58} fill={COLORS.greenLight} stroke={O} strokeWidth={6} />
    <circle cx={-18} cy={-126} r={16} fill="#86EFAC" />
  </g>
);

/** Little green delivery van wearing the Alfa leaf. Origin = ground centre. */
export const Van: React.FC<{ frame: number }> = ({ frame }) => {
  const bounce = Math.abs(Math.sin(frame * 0.5)) * -5;
  return (
    <g transform={`translate(0 ${bounce})`}>
      <path d="M -80 -30 L -80 -100 Q -80 -112 -68 -112 L 30 -112 Q 52 -112 62 -90 L 84 -50 L 84 -30 Z" fill={COLORS.green} stroke={O} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 34 -100 L 52 -100 L 70 -62 L 34 -62 Z" fill={COLORS.sky} stroke={O} strokeWidth={4} />
      <rect x={-66} y={-96} width={86} height={52} rx={8} fill="#fff" stroke={O} strokeWidth={4} />
      <Leaf x={-24} y={-70} s={0.3} />
      <circle cx={-46} cy={-26} r={20} fill="#1F2937" stroke={O} strokeWidth={5} />
      <circle cx={50} cy={-26} r={20} fill="#1F2937" stroke={O} strokeWidth={5} />
      <circle cx={-46} cy={-26} r={7} fill="#E5E7EB" />
      <circle cx={50} cy={-26} r={7} fill="#E5E7EB" />
      <circle cx={82} cy={-46} r={6} fill="#FDE047" stroke={O} strokeWidth={3} />
    </g>
  );
};

/** Big glossy 3D-style map pin. Origin = tip of the pin. */
export const MapPin: React.FC<{ squashX?: number; squashY?: number }> = ({ squashX = 1, squashY = 1 }) => (
  <g transform={`scale(${squashX} ${squashY})`}>
    <defs>
      <radialGradient id="pinGrad" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#F87171" />
        <stop offset="0.55" stopColor={COLORS.red} />
        <stop offset="1" stopColor="#7F1D1D" />
      </radialGradient>
    </defs>
    <path
      d="M 0 0 C -30 -60 -100 -110 -100 -190 A 100 100 0 1 1 100 -190 C 100 -110 30 -60 0 0 Z"
      fill="url(#pinGrad)"
      stroke={O}
      strokeWidth={7}
      strokeLinejoin="round"
    />
    <circle cx={0} cy={-190} r={46} fill="#fff" stroke={O} strokeWidth={6} />
    <Leaf x={0} y={-188} s={0.34} />
    <ellipse cx={-50} cy={-240} rx={16} ry={30} fill="#fff" opacity={0.5} transform="rotate(30 -50 -240)" />
  </g>
);

/** Smiling clock that can wink. Origin = centre. */
export const CartoonClock: React.FC<{ frame: number; spin: number; wink: boolean }> = ({ frame, spin, wink }) => (
  <g>
    <rect x={-60} y={-150} width={30} height={40} rx={8} fill={COLORS.red} stroke={O} strokeWidth={5} transform="rotate(-30 -45 -130)" />
    <rect x={30} y={-150} width={30} height={40} rx={8} fill={COLORS.red} stroke={O} strokeWidth={5} transform="rotate(30 45 -130)" />
    <circle r={125} fill={COLORS.green} stroke={O} strokeWidth={8} />
    <circle r={100} fill="#fff" stroke={O} strokeWidth={5} />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={-3} y={-94} width={6} height={i % 3 === 0 ? 18 : 10} rx={3} fill={O} transform={`rotate(${i * 30})`} />
    ))}
    <g transform="translate(0 20)">
      <Face scale={1.25} wink={wink} blink={!wink && isBlinking(frame, 60, 7)} mouth="smile" />
    </g>
    <rect x={-5} y={-70} width={10} height={70} rx={5} fill={COLORS.red} transform={`rotate(${spin})`} />
    <rect x={-6} y={-48} width={12} height={48} rx={6} fill={O} transform={`rotate(${spin / 12 + 60})`} />
    <circle r={10} fill={O} />
  </g>
);

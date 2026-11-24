import { COLORS } from "../../constants";
import { Face } from "./Face";
import { Sparkle } from "./Background";

const O = COLORS.outline;

export const JuiceBox: React.FC<{ blink?: boolean }> = ({ blink }) => (
  <g>
    <path d="M 14 -64 L 14 -90 L 34 -98" stroke={COLORS.red} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -38 -50 L -26 -68 L 30 -68 L 38 -50 Z" fill="#FDBA74" stroke={O} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-38} y={-50} width={76} height={112} rx={8} fill={COLORS.orange} stroke={O} strokeWidth={5} />
    <rect x={-38} y={-8} width={76} height={50} fill="#FFF7ED" stroke={O} strokeWidth={4} />
    <circle cx={0} cy={17} r={16} fill="#FB923C" stroke={O} strokeWidth={3.5} />
    <path d="M 2 1 Q 10 -8 16 -2 Q 8 6 2 1 Z" fill={COLORS.greenLight} stroke={O} strokeWidth={2.5} />
    <rect x={-30} y={-44} width={10} height={30} rx={5} fill="#fff" opacity={0.45} />
    <Face y={-32} scale={0.72} blink={blink} eyeGap={13} />
  </g>
);

export const CannedFood: React.FC<{ blink?: boolean }> = ({ blink }) => (
  <g>
    <rect x={-42} y={-48} width={84} height={100} fill={COLORS.red} stroke={O} strokeWidth={5} />
    <ellipse cx={0} cy={52} rx={42} ry={11} fill={COLORS.redDark} stroke={O} strokeWidth={5} />
    <rect x={-42} y={-14} width={84} height={40} fill="#fff" stroke={O} strokeWidth={4} />
    <path d="M -14 6 Q 0 -14 14 6 Q 0 18 -14 6 Z" fill={COLORS.greenLight} stroke={O} strokeWidth={3} />
    <ellipse cx={0} cy={-48} rx={42} ry={12} fill="#E5E7EB" stroke={O} strokeWidth={5} />
    <ellipse cx={0} cy={-48} rx={30} ry={7} fill="#CBD5E1" />
    <rect x={-32} y={-38} width={9} height={84} fill="#fff" opacity={0.35} />
    <Face y={-30} scale={0.6} blink={blink} eyeGap={13} blush={false} />
  </g>
);

export const Detergent: React.FC<{ frame: number; blink?: boolean }> = ({ frame, blink }) => {
  const tw = (p: number) => 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.18 + p));
  return (
    <g>
      <rect x={-14} y={-92} width={30} height={22} rx={5} fill={COLORS.red} stroke={O} strokeWidth={4.5} />
      <path
        d="M -40 -40 Q -40 -72 -14 -72 L 16 -72 Q 44 -72 44 -40 L 44 58 Q 44 68 34 68 L -30 68 Q -40 68 -40 58 Z"
        fill="#38BDF8"
        stroke={O}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path d="M 18 -60 Q 34 -60 34 -42 L 34 -26 Q 20 -26 20 -40 Z" fill="#E0F2FE" stroke={O} strokeWidth={3.5} />
      <rect x={-32} y={-6} width={66} height={50} rx={10} fill="#fff" stroke={O} strokeWidth={4} />
      <circle cx={-12} cy={14} r={9} fill="#BAE6FD" stroke={O} strokeWidth={2.5} />
      <circle cx={8} cy={24} r={6} fill="#BAE6FD" stroke={O} strokeWidth={2.5} />
      <circle cx={16} cy={8} r={5} fill="#BAE6FD" stroke={O} strokeWidth={2.5} />
      <rect x={-32} y={-60} width={9} height={46} rx={4.5} fill="#fff" opacity={0.6} />
      <Face y={-38} scale={0.62} blink={blink} eyeGap={13} />
      <g transform={`scale(${tw(0)})`}>
        <Sparkle x={-62} y={-70} size={16} color="#fff" />
      </g>
      <g opacity={tw(2)}>
        <Sparkle x={62} y={-30} size={13} color="#FDE047" />
        <Sparkle x={58} y={50} size={10} color="#fff" />
      </g>
    </g>
  );
};

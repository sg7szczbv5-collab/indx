import { COLORS } from "../../constants";
import { Face } from "./Face";

const O = COLORS.outline;

export const CoffeeCup: React.FC<{ frame: number; blink?: boolean }> = ({ frame, blink }) => {
  const steam = (dx: number, phase: number) => {
    const t = ((frame + phase) % 40) / 40;
    return (
      <path
        d={`M ${dx} -60 q -10 -14 0 -28 q 10 -14 0 -28`}
        stroke="#94A3B8"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
        opacity={Math.sin(t * Math.PI) * 0.9}
        transform={`translate(0 ${-t * 22})`}
      />
    );
  };
  return (
    <g>
      {steam(-18, 0)}
      {steam(2, 13)}
      {steam(22, 26)}
      <path d="M 44 -24 Q 76 -24 74 4 Q 72 30 40 28" stroke={O} strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d="M 44 -24 Q 76 -24 74 4 Q 72 30 40 28" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M -50 -48 L 50 -48 L 42 46 Q 40 58 26 58 L -26 58 Q -40 58 -42 46 Z" fill="#fff" stroke={O} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={0} cy={-48} rx={50} ry={10} fill="#92400E" stroke={O} strokeWidth={5} />
      <rect x={-48} y={18} width={92} height={14} fill={COLORS.green} />
      <Face y={-10} scale={0.85} blink={blink} />
    </g>
  );
};

export const Bread: React.FC<{ blink?: boolean }> = ({ blink }) => (
  <g>
    <path
      d="M -70 40 L -70 -6 Q -86 -50 -40 -56 Q 0 -78 40 -56 Q 86 -50 70 -6 L 70 40 Q 70 50 60 50 L -60 50 Q -70 50 -70 40 Z"
      fill="#F59E0B"
      stroke={O}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <path d="M -58 -18 Q -66 -44 -34 -46 Q 0 -64 34 -46 Q 66 -44 58 -18 Z" fill="#FCD34D" opacity={0.85} />
    <path d="M -34 -44 L -24 -30 M -4 -52 L 6 -38 M 26 -46 L 36 -32" stroke="#B45309" strokeWidth={5} strokeLinecap="round" />
    <Face y={6} scale={0.9} blink={blink} />
  </g>
);

export const MilkCarton: React.FC<{ blink?: boolean }> = ({ blink }) => (
  <g>
    <path d="M -40 -50 L -40 -66 L 0 -96 L 40 -66 L 40 -50 Z" fill="#fff" stroke={O} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-12} y={-108} width={24} height={14} rx={3} fill="#3B82F6" stroke={O} strokeWidth={4} />
    <rect x={-40} y={-50} width={80} height={120} rx={6} fill="#fff" stroke={O} strokeWidth={5} />
    <path d="M -40 30 Q -20 18 0 30 Q 20 42 40 30 L 40 64 Q 40 70 34 70 L -34 70 Q -40 70 -40 64 Z" fill="#3B82F6" stroke={O} strokeWidth={4} />
    <path d="M 0 36 Q -10 50 0 58 Q 10 50 0 36 Z" fill="#fff" />
    <Face y={-12} scale={0.8} blink={blink} />
  </g>
);

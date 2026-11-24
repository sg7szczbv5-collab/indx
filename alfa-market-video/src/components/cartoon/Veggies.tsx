import { COLORS } from "../../constants";
import { Face } from "./Face";

const O = COLORS.outline;
type P = { blink?: boolean };

/** All produce items are drawn centred on (0,0), roughly 130 units tall. */
export const Apple: React.FC<P> = ({ blink }) => (
  <g>
    <path
      d="M0 -38 C -30 -60 -68 -30 -62 6 C -56 42 -28 64 0 52 C 28 64 56 42 62 6 C 68 -30 30 -60 0 -38 Z"
      fill={COLORS.red}
      stroke={O}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <ellipse cx={-34} cy={-12} rx={9} ry={17} fill="#fff" opacity={0.55} transform="rotate(-20 -34 -12)" />
    <path d="M0 -38 Q 2 -56 9 -66" stroke="#78350F" strokeWidth={7} strokeLinecap="round" fill="none" />
    <path d="M7 -55 Q 30 -78 48 -58 Q 26 -42 7 -55 Z" fill={COLORS.greenLight} stroke={O} strokeWidth={4} strokeLinejoin="round" />
    <Face y={6} scale={0.9} blink={blink} />
  </g>
);

export const Carrot: React.FC<P> = ({ blink }) => (
  <g transform="rotate(-20)">
    <path d="M -4 -58 Q -26 -88 -16 -96 Q -2 -84 0 -60" fill={COLORS.greenLight} stroke={O} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 4 -58 Q 26 -90 16 -98 Q 0 -86 -2 -60" fill={COLORS.green} stroke={O} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 0 -58 Q -6 -100 6 -106 Q 12 -90 4 -58" fill={COLORS.greenLight} stroke={O} strokeWidth={4} strokeLinejoin="round" />
    <path
      d="M -30 -56 Q 0 -66 30 -56 Q 22 10 0 70 Q -22 10 -30 -56 Z"
      fill={COLORS.orange}
      stroke={O}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <path d="M -20 -20 L -8 -20 M 10 0 L 20 0 M -14 24 L -4 24" stroke="#C2410C" strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={-14} cy={-38} rx={5} ry={12} fill="#fff" opacity={0.5} />
    <Face y={-30} scale={0.7} blink={blink} eyeGap={13} />
  </g>
);

export const Lettuce: React.FC<P> = ({ blink }) => {
  const outer = [
    [-46, -6, 34],
    [-24, -40, 34],
    [18, -44, 34],
    [46, -10, 34],
    [34, 30, 32],
    [-34, 30, 32],
    [0, 40, 32],
  ];
  return (
    <g>
      {outer.map(([x, y, r], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={r + 5} fill={O} />
      ))}
      {outer.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? COLORS.greenLight : "#4ADE80"} />
      ))}
      <circle cx={0} cy={0} r={44} fill="#86EFAC" stroke={O} strokeWidth={4} />
      <path d="M 0 40 L 0 -30 M 0 10 L -22 -12 M 0 0 L 22 -20" stroke="#16A34A" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.6} />
      <Face y={-2} scale={0.85} blink={blink} />
    </g>
  );
};

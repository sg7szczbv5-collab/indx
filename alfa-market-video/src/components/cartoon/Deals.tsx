import { COLORS, TEXTS } from "../../constants";
import { Face } from "./Face";

const O = COLORS.outline;

export const PriceTag: React.FC<{ blink?: boolean }> = ({ blink }) => (
  <g>
    <path
      d="M -110 0 L -60 -62 L 110 -62 Q 122 -62 122 -50 L 122 50 Q 122 62 110 62 L -60 62 Z"
      fill="#FDE047"
      stroke={O}
      strokeWidth={6}
      strokeLinejoin="round"
    />
    <circle cx={-62} cy={0} r={13} fill={COLORS.cream} stroke={O} strokeWidth={5} />
    <text
      x={34}
      y={20}
      textAnchor="middle"
      direction="rtl"
      fontFamily="Lalezar, Cairo, sans-serif"
      fontSize={64}
      fill={COLORS.red}
    >
      {TEXTS.dealTag}
    </text>
    <path d="M -76 -14 Q -100 -70 -60 -110" stroke={O} strokeWidth={4} fill="none" />
    <Face x={34} y={-36} scale={0.5} blink={blink} blush={false} />
  </g>
);

/** Spiky starburst with a big % – spins and bounces. */
export const PercentBadge: React.FC<{ frame: number }> = ({ frame }) => {
  const pts: string[] = [];
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? 92 : 120;
    const a = (i / (n * 2)) * Math.PI * 2;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  return (
    <g>
      <g transform={`rotate(${frame * 1.2})`}>
        <polygon points={pts.join(" ")} fill={COLORS.red} stroke={O} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <circle r={78} fill="#EF4444" />
      <text
        x={0}
        y={42}
        textAnchor="middle"
        fontFamily="Lalezar, Cairo, sans-serif"
        fontSize={140}
        fill="#fff"
        stroke={O}
        strokeWidth={6}
        paintOrder="stroke"
      >
        %
      </text>
    </g>
  );
};

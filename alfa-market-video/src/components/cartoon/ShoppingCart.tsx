import { COLORS } from "../../constants";
import { Leaf } from "./Logo";

const O = COLORS.outline;

const Wheel: React.FC<{ x: number; rot: number }> = ({ x, rot }) => (
  <g transform={`translate(${x} -46)`}>
    <circle r={46} fill="#1F2937" stroke={O} strokeWidth={6} />
    <circle r={26} fill="#E5E7EB" stroke={O} strokeWidth={4} />
    <g transform={`rotate(${rot})`}>
      {[0, 60, 120].map((a) => (
        <rect key={a} x={-3.5} y={-24} width={7} height={48} rx={3} fill="#9CA3AF" transform={`rotate(${a})`} />
      ))}
    </g>
    <circle r={7} fill={COLORS.red} stroke={O} strokeWidth={3} />
  </g>
);

/**
 * Cartoon shopping cart, drawn as an SVG <g>. Origin = ground under the cart's middle.
 * `children` are rendered *inside* the basket (between back wall and front mesh).
 */
export const ShoppingCart: React.FC<{ wheelRotation: number; children?: React.ReactNode }> = ({
  wheelRotation,
  children,
}) => {
  const basket = "M -310 -420 L 250 -420 L 200 -170 L -250 -170 Z";
  return (
    <g>
      <ellipse cx={-20} cy={6} rx={300} ry={20} fill="#000" opacity={0.12} />
      {/* chassis */}
      <path d="M -240 -170 L -220 -92 L 210 -92 L 240 -170" stroke="#9CA3AF" strokeWidth={16} fill="none" strokeLinejoin="round" />
      <path d="M -240 -170 L -220 -92 L 210 -92 L 240 -170" stroke={O} strokeWidth={4} fill="none" opacity={0.5} />
      {/* handle */}
      <path d="M 230 -320 L 300 -500" stroke="#9CA3AF" strokeWidth={18} strokeLinecap="round" />
      <rect x={270} y={-540} width={110} height={44} rx={22} fill={COLORS.red} stroke={O} strokeWidth={6} transform="rotate(-20 325 -518)" />
      {/* back wall */}
      <path d={basket} fill={COLORS.greenDark} opacity={0.35} />
      {children}
      {/* front mesh */}
      <path d={basket} fill={COLORS.greenPale} opacity={0.28} />
      {Array.from({ length: 11 }).map((_, i) => {
        const t = i / 10;
        const xTop = -310 + t * 560;
        const xBot = -250 + t * 450;
        return <line key={`v${i}`} x1={xTop} y1={-420} x2={xBot} y2={-170} stroke={COLORS.green} strokeWidth={7} />;
      })}
      {[0.33, 0.66].map((t) => (
        <line
          key={t}
          x1={-310 + t * 60}
          y1={-420 + t * 250}
          x2={250 - t * 50}
          y2={-420 + t * 250}
          stroke={COLORS.green}
          strokeWidth={7}
        />
      ))}
      <path d={basket} fill="none" stroke={O} strokeWidth={8} strokeLinejoin="round" />
      <rect x={-322} y={-436} width={584} height={26} rx={13} fill={COLORS.green} stroke={O} strokeWidth={6} />
      {/* brand plaque */}
      <g transform="translate(-30 -296)">
        <rect x={-74} y={-44} width={148} height={88} rx={20} fill="#fff" stroke={O} strokeWidth={6} />
        <Leaf s={0.52} y={6} rot={-10} />
      </g>
      <Wheel x={-205} rot={wheelRotation} />
      <Wheel x={175} rot={wheelRotation} />
    </g>
  );
};

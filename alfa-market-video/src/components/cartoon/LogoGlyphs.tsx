import { COLORS, TEXTS } from "../../constants";
import { Leaf } from "./Logo";

/**
 * In-SVG version of the wordmark (for use inside another <svg>),
 * centred horizontally on (0,0) baseline-ish.
 */
export const AlfaLogoGlyphs: React.FC<{ frame: number; scale?: number; outline?: string }> = ({
  frame,
  scale = 1,
  outline = "#fff",
}) => (
  <g transform={`scale(${scale})`}>
    <text
      x={200}
      y={110}
      textAnchor="middle"
      direction="rtl"
      fontFamily="Lalezar, Cairo, sans-serif"
      fontSize={300}
      fill={COLORS.red}
      stroke={outline}
      strokeWidth={14}
      paintOrder="stroke"
    >
      {TEXTS.logoAlfa}
    </text>
    <text
      x={-255}
      y={110}
      textAnchor="middle"
      direction="rtl"
      fontFamily="Lalezar, Cairo, sans-serif"
      fontSize={210}
      fill={COLORS.green}
      stroke={outline}
      strokeWidth={12}
      paintOrder="stroke"
    >
      {TEXTS.logoMarket}
    </text>
    <Leaf x={190} y={-120} s={0.8} rot={Math.sin(frame * 0.2) * 8} />
  </g>
);

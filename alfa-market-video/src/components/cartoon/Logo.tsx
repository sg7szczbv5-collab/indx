import { COLORS, TEXTS } from "../../constants";

const O = COLORS.outline;

export const Leaf: React.FC<{ x?: number; y?: number; s?: number; rot?: number }> = ({ x = 0, y = 0, s = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 40 Q -6 60 -18 70" stroke={COLORS.greenDark} strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M 0 44 Q -70 0 -10 -60 Q 20 -86 60 -70 Q 72 -10 0 44 Z" fill={COLORS.green} stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
    <path d="M 0 44 Q -70 0 -10 -60 Q 20 -86 60 -70 Q 72 -10 0 44 Z" fill="none" stroke={O} strokeWidth={3} strokeLinejoin="round" opacity={0.35} />
    <path d="M 2 36 Q 18 -10 52 -60" stroke={COLORS.greenLight} strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M -16 -20 Q -2 -22 14 -4 M -6 12 Q 6 4 22 16" stroke="#86EFAC" strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

type Props = {
  /** 0..1 drop-in progress of "ألفا" */
  alfa?: number;
  /** 0..1 drop-in progress of "ماركت" */
  market?: number;
  /** 0..1 leaf pop */
  leaf?: number;
  frame: number;
  width?: number;
  outline?: string;
};

/**
 * Alfa Market wordmark: red "ألفا" + green "ماركت" with a fluttering leaf,
 * inspired by the real storefront sign. Self-contained SVG (1000x380).
 */
export const AlfaLogo: React.FC<Props> = ({ alfa = 1, market = 1, leaf = 1, frame, width = 900, outline = "#fff" }) => {
  const flutter = Math.sin(frame * 0.22) * 10;
  const textStyle = {
    fontFamily: "Lalezar, Cairo, sans-serif",
    paintOrder: "stroke" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={width} viewBox="0 0 1000 380" style={{ overflow: "visible", display: "block" }}>
      <g
        transform={`translate(700 0) translate(0 ${(1 - alfa) * -500}) scale(${0.6 + alfa * 0.4})`}
        opacity={Math.min(1, alfa * 3)}
      >
        <text
          x={0}
          y={300}
          textAnchor="middle"
          direction="rtl"
          fontSize={300}
          fill={COLORS.red}
          stroke={outline}
          strokeWidth={22}
          style={textStyle}
        >
          {TEXTS.logoAlfa}
        </text>
      </g>
      <g
        transform={`translate(245 0) translate(0 ${(1 - market) * -500}) scale(${0.6 + market * 0.4})`}
        opacity={Math.min(1, market * 3)}
      >
        <text
          x={0}
          y={300}
          textAnchor="middle"
          direction="rtl"
          fontSize={210}
          fill={COLORS.green}
          stroke={outline}
          strokeWidth={20}
          style={textStyle}
        >
          {TEXTS.logoMarket}
        </text>
      </g>
      <g transform={`translate(690 70) scale(${leaf})`} opacity={Math.min(1, leaf * 3)}>
        <Leaf rot={flutter} s={0.95} />
      </g>
    </svg>
  );
};

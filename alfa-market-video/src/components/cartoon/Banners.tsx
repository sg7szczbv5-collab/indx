import { COLORS } from "../../constants";

const O = COLORS.outline;

/** Rope-hung wooden-style sign that swings like a pendulum. */
export const HangingSign: React.FC<{
  text: string;
  swing: number;
  drop: number;
  width?: number;
}> = ({ text, swing, drop, width = 880 }) => (
  <div
    style={{
      position: "relative",
      width,
      transformOrigin: "50% -220px",
      transform: `translateY(${(1 - drop) * -700}px) rotate(${swing}deg)`,
    }}
  >
    <svg width={width} height={230} viewBox={`0 0 ${width} 230`} style={{ position: "absolute", top: -220, left: 0 }}>
      <path d={`M ${width * 0.18} 230 L ${width / 2} 0 L ${width * 0.82} 230`} stroke="#92400E" strokeWidth={8} fill="none" />
      <circle cx={width / 2} cy={6} r={14} fill="#9CA3AF" stroke={O} strokeWidth={5} />
    </svg>
    <div
      dir="rtl"
      style={{
        background: COLORS.white,
        border: `8px solid ${O}`,
        borderRadius: 40,
        boxShadow: `0 14px 0 ${COLORS.green}, 0 18px 0 ${O}, 0 30px 40px rgba(0,0,0,0.15)`,
        padding: "24px 30px 18px",
        textAlign: "center",
        fontFamily: "Lalezar, Cairo, sans-serif",
        fontSize: 70,
        lineHeight: 1.25,
        color: COLORS.green,
      }}
    >
      {text}
    </div>
    {[0.18, 0.82].map((p) => (
      <div
        key={p}
        style={{
          position: "absolute",
          top: -10,
          left: width * p - 14,
          width: 28,
          height: 28,
          borderRadius: 14,
          background: COLORS.red,
          border: `5px solid ${O}`,
        }}
      />
    ))}
  </div>
);

/** Waving ribbon banner with folded tails. */
export const Ribbon: React.FC<{
  text: string;
  frame: number;
  width?: number;
  color?: string;
  dark?: string;
  fontSize?: number;
}> = ({ text, frame, width = 960, color = COLORS.red, dark = COLORS.redDark, fontSize = 74 }) => {
  const h = 150;
  const w = width;
  const wv = Math.sin(frame * 0.15) * 10;
  const body = `M 70 ${20 + wv} Q ${w / 2} ${-10 - wv} ${w - 70} ${20 + wv} L ${w - 70} ${h - 10 + wv} Q ${w / 2} ${h - 40 - wv} 70 ${h - 10 + wv} Z`;
  return (
    <div style={{ position: "relative", width: w, height: h + 30 }}>
      <svg width={w} height={h + 30} viewBox={`0 0 ${w} ${h + 30}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={`M 0 ${50 + wv} L 110 ${50 + wv} L 110 ${h + 20 + wv} L 0 ${h + 20 + wv} L 40 ${h / 2 + 35 + wv} Z`} fill={dark} stroke={O} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M ${w} ${50 + wv} L ${w - 110} ${50 + wv} L ${w - 110} ${h + 20 + wv} L ${w} ${h + 20 + wv} L ${w - 40} ${h / 2 + 35 + wv} Z`} fill={dark} stroke={O} strokeWidth={7} strokeLinejoin="round" />
        <path d={body} fill={color} stroke={O} strokeWidth={8} strokeLinejoin="round" />
        <path d={`M 100 ${40 + wv} Q ${w / 2} ${12 - wv} ${w - 100} ${40 + wv}`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.35} strokeLinecap="round" />
      </svg>
      <div
        dir="rtl"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 18,
          fontFamily: "Lalezar, Cairo, sans-serif",
          fontSize,
          color: "#fff",
          textShadow: `0 5px 0 ${dark}`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Rounded pill label used for the tour phases. */
export const PillLabel: React.FC<{ text: string; color: string; scale: number; rot?: number; fontSize?: number }> = ({
  text,
  color,
  scale,
  rot = 0,
  fontSize = 84,
}) => (
  <div
    dir="rtl"
    style={{
      transform: `scale(${scale}) rotate(${rot}deg)`,
      opacity: Math.min(1, scale * 2),
      background: color,
      color: "#fff",
      border: `8px solid ${O}`,
      borderRadius: 999,
      padding: "18px 56px 10px",
      fontFamily: "Lalezar, Cairo, sans-serif",
      fontSize,
      whiteSpace: "nowrap",
      boxShadow: `0 12px 0 ${O}`,
      textShadow: "0 4px 0 rgba(0,0,0,0.2)",
    }}
  >
    {text}
  </div>
);

import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../constants";
import { pop, wave } from "../../anim";

type Props = {
  text: string;
  size?: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
  /** frames between each word popping in */
  stagger?: number;
  font?: "display" | "body";
  style?: React.CSSProperties;
  wiggle?: boolean;
};

/**
 * Bold cartoon headline: thick white outline + soft drop shadow,
 * words pop in one by one (RTL).
 */
export const CartoonText: React.FC<Props> = ({
  text,
  size = 110,
  color = COLORS.green,
  stroke = "#FFFFFF",
  strokeWidth = 18,
  delay = 0,
  stagger = 4,
  font = "display",
  style,
  wiggle = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const family = font === "display" ? "Lalezar, Cairo, sans-serif" : "Cairo, sans-serif";

  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.28,
        rowGap: 0,
        lineHeight: 1.35,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = pop(frame, fps, delay + i * stagger);
        const rot = (1 - p) * (i % 2 ? 14 : -14) + (wiggle ? wave(frame, 0.09, 1.6, i * 1.3) : 0);
        const common: React.CSSProperties = {
          fontFamily: family,
          fontSize: size,
          fontWeight: font === "display" ? 400 : 900,
          whiteSpace: "nowrap",
        };
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              transform: `translateY(${(1 - p) * 60}px) scale(${p}) rotate(${rot}deg)`,
              opacity: Math.min(1, p * 2),
            }}
          >
            <span
              aria-hidden
              style={{
                ...common,
                position: "absolute",
                inset: 0,
                color: stroke,
                WebkitTextStroke: `${strokeWidth}px ${stroke}`,
                filter: `drop-shadow(0 ${size * 0.07}px 0 rgba(43,33,24,0.25))`,
              }}
            >
              {w}
            </span>
            <span style={{ ...common, position: "relative", color }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

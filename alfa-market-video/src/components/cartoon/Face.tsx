import { COLORS } from "../../constants";

export type Mouth = "smile" | "open" | "o" | "flat" | "worried";

type Props = {
  x?: number;
  y?: number;
  scale?: number;
  blink?: boolean;
  wink?: boolean;
  mouth?: Mouth;
  blush?: boolean;
  /** pupil offset, e.g. look up = {dx:0, dy:-3} */
  look?: { dx: number; dy: number };
  eyeGap?: number;
};

/** Reusable cute cartoon face, centred on (x, y), ~60 units wide. */
export const Face: React.FC<Props> = ({
  x = 0,
  y = 0,
  scale = 1,
  blink = false,
  wink = false,
  mouth = "smile",
  blush = true,
  look = { dx: 0, dy: 0 },
  eyeGap = 15,
}) => {
  const ink = COLORS.outline;
  const eye = (cx: number, closed: boolean, isWink: boolean) => {
    if (isWink)
      return (
        <path
          d={`M ${cx - 7} 0 Q ${cx} -8 ${cx + 7} 0`}
          stroke={ink}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      );
    if (closed)
      return (
        <path d={`M ${cx - 6} 0 L ${cx + 6} 0`} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      );
    return (
      <g>
        <ellipse cx={cx + look.dx} cy={look.dy} rx={6} ry={8} fill={ink} />
        <circle cx={cx + look.dx + 2} cy={look.dy - 3} r={2.4} fill="#fff" />
      </g>
    );
  };

  const mouthEl = (() => {
    switch (mouth) {
      case "open":
        return (
          <g>
            <path d="M -12 12 Q 0 34 12 12 Z" fill="#7F1D1D" stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
            <path d="M -6 22 Q 0 18 6 22 Q 0 29 -6 22 Z" fill="#F87171" />
          </g>
        );
      case "o":
        return <ellipse cx={0} cy={19} rx={7} ry={9} fill="#7F1D1D" stroke={ink} strokeWidth={3.5} />;
      case "flat":
        return <path d="M -8 18 L 8 18" stroke={ink} strokeWidth={4} strokeLinecap="round" />;
      case "worried":
        return <path d="M -10 21 Q 0 13 10 21" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
      default:
        return <path d="M -12 13 Q 0 26 12 13" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
  })();

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {blush && (
        <>
          <ellipse cx={-eyeGap - 9} cy={12} rx={7} ry={4.5} fill="#F472B6" opacity={0.45} />
          <ellipse cx={eyeGap + 9} cy={12} rx={7} ry={4.5} fill="#F472B6" opacity={0.45} />
        </>
      )}
      {eye(-eyeGap, blink, false)}
      {eye(eyeGap, blink, wink)}
      {mouthEl}
    </g>
  );
};

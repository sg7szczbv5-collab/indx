import { COLORS } from "../../constants";
import { isBlinking } from "../../anim";

const O = COLORS.outline;

export type Expression = "happy" | "surprised" | "thinking";

type Props = {
  x: number;
  y: number;
  frame: number;
  expression: Expression;
  /** 0 = arm down, 1 = arm reaching out to the left */
  reach: number;
  /** 0..1 – right hand moves up to the chin (thinking pose) */
  chin: number;
  scale?: number;
};

/** Friendly Saudi dad in a thobe and red shemagh. (x,y) = feet centre. */
export const Character: React.FC<Props> = ({ x, y, frame, expression, reach, chin, scale = 1 }) => {
  const bob = Math.sin(frame * 0.12) * 4;
  const blink = isBlinking(frame, 80, 11);
  const leftArmRot = 12 + reach * 68;
  const rightArmRot = -10 - chin * 140;
  const brow = expression === "surprised" ? -10 : expression === "thinking" ? -4 : 0;
  const lookUp = expression === "thinking" ? -5 : 0;
  const lookSide = expression === "thinking" ? -4 : expression === "surprised" ? -3 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={4} rx={170} ry={20} fill="#000" opacity={0.13} />
      <g transform={`translate(0 ${bob})`}>
        {/* feet */}
        <ellipse cx={-50} cy={-8} rx={42} ry={16} fill="#78350F" stroke={O} strokeWidth={5} />
        <ellipse cx={50} cy={-8} rx={42} ry={16} fill="#78350F" stroke={O} strokeWidth={5} />
        {/* left arm (screen-left, reaches the fridge) */}
        <g transform={`translate(-95 -470) rotate(${leftArmRot})`}>
          <rect x={-34} y={0} width={68} height={250} rx={34} fill="#fff" stroke={O} strokeWidth={6} />
          <circle cx={0} cy={262} r={34} fill={COLORS.skin} stroke={O} strokeWidth={6} />
        </g>
        {/* thobe */}
        <path
          d="M -120 -480 Q -150 -470 -160 -300 L -170 -20 Q -170 -10 -158 -10 L 158 -10 Q 170 -10 170 -20 L 160 -300 Q 150 -470 120 -480 Z"
          fill="#fff"
          stroke={O}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        <path d="M 0 -470 L 0 -300" stroke="#E5E7EB" strokeWidth={6} />
        {[-440, -400, -360].map((by) => (
          <circle key={by} cx={0} cy={by} r={6} fill="#E5E7EB" stroke="#94A3B8" strokeWidth={2} />
        ))}
        <path d="M -150 -260 Q 0 -230 150 -260" stroke="#E5E7EB" strokeWidth={5} fill="none" />
        {/* neck */}
        <rect x={-34} y={-520} width={68} height={60} fill={COLORS.skin} stroke={O} strokeWidth={6} />
        {/* shemagh back drape */}
        <path
          d="M -128 -600 Q -150 -480 -140 -440 L -70 -470 L -70 -600 Z M 128 -600 Q 150 -480 140 -440 L 70 -470 L 70 -600 Z"
          fill={COLORS.red}
          stroke={O}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* head */}
        <ellipse cx={0} cy={-610} rx={98} ry={108} fill={COLORS.skin} stroke={O} strokeWidth={7} />
        {/* beard */}
        <path
          d="M -92 -620 Q -96 -520 0 -500 Q 96 -520 92 -620 Q 80 -560 50 -560 Q 0 -548 -50 -560 Q -80 -560 -92 -620 Z"
          fill="#3F2A1E"
        />
        <path d="M -36 -582 Q 0 -600 36 -582 Q 0 -572 -36 -582 Z" fill="#3F2A1E" />
        {/* shemagh top */}
        <path
          d="M -128 -600 Q -140 -720 0 -740 Q 140 -720 128 -600 Q 110 -680 0 -684 Q -110 -680 -128 -600 Z"
          fill={COLORS.red}
          stroke={O}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <path
          d="M -128 -600 Q -140 -720 0 -740 Q 140 -720 128 -600 Q 110 -680 0 -684 Q -110 -680 -128 -600 Z"
          fill="url(#shemaghPattern)"
          opacity={0.7}
        />
        <defs>
          <pattern id="shemaghPattern" width={18} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={18} height={18} fill="none" />
            <rect width={6} height={6} fill="#fff" opacity={0.85} />
          </pattern>
        </defs>
        {/* agal */}
        <ellipse cx={0} cy={-718} rx={104} ry={20} fill="none" stroke="#111827" strokeWidth={14} />
        <ellipse cx={0} cy={-718} rx={104} ry={20} fill="none" stroke="#374151" strokeWidth={4} />
        {/* brows */}
        <path d={`M -58 ${-650 + brow} Q -40 ${-664 + brow} -20 ${-652 + brow}`} stroke="#3F2A1E" strokeWidth={9} strokeLinecap="round" fill="none" />
        <path d={`M 20 ${-652 + brow} Q 40 ${-664 + brow} 58 ${-650 + brow}`} stroke="#3F2A1E" strokeWidth={9} strokeLinecap="round" fill="none" />
        {/* eyes */}
        {blink ? (
          <>
            <path d="M -50 -622 L -26 -622" stroke={O} strokeWidth={6} strokeLinecap="round" />
            <path d="M 26 -622 L 50 -622" stroke={O} strokeWidth={6} strokeLinecap="round" />
          </>
        ) : (
          [-38, 38].map((ex) => (
            <g key={ex}>
              <ellipse cx={ex} cy={-622} rx={expression === "surprised" ? 17 : 14} ry={expression === "surprised" ? 20 : 17} fill="#fff" stroke={O} strokeWidth={4} />
              <circle cx={ex + lookSide} cy={-620 + lookUp} r={8} fill={O} />
              <circle cx={ex + lookSide + 3} cy={-624 + lookUp} r={3} fill="#fff" />
            </g>
          ))
        )}
        {/* nose */}
        <path d="M 0 -612 Q 14 -592 0 -588" stroke="#B9835E" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* mouth */}
        {expression === "surprised" ? (
          <ellipse cx={0} cy={-546} rx={14} ry={18} fill="#7F1D1D" stroke={O} strokeWidth={5} />
        ) : expression === "thinking" ? (
          <path d="M -18 -548 Q 0 -556 20 -544" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
        ) : (
          <path d="M -28 -556 Q 0 -526 28 -556 Z" fill="#7F1D1D" stroke={O} strokeWidth={5} strokeLinejoin="round" />
        )}
        {/* right arm (screen-right) */}
        <g transform={`translate(98 -470) rotate(${rightArmRot})`}>
          <rect x={-34} y={0} width={68} height={250} rx={34} fill="#fff" stroke={O} strokeWidth={6} />
          <circle cx={0} cy={262} r={34} fill={COLORS.skin} stroke={O} strokeWidth={6} />
        </g>
      </g>
    </g>
  );
};

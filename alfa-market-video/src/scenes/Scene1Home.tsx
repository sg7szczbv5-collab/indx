import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TEXTS } from "../constants";
import { ci, easeOut, isBlinking, pop, wave } from "../anim";
import { KitchenBackdrop, Fridge } from "../components/cartoon/Kitchen";
import { Character, type Expression } from "../components/cartoon/Character";
import { ThoughtBubble } from "../components/cartoon/ThoughtBubble";
import { CoffeeCup, Bread, MilkCarton } from "../components/cartoon/Breakfast";
import { CartoonText } from "../components/cartoon/CartoonText";
import { Sparkle } from "../components/cartoon/Background";

/** Scene 1 – empty fridge, thought bubble with coffee / bread / milk. */
export const Scene1Home: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = pop(frame, fps, 0, { damping: 16, stiffness: 90 });
  const charIn = pop(frame, fps, 2, { damping: 13, stiffness: 110 });
  const open = pop(frame, fps, 26, { damping: 11, stiffness: 80 });
  const reach = frame < 70 ? ci(frame, [10, 26], [0, 1], easeOut) : ci(frame, [70, 90], [1, 0.1], easeOut);
  const chin = ci(frame, [92, 112], [0, 1], easeOut);
  const expression: Expression = frame < 40 ? "happy" : frame < 95 ? "surprised" : "thinking";
  const shake = frame >= 40 && frame < 52 ? Math.sin(frame * 2.2) * 6 : 0;

  const bubble = pop(frame, fps, 80, { damping: 9 });
  const tail = [68, 73, 78].map((d) => pop(frame, fps, d));
  const items = [100, 124, 148].map((d) => pop(frame, fps, d, { damping: 7, stiffness: 140 }));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ transform: `scale(${1.1 - 0.1 * intro}) translateX(${shake}px)` }}
      >
        <KitchenBackdrop />
        <Fridge x={90} y={940} open={open} frame={frame} />
        <Character
          x={790 + (1 - charIn) * 500}
          y={1800}
          frame={frame}
          expression={expression}
          reach={reach}
          chin={chin}
        />
        {frame >= 40 && frame < 70 && (
          <g opacity={ci(frame, [40, 46, 62, 70], [0, 1, 1, 0])}>
            <text x={860} y={1030} fontSize={110} fontFamily="Lalezar" fill="#DC2626" stroke="#fff" strokeWidth={10} paintOrder="stroke">
              !?
            </text>
          </g>
        )}
        <ThoughtBubble
          cx={560}
          cy={680}
          w={680}
          h={420}
          scale={bubble}
          tail={[
            { x: 730, y: 1020 },
            { x: 690, y: 960 },
            { x: 640, y: 895 },
          ]}
          tailProgress={tail}
        >
          {[
            { x: 200, el: <CoffeeCup frame={frame} blink={isBlinking(frame, 70, 0)} /> },
            { x: 0, el: <Bread blink={isBlinking(frame, 70, 20)} /> },
            { x: -200, el: <MilkCarton blink={isBlinking(frame, 70, 40)} /> },
          ].map((it, i) => {
            const p = items[i];
            const hop = Math.abs(Math.sin((frame - 100) * 0.16 + i * 1.1)) * -24 * Math.min(1, p);
            return (
              <g key={i} transform={`translate(${it.x} ${20 + hop}) scale(${p * 1.2}) rotate(${(1 - p) * 40 + wave(frame, 0.1, 4, i)})`}>
                {it.el}
              </g>
            );
          })}
        </ThoughtBubble>
        {items[2] > 0.5 && (
          <g opacity={ci(frame, [150, 160], [0, 1])}>
            <Sparkle x={250} y={480} size={22 + wave(frame, 0.3, 6)} />
            <Sparkle x={880} y={520} size={18 + wave(frame, 0.3, 6, 2)} color="#fff" />
            <Sparkle x={860} y={860} size={16 + wave(frame, 0.3, 5, 4)} />
          </g>
        )}
      </svg>
      <AbsoluteFill style={{ top: 150, height: 260 }}>
        <CartoonText text={TEXTS.question} size={118} delay={6} color="#DC2626" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

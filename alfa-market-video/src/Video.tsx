import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile } from "remotion";
import { COLORS, SCENES, TRANSITION_FRAMES, VOICEOVER, type SceneKey } from "./constants";
import { Reveal } from "./components/Reveal";
import { Scene1Home } from "./scenes/Scene1Home";
import { Scene2Store } from "./scenes/Scene2Store";
import { Scene3Tour } from "./scenes/Scene3Tour";
import { Scene4Near } from "./scenes/Scene4Near";
import { Scene5Outro } from "./scenes/Scene5Outro";

/** Block rendering until the Arabic display fonts are ready. */
const useFonts = () => {
  const [handle] = useState(() => delayRender("Loading Lalezar / Cairo"));
  useEffect(() => {
    const sample = "ألفا ماركت";
    Promise.all([
      document.fonts.load(`400 100px Lalezar`, sample),
      document.fonts.load(`700 100px Cairo`, sample),
      document.fonts.load(`900 100px Cairo`, sample),
    ])
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);
};

const ORDER: { key: SceneKey; Comp: React.FC; reveal?: "circle" | "burst" }[] = [
  { key: "home", Comp: Scene1Home },
  { key: "store", Comp: Scene2Store, reveal: "burst" },
  { key: "tour", Comp: Scene3Tour, reveal: "circle" },
  { key: "near", Comp: Scene4Near, reveal: "circle" },
  { key: "outro", Comp: Scene5Outro, reveal: "burst" },
];

export const AlfaMarketPromo: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {ORDER.map(({ key, Comp, reveal }) => {
        const { start, end } = SCENES[key];
        // Each later scene starts TRANSITION_FRAMES early so its reveal
        // finishes exactly on the voice-over cue.
        const from = reveal ? start - TRANSITION_FRAMES : start;
        return (
          <Sequence key={key} name={key} from={from} durationInFrames={end - from}>
            {reveal ? (
              <Reveal kind={reveal}>
                <Comp />
              </Reveal>
            ) : (
              <Comp />
            )}
          </Sequence>
        );
      })}
      {VOICEOVER.enabled && <Audio src={staticFile(VOICEOVER.file)} volume={VOICEOVER.volume} />}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { useFonts } from "./useFonts";
import { COLORS, SCENES, TRANSITION_FRAMES, VOICEOVER, type SceneKey } from "./constants";
import { Reveal } from "./components/Reveal";
import { Scene1Home } from "./scenes/Scene1Home";
import { Scene2Store } from "./scenes/Scene2Store";
import { Scene3Tour } from "./scenes/Scene3Tour";
import { Scene4Near } from "./scenes/Scene4Near";
import { Scene5Outro } from "./scenes/Scene5Outro";

const ORDER: { key: SceneKey; Comp: React.FC; reveal?: "circle" | "burst" }[] = [
  { key: "home", Comp: Scene1Home },
  { key: "store", Comp: Scene2Store, reveal: "burst" },
  { key: "tour", Comp: Scene3Tour, reveal: "circle" },
  { key: "near", Comp: Scene4Near, reveal: "circle" },
  { key: "outro", Comp: Scene5Outro, reveal: "burst" },
];

export const AlfaMarketCartoon: React.FC = () => {
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

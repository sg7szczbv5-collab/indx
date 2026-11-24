import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SCENES, VOICEOVER, type SceneKey } from "../constants";
import { useFonts } from "../useFonts";
import { M } from "./theme";
import { M1Home } from "./scenes/M1Home";
import { M2Store } from "./scenes/M2Store";
import { M3Tour } from "./scenes/M3Tour";
import { M4Near } from "./scenes/M4Near";
import { M5Outro } from "./scenes/M5Outro";

const ORDER: { key: SceneKey; Comp: React.FC }[] = [
  { key: "home", Comp: M1Home },
  { key: "store", Comp: M2Store },
  { key: "tour", Comp: M3Tour },
  { key: "near", Comp: M4Near },
  { key: "outro", Comp: M5Outro },
];

/** Motion-graphics (UI style) edit: continuous thread, morphs, whip-pans with motion blur. */
export const AlfaMarketMotion: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: M.bg }}>
      {ORDER.map(({ key, Comp }) => (
        <Sequence key={key} name={key} from={SCENES[key].start} durationInFrames={SCENES[key].end - SCENES[key].start}>
          <Comp />
        </Sequence>
      ))}
      {VOICEOVER.enabled && <Audio src={staticFile(VOICEOVER.file)} volume={VOICEOVER.volume} />}
    </AbsoluteFill>
  );
};

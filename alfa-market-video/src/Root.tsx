import "./index.css";
import { Composition } from "remotion";
import { AlfaMarketPromo } from "./Video";
import { DURATION_IN_FRAMES, VIDEO } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AlfaMarketPromo"
      component={AlfaMarketPromo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};

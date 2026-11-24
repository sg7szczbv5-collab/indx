import "./index.css";
import { Composition } from "remotion";
import { AlfaMarketCartoon } from "./Video";
import { AlfaMarketMotion } from "./motion/MotionVideo";
import { DURATION_IN_FRAMES, VIDEO } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main edit – smooth UI motion-graphics style */}
      <Composition
        id="AlfaMarketPromo"
        component={AlfaMarketMotion}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      {/* First version – 2D cartoon style */}
      <Composition
        id="AlfaMarketCartoon"
        component={AlfaMarketCartoon}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};

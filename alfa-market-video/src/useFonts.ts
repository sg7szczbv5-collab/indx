import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

/** Block rendering until the Arabic fonts are ready. */
export const useFonts = () => {
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

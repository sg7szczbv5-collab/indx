import { tw, inn, out } from "./theme";

/** Whip-pan in from below / out to the top, with per-frame velocity for blur. */
export const whip = (f: number, dur: number, opts: { enter?: boolean; exit?: boolean } = {}) => {
  const { enter = true, exit = true } = opts;
  const fn = (x: number) =>
    (enter ? tw(x, 0, 11, 1100, 0, out) : 0) + (exit ? tw(x, dur - 10, dur, 0, -1300, inn) : 0);
  return { y: fn(f), v: fn(f) - fn(f - 1) };
};

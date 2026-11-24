import { Easing, interpolate } from "remotion";

export const M = {
  bg: "#020D07",
  bg2: "#06200F",
  green: "#16A34A",
  glow: "#22C55E",
  mint: "#4ADE80",
  red: "#DC2626",
  redGlow: "#F87171",
  text: "#F0FAF4",
  muted: "#7FA08C",
  line: "rgba(220,255,232,0.32)",
  light: "#F6F8F7",
  ink: "#0A1A11",
  pillDark: "#0B2216",
} as const;

export const FONT = "Cairo, sans-serif";
export const LOGO_FONT = "Lalezar, Cairo, sans-serif";

/** Strong ease-in-out (expo-like) – the reference's signature curve. */
export const inOut = Easing.bezier(0.83, 0, 0.17, 1);
/** Fast start, long soft landing. */
export const out = Easing.bezier(0.16, 1, 0.3, 1);
export const inn = Easing.bezier(0.7, 0, 0.84, 0);

/** Clamped tween. */
export const tw = (f: number, a: number, b: number, from = 0, to = 1, e: (t: number) => number = out) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

/** Piece-wise keyframes [[frame,value],...] with eased segments. */
export const keys = (f: number, ks: [number, number][], e: (t: number) => number = inOut) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [f0, v0] = ks[i];
    const [f1, v1] = ks[i + 1];
    if (f <= f1) return tw(f, f0, f1, v0, v1, e);
  }
  return ks[ks.length - 1][1];
};

/** Velocity of an animated value (per frame) – used to drive motion blur. */
export const vel = (fn: (f: number) => number, f: number) => fn(f) - fn(f - 1);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Pt = { x: number; y: number };
export const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

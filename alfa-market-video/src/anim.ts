import { Easing, interpolate, spring } from "remotion";

type SpringCfg = { damping?: number; stiffness?: number; mass?: number };

/** Snappy pop-in (0 → 1 with a little overshoot). */
export const pop = (frame: number, fps: number, delay = 0, cfg: SpringCfg = {}) =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 170, mass: 0.7, ...cfg },
  });

/** Rubbery, very bouncy spring for cartoon drops. */
export const bouncy = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 6.5, stiffness: 120, mass: 0.9 },
  });

/** Clamped interpolate. */
export const ci = (
  frame: number,
  input: number[],
  output: number[],
  easing?: (t: number) => number,
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** Idle sine wobble. */
export const wave = (frame: number, speed = 0.12, amp = 1, phase = 0) =>
  Math.sin(frame * speed + phase) * amp;

/** True for a few frames every `period` frames – for blinking eyes. */
export const isBlinking = (frame: number, period = 84, offset = 0) =>
  (frame + offset) % period < 4;

/**
 * Squash & stretch after a landing at `landFrame`.
 * Returns [scaleX, scaleY].
 */
export const squash = (frame: number, landFrame: number, strength = 0.22) => {
  const t = frame - landFrame;
  if (t < 0) return [1, 1] as const;
  const s = Math.exp(-t / 5) * Math.cos(t * 0.9) * strength;
  return [1 + s, 1 - s] as const;
};

/** Exit fade towards a scene's local end frame. */
export const fadeOutAt = (frame: number, end: number, len = 10) =>
  ci(frame, [end - len, end], [1, 0]);

/**
 * Alfa Market – cartoon promo settings.
 * Edit this file to re-time scenes, change copy, or fill in branch details.
 */

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

/** Seconds → frames helper (30fps). */
export const sec = (s: number) => Math.round(s * VIDEO.fps);

/**
 * Scene boundaries in frames. They are aligned to the natural pauses in
 * public/voiceover.mp3 (38.5s). If you swap the voiceover, adjust here.
 *
 *  home   0.0s – 7.2s   "ناقصك شيء في البيت؟"
 *  store  7.2s – 17.6s  storefront + logo + hanging sign
 *  tour  17.6s – 28.5s  shopping-cart tour (3 phases)
 *  near  28.5s – 33.5s  neighbourhood map
 *  outro 33.5s – 39.0s  welcome + logo + branch info
 */
export const SCENES = {
  home: { start: 0, end: sec(7.2) },
  store: { start: sec(7.2), end: sec(17.6) },
  tour: { start: sec(17.6), end: sec(28.5) },
  near: { start: sec(28.5), end: sec(33.5) },
  outro: { start: sec(33.5), end: sec(39) },
} as const;

export type SceneKey = keyof typeof SCENES;

/** Frames used by the circle / starburst reveal between scenes. */
export const TRANSITION_FRAMES = 15;

export const DURATION_IN_FRAMES = SCENES.outro.end;

/** Tour sub-phases, in frames relative to the start of the tour scene. */
export const TOUR_PHASES = {
  fresh: 0, // 17.6s
  variety: sec(19.9) - sec(17.6), // 19.9s
  prices: sec(24.2) - sec(17.6), // 24.2s
} as const;

export const VOICEOVER = {
  /** File inside /public */
  file: "voiceover.mp3",
  volume: 1,
  enabled: true,
} as const;

export const COLORS = {
  green: "#16A34A",
  greenLight: "#22C55E",
  greenDark: "#15803D",
  greenPale: "#BBF7D0",
  red: "#DC2626",
  redDark: "#991B1B",
  cream: "#FFFBEB",
  creamDeep: "#FEF3C7",
  white: "#FFFFFF",
  outline: "#2B2118",
  facade: "#5F636B",
  facadeLine: "#4B4F57",
  glass: "#CFE8F3",
  glassDeep: "#9CCBE0",
  sky: "#BAE6FD",
  skin: "#E8B58C",
  yellow: "#FACC15",
  orange: "#F97316",
} as const;

export const TEXTS = {
  question: "ناقصك شيء في البيت؟",
  logoAlfa: "ألفا",
  logoMarket: "ماركت",
  oneStop: "كل اللي تحتاجه في مكان واحد",
  fresh: "طازج يومياً",
  variety: "تنوع يرضي كل الأذواق",
  prices: "أسعار تنافسية وعروض مستمرة",
  near: "قريب منك.. وسهل توصل له",
  welcome: "حياكم الله، زورونا اليوم!",
  dealTag: "عروض",
} as const;

/**
 * Branch details shown at the bottom of the closing scene.
 * Leave a field empty ("") to hide that line. Leave all empty for a clean space.
 */
export const STORE_INFO = {
  location: "", // e.g. "حي ..، شارع .."
  hours: "", // e.g. "يومياً من 7 صباحاً حتى 1 بعد منتصف الليل"
  phone: "", // e.g. "05xxxxxxxx"
} as const;

/** Copy used by the motion-graphics (UI style) version. */
export const MOTION_TEXTS = {
  q1: "ناقصك شيء",
  q2: "في البيت؟",
  missing: [
    { title: "قهوة", sub: "خلصت" },
    { title: "خبز", sub: "ما فيه" },
    { title: "حليب", sub: "ناقص" },
  ],
  oneStopTitle: "كل اللي تحتاجه",
  oneStopSub: "في مكان واحد",
  fresh: { title: "طازج يومياً", sub: "خضار وفواكه" },
  variety: { title: "تنوع يرضي كل الأذواق", sub: "كل الأقسام" },
  prices: { title: "أسعار تنافسية", sub: "على كل المنتجات" },
  offers: { title: "عروض مستمرة", sub: "كل أسبوع" },
  steps: ["بيتك", "الطريق", "ألفا ماركت"],
  near: "قريب منك.. وسهل توصل له",
  welcome: "حياكم الله، زورونا اليوم!",
} as const;

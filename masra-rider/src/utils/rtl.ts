import { Platform } from 'react-native'

/**
 * Logical edges for an Arabic (RTL) layout.
 * Native builds force RTL (app.json → expo-localization), so `start`/`end` already flip there.
 * react-native-web maps `start`/`end` to physical left/right, so on web we write the RTL edge directly.
 */
const web = Platform.OS === 'web'

/** Pin to the reading-start edge (the right side in Arabic). */
export const atStart = (v: number) => (web ? { right: v } : { start: v })
/** Pin to the reading-end edge (the left side in Arabic). */
export const atEnd = (v: number) => (web ? { left: v } : { end: v })
/** Padding on the reading-start / reading-end sides. */
export const padInline = (start: number, end: number) => (web ? { paddingRight: start, paddingLeft: end } : { paddingStart: start, paddingEnd: end })
/** Arabic text inputs: right-aligned on web (native follows the text direction). */
export const arabicInput = web ? ({ textAlign: 'right' } as const) : {}

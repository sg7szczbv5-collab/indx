import { Text, type TextProps, type TextStyle } from 'react-native'
import { colors, fonts } from '@/theme'

type Weight = keyof typeof fonts

export function AppText({
  weight = 'regular',
  size = 14,
  color = colors.ink,
  align,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string; align?: TextStyle['textAlign'] }) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts[weight], fontSize: size, color, lineHeight: Math.round(size * 1.55), writingDirection: 'rtl' }, align ? { textAlign: align } : null, style]}
    />
  )
}

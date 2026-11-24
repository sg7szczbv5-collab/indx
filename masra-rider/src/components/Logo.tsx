import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { colors } from '@/theme'

/** MASRA mark: an origin point, a curving road and a forward chevron. */
export function LogoMark({ size = 48, inverted = false }: { size?: number; inverted?: boolean }) {
  const bg = inverted ? colors.white : colors.ink
  const road = inverted ? colors.ink : colors.white
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect width={48} height={48} rx={13} fill={bg} />
      <Path d="M13 35c0-9 9-8 13-13s3-9 9-9" fill="none" stroke={road} strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M29 11.5l6.5 1.5-1.5 6.5" fill="none" stroke={colors.green3} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={13} cy={35} r={3.2} fill={colors.green3} />
    </Svg>
  )
}

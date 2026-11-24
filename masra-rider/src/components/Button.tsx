import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius, shadow } from '@/theme'
import { AppText } from './AppText'

type Variant = 'dark' | 'light' | 'outline' | 'green'

export function Button({
  title,
  onPress,
  variant = 'dark',
  disabled,
  loading,
  icon,
  style,
}: {
  title: string
  onPress?: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const bg = { dark: colors.ink, light: colors.mist2, outline: 'transparent', green: colors.green }[variant]
  const fg = variant === 'dark' || variant === 'green' ? colors.white : colors.ink
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <AppText weight="semibold" size={15} color={fg}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  )
}

export function IconButton({ onPress, label, children, style, floating }: { onPress?: () => void; label: string; children: ReactNode; style?: StyleProp<ViewStyle>; floating?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.icon, floating && { backgroundColor: colors.white, ...shadow.float }, { opacity: pressed ? 0.7 : 1 }, style]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  outline: { borderWidth: 1, borderColor: 'rgba(11,13,12,0.15)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mist2 },
})

import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Clock, MapPin, Plane, User } from 'lucide-react-native'
import { colors, radius, shadow } from '@/theme'
import { AppText } from './AppText'
import { CarArt } from './CarArt'
import type { Driver, RideType } from '@/data/rides'
import type { Place } from '@/data/places'
import { clockAt } from '@/utils/time'

/** White bottom panel with a grab handle, padded above the home indicator. */
export function Sheet({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }, padded && { paddingHorizontal: 16 }, style]}>
      <View style={styles.handle} />
      {children}
    </View>
  )
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />
}

export function MinBox({ value, label = 'دقيقة' }: { value: number | string; label?: string }) {
  return (
    <View style={styles.minBox}>
      <AppText weight="bold" size={19} color={colors.white} style={{ lineHeight: 22 }}>{value}</AppText>
      <AppText size={9} color="rgba(255,255,255,0.7)" style={{ lineHeight: 12 }}>{label}</AppText>
    </View>
  )
}

/** Saudi-style licence plate (demo values). */
export function Plate({ driver }: { driver: Driver }) {
  const cell = (t: string, top?: boolean) => (
    <View style={[styles.plateCell, top ? null : styles.plateBottom]}>
      <AppText weight="bold" size={10} style={{ lineHeight: 13 }}>{t}</AppText>
    </View>
  )
  return (
    <View style={styles.plate}>
      <View style={styles.plateKsa}>
        <AppText weight="bold" size={6} color={colors.white} style={{ lineHeight: 8 }}>KSA</AppText>
      </View>
      <View>
        <View style={{ flexDirection: 'row' }}>{cell(driver.plateAr, true)}{cell(driver.plateArNum, true)}</View>
        <View style={{ flexDirection: 'row' }}>{cell(driver.plateEn)}{cell(driver.plateNum)}</View>
      </View>
    </View>
  )
}

export function DriverAvatar({ driver, size = 48 }: { driver: Driver; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <AppText weight="bold" size={size * 0.3} color={colors.white}>{driver.initials}</AppText>
    </View>
  )
}

export function PlaceIcon({ kind }: { kind: Place['kind'] }) {
  const I = kind === 'airport' ? Plane : kind === 'recent' ? Clock : MapPin
  return (
    <View style={styles.placeIcon}>
      <I size={16} color={colors.muted} />
    </View>
  )
}

export function RideRow({ ride, fare, active, onPress, showDesc }: { ride: RideType; fare: number; active: boolean; onPress: () => void; showDesc?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${ride.name} ${fare} ريال`} onPress={onPress} style={[styles.rideRow, active && styles.rideRowActive]}>
      <CarArt kind={ride.car} color={ride.color} width={62} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText weight="bold" size={15}>{ride.name}</AppText>
          <User size={11} color={colors.muted} strokeWidth={2.5} />
          <AppText size={11} color={colors.muted}>{ride.seats}</AppText>
        </View>
        <AppText size={11.5} color={colors.muted} style={{ lineHeight: 16 }}>
          {clockAt(ride.eta + 14)} · بعد {ride.eta} د
        </AppText>
        {showDesc ? (
          <AppText size={11} color={colors.faint} numberOfLines={1}>{ride.desc}</AppText>
        ) : ride.tag ? (
          <View style={styles.tag}>
            <AppText weight="bold" size={10} color={colors.green} style={{ lineHeight: 14 }}>{ride.tag}</AppText>
          </View>
        ) : null}
      </View>
      <AppText weight="bold" size={15}>{fare} ر.س</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', start: 0, end: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 8, ...shadow.card },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(11,13,12,0.15)', marginBottom: 8 },
  minBox: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  plate: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.ink, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.white },
  plateCell: { paddingHorizontal: 6, paddingVertical: 1, minWidth: 34, alignItems: 'center' },
  plateBottom: { borderTopWidth: 1, borderTopColor: 'rgba(11,13,12,0.3)' },
  plateKsa: { width: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  placeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
  rideRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  rideRowActive: { borderColor: colors.ink },
  tag: { alignSelf: 'flex-start', marginTop: 2, backgroundColor: colors.greenSoft, borderRadius: 4, paddingHorizontal: 6 },
})

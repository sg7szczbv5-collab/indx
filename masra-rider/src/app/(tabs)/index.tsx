import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Path } from 'react-native-svg'
import { BusFront, CalendarClock, Car, ChevronDown, ChevronLeft, Clock, Crown, MapPin, MoreHorizontal, Package, Plane, Search, Star, Users } from 'lucide-react-native'
import type { ComponentType } from 'react'
import { AppText } from '@/components/AppText'
import { MapView } from '@/components/MapView'
import { colors, radius } from '@/theme'
import { useRide } from '@/store/ride'
import type { RideType } from '@/data/rides'
import { atEnd, padInline } from '@/utils/rtl'

type Service = { I: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; t: string; ride?: RideType['id']; airport?: boolean; soon?: boolean }

const SERVICES: Service[] = [
  { I: Car, t: 'رحلة', ride: 'eco' },
  { I: CalendarClock, t: 'حجز مسبق' },
  { I: Plane, t: 'المطار', airport: true },
  { I: Users, t: 'عائلي', ride: 'family' },
  { I: BusFront, t: 'XL', ride: 'xl' },
  { I: Crown, t: 'فاخر', ride: 'lux' },
  { I: Package, t: 'طرود', soon: true },
  { I: MoreHorizontal, t: 'المزيد', soon: true },
]

export default function Home() {
  const insets = useSafeAreaInsets()
  const { setRideId, setPlaceId } = useRide()

  const openService = (s: Service) => {
    if (s.soon) return
    if (s.ride) setRideId(s.ride)
    if (s.airport) {
      setPlaceId('airport')
      router.push('/rides')
      return
    }
    router.push('/search')
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 24 }}>
      {/* Promo */}
      <Pressable accessibilityRole="button" onPress={() => router.push('/search')} style={styles.promo}>
        <Svg width={170} height={110} viewBox="0 0 160 104" style={[styles.promoArt, atEnd(0)]}>
          <Path d="M10 100 C 40 70, 30 40, 80 36 S 130 10, 150 -4" fill="none" stroke={colors.green3} strokeWidth={10} strokeLinecap="round" opacity={0.55} />
          <Path d="M10 100 C 40 70, 30 40, 80 36 S 130 10, 150 -4" fill="none" stroke="#FFFFFF" strokeWidth={1.5} strokeDasharray="4 5" opacity={0.6} />
          <Circle cx={80} cy={36} r={6} fill="#FFFFFF" />
          <Circle cx={80} cy={36} r={2.5} fill={colors.green} />
        </Svg>
        <AppText weight="bold" size={18} color={colors.white} style={{ lineHeight: 26 }}>تنقّل بسهولة{'\n'}في الشرقية</AppText>
        <View style={styles.row}>
          <AppText size={12.5} color="rgba(255,255,255,0.85)">اطلب رحلتك الآن</AppText>
          <ChevronLeft size={14} color="rgba(255,255,255,0.85)" />
        </View>
      </Pressable>

      {/* Services */}
      <View style={styles.grid}>
        {SERVICES.map((s) => (
          <Pressable key={s.t} accessibilityRole="button" accessibilityLabel={s.t} onPress={() => openService(s)} style={styles.service}>
            <View style={styles.serviceBox}>
              <s.I size={25} color={colors.ink} strokeWidth={1.7} />
              {s.soon && s.t === 'طرود' ? (
                <View style={styles.soon}>
                  <AppText weight="bold" size={8.5} color={colors.white} style={{ lineHeight: 12 }}>قريباً</AppText>
                </View>
              ) : null}
            </View>
            <AppText weight="medium" size={11.5}>{s.t}</AppText>
          </Pressable>
        ))}
      </View>

      {/* Where to */}
      <Pressable accessibilityRole="button" accessibilityLabel="إلى أين؟" onPress={() => router.push('/search')} style={[styles.whereTo, padInline(16, 6)]}>
        <Search size={19} color={colors.ink} strokeWidth={2.4} />
        <AppText weight="semibold" size={16} color="rgba(11,13,12,0.7)" style={{ flex: 1 }}>إلى أين؟</AppText>
        <View style={styles.nowChip}>
          <Clock size={13} color={colors.ink} />
          <AppText weight="semibold" size={12.5}>الآن</AppText>
          <ChevronDown size={13} color={colors.ink} />
        </View>
      </Pressable>

      <Pressable onPress={() => router.push('/search')} style={styles.listRow}>
        <Star size={18} color={colors.ink} fill={colors.ink} />
        <AppText weight="medium" size={14}>اختر مكاناً محفوظاً</AppText>
      </Pressable>
      <View style={styles.hr} />
      <Pressable onPress={() => router.push('/pickup')} style={styles.listRow}>
        <MapPin size={18} color={colors.white} fill={colors.ink} />
        <AppText weight="medium" size={14}>حدد الوجهة على الخريطة</AppText>
      </Pressable>

      <AppText weight="bold" size={17} style={{ marginTop: 14 }}>حولك</AppText>
      <View style={styles.around}>
        <MapView view={{ y: 380, h: 190 }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  promo: { height: 112, borderRadius: radius.lg, backgroundColor: colors.green, padding: 16, overflow: 'hidden' },
  promoArt: { position: 'absolute', top: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, marginHorizontal: -4, rowGap: 12 },
  service: { width: '25%', paddingHorizontal: 4, alignItems: 'center', gap: 4 },
  serviceBox: { width: '100%', height: 62, borderRadius: radius.md, backgroundColor: colors.mist2, alignItems: 'center', justifyContent: 'center' },
  soon: { position: 'absolute', top: -7, backgroundColor: colors.ink, borderRadius: 99, paddingHorizontal: 6 },
  whereTo: { marginTop: 18, height: 52, borderRadius: 26, backgroundColor: colors.mist2, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nowChip: { height: 40, borderRadius: 20, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  hr: { height: 1, backgroundColor: colors.line },
  around: { marginTop: 10, height: 130, borderRadius: radius.lg, overflow: 'hidden' },
})

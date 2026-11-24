import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import Svg, { Circle, Path } from 'react-native-svg'
import { MapPin } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { MapView } from '@/components/MapView'
import { Divider, Sheet } from '@/components/ui'
import { colors } from '@/theme'
import { useRide } from '@/store/ride'
import { requestRide } from '@/services/api'
import { clockAt } from '@/utils/time'
import { CURRENT_LOCATION, shortName } from '@/data/places'

function Segment({ index }: { index: number }) {
  const [v] = useState(() => new Animated.Value(0))
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 850, delay: index * 850, easing: Easing.linear, useNativeDriver: false }).start()
  }, [v, index])
  return (
    <View style={styles.segTrack}>
      <Animated.View style={[styles.segFill, { width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  )
}

function Pulse({ delay }: { delay: number }) {
  const [v] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1800, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [v, delay])
  return (
    <Animated.View
      style={[styles.pulse, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] }]}
    />
  )
}

export default function Searching() {
  const { place, ride, payment, setTrip } = useRide()
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    requestRide({ placeId: place.id, rideId: ride.id, paymentId: payment.id }).then((r) => {
      if (cancelled.current) return
      setTrip({ id: r.tripId, driver: r.driver })
      router.replace('/driver')
    })
    return () => {
      cancelled.current = true
    }
  }, [place.id, ride.id, payment.id, setTrip])

  return (
    <View style={styles.root}>
      <View style={styles.map}>
        <MapView view={{ y: 200, h: 460 }} mode="preview" showPickup pickupLabel="الالتقاء من طريق الخليج" pickupSub={CURRENT_LOCATION.name} pickupEta={String(ride.eta)} />
      </View>
      <Sheet padded={false}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppText weight="bold" size={16} align="center">جارٍ ربطك بسائق</AppText>
          <View style={styles.segments}>
            {[0, 1, 2, 3].map((i) => (
              <Segment key={i} index={i} />
            ))}
          </View>
          <View style={styles.illus}>
            <Pulse delay={0} />
            <Pulse delay={900} />
            <Svg width={84} height={84} viewBox="0 0 80 80">
              <Circle cx={40} cy={28} r={12} fill={colors.ink} />
              <Path d="M16 72 Q18 46 40 44 Q62 46 64 72 Z" fill={colors.green} />
              <Path d="M34 44 L40 54 L46 44" fill="#FFFFFF" />
            </Svg>
          </View>
          <AppText size={13} color={colors.muted} align="center" style={{ marginTop: 14 }}>
            الوصول المتوقع إلى وجهتك {clockAt(ride.eta + place.min + 1)}
          </AppText>
        </View>
        <Divider style={{ marginTop: 14 }} />
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color={colors.ink} />
            <AppText weight="semibold" size={13}>{shortName(place)}</AppText>
          </View>
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
            <AppText weight="semibold" size={13} color={colors.danger}>إلغاء</AppText>
          </Pressable>
        </View>
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { position: 'absolute', top: 0, start: 0, end: 0, height: '62%' },
  segments: { flexDirection: 'row', gap: 6, marginTop: 12 },
  segTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.mist, overflow: 'hidden' },
  segFill: { height: '100%', backgroundColor: colors.green3 },
  illus: { alignSelf: 'center', marginTop: 20, width: 104, height: 104, borderRadius: 52, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: colors.green3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
})

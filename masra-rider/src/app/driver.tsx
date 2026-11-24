import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { Phone, ShieldCheck, X } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { Button, IconButton } from '@/components/Button'
import { CarArt } from '@/components/CarArt'
import { MapView } from '@/components/MapView'
import { Divider, DriverAvatar, MinBox, Plate, Sheet } from '@/components/ui'
import { colors } from '@/theme'
import { useRide } from '@/store/ride'
import { useProgress } from '@/hooks/useProgress'
import { CURRENT_LOCATION } from '@/data/places'
import { atEnd, atStart } from '@/utils/rtl'

export default function DriverArriving() {
  const { trip, ride } = useRide()
  const [toast, setToast] = useState(true)
  const p = useProgress(!!trip, 9000)
  useEffect(() => {
    const t = setTimeout(() => setToast(false), 6000)
    return () => clearTimeout(t)
  }, [])
  if (!trip) return <Redirect href="/(tabs)" />
  const d = trip.driver
  const arrived = p >= 1
  const mins = arrived ? 0 : Math.max(1, Math.ceil((1 - p) * ride.eta))

  return (
    <View style={styles.root}>
      <View style={styles.map}>
        <MapView view={{ y: 400, h: 290 }} mode="approach" progress={p} showNearby={false} showPickup />
        <View style={styles.distChip}>
          <AppText weight="bold" size={12} color={colors.white}>{arrived ? 'وصل' : `${Math.round((1 - p) * 900)} م`}</AppText>
        </View>
      </View>
      {toast ? (
        <View style={styles.toast}>
          <AppText size={12} color={colors.white} style={{ flex: 1, lineHeight: 18 }}>نشارك موقعك المباشر مع السائق لمساعدته في الوصول إليك</AppText>
          <Pressable onPress={() => setToast(false)} accessibilityLabel="إغلاق" hitSlop={8}>
            <X size={16} color={colors.white} />
          </Pressable>
        </View>
      ) : null}
      <Sheet padded={false}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size={16}>{arrived ? 'السائق في نقطة الالتقاء' : 'قابل السائق عند نقطة الالتقاء'}</AppText>
            <AppText size={12.5} color={colors.muted}>{CURRENT_LOCATION.name} · طريق الخليج</AppText>
          </View>
          <MinBox value={mins} />
        </View>
        <Divider />
        <View style={styles.pinRow}>
          <AppText weight="semibold" size={13.5}>رمز التحقق للرحلة</AppText>
          <View style={styles.pin}>
            {d.pin.split('').map((c, i) => (
              <View key={i} style={styles.pinCell}>
                <AppText weight="bold" size={15} color={colors.white} style={{ lineHeight: 20 }}>{c}</AppText>
              </View>
            ))}
          </View>
        </View>
        <Divider />
        <View style={styles.driverRow}>
          <View style={styles.combo}>
            <View style={[{ position: 'absolute', top: 0 }, atStart(0)]}>
              <DriverAvatar driver={d} size={46} />
            </View>
            <View style={[{ position: 'absolute', bottom: 0 }, atEnd(0)]}>
              <CarArt width={64} />
            </View>
            <View style={[styles.ratingChip, atStart(0)]}>
              <AppText weight="bold" size={10.5} style={{ lineHeight: 14 }}>{d.rating} ★</AppText>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Plate driver={d} />
            <AppText size={12} color={colors.muted} style={{ marginTop: 4 }}>{d.model}</AppText>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <AppText size={13}>
            <AppText weight="bold" size={13}>{d.name}</AppText>
            <AppText size={12.5} color={colors.muted}> · {d.trips.toLocaleString('en-US')} رحلة · سائق بتقييم عالٍ</AppText>
          </AppText>
          <View style={styles.actions}>
            <View style={styles.notes}>
              <AppText size={13} color={colors.faint}>أي ملاحظات للالتقاء؟</AppText>
            </View>
            <IconButton label="اتصال بالسائق">
              <Phone size={18} color={colors.ink} />
            </IconButton>
            <IconButton label="أدوات الأمان">
              <ShieldCheck size={18} color={colors.green2} />
            </IconButton>
          </View>
          <Button title={arrived ? 'ركبت — ابدأ الرحلة' : 'ركبت السيارة'} variant={arrived ? 'dark' : 'light'} onPress={() => router.replace('/trip')} style={{ marginTop: 12 }} />
        </View>
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { position: 'absolute', top: 0, start: 0, end: 0, height: '50%' },
  distChip: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  toast: { position: 'absolute', top: '38%', start: 24, end: 24, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  pinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  pin: { flexDirection: 'row-reverse', gap: 4 },
  pinCell: { width: 26, height: 30, borderRadius: 4, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  combo: { width: 100, height: 60 },
  ratingChip: { position: 'absolute', bottom: -2, backgroundColor: colors.white, borderRadius: 99, paddingHorizontal: 6, borderWidth: 1, borderColor: colors.line },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  notes: { flex: 1, height: 42, borderRadius: 21, backgroundColor: colors.mist2, justifyContent: 'center', paddingHorizontal: 16 },
})

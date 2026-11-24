import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Banknote, CreditCard, MapPin, Radio, Share2, ShieldCheck, Users, Wallet } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { MapView } from '@/components/MapView'
import { MinBox } from '@/components/ui'
import { colors, radius, shadow } from '@/theme'
import { useRide } from '@/store/ride'
import { useProgress } from '@/hooks/useProgress'
import { clockAt } from '@/utils/time'
import { shortName } from '@/data/places'

export default function Trip() {
  const insets = useSafeAreaInsets()
  const { trip, place, fare, payment } = useRide()
  const p = useProgress(!!trip, 14000, () => router.replace('/rate'))
  if (!trip) return <Redirect href="/(tabs)" />

  const PayIcon = payment.id === 'cash' ? Banknote : payment.id === 'wallet' ? Wallet : CreditCard
  const rows = [
    { I: MapPin, t: place.name, s: `الوصول ${clockAt(place.min * (1 - p) + 1)}`, a: 'إضافة أو تغيير' },
    { I: PayIcon, t: `${fare} ر.س`, s: payment.id === 'card' ? `بطاقة ${payment.detail}` : payment.name, a: 'تبديل' },
    { I: Users, t: 'ترافق أحداً؟', s: 'قسّم الأجرة بسهولة', a: 'تقسيم الأجرة' },
    { I: Radio, t: 'مشاركة حالة الرحلة', s: 'يتابع أهلك رحلتك مباشرة', a: 'مشاركة' },
  ]

  return (
    <View style={styles.root}>
      <View style={styles.map}>
        <MapView view={{ y: 84, h: 400, w: 470 }} mode="trip" progress={p} showNearby={false} showDropoff dropoffLabel={shortName(place)} />
      </View>
      <View style={styles.panel}>
        <View style={styles.top}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={16}>في الطريق إلى {shortName(place)}</AppText>
              <AppText size={12.5} color={colors.muted}>
                الوصول {clockAt(place.min * (1 - p) + 1)} · {(p * place.km).toFixed(1)} من {place.km} كم
              </AppText>
            </View>
            <MinBox value={Math.max(0, Math.round((1 - p) * place.min))} />
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${p * 100}%` }]} />
          </View>
        </View>
        <ScrollView style={{ flex: 1, backgroundColor: colors.white, marginTop: 6 }}>
          {rows.map(({ I, t, s, a }) => (
            <View key={a} style={styles.row}>
              <I size={18} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" size={13.5} numberOfLines={1}>{t}</AppText>
                <AppText size={11.5} color={colors.faint} numberOfLines={1}>{s}</AppText>
              </View>
              <Pressable accessibilityRole="button" hitSlop={6}>
                <AppText weight="semibold" size={12.5} color={colors.green2}>{a}</AppText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View style={styles.bar}>
          <Pressable style={styles.barBtn} onPress={() => router.replace('/rate')} accessibilityRole="button">
            <AppText weight="semibold" size={14} color={colors.muted}>تخطٍّ للوصول (تجريبي)</AppText>
          </Pressable>
          <View style={{ width: 1, backgroundColor: colors.line }} />
          <Pressable style={[styles.barBtn, { flexDirection: 'row', gap: 6 }]} accessibilityRole="button">
            <ShieldCheck size={17} color={colors.green2} />
            <AppText weight="semibold" size={14} color={colors.green2}>الأمان</AppText>
          </Pressable>
        </View>
        <View style={[styles.safety, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
          <Share2 size={13} color={colors.white} />
          <AppText size={12} color={colors.white}>اضغط للوصول إلى أدوات الأمان ومشاركة الرحلة</AppText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { position: 'absolute', top: 0, start: 0, end: 0, height: '42%' },
  panel: { position: 'absolute', top: '39%', start: 0, end: 0, bottom: 0, backgroundColor: colors.mist2, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden', ...shadow.card },
  top: { backgroundColor: colors.white, paddingBottom: 12 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(11,13,12,0.15)', marginVertical: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.mist, marginHorizontal: 16, marginTop: 12, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.green3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  bar: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  barBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  safety: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.green, paddingTop: 10 },
})

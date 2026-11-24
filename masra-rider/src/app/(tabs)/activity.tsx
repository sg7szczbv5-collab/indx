import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RotateCcw } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { CarArt } from '@/components/CarArt'
import { colors, radius } from '@/theme'

const PAST = [
  { to: 'كورنيش الخبر', when: 'أمس · 8:42 م', fare: 41, ride: 'اقتصادي', ok: true },
  { to: 'مطار الملك فهد الدولي', when: 'الأحد · 5:10 ص', fare: 78, ride: 'مريح', ok: true },
  { to: 'جامعة الملك فهد للبترول والمعادن', when: 'الخميس · 7:25 ص', fare: 33, ride: 'اقتصادي', ok: true },
  { to: 'محطة قطار الدمام', when: '12 نوفمبر · 3:02 م', fare: 0, ride: 'عائلي', ok: false },
]

export default function Activity() {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24 }}>
      <AppText weight="bold" size={26} style={{ lineHeight: 38 }}>النشاط</AppText>
      <AppText weight="bold" size={16} style={{ marginTop: 14 }}>الرحلات السابقة</AppText>
      <View style={{ marginTop: 8, gap: 10 }}>
        {PAST.map((p) => (
          <View key={p.when} style={styles.card}>
            <View style={styles.art}>
              <CarArt width={58} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" size={14} numberOfLines={1}>{p.to}</AppText>
              <AppText size={12} color={colors.muted}>{p.when} · {p.ride}</AppText>
              <AppText weight="semibold" size={12.5} color={p.ok ? colors.ink : colors.danger}>
                {p.ok ? `${p.fare} ر.س` : 'ملغاة'}
              </AppText>
            </View>
            <View style={styles.again}>
              <RotateCcw size={14} color={colors.ink} />
              <AppText weight="semibold" size={12}>إعادة</AppText>
            </View>
          </View>
        ))}
      </View>
      <AppText size={11.5} color={colors.faint} align="center" style={{ marginTop: 16 }}>بيانات تجريبية</AppText>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: colors.mist2 },
  art: { width: 70, height: 52, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  again: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
})

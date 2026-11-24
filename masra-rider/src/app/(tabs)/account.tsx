import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, CreditCard, Globe, HelpCircle, LogOut, ShieldCheck, Star, Wallet } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { colors, radius } from '@/theme'
import { useRide } from '@/store/ride'

export default function Account() {
  const insets = useSafeAreaInsets()
  const { phone } = useRide()
  const rows = [
    { I: Wallet, t: 'محفظة مَسْرى', s: 'الرصيد 120 ر.س' },
    { I: CreditCard, t: 'وسائل الدفع', s: 'بطاقة •••• 4821' },
    { I: ShieldCheck, t: 'الأمان', s: 'جهات الطوارئ ومشاركة الرحلة' },
    { I: Globe, t: 'اللغة', s: 'العربية' },
    { I: HelpCircle, t: 'المساعدة والدعم', s: 'تواصل مع فريق مَسْرى' },
  ]
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24 }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <AppText weight="bold" size={24} style={{ lineHeight: 36 }}>عبدالله</AppText>
          <View style={styles.rating}>
            <Star size={12} color={colors.ink} fill={colors.ink} />
            <AppText weight="semibold" size={12}>4.95</AppText>
          </View>
          <AppText size={12} color={colors.muted} style={{ marginTop: 4 }}>‎+966 {phone || '5XXXXXXXX'}</AppText>
        </View>
        <View style={styles.avatar}>
          <AppText weight="bold" size={22} color={colors.white}>ع</AppText>
        </View>
      </View>
      <View style={{ marginTop: 18 }}>
        {rows.map(({ I, t, s }) => (
          <Pressable key={t} style={styles.row}>
            <I size={20} color={colors.ink} />
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" size={14}>{t}</AppText>
              <AppText size={12} color={colors.muted}>{s}</AppText>
            </View>
            <ChevronLeft size={18} color={colors.faint} />
          </Pressable>
        ))}
        <Pressable style={styles.row} onPress={() => router.replace('/welcome')} accessibilityRole="button">
          <LogOut size={20} color={colors.danger} />
          <AppText weight="semibold" size={14} color={colors.danger}>تسجيل الخروج</AppText>
        </Pressable>
      </View>
      <AppText size={11.5} color={colors.faint} align="center" style={{ marginTop: 16 }}>مَسْرى · الإصدار 1.0.0 (تجريبي)</AppText>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.mist2, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, borderRadius: radius.sm },
})

import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRight, MapPin } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { Button, IconButton } from '@/components/Button'
import { MapView } from '@/components/MapView'
import { Divider, Sheet } from '@/components/ui'
import { colors, radius } from '@/theme'
import { atStart } from '@/utils/rtl'

export default function Pickup() {
  const insets = useSafeAreaInsets()
  return (
    <View style={styles.root}>
      <View style={styles.map}>
        <MapView view={{ y: 300, h: 380 }} showNearby={false} showUser pickupBubble="الالتقاء هنا" />
      </View>
      <IconButton floating label="رجوع" onPress={() => router.back()} style={[styles.back, atStart(12), { top: insets.top + 8 }]}>
        <ArrowRight size={20} color={colors.ink} />
      </IconButton>
      <Sheet padded={false}>
        <AppText weight="bold" size={16} align="center" style={{ paddingBottom: 10 }}>أكّد نقطة الالتقاء</AppText>
        <Divider />
        <View style={styles.addr}>
          <AppText weight="semibold" size={14} style={{ flex: 1, lineHeight: 22 }}>بالقرب من مدخل حي الشاطئ، طريق الخليج — الدمام</AppText>
          <Pressable onPress={() => router.push('/search')} style={styles.searchChip} accessibilityRole="button">
            <AppText weight="semibold" size={12.5}>بحث</AppText>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.hint}>
            <View style={styles.hintIcon}>
              <MapPin size={12} color={colors.green} />
            </View>
            <AppText size={12} color={colors.muted} style={{ flex: 1 }}>نقطة آمنة يسهل على السائق التوقف فيها · مشي دقيقة واحدة</AppText>
          </View>
          <Button title="تأكيد الالتقاء" onPress={() => router.push('/searching')} />
        </View>
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { position: 'absolute', top: 0, start: 0, end: 0, height: '68%' },
  back: { position: 'absolute' },
  addr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  searchChip: { backgroundColor: colors.mist2, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.mist2, borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  hintIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
})

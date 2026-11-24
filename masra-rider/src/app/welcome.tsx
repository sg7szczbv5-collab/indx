import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Phone } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { Button } from '@/components/Button'
import { LogoMark } from '@/components/Logo'
import { MapView } from '@/components/MapView'
import { colors, fonts, radius } from '@/theme'
import { useRide } from '@/store/ride'
import { sendOtp } from '@/services/api'

export default function Welcome() {
  const insets = useSafeAreaInsets()
  const { phone, setPhone } = useRide()
  const [loading, setLoading] = useState(false)
  const valid = phone.length === 9 && phone.startsWith('5')

  const submit = async () => {
    setLoading(true)
    const r = await sendOtp(phone)
    setLoading(false)
    if (r.ok) router.push('/otp')
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.22 }]}>
          <MapView showUser={false} />
        </View>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,13,12,0.55)' }]} />
        <View style={[styles.brand, { paddingTop: insets.top + 24 }]}>
          <LogoMark size={76} inverted />
          <AppText weight="bold" size={32} color={colors.white} style={{ marginTop: 14, lineHeight: 44 }}>مَسْرى</AppText>
          <AppText weight="semibold" size={11} color="rgba(255,255,255,0.5)" style={{ letterSpacing: 5 }}>MASRA</AppText>
          <AppText size={14} color="rgba(255,255,255,0.75)" style={{ marginTop: 10 }}>رحلتك تبدأ من هنا</AppText>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
        <View style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}>
          <AppText weight="bold" size={19}>أهلاً بك</AppText>
          <AppText size={13} color={colors.muted}>سجّل الدخول أو أنشئ حساباً برقم جوالك</AppText>
          <View style={styles.phoneRow}>
            <Phone size={16} color={colors.faint} />
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 9))}
              keyboardType="number-pad"
              placeholder="5X XXX XXXX"
              placeholderTextColor={colors.faint}
              accessibilityLabel="رقم الجوال"
              style={styles.input}
              maxLength={9}
            />
            <View style={styles.sep} />
            <AppText weight="semibold" size={14}>{'\u200E+966'}</AppText>
          </View>
          <Button title="متابعة" onPress={submit} disabled={!valid} loading={loading} style={{ marginTop: 12 }} />
          <AppText size={11} color={colors.faint} align="center" style={{ marginTop: 12 }}>
            بالمتابعة توافق على الشروط وسياسة الخصوصية · نسخة تجريبية
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  hero: { flex: 1, overflow: 'hidden' },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panel: { backgroundColor: colors.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 24 },
  phoneRow: { marginTop: 16, height: 52, borderRadius: radius.md, backgroundColor: colors.mist2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  input: { flex: 1, minWidth: 0, width: 0, fontFamily: fonts.medium, fontSize: 16, color: colors.ink, height: '100%' },
  sep: { width: 1, height: 20, backgroundColor: 'rgba(11,13,12,0.15)' },
})

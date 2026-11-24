import { useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRight } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { Button, IconButton } from '@/components/Button'
import { colors, fonts } from '@/theme'
import { useRide } from '@/store/ride'
import { verifyOtp } from '@/services/api'

export default function Otp() {
  const insets = useSafeAreaInsets()
  const { phone } = useRide()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<TextInputInstance>(null)

  const submit = async () => {
    setLoading(true)
    const r = await verifyOtp(code)
    setLoading(false)
    if (r.ok) router.replace('/(tabs)')
    else setError('الرمز غير صحيح، أدخل 4 أرقام.')
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <IconButton label="رجوع" onPress={() => router.back()}>
        <ArrowRight size={20} color={colors.ink} />
      </IconButton>
      <AppText weight="bold" size={24} style={{ marginTop: 24, lineHeight: 36 }}>أدخل رمز التحقق</AppText>
      <AppText size={14} color={colors.muted}>
        أرسلنا رمزاً من 4 أرقام إلى ‎+966 {phone || '5XXXXXXXX'}
      </AppText>
      <Pressable onPress={() => ref.current?.focus()} style={styles.boxes} accessibilityLabel="رمز التحقق">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.box, code.length === i && styles.boxActive]}>
            <AppText weight="bold" size={22}>{code[i] ?? ''}</AppText>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={ref}
        value={code}
        onChangeText={(t) => {
          setError('')
          setCode(t.replace(/\D/g, '').slice(0, 4))
        }}
        keyboardType="number-pad"
        autoFocus
        maxLength={4}
        style={styles.hidden}
        accessibilityLabel="أدخل الرمز"
      />
      {error ? <AppText size={13} color={colors.danger} style={{ marginTop: 10 }}>{error}</AppText> : null}
      <AppText size={12} color={colors.faint} style={{ marginTop: 14 }}>نسخة تجريبية: أي 4 أرقام تعمل.</AppText>
      <View style={{ flex: 1 }} />
      <Button title="تحقق ومتابعة" onPress={submit} disabled={code.length < 4} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 20 },
  boxes: { flexDirection: 'row-reverse', gap: 10, marginTop: 28, justifyContent: 'center' },
  box: { flex: 1, maxWidth: 70, height: 60, borderRadius: 12, backgroundColor: colors.mist2, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: colors.ink },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1, fontFamily: fonts.regular },
})

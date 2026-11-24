import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Banknote, Check, CreditCard, Star, Wallet } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { Button } from '@/components/Button'
import { LogoMark } from '@/components/Logo'
import { DriverAvatar } from '@/components/ui'
import { colors, fonts, radius } from '@/theme'
import { useRide } from '@/store/ride'
import { rateTrip } from '@/services/api'
import { shortName } from '@/data/places'
import { arabicInput } from '@/utils/rtl'

const LABELS = ['', 'سيئة', 'مقبولة', 'جيدة', 'رائعة', 'ممتازة!']

export default function Rate() {
  const insets = useSafeAreaInsets()
  const { trip, setTrip, place, fare, payment } = useRide()
  const [stars, setStars] = useState(0)
  const [tip, setTip] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  if (!trip) return <Redirect href="/(tabs)" />
  const PayIcon = payment.id === 'cash' ? Banknote : payment.id === 'wallet' ? Wallet : CreditCard

  const submit = async () => {
    setSending(true)
    await rateTrip({ tripId: trip.id, stars, comment, tip })
    setSending(false)
    setDone(true)
  }

  if (done) {
    return (
      <View style={[styles.thanks, { paddingBottom: insets.bottom + 20 }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LogoMark size={68} />
          <AppText weight="bold" size={22} style={{ marginTop: 18 }}>شكراً لتقييمك</AppText>
          <AppText size={14} color={colors.muted} align="center" style={{ marginTop: 6 }}>تقييمك يساعدنا في الحفاظ على جودة الخدمة وسلامة الرحلات.</AppText>
        </View>
        <Button
          title="طلب رحلة جديدة"
          onPress={() => {
            setTrip(null)
            router.replace('/(tabs)')
          }}
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.check}>
          <Check size={26} color={colors.white} />
        </View>
        <AppText size={13.5} color="rgba(255,255,255,0.65)" style={{ marginTop: 10 }}>وصلت بسلامة إلى {shortName(place)}</AppText>
        <AppText weight="bold" size={38} color={colors.white} style={{ lineHeight: 52 }}>{fare + tip} ر.س</AppText>
        <View style={styles.payChip}>
          <PayIcon size={13} color={colors.white} />
          <AppText size={12} color={colors.white}>{payment.name} {payment.id === 'card' ? payment.detail : ''}</AppText>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <DriverAvatar driver={trip.driver} size={46} />
          <View>
            <AppText size={12.5} color={colors.muted}>كيف كانت رحلتك مع</AppText>
            <AppText weight="bold" size={16}>{trip.driver.name}؟</AppText>
          </View>
        </View>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setStars(n)} accessibilityRole="button" accessibilityLabel={`${n} نجوم`} hitSlop={4}>
              <Star size={36} color={n <= stars ? colors.gold : 'rgba(11,13,12,0.15)'} fill={n <= stars ? colors.gold : 'transparent'} strokeWidth={1.5} />
            </Pressable>
          ))}
        </View>
        <AppText size={12} color={colors.muted} align="center" style={{ minHeight: 18 }}>{LABELS[stars]}</AppText>
        <AppText weight="semibold" size={13} color={colors.muted} style={{ marginTop: 10 }}>إكرامية للسائق (اختياري)</AppText>
        <View style={styles.tips}>
          {[0, 3, 5, 10].map((t) => (
            <Pressable key={t} onPress={() => setTip(t)} style={[styles.tip, tip === t && { backgroundColor: colors.ink }]} accessibilityRole="button">
              <AppText weight="semibold" size={13} color={tip === t ? colors.white : colors.ink}>{t === 0 ? 'بدون' : `${t} ر.س`}</AppText>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="أضف تعليقاً عن الرحلة…"
          placeholderTextColor={colors.faint}
          multiline
          accessibilityLabel="تعليق"
          style={[styles.comment, arabicInput]}
        />
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
        <Button title="إرسال التقييم" onPress={submit} disabled={stars === 0} loading={sending} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink, alignItems: 'center', paddingBottom: 22 },
  check: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green3, alignItems: 'center', justifyContent: 'center' },
  payChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
  stars: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, marginTop: 18 },
  tips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.mist2 },
  comment: { marginTop: 14, minHeight: 70, borderRadius: radius.md, backgroundColor: colors.mist2, padding: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.ink, textAlignVertical: 'top' },
  thanks: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24 },
})

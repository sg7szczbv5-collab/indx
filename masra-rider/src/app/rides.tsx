import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRight, Banknote, CalendarClock, Check, ChevronLeft, CreditCard, Wallet } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { Button, IconButton } from '@/components/Button'
import { MapView } from '@/components/MapView'
import { Divider, RideRow } from '@/components/ui'
import { colors, radius, shadow } from '@/theme'
import { useRide } from '@/store/ride'
import { getFareQuotes, type FareQuote } from '@/services/api'
import { PAYMENTS } from '@/data/rides'
import { CURRENT_LOCATION, shortName } from '@/data/places'
import { atStart } from '@/utils/rtl'

function PaymentIcon({ id, size, color }: { id: string; size: number; color: string }) {
  if (id === 'cash') return <Banknote size={size} color={color} />
  if (id === 'wallet') return <Wallet size={size} color={color} />
  return <CreditCard size={size} color={color} />
}

export default function Rides() {
  const insets = useSafeAreaInsets()
  const { place, ride, setRideId, payment, setPaymentId } = useRide()
  const [quotes, setQuotes] = useState<FareQuote[]>([])
  const [expanded, setExpanded] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  useEffect(() => {
    getFareQuotes(place).then(setQuotes)
  }, [place])

  const visible = expanded ? quotes : quotes.slice(0, 3)

  return (
    <View style={styles.root}>
      <View style={styles.map}>
        <MapView
          view={{ y: 72, h: 420, w: 440 }}
          mode="preview"
          showPickup
          showDropoff
          showNearby={false}
          pickupLabel={CURRENT_LOCATION.name}
          pickupSub="طريق الخليج"
          pickupEta={String(ride.eta)}
          dropoffLabel={shortName(place)}
        />
      </View>
      <IconButton floating label="رجوع" onPress={() => router.back()} style={[styles.back, atStart(12), { top: insets.top + 8 }]}>
        <ArrowRight size={20} color={colors.ink} />
      </IconButton>

      <View style={[styles.sheet, expanded ? { top: insets.top + 8 } : { height: '57%' }]}>
        <Pressable onPress={() => setExpanded((e) => !e)} accessibilityLabel={expanded ? 'تصغير' : 'عرض كل الخيارات'} style={{ paddingVertical: 8 }}>
          <View style={styles.handle} />
        </Pressable>
        <AppText weight="bold" size={16} align="center">اختر رحلتك</AppText>
        <Divider style={{ marginTop: 8 }} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 8 }}>
          {expanded
            ? (['rec', 'pop'] as const).map((sec) => (
                <View key={sec} style={{ marginBottom: 6 }}>
                  <AppText weight="bold" size={14} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>{sec === 'rec' ? 'موصى بها' : 'شائعة'}</AppText>
                  {quotes.filter((q) => q.ride.section === sec).map((q) => (
                    <RideRow key={q.ride.id} ride={q.ride} fare={q.fare} active={q.ride.id === ride.id} onPress={() => setRideId(q.ride.id)} showDesc />
                  ))}
                </View>
              ))
            : visible.map((q) => <RideRow key={q.ride.id} ride={q.ride} fare={q.fare} active={q.ride.id === ride.id} onPress={() => setRideId(q.ride.id)} />)}
          {!expanded && quotes.length > 3 ? (
            <Pressable onPress={() => setExpanded(true)} style={{ paddingVertical: 8 }}>
              <AppText weight="semibold" size={13} color={colors.green2} align="center">عرض كل الخيارات ({quotes.length})</AppText>
            </Pressable>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
          {payOpen ? (
            <View style={styles.payMenu}>
              {PAYMENTS.map((p) => {
                return (
                  <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => { setPaymentId(p.id); setPayOpen(false) }} style={styles.payItem}>
                    <PaymentIcon id={p.id} size={17} color={colors.ink} />
                    <AppText weight="semibold" size={13} style={{ flex: 1 }}>
                      {p.name} <AppText size={12} color={colors.faint}>{p.detail}</AppText>
                    </AppText>
                    {p.id === payment.id ? <Check size={16} color={colors.green2} /> : null}
                  </Pressable>
                )
              })}
            </View>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="وسيلة الدفع" onPress={() => setPayOpen((o) => !o)} style={styles.payRow}>
            <View style={styles.payBadge}>
              <PaymentIcon id={payment.id} size={13} color={colors.white} />
            </View>
            <AppText weight="semibold" size={13.5} style={{ flex: 1 }}>{payment.id === 'card' ? payment.detail : payment.name}</AppText>
            <ChevronLeft size={16} color={colors.faint} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Button title={`اختيار ${ride.name}`} onPress={() => router.push('/pickup')} style={{ flex: 1 }} disabled={!quotes.length} />
            <IconButton label="جدولة الرحلة" style={styles.schedule}>
              <CalendarClock size={20} color={colors.ink} />
            </IconButton>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { position: 'absolute', top: 0, start: 0, end: 0, height: '46%' },
  back: { position: 'absolute' },
  sheet: { position: 'absolute', start: 0, end: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.card },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(11,13,12,0.15)' },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 12, paddingTop: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  payBadge: { width: 30, height: 20, borderRadius: 4, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  payMenu: { position: 'absolute', start: 12, end: 12, bottom: '100%', marginBottom: 8, backgroundColor: colors.white, borderRadius: radius.md, padding: 6, ...shadow.float },
  payItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 10, borderRadius: radius.sm },
  schedule: { width: 52, height: 52, borderRadius: radius.md },
})

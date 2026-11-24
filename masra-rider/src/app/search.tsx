import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRight, ChevronDown, ChevronLeft, Plus, Star, User, X } from 'lucide-react-native'
import { AppText } from '@/components/AppText'
import { IconButton } from '@/components/Button'
import { PlaceIcon } from '@/components/ui'
import { colors, fonts } from '@/theme'
import { useRide } from '@/store/ride'
import { searchPlaces } from '@/services/api'
import { CURRENT_LOCATION, PLACES, type Place } from '@/data/places'
import { arabicInput, atStart } from '@/utils/rtl'

export default function Search() {
  const insets = useSafeAreaInsets()
  const { setPlaceId } = useRide()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>(PLACES)

  useEffect(() => {
    let live = true
    searchPlaces(query).then((r) => live && setResults(r))
    return () => {
      live = false
    }
  }, [query])

  const choose = (p: Place) => {
    setPlaceId(p.id)
    router.push('/rides')
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <IconButton label="رجوع" onPress={() => router.back()} style={[styles.back, atStart(10)]}>
          <ArrowRight size={21} color={colors.ink} />
        </IconButton>
        <View style={styles.forChip}>
          <View style={styles.forDot}>
            <User size={11} color={colors.white} />
          </View>
          <AppText weight="semibold" size={12.5}>الرحلة لي</AppText>
          <ChevronDown size={13} color={colors.ink} />
        </View>
      </View>

      <View style={styles.fields}>
        <View style={styles.rail}>
          <View style={styles.dot} />
          <View style={styles.railLine} />
          <View style={styles.square} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.fromField}>
            <AppText size={13.5} color={colors.muted} numberOfLines={1}>موقعي الحالي · {CURRENT_LOCATION.name}</AppText>
          </View>
          <View style={styles.toField}>
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="إلى أين؟"
              placeholderTextColor={colors.faint}
              accessibilityLabel="البحث عن الوجهة"
              style={[styles.input, arabicInput]}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="مسح" hitSlop={8}>
                <X size={16} color={colors.faint} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <IconButton label="إضافة توقف" style={{ marginTop: 50, width: 34, height: 34 }}>
          <Plus size={17} color={colors.ink} />
        </IconButton>
      </View>

      <Pressable style={styles.saved}>
        <View style={styles.savedIcon}>
          <Star size={14} color={colors.white} fill={colors.white} />
        </View>
        <AppText weight="semibold" size={14} style={{ flex: 1 }}>الأماكن المحفوظة</AppText>
        <ChevronLeft size={17} color={colors.faint} />
      </Pressable>

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={<AppText size={13} color={colors.muted} align="center" style={{ marginTop: 30 }}>لا توجد نتائج مطابقة</AppText>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={item.name} onPress={() => choose(item)} style={({ pressed }) => [styles.result, pressed && { backgroundColor: colors.mist2 }]}>
            <PlaceIcon kind={item.kind} />
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" size={14} numberOfLines={1}>{item.name}</AppText>
              <AppText size={12} color={colors.muted} numberOfLines={1}>{item.addr}</AppText>
            </View>
            <AppText size={11} color={colors.faint}>{item.km} كم</AppText>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 48, alignItems: 'center', justifyContent: 'center' },
  back: { position: 'absolute', backgroundColor: 'transparent' },
  forChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.mist2, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  forDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.green3, alignItems: 'center', justifyContent: 'center' },
  fields: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 6 },
  rail: { alignItems: 'center', paddingTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
  railLine: { width: 1.5, height: 34, backgroundColor: 'rgba(11,13,12,0.4)', marginVertical: 4 },
  square: { width: 8, height: 8, backgroundColor: colors.ink },
  fromField: { backgroundColor: colors.mist2, borderRadius: 6, paddingHorizontal: 12, height: 44, justifyContent: 'center' },
  toField: { backgroundColor: colors.mist, borderRadius: 6, paddingHorizontal: 12, height: 44, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.ink },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink, height: '100%' },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 14, borderTopWidth: 6, borderBottomWidth: 6, borderColor: colors.mist2 },
  savedIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(11,13,12,0.7)', alignItems: 'center', justifyContent: 'center' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
})

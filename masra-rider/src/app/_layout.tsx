import { useEffect } from 'react'
import { I18nManager, Platform } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic'
import { RideProvider } from '@/store/ride'
import { colors } from '@/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

// Arabic-first app: right-to-left everywhere. Native builds also force RTL via app.json (expo-localization).
I18nManager.allowRTL(true)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  })

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {})
  }, [loaded, error])

  if (!loaded && !error) return null

  return (
    <SafeAreaProvider>
      <RideProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white }, animation: 'slide_from_left' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="otp" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="rides" />
          <Stack.Screen name="pickup" />
          <Stack.Screen name="searching" options={{ gestureEnabled: false }} />
          <Stack.Screen name="driver" options={{ gestureEnabled: false }} />
          <Stack.Screen name="trip" options={{ gestureEnabled: false }} />
          <Stack.Screen name="rate" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </RideProvider>
    </SafeAreaProvider>
  )
}

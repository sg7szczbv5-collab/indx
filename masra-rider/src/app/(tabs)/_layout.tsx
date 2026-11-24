import { Platform } from 'react-native'
import { Tabs } from 'expo-router/tabs'
import { Home, ReceiptText, UserRound } from 'lucide-react-native'
import { colors, fonts } from '@/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: 'rgba(11,13,12,0.35)',
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16 },
        tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.white, ...(Platform.OS === 'web' ? { height: 74, paddingTop: 6, paddingBottom: 12 } : null) },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <Home size={21} color={color} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'النشاط', tabBarIcon: ({ color }) => <ReceiptText size={21} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'الحساب', tabBarIcon: ({ color }) => <UserRound size={21} color={color} /> }} />
    </Tabs>
  )
}

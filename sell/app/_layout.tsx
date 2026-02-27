import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/src/stores/authStore';
import { useProductStore } from '@/src/stores/productStore';
import { useOrderStore } from '@/src/stores/orderStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { usePayoutStore } from '@/src/stores/payoutStore';
import { Colors } from '@/src/theme';

// Keep the splash screen visible until all stores are hydrated
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateProducts = useProductStore((s) => s.hydrate);
  const hydrateOrders = useOrderStore((s) => s.hydrate);
  const hydrateNotifications = useNotificationStore((s) => s.hydrate);
  const hydratePayouts = usePayoutStore((s) => s.hydrate);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          hydrate(),
          hydrateProducts(),
          hydrateOrders(),
          hydrateNotifications(),
          hydratePayouts(),
        ]);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="product/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="product/edit/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="payouts" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="support" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="returns" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

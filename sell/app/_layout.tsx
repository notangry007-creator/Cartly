import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/src/stores/authStore';
import { useProductStore } from '@/src/stores/productStore';
import { useOrderStore } from '@/src/stores/orderStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { Colors } from '@/src/theme';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateProducts = useProductStore((s) => s.hydrate);
  const hydrateOrders = useOrderStore((s) => s.hydrate);
  const hydrateNotifications = useNotificationStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateProducts();
    hydrateOrders();
    hydrateNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="product/new" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="product/edit/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="payouts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

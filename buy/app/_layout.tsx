import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../src/theme';
import { useAuthStore } from '../src/stores/authStore';
import { useZoneStore } from '../src/stores/zoneStore';
import { useCartStore } from '../src/stores/cartStore';
import { useNotificationStore } from '../src/stores/notificationStore';
import { useWishlistStore } from '../src/stores/wishlistStore';
import { useNetworkStore } from '../src/stores/networkStore';
import { getAuthToken, getSavedUserId } from '../src/utils/storage';
import OfflineBanner from '../src/components/common/OfflineBanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      // Use cached data when offline
      gcTime: 1000 * 60 * 60, // 1 hour cache
    },
  },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { loadUser } = useAuthStore();
  const { loadZone } = useZoneStore();
  const { loadCart } = useCartStore();
  const { loadNotifications } = useNotificationStore();
  const { loadWishlist } = useWishlistStore();
  const { init: initNetwork } = useNetworkStore();
  useEffect(() => {
    const unsubNetwork = initNetwork();
    return () => unsubNetwork();
  }, []);
  useEffect(() => {
    async function init() {
      try {
        await loadZone();
        const token = await getAuthToken();
        if (token) {
          const userId = await getSavedUserId();
          if (userId) {
            await loadUser(userId);
            await loadCart(userId);
            await loadNotifications(userId);
            await loadWishlist(userId);
          }
        }
      } finally { setReady(true); }
    }
    init();
  }, []);
  if (!ready) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#E53935' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      {children}
      <OfflineBanner />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex:1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <AppInitializer>
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="product/[id]" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="product/reviews" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="category/[id]" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="checkout/index" options={{ animation:'slide_from_bottom', presentation:'modal' }} />
                <Stack.Screen name="order/[id]" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="order/return/[id]" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="order/review" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="search" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="addresses/index" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="addresses/new" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="wallet" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="notifications" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="edit-profile" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="returns" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="support" options={{ animation:'slide_from_right' }} />
                <Stack.Screen name="wishlist" options={{ animation:'slide_from_right' }} />
              </Stack>
            </AppInitializer>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

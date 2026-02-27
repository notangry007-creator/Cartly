import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useThemeStore } from '../src/stores/themeStore';
import { useAuthStore } from '../src/stores/authStore';
import { useZoneStore } from '../src/stores/zoneStore';
import { useCartStore } from '../src/stores/cartStore';
import { useNotificationStore } from '../src/stores/notificationStore';
import { useWishlistStore } from '../src/stores/wishlistStore';
import { useRecentlyViewedStore } from '../src/stores/recentlyViewedStore';
import { useNetworkStore } from '../src/stores/networkStore';
import { useTourStore } from '../src/stores/tourStore';
import { getAuthToken, getSavedUserId } from '../src/utils/storage';
import OfflineBanner from '../src/components/common/OfflineBanner';
import ErrorBoundary from '../src/components/common/ErrorBoundary';
import { ToastProvider } from '../src/context/ToastContext';

// Keep splash visible while we initialize
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 60 * 60 * 1000, // 1 hour — allows offline cache
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
  const { loadProducts: loadRecentlyViewed } = useRecentlyViewedStore();
  const { loadTheme } = useThemeStore();
  const { init: initNetwork } = useNetworkStore();
  const { loadTour } = useTourStore();
  const router = useRouter();

  useEffect(() => {
    const unsubNetwork = initNetwork();
    return () => unsubNetwork();
  }, []);

  // ─── Push notification tap deep-link handler ──────────────────────────────
  useEffect(() => {
    // Handle notification taps when app is already open
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as {
        orderId?: string;
        type?: string;
        status?: string;
      };

      if (!data) return;

      // Route based on notification type
      if (data.type === 'order' && data.orderId) {
        router.push(`/order/${data.orderId}` as any);
      } else if (data.type === 'return' && data.orderId) {
        router.push(`/returns` as any);
      } else if (data.type === 'wallet') {
        router.push('/wallet' as any);
      } else if (data.type === 'promo') {
        router.push('/(tabs)/home' as any);
      }
    });

    // Handle notification that launched the app from killed state
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const data = response.notification.request.content.data as {
        orderId?: string;
        type?: string;
      };
      if (data?.type === 'order' && data.orderId) {
        // Delay to allow navigation stack to initialize
        setTimeout(() => router.push(`/order/${data.orderId}` as any), 500);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([loadTheme(), loadZone(), loadTour()]);
        const token = await getAuthToken();
        if (token) {
          const userId = await getSavedUserId();
          if (userId) {
            await Promise.all([
              loadUser(userId),
              loadCart(userId),
              loadNotifications(userId),
              loadWishlist(userId),
            ]);
          }
        }
        await loadRecentlyViewed();
      } catch (e) {
        // Log initialization errors — in production, send to crash reporter (e.g. Sentry)
        console.error('[AppInit] Initialization failed:', e);
        // Don't rethrow — allow app to continue with partial state
        // Users will see empty states rather than a crash
      } finally {
        setReady(true);
        // Hide splash only after stores are hydrated — no white flash
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  if (!ready) return null; // Splash screen covers this gap

  return (
    <View style={{ flex: 1 }}>
      {children}
      <OfflineBanner />
    </View>
  );
}

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useThemeStore();
  return <PaperProvider theme={currentTheme}>{children}</PaperProvider>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedApp>
            <ErrorBoundary>
              <ToastProvider>
                <AppInitializer>
                  <StatusBar style="auto" />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="tour" options={{ animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="product/reviews" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="category/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="checkout/index" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                    <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="order/return/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="order/review" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="order/confirmation" options={{ animation: 'fade' }} />
                    <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="addresses/index" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="addresses/new" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="addresses/edit/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="wallet/index" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="wallet/topup" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="wallet/withdraw" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="returns" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="support" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="wishlist" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="offers" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="seller/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="return/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="flash-sale" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="loyalty" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="referral" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="pickup-points" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="product/qa" options={{ animation: 'slide_from_right' }} />
                  </Stack>
                </AppInitializer>
              </ToastProvider>
            </ErrorBoundary>
          </ThemedApp>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

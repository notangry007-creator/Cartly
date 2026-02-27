import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '@/src/stores/themeStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useZoneStore } from '@/src/stores/zoneStore';
import { useCartStore } from '@/src/stores/cartStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { useWishlistStore } from '@/src/stores/wishlistStore';
import { useRecentlyViewedStore } from '@/src/stores/recentlyViewedStore';
import { useNetworkStore } from '@/src/stores/networkStore';
import { useTourStore } from '@/src/stores/tourStore';
import OfflineBanner from '@/src/components/common/OfflineBanner';
import ErrorBoundary from '@/src/components/common/ErrorBoundary';
import { ToastProvider } from '@/src/context/ToastContext';
import { supabase } from '@/src/lib/supabase';

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

  useEffect(() => {
    const unsubNetwork = initNetwork();
    return () => unsubNetwork();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([loadTheme(), loadZone(), loadTour()]);

        // Use Supabase session instead of local SecureStore token
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userId = session.user.id;
          await Promise.all([
            loadUser(userId),
            loadCart(userId),
            loadNotifications(userId),
            loadWishlist(userId),
          ]);
        }
      } catch (e) {
        console.warn('[AppInit]', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    init();

    // Listen for auth state changes (sign-in / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // authStore.logout() already clears state
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

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
                    <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="returns" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="support" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="wishlist" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="offers" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="seller/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="return/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
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

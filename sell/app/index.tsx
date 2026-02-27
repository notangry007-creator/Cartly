import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/src/theme';

export default function Index() {
  const { seller, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return seller ? <Redirect href="/(tabs)/dashboard" /> : <Redirect href="/(auth)/login" />;
}

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { useNetworkStore } from '../../stores/networkStore';

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStore();

  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!isOnline) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
    } else if (wasOffline) {
      timer = setTimeout(() => {
        translateY.value = withTiming(-60, { duration: 350, easing: Easing.in(Easing.ease) });
        opacity.value = withTiming(0, { duration: 300 });
      }, 2000);
    } else {
      translateY.value = -60;
      opacity.value = 0;
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isOnline, wasOffline]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (isOnline && !wasOffline) return null;

  return (
    <Animated.View style={[s.container, !isOnline ? s.offline : s.online, animStyle]}>
      <Ionicons
        name={isOnline ? 'wifi' : 'cloud-offline'}
        size={16}
        color="#fff"
      />
      <Text style={s.text}>
        {isOnline ? 'Back online — syncing...' : 'No internet connection. Showing cached data.'}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  offline: { backgroundColor: '#B71C1C' },
  online: { backgroundColor: '#2E7D32' },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
});

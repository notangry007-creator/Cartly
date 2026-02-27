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

  // All hooks MUST be called before any conditional return
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
      // Immediately hide when online and not transitioning from offline
      translateY.value = withTiming(-60, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isOnline, wasOffline]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Early return AFTER hooks — only skip rendering the DOM node when fully hidden
  if (isOnline && !wasOffline) return null;

  return (
    <Animated.View
      style={[s.container, !isOnline ? s.offline : s.online, animStyle]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={isOnline ? 'Back online, syncing data' : 'No internet connection. Showing cached data.'}
    >
      <Ionicons
        name={isOnline ? 'wifi' : 'cloud-offline'}
        size={16}
        color="#fff"
        accessibilityElementsHidden
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

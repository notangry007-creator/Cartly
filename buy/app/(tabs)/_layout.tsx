import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { useCartStore } from '../../src/stores/cartStore';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { theme } from '../../src/theme';

function Badge({ name, focused, count }: { name: string; focused: boolean; count?: number }) {
  const prevCount = useRef(count ?? 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count !== undefined && count > prevCount.current) {
      // Bounce when cart count increases
      scale.value = withSequence(
        withSpring(1.6, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 8 })
      );
    }
    prevCount.current = count ?? 0;
  }, [count]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View>
      <Ionicons name={name as any} size={24} color={focused ? theme.colors.primary : '#999'} />
      {count && count > 0 ? (
        <Animated.View
          style={[s.badge, badgeStyle]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${count} ${count === 1 ? 'item' : 'items'}`}
        >
          <Text style={s.badgeTxt}>{count > 99 ? '99+' : count}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const cartCount = useCartStore(s => s.getItemCount());
  const unread = useNotificationStore(s => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#f0f0f0', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ focused }) => <Badge name={focused ? 'home' : 'home-outline'} focused={focused} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ focused }) => <Badge name={focused ? 'grid' : 'grid-outline'} focused={focused} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ focused }) => <Badge name={focused ? 'bag' : 'bag-outline'} focused={focused} count={cartCount} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ focused }) => <Badge name={focused ? 'receipt' : 'receipt-outline'} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <Badge name={focused ? 'person' : 'person-outline'} focused={focused} count={unread} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: theme.colors.primary,
    borderRadius: 999, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

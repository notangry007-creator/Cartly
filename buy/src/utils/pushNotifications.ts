import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { OrderStatus } from '../types';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // Simulator/emulator
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleOrderNotification(
  orderId: string,
  status: OrderStatus,
  delaySeconds: number = 0
): Promise<string | null> {
  const messages: Partial<Record<OrderStatus, { title: string; body: string }>> = {
    confirmed: {
      title: '✅ Order Confirmed',
      body: `Your order #${orderId.slice(-8).toUpperCase()} has been confirmed by the seller.`,
    },
    packed: {
      title: '📦 Order Packed',
      body: `Your order #${orderId.slice(-8).toUpperCase()} is packed and ready for pickup.`,
    },
    shipped: {
      title: '🚚 Order Shipped',
      body: `Your order #${orderId.slice(-8).toUpperCase()} is on its way!`,
    },
    out_for_delivery: {
      title: '🏃 Out for Delivery',
      body: `Your order #${orderId.slice(-8).toUpperCase()} is out for delivery. Be ready!`,
    },
    delivered: {
      title: '🎉 Order Delivered',
      body: `Your order #${orderId.slice(-8).toUpperCase()} has been delivered. Enjoy!`,
    },
    cancelled: {
      title: '❌ Order Cancelled',
      body: `Your order #${orderId.slice(-8).toUpperCase()} has been cancelled.`,
    },
    return_requested: {
      title: '↩️ Return Requested',
      body: `Return request for order #${orderId.slice(-8).toUpperCase()} submitted.`,
    },
    refunded: {
      title: '💰 Refund Processed',
      body: `Your refund for order #${orderId.slice(-8).toUpperCase()} has been added to your wallet.`,
    },
  };

  const msg = messages[status];
  if (!msg) return null;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        data: { orderId, status, type: 'order' },
        sound: true,
        badge: 1,
      },
      trigger: delaySeconds > 0 ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds } : null,
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleOrderProgressNotifications(orderId: string): Promise<void> {
  // Simulate real delivery timeline with realistic delays
  await scheduleOrderNotification(orderId, 'confirmed', 5);
  await scheduleOrderNotification(orderId, 'packed', 30);
  await scheduleOrderNotification(orderId, 'shipped', 90);
  await scheduleOrderNotification(orderId, 'out_for_delivery', 180);
  await scheduleOrderNotification(orderId, 'delivered', 300);
}

/**
 * Push notification utilities for the sell app.
 * Handles permission requests and scheduling local notifications
 * for new orders, low stock alerts, and payout updates.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // Simulators don't support push
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification for a new order.
 */
export async function notifyNewOrder(orderId: string, buyerName: string, total: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛍️ New Order Received!',
        body: `${buyerName} placed an order for NPR ${total.toLocaleString('en-NP')}`,
        data: { type: 'new_order', orderId },
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch {
    // Silently fail — notifications are non-critical
  }
}

/**
 * Schedule a local notification for a low stock alert.
 */
export async function notifyLowStock(productName: string, stock: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Low Stock Alert',
        body: `"${productName}" has only ${stock} unit${stock === 1 ? '' : 's'} left`,
        data: { type: 'low_stock' },
        sound: false,
      },
      trigger: null,
    });
  } catch {
    // Silently fail
  }
}

/**
 * Schedule a local notification for a payout status update.
 */
export async function notifyPayoutUpdate(status: string, amount: number): Promise<void> {
  const statusLabels: Record<string, string> = {
    processing: '⏳ Payout Processing',
    completed: '✅ Payout Completed',
    failed: '❌ Payout Failed',
  };
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: statusLabels[status] ?? 'Payout Update',
        body: `NPR ${amount.toLocaleString('en-NP')} payout is ${status}`,
        data: { type: 'payout', status },
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // Silently fail
  }
}

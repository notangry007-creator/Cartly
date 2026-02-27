import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PriceDropAlert } from '../types';
import { getItem, setItem } from '../utils/storage';
import { PRODUCTS } from '../data/seed';
import { schedulePromoNotification } from '../utils/pushNotifications';

const pdk = (uid: string) => 'buy_price_drop_' + uid;

export const usePriceDropAlerts = (userId: string) => useQuery({
  queryKey: ['price_drop', userId],
  enabled: !!userId,
  staleTime: 30000,
  queryFn: async () => (await getItem<PriceDropAlert[]>(pdk(userId))) ?? [],
});

export const useSetPriceDropAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId, targetPrice }: {
      userId: string;
      productId: string;
      targetPrice: number;
    }) => {
      const alerts = (await getItem<PriceDropAlert[]>(pdk(userId))) ?? [];
      const existing = alerts.findIndex(a => a.productId === productId);
      const newAlert: PriceDropAlert = { productId, userId, targetPrice, createdAt: new Date().toISOString() };
      const updated = existing >= 0
        ? alerts.map((a, i) => i === existing ? newAlert : a)
        : [...alerts, newAlert];
      await setItem(pdk(userId), updated);
      return newAlert;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['price_drop', v.userId] }),
  });
};

export const useRemovePriceDropAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const alerts = (await getItem<PriceDropAlert[]>(pdk(userId))) ?? [];
      await setItem(pdk(userId), alerts.filter(a => a.productId !== productId));
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['price_drop', v.userId] }),
  });
};

/**
 * Check all price drop alerts for a user and send notifications for any that have been triggered.
 * Call this periodically (e.g., on app foreground) or when product prices are updated.
 */
export async function checkPriceDropAlerts(userId: string): Promise<void> {
  const alerts = (await getItem<PriceDropAlert[]>(pdk(userId))) ?? [];
  if (alerts.length === 0) return;

  for (const alert of alerts) {
    const product = PRODUCTS.find(p => p.id === alert.productId);
    if (!product) continue;

    if (product.basePrice <= alert.targetPrice) {
      await schedulePromoNotification(
        `💰 Price Drop Alert!`,
        `${product.title.slice(0, 30)} is now ${product.basePrice <= alert.targetPrice ? 'at or below' : 'near'} your target price of NPR ${alert.targetPrice}!`,
        { productId: alert.productId, type: 'price_drop' }
      );
    }
  }
}

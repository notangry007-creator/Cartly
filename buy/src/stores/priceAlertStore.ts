import { create } from 'zustand';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';

export interface PriceAlert {
  productId: string;
  variantId: string;
  targetPrice: number; // alert when price drops to or below this
  addedAt: string;
}

interface PriceAlertState {
  alerts: PriceAlert[];
  isLoaded: boolean;
  loadAlerts: (userId: string) => Promise<void>;
  addAlert: (userId: string, productId: string, variantId: string, targetPrice: number) => Promise<void>;
  removeAlert: (userId: string, productId: string, variantId: string) => Promise<void>;
  hasAlert: (productId: string, variantId?: string) => boolean;
}

const ak = (uid: string) => `${STORAGE_KEYS.PRICE_ALERTS ?? 'price_alerts'}_${uid}`;

export const usePriceAlertStore = create<PriceAlertState>((set, get) => ({
  alerts: [],
  isLoaded: false,

  loadAlerts: async (userId) => {
    const alerts = (await getItem<PriceAlert[]>(ak(userId))) ?? [];
    set({ alerts, isLoaded: true });
  },

  addAlert: async (userId, productId, variantId, targetPrice) => {
    const { alerts } = get();
    const exists = alerts.some(a => a.productId === productId && a.variantId === variantId);
    if (exists) return;
    const updated = [
      ...alerts,
      { productId, variantId, targetPrice, addedAt: new Date().toISOString() },
    ];
    await setItem(ak(userId), updated);
    set({ alerts: updated });
  },

  removeAlert: async (userId, productId, variantId) => {
    const updated = get().alerts.filter(
      a => !(a.productId === productId && a.variantId === variantId)
    );
    await setItem(ak(userId), updated);
    set({ alerts: updated });
  },

  hasAlert: (productId, variantId) => {
    const { alerts } = get();
    if (variantId) return alerts.some(a => a.productId === productId && a.variantId === variantId);
    return alerts.some(a => a.productId === productId);
  },
}));

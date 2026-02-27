import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_ORDERS } from '../data/seed';
import { notifyNewOrder } from '../utils/pushNotifications';

const STORAGE_KEY = 'sell_orders';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,

  hydrate: async () => {
    const stored = await getItem<Order[]>(STORAGE_KEY);
    set({ orders: stored ?? SEED_ORDERS });
    if (!stored) await setItem(STORAGE_KEY, SEED_ORDERS);
  },

  /**
   * Add a new incoming order and fire a push notification.
   * In production this would be called via a webhook/WebSocket listener.
   */
  addOrder: async (order) => {
    const orders = [order, ...get().orders];
    await setItem(STORAGE_KEY, orders);
    set({ orders });
    // Fire push notification for new order
    notifyNewOrder(order.id, order.buyerName, order.total).catch(() => {});
  },

  updateStatus: async (id, status) => {
    const orders = get().orders.map((o) =>
      o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
    );
    await setItem(STORAGE_KEY, orders);
    set({ orders });
  },
}));

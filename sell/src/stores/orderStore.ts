import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_ORDERS } from '../data/seed';

const STORAGE_KEY = 'sell_orders';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
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

  updateStatus: async (id, status) => {
    const orders = get().orders.map((o) =>
      o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
    );
    await setItem(STORAGE_KEY, orders);
    set({ orders });
  },
}));

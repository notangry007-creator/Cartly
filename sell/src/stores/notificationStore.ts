import { create } from 'zustand';
import { SellerNotification } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_NOTIFICATIONS } from '../data/seed';

const STORAGE_KEY = 'sell_notifications';

interface NotificationState {
  notifications: SellerNotification[];
  unreadCount: number;
  hydrate: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  hydrate: async () => {
    const stored = await getItem<SellerNotification[]>(STORAGE_KEY);
    const notifications = stored ?? SEED_NOTIFICATIONS;
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length });
    if (!stored) await setItem(STORAGE_KEY, SEED_NOTIFICATIONS);
  },

  markRead: async (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    await setItem(STORAGE_KEY, notifications);
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length });
  },

  markAllRead: async () => {
    const notifications = get().notifications.map((n) => ({ ...n, isRead: true }));
    await setItem(STORAGE_KEY, notifications);
    set({ notifications, unreadCount: 0 });
  },
}));

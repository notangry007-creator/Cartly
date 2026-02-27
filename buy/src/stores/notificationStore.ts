import { create } from 'zustand';
import { AppNotification } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { useAuthStore } from './authStore';
import { v4 as uuid } from 'uuid';

function notifKey(): string | null {
  const userId = useAuthStore.getState().user?.id;
  return userId ? `${STORAGE_KEYS.NOTIFICATIONS}_${userId}` : null;
}

type NewNotificationPayload = Omit<AppNotification, 'id' | 'userId' | 'read' | 'createdAt'>;

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  /** Called once on app init / after login with the authenticated userId. */
  loadNotifications: (userId: string) => Promise<void>;
  addNotification: (payload: NewNotificationPayload) => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  loadNotifications: async (userId) => {
    const key = `${STORAGE_KEYS.NOTIFICATIONS}_${userId}`;
    const ns = (await getItem<AppNotification[]>(key)) ?? [];
    set({ notifications: ns, unreadCount: ns.filter(n => !n.read).length });
  },

  addNotification: async (payload) => {
    const key = notifKey();
    const userId = useAuthStore.getState().user?.id;
    if (!key || !userId) return;

    const newNotif: AppNotification = {
      ...payload,
      id: uuid(),
      userId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...get().notifications];
    await setItem(key, updated);
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },

  markRead: async (notificationId) => {
    const key = notifKey();
    if (!key) return;
    const updated = get().notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    await setItem(key, updated);
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },

  markAllRead: async () => {
    const key = notifKey();
    if (!key) return;
    const updated = get().notifications.map(n => ({ ...n, read: true }));
    await setItem(key, updated);
    set({ notifications: updated, unreadCount: 0 });
  },
}));

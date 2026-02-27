import { create } from 'zustand';
import { AppNotification } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

type NewNotificationPayload = Omit<AppNotification, 'id' | 'userId' | 'read' | 'createdAt'>;

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loadNotifications: (userId: string) => Promise<void>;
  addNotification: (payload: NewNotificationPayload) => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNotif(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    referenceId: row.reference_id ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // ── loadNotifications ─────────────────────────────────────────────────────
  loadNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return;
    const ns = (data ?? []).map(rowToNotif);
    set({ notifications: ns, unreadCount: ns.filter(n => !n.read).length });
  },

  // ── addNotification ───────────────────────────────────────────────────────
  addNotification: async (payload) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        reference_id: payload.referenceId ?? null,
        read: false,
      })
      .select()
      .single();

    if (error) return;
    const newNotif = rowToNotif(data);
    const updated = [newNotif, ...get().notifications];
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },

  // ── markRead ──────────────────────────────────────────────────────────────
  markRead: async (notificationId) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    const updated = get().notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },

  // ── markAllRead ───────────────────────────────────────────────────────────
  markAllRead: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    const updated = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },
}));

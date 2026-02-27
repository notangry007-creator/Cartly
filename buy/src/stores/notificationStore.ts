import { create } from 'zustand';
import { AppNotification } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
interface NotificationState {
  notifications: AppNotification[]; unreadCount: number;
  loadNotifications: (uid:string) => Promise<void>;
  addNotification: (uid:string, n:Omit<AppNotification,'id'|'userId'|'read'|'createdAt'>) => Promise<void>;
  markRead: (uid:string, id:string) => Promise<void>;
  markAllRead: (uid:string) => Promise<void>;
}
const nk = (uid:string) => STORAGE_KEYS.NOTIFICATIONS+'_'+uid;
export const useNotificationStore = create<NotificationState>((set,get) => ({
  notifications: [], unreadCount: 0,
  loadNotifications: async (uid) => {
    const ns = (await getItem<AppNotification[]>(nk(uid))) ?? [];
    set({ notifications:ns, unreadCount:ns.filter(n=>!n.read).length });
  },
  addNotification: async (uid, n) => {
    const newN: AppNotification = { ...n, id:uuid(), userId:uid, read:false, createdAt:new Date().toISOString() };
    const updated = [newN, ...get().notifications];
    await setItem(nk(uid), updated);
    set({ notifications:updated, unreadCount:updated.filter(n=>!n.read).length });
  },
  markRead: async (uid, id) => {
    const updated = get().notifications.map(n => n.id===id ? {...n,read:true} : n);
    await setItem(nk(uid), updated);
    set({ notifications:updated, unreadCount:updated.filter(n=>!n.read).length });
  },
  markAllRead: async (uid) => {
    const updated = get().notifications.map(n => ({...n,read:true}));
    await setItem(nk(uid), updated);
    set({ notifications:updated, unreadCount:0 });
  },
}));

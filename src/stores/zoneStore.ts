import { create } from 'zustand';
import { ZoneId } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
interface ZoneState { zoneId: ZoneId; hasSelectedZone: boolean; setZone: (id:ZoneId) => Promise<void>; loadZone: () => Promise<void>; }
export const useZoneStore = create<ZoneState>(set => ({
  zoneId: 'ktm_core', hasSelectedZone: false,
  loadZone: async () => {
    const saved = await getItem<{zoneId:ZoneId}>(STORAGE_KEYS.ZONE);
    if (saved?.zoneId) set({ zoneId: saved.zoneId, hasSelectedZone: true });
  },
  setZone: async (id) => { await setItem(STORAGE_KEYS.ZONE, { zoneId: id }); set({ zoneId: id, hasSelectedZone: true }); },
}));

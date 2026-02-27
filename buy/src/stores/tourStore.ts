import { create } from 'zustand';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';

interface TourState {
  hasSeen: boolean;
  isLoaded: boolean;
  loadTour: () => Promise<void>;
  markSeen: () => Promise<void>;
}

export const useTourStore = create<TourState>((set) => ({
  hasSeen: false,
  isLoaded: false,

  loadTour: async () => {
    const seen = await getItem<boolean>(STORAGE_KEYS.TOUR_SEEN);
    set({ hasSeen: !!seen, isLoaded: true });
  },

  markSeen: async () => {
    await setItem(STORAGE_KEYS.TOUR_SEEN, true);
    set({ hasSeen: true });
  },
}));

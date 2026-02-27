import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  init: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  wasOffline: false,

  init: () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? true;
      const { isOnline: prev } = get();
      set({
        isOnline: online,
        wasOffline: !online ? false : !prev, // wasOffline = just came back
      });
      // Reset wasOffline flag after 3 seconds
      if (online && !prev) {
        setTimeout(() => set({ wasOffline: false }), 3000);
      }
    });
    return unsubscribe;
  },
}));

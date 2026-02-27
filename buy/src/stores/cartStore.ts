import { create } from 'zustand';
import { CartItem } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
interface CartState {
  items: CartItem[]; isLoaded: boolean;
  loadCart: (userId:string) => Promise<void>;
  addItem: (userId:string, productId:string, variantId:string, qty?:number) => Promise<void>;
  removeItem: (userId:string, productId:string, variantId:string) => Promise<void>;
  updateQuantity: (userId:string, productId:string, variantId:string, qty:number) => Promise<void>;
  clearCart: (userId:string) => Promise<void>;
  getItemCount: () => number;
}
const ck = (uid:string) => STORAGE_KEYS.CART+'_'+uid;
export const useCartStore = create<CartState>((set, get) => ({
  items: [], isLoaded: false,
  loadCart: async (uid) => { const items = (await getItem<CartItem[]>(ck(uid))) ?? []; set({ items, isLoaded: true }); },
  addItem: async (uid, pid, vid, qty=1) => {
    const { items } = get();
    const ex = items.find(i => i.productId===pid && i.variantId===vid);
    const updated = ex
      ? items.map(i => i.productId===pid && i.variantId===vid ? {...i,quantity:i.quantity+qty} : i)
      : [...items, { productId:pid, variantId:vid, quantity:qty, addedAt:new Date().toISOString() }];
    await setItem(ck(uid), updated); set({ items: updated });
  },
  removeItem: async (uid, pid, vid) => {
    const updated = get().items.filter(i => !(i.productId===pid && i.variantId===vid));
    await setItem(ck(uid), updated); set({ items: updated });
  },
  updateQuantity: async (uid, pid, vid, qty) => {
    const updated = qty<=0
      ? get().items.filter(i => !(i.productId===pid && i.variantId===vid))
      : get().items.map(i => i.productId===pid && i.variantId===vid ? {...i,quantity:qty} : i);
    await setItem(ck(uid), updated); set({ items: updated });
  },
  clearCart: async (uid) => { await setItem(ck(uid), []); set({ items: [] }); },
  getItemCount: () => get().items.reduce((s,i) => s+i.quantity, 0),
}));

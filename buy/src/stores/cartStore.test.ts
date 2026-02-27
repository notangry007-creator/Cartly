/**
 * cartStore tests
 *
 * AsyncStorage is mocked via jest.setup.ts.
 * authStore is mocked so cartKey() returns a stable test user id without
 * needing a real login flow.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Mock authStore so cartKey() always returns a known user ──────────────────
jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'test-user-1' } }),
  },
}));

// Import the store AFTER the mock is registered
import { useCartStore } from './cartStore';

// Helper: get a fresh reference to the store state
const store = () => useCartStore.getState();

// Reset the store and AsyncStorage before every test
beforeEach(async () => {
  useCartStore.setState({ items: [], isLoaded: false });
  await AsyncStorage.clear();
});

// ─── loadCart ─────────────────────────────────────────────────────────────────

describe('loadCart', () => {
  it('starts with an empty cart and isLoaded=false', () => {
    expect(store().items).toHaveLength(0);
    expect(store().isLoaded).toBe(false);
  });

  it('loads previously persisted items from storage', async () => {
    const key = 'buy_cart_test-user-1';
    const persisted = [
      { productId: 'p1', variantId: 'v1', quantity: 2, addedAt: new Date().toISOString() },
    ];
    await AsyncStorage.setItem(key, JSON.stringify(persisted));

    await store().loadCart('test-user-1');

    expect(store().items).toHaveLength(1);
    expect(store().items[0].productId).toBe('p1');
    expect(store().isLoaded).toBe(true);
  });

  it('sets isLoaded=true even when storage is empty', async () => {
    await store().loadCart('test-user-1');
    expect(store().isLoaded).toBe(true);
    expect(store().items).toHaveLength(0);
  });
});

// ─── addItem ──────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds a new item to an empty cart', async () => {
    await store().addItem('p1', 'v1', 1);

    const { items } = store();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: 'p1', variantId: 'v1', quantity: 1 });
  });

  it('defaults quantity to 1 when not provided', async () => {
    await store().addItem('p1', 'v1');
    expect(store().items[0].quantity).toBe(1);
  });

  it('increments quantity when adding an existing product+variant', async () => {
    await store().addItem('p1', 'v1', 2);
    await store().addItem('p1', 'v1', 3);
    expect(store().items).toHaveLength(1);
    expect(store().items[0].quantity).toBe(5);
  });

  it('adds a distinct item when variant id differs', async () => {
    await store().addItem('p1', 'v1', 1);
    await store().addItem('p1', 'v2', 1);
    expect(store().items).toHaveLength(2);
  });

  it('adds a distinct item when product id differs', async () => {
    await store().addItem('p1', 'v1', 1);
    await store().addItem('p2', 'v1', 1);
    expect(store().items).toHaveLength(2);
  });

  it('persists the updated cart to AsyncStorage', async () => {
    await store().addItem('p1', 'v1', 1);

    const raw = await AsyncStorage.getItem('buy_cart_test-user-1');
    const stored = JSON.parse(raw!);
    expect(stored).toHaveLength(1);
    expect(stored[0].productId).toBe('p1');
  });

  it('is a no-op when no user is logged in', async () => {
    // Temporarily override the mock to simulate no user
    const { useAuthStore } = require('../stores/authStore');
    const original = useAuthStore.getState;
    useAuthStore.getState = () => ({ user: null });

    await store().addItem('p1', 'v1', 1);
    expect(store().items).toHaveLength(0);

    useAuthStore.getState = original;
  });
});

// ─── removeItem ───────────────────────────────────────────────────────────────

describe('removeItem', () => {
  beforeEach(async () => {
    await store().addItem('p1', 'v1', 2);
    await store().addItem('p2', 'v1', 1);
  });

  it('removes the matching product+variant from the cart', async () => {
    await store().removeItem('p1', 'v1');
    expect(store().items).toHaveLength(1);
    expect(store().items[0].productId).toBe('p2');
  });

  it('does nothing if the item does not exist', async () => {
    await store().removeItem('p99', 'v99');
    expect(store().items).toHaveLength(2);
  });

  it('persists the removal to AsyncStorage', async () => {
    await store().removeItem('p1', 'v1');
    const raw = await AsyncStorage.getItem('buy_cart_test-user-1');
    expect(JSON.parse(raw!)).toHaveLength(1);
  });
});

// ─── updateQuantity ───────────────────────────────────────────────────────────

describe('updateQuantity', () => {
  beforeEach(async () => {
    await store().addItem('p1', 'v1', 2);
  });

  it('updates the quantity of an existing item', async () => {
    await store().updateQuantity('p1', 'v1', 5);
    expect(store().items[0].quantity).toBe(5);
  });

  it('removes the item when quantity is set to 0', async () => {
    await store().updateQuantity('p1', 'v1', 0);
    expect(store().items).toHaveLength(0);
  });

  it('removes the item when quantity is set to a negative number', async () => {
    await store().updateQuantity('p1', 'v1', -1);
    expect(store().items).toHaveLength(0);
  });

  it('persists the quantity change to AsyncStorage', async () => {
    await store().updateQuantity('p1', 'v1', 7);
    const raw = await AsyncStorage.getItem('buy_cart_test-user-1');
    expect(JSON.parse(raw!)[0].quantity).toBe(7);
  });
});

// ─── clearCart ────────────────────────────────────────────────────────────────

describe('clearCart', () => {
  it('empties the in-memory cart', async () => {
    await store().addItem('p1', 'v1', 3);
    await store().addItem('p2', 'v2', 1);
    await store().clearCart();
    expect(store().items).toHaveLength(0);
  });

  it('writes an empty array to AsyncStorage', async () => {
    await store().addItem('p1', 'v1', 1);
    await store().clearCart();
    const raw = await AsyncStorage.getItem('buy_cart_test-user-1');
    expect(JSON.parse(raw!)).toHaveLength(0);
  });
});

// ─── getItemCount ─────────────────────────────────────────────────────────────

describe('getItemCount', () => {
  it('returns 0 for an empty cart', () => {
    expect(store().getItemCount()).toBe(0);
  });

  it('returns the sum of all quantities', async () => {
    await store().addItem('p1', 'v1', 3);
    await store().addItem('p2', 'v2', 2);
    expect(store().getItemCount()).toBe(5);
  });

  it('updates correctly after removing an item', async () => {
    await store().addItem('p1', 'v1', 3);
    await store().addItem('p2', 'v2', 2);
    await store().removeItem('p1', 'v1');
    expect(store().getItemCount()).toBe(2);
  });

  it('returns 0 after clearCart', async () => {
    await store().addItem('p1', 'v1', 5);
    await store().clearCart();
    expect(store().getItemCount()).toBe(0);
  });
});

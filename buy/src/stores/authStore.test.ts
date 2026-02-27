/**
 * authStore tests
 *
 * AsyncStorage and expo-secure-store are mocked via jest.setup.ts.
 * The seed data (DEMO_ADDRESSES) is the real module — only storage I/O is mocked.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';
import { STORAGE_KEYS } from '../utils/storage';

// Helper: get the current store state
const store = () => useAuthStore.getState();

// Reset store state and AsyncStorage before every test
beforeEach(async () => {
  useAuthStore.setState({ user: null, isLoading: false, isAuthenticated: false });
  await AsyncStorage.clear();
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('creates a new user when the phone has not been seen before', async () => {
    await store().login('9841234567', 'Test User');

    const { user, isAuthenticated } = store();
    expect(user).not.toBeNull();
    expect(user?.phone).toBe('9841234567');
    expect(user?.name).toBe('Test User');
    expect(isAuthenticated).toBe(true);
  });

  it('starts new users with NPR 500 wallet bonus', async () => {
    await store().login('9841234567', 'New User');
    expect(store().user?.walletBalance).toBe(500);
  });

  it('persists the new user to AsyncStorage', async () => {
    await store().login('9841234567', 'Persisted User');

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users = JSON.parse(raw!);
    expect(users).toHaveLength(1);
    expect(users[0].phone).toBe('9841234567');
  });

  it('reuses an existing user when the same phone logs in again', async () => {
    await store().login('9841234567', 'First Login');
    const firstId = store().user!.id;

    // Simulate a second login (new name, same phone)
    useAuthStore.setState({ user: null, isAuthenticated: false });
    await store().login('9841234567', 'Second Login');

    expect(store().user!.id).toBe(firstId);
  });

  it('updates the name of an existing user on re-login', async () => {
    await store().login('9841234567', 'Old Name');
    useAuthStore.setState({ user: null, isAuthenticated: false });

    await store().login('9841234567', 'New Name');
    expect(store().user?.name).toBe('New Name');
  });

  it('stores an optional email when provided', async () => {
    await store().login('9841234567', 'Email User', 'test@example.com');
    expect(store().user?.email).toBe('test@example.com');
  });

  it('sets isLoading=false after login completes', async () => {
    await store().login('9841234567', 'Test');
    expect(store().isLoading).toBe(false);
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears the in-memory user and sets isAuthenticated to false', async () => {
    await store().login('9841234567', 'Test User');
    await store().logout();

    expect(store().user).toBeNull();
    expect(store().isAuthenticated).toBe(false);
  });
});

// ─── loadUser ─────────────────────────────────────────────────────────────────

describe('loadUser', () => {
  it('loads a user from storage by id', async () => {
    await store().login('9841234567', 'Stored User');
    const userId = store().user!.id;

    // Reset in-memory state, then load
    useAuthStore.setState({ user: null, isAuthenticated: false });
    await store().loadUser(userId);

    expect(store().user?.id).toBe(userId);
    expect(store().isAuthenticated).toBe(true);
  });

  it('sets user=null and isAuthenticated=false for an unknown id', async () => {
    await store().loadUser('nonexistent-id');
    expect(store().user).toBeNull();
    expect(store().isAuthenticated).toBe(false);
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  beforeEach(async () => {
    await store().login('9841234567', 'Original Name');
  });

  it('updates name in memory and persists to storage', async () => {
    await store().updateProfile({ name: 'Updated Name' });

    expect(store().user?.name).toBe('Updated Name');

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users = JSON.parse(raw!);
    expect(users[0].name).toBe('Updated Name');
  });

  it('updates email without touching other fields', async () => {
    const originalName = store().user!.name;
    await store().updateProfile({ email: 'updated@test.com' });

    expect(store().user?.email).toBe('updated@test.com');
    expect(store().user?.name).toBe(originalName);
  });

  it('is a no-op when no user is logged in', async () => {
    useAuthStore.setState({ user: null });
    // Should not throw
    await expect(store().updateProfile({ name: 'Ghost' })).resolves.toBeUndefined();
  });
});

// ─── creditWallet ─────────────────────────────────────────────────────────────

describe('creditWallet', () => {
  beforeEach(async () => {
    await store().login('9841234567', 'Wallet User');
  });

  it('increases the wallet balance by the given amount', async () => {
    const before = store().user!.walletBalance;
    await store().creditWallet(200);
    expect(store().user?.walletBalance).toBe(before + 200);
  });

  it('persists the new balance to AsyncStorage', async () => {
    const before = store().user!.walletBalance;
    await store().creditWallet(100);

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users = JSON.parse(raw!);
    expect(users[0].walletBalance).toBe(before + 100);
  });

  it('is a no-op when no user is logged in', async () => {
    useAuthStore.setState({ user: null });
    await expect(store().creditWallet(500)).resolves.toBeUndefined();
  });
});

// ─── debitWallet ──────────────────────────────────────────────────────────────

describe('debitWallet', () => {
  beforeEach(async () => {
    await store().login('9841234567', 'Wallet User');
  });

  it('decreases the wallet balance by the given amount', async () => {
    const before = store().user!.walletBalance; // 500
    await store().debitWallet(150);
    expect(store().user?.walletBalance).toBe(before - 150);
  });

  it('does not allow the balance to go below zero', async () => {
    await store().debitWallet(99999);
    expect(store().user?.walletBalance).toBe(0);
  });

  it('handles an exact debit of the full balance (results in 0)', async () => {
    const balance = store().user!.walletBalance;
    await store().debitWallet(balance);
    expect(store().user?.walletBalance).toBe(0);
  });

  it('persists the debited balance to AsyncStorage', async () => {
    const before = store().user!.walletBalance;
    await store().debitWallet(100);

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users = JSON.parse(raw!);
    expect(users[0].walletBalance).toBe(before - 100);
  });

  it('is a no-op when no user is logged in', async () => {
    useAuthStore.setState({ user: null });
    await expect(store().debitWallet(100)).resolves.toBeUndefined();
  });
});

// ─── wallet race condition (serialisation queue) ──────────────────────────────

describe('wallet serialisation (race condition prevention)', () => {
  beforeEach(async () => {
    await store().login('9841234567', 'Race User');
  });

  it('applies concurrent credits without losing any transaction', async () => {
    const initial = store().user!.walletBalance; // 500

    // Fire 5 concurrent credits of 100 each — without the mutex the final
    // balance would be non-deterministic (read-then-write races).
    await Promise.all([
      store().creditWallet(100),
      store().creditWallet(100),
      store().creditWallet(100),
      store().creditWallet(100),
      store().creditWallet(100),
    ]);

    expect(store().user?.walletBalance).toBe(initial + 500);
  });

  it('applies concurrent debit operations without losing any transaction', async () => {
    // First credit enough to ensure we don't floor at 0
    await store().creditWallet(500); // balance = 1000

    await Promise.all([
      store().debitWallet(100),
      store().debitWallet(100),
      store().debitWallet(100),
    ]);

    expect(store().user?.walletBalance).toBe(700);
  });

  it('serialises mixed credit and debit operations correctly', async () => {
    const initial = store().user!.walletBalance; // 500

    await Promise.all([
      store().creditWallet(300), // +300
      store().debitWallet(200),  // -200
      store().creditWallet(100), // +100
    ]);

    // Expected: 500 + 300 - 200 + 100 = 700
    expect(store().user?.walletBalance).toBe(initial + 200);
  });

  it('in-memory and persisted balances agree after concurrent operations', async () => {
    await Promise.all([
      store().creditWallet(100),
      store().creditWallet(100),
      store().debitWallet(50),
    ]);

    const inMemory = store().user?.walletBalance;
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const persisted = JSON.parse(raw!)[0].walletBalance;
    expect(inMemory).toBe(persisted);
  });
});

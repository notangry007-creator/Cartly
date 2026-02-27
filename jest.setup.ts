// ---------------------------------------------------------------------------
// Global mocks required for React Native modules that don't run in Node.
// This file runs via setupFiles (before the test framework loads) so
// only jest.mock() / module mocks are safe here — not beforeEach/afterEach.
// ---------------------------------------------------------------------------

// jest-expo's setup installs lazy getters for several globals via expo's
// "winter" runtime. When these getters fire during test execution (outside
// the module-loading phase), Jest throws:
//   "You are trying to import a file outside of the scope of the test code"
// Pre-define these properties eagerly to short-circuit the lazy getters.

// __ExpoImportMetaRegistry — expo's import.meta polyfill
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: { get: () => undefined, set: () => undefined, has: () => false },
  writable: true,
  configurable: true,
});

// structuredClone — Node ≥17 has it natively; define it here as a fallback
// so expo's lazy require('@ungap/structured-clone') is never triggered.
if (!global.structuredClone) {
  (global as typeof globalThis & { structuredClone: typeof structuredClone }).structuredClone =
    (val: unknown) => JSON.parse(JSON.stringify(val));
}

// Mock AsyncStorage — used by cartStore, authStore, notificationStore, etc.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock expo-secure-store — used by authStore for auth token/userId persistence
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

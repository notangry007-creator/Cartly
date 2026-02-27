Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: { get: () => undefined, set: () => undefined, has: () => false },
  writable: true,
  configurable: true,
});

if (!global.structuredClone) {
  (global as typeof globalThis & { structuredClone: typeof structuredClone }).structuredClone =
    (val: unknown) => JSON.parse(JSON.stringify(val));
}

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

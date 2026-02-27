/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.ts'],
  setupFilesAfterEnv: ['./jest.setup.after-framework.ts'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  transformIgnorePatterns: [
    '/node_modules/(?!(' + [
      'react-native',
      '@react-native',
      '@react-native-community',
      'expo',
      '@expo',
      'expo-modules-core',
      'zustand',
    ].join('|') + '))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo/src/winter/ImportMetaRegistry$': '<rootDir>/jest.mock.empty.js',
    '^expo/src/winter/installGlobal$': '<rootDir>/jest.mock.empty.js',
    '^expo/src/winter/runtime(.native)?$': '<rootDir>/jest.mock.empty.js',
  },
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/stores/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

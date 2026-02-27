/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  // Module mocks (run before the test framework is installed)
  setupFiles: ['./jest.setup.ts'],
  // beforeEach/afterEach globals (run after the test framework is installed)
  setupFilesAfterEnv: ['./jest.setup.after-framework.ts'],

  // Only match TypeScript test files
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],

  // Extend jest-expo's transformIgnorePatterns to include additional packages
  // that ship untranspiled ESM or TypeScript source:
  // - expo-modules-core (ships .ts source files, required by jest-expo setup)
  // - zustand, @tanstack, date-fns, uuid (ESM-first packages)
  transformIgnorePatterns: [
    '/node_modules/(?!(' + [
      'react-native',
      '@react-native',
      '@react-native-community',
      'expo',
      '@expo',
      'expo-modules-core',
      'zustand',
      '@tanstack',
      'date-fns',
      'uuid',
    ].join('|') + '))',
    // Disable transforming the reanimated Babel plugin itself
    '/node_modules/react-native-reanimated/plugin/',
  ],

  // Resolve the @/ path alias used throughout the project.
  // Also mock expo's winter runtime modules that use lazy `require()` via
  // property getters — this pattern triggers Jest's "import outside scope" error
  // when the getter fires during test execution (after module loading phase).
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo/src/winter/ImportMetaRegistry$': '<rootDir>/jest.mock.empty.js',
    '^expo/src/winter/installGlobal$': '<rootDir>/jest.mock.empty.js',
    '^expo/src/winter/runtime(.native)?$': '<rootDir>/jest.mock.empty.js',
  },

  // Coverage: focus on business-critical source files
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/stores/**/*.ts',
    'src/data/zones.ts',
    '!src/**/*.d.ts',
  ],
};

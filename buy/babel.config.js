module.exports = function (api) {
  api.cache(true);

  // babel-preset-expo auto-includes react-native-reanimated/plugin when the
  // package is installed. That plugin requires react-native-worklets which is
  // not available in the Jest/Node test environment.
  // Disable it via the preset's own `reanimated` option when running tests.
  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: [['babel-preset-expo', { reanimated: !isTest }]],
    plugins: isTest ? [] : [],
  };
};

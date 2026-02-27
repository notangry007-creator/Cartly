/**
 * Babel configuration used ONLY by Jest.
 * Differs from the main babel.config.js in one way:
 * the react-native-reanimated/plugin is omitted because it has a
 * peer dependency (react-native-worklets) that is not installed in
 * the test environment (it is only needed by the Metro bundler).
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // No react-native-reanimated/plugin here
  };
};

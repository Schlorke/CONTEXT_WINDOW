// Expo detects the pnpm workspace and watches the monorepo root; the `react-native`
// export condition selects @acme/ui's native implementation.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);

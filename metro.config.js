// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Ensure proper MIME types for JavaScript files
defaultConfig.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Fix for the WalletConnect QR Code modal
defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('crypto-browserify'),
  http: require.resolve('@tradle/react-native-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser.js'),
  path: require.resolve('path-browserify'),
};

// Ensure proper module resolution for packages
defaultConfig.watchFolders = [
  path.resolve(__dirname, 'node_modules'),
];

// Make sure web platform works correctly
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = defaultConfig;

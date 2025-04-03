// Learn more: https://docs.expo.dev/guides/customizing-webpack/
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Create default config
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: [
        '@walletconnect',
        '@walletconnect/client',
        '@walletconnect/qrcode-modal',
        'react-native-reanimated',
        '@react-native',
        'react-native-gesture-handler',
      ],
    },
  }, argv);

  // Set the entry point to our web-specific file
  config.entry = [
    path.resolve(__dirname, 'index.web.js'),
  ];

  // Provide proper interoperability between different module formats
  if (!config.resolve) {
    config.resolve = {};
  }

  // Aliases for web compatibility
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native': 'react-native-web',
  };

  // Node.js polyfills
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    http: require.resolve('@tradle/react-native-http'),
    https: require.resolve('https-browserify'),
    fs: false,
    net: false,
    tls: false,
    zlib: false,
  };

  // Provide global variables for polyfills
  if (!config.plugins) {
    config.plugins = [];
  }

  return config;
}; 
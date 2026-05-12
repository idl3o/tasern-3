const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore TypeScript version check
      webpackConfig.ignoreWarnings = [/Failed to parse source map/];

      // Add fallbacks for Web3 and MetaMask SDK dependencies
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...webpackConfig.resolve.fallback,
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify"),
          "assert": require.resolve("assert"),
          "http": require.resolve("stream-http"),
          "https": require.resolve("https-browserify"),
          "os": require.resolve("os-browserify/browser"),
          "url": require.resolve("url"),
          "buffer": require.resolve("buffer"),
          "process/browser": require.resolve("process/browser.js"),
          "process/browser.js": require.resolve("process/browser.js"),
        },
      };

      // Add plugins for globals
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      ];

      // Stub optional MetaMask SDK deps that webpack tries to resolve in browser builds
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@metamask/sdk-analytics': false,
        '@react-native-async-storage/async-storage': false,
      };

      return webpackConfig;
    },
  },
  typescript: {
    enableTypeChecking: true,
  },
};

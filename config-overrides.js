const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    url: require.resolve('url'),
    zlib: require.resolve('browserify-zlib'),
  });
  config.resolve.fallback = fallback;

  // Set up aliases FIRST before plugins
  config.resolve.alias = {
    ...config.resolve.alias,
    '@metamask/sdk-analytics$': path.resolve(__dirname, 'src/mocks/metamask-sdk-analytics.js'),
    '@metamask/sdk-analytics/dist/index.js': path.resolve(__dirname, 'src/mocks/metamask-sdk-analytics.js'),
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  config.ignoreWarnings = [/Failed to parse source map/];

  // Handle ESM modules properly
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: 'pre',
    loader: require.resolve('source-map-loader'),
    resolve: {
      fullySpecified: false,
    },
  });

  config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.tsx', '.js', '.jsx', '.mjs'];
  config.resolve.mainFields = ['browser', 'module', 'main'];

  // Disable cache to ensure alias takes effect
  config.cache = false;

  return config;
};

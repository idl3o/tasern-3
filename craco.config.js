module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore TypeScript version check
      webpackConfig.ignoreWarnings = [/Failed to parse source map/];
      return webpackConfig;
    },
  },
  typescript: {
    enableTypeChecking: true,
  },
};

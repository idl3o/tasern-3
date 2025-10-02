// Mock for @metamask/sdk-analytics to avoid openapi-fetch issues
module.exports = {
  Analytics: class Analytics {
    constructor() {}
    track() {}
    identify() {}
    reset() {}
  },
  __esModule: true,
  default: class Analytics {
    constructor() {}
    track() {}
    identify() {}
    reset() {}
  }
};

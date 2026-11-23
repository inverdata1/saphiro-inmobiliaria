module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.env.js"],
  globalSetup: "<rootDir>/jest.globalSetup.js",
  globalTeardown: "<rootDir>/jest.globalTeardown.js",
  testMatch: ["**/__tests__/**/*.test.js"],
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
};

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      frontendUrl: 'http://localhost:5173/',
      backendUrl: 'http://localhost:4000/',
    },
    // Add settings to improve test stability
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    // Retry tests that fail due to flakiness
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
    // Add settings for component tests
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
});

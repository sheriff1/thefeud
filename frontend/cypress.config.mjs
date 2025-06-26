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
    // Increase retry logic for CI environments
    retries: {
      runMode: 3, // Increased from 2 to 3
      openMode: 0,
    },
    // Add experimental settings for stability
    experimentalStudio: false,
    experimentalWebKitSupport: false,
    // Wait for network idle
    waitForAnimations: true,
    animationDistanceThreshold: 5,
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
      runMode: 3, // Increased from 2 to 3
      openMode: 0,
    },
    // Add stability settings for component tests
    waitForAnimations: true,
    animationDistanceThreshold: 5,
  },
});

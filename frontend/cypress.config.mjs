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
  },

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
});

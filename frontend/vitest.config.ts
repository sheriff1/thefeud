import { defineConfig } from 'vitest/config';

// Unit tests for pure logic (e.g. error-monitoring scrubbing). Component/e2e tests use Cypress.
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});

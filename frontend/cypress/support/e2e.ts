// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands.ts';

// Handle uncaught exceptions from Firebase
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore Firebase network errors during testing
  if (
    err.message &&
    err.message.includes('Firebase') &&
    err.message.includes('network-request-failed')
  ) {
    return false;
  }
  if (err.message && err.message.includes('auth/network-request-failed')) {
    return false;
  }
  // Return true to fail the test on other exceptions
  return true;
});

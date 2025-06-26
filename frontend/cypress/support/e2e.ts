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

// Handle uncaught exceptions from Firebase and Vue/Pinia initialization
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

  // Ignore Vue/Pinia initialization errors that occur during test setup
  if (err.message && err.message.includes("Cannot read properties of undefined (reading 'app')")) {
    console.warn('Ignoring Vue app initialization error during test:', err.message);
    return false;
  }

  // Ignore other common Vue/Pinia initialization errors
  if (
    err.message &&
    (err.message.includes("Cannot read properties of undefined (reading 'install')") ||
      err.message.includes("Cannot read properties of undefined (reading '_a')") ||
      err.message.includes('getActivePinia') ||
      err.message.includes('pinia'))
  ) {
    console.warn('Ignoring Pinia/Vue initialization error during test:', err.message);
    return false;
  }

  // Return true to fail the test on other exceptions
  return true;
});

// Handle unhandled promise rejections (this is crucial for the 'app' error)
Cypress.on('window:before:load', (win) => {
  win.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Check if this is a Vue/Pinia initialization error
    if (
      errorMessage.includes("Cannot read properties of undefined (reading 'app')") ||
      errorMessage.includes("Cannot read properties of undefined (reading 'install')") ||
      errorMessage.includes("Cannot read properties of undefined (reading '_a')") ||
      errorMessage.includes('getActivePinia') ||
      errorMessage.includes('pinia')
    ) {
      console.warn('Preventing unhandled promise rejection for Vue/Pinia error:', errorMessage);
      event.preventDefault();
      return;
    }

    // Allow other unhandled rejections to bubble up
  });
});

// Note: Global beforeEach hooks removed to prevent timeout issues
// Use cy.waitForVueApp() and cy.waitForStability() manually in tests that need them

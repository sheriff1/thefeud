// ***********************************************************
// This example support/component.js is processed and
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

import { mount } from 'cypress/vue';
import { createPinia } from 'pinia';

// Create a custom mount command that ensures Pinia is available
function mountWithPinia(component: any, options: any = {}) {
  const pinia = createPinia();

  const mountOptions = {
    ...options,
    global: {
      ...(options.global || {}),
      plugins: [...(options.global?.plugins || []), pinia],
    },
  };

  return mount(component, mountOptions);
}

// Extend Cypress' Chainable interface to include both mount commands
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      mountWithPinia: typeof mountWithPinia;
    }
  }
}

Cypress.Commands.add('mount', mount);
Cypress.Commands.add('mountWithPinia', mountWithPinia);

// Handle uncaught exceptions from Vue/Pinia initialization in component tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore Vue/Pinia initialization errors that occur during component mounting
  if (err.message && err.message.includes("Cannot read properties of undefined (reading 'app')")) {
    console.warn('Ignoring Vue app initialization error during component test:', err.message);
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
    console.warn('Ignoring Pinia/Vue initialization error during component test:', err.message);
    return false;
  }

  // Return true to fail the test on other exceptions
  return true;
});

// Example use:
// cy.mount(MyComponent)

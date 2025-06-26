/// <reference types="cypress" />

// cypress/support/urls.ts
export const frontendUrl = Cypress.env('frontendUrl');
export const backendUrl = Cypress.env('backendUrl');

// Generate a valid 4-character alphanumeric session ID for testing
export const generateTestSessionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Custom command to create a test session
Cypress.Commands.add('createTestSession', (sessionId?: string) => {
  const id = sessionId || generateTestSessionId();
  return cy.request('POST', `${backendUrl}api/create-session/${id}`).then(() => id);
});

// Custom command to clean up a test session
Cypress.Commands.add('cleanupTestSession', (sessionId: string) => {
  return cy.request({
    method: 'DELETE',
    url: `${backendUrl}api/delete-session/${sessionId}`,
    failOnStatusCode: false,
  });
});

// Custom command to wait for Vue app initialization
Cypress.Commands.add('waitForVueApp', () => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 15000; // 15 seconds timeout

      const checkVueApp = () => {
        // Check if we've exceeded timeout
        if (Date.now() - startTime > timeout) {
          console.warn('Vue app detection timed out, but continuing with test');
          resolve();
          return;
        }

        // Check for our custom mount indicator
        if ((win as any).__VUE_APP_MOUNTED__) {
          resolve();
          return;
        }

        // Check if Vue app is initialized
        if ((win as any).__VUE__ || (win as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
          resolve();
          return;
        }

        // Check if Pinia is available
        if ((win as any).__PINIA__) {
          resolve();
          return;
        }

        // Check if we can find Vue components in the DOM
        const vueElements = win.document.querySelectorAll('[data-v-]');
        if (vueElements.length > 0) {
          resolve();
          return;
        }

        // Check for basic Vue content indicators
        const appElement = win.document.querySelector('#app');
        if (appElement && appElement.children.length > 0) {
          resolve();
          return;
        }

        // Check for common Vue app content
        const commonElements = win.document.querySelectorAll('h1, .btn, .container, .page, .view');
        if (commonElements.length > 0) {
          resolve();
          return;
        }

        // Retry after a short delay
        setTimeout(checkVueApp, 100);
      };

      checkVueApp();
    });
  });
});

// Custom command to set test environment flags
Cypress.Commands.add('setTestEnvironment', () => {
  cy.window().then((win) => {
    // Set localStorage flags to prevent router redirects
    (win as any).localStorage.setItem('enteredFromHome', 'true');
    // Set a flag to indicate this is a test environment
    (win as any).localStorage.setItem('cypressTest', 'true');
  });
});

// Custom command to navigate to host view via UI
Cypress.Commands.add('navigateToHost', (sessionId: string) => {
  cy.visit(frontendUrl);
  // Set test environment flags before any navigation
  cy.window().then((win) => {
    if ((win as any).localStorage) {
      (win as any).localStorage.setItem('enteredFromHome', 'true');
      (win as any).localStorage.setItem('cypressTest', 'true');
    }
  });
  cy.get('input[placeholder*="Enter Session ID"]', { timeout: 10000 }).type(sessionId);
  cy.contains('Join as Host').click();
  cy.url({ timeout: 15000 }).should('include', `/host?sessionId=${sessionId}`);
});

// Custom command to navigate to team view via UI
Cypress.Commands.add('navigateToTeam', (sessionId: string) => {
  cy.visit(frontendUrl);
  // Set test environment flags before any navigation
  cy.window().then((win) => {
    if ((win as any).localStorage) {
      (win as any).localStorage.setItem('enteredFromHome', 'true');
      (win as any).localStorage.setItem('cypressTest', 'true');
    }
  });
  cy.get('input[placeholder*="Enter Session ID"]', { timeout: 10000 }).type(sessionId);
  cy.contains('Join as a Team Member').click();
  cy.url({ timeout: 15000 }).should('include', `/team?sessionId=${sessionId}`);
});

// Custom command to navigate to spectator view via UI
Cypress.Commands.add('navigateToSpectator', (sessionId: string) => {
  cy.visit(frontendUrl);
  // Set test environment flags before any navigation
  cy.window().then((win) => {
    if ((win as any).localStorage) {
      (win as any).localStorage.setItem('enteredFromHome', 'true');
      (win as any).localStorage.setItem('cypressTest', 'true');
    }
  });
  cy.get('input[placeholder*="Enter Session ID"]', { timeout: 10000 }).type(sessionId);
  cy.contains('Join as Spectator').click();
  cy.url({ timeout: 15000 }).should('include', `/spectator?sessionId=${sessionId}`);
});

// Custom command to navigate directly to a view (bypassing home page)
Cypress.Commands.add('navigateDirectToHost', (sessionId: string) => {
  cy.visit(`${frontendUrl.replace(/\/$/, '')}/host?sessionId=${sessionId}`);
  cy.url({ timeout: 15000 }).should('include', `/host?sessionId=${sessionId}`);
});

Cypress.Commands.add('navigateDirectToTeam', (sessionId: string) => {
  cy.visit(`${frontendUrl.replace(/\/$/, '')}/team?sessionId=${sessionId}`);
  cy.url({ timeout: 15000 }).should('include', `/team?sessionId=${sessionId}`);
});

Cypress.Commands.add('navigateDirectToSpectator', (sessionId: string) => {
  cy.visit(`${frontendUrl.replace(/\/$/, '')}/spectator?sessionId=${sessionId}`);
  cy.url({ timeout: 15000 }).should('include', `/spectator?sessionId=${sessionId}`);
});

// Custom command to wait for DOM stability (prevents re-render issues)
Cypress.Commands.add('waitForStability', () => {
  // Wait for any pending Vue re-renders to complete
  cy.wait(100);

  // Check that the DOM isn't changing by comparing snapshots
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      let previousHtml = win.document.documentElement.outerHTML;

      const checkStability = () => {
        const currentHtml = win.document.documentElement.outerHTML;

        if (currentHtml === previousHtml) {
          // DOM is stable
          resolve();
          return;
        }

        // DOM changed, update snapshot and check again
        previousHtml = currentHtml;
        setTimeout(checkStability, 50);
      };

      setTimeout(checkStability, 50);
    });
  });
});

// Custom command to safely click elements that might re-render
Cypress.Commands.add('safeClick', (selector: string, options = {}) => {
  // Wait for element to be available and stable
  cy.get(selector, { timeout: 15000 }).should('exist');
  cy.get(selector).should('be.visible');

  // Check if it's not disabled (skip this check for non-form elements)
  cy.get(selector).then(($el) => {
    if ($el.is('button, input, select, textarea')) {
      cy.wrap($el).should('not.be.disabled');
    }
  });

  // Add a delay to ensure DOM stability (longer for CI)
  cy.wait(100);

  // Perform the click with retry logic
  cy.get(selector).click(options);

  // Add a small wait after click for any resulting DOM changes
  cy.wait(50);
});

// Custom command to safely type in elements that might re-render
Cypress.Commands.add('safeType', (selector: string, text: string, options = {}) => {
  // Wait for element to be available and stable
  cy.get(selector, { timeout: 15000 }).should('exist');
  cy.get(selector).should('be.visible').should('not.be.disabled');

  // Add a delay to ensure DOM stability (longer for CI)
  cy.wait(100);

  // Perform the type action
  cy.get(selector).type(text, options);

  // Add a small wait after typing
  cy.wait(50);
});

declare global {
  namespace Cypress {
    interface Chainable {
      createTestSession(sessionId?: string): Chainable<string>;
      cleanupTestSession(sessionId: string): Chainable<any>;
      navigateToHost(sessionId: string): Chainable<void>;
      navigateToTeam(sessionId: string): Chainable<void>;
      navigateToSpectator(sessionId: string): Chainable<void>;
      navigateDirectToHost(sessionId: string): Chainable<void>;
      navigateDirectToTeam(sessionId: string): Chainable<void>;
      navigateDirectToSpectator(sessionId: string): Chainable<void>;
      setTestEnvironment(): Chainable<void>;
      waitForVueApp(): Chainable<void>;
      waitForStability(): Chainable<void>;
      safeClick(selector: string, options?: any): Chainable<void>;
      safeType(selector: string, text: string, options?: any): Chainable<void>;
    }
  }
}

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

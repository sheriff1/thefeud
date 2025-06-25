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

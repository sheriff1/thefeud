import { frontendUrl } from '../support/commands';

describe('Host Dashboard', () => {
  let testSessionId: string;

  before(() => {
    // Create a single test session for all tests in this suite
    cy.createTestSession().then((sessionId) => {
      testSessionId = sessionId;
      cy.navigateDirectToHost(testSessionId);
      // Wait for the page to fully load and render
      cy.get('h1', { timeout: 15000 }).should('exist');
      // Additional verification that we're on the right page
      cy.url().should('include', `/host?sessionId=${testSessionId}`);
    });
  });

  beforeEach(() => {
    // Ensure we're still on the host page and prevent unwanted navigation
    cy.url().then((url) => {
      if (!url.includes('/host')) {
        cy.log('Not on host page, navigating back...');
        cy.navigateDirectToHost(testSessionId);
        cy.get('h1', { timeout: 15000 }).should('exist');
      }
    });

    // Set test environment flags to prevent router redirects
    cy.window().then((win) => {
      if ((win as any).localStorage) {
        (win as any).localStorage.setItem('enteredFromHome', 'true');
        (win as any).localStorage.setItem('cypressTest', 'true');
      }
    });
  });

  after(() => {
    // Clean up session after all tests
    if (testSessionId) {
      cy.cleanupTestSession(testSessionId);
    }
  });

  /* ------------ Host Dashboard Tests ------------ */
  it('should load the host dashboard', () => {
    cy.get('h1').should('contain', 'The Feud Host Dashboard');
    cy.url().should('include', `/host?sessionId=${testSessionId}`);
  });

  /* ---- Manage Question and Answers section ---- */
  it('should show game management section', () => {
    cy.contains('Game Manager').should('be.visible');
  });

  it('should show start round functionality', () => {
    // Initially should show "Start Round" button
    cy.contains('Start Round').should('be.visible');
    cy.contains("Let's get started!").should('be.visible');
  });

  it('should allow starting a round', () => {
    // Click "Start Round" to advance to step 2 using safe command
    cy.safeClick('button:contains("Start Round")');
    cy.contains('Add Question & Answers').should('be.visible');
  });

  it('should have CSV upload functionality', () => {
    // Navigate to step 2 if not already there - use a more stable approach
    cy.get('body').then(($body) => {
      if (!$body.text().includes('Add Question & Answers')) {
        cy.safeClick('button:contains("Start Round")');
        cy.wait(500); // Wait for navigation to complete
      }
    });
    cy.contains('Upload CSV File').should('be.visible');
  });

  it('should have library selection functionality', () => {
    // Navigate to step 2 if not already there
    cy.get('body').then(($body) => {
      if (!$body.text().includes('Add Question & Answers')) {
        cy.safeClick('button:contains("Start Round")');
        cy.wait(500); // Wait for navigation to complete
      }
    });
    cy.contains('Select from library').should('be.visible');
  });

  it('should allow manual entry of questions and answers', () => {
    // Navigate to step 2 if not already there
    cy.get('body').then(($body) => {
      if (!$body.text().includes('Add Question & Answers')) {
        cy.safeClick('button:contains("Start Round")');
        cy.wait(500); // Wait for navigation to complete
      }
    });
    cy.safeClick('button:contains("Enter manually")');
    cy.get('input[placeholder*="question"]').should('be.visible');
  });

  /* ---- Manual Overrides section ---- */
  it('should show manual overrides section', () => {
    cy.contains('Manual Overrides');
  });

  /* ---- Timer section ---- */
  it('should show timer controls', () => {
    cy.contains('Timer');
    cy.get('button').contains('Start').should('exist');
    cy.get('button').contains('Stop').should('exist');
    cy.get('button').contains('Reset').should('exist');
  });

  it('should allow setting timer value', () => {
    cy.get('input[type="number"]').last().clear();
    cy.safeType('input[type="number"]:last', '60');
    cy.get('input[type="number"]').last().should('have.value', '60');
  });

  /* ---- Game Controls section ---- */
  it('should show game control buttons', () => {
    cy.contains('Reset Game').should('exist');
    cy.contains('Reset Round').should('exist');
  });

  /* ---- Floating Button section ---- */
  it('should show floating buttons', () => {
    cy.get('.floating-buttons').should('be.visible');
    cy.contains('Log Out').should('be.visible');
  });

  it('should open invite dialog when session ID button is clicked', () => {
    // Ensure the session ID box is fully loaded and visible
    cy.get('.session-id-box').should('be.visible');
    cy.wait(200); // Extra wait for CI stability

    cy.safeClick('.session-id-box');
    cy.get('.modal', { timeout: 10000 }).should('be.visible');
    cy.contains('Invite Others').should('be.visible');
  });

  it('should close invite dialog when close button is clicked', () => {
    // Ensure the session ID box is fully loaded and visible
    cy.get('.session-id-box').should('be.visible');
    cy.wait(200); // Extra wait for CI stability

    cy.safeClick('.session-id-box');
    cy.get('.modal-box', { timeout: 10000 }).should('be.visible');

    // Directly target the close button without using .within() to avoid context issues
    cy.get('.modal-box label:contains("Close")')
      .should('be.visible')
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait(500); // Wait for modal to close
    cy.get('.modal').should('not.exist');

    // Verify we're still on the host page
    cy.url().should('include', `/host?sessionId=${testSessionId}`);
  });
});

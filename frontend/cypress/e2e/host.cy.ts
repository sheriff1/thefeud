import { frontendUrl } from '../support/commands';

describe('Host Dashboard', () => {
  // Every test gets its own session and a freshly loaded page. Cypress test isolation resets the
  // browser to about:blank before each test anyway, and the host page restores game state (e.g.
  // the current step) from the server over a socket *after* it renders. A test that relied on an
  // earlier test having advanced the step could therefore observe step 1 for a moment and click
  // "Start Round" just as the restored step 2 replaced it (flaky on slow CI runners, #71).
  let testSessionId: string;

  // Advance from step 1 to step 2 ("Add Question & Answers") from a known starting state.
  const goToStep2 = () => {
    cy.safeClick('button:contains("Start Round")');
    cy.contains('Add Question & Answers').should('be.visible');
  };

  beforeEach(() => {
    cy.createTestSession().then((sessionId) => {
      testSessionId = sessionId;
      cy.navigateDirectToHost(testSessionId);
      cy.get('h1', { timeout: 15000 }).should('exist');
    });

    // Set test environment flags to prevent router redirects
    cy.window().then((win) => {
      win.localStorage.setItem('enteredFromHome', 'true');
      win.localStorage.setItem('cypressTest', 'true');
    });
  });

  afterEach(() => {
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
    goToStep2();
  });

  it('should have CSV upload functionality', () => {
    goToStep2();
    cy.contains('Upload CSV File').should('be.visible');
  });

  it('should have library selection functionality', () => {
    goToStep2();
    cy.contains('Select from library').should('be.visible');
  });

  it('should allow manual entry of questions and answers', () => {
    goToStep2();
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

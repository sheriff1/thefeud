import { frontendUrl } from '../support/commands';

describe('Spectator View', () => {
  let testSessionId: string;

  before(() => {
    // Create a single test session for all tests in this suite
    cy.createTestSession().then((sessionId) => {
      testSessionId = sessionId;
      cy.navigateDirectToSpectator(testSessionId);
      // Wait for the page to fully load and render
      cy.get('h1', { timeout: 15000 }).should('exist');
    });
  });

  beforeEach(() => {
    // If we're not on the spectator page, navigate back to it
    cy.url().then((url) => {
      if (!url.includes('/spectator')) {
        cy.navigateDirectToSpectator(testSessionId);
        cy.get('h1', { timeout: 15000 }).should('exist');
      }
    });
  });

  after(() => {
    // Clean up session after all tests
    if (testSessionId) {
      cy.cleanupTestSession(testSessionId);
    }
  });

  it('should load the spectator view', () => {
    cy.contains('The Feud!');
    cy.url().should('include', `/spectator?sessionId=${testSessionId}`);
  });

  it('should show main gameboard without join dialog', () => {
    cy.get('.join-team-dialog-backdrop').should('not.exist');
    cy.get('.answers-container, .no-answers-message').should('be.visible');
  });

  it('should display all game elements for spectators', () => {
    cy.get('.answers-container, .no-answers-message').should('be.visible');
    cy.get('.team-info').should('have.length', 2);
    cy.contains('Round');
    cy.contains('Time Remaining');
    cy.contains('Points Pool');
  });

  it('should show floating buttons for spectators', () => {
    cy.get('.floating-buttons').should('be.visible');
    cy.contains('Sound On').should('be.visible');
  });

  it('should not show team edit buttons for spectators', () => {
    cy.get('button').contains('✏️').should('not.exist');
  });

  it('should not show buzzer buttons for spectators', () => {
    cy.get('button').contains('Buzz').should('not.exist');
  });

  it('should show invite dialog correctly', () => {
    cy.safeClick('.session-id-box');
    cy.get('.modal').should('be.visible');
    cy.contains('Invite Others');

    // Should have spectator-specific invite options
    cy.contains('Copy Session ID').should('be.visible');
    cy.contains('Copy Invite Team Member Link').should('be.visible');
    cy.contains('Copy Invite Spectator Link').should('be.visible');
  });

  it('should close invite dialog correctly', () => {
    cy.safeClick('.session-id-box');
    cy.get('.modal').should('be.visible');

    // Close the modal using the most reliable method - ESC key
    cy.get('body').type('{esc}');

    cy.get('.modal').should('not.exist', { timeout: 5000 });
  });

  it('should display team information', () => {
    cy.contains('Team A');
    cy.contains('Team B');
    cy.get('.team-info').should('have.length', 2);
  });

  it('should show default game state', () => {
    cy.contains('Round');
    cy.contains('0:00');
    cy.contains('Points Pool');
    cy.contains('No answers available yet');
  });

  it('should handle mute functionality', () => {
    cy.safeClick('button:contains("Sound On")');
    cy.contains('Sound Off').should('be.visible');
  });

  it('should display team scores', () => {
    cy.get('.team-info').each(($panel) => {
      cy.wrap($panel).should('contain', '0'); // Default score
    });
  });
});

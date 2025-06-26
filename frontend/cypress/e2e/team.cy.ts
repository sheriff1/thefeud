import { frontendUrl } from '../support/commands';

describe('Team Display', () => {
  let testSessionId: string;

  before(() => {
    // Create a single test session for all tests in this suite
    cy.createTestSession().then((sessionId) => {
      testSessionId = sessionId;
      cy.navigateDirectToTeam(testSessionId);
      // Wait for the page to fully load and render
      cy.get('h1', { timeout: 15000 }).should('exist');
    });
  });

  beforeEach(() => {
    // If we're not on the team page, navigate back to it
    cy.url().then((url) => {
      if (!url.includes('/team')) {
        cy.navigateDirectToTeam(testSessionId);
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

  /* ------------ Team Display Tests ------------ */
  it('should load the team display', () => {
    cy.contains('The Feud!');
    cy.url().should('include', `/team?sessionId=${testSessionId}`);
  });

  /* ---- Join Team Dialog section ---- */
  it('should show join team dialog on first visit', () => {
    cy.get('.join-team-dialog-backdrop').should('be.visible');
    cy.contains('Join the Game');
    cy.get('input[type="radio"]').should('have.length', 2);
    cy.get('button').contains('Join').should('be.disabled');
  });

  it('should allow player name input', () => {
    cy.safeType('input[placeholder*="Enter your name"]', 'John Doe');
    cy.get('input[placeholder*="Enter your name"]').should('have.value', 'John Doe');
  });

  it('should enable join button when name is entered and team is selected', () => {
    cy.safeType('input[placeholder*="Enter your name"]', 'Jane Smith');
    cy.safeClick('input[type="radio"]:first');
    cy.get('button').contains('Join').should('not.be.disabled');
  });

  it('should successfully join a team', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Alice Johnson');
    cy.get('input[type="radio"]').last().click();
    cy.get('button').contains('Join').click();
    cy.get('.join-team-dialog-backdrop').should('not.exist');
    cy.get('.answers-container, .no-answers-message').should('be.visible');
  });

  /* ---- Answers Board section ---- */
  it('should show answers board after joining team', () => {
    // Join team first
    cy.get('input[placeholder*="Enter your name"]').type('Test Player');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.get('.answers-container, .no-answers-message').should('be.visible');
    cy.contains('No answers available yet');
  });

  /* ---- Team Panel section ---- */
  it('should display team panels after joining', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Test Player');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.contains('Team A');
    cy.contains('Team B');
    cy.get('.team-info').should('have.length', 2);
  });

  /* ---- Game Info section ---- */
  it('should display game info section', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Test Player');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.contains('Round');
    cy.contains('Time Remaining');
    cy.contains('Points Pool');
  });

  /* ---- Floating Button section ---- */
  it('should show floating buttons after joining team', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Test Player');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.get('.floating-buttons').should('be.visible');
    cy.contains('Sound On').should('be.visible');
  });

  it('should open invite dialog when session ID button is clicked', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Test Player');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.get('.session-id-box').click();
    cy.get('.modal').should('be.visible');
    cy.contains('Invite Others');
  });

  it('should toggle mute functionality', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Test Player');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.contains('Sound On').click();
    cy.contains('Sound Off').should('be.visible');
  });

  /* ---- Team interaction ---- */
  it('should show player in correct team after joining', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Player One');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.get('.team-info').first().should('contain', 'Player One');
  });

  it('should show edit button for team member', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Team Leader');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    cy.get('.team-info').first().find('button').contains('✏️').should('be.visible');
  });

  /* ---- Real-time updates ---- */
  it('should display current game state', () => {
    cy.get('input[placeholder*="Enter your name"]').type('Spectator');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();

    // Game info should show default values
    cy.contains('Round');
    cy.contains('0:00');
    cy.contains('Points Pool');
  });
});

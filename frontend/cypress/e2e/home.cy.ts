import { frontendUrl, backendUrl } from '../support/commands';

describe('Home Page', () => {
  it('should load', () => {
    cy.visit(frontendUrl);
    cy.contains('The Feud');
  });

  /* ------------ Home Page Tests ------------ */
  // Test for create new session button
  it('should create a new session', () => {
    cy.visit(frontendUrl);
    cy.get('button').contains('Create a New Session').click();
    cy.url().should('include', '/host?sessionId=');
  });

  // Test for Join as host button - with session ID input
  it('should allow a user to join as host to an existing session', function () {
    cy.fixture('session').then((data) => {
      const sessionId = data.sessionId;
      cy.request('POST', `${backendUrl}api/create-session/${sessionId}`).then(() => {
        cy.visit(frontendUrl);
        cy.get('input[placeholder="Enter Session ID"]').type(sessionId);
        cy.get('button').contains('Join as Host').click();
        cy.url().should('include', `/host?sessionId=${sessionId}`);
      });
    });
  });

  // Test for Join as a team member button - with session ID input
  it('should allow a user to join as a team member to an existing session', function () {
    cy.fixture('session').then((data) => {
      const sessionId = data.sessionId;
      cy.request('POST', `${backendUrl}api/create-session/${sessionId}`).then(() => {
        cy.visit(frontendUrl);
        cy.get('input[placeholder="Enter Session ID"]').type(sessionId);
        cy.get('button').contains('Join as a Team Member').click();
        cy.url().should('include', `/team?sessionId=${sessionId}`);
      });
    });
  });

  // Test for Join as a spectator button - with session ID input
  it('should allow a user to join as a spectator to an existing session', function () {
    cy.fixture('session').then((data) => {
      const sessionId = data.sessionId;
      cy.request('POST', `${backendUrl}api/create-session/${sessionId}`).then(() => {
        cy.visit(frontendUrl);
        cy.get('input[placeholder="Enter Session ID"]').type(sessionId);
        cy.get('button').contains('Join as Spectator').click();
        cy.url().should('include', `/spectator?sessionId=${sessionId}`);
      });
    });
  });

  // Test for Join as host button - without session ID input [ERROR]
  it('should cause an error when a user presses join as host button without session ID input', () => {
    cy.visit(frontendUrl);
    cy.get('button').contains('Join as Host').click();
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Invalid Session ID format.');
    });
  });

  // Test for Join as a team member button - without session ID input [ERROR]
  it('should cause an error when a user presses join as a team member button without session ID input', () => {
    cy.visit(frontendUrl);
    cy.get('button').contains('Join as a Team Member').click();
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Invalid Session ID format.');
    });
  });

  // Test for Join as a spectator button - without session ID input [ERROR]
  it('should cause an error when a user presses join as spectator button without session ID input', () => {
    cy.visit(frontendUrl);
    cy.get('button').contains('Join as Spectator').click();
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Invalid Session ID format.');
    });
  });

  it('logs out after inactivity timeout - host', () => {
    cy.visit(frontendUrl);
    cy.get('button').contains('Create a New Session').click();
    cy.url().should('include', '/host?sessionId=');

    // Wait for the short timeout (e.g., 1 second)
    cy.wait(1100);

    // Assert that the user is redirected to Home or sees the login screen
    cy.url().should('include', '/home');
    cy.contains('Welcome to The Feud!'); // or whatever your home page shows
  });
});

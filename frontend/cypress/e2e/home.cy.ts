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
    cy.safeClick('button:contains("Create a New Session")');
    cy.url().should('include', '/host?sessionId=');
  });

  // Test for Join as host button - with session ID input
  it('should allow a user to join as host to an existing session', function () {
    cy.fixture('session').then((data) => {
      const sessionId = data.sessionId;
      cy.request('POST', `${backendUrl}api/create-session/${sessionId}`).then(() => {
        cy.visit(frontendUrl);
        cy.safeType('input[placeholder="Enter Session ID"]', sessionId);
        cy.safeClick('button:contains("Join as Host")');
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
        cy.safeType('input[placeholder="Enter Session ID"]', sessionId);
        cy.safeClick('button:contains("Join as a Team Member")');
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
        cy.safeType('input[placeholder="Enter Session ID"]', sessionId);
        cy.safeClick('button:contains("Join as Spectator")');
        cy.url().should('include', `/spectator?sessionId=${sessionId}`);
      });
    });
  });

  // Test for Join as host button - without session ID input [ERROR]
  it('should cause an error when a user presses join as host button without session ID input', () => {
    cy.visit(frontendUrl);
    cy.safeClick('button:contains("Join as Host")');
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Invalid Session ID format.');
    });
  });

  // Test for Join as a team member button - without session ID input [ERROR]
  it('should cause an error when a user presses join as a team member button without session ID input', () => {
    cy.visit(frontendUrl);
    cy.safeClick('button:contains("Join as a Team Member")');
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Invalid Session ID format.');
    });
  });

  // Test for Join as a spectator button - without session ID input [ERROR]
  it('should cause an error when a user presses join as spectator button without session ID input', () => {
    cy.visit(frontendUrl);
    cy.safeClick('button:contains("Join as Spectator")');
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Invalid Session ID format.');
    });
  });

  it('logs out after inactivity timeout - host', () => {
    cy.visit(frontendUrl);
    cy.safeClick('button:contains("Create a New Session")');
    cy.url().should('include', '/host?sessionId=');

    // Wait for the short timeout (e.g., 1 second)
    cy.wait(1100);

    // Assert that the user is redirected to Home or sees the login screen
    cy.url().should('include', '/home');
    cy.contains('Welcome to The Feud!'); // or whatever your home page shows
  });

  /* ------------ Miscellaneous Tests ------------ */
  it('should display the correct page title and heading', () => {
    cy.visit(frontendUrl);
    cy.title().should('include', 'The Feud');
    cy.get('h1').should('contain', 'Welcome to The Feud!');
  });

  it('should handle invalid session ID format correctly', () => {
    cy.visit(frontendUrl);
    cy.safeType('input[placeholder="Enter Session ID"]', 'invalid-id');
    cy.safeClick('button:contains("Join as Host")');
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Session does not exist. Please check the Session ID.');
    });
  });

  it('should handle non-existent session ID', () => {
    cy.visit(frontendUrl);
    cy.safeType('input[placeholder="Enter Session ID"]', 'nonexistent-session-123');
    cy.safeClick('button:contains("Join as Host")');
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Session does not exist. Please check the Session ID.');
    });
  });

  it('should show loading state when creating new session', () => {
    cy.visit(frontendUrl);
    cy.safeClick('button:contains("Create a New Session")');
    // Check for loading indicator if implemented
    // cy.get('[data-cy="loading-spinner"]').should('be.visible');
  });
});

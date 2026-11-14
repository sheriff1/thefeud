// Characterization tests for the invite dialog (clipboard copy + button text) and the Log Out
// button. They pin the current behavior so the #33 composables refactor can prove it changed
// nothing: what is copied for each option, the "Copied!"/"Error" label and its 2s reset, and what
// Log Out clears.
describe('Invite dialog and logout', () => {
  const INVITE_LABEL = 'Invite Others';
  let testSessionId: string;

  // Replace navigator.clipboard.writeText in the app window with a stub, before any click.
  const stubClipboard = (outcome: 'resolve' | 'reject') => {
    cy.window().then((win) => {
      const stub = cy.stub(win.navigator.clipboard, 'writeText');
      if (outcome === 'resolve') stub.resolves();
      else stub.rejects(new Error('denied'));
      cy.wrap(stub).as('writeText');
    });
  };

  const openInvite = () => {
    cy.get('.session-id-box').should('be.visible');
    cy.safeClick('.session-id-box');
    cy.get('.modal-box', { timeout: 10000 }).should('be.visible');
  };

  const joinAsPlayer = (name: string) => {
    cy.get('input[placeholder*="Enter your name"]').type(name);
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();
    cy.get('.floating-buttons').should('be.visible');
  };

  beforeEach(() => {
    cy.createTestSession().then((sessionId) => {
      testSessionId = sessionId;
    });
  });

  afterEach(() => {
    if (testSessionId) cy.cleanupTestSession(testSessionId);
  });

  describe('host', () => {
    beforeEach(() => {
      cy.navigateDirectToHost(testSessionId);
      cy.get('h1', { timeout: 15000 }).should('exist');
    });

    const hostOptions: [string, 'id' | 'host' | 'team' | 'spectator'][] = [
      ['Copy Session ID', 'id'],
      ['Invite Host Link', 'host'],
      ['Invite Team Member Link', 'team'],
      ['Invite Spectator Link', 'spectator'],
    ];

    hostOptions.forEach(([label, type]) => {
      it(`copies the right text for "${label}", shows Copied!, closes the dialog and resets`, () => {
        stubClipboard('resolve');
        openInvite();
        cy.get('.modal-box').contains('button', label).click();

        cy.location('origin').then((origin) => {
          const expected =
            type === 'id' ? testSessionId : `${origin}/${type}?sessionId=${testSessionId}`;
          cy.get('@writeText').should('have.been.calledOnceWithExactly', expected);
        });
        cy.get('.modal').should('not.exist');
        cy.get('.session-id-box').should('contain', 'Copied!').and('have.class', 'copied');
        // Back to the default label after 2 seconds.
        cy.get('.session-id-box', { timeout: 5000 }).should('contain', INVITE_LABEL);
        cy.get('.session-id-box').should('not.have.class', 'copied');
      });
    });

    it('shows Error, closes the dialog and resets when the clipboard write fails', () => {
      stubClipboard('reject');
      openInvite();
      cy.get('.modal-box').contains('button', 'Copy Session ID').click();

      cy.get('.modal').should('not.exist');
      cy.get('.session-id-box').should('contain', 'Error').and('have.class', 'error');
      cy.get('.session-id-box', { timeout: 5000 }).should('contain', INVITE_LABEL);
      cy.get('.session-id-box').should('not.have.class', 'error');
    });

    it('Log Out goes home and clears the stored session', () => {
      cy.safeClick('.logout-box');
      cy.url({ timeout: 15000 }).should('include', '/home');
      cy.contains('Welcome to The Feud!');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('sessionId')).to.equal(null);
        expect(win.localStorage.getItem('playerName')).to.equal(null);
        expect(win.localStorage.getItem('playerTeam')).to.equal(null);
      });
    });
  });

  describe('team member', () => {
    beforeEach(() => {
      cy.navigateDirectToTeam(testSessionId);
      cy.get('h1', { timeout: 15000 }).should('exist');
    });

    it('offers session ID, team and spectator links only, and copies the team link', () => {
      joinAsPlayer('Copy Tester');
      stubClipboard('resolve');
      openInvite();
      cy.get('.modal-box').should('not.contain', 'Host Link');
      cy.get('.modal-box').contains('button', 'Copy Invite Team Member Link').click();

      cy.location('origin').then((origin) => {
        cy.get('@writeText').should(
          'have.been.calledOnceWithExactly',
          `${origin}/team?sessionId=${testSessionId}`,
        );
      });
      cy.get('.modal').should('not.exist');
      cy.get('.session-id-box').should('contain', 'Copied!');
      cy.get('.session-id-box', { timeout: 5000 }).should('contain', INVITE_LABEL);
    });

    it('Log Out removes the player from the team, goes home and clears stored data', () => {
      joinAsPlayer('Logout Tester');
      cy.window().then((win) => {
        // The view prefixes a random emoji to the name.
        expect(win.localStorage.getItem('playerName')).to.contain('Logout Tester');
        expect(win.localStorage.getItem('playerTeam')).to.equal('A');
      });

      cy.safeClick('.logout-box');
      cy.url({ timeout: 15000 }).should('include', '/home');
      cy.contains('Welcome to The Feud!');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('sessionId')).to.equal(null);
        expect(win.localStorage.getItem('playerName')).to.equal(null);
        expect(win.localStorage.getItem('playerTeam')).to.equal(null);
      });
    });
  });

  describe('spectator', () => {
    it('copies the spectator link', () => {
      cy.navigateDirectToSpectator(testSessionId);
      cy.get('h1', { timeout: 15000 }).should('exist');
      stubClipboard('resolve');
      openInvite();
      cy.get('.modal-box').contains('button', 'Copy Invite Spectator Link').click();

      cy.location('origin').then((origin) => {
        cy.get('@writeText').should(
          'have.been.calledOnceWithExactly',
          `${origin}/spectator?sessionId=${testSessionId}`,
        );
      });
      cy.get('.session-id-box').should('contain', 'Copied!');
    });
  });
});

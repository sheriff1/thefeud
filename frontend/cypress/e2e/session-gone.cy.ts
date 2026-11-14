import { frontendUrl } from '../support/commands';

const base = frontendUrl.replace(/\/$/, '');

// #113: a dead or wrong session link ends on Home with a notice (no alert); a fresh host
// session is never redirected.
describe('Session gone redirect', () => {
  let alerts: string[];

  beforeEach(() => {
    alerts = [];
    cy.on('window:alert', (text) => alerts.push(text));
  });

  ['team', 'spectator'].forEach((view) => {
    it(`sends a never-created session on /${view} home with a notice, without an alert`, () => {
      cy.visit(`${base}/${view}?sessionId=ZZZ9`);
      cy.location('pathname', { timeout: 15000 }).should('eq', '/');
      cy.location('search').should('eq', '');
      cy.get('[data-cy=session-gone-notice]').should('be.visible');
      cy.then(() => expect(alerts).to.deep.equal([]));
    });
  });

  it('never redirects a freshly created host session', () => {
    const id = `H${Date.now().toString(36).slice(-3)}`.toUpperCase();
    cy.visit(`${base}/host?sessionId=${id}`);
    cy.get('h1', { timeout: 15000 }).should('exist');
    cy.wait(3000);
    cy.location('pathname').should('eq', '/host');
    cy.get('[data-cy=session-gone-notice]').should('not.exist');
    cy.then(() => expect(alerts).to.deep.equal([]));
    cy.cleanupTestSession(id);
  });

  it('sends a host link with an invalid session ID home with a notice', () => {
    cy.visit(`${base}/host?sessionId=bad`);
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
    cy.get('[data-cy=session-gone-notice]').should('be.visible');
    cy.then(() => expect(alerts).to.deep.equal([]));
  });
});

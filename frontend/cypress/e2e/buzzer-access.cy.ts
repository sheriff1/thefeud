import { GameStep } from '../../src/utils/gameSteps';

// #23: what a player sees depends on the host's buzzer assignment. The host is played by the
// hostUpdateGame task (a socket client sending update-game), so no host UI is needed.
describe('Buzzer access (player view)', () => {
  let sessionId: string;
  const hostSets = (patch: Record<string, unknown>) =>
    cy.task('hostUpdateGame', {
      sessionId,
      patch: { multiplierSet: true, scoreMultiplier: 2, ...patch },
    });

  // Cypress clears the page and storage before every test, so each test joins as "Al" again.
  const openAsAl = () => {
    cy.navigateDirectToTeam(sessionId);
    cy.get('input[placeholder*="Enter your name"]', { timeout: 15000 }).type('Al');
    cy.get('input[type="radio"]').first().click();
    cy.get('button').contains('Join').click();
    cy.get('.join-team-dialog-backdrop').should('not.exist');
    cy.get('.team-members-list').first().should('contain.text', 'Al');
  };

  before(() => {
    cy.createTestSession().then((id) => {
      sessionId = id;
    });
  });

  beforeEach(() => {
    openAsAl();
  });

  after(() => {
    if (sessionId) cy.cleanupTestSession(sessionId);
  });

  it('shows no buzzer while the host is still selecting buzzers', () => {
    hostSets({ currentStep: GameStep.SelectBuzzers });
    cy.contains('.team-info', 'Team A').should('exist');
    cy.get('.buzzer-button').should('not.exist');
  });

  it('shows a disabled "Buzzer: <name>" button when someone else was selected', () => {
    hostSets({ currentStep: GameStep.Buzzer, buzzerPlayers: { A: 'Ann', B: null } });
    cy.get('.buzzer-button').should('be.disabled').and('contain.text', 'Buzzer: Ann');
  });

  it('gives the selected player a live buzzer', () => {
    // Joining adds a random emoji to the name, so read the stored name from the page.
    cy.get('.team-members-list li')
      .first()
      .invoke('text')
      .then((text) => {
        hostSets({ currentStep: GameStep.Buzzer, buzzerPlayers: { A: text.trim(), B: null } });
      });
    cy.get('.buzzer-button').should('not.be.disabled').and('contain.text', 'BUZZER');
  });

  it('lets anyone buzz after Skip, and shows Buzzed! after the first buzz', () => {
    hostSets({ currentStep: GameStep.Buzzer, buzzerPlayers: { A: null, B: null } });
    cy.get('.buzzer-button').should('not.be.disabled').and('contain.text', 'BUZZER').click();
    cy.get('.buzzer-button').should('be.disabled').and('contain.text', 'Buzzed!');
  });
});

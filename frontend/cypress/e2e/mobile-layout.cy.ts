import { GameStep } from '../../src/utils/gameSteps';

// #131: on a phone the team and spectator pages must not scroll sideways, the buzzer is a
// full-width bar fixed to the bottom of the screen, and the main controls are 44px tall.
// The host is played by the hostUpdateGame task (a socket client), so no host UI is needed.
describe('Mobile layout (team and spectator views)', () => {
  let sessionId: string;
  const PHONES = [
    [360, 780],
    [390, 844],
  ];

  const noSidewaysScroll = (width: number) =>
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth, 'document width').to.be.at.most(width);
    });

  before(() => {
    cy.createTestSession().then((id) => {
      sessionId = id;
    });
  });

  after(() => {
    if (sessionId) cy.cleanupTestSession(sessionId);
  });

  PHONES.forEach(([width, height]) => {
    describe(`${width}px`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
      });

      it('team view fits the screen and keeps the buzzer bar in reach', () => {
        cy.navigateDirectToTeam(sessionId);
        // iOS Safari zooms into text fields under 16px and stays zoomed after joining.
        cy.get('input[placeholder*="Enter your name"]', { timeout: 15000 })
          .should(($input) => {
            expect(parseFloat(getComputedStyle($input[0]).fontSize)).to.be.at.least(16);
          })
          .type('Mo');
        cy.get('input[type="radio"]').first().click();
        cy.get('button').contains('Join').click();
        cy.get('.scoreboard').should('be.visible');
        cy.task('hostUpdateGame', {
          sessionId,
          patch: {
            multiplierSet: true,
            scoreMultiplier: 2,
            currentStep: GameStep.Buzzer,
            question: 'Name a dessert people bring to a family cookout',
            answers: [
              { id: '1', text: 'Pizza', points: 40 },
              { id: '2', text: 'Cake', points: 30 },
            ],
          },
        });
        // Not 'be.visible': in dev the Firebase emulator banner covers the bottom edge of the page.
        cy.get('.buzzer-button').should('exist').and('contain.text', 'BUZZER');
        // The bar is pinned to the bottom edge and spans the screen.
        cy.get('.buzzer-container').then(($bar) => {
          const rect = $bar[0].getBoundingClientRect();
          expect(getComputedStyle($bar[0]).position).to.equal('fixed');
          expect(Math.round(rect.bottom)).to.equal(height);
          // The bar spans the page's client width (a vertical scrollbar takes some of the viewport).
          expect(Math.round(rect.width)).to.equal(
            $bar[0].ownerDocument.documentElement.clientWidth,
          );
        });
        // Both team cards sit side by side above the board.
        cy.get('.team-slot').then(($slots) => {
          const a = $slots[0].getBoundingClientRect();
          const b = $slots[1].getBoundingClientRect();
          expect(Math.round(a.top)).to.equal(Math.round(b.top));
          expect(b.left).to.be.greaterThan(a.left);
        });
        cy.get('.answers-container').should('be.visible');
        noSidewaysScroll(width);
        cy.get('.team-header .btn').each(($btn) => {
          expect($btn[0].getBoundingClientRect().height).to.be.at.least(44);
        });
      });

      it('spectator view fits the screen', () => {
        cy.navigateDirectToSpectator(sessionId);
        cy.get('.scoreboard', { timeout: 15000 }).should('be.visible');
        cy.get('.buzzer-button').should('not.exist');
        noSidewaysScroll(width);
      });

      it('has a navbar that fits and floating buttons at least 44px tall', () => {
        cy.navigateDirectToSpectator(sessionId);
        cy.get('.app-navbar').should('be.visible');
        cy.get('.floating-buttons button').each(($btn) => {
          expect($btn[0].getBoundingClientRect().height).to.be.at.least(44);
        });
        noSidewaysScroll(width);
      });
    });
  });
});

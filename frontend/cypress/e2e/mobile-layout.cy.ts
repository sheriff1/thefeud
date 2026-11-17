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
            startingTeamSet: false,
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
        // The page leaves room for the bar while it shows, and both go away together (#141).
        cy.get('.gameboard-container').should('have.class', 'has-buzzer-bar');
        cy.task('hostUpdateGame', {
          sessionId,
          patch: { startingTeamSet: true, currentStep: GameStep.Guessing },
        });
        cy.get('.buzzer-container').should('not.exist');
        cy.get('.gameboard-container').should('not.have.class', 'has-buzzer-bar');
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

describe('Mobile layout (host dashboard)', () => {
  let sessionId: string;

  before(() => {
    cy.createTestSession().then((id) => {
      sessionId = id;
    });
  });

  after(() => {
    if (sessionId) cy.cleanupTestSession(sessionId);
  });

  [
    [360, 780],
    [390, 844],
  ].forEach(([width, height]) => {
    it(`fits a ${width}px phone with every step reachable and 44px controls`, () => {
      cy.viewport(width, height);
      cy.navigateDirectToHost(sessionId);
      cy.contains('h3', 'Game Manager', { timeout: 15000 }).should('be.visible');
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth, 'document width').to.be.at.most(width);
      });
      // All 8 steps sit inside the screen (they wrap into rows instead of running off it).
      cy.get('.steps .step').should('have.length', 8);
      cy.get('.steps .step').each(($step) => {
        const rect = $step[0].getBoundingClientRect();
        expect(rect.left).to.be.at.least(0);
        expect(rect.right).to.be.at.most(width);
      });
      // The floating buttons are part of the page flow, not fixed over the content.
      cy.get('.floating-buttons').should('have.css', 'position', 'static');
      // Buttons and text fields are at least 44px tall.
      cy.get('.host-page button, .host-page input[type="number"], .host-page input[type="text"]')
        .filter(':visible')
        .each(($el) => {
          expect(
            $el[0].getBoundingClientRect().height,
            $el[0].outerHTML.slice(0, 60),
          ).to.be.at.least(44);
        });
      // Labels sit above their fields instead of in a fixed-width column.
      cy.get('#team-a-score').then(($input) => {
        const label = Cypress.$('label[for="team-a-score"]')[0].getBoundingClientRect();
        expect(label.bottom).to.be.at.most($input[0].getBoundingClientRect().top + 1);
      });
    });
  });
});

// #147: Tailwind's `container` class caps widths at 640px from 640px up, which left the board
// narrower than the score strip on a landscape phone (641-767px wide).
describe('Mobile layout (landscape phone, 740px wide)', () => {
  let sessionId: string;

  before(() => {
    cy.createTestSession().then((id) => {
      sessionId = id;
      cy.task('hostUpdateGame', {
        sessionId,
        patch: {
          multiplierSet: true,
          scoreMultiplier: 2,
          currentStep: GameStep.Guessing,
          question: 'Name a dessert people bring to a family cookout',
          answers: [
            { id: '1', text: 'Pizza', points: 40 },
            { id: '2', text: 'Cake', points: 30 },
          ],
        },
      });
    });
  });

  after(() => {
    if (sessionId) cy.cleanupTestSession(sessionId);
  });

  beforeEach(() => {
    cy.viewport(740, 360);
  });

  const widthOf = (selector: string) =>
    cy.get(selector).then(($el) => Math.round($el[0].getBoundingClientRect().width));

  it('spectator: the board and game info are as wide as the score strip', () => {
    cy.navigateDirectToSpectator(sessionId);
    cy.get('.answers-container', { timeout: 15000 }).should('be.visible');
    widthOf('.scoreboard').then((strip) => {
      widthOf('.answers-container').should('equal', strip);
      widthOf('.game-info-container').should('equal', strip);
    });
  });

  it('host: the panels use the full width of the screen', () => {
    cy.navigateDirectToHost(sessionId);
    cy.contains('h3', 'Game Manager', { timeout: 15000 }).should('be.visible');
    cy.get('.host-page .container').each(($panel) => {
      const rect = $panel[0].getBoundingClientRect();
      const clientWidth = $panel[0].ownerDocument.documentElement.clientWidth;
      expect(Math.round(rect.width), 'panel width').to.be.at.least(clientWidth - 24);
    });
  });
});

// #143: the join dialog is about 416px tall. On a short screen (a phone in landscape) it used to
// be clipped above the screen and could not be scrolled, so the team choice and the Join button
// were out of reach. Chromium has no browser toolbars, so 667x300 stands in for a landscape phone
// whose toolbars are showing: the Join button starts below the fold there.
describe('Join dialog on short screens', () => {
  let sessionId: string;

  before(() => {
    cy.createTestSession().then((id) => {
      sessionId = id;
    });
  });

  after(() => {
    if (sessionId) cy.cleanupTestSession(sessionId);
  });

  [
    [667, 375],
    [740, 360],
    [844, 390],
    [667, 300],
  ].forEach(([width, height]) => {
    it(`can be reached and used at ${width}x${height}`, () => {
      cy.viewport(width, height);
      cy.navigateDirectToTeam(sessionId);
      cy.get('.join-team-dialog', { timeout: 15000 }).should('be.visible');
      // Not clipped above the screen, and the backdrop scrolls when the dialog is taller.
      cy.get('.join-team-dialog').then(($dialog) => {
        expect($dialog[0].getBoundingClientRect().top, 'dialog top').to.be.at.least(0);
      });
      cy.get('.join-team-dialog-backdrop').should('have.css', 'overflow-y', 'auto');
      cy.get('input[placeholder*="Enter your name"]').type('Mo');
      cy.get('input[type="radio"]').first().click();
      // Cypress scrolls the Join button into view before clicking, which needs the backdrop to scroll.
      cy.get('button').contains('Join').click();
      cy.get('.scoreboard', { timeout: 15000 }).should('be.visible');
    });
  });

  it('starts below the fold on a very short screen and scrolls to the Join button', () => {
    cy.viewport(667, 300);
    cy.navigateDirectToTeam(sessionId);
    cy.get('.join-team-dialog', { timeout: 15000 }).should('be.visible');
    cy.get('button')
      .contains('Join')
      .then(($join) => {
        const win = $join[0].ownerDocument.defaultView!;
        expect($join[0].getBoundingClientRect().bottom).to.be.greaterThan(win.innerHeight);
      });
    cy.get('button').contains('Join').scrollIntoView().should('be.visible');
  });

  [
    [390, 844],
    [1280, 720],
  ].forEach(([width, height]) => {
    it(`stays centred when it fits at ${width}x${height}`, () => {
      cy.viewport(width, height);
      cy.navigateDirectToTeam(sessionId);
      cy.get('.join-team-dialog', { timeout: 15000 }).should('be.visible');
      cy.get('.join-team-dialog').then(($dialog) => {
        const rect = $dialog[0].getBoundingClientRect();
        const win = $dialog[0].ownerDocument.defaultView!;
        const clientWidth = $dialog[0].ownerDocument.documentElement.clientWidth;
        expect(rect.top, 'space above vs below').to.be.closeTo(win.innerHeight - rect.bottom, 1);
        expect(rect.left, 'space left vs right').to.be.closeTo(clientWidth - rect.right, 1);
      });
    });
  });
});

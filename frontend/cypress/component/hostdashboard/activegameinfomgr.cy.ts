import ActiveGameInfoMgr from '@/components/hostDashboard/ActiveGameInfoMgr.vue';
import { mount } from 'cypress/vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '@/stores/gamestore';

describe('ActiveGameInfoMgr', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the game info container with all elements', () => {
    mount(ActiveGameInfoMgr);

    cy.get('.container').should('be.visible');
    cy.get('h3').should('contain.text', 'Game Info');
    cy.get('.active-game-info-grid').should('be.visible');
    cy.get('.team-info').should('have.length', 2);
    cy.get('.game-info-container').should('be.visible');
  });

  it('displays team information correctly', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.teamNames = { A: 'Alpha', B: 'Beta' };
      gameStore.teamScores = { A: 100, B: 200 };
    });

    cy.get('.team-info')
      .first()
      .within(() => {
        cy.get('h4').should('contain.text', 'Team Alpha');
        cy.get('.team-score').should('contain.text', '100');
      });

    cy.get('.team-info')
      .last()
      .within(() => {
        cy.get('h4').should('contain.text', 'Team Beta');
        cy.get('.team-score').should('contain.text', '200');
      });
  });

  it('displays game statistics correctly', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.roundCounter = 2;
      gameStore.pointPool = 150;
      gameStore.scoreMultiplier = 3;
    });

    cy.get('.game-info-container').within(() => {
      cy.get('.game-info-item').first().should('contain.text', '2').and('contain.text', 'Round');
      cy.get('.game-info-item')
        .eq(1)
        .should('contain.text', '150')
        .and('contain.text', 'Points Pool');
      cy.get('.game-info-item')
        .last()
        .should('contain.text', 'x3')
        .and('contain.text', 'Score Multiplier');
    });
  });

  it('displays team strikes correctly', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.teamStrikes = { A: 2, B: 1 };
    });

    cy.get('.team-info')
      .first()
      .within(() => {
        cy.get('.strike-x').should('have.length', 2);
        cy.get('svg').should('have.length', 2);
      });

    cy.get('.team-info')
      .last()
      .within(() => {
        cy.get('.strike-x').should('have.length', 1);
        cy.get('svg').should('have.length', 1);
      });
  });

  it('highlights the current active team', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.currentTeam = 'A';
    });

    cy.get('.team-info').first().should('have.class', 'active');
    cy.get('.team-info').last().should('not.have.class', 'active');
  });

  it('switches active team highlighting when current team changes', () => {
    mount(ActiveGameInfoMgr).then(({ wrapper }) => {
      const gameStore = useGameStore();
      gameStore.currentTeam = 'B';

      cy.then(() => {
        cy.get('.team-info').last().should('have.class', 'active');
        cy.get('.team-info').first().should('not.have.class', 'active');
      });
    });
  });

  it('handles empty team names gracefully', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.teamNames = { A: '', B: '' };
    });

    cy.get('.team-info').first().get('h4').should('contain.text', 'Team');
    cy.get('.team-info').last().get('h4').should('contain.text', 'Team');
  });

  it('displays zero scores correctly', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.teamScores = { A: 0, B: 0 };
    });

    cy.get('.team-score').first().should('contain.text', '0');
    cy.get('.team-score').last().should('contain.text', '0');
  });

  it('handles large score values', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.teamScores = { A: 9999, B: 10000 };
    });

    cy.get('.team-score').first().should('contain.text', '9999');
    cy.get('.team-score').last().should('contain.text', '10000');
  });

  it('displays strikes with proper SVG icons', () => {
    mount(ActiveGameInfoMgr).then(() => {
      const gameStore = useGameStore();
      gameStore.teamStrikes = { A: 1, B: 3 };
    });

    cy.get('.team-info')
      .first()
      .within(() => {
        cy.get('svg line').should('have.length', 2); // 2 lines per X
      });

    cy.get('.team-info')
      .last()
      .within(() => {
        cy.get('svg line').should('have.length', 6); // 4 lines per X, 3 X's
      });
  });

  it('has proper responsive layout structure', () => {
    mount(ActiveGameInfoMgr);

    cy.get('.active-game-info-grid').should('have.css', 'display', 'flex');
    cy.get('.team-info').should('have.css', 'flex-direction', 'column');
    cy.get('.game-info-container').should('be.visible');
  });
});

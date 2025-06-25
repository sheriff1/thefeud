import GameStatusMgr from '../../../src/components/hostDashboard/GameStatusMgr.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../../../src/stores/gamestore';

describe('GameStatusMgr', () => {
  let pinia: any;
  let gameStore: any;
  let defaultProps: any;

  beforeEach(() => {
    // Handle Vue DevTools errors in testing environment
    Cypress.on('uncaught:exception', (err, runnable) => {
      // Return false to prevent the error from failing the test
      if (err.message.includes("Cannot read properties of undefined (reading 'app')")) {
        return false;
      }
      return true;
    });

    pinia = createPinia();
    setActivePinia(pinia);
    gameStore = useGameStore();

    // Create stubs inside beforeEach where cy.stub() is available
    defaultProps = {
      updateGameState: cy.stub(),
      resetGame: cy.stub(),
      resetRound: cy.stub(),
      isLoading: false,
    };

    // Reset store to initial state
    gameStore.$reset();
  });

  it('renders correctly with default props', () => {
    cy.mount(GameStatusMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Game Controls').should('be.visible');
    cy.get('button').contains('Reset Game').should('be.visible').and('not.be.disabled');
    cy.get('button').contains('Reset Round').should('be.visible').and('not.be.disabled');
  });

  it('calls resetGame when Reset Game button is clicked', () => {
    const resetGame = cy.stub();
    const updateGameState = cy.stub();

    cy.mount(GameStatusMgr, {
      props: { ...defaultProps, resetGame, updateGameState },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Game').click();

    cy.then(() => {
      expect(resetGame).to.have.been.called;
      expect(updateGameState).to.have.been.calledWith(gameStore.$state);
    });
  });

  it('calls resetRound when Reset Round button is clicked', () => {
    const resetRound = cy.stub();
    const updateGameState = cy.stub();

    cy.mount(GameStatusMgr, {
      props: { ...defaultProps, resetRound, updateGameState },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Round').click();

    cy.then(() => {
      expect(resetRound).to.have.been.called;
      expect(updateGameState).to.have.been.calledWith(gameStore.$state);
    });
  });

  it('disables buttons when isLoading is true', () => {
    cy.mount(GameStatusMgr, {
      props: { ...defaultProps, isLoading: true },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Game').should('be.disabled');
    cy.get('button').contains('Reset Round').should('be.disabled');
  });

  it('enables buttons when isLoading is false', () => {
    cy.mount(GameStatusMgr, {
      props: { ...defaultProps, isLoading: false },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Game').should('not.be.disabled');
    cy.get('button').contains('Reset Round').should('not.be.disabled');
  });

  it('has proper styling and structure', () => {
    cy.mount(GameStatusMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('.container').should('have.class', 'bg-base-300');
    cy.get('.container').should('have.class', 'text-base-content');
    cy.get('h3').should('contain', 'Game Controls');
    cy.get('button').should('have.class', 'btn');
  });
});

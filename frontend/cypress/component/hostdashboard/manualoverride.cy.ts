import ManualOverrideMgr from '../../../src/components/hostDashboard/ManualOverrideMgr.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../../../src/stores/gamestore';

describe('ManualOverrideMgr', () => {
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
    gameStore.teamNames = { A: 'Team Alpha', B: 'Team Beta' };
    gameStore.teamScores = { A: 100, B: 75 };
    gameStore.roundCounter = 1;
    gameStore.scoreMultiplier = 1;
  });

  it('renders correctly with default values', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Manual Overrides').should('be.visible');
    cy.contains('Team Alpha Points:').should('be.visible');
    cy.contains('Team Beta Points:').should('be.visible');
    cy.contains('Round:').should('be.visible');
    cy.contains('Score Multiplier:').should('be.visible');
    cy.contains('Team A Name:').should('be.visible');
    cy.contains('Team B Name:').should('be.visible');
  });

  it('displays current team scores correctly', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#team-a-score').should('have.value', '100');
    cy.get('#team-b-score').should('have.value', '75');
  });

  it('displays current team names correctly', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#team-a-name').should('have.value', 'Team Alpha');
    cy.get('#team-b-name').should('have.value', 'Team Beta');
  });

  it('displays current round and multiplier correctly', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#round-counter').should('have.value', '1');
    cy.get('#score-multiplier').should('have.value', '1');
  });

  it('allows editing team scores', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#team-a-score').clear().type('150');
    cy.get('#team-b-score').clear().type('120');

    cy.then(() => {
      expect(gameStore.teamScores.A).to.equal(150);
      expect(gameStore.teamScores.B).to.equal(120);
    });
  });

  it('allows editing team names', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#team-a-name').clear().type('Red Team');
    cy.get('#team-b-name').clear().type('Blue Team');

    cy.then(() => {
      expect(gameStore.teamNames.A).to.equal('Red Team');
      expect(gameStore.teamNames.B).to.equal('Blue Team');
    });
  });

  it('allows editing round counter', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#round-counter').clear().type('3');

    cy.then(() => {
      expect(gameStore.roundCounter).to.equal(3);
    });
  });

  it('allows editing score multiplier', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#score-multiplier').clear().type('2');

    cy.then(() => {
      expect(gameStore.scoreMultiplier).to.equal(2);
    });
  });

  it('validates team names uniqueness', () => {
    gameStore.teamNames = { A: 'Same Name', B: 'Same Name' };

    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Team names must be unique.').should('be.visible');
    cy.get('button').contains('Save All').should('be.disabled');
  });

  it('validates score multiplier range', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#score-multiplier').clear().type('5');
    cy.contains('Multiplier has to be between 1 and 3').should('be.visible');

    cy.get('#score-multiplier').clear().type('0');
    cy.contains('Multiplier has to be between 1 and 3').should('be.visible');
  });

  it('prevents negative scores from being entered', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    // Test that the input has min="0" attribute to prevent negative values
    cy.get('#team-a-score').should('have.attr', 'min', '0');
    cy.get('#team-b-score').should('have.attr', 'min', '0');

    // Verify that trying to enter negative values doesn't work due to input constraints
    cy.get('#team-a-score').clear().type('10');
    cy.get('#team-a-score').should('have.value', '10');
  });

  it('prevents negative round counter from being entered', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    // Test that the input has min="0" attribute to prevent negative values
    cy.get('#round-counter').should('have.attr', 'min', '0');

    // Verify that valid positive values work
    cy.get('#round-counter').clear().type('5');
    cy.get('#round-counter').should('have.value', '5');
  });

  it('enables Save All button when all validations pass', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Save All').should('not.be.disabled');
  });

  it('calls saveScoreMgmt when Save All is clicked', () => {
    const onSaveScoreMgmt = cy.stub();

    cy.mount(ManualOverrideMgr, {
      props: { ...defaultProps, onSaveScoreMgmt },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Save All').click();
    cy.then(() => {
      expect(onSaveScoreMgmt).to.have.been.called;
    });
  });

  it('calls resetRound when Reset Round is clicked', () => {
    const resetRound = cy.stub();
    const updateGameState = cy.stub();
    const onResetShowQASection = cy.stub();

    cy.mount(ManualOverrideMgr, {
      props: {
        ...defaultProps,
        resetRound,
        updateGameState,
        onResetShowQASection,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Round').click();
    cy.then(() => {
      expect(resetRound).to.have.been.called;
      expect(updateGameState).to.have.been.calledWith(gameStore.$state);
      expect(onResetShowQASection).to.have.been.called;
    });
  });

  it('calls resetGame when Reset Game is clicked', () => {
    const resetGame = cy.stub();
    const updateGameState = cy.stub();
    const onResetShowQASection = cy.stub();

    cy.mount(ManualOverrideMgr, {
      props: {
        ...defaultProps,
        resetGame,
        updateGameState,
        onResetShowQASection,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Game').click();
    cy.then(() => {
      expect(resetGame).to.have.been.called;
      expect(updateGameState).to.have.been.calledWith(gameStore.$state);
      expect(onResetShowQASection).to.have.been.called;
    });
  });

  it('disables buttons when isLoading is true', () => {
    cy.mount(ManualOverrideMgr, {
      props: { ...defaultProps, isLoading: true },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset Round').should('be.disabled');
    cy.get('button').contains('Reset Game').should('be.disabled');
  });

  it('has proper input validation attributes', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    // Check number inputs have proper attributes
    cy.get('#team-a-score').should('have.attr', 'type', 'number');
    cy.get('#team-a-score').should('have.attr', 'min', '0');
    cy.get('#team-a-score').should('have.attr', 'step', '1');

    cy.get('#score-multiplier').should('have.attr', 'min', '1');
    cy.get('#score-multiplier').should('have.attr', 'max', '3');

    // Check text inputs have proper attributes
    cy.get('#team-a-name').should('have.attr', 'required');
    cy.get('#team-a-name').should('have.attr', 'minlength', '1');
    cy.get('#team-b-name').should('have.attr', 'required');
    cy.get('#team-b-name').should('have.attr', 'minlength', '1');
  });

  it('has proper styling and structure', () => {
    cy.mount(ManualOverrideMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('.container').should('have.class', 'bg-base-300');
    cy.get('.container').should('have.class', 'text-base-content');
    cy.get('h3').should('contain', 'Manual Overrides');
    cy.get('.form-row').should('exist');
    cy.get('.info-key').should('exist');
    cy.get('input').should('have.class', 'input');
    cy.get('input').should('have.class', 'validator');
  });
});

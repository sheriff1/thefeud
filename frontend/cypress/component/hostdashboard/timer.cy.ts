import TimerMgr from '../../../src/components/hostDashboard/TimerMgr.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../../../src/stores/gamestore';

describe('TimerMgr', () => {
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

    // Reset store to initial state
    gameStore.$reset();
    gameStore.timer = 30;
    gameStore.timerRunning = false;

    // Create stubs inside beforeEach where cy.stub() is available
    defaultProps = {
      timerInput: 30,
      startTimer: cy.stub(),
      stopTimer: cy.stub(),
      resetTimer: cy.stub(),
      setTimer: cy.stub(),
    };
  });

  it('renders correctly with default props', () => {
    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Timer').should('be.visible');
    cy.get('[data-cy="host-clock"]').should('contain.text', '0:30');
    cy.contains('Timer is stopped.').should('be.visible');
    cy.get('button').contains('Start').should('be.visible');
    cy.get('button').contains('Stop').should('be.visible');
    cy.get('button').contains('Reset').should('be.visible');
  });

  it('shows timer running status when timer is running', () => {
    gameStore.timerRunning = true;

    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Timer is running...').should('be.visible');
    cy.contains('Timer is stopped.').should('not.exist');
  });

  it('shows timer input when timer is not running', () => {
    gameStore.timerRunning = false;

    cy.mount(TimerMgr, {
      props: { ...defaultProps, timerInput: 45 },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').should('be.visible');
    cy.get('#timer-input').should('have.value', '45');
    cy.contains('Set Timer (seconds):').should('be.visible');
  });

  it('hides timer input when timer is running and not at 0', () => {
    gameStore.timerRunning = true;
    gameStore.timer = 15;

    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').should('not.exist');
    cy.contains('Set Timer (seconds):').should('not.exist');
  });

  it('shows timer input when timer is at 0 even if running', () => {
    gameStore.timerRunning = true;
    gameStore.timer = 0;

    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').should('be.visible');
    cy.contains('Set Timer (seconds):').should('be.visible');
  });

  it('calls startTimer when Start button is clicked', () => {
    const startTimer = cy.stub();

    cy.mount(TimerMgr, {
      props: { ...defaultProps, startTimer },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Start').click();
    cy.then(() => {
      expect(startTimer).to.have.been.called;
    });
  });

  it('calls stopTimer when Stop button is clicked', () => {
    const stopTimer = cy.stub();

    cy.mount(TimerMgr, {
      props: { ...defaultProps, stopTimer },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Stop').click();
    cy.then(() => {
      expect(stopTimer).to.have.been.called;
    });
  });

  it('calls resetTimer when Reset button is clicked', () => {
    const resetTimer = cy.stub();

    cy.mount(TimerMgr, {
      props: { ...defaultProps, resetTimer },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Reset').click();
    cy.then(() => {
      expect(resetTimer).to.have.been.called;
    });
  });

  it('emits update:timerInput when input value changes', () => {
    const onUpdateTimerInput = cy.stub();

    cy.mount(TimerMgr, {
      props: { ...defaultProps, 'onUpdate:timerInput': onUpdateTimerInput },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').clear().type('60');
    cy.then(() => {
      expect(onUpdateTimerInput).to.have.been.calledWith(60);
    });
  });

  it('calls setTimer when input value changes', () => {
    const setTimer = cy.stub();

    cy.mount(TimerMgr, {
      props: { ...defaultProps, setTimer },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').clear().type('45').blur();
    cy.then(() => {
      expect(setTimer).to.have.been.called;
    });
  });

  it('disables buttons when timer input is invalid', () => {
    cy.mount(TimerMgr, {
      props: { ...defaultProps, timerInput: 0 },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Start').should('be.disabled');
    cy.get('button').contains('Stop').should('be.disabled');
    cy.get('button').contains('Reset').should('be.disabled');
  });

  it('enables buttons when timer input is valid', () => {
    cy.mount(TimerMgr, {
      props: { ...defaultProps, timerInput: 30 },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Start').should('not.be.disabled');
    cy.get('button').contains('Stop').should('not.be.disabled');
    cy.get('button').contains('Reset').should('not.be.disabled');
  });

  it('shows validation error for negative timer input', () => {
    cy.mount(TimerMgr, {
      props: { ...defaultProps, timerInput: -5 },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Cannot be less than 0').should('be.visible');
  });

  it('has proper input validation attributes', () => {
    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').should('have.attr', 'type', 'number');
    cy.get('#timer-input').should('have.attr', 'min', '0');
    cy.get('#timer-input').should('have.attr', 'step', '1');
  });

  it('displays current timer from store', () => {
    gameStore.timer = 45;

    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('[data-cy="host-clock"]').should('contain.text', '0:45');
  });

  it('updates timer display when store timer changes', () => {
    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('[data-cy="host-clock"]').should('contain.text', '0:30');

    cy.then(() => {
      gameStore.timer = 60;
    });

    cy.get('[data-cy="host-clock"]').should('contain.text', '1:00');
  });

  it('has proper styling and structure', () => {
    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('.container').should('have.class', 'bg-base-300');
    cy.get('.container').should('have.class', 'text-base-content');
    cy.get('h3').should('contain', 'Timer');
    cy.get('.join').should('exist');
    cy.get('.join-item').should('have.length', 3);
    cy.get('#timer-input').should('have.class', 'input');
    cy.get('#timer-input').should('have.class', 'validator');
  });

  it('handles timer state transitions correctly', () => {
    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    // Initially stopped
    cy.contains('Timer is stopped.').should('be.visible');
    cy.get('#timer-input').should('be.visible');

    // Simulate timer starting
    cy.then(() => {
      gameStore.timerRunning = true;
      gameStore.timer = 30;
    });

    cy.contains('Timer is running...').should('be.visible');
    cy.get('#timer-input').should('not.exist');

    // Simulate timer reaching 0
    cy.then(() => {
      gameStore.timer = 0;
    });

    cy.get('#timer-input').should('be.visible');
  });

  it('handles very large timer values', () => {
    gameStore.timer = 99999;

    cy.mount(TimerMgr, {
      props: { ...defaultProps, timerInput: 99999 },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('[data-cy="host-clock"]').should('contain.text', '1666:39');
    cy.get('#timer-input').should('have.value', '99999');
  });

  it('prevents non-numeric input with preventNonNumeric', () => {
    cy.mount(TimerMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    // Test that the input has the preventNonNumeric handler
    cy.get('#timer-input').should('exist');
    // This is hard to test directly, but we can ensure the input type is number
    cy.get('#timer-input').should('have.attr', 'type', 'number');
  });

  it('handles fractional timer input correctly', () => {
    cy.mount(TimerMgr, {
      props: { ...defaultProps, timerInput: 30.5 },
      global: {
        plugins: [pinia],
      },
    });

    // Should show the decimal value
    cy.get('#timer-input').should('have.value', '30.5');
    // Buttons should still work with fractional values > 0
    cy.get('button').contains('Start').should('not.be.disabled');
  });

  it('handles timer input with leading zeros', () => {
    const onUpdateTimerInput = cy.stub();
    const setTimer = cy.stub();

    cy.mount(TimerMgr, {
      props: {
        ...defaultProps,
        'onUpdate:timerInput': onUpdateTimerInput,
        setTimer,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#timer-input').clear().type('00030').blur();
    cy.then(() => {
      expect(onUpdateTimerInput).to.have.been.calledWith(30);
      expect(setTimer).to.have.been.called;
    });
  });
  describe('auto-start presets', () => {
    const mountWith = (extra: any = {}) =>
      cy.mount(TimerMgr, {
        props: { ...defaultProps, ...extra },
        global: { plugins: [pinia] },
      });

    it('has the auto-start toggle off by default and hides the durations', () => {
      mountWith();
      cy.get('#timer-auto-start').should('not.be.checked');
      cy.get('#timer-preset-buzzer').should('not.exist');
      cy.get('#timer-preset-guessing').should('not.exist');
    });

    it('emits update:presets with enabled true when the toggle is switched on', () => {
      const onUpdatePresets = cy.stub();
      mountWith({
        presets: { enabled: false, buzzer: 20, guessing: 90 },
        'onUpdate:presets': onUpdatePresets,
      });
      cy.get('#timer-auto-start').check();
      cy.then(() => {
        expect(onUpdatePresets).to.have.been.calledWith({
          enabled: true,
          buzzer: 20,
          guessing: 90,
        });
      });
    });

    it('shows both durations when enabled and emits whole clamped seconds', () => {
      const onUpdatePresets = cy.stub();
      mountWith({
        presets: { enabled: true, buzzer: 20, guessing: 90 },
        'onUpdate:presets': onUpdatePresets,
      });
      cy.get('#timer-preset-buzzer').should('have.value', '20');
      cy.get('#timer-preset-guessing').should('have.value', '90');

      cy.get('#timer-preset-buzzer').clear().type('45').blur();
      cy.then(() => {
        expect(onUpdatePresets).to.have.been.calledWith({
          enabled: true,
          buzzer: 45,
          guessing: 90,
        });
      });

      cy.get('#timer-preset-guessing').clear().type('99999').blur();
      cy.then(() => {
        expect(onUpdatePresets).to.have.been.calledWith({
          enabled: true,
          buzzer: 20,
          guessing: 600,
        });
      });
      cy.get('#timer-preset-guessing').should('have.value', '600');
    });

    it('turns an empty duration into 0 (no timer for that step)', () => {
      const onUpdatePresets = cy.stub();
      mountWith({
        presets: { enabled: true, buzzer: 20, guessing: 90 },
        'onUpdate:presets': onUpdatePresets,
      });
      cy.get('#timer-preset-buzzer').clear().blur();
      cy.then(() => {
        expect(onUpdatePresets).to.have.been.calledWith({
          enabled: true,
          buzzer: 0,
          guessing: 90,
        });
      });
    });

    it("shows Time's up only when told the timer ran out", () => {
      mountWith({ timeUp: false });
      cy.get('#timer-time-up').should('not.exist');
      mountWith({ timeUp: true });
      cy.get('#timer-time-up').should('contain', "Time's up!");
    });

    it('shows a small segmented clock that follows the timer and turns red at time up', () => {
      gameStore.timer = 125;
      mountWith();
      cy.get('[data-cy="host-clock"]').should('contain.text', '2:05');
      cy.get('[data-cy="host-clock"]').should('have.class', 'segment-clock--sm');
      cy.get('[data-cy="host-clock"]').should('not.have.class', 'segment-clock--time-up');
      mountWith({ timeUp: true });
      cy.get('[data-cy="host-clock"]').should('have.class', 'segment-clock--time-up');
    });
  });
});

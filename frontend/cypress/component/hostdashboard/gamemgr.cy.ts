import GameMgr from '../../../src/components/hostDashboard/GameMgr.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../../../src/stores/gamestore';
import { GameStep } from '../../../src/utils/gameSteps';

describe('GameMgr', () => {
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
    gameStore.currentStep = GameStep.Start;
    gameStore.teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    // Create stubs inside beforeEach where cy.stub() is available
    defaultProps = {
      updateGameState: cy.stub(),
      nextRound: cy.stub(),
      handleUpload: cy.stub().resolves(true),
      fetchLibraryFiles: cy.stub(),
      showLibraryDialog: false,
      libraryFiles: ['Question 1.csv', 'Question 2.csv'],
      loadLibraryFile: cy.stub(),
      setShowLibraryDialog: cy.stub(),
      questionInput: '',
      answerPairs: [],
      removeAnswerPair: cy.stub(),
      addAnswerPair: cy.stub(),
      removeAllAnswers: cy.stub(),
      saveQuestionAndAnswers: cy.stub(),
      showQASection: false,
      setMultiplier: cy.stub(),
      handleCorrectGuess: cy.stub(),
      handleIncorrectAndStrike: cy.stub(),
      emitStrikeSound: cy.stub(),
      setStartingTeam: cy.stub(),
      revealAllAnswers: cy.stub(),
    };
  });

  it('renders correctly with initial state', () => {
    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Game Manager').should('be.visible');
    cy.get('.steps').should('be.visible');
    cy.get('.step').should('have.length', 8);
    cy.contains("Let's get started!").should('be.visible');
    cy.get('button').contains('Start Round').should('be.visible');
  });

  it('displays progress steps correctly', () => {
    gameStore.currentStep = GameStep.Multiplier;

    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    // First 3 steps should be marked as completed
    cy.get('.step').eq(0).should('have.class', 'step-primary');
    cy.get('.step').eq(1).should('have.class', 'step-primary');
    cy.get('.step').eq(2).should('have.class', 'step-primary');
    cy.get('.step').eq(3).should('not.have.class', 'step-primary');
  });

  it('handles step 1 - Start Round', () => {
    const updateGameState = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, updateGameState },
      global: {
        plugins: [pinia],
      },
    });

    cy.safeClick('button:contains("Start Round")');

    cy.then(() => {
      expect(gameStore.currentStep).to.equal(GameStep.QA);
      expect(updateGameState).to.have.been.called;
    });
  });

  it('handles step 2 - Question and Answers selection methods', () => {
    gameStore.currentStep = GameStep.QA;

    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Add Question & Answers').should('be.visible');
    cy.contains('Select a method to add questions and answers:').should('be.visible');
    cy.get('button').contains('Select from library').should('be.visible');
    cy.get('button').contains('Upload CSV File').should('be.visible');
    cy.get('button').contains('Enter manually').should('be.visible');
  });

  it('shows CSV upload modal when upload button is clicked', () => {
    gameStore.currentStep = GameStep.QA;

    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.safeClick('button:contains("Upload CSV File")');
    cy.contains('Upload CSV File').should('be.visible');
    cy.get('#file-upload').should('be.visible');
    cy.contains('Download Template').should('be.visible');
  });

  it('shows library dialog when library button is clicked', () => {
    gameStore.currentStep = GameStep.QA;
    const fetchLibraryFiles = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, fetchLibraryFiles, showLibraryDialog: true },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Select a Question Set').should('be.visible');
    // Scroll the button into view before checking visibility
    cy.contains('Question 1').scrollIntoView().should('be.visible');
    cy.contains('Question 2').scrollIntoView().should('be.visible');
  });

  it('shows manual entry form when enter manually is clicked', () => {
    gameStore.currentStep = GameStep.QA;
    const onUpdateShowQASection = cy.stub();

    cy.mount(GameMgr, {
      props: {
        ...defaultProps,
        showQASection: true,
        'onUpdate:showQASection': onUpdateShowQASection,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Question').should('be.visible');
    cy.get('#question-input').should('be.visible');
    cy.contains('Answers').should('be.visible');
  });

  it('validates question input', () => {
    gameStore.currentStep = GameStep.QA;

    cy.mount(GameMgr, {
      props: { ...defaultProps, showQASection: true, questionInput: '' },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('#question-input').should('have.attr', 'required');
    cy.get('button').contains('Save Question and Answers').should('be.disabled');
  });

  it('handles answer pairs management', () => {
    gameStore.currentStep = GameStep.QA;
    const answerPairs = [
      { text: 'Answer 1', points: 10 },
      { text: 'Answer 2', points: 8 },
    ];
    const addAnswerPair = cy.stub();
    const removeAnswerPair = cy.stub();

    cy.mount(GameMgr, {
      props: {
        ...defaultProps,
        showQASection: true,
        answerPairs,
        addAnswerPair,
        removeAnswerPair,
        questionInput: 'Test Question',
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('input[id^="answer-"]').should('have.length', 2);
    cy.get('input[id^="points-"]').should('have.length', 2);
    cy.safeClick('button:contains("Add Answer")');
    cy.then(() => {
      expect(addAnswerPair).to.have.been.called;
    });
  });

  it('handles the Multiplier step', () => {
    gameStore.currentStep = GameStep.Multiplier;
    const setMultiplier = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, setMultiplier },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Set Round Multiplier').should('be.visible');
    cy.get('input[type="radio"]').should('have.length', 3);
    cy.safeClick('input[value="2"]');
    cy.safeClick('button:contains("Confirm")');

    cy.then(() => {
      expect(setMultiplier).to.have.been.calledWith(2);
      expect(gameStore.currentStep).to.equal(GameStep.SelectBuzzers);
    });
  });

  it('handles the Select buzzers step - Confirm is disabled until a team has a pick', () => {
    gameStore.currentStep = GameStep.SelectBuzzers;
    gameStore.teamMembers = { A: ['Ann', 'Al'], B: ['Bo'] };
    const updateGameState = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, updateGameState },
      global: { plugins: [pinia] },
    });

    cy.contains('Select team members for buzzers').should('be.visible');
    cy.get('button').contains('Confirm').should('be.disabled');
    cy.get('button').contains('Skip (anyone can buzz)').should('not.be.disabled');

    cy.get('[data-testid="buzzer-picks-A"] input[value="Al"]').check();
    cy.get('button').contains('Confirm').should('not.be.disabled');
    cy.get('button').contains('Confirm').click();
    cy.then(() => {
      expect(gameStore.buzzerPlayers).to.deep.equal({ A: 'Al', B: null });
      expect(gameStore.currentStep).to.equal(GameStep.Buzzer);
      // One update carries both the pick and the step.
      expect(updateGameState).to.have.been.calledOnce;
    });
  });

  it('Skip clears the picks and moves to the Buzzer step in one update', () => {
    gameStore.currentStep = GameStep.SelectBuzzers;
    gameStore.teamMembers = { A: ['Ann'], B: ['Bo'] };
    gameStore.buzzerPlayers = { A: 'Ann', B: 'Bo' };
    const updateGameState = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, updateGameState },
      global: { plugins: [pinia] },
    });

    cy.get('button').contains('Skip (anyone can buzz)').click();
    cy.then(() => {
      expect(gameStore.buzzerPlayers).to.deep.equal({ A: null, B: null });
      expect(gameStore.currentStep).to.equal(GameStep.Buzzer);
      expect(updateGameState).to.have.been.calledOnce;
    });
  });

  it('shows "No players yet" for an empty team and offers only the joined players', () => {
    gameStore.currentStep = GameStep.SelectBuzzers;
    gameStore.teamMembers = { A: ['Ann'], B: [] };

    cy.mount(GameMgr, {
      props: defaultProps,
      global: { plugins: [pinia] },
    });

    cy.get('[data-testid="buzzer-picks-B"]').contains('No players yet').should('be.visible');
    cy.get('[data-testid="buzzer-picks-B"] input[type="radio"]').should('not.exist');
    cy.get('[data-testid="buzzer-picks-A"] input[type="radio"]').should('have.length', 2);
  });

  it('Multiplier Confirm moves to the Select buzzers step', () => {
    gameStore.currentStep = GameStep.Multiplier;

    cy.mount(GameMgr, {
      props: defaultProps,
      global: { plugins: [pinia] },
    });

    cy.safeClick('button:contains("Confirm")');
    cy.then(() => {
      expect(gameStore.currentStep).to.equal(GameStep.SelectBuzzers);
    });
  });

  it('handles Buzzer step - Buzzer round', () => {
    gameStore.currentStep = GameStep.Buzzer;
    gameStore.question = 'Test Question';
    gameStore.answers = [
      { id: 1, text: 'Answer 1', points: 10 },
      { id: 2, text: 'Answer 2', points: 8 },
    ];
    gameStore.guessedAnswers = [];
    // Set required conditions for "Incorrect (buzzer only)" button to appear
    gameStore.answersSaved = true;
    gameStore.multiplierSet = true;
    gameStore.startingTeamSet = false;
    gameStore.roundOver = false;

    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Buzzer Round:').should('be.visible');
    cy.contains('Test Question').should('be.visible');
    cy.contains('Answer 1 (10 pts)').should('be.visible');
    cy.contains('Answer 2 (8 pts)').should('be.visible');
    cy.get('button').filter(':contains("Correct")').should('have.length', 2);
    cy.get('button').contains('Incorrect (buzzer only)').should('be.visible');
  });

  it('shows buzzed player alert in buzzer round', () => {
    gameStore.currentStep = GameStep.Buzzer;
    gameStore.buzzedPlayer = 'John Doe';
    gameStore.question = 'Test Question';
    gameStore.answers = [];

    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('.alert-success').should('contain', '🚨 - John Doe buzzed in!');
  });

  it('shows the assigned buzzers, marks one who is not connected, and Let anyone buzz clears them', () => {
    gameStore.currentStep = GameStep.Buzzer;
    gameStore.teamNames = { A: 'Team Alpha', B: 'Team Beta' };
    gameStore.teamMembers = { A: ['Ann'], B: [] };
    gameStore.buzzerPlayers = { A: 'Ann', B: 'Bo' };
    const updateGameState = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, updateGameState },
      global: { plugins: [pinia] },
    });

    cy.get('[data-testid="buzzer-assignment"]').within(() => {
      cy.contains('Team Alpha buzzer: Ann').should('exist');
      cy.contains('Team Alpha buzzer: Ann').should('not.contain', '(not connected)');
      cy.contains('Team Beta buzzer: Bo').should('contain', '(not connected)');
    });
    cy.get('button').contains('Let anyone buzz').click();
    cy.then(() => {
      expect(gameStore.buzzerPlayers).to.deep.equal({ A: null, B: null });
      expect(updateGameState).to.have.been.calledOnce;
    });
    cy.get('[data-testid="buzzer-assignment"]').should('not.exist');
  });

  it('shows no assignment block on the Buzzer step when nobody was selected', () => {
    gameStore.currentStep = GameStep.Buzzer;
    gameStore.buzzerPlayers = { A: null, B: null };

    cy.mount(GameMgr, {
      props: defaultProps,
      global: { plugins: [pinia] },
    });

    cy.contains('Buzzer Round:').should('be.visible');
    cy.get('[data-testid="buzzer-assignment"]').should('not.exist');
  });

  it('handles WhoStarts step - Starting team selection', () => {
    gameStore.currentStep = GameStep.WhoStarts;
    gameStore.teamNames = { A: 'Team Alpha', B: 'Team Beta' };
    const setStartingTeam = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, setStartingTeam },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Who Starts?').should('be.visible');
    cy.get('button').contains('Team Alpha').should('be.visible');
    cy.get('button').contains('Team Beta').should('be.visible');

    cy.safeClick('button:contains("Team Alpha")');
    cy.then(() => {
      expect(setStartingTeam).to.have.been.calledWith('A');
      expect(gameStore.currentStep).to.equal(GameStep.Guessing);
    });
  });

  it('handles the Guessing step', () => {
    gameStore.currentStep = GameStep.Guessing;
    gameStore.question = 'Test Question';
    gameStore.answers = [
      { id: 1, text: 'Answer 1', points: 10 },
      { id: 2, text: 'Answer 2', points: 8 },
    ];
    gameStore.guessedAnswers = [{ id: 1, text: 'Answer 1', points: 10 }];
    // Set required conditions for "Incorrect" button to appear
    gameStore.answersSaved = true;
    gameStore.multiplierSet = true;
    gameStore.startingTeamSet = true;
    gameStore.roundOver = false;
    const handleCorrectGuess = cy.stub();
    const handleIncorrectAndStrike = cy.stub();

    cy.mount(GameMgr, {
      props: {
        ...defaultProps,
        handleCorrectGuess,
        handleIncorrectAndStrike,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Guessing Round:').should('be.visible');
    cy.contains('Test Question').should('be.visible');

    // Answer 1 should be crossed out (guessed)
    cy.contains('Answer 1 (10 pts)')
      .should('have.css', 'text-decoration')
      .and('include', 'line-through');

    // Answer 2 should still have a Correct button
    cy.contains('Answer 2 (8 pts)')
      .parent()
      .find('button')
      .contains('Correct')
      .should('be.visible');

    cy.get('button').contains('Incorrect').should('be.visible');
    cy.safeClick('button:contains("Incorrect")');
    cy.then(() => {
      expect(handleIncorrectAndStrike).to.have.been.called;
    });
  });

  it('handles the Award step - Award points', () => {
    gameStore.currentStep = GameStep.Award;
    gameStore.winningTeam = 'A';
    gameStore.pointsAwarded = 25;
    gameStore.teamScores = { A: 100, B: 75 };
    gameStore.roundOver = true;
    gameStore.answers = [
      { id: 1, text: 'Answer 1', points: 10 },
      { id: 2, text: 'Answer 2', points: 8 },
    ];
    gameStore.guessedAnswers = [{ id: 1, text: 'Answer 1', points: 10 }];

    const revealAllAnswers = cy.stub();

    cy.mount(GameMgr, {
      props: { ...defaultProps, revealAllAnswers },
      global: {
        plugins: [pinia],
      },
    });

    cy.contains('Points Awarded').should('be.visible');
    cy.contains('Team A earned 25 points!').should('be.visible');
    cy.contains('Current Scores').should('be.visible');
    cy.contains('A: 100').should('be.visible');
    cy.contains('B: 75').should('be.visible');

    cy.get('button').contains('Start Next Round').should('be.visible');
    cy.get('button').contains('Reveal All Answers').should('be.visible');

    cy.safeClick('button:contains("Reveal All Answers")');
    cy.then(() => {
      expect(revealAllAnswers).to.have.been.called;
    });
  });

  it('handles CSV file upload', () => {
    gameStore.currentStep = GameStep.QA;
    const handleUpload = cy.stub().resolves(true);
    const onUpdateShowQASection = cy.stub();

    cy.mount(GameMgr, {
      props: {
        ...defaultProps,
        handleUpload,
        'onUpdate:showQASection': onUpdateShowQASection,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.safeClick('button:contains("Upload CSV File")');

    // Create a mock file upload event
    cy.get('#file-upload').then(($input) => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      ($input[0] as HTMLInputElement).files = dataTransfer.files;

      const event = new Event('change', { bubbles: true });
      $input[0].dispatchEvent(event);
    });

    cy.then(() => {
      expect(handleUpload).to.have.been.called;
    });
  });

  it('handles CSV upload error', () => {
    gameStore.currentStep = GameStep.QA;
    const handleUpload = cy.stub().resolves(false);

    cy.mount(GameMgr, {
      props: { ...defaultProps, handleUpload },
      global: {
        plugins: [pinia],
      },
    });

    cy.safeClick('button:contains("Upload CSV File")');

    cy.get('#file-upload').then(($input) => {
      const file = new File(['invalid content'], 'test.csv', { type: 'text/csv' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      ($input[0] as HTMLInputElement).files = dataTransfer.files;

      const event = new Event('change', { bubbles: true });
      $input[0].dispatchEvent(event);
    });

    cy.contains('Invalid CSV file. Please try again.').should('be.visible');
  });

  it('validates points input for answers', () => {
    gameStore.currentStep = GameStep.QA;
    const answerPairs = [{ text: 'Test Answer', points: 0 }];

    cy.mount(GameMgr, {
      props: {
        ...defaultProps,
        showQASection: true,
        questionInput: 'Test Question',
        answerPairs,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('input[id^="points-"]').should('have.value', '0');
    cy.contains('Cannot be less than 1').should('be.visible');
    cy.get('button').contains('Save Question and Answers').should('be.disabled');
  });

  it('closes library dialog when cancel is clicked', () => {
    gameStore.currentStep = GameStep.QA;
    const setShowLibraryDialog = cy.stub();

    cy.mount(GameMgr, {
      props: {
        ...defaultProps,
        showLibraryDialog: true,
        setShowLibraryDialog,
      },
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Cancel').click();
    cy.then(() => {
      expect(setShowLibraryDialog).to.have.been.calledWith(false);
    });
  });

  it('closes CSV upload modal when X is clicked', () => {
    gameStore.currentStep = GameStep.QA;

    cy.mount(GameMgr, {
      props: defaultProps,
      global: {
        plugins: [pinia],
      },
    });

    cy.get('button').contains('Upload CSV File').click();
    cy.get('button').contains('✕').click();
    cy.get('.card').should('not.exist');
  });
});

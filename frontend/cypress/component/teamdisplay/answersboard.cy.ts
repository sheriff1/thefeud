import AnswersBoard from '@/components/teamDisplay/AnswersBoard.vue';
import { mount } from 'cypress/vue';

describe('AnswersBoard', () => {
  beforeEach(() => {
    // Handle Vue DevTools errors in testing environment
    Cypress.on('uncaught:exception', (err, runnable) => {
      // Return false to prevent the error from failing the test
      if (err.message.includes("Cannot read properties of undefined (reading 'app')")) {
        return false;
      }
      return true;
    });
  });

  const mockAnswers = [
    { id: '1', text: 'Answer One', points: 50 },
    { id: '2', text: 'Answer Two', points: 30 },
    { id: '3', text: 'Answer Three', points: 20 },
    { id: '4', text: 'Answer Four', points: 10 },
  ];

  const defaultProps = {
    answers: mockAnswers,
    question: 'Name something you find in a kitchen',
    guessedAnswers: [],
    showStrikeX: false,
  };

  it('renders the component with answers', () => {
    mount(AnswersBoard, {
      props: defaultProps,
    });

    cy.get('.answers-container').should('be.visible');
    cy.get('.question-display h3').should('contain.text', 'Name something you find in a kitchen');
    cy.get('.answer-box').should('have.length', 4);
  });

  it('shows "No answers available" message when answers array is empty', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        answers: [],
      },
    });

    cy.get('.no-answers-message').should('be.visible');
    cy.get('.no-answers-message').should('contain.text', 'No answers available yet.');
    cy.get('.answers-container').should('not.exist');
  });

  it('displays blue boxes for unrevealed answers', () => {
    mount(AnswersBoard, {
      props: defaultProps,
    });

    cy.get('.blue-box').should('have.length', 4);
    cy.get('.answer-number-circle').each(($el, index) => {
      cy.wrap($el).should('contain.text', (index + 1).toString());
    });
  });

  it('reveals answers when they are guessed', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        guessedAnswers: [{ id: '1' }, { id: '3' }],
      },
    });

    cy.get('.blue-box').should('have.length', 2);
    cy.get('.revealed-answer').should('have.length', 2);

    cy.get('.revealed-answer')
      .first()
      .within(() => {
        cy.get('.answer-text').should('contain.text', 'ANSWER ONE');
        cy.get('.answer-points-box').should('contain.text', '50');
      });
  });

  it('displays answers in uppercase when revealed', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        guessedAnswers: [{ id: '2' }],
      },
    });

    cy.get('.revealed-answer .answer-text').should('contain.text', 'ANSWER TWO');
  });

  it('shows strike X overlay when showStrikeX is true', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        showStrikeX: true,
      },
    });

    cy.get('.strike-x-overlay').should('be.visible');
    cy.get('.strike-x').should('contain.text', 'X');
  });

  it('emits strikeX event after showing strike X', () => {
    const strikeXSpy = cy.stub().as('strikeXHandler');

    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        showStrikeX: false,
        onStrikeX: strikeXSpy,
      },
    }).then(({ wrapper }) => {
      wrapper.setProps({ ...defaultProps, showStrikeX: true });

      cy.wait(1300);
      cy.get('@strikeXHandler').should('have.been.called');
    });
  });

  it('handles mixed revealed and unrevealed answers correctly', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        guessedAnswers: [{ id: '1' }, { id: '4' }],
      },
    });

    // Should have 2 blue boxes and 2 revealed answers
    cy.get('.blue-box').should('have.length', 2);
    cy.get('.revealed-answer').should('have.length', 2);

    // Check that the correct answers are revealed
    cy.get('.revealed-answer').first().get('.answer-text').should('contain.text', 'ANSWER ONE');
    cy.get('.revealed-answer').last().get('.answer-text').should('contain.text', 'ANSWER FOUR');
  });

  it('updates when guessedAnswers prop changes', () => {
    mount(AnswersBoard, {
      props: defaultProps,
    }).then(({ wrapper }) => {
      cy.get('.blue-box').should('have.length', 4);
      cy.get('.revealed-answer').should('have.length', 0);

      wrapper.setProps({
        ...defaultProps,
        guessedAnswers: [{ id: '1' }],
      });

      cy.get('.blue-box').should('have.length', 3);
      cy.get('.revealed-answer').should('have.length', 1);
    });
  });

  it('handles different answer point values correctly', () => {
    const answersWithVariousPoints = [
      { id: '1', text: 'High Points', points: 100 },
      { id: '2', text: 'Low Points', points: 5 },
      { id: '3', text: 'Zero Points', points: 0 },
    ];

    mount(AnswersBoard, {
      props: {
        answers: answersWithVariousPoints,
        question: 'Test Question',
        guessedAnswers: [{ id: '1' }, { id: '2' }, { id: '3' }],
        showStrikeX: false,
      },
    });

    cy.get('.revealed-answer').eq(0).get('.answer-points-box').should('contain.text', '100');
    cy.get('.revealed-answer').eq(1).get('.answer-points-box').should('contain.text', '5');
    cy.get('.revealed-answer').eq(2).get('.answer-points-box').should('contain.text', '0');
  });
});

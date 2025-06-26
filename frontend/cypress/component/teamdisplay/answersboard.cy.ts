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
    strikeCount: 1,
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
        strikeCount: 1,
      },
    });

    cy.get('.strike-x-overlay').should('be.visible');
    cy.get('.strike-x-container').should('be.visible');
    cy.get('.strike-x').should('have.length', 1);
    cy.get('.strike-x').should('contain.text', 'X');
  });

  it('shows multiple strike X\'s based on strikeCount', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        showStrikeX: true,
        strikeCount: 3,
      },
    });

    cy.get('.strike-x-overlay').should('be.visible');
    cy.get('.strike-x-container').should('be.visible');
    cy.get('.strike-x').should('have.length', 3);
    cy.get('.strike-x').each(($el) => {
      cy.wrap($el).should('contain.text', 'X');
    });
  });

  it('emits strikeX event after showing strike X', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        showStrikeX: false,
      },
    }).then(({ wrapper }) => {
      wrapper.setProps({ ...defaultProps, showStrikeX: true, strikeCount: 2 });

      cy.wait(1300);
      // Check that the strikeX event was emitted
      cy.wrap(wrapper).invoke('emitted', 'strikeX').should('have.length.greaterThan', 0);
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
      { id: '2', text: 'Low Points', points: 1 },
      { id: '3', text: 'Zero Points', points: 0 },
      { id: '4', text: 'Negative Points', points: -5 },
    ];

    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        answers: answersWithVariousPoints,
        guessedAnswers: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      },
    });

    cy.get('.revealed-answer').should('have.length', 4);
    cy.get('.answer-points-box').eq(0).should('contain.text', '100');
    cy.get('.answer-points-box').eq(1).should('contain.text', '1');
    cy.get('.answer-points-box').eq(2).should('contain.text', '0');
    cy.get('.answer-points-box').eq(3).should('contain.text', '-5');
  });

  it('handles very long answer text', () => {
    const longAnswers = [
      {
        id: '1',
        text: 'This is a very long answer that might cause layout issues if not handled properly in the UI',
        points: 25,
      },
    ];

    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        answers: longAnswers,
        guessedAnswers: [{ id: '1' }],
      },
    });

    cy.get('.revealed-answer .answer-text').should(
      'contain.text',
      'THIS IS A VERY LONG ANSWER THAT MIGHT CAUSE LAYOUT ISSUES IF NOT HANDLED PROPERLY IN THE UI',
    );
  });

  it('handles very long question text', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        question:
          'This is an extremely long question that might cause layout issues and should be handled gracefully by the component without breaking the UI',
      },
    });

    cy.get('.question-display h3').should(
      'contain.text',
      'This is an extremely long question that might cause layout issues and should be handled gracefully by the component without breaking the UI',
    );
  });

  it('handles single answer correctly', () => {
    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        answers: [{ id: '1', text: 'Only Answer', points: 100 }],
      },
    });

    cy.get('.answer-box').should('have.length', 1);
    cy.get('.blue-box').should('have.length', 1);
    cy.get('.answer-number-circle').should('contain.text', '1');
  });

  it('handles maximum answers (8) correctly', () => {
    const maxAnswers = Array.from({ length: 8 }, (_, i) => ({
      id: String(i + 1),
      text: `Answer ${i + 1}`,
      points: (i + 1) * 10,
    }));

    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        answers: maxAnswers,
      },
    });

    cy.get('.answer-box').should('have.length', 8);
    cy.get('.blue-box').should('have.length', 8);
    cy.get('.answer-number-circle').should('have.length', 8);
  });

  it('handles strike X animation timing correctly', () => {
    // This test verifies that the strike X shows up and the event is emitted
    it('handles strike X animation timing correctly', () => {
      // This test verifies that the strike X shows up and the event is emitted
      // The visual aspect is already tested in "shows strike X overlay when showStrikeX is true"

      mount(AnswersBoard, {
        props: {
          ...defaultProps,
          showStrikeX: false,
        },
      }).then(({ wrapper }) => {
        // Initially no strike X
        cy.get('.strike-x-overlay').should('not.exist');

        // Show strike X and verify the event is emitted after timeout
        wrapper.setProps({ ...defaultProps, showStrikeX: true, strikeCount: 1 });

        // Should emit the event after timeout
        cy.wait(1300);
        cy.wrap(wrapper).invoke('emitted', 'strikeX').should('have.length.greaterThan', 0);
      });
    });
    const specialAnswers = [
      { id: '1', text: 'Answer with émojis 🎉', points: 25 },
      { id: '2', text: 'Answer & symbols!', points: 15 },
      { id: '3', text: 'Answer "with quotes"', points: 10 },
    ];

    mount(AnswersBoard, {
      props: {
        ...defaultProps,
        answers: specialAnswers,
        guessedAnswers: [{ id: '1' }, { id: '2' }, { id: '3' }],
      },
    });

    cy.get('.answer-text').eq(0).should('contain.text', 'ANSWER WITH ÉMOJIS 🎉');
    cy.get('.answer-text').eq(1).should('contain.text', 'ANSWER & SYMBOLS!');
    cy.get('.answer-text').eq(2).should('contain.text', 'ANSWER "WITH QUOTES"');
  });
});

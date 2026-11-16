import GameInfo from '@/components/teamDisplay/GameInfo.vue';
import { mount } from 'cypress/vue';

describe('GameInfo', () => {
  const defaultProps = {
    roundCounter: 3,
    pointPool: 1500,
    scoreMultiplier: 2,
  };

  it('renders all game info items', () => {
    mount(GameInfo, {
      props: defaultProps,
    });

    cy.get('.game-info-container').should('be.visible');
    cy.get('.game-info-item').should('have.length', 3);
  });

  it('displays round counter correctly', () => {
    mount(GameInfo, {
      props: defaultProps,
    });

    cy.get('.game-info-item')
      .first()
      .within(() => {
        cy.get('.game-info-value').should('contain.text', '3');
        cy.get('.game-info-label').should('contain.text', 'Round');
      });
  });

  it('displays point pool with locale formatting', () => {
    mount(GameInfo, {
      props: { ...defaultProps, pointPool: 15000 },
    });

    cy.get('.game-info-item')
      .eq(1)
      .within(() => {
        cy.get('.game-info-value').should('contain.text', '15,000');
        cy.get('.game-info-label').should('contain.text', 'Points Pool');
      });
  });

  it('displays score multiplier when set', () => {
    mount(GameInfo, {
      props: { ...defaultProps, scoreMultiplier: 3 },
    });

    cy.get('.game-info-item')
      .eq(2)
      .within(() => {
        cy.get('.game-info-value').should('contain.text', 'x3');
        cy.get('.game-info-label').should('contain.text', 'Score Multiplier');
      });
  });

  it('displays "x" when score multiplier is null', () => {
    mount(GameInfo, {
      props: { ...defaultProps, scoreMultiplier: null },
    });

    cy.get('.game-info-item')
      .eq(2)
      .within(() => {
        cy.get('.game-info-value').should('contain.text', 'x');
        cy.get('.game-info-label').should('contain.text', 'Score Multiplier');
      });
  });

  it('handles large point pool numbers', () => {
    mount(GameInfo, {
      props: { ...defaultProps, pointPool: 1234567 },
    });

    cy.get('.game-info-item')
      .eq(1)
      .within(() => {
        cy.get('.game-info-value').should('contain.text', '1,234,567');
      });
  });

  it('updates reactively when props change', () => {
    mount(GameInfo, {
      props: defaultProps,
    }).then(({ wrapper }) => {
      cy.get('.game-info-item').first().get('.game-info-value').should('contain.text', '3');

      wrapper.setProps({ ...defaultProps, roundCounter: 5 });
      cy.get('.game-info-item').first().get('.game-info-value').should('contain.text', '5');
    });
  });
});

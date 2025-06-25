import Banner from '@/components/teamDisplay/Banner.vue';
import { mount } from 'cypress/vue';

describe('Banner', () => {
  it('renders with heading and paragraph props', () => {
    const heading = 'Game Over!';
    const paragraph = 'Thank you for playing.';

    mount(Banner, {
      props: {
        heading,
        paragraph,
      },
    });

    cy.get('[role="alert"]').should('be.visible');
    cy.get('[role="alert"]').should('contain.text', `${heading} ${paragraph}`);
    cy.get('[role="alert"]').should('have.class', 'alert-success');
  });

  it('displays the success icon', () => {
    mount(Banner, {
      props: {
        heading: 'Test',
        paragraph: 'Message',
      },
    });

    cy.get('svg').should('be.visible');
    cy.get('svg path').should('have.attr', 'd', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
  });

  it('handles empty props gracefully', () => {
    mount(Banner, {
      props: {
        heading: '',
        paragraph: '',
      },
    });

    cy.get('[role="alert"]').should('be.visible');
    cy.get('p').should('be.empty');
  });

  it('handles long text content', () => {
    const longHeading = 'This is a very long heading that might overflow';
    const longParagraph =
      'This is a very long paragraph with lots of text that might cause layout issues if not handled properly';

    mount(Banner, {
      props: {
        heading: longHeading,
        paragraph: longParagraph,
      },
    });

    cy.get('[role="alert"]').should('contain.text', longHeading);
    cy.get('[role="alert"]').should('contain.text', longParagraph);
  });
});

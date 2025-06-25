import { mount } from 'cypress/vue';
import FloatingButton from '../../../src/components/teamDisplay/FloatingButton.vue';

describe('FloatingButton', () => {
  beforeEach(() => {
    // Handle Vue DevTools errors in testing environment
    Cypress.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes("Cannot read properties of undefined (reading 'app')")) {
        return false;
      }
      return true;
    });
  });

  it('renders with required props', () => {
    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
      },
    });

    cy.get('button').should('contain.text', 'Test Button');
    cy.get('button').should('have.class', 'floating-button');
  });

  it('renders with all props', () => {
    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
        className: 'custom-class',
        state: 'active',
        ariaPressed: true,
      },
    });

    cy.get('button').should('contain.text', 'Test Button');
    cy.get('button').should('have.class', 'floating-button');
    cy.get('button').should('have.class', 'custom-class');
    cy.get('button').should('have.class', 'active');
    cy.get('button').should('have.attr', 'aria-pressed', 'true');
  });

  it('handles missing optional props gracefully', () => {
    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
        // className, state, and ariaPressed are not provided
      },
    });

    cy.get('button').should('contain.text', 'Test Button');
    cy.get('button').should('have.class', 'floating-button');
    // With the default value, aria-pressed should be "false"
    cy.get('button').should('have.attr', 'aria-pressed', 'false');
    // className and state are not provided, so no additional classes
    cy.get('button').should('not.have.class', 'undefined');
    cy.get('button').should('not.have.class', 'null');
  });

  it('handles aria-pressed when explicitly set to false', () => {
    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
        ariaPressed: false,
      },
    });

    cy.get('button').should('contain.text', 'Test Button');
    cy.get('button').should('have.attr', 'aria-pressed', 'false');
  });

  it('emits click event when clicked', () => {
    const onClickSpy = cy.spy().as('onClickSpy');

    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
        onClick: onClickSpy,
      },
    });

    cy.get('button').click();
    cy.get('@onClickSpy').should('have.been.called');
  });

  it('updates button state when state prop changes', () => {
    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
        state: 'initial',
      },
    });

    cy.get('button').should('have.class', 'initial');

    // Update the prop (this would typically be done by the parent component)
    cy.get('button').then(() => {
      Cypress.vueWrapper.setProps({ state: 'updated' });
    });

    cy.get('button').should('have.class', 'updated');
  });

  it('handles object className prop', () => {
    cy.mount(FloatingButton, {
      props: {
        label: 'Test Button',
        className: { active: true, disabled: false },
      },
    });

    cy.get('button').should('contain.text', 'Test Button');
    cy.get('button').should('have.class', 'floating-button');
    // Vue should apply the active class since it's true, but not disabled since it's false
    cy.get('button').should('have.class', 'active');
    cy.get('button').should('not.have.class', 'disabled');
  });
});

import ConnectionBanner from '@/components/ConnectionBanner.vue';
import { connectionStatus } from '@/utils/socket';
import { mount } from 'cypress/vue';

describe('ConnectionBanner', () => {
  it('is hidden while connected', () => {
    connectionStatus.state = 'connected';
    mount(ConnectionBanner);
    cy.wait(1700);
    cy.get('[data-cy=connection-banner]').should('not.exist');
  });

  it('shows a waking-up message while connecting for the first time, after a short grace period', () => {
    connectionStatus.state = 'connecting';
    connectionStatus.hasConnectedOnce = false;
    mount(ConnectionBanner);
    cy.get('[data-cy=connection-banner]').should('not.exist');
    cy.get('[data-cy=connection-banner]', { timeout: 4000 })
      .should('contain.text', 'Connecting to the server')
      .and('contain.text', 'waking up');
  });

  it('shows a reconnecting message after a drop, and hides again once reconnected', () => {
    connectionStatus.state = 'reconnecting';
    connectionStatus.hasConnectedOnce = true;
    mount(ConnectionBanner);
    cy.get('[data-cy=connection-banner]', { timeout: 4000 }).should('contain.text', 'Reconnecting');
    cy.then(() => {
      connectionStatus.state = 'connected';
    });
    cy.get('[data-cy=connection-banner]').should('not.exist');
  });
});

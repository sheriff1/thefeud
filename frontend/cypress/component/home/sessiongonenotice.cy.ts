import { createRouter, createMemoryHistory } from 'vue-router';
import Home from '../../../src/views/Home.vue';

function mountHomeAt(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Home }],
  });
  cy.wrap(router.push(url)).then(() => {
    cy.mountWithPinia(Home, { global: { plugins: [router] } });
  });
  return router;
}

describe('Home session-gone notice', () => {
  it('shows the notice for ?notice=session-gone and removes the param', () => {
    const router = mountHomeAt('/?notice=session-gone');
    cy.get('[data-cy=session-gone-notice]')
      .should('be.visible')
      .and('contain.text', 'no longer exists');
    cy.then(() => expect(router.currentRoute.value.query.notice).to.equal(undefined));
  });

  it('can be dismissed', () => {
    mountHomeAt('/?notice=session-gone');
    cy.get('[data-cy=session-gone-dismiss]').click();
    cy.get('[data-cy=session-gone-notice]').should('not.exist');
  });

  it('is not shown without the param', () => {
    mountHomeAt('/');
    cy.contains('Welcome to The Feud!');
    cy.get('[data-cy=session-gone-notice]').should('not.exist');
  });
});

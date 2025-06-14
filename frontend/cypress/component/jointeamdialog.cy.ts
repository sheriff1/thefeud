import JoinTeamDialog from '@/components/teamDisplay/JoinTeamDialog.vue';
import { mount } from 'cypress/vue';

describe('JoinTeamDialog', () => {
  it('renders and allows name and team selection', () => {
    mount(JoinTeamDialog, {
      props: {
        teamNames: { A: 'A', B: 'B' },
      },
    });
    cy.get('input[placeholder="Enter your name"]').should('exist');
    cy.contains('Team A').should('exist');
    cy.contains('Team B').should('exist');
    cy.get('button').contains('Join').should('exist');
  });

  it('allows entering a name and selecting a team', () => {
    cy.mount(JoinTeamDialog, {
      props: { teamNames: { A: 'Alpha', B: 'Bravo' } },
    });
    cy.get('input[placeholder="Enter your name"]').type('Player1');
    cy.get('label').contains('Team Bravo').click();
    cy.get('input[type="radio"][value="B"]').should('be.checked');
    cy.get('button').contains('Join').should('be.enabled');
  });

  it('disables the Join button if name is empty', () => {
    cy.mount(JoinTeamDialog, {
      props: { teamNames: { A: 'Alpha', B: 'Bravo' } },
    });
    cy.get('button').contains('Join').should('be.disabled');
  });

  it('emits joinTeam event and updates localStorage on join', () => {
    cy.mount(JoinTeamDialog, {
      props: { teamNames: { A: 'Alpha', B: 'Bravo' } },
    });
    cy.get('input[placeholder="Enter your name"]').type('Player1');
    cy.get('label').contains('Team Bravo').click();
    cy.get('button').contains('Join').click();
    cy.window().then((win) => {
      expect(win.localStorage.getItem('playerName')).to.eq('Player1');
      expect(win.localStorage.getItem('playerTeam')).to.eq('B');
    });
  });

  it('updates team labels when teamNames prop changes', () => {
    mount(JoinTeamDialog, {
      props: { teamNames: { A: 'Alpha', B: 'Bravo' } },
    }).then(({ wrapper }) => {
      cy.wrap(wrapper).invoke('setProps', { teamNames: { A: 'Avengers', B: 'Blasters' } });
      cy.get('label').contains('Team Avengers');
      cy.get('label').contains('Team Blasters');
    });
  });
});

import JoinTeamDialog from '../../../src/components/teamDisplay/JoinTeamDialog.vue';

describe('JoinTeamDialog', () => {
  beforeEach(() => {
    // Handle Vue DevTools errors in testing environment
    Cypress.on('uncaught:exception', (err, runnable) => {
      // Return false to prevent the error from failing the test
      if (err.message.includes("Cannot read properties of undefined (reading 'app')")) {
        return false;
      }
      return true;
    });

    // Clear localStorage before each test
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('renders correctly with default props', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.contains('Join the Game').should('be.visible');
    cy.contains('Enter your name:').should('be.visible');
    cy.get('input[type="text"]')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Enter your name');
    cy.contains('Select your team:').should('be.visible');
    cy.contains('Team Alpha').should('be.visible');
    cy.contains('Team Beta').should('be.visible');
    cy.get('button').should('contain', 'Join').and('be.disabled');
  });

  it('enables join button when name is entered', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.get('input[type="text"]').type('John Doe');
    cy.get('button').should('not.be.disabled');
  });

  it('disables join button when name is empty', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.get('input[type="text"]').type('John Doe');
    cy.get('button').should('not.be.disabled');

    cy.get('input[type="text"]').clear();
    cy.get('button').should('be.disabled');
  });

  it('allows team selection', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    // Team A should be selected by default
    cy.get('input[type="radio"][value="A"]').should('be.checked');

    // Select Team B
    cy.get('input[type="radio"][value="B"]').click();
    cy.get('input[type="radio"][value="B"]').should('be.checked');
    cy.get('input[type="radio"][value="A"]').should('not.be.checked');
  });

  it('updates selected team styles correctly', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    // Team A should have selected class by default
    cy.get('label').contains('Team Alpha').should('have.class', 'selected');
    cy.get('label').contains('Team Beta').should('not.have.class', 'selected');

    // Select Team B
    cy.get('input[type="radio"][value="B"]').click();
    cy.get('label').contains('Team Beta').should('have.class', 'selected');
    cy.get('label').contains('Team Alpha').should('not.have.class', 'selected');
  });

  it('emits joinTeam event with correct data', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };
    const onJoinTeam = cy.stub();

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
        onJoinTeam,
      },
    });

    cy.get('input[type="text"]').type('John Doe');
    cy.get('input[type="radio"][value="B"]').click();
    cy.get('button').click();

    cy.then(() => {
      expect(onJoinTeam).to.have.been.calledWith({
        playerName: 'John Doe',
        selectedTeam: 'B',
      });
    });
  });

  it('saves player data to localStorage when joining', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.get('input[type="text"]').type('Jane Smith');
    cy.get('input[type="radio"][value="A"]').click();
    cy.get('button').click();

    cy.window().then((win) => {
      expect(win.localStorage.getItem('playerName')).to.equal('Jane Smith');
      expect(win.localStorage.getItem('playerTeam')).to.equal('A');
    });
  });

  it('handles empty team names gracefully', () => {
    const teamNames = {};

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.contains('Team A').should('be.visible');
    cy.contains('Team B').should('be.visible');
  });

  it('displays fallback team names when teamNames prop is incomplete', () => {
    const teamNames = { A: 'Custom Team A' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.contains('Custom Team A').should('be.visible');
    cy.contains('Team B').should('be.visible'); // Falls back to 'B'
  });

  it('validates input requirements', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.get('input[type="text"]').should('have.attr', 'required');
    cy.get('input[type="text"]').should('have.attr', 'minlength', '1');
  });

  it('maintains proper dialog structure and styling', () => {
    const teamNames = { A: 'Team Alpha', B: 'Team Beta' };

    cy.mount(JoinTeamDialog, {
      props: {
        teamNames,
      },
    });

    cy.get('.join-team-dialog-backdrop').should('exist');
    cy.get('.join-team-dialog').should('exist');
    cy.get('.divider').should('exist');
    cy.get('.radio-group').should('exist');
    cy.get('.radio-option').should('have.length', 2);
  });
});

import TeamPanel from '@/components/teamDisplay/TeamPanel.vue';
import { mount } from 'cypress/vue';
import { createPinia, setActivePinia } from 'pinia';

describe('TeamPanel', () => {
  beforeEach(() => {
    // Setup Pinia before each test
    setActivePinia(createPinia());
  });

  const defaultProps = {
    team: 'team1',
    teamName: 'Team Alpha',
    score: 1500,
    members: ['Alice', 'Bob', 'Charlie'],
    strikes: 2,
    strikeCount: 2,
    active: false,
    editing: false,
    isWinning: false,
    showBuzzer: true,
    startingTeamSet: true,
    buzzerDisabled: false,
    guessedAnswers: [],
  };

  it('renders team information correctly', () => {
    mount(TeamPanel, {
      props: defaultProps,
    });

    cy.get('.team-score').should('contain.text', '1500');
    cy.get('.team-header').should('contain.text', 'TEAM ALPHA');
    cy.get('.team-members-list li').should('have.length', 3);
    cy.get('.team-members-list li').first().should('contain.text', 'Alice');
  });

  it('shows active styling when active prop is true', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, active: true },
    });

    cy.get('.team-info').should('have.class', 'active');
  });

  it('displays crown icon when team is winning', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, isWinning: true },
    });

    cy.get('.team-header').should('contain.text', '👑');
  });

  it('shows edit button when current player is on this team', () => {
    // Mock localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    mount(TeamPanel, {
      props: defaultProps,
    });

    cy.get('.btn-xs').should('be.visible').and('contain.text', '✏️');
  });

  it('enters edit mode when editing prop is true', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    mount(TeamPanel, {
      props: { ...defaultProps, editing: true },
    });

    cy.get('input[type="text"]').should('be.visible');
    cy.get('.btn').should('contain.text', '💾');
  });

  it('emits edit-team event when edit button is clicked', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    const editTeamSpy = cy.stub().as('editTeamHandler');

    mount(TeamPanel, {
      props: {
        ...defaultProps,
        'onEdit-team': editTeamSpy,
      },
    });

    cy.get('.btn-xs').click();
    cy.get('@editTeamHandler').should('have.been.calledWith', 'team1');
  });

  it('emits save-team event when save button is clicked', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    const saveTeamSpy = cy.stub().as('saveTeamHandler');

    mount(TeamPanel, {
      props: {
        ...defaultProps,
        editing: true,
        'onSave-team': saveTeamSpy,
      },
    });

    cy.get('input[type="text"]').clear().type('New Team Name');
    cy.get('.btn').contains('💾').click();

    cy.get('@saveTeamHandler').should('have.been.calledWith', {
      team: 'team1',
      name: 'New Team Name',
    });
  });

  it('displays correct number of strike icons', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, strikes: 3, strikeCount: 3 },
    });

    cy.get('.strike-x').should('have.length', 3);
    cy.get('.strike-x svg').should('have.length', 3);
  });

  it('shows buzzer when showBuzzer is true and no guessed answers', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, showBuzzer: true, guessedAnswers: [] },
    });

    cy.get('.buzzer-button').should('be.visible');
    cy.get('.buzzer-button').should('contain.text', 'BUZZER');
  });

  it('hides buzzer when guessed answers exist', () => {
    mount(TeamPanel, {
      props: {
        ...defaultProps,
        showBuzzer: true,
        guessedAnswers: [{ id: '1' }],
      },
    });

    cy.get('.buzzer-button').should('not.exist');
  });

  it('disables buzzer when buzzerDisabled is true', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, buzzerDisabled: true },
    });

    cy.get('.buzzer-button').should('be.disabled');
  });

  it('emits buzz event when buzzer is clicked', () => {
    const buzzSpy = cy.stub().as('buzzHandler');

    mount(TeamPanel, {
      props: {
        ...defaultProps,
        onBuzz: buzzSpy,
      },
    });

    cy.get('.buzzer-button').click();
    cy.get('@buzzHandler').should('have.been.called');
  });

  it('handles empty members list', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, members: [] },
    });

    cy.get('.team-members-list li').should('have.length', 0);
  });

  it('shows no strikes when strikes is 0', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, strikes: 0, strikeCount: 0 },
    });

    cy.get('.strike-x').should('have.length', 0);
  });

  it('highlights buzzed player when store has buzzedPlayer', () => {
    mount(TeamPanel, {
      props: defaultProps,
      global: {
        mocks: {
          store: {
            buzzedPlayer: 'Bob',
          },
        },
      },
    });

    cy.get('.team-members-list li').eq(1).should('have.class', 'buzzed');
  });

  it('updates edited name when teamName prop changes', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    mount(TeamPanel, {
      props: { ...defaultProps, editing: true },
    }).then(({ wrapper }) => {
      cy.get('input[type="text"]').should('have.value', 'Team Alpha');

      wrapper.setProps({ ...defaultProps, editing: true, teamName: 'Updated Team' });
      cy.get('input[type="text"]').should('have.value', 'Updated Team');
    });
  });
});

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

  it('handles very long team names gracefully', () => {
    const longName = 'A'.repeat(100);
    mount(TeamPanel, {
      props: { ...defaultProps, teamName: longName },
    });

    cy.get('.team-header').should('contain.text', longName.toUpperCase());
  });

  it('handles special characters in team name', () => {
    const specialName = 'Team @#$%^&*()!';
    mount(TeamPanel, {
      props: { ...defaultProps, teamName: specialName },
    });

    cy.get('.team-header').should('contain.text', specialName.toUpperCase());
  });

  it('respects maxlength attribute on input field', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    mount(TeamPanel, {
      props: { ...defaultProps, editing: true },
    });

    cy.get('input[type="text"]').should('have.attr', 'maxlength', '20');
  });

  it('saves team name on Enter key press', () => {
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

    cy.get('input[type="text"]').clear().type('New Name{enter}');
    cy.get('@saveTeamHandler').should('have.been.calledWith', {
      team: 'team1',
      name: 'New Name',
    });
  });

  it('saves team name on blur event', () => {
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

    cy.get('input[type="text"]').clear().type('Blur Name').blur();
    cy.get('@saveTeamHandler').should('have.been.calledWith', {
      team: 'team1',
      name: 'Blur Name',
    });
  });

  it('handles single member team', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, members: ['Solo Player'] },
    });

    cy.get('.team-members-list li').should('have.length', 1);
    cy.get('.team-members-list li').should('contain.text', 'Solo Player');
  });

  it('handles very large team with many members', () => {
    const manyMembers = Array.from({ length: 20 }, (_, i) => `Player ${i + 1}`);
    mount(TeamPanel, {
      props: { ...defaultProps, members: manyMembers },
    });

    cy.get('.team-members-list li').should('have.length', 20);
    cy.get('.team-members-list li').first().should('contain.text', 'Player 1');
    cy.get('.team-members-list li').last().should('contain.text', 'Player 20');
  });

  it('displays buzzer text correctly when player is buzzed', () => {
    mount(TeamPanel, {
      props: defaultProps,
      global: {
        mocks: {
          store: {
            buzzedPlayer: 'Alice',
          },
        },
      },
    });

    cy.get('.buzzer-button').should('contain.text', 'Buzzed!');
  });

  it('hides strikes section when startingTeamSet is false', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, startingTeamSet: false },
    });

    cy.get('.team-strikes').should('not.exist');
  });

  it('handles negative score values', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, score: -500 },
    });

    cy.get('.team-score').should('contain.text', '-500');
  });

  it('handles zero score', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, score: 0 },
    });

    cy.get('.team-score').should('contain.text', '0');
  });

  it('handles very large score values', () => {
    mount(TeamPanel, {
      props: { ...defaultProps, score: 999999 },
    });

    cy.get('.team-score').should('contain.text', '999999');
  });

  it('hides edit button when current player is not on this team', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team2');
    });

    mount(TeamPanel, {
      props: defaultProps,
    });

    cy.get('.btn-xs').should('not.exist');
  });

  it('shows static team name when editing but not current player team', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team2');
    });

    mount(TeamPanel, {
      props: { ...defaultProps, editing: true },
    });

    cy.get('input[type="text"]').should('not.exist');
    cy.get('.team-header').should('contain.text', 'TEAM ALPHA');
  });

  it('uses initialEditedName prop when provided', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('playerTeam', 'team1');
    });

    mount(TeamPanel, {
      props: {
        ...defaultProps,
        editing: true,
        initialEditedName: 'Initial Name',
      },
    });

    cy.get('input[type="text"]').should('have.value', 'Initial Name');
  });

  it('handles members with special characters', () => {
    mount(TeamPanel, {
      props: {
        ...defaultProps,
        members: ['José', 'François', 'Müller'],
      },
    });

    cy.get('.team-members-list li').should('have.length', 3);
    cy.get('.team-members-list li').eq(0).should('contain.text', 'José');
    cy.get('.team-members-list li').eq(1).should('contain.text', 'François');
    cy.get('.team-members-list li').eq(2).should('contain.text', 'Müller');
  });

  it('handles members with very long names', () => {
    const longName = 'A'.repeat(50);
    mount(TeamPanel, {
      props: {
        ...defaultProps,
        members: [longName],
      },
    });

    cy.get('.team-members-list li').should('contain.text', longName);
  });

  // Test for Vue DevTools warning suppression
  beforeEach(() => {
    cy.window().then((win) => {
      // Suppress Vue DevTools warning
      const winAny = win as any;
      if (winAny.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        winAny.__VUE_DEVTOOLS_GLOBAL_HOOK__.enabled = false;
      }
    });
  });
});

import { defineStore } from 'pinia';
import socket from '../utils/socket';

export const useGameStore = defineStore('game', {
  state: () => ({
    teamNames: { A: 'Team A', B: 'Team B' },
    teamScores: { A: 0, B: 0 } as Record<'A' | 'B', number>,
    answers: [] as { id: string; text: string; points: number }[],
    question: '',
    guessedAnswers: [] as { id: string; text: string; points: number }[],
    currentTeam: 'A' as 'A' | 'B',
    strikes: 0, // Current team's strikes during the round
    teamStrikes: { A: 0, B: 0 }, // Persistent strike count for each team
    pointPool: 0,
    firstTeam: null as 'A' | 'B' | null,
    secondTeamGuessUsed: false,
    scoreMultiplier: null as number | null,
    timer: 0,
    timerRunning: false,
    roundCounter: 0,
    roundOver: false, // New flag to track if the round is over
    pointsAwarded: 0, // New property to store awarded points
    winningTeam: null as 'A' | 'B' | null, // New property to store the winning team
    startingTeamSet: false,
    currentStep: 'manage',
    multiplierSet: false, // New property to track if the multiplier is set
    answersSaved: false, // New property to track if answers are saved
  }),

  actions: {
    initSocket() {
      socket.on('gameState', (newState) => {
        Object.assign(this, newState);
      });
      socket.on('update-game', (gameState) => {
        Object.assign(this.$state, gameState);
      });
    },

    uploadAnswers(answerList: { id: string; text: string; points: number }[]) {
      this.answers = answerList;
      this.guessedAnswers = [];
      this.currentTeam = 'A';
      this.strikes = 0;
      this.pointPool = 0;
      this.firstTeam = null;
      this.secondTeamGuessUsed = false;
    },

    // Set the starting team
    setStartingTeam(team: string | null) {
      if (team === 'A' || team === 'B' || team === null) {
        this.firstTeam = team;
        if (team !== null) {
          this.currentTeam = team;
        }
      }
    },

    // Set the score multiplier
    setScoreMultiplier(multiplier: number | null) {
      this.scoreMultiplier = multiplier;
    },

    guessAnswer(answerId: string) {
      const match = this.answers.find((a) => a.id === answerId); // Find the answer by its unique ID
      if (match && !this.guessedAnswers.includes(match.id)) {
        this.guessedAnswers.push(match.id); // Use the unique ID to track guessed answers
        this.pointPool += match.points * (this.scoreMultiplier ?? 1); // Apply multiplier here, default to 1 if null

        // Check if all answers have been guessed
        if (this.guessedAnswers.length === this.answers.length) {
          this.pointsAwarded = this.pointPool; // Use the already multiplied pointPool
          this.teamScores[this.currentTeam] += this.pointPool; // Award all points to the current team
          this.winningTeam =
            this.currentTeam === 'A' || this.currentTeam === 'B' ? this.currentTeam : null; // Set the current team as the winning team
          this.pointPool = 0; // Reset the point pool
          this.roundOver = true; // Mark the round as over
          return true;
        }
        return true;
      } else {
        this.strikes++;
        if (this.strikes >= 3) this.handleThreeStrikes();
        return false;
      }
    },

    handleThreeStrikes() {
      this.teamStrikes[this.currentTeam]++;

      if (this.currentTeam === this.firstTeam) {
        // Switch to the second team for their single guess
        this.currentTeam = this.otherTeam();
        this.strikes = 0; // Reset strikes for the second team
        this.secondTeamGuessUsed = false;
      } else {
        // If the second team fails, award the point pool to the first team
        this.pointsAwarded = this.pointPool; // Use the already multiplied pointPool
        if (this.firstTeam !== null) {
          if (this.firstTeam !== null) {
            this.teamScores[this.firstTeam] += this.pointPool;
          }
        }
        this.winningTeam = this.firstTeam; // Set the winning team
        this.pointPool = 0; // Reset the point pool
        this.roundOver = true; // Mark the round as over
        this.switchTeam(); // Switch back to the starting team
      }
    },

    secondTeamGuess(answerId: string) {
      if (this.secondTeamGuessUsed) return false;

      const match = this.answers.find((a) => a.id === answerId); // Find the answer by its unique ID
      if (match && !this.guessedAnswers.includes(match.id)) {
        // If the second team guesses correctly
        this.guessedAnswers.push(match.id);
        this.pointsAwarded = this.pointPool + match.points * (this.scoreMultiplier ?? 1); // Apply multiplier only to the guessed answer, default to 1 if null
        this.teamScores[this.currentTeam] += this.pointsAwarded; // Add points to the second team's score
        this.winningTeam = this.currentTeam; // Set the winning team
        this.pointPool = 0; // Reset the point pool
        this.roundOver = true; // Mark the round as over
        return true;
      } else {
        // If the second team guesses incorrectly
        this.secondTeamGuessUsed = true;
        this.pointsAwarded = this.pointPool; // Use the already multiplied pointPool
        if (this.firstTeam !== null) {
          if (this.firstTeam !== null) {
            this.teamScores[this.firstTeam] += this.pointPool;
          }
        }
        this.winningTeam = this.firstTeam; // Set the winning team
        this.pointPool = 0; // Reset the point pool
        this.roundOver = true; // Mark the round as over
        return false;
      }
    },

    switchTeam() {
      this.currentTeam = this.currentTeam === 'A' ? 'B' : 'A';
      this.strikes = 0;
    },

    otherTeam() {
      return this.currentTeam === 'A' ? 'B' : 'A';
    },

    resetGame() {
      this.teamNames = { A: 'Team A', B: 'Team B' };
      this.teamScores = { A: 0, B: 0 };
      this.roundCounter = 0;
      this.resetRound();
    },

    resetRound() {
      this.answers = [];
      this.guessedAnswers = [];
      this.currentTeam = 'A';
      this.strikes = 0;
      this.teamStrikes = { A: 0, B: 0 };
      this.pointPool = 0;
      this.firstTeam = null;
      this.secondTeamGuessUsed = false;
      this.scoreMultiplier = null;
      this.timer = 0;
      this.timerRunning = false;
      this.roundOver = false;
      this.question = '';
      this.pointsAwarded = 0;
      this.winningTeam = null;
      this.startingTeamSet = false;
      this.currentStep = 'manage';
      this.multiplierSet = false;
      this.answersSaved = false; // Reset the answers saved state
      console.log('resetRound called');
    },

    updateRoundCounter(round: number) {
      this.roundCounter = round;
    },

    incrementRoundCounter() {
      this.roundCounter++;
    },

    updateTeamScore(team: string, score: any) {
      if (team === 'A' || team === 'B') {
        this.teamScores[team] = score;
      }
    },

    updateTeamName(team: string, name: any) {
      if (team === 'A' || team === 'B') {
        this.teamNames[team] = name;
      }
    },

    setTimer(seconds: number) {
      this.timer = seconds;
    },

    startTimer() {
      this.timerRunning = true;
    },

    stopTimer() {
      this.timerRunning = false;
    },

    decrementTimer() {
      if (this.timerRunning && this.timer > 0) {
        this.timer--;
      }
    },

    resetTimer() {
      this.timer = 0;
      this.timerRunning = false;
    },

    uploadQuestion(question: string) {
      this.question = question;
    },
  },
});

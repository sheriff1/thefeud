import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import socket from '../utils/socket';

export const useGameStore = defineStore('game', {
  state: () => ({
    teamNames: { A: 'Team A', B: 'Team B' },
    teamScores: { A: 0, B: 0 },
    answers: [],
    guessedAnswers: [],
    currentTeam: 'A',
    strikes: 0, // Current team's strikes during the round
    teamStrikes: { A: 0, B: 0 }, // Persistent strike count for each team
    pointPool: 0,
    firstTeam: null,
    secondTeamGuessUsed: false,
    scoreMultiplier: null,
    timer: 0,
    timerRunning: false,
    roundCounter: 0,
    roundOver: false, // New flag to track if the round is over
    question: '', // New property to store the question
    pointsAwarded: 0, // New property to store awarded points
    winningTeam: null, // New property to store the winning team
    startingTeamSet: false,
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

    uploadAnswers(answerList) {
      this.answers = answerList;
      this.guessedAnswers = [];
      this.currentTeam = 'A';
      this.strikes = 0;
      this.pointPool = 0;
      this.firstTeam = null;
      this.secondTeamGuessUsed = false;
      this.syncToServer();
    },

    // Set the starting team
    setStartingTeam(team) {
      this.firstTeam = team;
      this.currentTeam = team;
      this.syncToServer();
    },

    // Set the score multiplier
    setScoreMultiplier(multiplier) {
      this.scoreMultiplier = multiplier;
      this.syncToServer();
    },

    guessAnswer(answerId) {
      const match = this.answers.find((a) => a.id === answerId); // Find the answer by its unique ID
      if (match && !this.guessedAnswers.includes(match.id)) {
        this.guessedAnswers.push(match.id); // Use the unique ID to track guessed answers
        this.pointPool += match.points * this.scoreMultiplier; // Apply multiplier here

        // Check if all answers have been guessed
        if (this.guessedAnswers.length === this.answers.length) {
          this.pointsAwarded = this.pointPool; // Use the already multiplied pointPool
          this.teamScores[this.currentTeam] += this.pointPool; // Award all points to the current team
          this.winningTeam = this.currentTeam; // Set the current team as the winning team
          this.pointPool = 0; // Reset the point pool
          this.roundOver = true; // Mark the round as over
          this.syncToServer();
          return true;
        }

        this.syncToServer();
        return true;
      } else {
        this.strikes++;
        if (this.strikes >= 3) this.handleThreeStrikes();
        this.syncToServer();
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
        this.teamScores[this.firstTeam] += this.pointPool;
        this.winningTeam = this.firstTeam; // Set the winning team
        this.pointPool = 0; // Reset the point pool
        this.roundOver = true; // Mark the round as over
        this.switchTeam(); // Switch back to the starting team
      }

      this.syncToServer();
    },

    secondTeamGuess(answerId) {
      if (this.secondTeamGuessUsed) return false;

      const match = this.answers.find((a) => a.id === answerId); // Find the answer by its unique ID
      if (match && !this.guessedAnswers.includes(match.id)) {
        // If the second team guesses correctly
        this.guessedAnswers.push(match.id);
        this.pointsAwarded = this.pointPool + match.points * this.scoreMultiplier; // Apply multiplier only to the guessed answer
        this.teamScores[this.currentTeam] += this.pointsAwarded; // Add points to the second team's score
        this.winningTeam = this.currentTeam; // Set the winning team
        this.pointPool = 0; // Reset the point pool
        this.roundOver = true; // Mark the round as over
        this.syncToServer();
        return true;
      } else {
        // If the second team guesses incorrectly
        this.secondTeamGuessUsed = true;
        this.pointsAwarded = this.pointPool; // Use the already multiplied pointPool
        this.teamScores[this.firstTeam] += this.pointPool;
        this.winningTeam = this.firstTeam; // Set the winning team
        this.pointPool = 0; // Reset the point pool
        this.roundOver = true; // Mark the round as over
        this.syncToServer();
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

    syncToServer() {
      const gameState = {
        answers: this.answers,
        guessedAnswers: this.guessedAnswers,
        teamScores: this.teamScores,
        currentTeam: this.currentTeam,
        strikes: this.strikes,
        pointPool: this.pointPool,
        firstTeam: this.firstTeam,
        secondTeamGuessUsed: this.secondTeamGuessUsed,
        scoreMultiplier: this.scoreMultiplier,
        timer: this.timer,
        timerRunning: this.timerRunning,
        teamNames: this.teamNames,
        roundCounter: this.roundCounter,
      };
      socket.emit('updateGameState', gameState);
    },

    resetGame() {
      this.teamNames = { A: 'Team A', B: 'Team B' };
      this.teamScores = { A: 0, B: 0 };
      this.roundCounter = 0;
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
      this.syncToServer(); // Ensure the reset state is synced with the Team Display
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
      this.syncToServer();
    },

    nextRound() {
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
      this.syncToServer();
    },

    updateRoundCounter(round) {
      this.roundCounter = round;
    },

    incrementRoundCounter() {
      this.roundCounter++;
      this.syncToServer();
    },

    updateTeamScore(team, score) {
      if (team === 'A' || team === 'B') {
        this.teamScores[team] = score;
        this.syncToServer();
      }
    },

    updateTeamName(team, name) {
      if (team === 'A' || team === 'B') {
        this.teamNames[team] = name;
      }
    },

    saveTeamNames() {
      this.syncToServer(); // Sync the updated team names with the server
    },

    setTimer(seconds) {
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

    uploadQuestion(question) {
      this.question = question;
      this.syncToServer();
    },
  },
});

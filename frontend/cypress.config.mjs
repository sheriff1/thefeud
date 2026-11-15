import { defineConfig } from 'cypress';
import { io } from 'socket.io-client';

// A complete GameState, as the backend's strict update-game schema requires. Used by the
// hostUpdateGame task below to play the host without driving the host UI (#23).
const BASE_GAME_STATE = {
  answers: [],
  answersSaved: false,
  buzzedPlayer: '',
  buzzerOnlyPressed: false,
  buzzerPlayers: { A: null, B: null },
  correctAfterBuzzer: false,
  correctBeforeBuzzer: false,
  currentStep: 1,
  currentTeam: 'A',
  enteredFromHome: false,
  firstTeam: null,
  gameReset: false,
  guessedAnswers: [],
  guessedAnswersCount: 0,
  isLoading: false,
  multiplierSet: false,
  nextRound: false,
  pointPool: 0,
  pointsAwarded: 0,
  question: '',
  questionSaved: false,
  roundCounter: 0,
  roundOver: false,
  roundReset: false,
  scoreMultiplier: null,
  secondTeamGuessUsed: false,
  startingTeam: null,
  startingTeamSet: false,
  strikes: 0,
  teamMembers: { A: [], B: [] },
  teamNames: { A: 'A', B: 'B' },
  teamScores: { A: 0, B: 0 },
  teamStrikes: { A: 0, B: 0 },
  timer: 0,
  timerRunning: false,
  winningTeam: null,
};

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Plays the host over a socket: reads the stored state, applies `patch`, sends update-game.
      on('task', {
        hostUpdateGame({ sessionId, patch }) {
          const backendUrl = config.env.backendUrl;
          return new Promise((resolve, reject) => {
            const socket = io(backendUrl, { transports: ['websocket'], reconnection: false });
            const fail = (err) => {
              socket.disconnect();
              reject(err instanceof Error ? err : new Error(JSON.stringify(err)));
            };
            const timer = setTimeout(() => fail(new Error('hostUpdateGame timed out')), 8000);
            socket.on('connect_error', fail);
            socket.on('error', fail);
            socket.on('connect', () => socket.emit('join-session', { sessionId }));
            socket.on('joined-session', () => socket.emit('get-current-state', { sessionId }));
            socket.on('current-state', (doc) => {
              const stored = Object.fromEntries(
                Object.entries(doc || {}).filter(([key]) => key in BASE_GAME_STATE),
              );
              socket.emit('update-game', {
                sessionId,
                gameState: { ...BASE_GAME_STATE, ...stored, ...patch },
              });
            });
            socket.on('update-game', () => {
              clearTimeout(timer);
              socket.disconnect();
              resolve(null);
            });
          });
        },
      });
    },
    env: {
      frontendUrl: 'http://localhost:5173/',
      backendUrl: 'http://localhost:4000/',
    },
    // Add settings to improve test stability
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    // Increase retry logic for CI environments
    retries: {
      runMode: 3, // Increased from 2 to 3
      openMode: 0,
    },
    // Add experimental settings for stability
    experimentalStudio: false,
    experimentalWebKitSupport: false,
    // Wait for network idle
    waitForAnimations: true,
    animationDistanceThreshold: 5,
  },

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
    // Add settings for component tests
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: {
      runMode: 3, // Increased from 2 to 3
      openMode: 0,
    },
    // Add stability settings for component tests
    waitForAnimations: true,
    animationDistanceThreshold: 5,
  },
});

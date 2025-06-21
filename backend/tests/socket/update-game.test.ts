import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

let socket: typeof Socket;
let sessionId: string;
let gameState = {
  answers: [],
  answersSaved: false,
  buzzedPlayer: '',
  buzzerOnlyPressed: false,
  correctAfterBuzzer: false,
  correctBeforeBuzzer: false,
  createdAt: undefined as { _seconds: number; _nanoseconds: number } | undefined,
  currentStep: 1,
  currentTeam: 'ABCD',
  enteredFromHome: false,
  expiryTime: '' as string | undefined,
  firstTeam: null,
  gameReset: false,
  guessedAnswers: [] as { id: string }[],
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
  scoreMultiplier: null as number | null,
  secondTeamGuessUsed: false,
  sessionId: '', // or your session id
  startingTeam: null as 'A' | 'B' | null,
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
beforeEach(async () => {
  sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  await db.collection('sessions').doc(sessionId).set({ sessionId, createdAt: Date.now() });
  gameState = {
    answers: [],
    answersSaved: false,
    buzzedPlayer: '',
    buzzerOnlyPressed: false,
    correctAfterBuzzer: false,
    correctBeforeBuzzer: false,
    createdAt: undefined,
    currentStep: 1,
    currentTeam: 'ABCD',
    enteredFromHome: false,
    expiryTime: '',
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
    sessionId: '',
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
  socket = Client('http://localhost:4000', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
});

afterEach(async () => {
  await db.collection('sessions').doc(sessionId).delete();
  if (socket && socket.connected) {
    socket.disconnect();
  }
});

// ---------- Test socket.io events ----------
describe('Socket.io', () => {
  // ----------- UPDATE-GAME  ----------- //

  // ✅ [SUCCESS] update-game: Test that updating the game state emits update-game and updates Firestore.
  it('should update items in the game state', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      gameState.roundCounter = 1;
      gameState.pointPool = 100;

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        socket.emit('update-game', {
          gameState,
          sessionId: sessionId,
        });
      });

      socket.on('update-game', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.roundCounter).toBe(1);
        expect(data.pointPool).toBe(100);
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [SUCCESS] update-game: Test updating the game state with a round over flag.
  it('should set game state to round over', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      gameState.roundOver = true;

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { sessionId, ...gameState },
        });
      });

      socket.on('update-game', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.roundOver).toBe(true);
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [SUCCESS] update-game: Test updating the game state with a reset round over flag.
  it('should reset round', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      gameState.pointPool = 100;
      gameState.scoreMultiplier = 1;
      gameState.roundReset = true;

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { sessionId, ...gameState },
        });
      });

      socket.on('update-game', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.pointPool).toBe(0);
        expect(data.scoreMultiplier).toBe(null);
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [SUCCESS] update-game: Test updating the game state with a reset game over flag.
  it('should reset game', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      gameState.pointPool = 100;
      gameState.scoreMultiplier = 1;
      gameState.teamScores = { A: 100, B: 100 };
      gameState.gameReset = true;

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { sessionId, ...gameState },
        });
      });

      socket.on('update-game', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.pointPool).toBe(0);
        expect(data.scoreMultiplier).toBe(null);
        expect(data.teamScores.A).toBe(0);
        expect(data.teamScores.B).toBe(0);
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [INVALID SESSION ID] update-game: Test that updating the game state with an invalid session ID returns an error.
  it('should return error when updating game state with an invalid session ID', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: 'INVALID_SESSION',
          gameState: { ...gameState },
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - update-game');
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [ERROR - INVALID FIELD] update-game: Test that updating the game state with a malformed payload returns an error.
  it('should return error when updating game state with a malformed payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState, invalidField: 'invalid' }, // Invalid field
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - update-game');
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [ERROR - NO GAME STATE] update-game: Test that updating the game state with a malformed payload returns an error.
  it('should return error when updating game state with a malformed payload with no game state', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: sessionId, // Invalid field
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Game state is required to update game');
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [EMPTY] update-game: Test that updating the game state with an empty payload returns an error.
  it('should return error when updating game state with an invalid session ID', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {});
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Session ID is required');
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });
});

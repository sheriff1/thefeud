import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
import request from 'supertest';
import app from '../../index.js';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db, server } from '../../index.js';

let socket: typeof Socket;
let sessionId: string;
let port: number;
let testServer: {
  address(): any;
  close: () => void;
};
let gameState = {
  answers: [],
  answersSaved: false,
  buzzedPlayer: '',
  buzzerOnlyPressed: false,
  correctAfterBuzzer: false,
  correctBeforeBuzzer: false,
  currentStep: 1,
  currentTeam: 'ABCD',
  firstTeam: null,
  gameReset: false,
  guessedAnswers: [],
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
  teamScores: { A: 0, B: 0 },
  teamStrikes: { A: 0, B: 0 },
  timer: 0,
  timerRunning: false,
  winningTeam: null,
};

request(app);

beforeAll(() => {
  testServer = server.listen(0, () => {
    port = (testServer.address() as any).port;
  });
});
afterAll(() => {
  testServer.close();
});

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
    currentStep: 1,
    currentTeam: 'ABCD',
    firstTeam: null,
    gameReset: false,
    guessedAnswers: [],
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
    teamScores: { A: 0, B: 0 },
    teamStrikes: { A: 0, B: 0 },
    timer: 0,
    timerRunning: false,
    winningTeam: null,
  };
  socket = Client(`http://localhost:${port}`, {
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
describe('Socket.io - get-current-state tests', () => {
  // ----------- GET-CURRENT-STATE  ----------- //

  // ✅ [SUCCESS] get-current-state: Test that requesting the current state returns the correct data.
  it('should get current game state', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      gameState.pointPool = 100;
      gameState.scoreMultiplier = 1;
      gameState.teamScores = { A: 100, B: 100 };

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState },
        });
      });

      socket.on('update-game', () => {
        socket.emit('get-current-state', { sessionId });
      });

      socket.on('current-state', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.pointPool).toBe(100);
        expect(data.scoreMultiplier).toBe(1);
        expect(data.teamScores.A).toBe(100);
        expect(data.teamScores.B).toBe(100);
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

  // ✅ [INVALID SESSION ID] get-current-state: Test that requesting an invalid current state returns null due to invalid session ID
  it('should get invalid return value for current game state due to invalid session ID', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);
      let resolved = false;

      socket.on('connect', () => {
        socket.emit('get-current-state', { sessionId: 'INVALID_SESSION' });
      });

      socket.once('current-state', (data) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        expect(data).toBeNull();
        socket.disconnect();
        resolve();
      });

      socket.once('error', (data) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        expect(data.message).toBe('Invalid request');
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

  // ✅ [ERROR - INVALID FIELD]  get-current-state: Test that requesting an invalid current state returns error due to a malformed payload
  it('should return error when requesting current game state with a malformed payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('get-current-state', { sessionId, invalidField: 'invalidValue' });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request');
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

  // ✅ [EMPTY] get-current-state: Test that requesting an invalid current state returns error due to an empty payload
  it('should return error when requesting current game state with an empty payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit update-game after joining
        socket.emit('get-current-state', {});
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

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });
});

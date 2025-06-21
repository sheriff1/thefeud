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
  // ----------- PLAY-STRIKE-SOUND  ----------- //

  // ✅ [SUCCESS] socket.on('play-strike-sound',...)
  it('should emit strike sound', async () => {
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
          gameState: { ...gameState },
        });
        socket.emit('play-strike-sound', { sessionId });
      });

      socket.on('play-strike-sound', () => {
        clearTimeout(timeout);
        expect(true).toBe(true);
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

  // ✅ [INVALID SESSION ID] socket.on('play-strike-sound',...), but session doesn't exist [ERROR]
  it('should return invalid session error when emitting strike sound', async () => {
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
          gameState: { ...gameState },
        });
        socket.emit('play-strike-sound', { sessionId: 'INVALID_SESSION' });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data.message).toBe('Invalid request - play-strike-sound');
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

  // ✅ [EMPTY] socket.on('play-strike-sound',...), but empty payload is sent
  it('should return empty payload error when emitting strike sound', async () => {
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
          gameState: { ...gameState },
        });
        socket.emit('play-strike-sound', {});
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
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

  // ✅ [ERROR] socket.on('play-strike-sound',...), but malformed payload is sent
  it('should return malformed payload error when emitting strike sound', async () => {
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
          gameState: { ...gameState },
        });
        socket.emit('play-strike-sound', { sessionId, invalidField: 'invalidValue' });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data.message).toBe('Invalid request - play-strike-sound');
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

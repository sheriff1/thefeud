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
  // ----------- BUZZ  ----------- //
  // ✅ [SUCCESS] socket.on('buzz',...)
  it('should set buzzed player', async () => {
    let buzzSent = false;

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
      });

      socket.on('update-game', (data) => {
        if (!buzzSent) {
          buzzSent = true;
          socket.emit('buzz', { sessionId, name: 'playerName' });
        } else if (data.buzzedPlayer === 'playerName') {
          socket.emit('get-current-state', { sessionId });
        }
      });

      socket.on('current-state', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.buzzedPlayer).toBe('playerName');
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

  // ✅ [INVALID SESSION ID] socket.on('buzz',...), but session doesn't exist
  it('should return error when setting buzzed player with an invalid session', async () => {
    await new Promise<void>((resolve, reject) => {
      let buzzSent = false;
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
      });

      socket.on('update-game', (data) => {
        if (!buzzSent) {
          buzzSent = true;
          socket.emit('buzz', { sessionId: 'INVALID_SESSION_ID', name: 'playerName' });
        } else if (data.buzzedPlayer === 'playerName') {
          socket.emit('get-current-state', { sessionId });
        }
      });

      socket.on('error', (data) => {
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

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [ERROR - NO NAME] socket.on('buzz',...), but malformed payload is sent
  it('should return error when setting buzzed player with no name', async () => {
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
      });

      socket.on('update-game', () => {
        // Missing name
        socket.emit('buzz', { sessionId });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data.message).toBe('Name is required to buzz');
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

  // ✅ [ERROR - INVALID FIELD] socket.on('buzz',...), but malformed payload is sent
  it('should return error when setting buzzed player with no name', async () => {
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
      });

      socket.on('update-game', () => {
        // Missing name
        socket.emit('buzz', { sessionId, name: 'playerName', invalidField: 'extraValue' });
      });

      socket.on('error', (data) => {
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

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  // ✅ [EMPTY] socket.on('buzz',...), but empty payload is sent
  it('should return error when setting buzzed player with an empty payload', async () => {
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
      });

      socket.on('update-game', () => {
        socket.emit('buzz', {});
      });

      socket.on('error', (data: { message: any }) => {
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
});

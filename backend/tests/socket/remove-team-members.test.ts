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
  // ----------- REMOVE-TEAM-MEMBERS  ----------- //
  // ✅ [SUCCESS] socket.on('remove-team-member',...)
  it('should remove team member', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      gameState.teamMembers = {
        A: ['player1', 'player2'],
        B: ['player3'],
      };

      socket.on('joined-session', () => {
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState },
        });
      });

      socket.on('update-game', () => {
        // Only emit get-team-members after update-game is confirmed
        socket.emit('remove-team-member', { sessionId: sessionId, team: 'A', name: 'player2' });
      });

      socket.on('team-members-updated', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
        expect(Array.isArray(data.A)).toBe(true);
        expect(Array.isArray(data.B)).toBe(true);
        // Check that the player was added to the correct team
        expect(data.A).toContain('player1');
        expect(data.A).not.toContain('player2');
        expect(data.B).toContain('player3');
        expect(data.A).toHaveLength(1);
        expect(data.B).toHaveLength(1);
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

  // ✅ [INVALID SESSION ID] socket.on('remove-team-member',...), but session doesn't exist
  it('should return error when removing team member due to invalid session', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        // Now emit remove-team-member after joining
        socket.emit('remove-team-member', {
          sessionId: 'INVALID_SESSION',
          name: 'playerName',
          team: 'A',
        });
      });

      socket.on('error', (data: { message: string }) => {
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

  // ✅ [ERROR - NO TEAM] socket.on('remove-team-member',...), but malformed payload is sent
  it('should return error when removing team member, but payload is malformed', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      gameState.teamMembers = {
        A: ['player1', 'player2'],
        B: ['player3'],
      };

      socket.on('joined-session', () => {
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState },
        });
      });

      socket.on('update-game', () => {
        // Only emit get-team-members after update-game is confirmed
        socket.emit('remove-team-member', {
          sessionId: sessionId,
          name: 'player2',
        });
      });

      socket.on('error', (data) => {
        console.error('Error received:', data);
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Team is required to remove team member');
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

  // ✅ [ERROR - NO NAME] socket.on('remove-team-member',...), but malformed payload is sent
  it('should return error when removing team member, but payload is malformed', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      gameState.teamMembers = {
        A: ['player1', 'player2'],
        B: ['player3'],
      };

      socket.on('joined-session', () => {
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState },
        });
      });

      socket.on('update-game', () => {
        // Only emit get-team-members after update-game is confirmed
        socket.emit('remove-team-member', {
          sessionId: sessionId,
          team: 'A',
        });
      });

      socket.on('error', (data) => {
        console.error('Error received:', data);
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Name is required to remove team member');
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

  // ✅ [ERROR - INVALID FIELD] socket.on('remove-team-member',...), but malformed payload is sent
  it('should return error when removing team member, but payload is malformed', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      gameState.teamMembers = {
        A: ['player1', 'player2'],
        B: ['player3'],
      };

      socket.on('joined-session', () => {
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState },
        });
      });

      socket.on('update-game', () => {
        // Only emit get-team-members after update-game is confirmed
        socket.emit('remove-team-member', {
          sessionId: sessionId,
          team: 'A',
          name: 'player2',
          invalidField: 'invalid',
        });
      });

      socket.on('error', (data) => {
        console.error('Error received:', data);
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

  // ✅ [EMPTY] socket.on('remove-team-member',...), but empty payload is sent
  it('should return error when removing team member, but payload is empty', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // First, join the session
        socket.emit('join-session', { sessionId });
      });

      gameState.teamMembers = {
        A: ['player1', 'player2'],
        B: ['player3'],
      };

      socket.on('joined-session', () => {
        socket.emit('update-game', {
          sessionId: sessionId,
          gameState: { ...gameState },
        });
      });

      socket.on('update-game', () => {
        // Now emit remove-team-member after joining
        socket.emit('remove-team-member', {});
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

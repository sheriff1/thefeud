import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

// #107 (quirks 2, 10, 11): what clients see when a request fails.

let socket: typeof Socket;
let sessionId: string;

beforeEach(async () => {
  sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  await db.collection('sessions').doc(sessionId).set({ sessionId, createdAt: Date.now() });
  socket = Client('http://localhost:4000', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
});

afterEach(async () => {
  await db.collection('sessions').doc(sessionId).delete();
  socket.disconnect();
});

function firstError(emit: () => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('No error event received')), 4000);
    socket.on('error', (data: { message: string }) => {
      clearTimeout(timeout);
      resolve(data.message);
    });
    emit();
  });
}

describe('missing session', () => {
  const MISSING = 'ZZZZ';
  const cases: [string, object][] = [
    ['join-session', { sessionId: MISSING }],
    ['get-current-state', { sessionId: MISSING }],
    ['get-team-members', { sessionId: MISSING }],
    ['play-strike-sound', { sessionId: MISSING }],
    ['buzz', { sessionId: MISSING, name: 'Sam' }],
    ['join-team', { sessionId: MISSING, name: 'Sam', team: 'A' }],
    ['update-team-name', { sessionId: MISSING, name: 'Reds', team: 'A' }],
    ['remove-team-member', { sessionId: MISSING, name: 'Sam', team: 'A' }],
  ];

  it.each(cases)('%s replies "Session does not exist"', async (event, payload) => {
    const message = await firstError(() => socket.emit(event, payload));
    expect(message).toBe('Session does not exist');
  });
});

describe('empty name', () => {
  const cases: [string, string, object][] = [
    ['buzz', 'Name is required to buzz', {}],
    ['join-team', 'Name is required to join team', { team: 'A' }],
    ['update-team-name', 'Name is required to update team name', { team: 'A' }],
    ['remove-team-member', 'Name is required to remove team member', { team: 'A' }],
  ];

  it.each(cases)('%s rejects name "" without writing', async (event, expected, extra) => {
    const message = await firstError(() => socket.emit(event, { sessionId, name: '', ...extra }));
    expect(message).toBe(expected);
    const data = (await db.collection('sessions').doc(sessionId).get()).data();
    expect(data?.teamMembers).toBeUndefined();
    expect(data?.teamNames).toBeUndefined();
    expect(data?.buzzedPlayer).toBeUndefined();
  });

  it('does not blame the name when another field is the problem', async () => {
    const message = await firstError(() =>
      socket.emit('buzz', { sessionId, name: 'Sam', extra: true }),
    );
    expect(message).toBe('Invalid request - buzz');
  });
});

describe('internal failures', () => {
  it('sends the fixed fallback, not the raw error message', async () => {
    // The session has no teamMembers field, so the handler throws a TypeError internally.
    const message = await firstError(() =>
      socket.emit('remove-team-member', { sessionId, name: 'Sam', team: 'A' }),
    );
    expect(message).toBe('Error removing team member');
    expect(message).not.toMatch(/undefined|Cannot read/);
  });
});

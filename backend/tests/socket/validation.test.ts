import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

// #107 (quirks 3 and 7): `team` is restricted to A or B, and validate-session always answers.

let socket: typeof Socket;
let sessionId: string;

beforeEach(async () => {
  sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  await db
    .collection('sessions')
    .doc(sessionId)
    .set({
      sessionId,
      createdAt: Date.now(),
      teamMembers: { A: ['Ann'], B: [] },
      teamNames: { A: 'A', B: 'B' },
    });
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

describe('team must be A or B', () => {
  const events = ['join-team', 'update-team-name', 'remove-team-member'];
  const badTeams = ['C', 'a', 'constructor', '__proto__'];
  const cases = events.flatMap((e) => badTeams.map((t) => [e, t] as [string, string]));

  it.each(cases)('%s rejects team %j and writes nothing', async (event, team) => {
    const message = await firstError(() => socket.emit(event, { sessionId, name: 'Sam', team }));
    expect(message).toBe(`Invalid request - ${event}`);
    const data = (await db.collection('sessions').doc(sessionId).get()).data();
    expect(data?.teamMembers).toEqual({ A: ['Ann'], B: [] });
    expect(data?.teamNames).toEqual({ A: 'A', B: 'B' });
  });

  it('still reports a missing team as required', async () => {
    const message = await firstError(() => socket.emit('join-team', { sessionId, name: 'Sam' }));
    expect(message).toBe('Team is required to join team');
  });

  it('still accepts A and B', async () => {
    const updated = new Promise<{ A: string[]; B: string[] }>((resolve) =>
      socket.on('team-members-updated', resolve),
    );
    socket.emit('join-team', { sessionId, name: 'Sam', team: 'B' });
    expect(await updated).toEqual({ A: ['Ann'], B: ['Sam'] });
  });
});

describe('validate-session without a sessionId', () => {
  it('calls the ack with exists: false and still emits the error', async () => {
    const error = new Promise<string>((resolve) =>
      socket.on('error', (d: { message: string }) => resolve(d.message)),
    );
    const ack = await new Promise<{ exists: boolean }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('ack never called')), 4000);
      socket.emit('validate-session', {}, (result: { exists: boolean }) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
    expect(ack).toEqual({ exists: false });
    expect(await error).toBe('Session ID is required');
  });
});

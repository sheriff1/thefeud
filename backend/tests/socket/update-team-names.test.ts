import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

// #133: the host's manual team-name override. Runs against the live backend on :4000.

type Sock = typeof Socket;
let sessionId: string;
let socket: Sock;

const stored = async () => (await db.collection('sessions').doc(sessionId).get()).data()!;

beforeEach(async () => {
  sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  await db.collection('sessions').doc(sessionId).set({ sessionId, createdAt: Date.now() });
  socket = Client('http://localhost:4000', { transports: ['websocket'], forceNew: true });
  await new Promise<void>((resolve) => {
    socket.once('joined-session', () => resolve());
    socket.once('connect', () => socket.emit('join-session', { sessionId }));
  });
});

afterEach(async () => {
  socket.disconnect();
  await db.collection('sessions').doc(sessionId).delete();
});

/** Send an event and resolve with the next team-names-updated or error. */
function send(event: string, payload: unknown): Promise<{ names?: any; error?: string }> {
  return new Promise((resolve) => {
    socket.once('team-names-updated', (names: any) => resolve({ names }));
    socket.once('error', (e: { message: string }) => resolve({ error: e.message }));
    socket.emit(event, payload);
  });
}

describe('update-team-names', () => {
  it('renames only the given team and broadcasts the merged names', async () => {
    const first = await send('update-team-names', { sessionId, teamNames: { A: 'Reds' } });
    expect(first.names).toEqual({ A: 'Reds', B: 'B' });
    const second = await send('update-team-names', { sessionId, teamNames: { B: 'Blues' } });
    expect(second.names).toEqual({ A: 'Reds', B: 'Blues' });
    expect((await stored()).teamNames).toEqual({ A: 'Reds', B: 'Blues' });
  });

  it('renames both teams in one call', async () => {
    const res = await send('update-team-names', { sessionId, teamNames: { A: 'X', B: 'Y' } });
    expect(res.names).toEqual({ A: 'X', B: 'Y' });
    expect((await stored()).teamNames).toEqual({ A: 'X', B: 'Y' });
  });

  it('keeps a name a player set earlier for the team that is not sent', async () => {
    await send('update-team-name', { sessionId, team: 'B', name: 'Players' });
    const res = await send('update-team-names', { sessionId, teamNames: { A: 'Host' } });
    expect(res.names).toEqual({ A: 'Host', B: 'Players' });
  });

  it.each([
    ['no teamNames', () => ({ sessionId })],
    ['empty teamNames', () => ({ sessionId, teamNames: {} })],
    ['empty name', () => ({ sessionId, teamNames: { A: '' } })],
    ['unknown team key', () => ({ sessionId, teamNames: { C: 'Nope' } })],
    ['unknown extra field', () => ({ sessionId, teamNames: { A: 'Ok' }, extra: 1 })],
    ['bad session id', () => ({ sessionId: 'toolong', teamNames: { A: 'Ok' } })],
  ])('rejects %s without writing', async (_label, payload) => {
    const res = await send('update-team-names', payload());
    expect(res.error).toBe('Invalid request - update-team-names');
    expect((await stored()).teamNames).toBeUndefined();
  });

  it('asks for the session id', async () => {
    const res = await send('update-team-names', { teamNames: { A: 'Ok' } });
    expect(res.error).toBe('Session ID is required');
  });
});

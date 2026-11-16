import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

// #123: disconnect cleanup. The server on port 4000 must run with DISCONNECT_GRACE_MS=400 (the
// default here; `npm run dev` and CI set it, see README Testing), so the grace period is short.
const GRACE = Number(process.env.DISCONNECT_GRACE_MS ?? 400);

type Sock = typeof Socket;
type Members = { A: string[]; B: string[] };
let sessionId: string;
let sockets: Sock[] = [];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until(check: () => Promise<boolean>, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return;
    await wait(50);
  }
  throw new Error('condition not met in time');
}

async function stored(): Promise<Members> {
  const doc = await db.collection('sessions').doc(sessionId).get();
  return doc.data()?.teamMembers ?? { A: [], B: [] };
}

function connect(): Promise<Sock> {
  return new Promise((resolve, reject) => {
    const s = Client('http://localhost:4000', {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    sockets.push(s);
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });
}

/** A socket that records every team-members-updated broadcast, in the session room. */
async function observer() {
  const s = await connect();
  const updates: Members[] = [];
  s.on('team-members-updated', (m: Members) => updates.push(m));
  s.emit('join-session', { sessionId });
  await new Promise<void>((r) => s.once('joined-session', () => r()));
  return { socket: s, updates };
}

async function join(s: Sock, name: string, team: 'A' | 'B') {
  s.emit('join-team', { sessionId, name, team });
  await until(async () => (await stored())[team].includes(name));
}

beforeEach(async () => {
  sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  sockets = [];
  await db
    .collection('sessions')
    .doc(sessionId)
    .set({
      sessionId,
      createdAt: new Date(),
      teamMembers: { A: [], B: [] },
    });
});

afterEach(async () => {
  sockets.forEach((s) => s.connected && s.disconnect());
  await wait(GRACE + 200); // let pending removals settle before the session goes away
  await db.collection('sessions').doc(sessionId).delete();
});

describe('team switch on one socket', () => {
  it('removes the player from the old team', { timeout: 20000 }, async () => {
    const { updates } = await observer();
    const player = await connect();
    await join(player, 'Ann', 'A');
    player.emit('join-team', { sessionId, name: 'Ann', team: 'B' });
    await until(async () => (await stored()).B.includes('Ann'));
    expect(await stored()).toEqual({ A: [], B: ['Ann'] });
    expect(updates.at(-1)).toEqual({ A: [], B: ['Ann'] });
  });

  it('a second name on the same socket replaces the first', { timeout: 20000 }, async () => {
    const player = await connect();
    await join(player, 'Ann', 'A');
    player.emit('join-team', { sessionId, name: 'Bea', team: 'A' });
    await until(async () => (await stored()).A.includes('Bea'));
    expect(await stored()).toEqual({ A: ['Bea'], B: [] });
  });

  it('moves the player out of the previous session', { timeout: 20000 }, async () => {
    const otherId = Math.random().toString(36).substring(2, 6).toUpperCase();
    await db
      .collection('sessions')
      .doc(otherId)
      .set({ sessionId: otherId, createdAt: new Date(), teamMembers: { A: [], B: [] } });
    try {
      const player = await connect();
      await join(player, 'Ann', 'A');
      player.emit('join-team', { sessionId: otherId, name: 'Ann', team: 'A' });
      await until(async () => {
        const other = (await db.collection('sessions').doc(otherId).get()).data();
        return other?.teamMembers.A.includes('Ann') && (await stored()).A.length === 0;
      });
    } finally {
      await wait(GRACE + 200);
      await db.collection('sessions').doc(otherId).delete();
    }
  });
});

describe('grace period', () => {
  it('keeps a disconnected player listed until the grace is over', { timeout: 20000 }, async () => {
    const { updates } = await observer();
    const player = await connect();
    await join(player, 'Ann', 'A');
    updates.length = 0;

    const left = Date.now();
    player.disconnect();
    await wait(GRACE / 2);
    expect((await stored()).A).toEqual(['Ann']);
    expect(updates).toHaveLength(0);

    await until(async () => (await stored()).A.length === 0);
    expect(Date.now() - left).toBeGreaterThanOrEqual(GRACE - 50);
    await until(async () => updates.length === 1);
    expect(updates[0]).toEqual({ A: [], B: [] });
  });

  it('a reconnect within the grace keeps the player, with no removal broadcast', async () => {
    const { updates } = await observer();
    const first = await connect();
    await join(first, 'Ann', 'A');
    updates.length = 0;

    first.disconnect();
    await wait(GRACE / 4);
    const second = await connect();
    second.emit('join-session', { sessionId });
    second.emit('join-team', { sessionId, name: 'Ann', team: 'A' });
    await wait(GRACE * 2);

    expect((await stored()).A).toEqual(['Ann']);
    expect(updates.every((m) => m.A.includes('Ann'))).toBe(true);
  });

  it('a late disconnect of the old socket does not remove a player who re-joined', async () => {
    const first = await connect();
    await join(first, 'Ann', 'A');
    const second = await connect();
    second.emit('join-team', { sessionId, name: 'Ann', team: 'A' });
    await wait(200);

    first.disconnect(); // e.g. the phone's old connection finally times out
    await wait(GRACE * 2);
    expect((await stored()).A).toEqual(['Ann']);

    second.disconnect();
    await until(async () => (await stored()).A.length === 0);
  });

  it('only removes the player who left', { timeout: 20000 }, async () => {
    const one = await connect();
    const two = await connect();
    await join(one, 'Ann', 'A');
    await join(two, 'Bob', 'B');
    one.disconnect();
    await until(async () => (await stored()).A.length === 0);
    expect((await stored()).B).toEqual(['Bob']);
  });

  it('an explicit removal is not followed by a second broadcast', async () => {
    const { updates } = await observer();
    const player = await connect();
    await join(player, 'Ann', 'A');
    player.emit('remove-team-member', { sessionId, name: 'Ann', team: 'A' });
    await until(async () => (await stored()).A.length === 0);
    const before = updates.length;
    player.disconnect(); // the logout disconnect
    await wait(GRACE * 2);
    expect(updates).toHaveLength(before);
  });

  it('leaves the host buzzer assignment alone when a selected buzzer leaves', async () => {
    await db
      .collection('sessions')
      .doc(sessionId)
      .set({ buzzerPlayers: { A: 'Ann', B: null } }, { merge: true });
    const player = await connect();
    await join(player, 'Ann', 'A');
    player.disconnect();
    await until(async () => (await stored()).A.length === 0);
    const doc = await db.collection('sessions').doc(sessionId).get();
    expect(doc.data()?.buzzerPlayers).toEqual({ A: 'Ann', B: null });
  });
});

describe('backend restart', () => {
  // A session created before this process booted may list players whose cleanup was lost.
  const hourAgo = () => new Date(Date.now() - 3600_000);

  it('sweeps listed players that nobody holds once the grace has passed', async () => {
    await db
      .collection('sessions')
      .doc(sessionId)
      .set({
        createdAt: hourAgo(),
        teamMembers: { A: ['Gone', 'Back'], B: ['AlsoGone'] },
        buzzerPlayers: { A: 'Gone', B: null },
      });
    const { socket, updates } = await observer(); // join-session triggers the sweep schedule
    socket.emit('join-team', { sessionId, name: 'Back', team: 'A' });

    await until(async () => {
      const m = await stored();
      return m.A.length === 1 && m.B.length === 0;
    });
    expect(await stored()).toEqual({ A: ['Back'], B: [] });
    expect(updates.at(-1)).toEqual({ A: ['Back'], B: [] });
    const doc = await db.collection('sessions').doc(sessionId).get();
    expect(doc.data()?.buzzerPlayers).toEqual({ A: 'Gone', B: null });
  });

  it('does not sweep sessions created after boot', async () => {
    await db
      .collection('sessions')
      .doc(sessionId)
      .set({ teamMembers: { A: ['Seeded'], B: [] } }, { merge: true });
    await observer();
    await wait(GRACE * 2);
    expect((await stored()).A).toEqual(['Seeded']);
  });
});

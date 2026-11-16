import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

// #122: concurrent writes must not lose data (team members, accepted buzz).

type Sock = typeof Socket;
let sessionId: string;
let sockets: Sock[] = [];

const baseState = () => ({
  answers: [],
  answersSaved: false,
  buzzedPlayer: '',
  buzzerOnlyPressed: false,
  correctAfterBuzzer: false,
  correctBeforeBuzzer: false,
  currentStep: 1,
  currentTeam: 'A',
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
});

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

type Members = { A: string[]; B: string[] };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const storedState = async () => (await db.collection('sessions').doc(sessionId).get()).data()!;

/** Poll until the condition holds; contended transactions retry with backoff, so they take seconds. */
async function until(check: () => Promise<boolean>, ms = 20000) {
  for (let t = 0; t < ms; t += 250) {
    if (await check()) return;
    await wait(250);
  }
}

async function observe(): Promise<{ socket: Sock; updates: Array<Record<string, any>> }> {
  const s = await connect();
  const updates: Array<Record<string, any>> = [];
  s.on('update-game', (data: Record<string, any>) => updates.push(data));
  await new Promise<void>((resolve) => {
    s.once('joined-session', () => resolve());
    s.emit('join-session', { sessionId });
  });
  return { socket: s, updates };
}

/** A host sending its (possibly stale) store, like HostDashboard does. */
function hostSends(host: Sock, patch: Record<string, unknown>) {
  host.emit('update-game', { sessionId, gameState: { ...baseState(), ...patch } });
}

beforeEach(async () => {
  sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  await db.collection('sessions').doc(sessionId).set({ sessionId, createdAt: Date.now() });
  sockets = [];
});

afterEach(async () => {
  sockets.forEach((s) => s.connected && s.disconnect());
  await db.collection('sessions').doc(sessionId).delete();
});

describe('team members: concurrent writes', () => {
  it('keeps every member of simultaneous join-team calls', { timeout: 40000 }, async () => {
    const joiners = await Promise.all(Array.from({ length: 8 }, () => connect()));
    joiners.forEach((s, i) =>
      s.emit('join-team', { sessionId, name: `P${i}`, team: i % 2 ? 'B' : 'A' }),
    );
    const total = async () => {
      const m: Members = (await storedState()).teamMembers ?? { A: [], B: [] };
      return m.A.length + m.B.length;
    };
    await until(async () => (await total()) === 8);
    const m: Members = (await storedState()).teamMembers;
    expect([...m.A].sort()).toEqual(['P0', 'P2', 'P4', 'P6']);
    expect([...m.B].sort()).toEqual(['P1', 'P3', 'P5', 'P7']);
  });

  it('keeps a join that races a remove-team-member', { timeout: 30000 }, async () => {
    await db
      .collection('sessions')
      .doc(sessionId)
      .set({ teamMembers: { A: ['Old'], B: [] } }, { merge: true });
    const [host, joiner] = await Promise.all([connect(), connect()]);
    host.emit('remove-team-member', { sessionId, name: 'Old', team: 'A' });
    joiner.emit('join-team', { sessionId, name: 'New', team: 'A' });
    await until(async () => (await storedState()).teamMembers?.A?.includes('New'));
    await wait(1000);
    expect((await storedState()).teamMembers.A).toEqual(['New']);
  });

  it('keeps both of two simultaneous team renames', { timeout: 30000 }, async () => {
    const [one, two] = await Promise.all([connect(), connect()]);
    one.emit('update-team-name', { sessionId, name: 'Reds', team: 'A' });
    two.emit('update-team-name', { sessionId, name: 'Blues', team: 'B' });
    await until(async () => {
      const n = (await storedState()).teamNames;
      return n?.A === 'Reds' && n?.B === 'Blues';
    });
    expect((await storedState()).teamNames).toEqual({ A: 'Reds', B: 'Blues' });
  });

  it(
    'removes a disconnecting player without losing a simultaneous join',
    { timeout: 30000 },
    async () => {
      const leaver = await connect();
      await new Promise<void>((resolve) => {
        leaver.on('team-members-updated', (m: Members) => m.A.includes('Leaver') && resolve());
        leaver.emit('join-team', { sessionId, name: 'Leaver', team: 'A' });
      });
      const joiner = await connect();
      joiner.emit('join-team', { sessionId, name: 'Stay', team: 'A' });
      leaver.disconnect();
      await until(async () => {
        const a: string[] = (await storedState()).teamMembers?.A ?? [];
        return a.includes('Stay') && !a.includes('Leaver');
      });
      expect((await storedState()).teamMembers.A).toEqual(['Stay']);
    },
  );
});

describe('update-game: server-owned fields', () => {
  it(
    'a stale host update-game cannot undo a player rename (#133)',
    { timeout: 30000 },
    async () => {
      const { socket: host, updates } = await observe();
      const player = await connect();
      player.emit('update-team-name', { sessionId, name: 'Reds', team: 'A' });
      await until(async () => (await storedState()).teamNames?.A === 'Reds');
      updates.length = 0;

      // The host's store still shows the default names.
      hostSends(host, { question: 'Name a fruit', teamNames: { A: 'A', B: 'B' } });
      await until(async () => (await storedState()).question === 'Name a fruit');

      expect((await storedState()).teamNames).toEqual({ A: 'Reds', B: 'B' });
      expect(updates[0].teamNames).toEqual({ A: 'Reds', B: 'B' });
    },
  );

  it('update-game does not write teamNames, even into a session without them', async () => {
    const { socket: host, updates } = await observe();
    hostSends(host, { question: 'Name a fruit', teamNames: { A: 'Typed', B: 'Typing' } });
    await until(async () => (await storedState()).question === 'Name a fruit');
    expect((await storedState()).teamNames).toEqual({ A: 'A', B: 'B' });
    expect(updates[0].teamNames).toEqual({ A: 'A', B: 'B' });
  });

  it('keeps an update-team-names racing an update-team-name for the other team', async () => {
    const [host, player] = await Promise.all([connect(), connect()]);
    host.emit('update-team-names', { sessionId, teamNames: { A: 'Host Reds' } });
    player.emit('update-team-name', { sessionId, name: 'Player Blues', team: 'B' });
    await until(async () => {
      const n = (await storedState()).teamNames;
      return n?.A === 'Host Reds' && n?.B === 'Player Blues';
    });
    expect((await storedState()).teamNames).toEqual({ A: 'Host Reds', B: 'Player Blues' });
  });

  it('a stale host update-game cannot overwrite teamMembers', { timeout: 30000 }, async () => {
    const { socket: host, updates } = await observe();
    const joiner = await connect();
    joiner.emit('join-team', { sessionId, name: 'Ann', team: 'A' });
    await until(async () => !!(await storedState()).teamMembers?.A?.includes('Ann'));
    updates.length = 0;

    // The host's store still shows an empty roster.
    hostSends(host, { question: 'Name a fruit', teamMembers: { A: [], B: [] } });
    await until(async () => (await storedState()).question === 'Name a fruit');

    const stored = await storedState();
    expect(stored.teamMembers).toEqual({ A: ['Ann'], B: [] });
    expect(updates[0].teamMembers).toEqual({ A: ['Ann'], B: [] });
  });

  it('a stale host update-game cannot clear an accepted buzz', { timeout: 30000 }, async () => {
    const { socket: host } = await observe();
    const [first, second] = await Promise.all([connect(), connect()]);
    first.emit('buzz', { sessionId, name: 'First' });
    await until(async () => (await storedState()).buzzedPlayer === 'First');

    hostSends(host, { question: 'Stale', buzzedPlayer: '' });
    await until(async () => (await storedState()).question === 'Stale');
    expect((await storedState()).buzzedPlayer).toBe('First');

    second.emit('buzz', { sessionId, name: 'Second' });
    await wait(1000);
    expect((await storedState()).buzzedPlayer).toBe('First');
  });

  it(
    'a stale host update-game does not drop a join that races it',
    { timeout: 40000 },
    async () => {
      const { socket: host } = await observe();
      const joiners = await Promise.all(Array.from({ length: 4 }, () => connect()));
      joiners.forEach((s, i) => s.emit('join-team', { sessionId, name: `P${i}`, team: 'A' }));
      hostSends(host, { question: 'Race' });
      await until(async () => {
        const s = await storedState();
        return s.question === 'Race' && (s.teamMembers?.A?.length ?? 0) === 4;
      });
      const s = await storedState();
      expect(s.question).toBe('Race');
      expect([...s.teamMembers.A].sort()).toEqual(['P0', 'P1', 'P2', 'P3']);
    },
  );

  it(
    'explicit resets still clear buzzedPlayer and the buzzer picks',
    { timeout: 40000 },
    async () => {
      const { socket: host } = await observe();
      const buzzer = await connect();

      for (const reset of [{ roundReset: true }, { gameReset: true }]) {
        buzzer.emit('buzz', { sessionId, name: 'Ann' });
        await until(async () => (await storedState()).buzzedPlayer === 'Ann');
        hostSends(host, { ...reset, buzzedPlayer: 'Ann', buzzerPlayers: { A: 'Ann', B: null } });
        await until(async () => (await storedState()).buzzedPlayer === '');
        const s = await storedState();
        expect(s.buzzedPlayer).toBe('');
        expect(s.buzzerPlayers).toEqual({ A: null, B: null });
      }
    },
  );

  it(
    'round over then next round clears the buzz and emits each event once',
    { timeout: 40000 },
    async () => {
      const { socket: host } = await observe();
      const buzzer = await connect();
      const events: string[] = [];
      for (const e of ['round-over', 'next-round', 'reset-buzzers']) {
        host.on(e, () => events.push(e));
      }
      buzzer.emit('buzz', { sessionId, name: 'Ann' });
      await until(async () => (await storedState()).buzzedPlayer === 'Ann');

      hostSends(host, { roundOver: true });
      await until(async () => (await storedState()).roundOver === true);
      expect(events).toEqual(['round-over']);

      hostSends(host, { roundOver: false });
      await until(async () => (await storedState()).roundOver === false);
      await wait(500);
      expect((await storedState()).buzzedPlayer).toBe('');
      expect(events).toEqual(['round-over', 'next-round', 'reset-buzzers']);
    },
  );
});

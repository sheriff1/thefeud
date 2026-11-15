import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

// #23: first buzz wins, and the host's buzzer assignment is checked on the server.

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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Join a team and wait until the server confirms it with team-members-updated. */
async function joinTeam(name: string, team: 'A' | 'B'): Promise<Sock> {
  const s = await connect();
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('join-team not confirmed')), 4000);
    s.on('team-members-updated', (m: { A: string[]; B: string[] }) => {
      if (m[team].includes(name)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    s.emit('join-team', { sessionId, name, team });
  });
  return s;
}

/** Observe the room and collect every update-game broadcast. */
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

const storedState = async () => (await db.collection('sessions').doc(sessionId).get()).data()!;

/** The host sends the whole state; mirrors what HostDashboard does with its store. */
async function hostSends(host: Sock, patch: Record<string, unknown>) {
  const current = await storedState();
  host.emit('update-game', {
    sessionId,
    gameState: {
      ...baseState(),
      teamMembers: current.teamMembers ?? baseState().teamMembers,
      ...patch,
    },
  });
  await wait(250);
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

describe('buzz: first wins', () => {
  it('accepts exactly one of many simultaneous buzzes', { timeout: 30000 }, async () => {
    const { socket: observer, updates } = await observe();
    await hostSends(observer, {});
    updates.length = 0;

    const names = Array.from({ length: 6 }, (_, i) => `Player${i}`);
    const buzzers = await Promise.all(names.map(() => connect()));
    buzzers.forEach((s, i) => s.emit('buzz', { sessionId, name: names[i] }));
    // Contended transactions retry with backoff, so wait for the winner, then for stragglers.
    for (let i = 0; i < 40 && !(await storedState()).buzzedPlayer; i++) await wait(250);
    await wait(1500);

    const winners = updates.filter((u) => u.buzzedPlayer).map((u) => u.buzzedPlayer);
    expect(winners).toHaveLength(1);
    expect((await storedState()).buzzedPlayer).toBe(winners[0]);
  });

  it('ignores a later buzz once someone has buzzed', async () => {
    const { socket: observer, updates } = await observe();
    await hostSends(observer, {});
    updates.length = 0;
    const [one, two] = await Promise.all([connect(), connect()]);

    one.emit('buzz', { sessionId, name: 'First' });
    await wait(400);
    two.emit('buzz', { sessionId, name: 'Second' });
    await wait(400);

    expect((await storedState()).buzzedPlayer).toBe('First');
    expect(updates.map((u) => u.buzzedPlayer)).toEqual(['First']);
  });
});

describe('buzz: host assignment', () => {
  it('only the selected buzzer of a team can buzz; resets clear the picks', async () => {
    const { socket: host, updates } = await observe();
    await joinTeam('Ann', 'A');
    await joinTeam('Al', 'A');
    await joinTeam('Bo', 'B');
    const [ann, al, bo] = [sockets[1], sockets[2], sockets[3]];
    await hostSends(host, { buzzerPlayers: { A: 'Ann', B: null } });
    expect((await storedState()).buzzerPlayers).toEqual({ A: 'Ann', B: null });
    updates.length = 0;

    // A teammate who is not selected is ignored.
    al.emit('buzz', { sessionId, name: 'Al' });
    await wait(400);
    expect((await storedState()).buzzedPlayer).toBe('');
    expect(updates).toHaveLength(0);

    // The selected buzzer wins; team B has no pick, but Bo is too late.
    ann.emit('buzz', { sessionId, name: 'Ann' });
    await wait(400);
    bo.emit('buzz', { sessionId, name: 'Bo' });
    await wait(400);
    expect((await storedState()).buzzedPlayer).toBe('Ann');
    expect(updates.map((u) => u.buzzedPlayer)).toEqual(['Ann']);

    // A round reset clears the buzzer and the picks.
    await hostSends(host, { roundReset: true, buzzerPlayers: { A: 'Ann', B: null } });
    const after = await storedState();
    expect(after.buzzedPlayer).toBe('');
    expect(after.buzzerPlayers).toEqual({ A: null, B: null });
  });

  it('lets a team without a pick buzz', async () => {
    const { socket: host } = await observe();
    const bo = await joinTeam('Bo', 'B');
    await hostSends(host, { buzzerPlayers: { A: 'Ann', B: null } });

    bo.emit('buzz', { sessionId, name: 'Bo' });
    await wait(400);
    expect((await storedState()).buzzedPlayer).toBe('Bo');
  });

  it('lets anyone buzz after Skip (both null)', async () => {
    const { socket: host } = await observe();
    const al = await joinTeam('Al', 'A');
    await hostSends(host, { buzzerPlayers: { A: null, B: null } });

    al.emit('buzz', { sessionId, name: 'Al' });
    await wait(400);
    expect((await storedState()).buzzedPlayer).toBe('Al');
  });

  it('still accepts an update-game that omits buzzerPlayers (older client)', async () => {
    const { socket: host } = await observe();
    let error: unknown = null;
    host.on('error', (e: unknown) => (error = e));
    await hostSends(host, { question: 'Old client' });
    expect(error).toBeNull();
    expect((await storedState()).question).toBe('Old client');
  });

  it('clears the picks on the next round and on a game reset', async () => {
    const { socket: host } = await observe();
    await hostSends(host, { roundOver: true, buzzerPlayers: { A: 'Ann', B: 'Bo' } });
    await hostSends(host, { roundOver: false, buzzerPlayers: { A: 'Ann', B: 'Bo' } });
    expect((await storedState()).buzzerPlayers).toEqual({ A: null, B: null });

    await hostSends(host, { gameReset: true, buzzerPlayers: { A: 'Ann', B: 'Bo' } });
    expect((await storedState()).buzzerPlayers).toEqual({ A: null, B: null });
  });
});

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Regression tests for #86: a malformed payload must produce an `error` event and must never
// crash the server (the process exits on any unhandled rejection).
// Runs against the live backend on :4000, like the other socket tests.
const URL = 'http://localhost:4000';

const EVENTS = [
  'buzz',
  'play-strike-sound',
  'join-session',
  'join-team',
  'get-current-state',
  'update-game',
  'update-team-name',
  'get-team-members',
  'remove-team-member',
  'validate-session',
];

const BAD_PAYLOADS: [string, unknown][] = [
  ['undefined', undefined],
  ['null', null],
  ['empty object', {}],
  ['a string', 'hello'],
  ['a number', 42],
  ['an array', []],
  ['wrong field types', { sessionId: 123, name: {}, team: [], gameState: 'x' }],
];

let socket: typeof Socket;

const connect = () =>
  new Promise<typeof Socket>((resolve, reject) => {
    const s = Client(URL, { transports: ['websocket'], forceNew: true, reconnection: false });
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });

const healthy = async () => (await fetch(`${URL}/api/health`)).status === 200;

beforeEach(async () => {
  socket = await connect();
});

afterEach(() => {
  if (socket?.connected) socket.disconnect();
});

describe('malformed socket payloads (#86)', () => {
  for (const event of EVENTS) {
    for (const [label, payload] of BAD_PAYLOADS) {
      it(`${event} with ${label} yields an error event and the server stays up`, async () => {
        const errorEvent = new Promise<{ message: string }>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('no error event received')), 3000);
          socket.once('error', (e: { message: string }) => {
            clearTimeout(timer);
            resolve(e);
          });
        });
        // validate-session also takes an ack callback; omit it so the missing-callback path is covered.
        socket.emit(event, payload);

        const err = await errorEvent;
        expect(typeof err.message).toBe('string');
        expect(err.message).not.toMatch(/Cannot read prop/i);
        expect(await healthy()).toBe(true);
      });
    }
  }
});

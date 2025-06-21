import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client, { Socket } from 'socket.io-client';
import { db } from '../../index.js';

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
  if (socket && socket.connected) {
    socket.disconnect();
  }
});

// ---------- Test socket.io events ----------
describe('Socket.io', () => {
  // ----------- JOIN-SESSION  ----------- //
  // ✅ [SUCCESS] join-session: Test that joining a session works and the socket joins the correct room.
  it('should join a session and receive a joined-session event', async () => {
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        socket.emit('join-session', {
          sessionId: sessionId,
        });
      });

      socket.on('joined-session', (data) => {
        expect(data).toBeDefined();
        expect(data.sessionId).toBe(sessionId);
        socket.disconnect();
      });

      socket.on('disconnect', () => resolve());
      socket.on('connect_error', reject);
      socket.on('error', reject);
    });
  });

  // ✅ [INVALID SESSION ID] join-session: Test that joining a session with an invalid session ID returns an error.
  it('should return error when joining a session with an invalid session ID', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        socket.emit('join-session', { sessionId: 'INVALID_SESSION' });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - join-session');
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
    });
  });

  // ✅ [EMPTY] join-session: Test that joining a session with an empty payload returns an error.
  it('should return error when joining a session with an empty payload', async () => {
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        // Missing sessionId
        socket.emit('join-session', {});
      });

      socket.on('error', (data) => {
        expect(data).toBeDefined();
        expect(data.message).toBe('Session ID is required');
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => resolve());
      socket.on('connect_error', reject);
      socket.on('error', reject);
    });
  });

  // ✅ [ERROR - INVALID FIELD]  join-session: Test that joining a session with a malformed payload returns an error.
  it('should return error when joining a session with a malformed payload', async () => {
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        // Missing sessionId
        socket.emit('join-session', { sessionId, invalidKey: 'invalidValue' });
      });

      socket.on('error', (data) => {
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - join-session');
        socket.disconnect();
        resolve();
      });

      socket.on('disconnect', () => resolve());
      socket.on('connect_error', reject);
      socket.on('error', reject);
    });
  });
});

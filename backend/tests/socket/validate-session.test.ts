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

describe('Socket.io - validate-session', () => {
  // ✅ [SUCCESS]
  it('should validate session exists', async () => {
    await new Promise<void>((resolve) => {
      socket.emit('validate-session', { sessionId }, (result: { exists: boolean }) => {
        expect(result.exists).toBe(true);
        resolve();
      });
    });
  });

  // ✅ [INVALID SESSION ID]
  it('should return exists: false for non-existent session', async () => {
    await new Promise<void>((resolve) => {
      socket.emit('validate-session', { sessionId: 'ZZZZ' }, (result: { exists: boolean }) => {
        expect(result.exists).toBe(false);
        resolve();
      });
      socket.on('error', (data) => {
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - getValidSessionDoc');
        resolve();
      });
    });
  });

  // ✅ [ERROR - INVALID FIELD]
  it('should return error for invalid payload', async () => {
    await new Promise<void>((resolve) => {
      socket.on('error', (data) => {
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - validate-session');
        resolve();
      });
      socket.emit('validate-session', { sessionId, invalidField: '1234' });
    });
  });

  // ✅ [EMPTY]
  it('should return error for empty payload', async () => {
    await new Promise<void>((resolve) => {
      socket.on('error', (data) => {
        expect(data).toBeDefined();
        expect(data.message).toBe('Session ID is required');
        resolve();
      });
      socket.emit('validate-session', {});
    });
  });
});

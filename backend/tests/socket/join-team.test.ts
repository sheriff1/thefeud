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
  // ----------- JOIN-TEAM  ----------- //
  // ✅ [SUCCESS] join-team: Test that joining a team updates Firestore and emits team-members-updated.
  it('should add Test User to Team A', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        socket.emit('join-team', {
          sessionId: sessionId,
          name: 'Test User',
          team: 'A',
        });
      });

      socket.on('team-members-updated', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
        expect(Array.isArray(data.A)).toBe(true);
        expect(Array.isArray(data.B)).toBe(true);
        // Check that the player was added to the correct team
        expect(data.A).toContain('Test User');
        expect(data.B).toHaveLength(0); // assuming only one player joined team A
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

  // ✅ [INVALID SESSION ID] join-team: Test that joining a team with an invalid session ID returns an error.
  it('should return error when joining a team with an invalid session ID', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        socket.emit('join-team', {
          sessionId: 'INVALID_SESSION',
          name: 'Test User',
          team: 'A',
        });
      });

      socket.on('error', (data) => {
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

  // ✅ [ERROR - INVALID FIELD]
  it('should return error when joining a team with a malformed payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // Missing team
        socket.emit('join-team', {
          sessionId: sessionId,
          team: 'A',
          name: 'Jim',
          invalidField: 'test',
        });
      });

      socket.on('error', (data) => {
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

  // ✅ [ERROR - NO NAME]
  it('should return error when joining a team with a malformed payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // Missing team
        socket.emit('join-team', { sessionId: sessionId, team: 'A' });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Name is required to join team');
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

  // ✅ [ERROR - NO TEAM]  join-team: Test that joining a team with a malformed playload returns an error.
  it('should return error when joining a team with a malformed payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // Missing team
        socket.emit('join-team', { sessionId: sessionId, name: 'Test User' });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Team is required to join team');
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

  // ✅ [EMPTY] join-team: Test that joining a team with an empty playload returns an error.
  it('should return error when joining a team with an empty payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        socket.emit('join-team', {});
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

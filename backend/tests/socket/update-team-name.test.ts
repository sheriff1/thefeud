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
  // ----------- UPDATE-TEAM-NAME  ----------- //

  // ✅ [SUCCESS] socket.on('update-team-name',...)
  it('should update team name', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        socket.emit('join-session', { sessionId });
      });

      socket.on('joined-session', () => {
        socket.emit('update-team-name', { sessionId, team: 'A', name: 'New Team A' });
      });

      socket.on('team-names-updated', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.A).toBe('New Team A');
        expect(data.B).toBe('B'); // default value
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

  // ✅ [INVALID SESSION ID] socket.on('update-team-name',...), but session doesn't exist
  it('should return error when updating team name', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // No need to join a session, just emit with an invalid sessionId
        socket.emit('update-team-name', {
          sessionId: 'INVALID_SESSION',
          team: 'A',
          name: 'New Team A',
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - update-team-name');
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

  // ✅ [ERROR - INVALID FIELD] socket.on('update-team-name',...), but malformed payload is sent
  it('should emit error if update-team-name payload is malformed', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // Missing 'team' and 'name'
        socket.emit('update-team-name', {
          sessionId,
          team: 'A',
          name: 'Jim',
          invalidField: 'test',
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Invalid request - update-team-name');
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

  // ✅ [ERROR - NO NAME] socket.on('update-team-name',...), but malformed payload is sent
  it('should emit error if update-team-name payload is malformed', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // Missing 'team' and 'name'
        socket.emit('update-team-name', {
          sessionId,
          team: 'A',
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Name is required to update team name');
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

  // ✅ [ERROR - NO TEAM] socket.on('update-team-name',...), but malformed payload is sent
  it('should emit error if update-team-name payload is malformed', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // Missing 'team' and 'name'
        socket.emit('update-team-name', {
          sessionId,
          name: 'Jim',
        });
      });

      socket.on('error', (data) => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.message).toBe('Team is required to update team name');
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

  // ✅ [EMPTY] socket.on('update-team-name',...), but empty payload is sent
  it('should return error when updating team name', async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Event not received in time')), 4000);

      socket.on('connect', () => {
        // No need to join a session, just emit with an invalid sessionId
        socket.emit('update-team-name', {});
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

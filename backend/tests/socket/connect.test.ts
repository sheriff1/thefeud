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
  // ----------- CONNECT & DISCONNECT  ----------- //
  // ✅ [SUCCESS] Connection/Disconnection: Test that a client can connect and disconnect.
  it('should connect and disconnect successfully', async () => {
    // Adjust the URL/port as needed for your test server
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
      });

      socket.on('disconnect', () => {
        expect(socket.connected).toBe(false);
        resolve();
      });

      socket.on('connect_error', (err) => {
        reject(err);
      });
    });
  });

  //TODO
  /*
  1. Player is Removed from Team on Disconnect
    Test: When a player disconnects, they are removed from their team in Firestore.
    How:
      Join a session and a team.
      Disconnect the socket.
      Fetch team members from Firestore and assert the player is no longer present.
  */
  //TODO
  /*    
  2. team-members-updated Event is Emitted
    Test: When a player disconnects, the server emits team-members-updated to the session with the updated team members.
    How:
      Join a session and a team.
      Listen for team-members-updated.
      Disconnect the socket and assert the event is received and the player is removed.
  */
  it('should remove player from team and emit team-members-updated on disconnect', async () => {
    // 1. Connect and join session/team
    // 2. Listen for team-members-updated
    // 3. Disconnect
    // 4. Assert player is removed from team in Firestore and event is emitted
  });
  //TODO
  /*    
  3. socketToPlayer Cleanup
    Test: The server removes the player from the socketToPlayer tracking object.
    How:
      This is more of an internal implementation detail, but you could expose a test-only endpoint or log to verify cleanup.
  */
  //TODO
  /*
  4. No Errors on Disconnect if Player Was Not Tracked
    Test: Disconnecting a socket that never joined a team/session does not throw or cause errors.
    How:
      Connect and disconnect without joining a team/session.
  */
  //TODO
  /*  
  5. Multiple Players in a Session
    Test: If multiple players are in a session, disconnecting one only removes that player.
    How:
      Join two sockets to the same team/session.
      Disconnect one.
      Assert the other is still present in team members.
  */
});

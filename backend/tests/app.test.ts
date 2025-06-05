import request from 'supertest';
import app from '../index.js';
import { describe, it, expect } from 'vitest';

describe('GET /api/answers-library', () => {
  it('should return a list of CSV files', async () => {
    const res = await request(app).get('/api/answers-library');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// Test for 200 status code

// Test for session exists

// Test create new session endpoint

// Test answers CSV endpoints

// Test select from library endpoint

// Test if CSV file is not found [ERROR]

// Test for invalid CSV file format [ERROR]

// Test for invalid session ID [ERROR]

// Test for session ID not found [ERROR]

// Test for helmet headers

// Test for CORS headers

// ---------- Test socket.io events ----------

// Connection/Disconnection: Test that a client can connect and disconnect.

// join-session: Test that joining a session works and the socket joins the correct room.

// join-team: Test that joining a team updates Firestore and emits team-members-updated.

// update-game: Test that updating the game state emits update-game and updates Firestore.

// set-starting-team: Test that setting the starting team updates Firestore and emits update-game.

// get-current-state: Test that requesting the current state returns the correct data.

// reset-round: Test that emitting reset-round triggers the correct events.

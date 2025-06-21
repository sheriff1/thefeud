import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
import request from 'supertest';
import app from '../../index.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Client from 'socket.io-client';
import type { Socket } from 'socket.io-client';
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

describe('Express & CORS', () => {
  // Test for 200 status code
  it('should return 200 status code (health)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });

  // Test answers CSV endpoints
  it('should return a list of CSV files', async () => {
    const res = await request(app).get('/api/answers-library');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test response format
  it('should return an array of CSV filenames (response shape)', async () => {
    const res = await request(app).get('/api/answers-library');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Each item should be a string ending with .csv
    for (const file of res.body) {
      expect(typeof file).toBe('string');
      expect(file.endsWith('.csv')).toBe(true);
    }
  });

  // Test for helmet headers
  it('should set security headers with helmet', async () => {
    const res = await request(app).get('/api/answers-library');
    // Helmet sets various headers, e.g.:
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-download-options']).toBe('noopen');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-xss-protection']).toBe('0'); // Helmet disables this by default in recent versions
  });

  // Test for CORS headers
  it('should set CORS headers', async () => {
    const res = await request(app)
      .get('/api/answers-library')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  // Test for session exists endpoint [app.get('/api/session-exists/:sessionId')]
  it('should return true for existing session', async () => {
    const res = await request(app).get('/api/session-exists/' + sessionId);
    expect(res.statusCode).toBe(200);
    expect(res.body.exists).toBe(true);
  });

  // Test for invalid session ID [ERROR]
  it('should return false for non-existent session', async () => {
    const res = await request(app).get('/api/session-exists/INVALID_SESSION_ID');
    expect(res.statusCode).toBe(200);
    expect(res.body.exists).toBe(false);
  });

  // Test create new session endpoint [app.post('/api/create-session/:sessionId')]
  it('should return true for existing session', async () => {
    let createSessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const res = await request(app).post('/api/create-session/' + createSessionId);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    // Verify the session was created in Firestore
    const doc = await db.collection('sessions').doc(createSessionId).get();
    expect(doc.exists).toBe(true);
    await db.collection('sessions').doc(createSessionId).delete();
  });

  it('should serve a CSV file from /answers', async () => {
    // Place a test CSV file in the answers directory before running this test
    const res = await request(app).get('/answers/Sample Template.csv');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('should return 404 for non-existent CSV file', async () => {
    const res = await request(app).get('/answers/doesnotexist.csv');
    expect(res.statusCode).toBe(404);
  });

  it('should deny CORS for disallowed origin', async () => {
    const res = await request(app)
      .get('/api/answers-library')
      .set('Origin', 'http://notallowed.com');
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Not allowed by CORS');
  });

  it('should handle malformed session creation', async () => {
    const res = await request(app).post('/api/create-session/');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should handle OPTIONS preflight request', async () => {
    const res = await request(app)
      .options('/api/answers-library')
      .set('Origin', 'http://localhost:5173');
    expect(res.statusCode).toBe(204); // or 200, depending on your config
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
import request from 'supertest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import app, { db } from '../../index.js';

// Regression tests for #86: a Firestore failure in an async route must become a 500 response
// (via the Express error middleware), not an unhandled rejection that kills the process.
const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => unhandled.push(reason);
process.on('unhandledRejection', onUnhandled);

afterEach(() => {
  vi.restoreAllMocks();
  unhandled.length = 0;
});

const failFirestore = () =>
  vi.spyOn(db, 'collection').mockImplementation(() => {
    throw new Error('firestore unavailable');
  });

const failFirestoreAsync = () =>
  vi.spyOn(db, 'collection').mockImplementation(
    () =>
      ({
        doc: () => ({
          get: () => Promise.reject(new Error('firestore timeout')),
          set: () => Promise.reject(new Error('firestore timeout')),
        }),
      }) as any,
  );

describe('async route errors (#86)', () => {
  it.each([
    ['GET', '/api/session-exists/ABCD'],
    ['POST', '/api/create-session/ABCD'],
  ])('%s %s returns 500 JSON when Firestore rejects', async (method, url) => {
    failFirestoreAsync();
    const res = await (method === 'GET' ? request(app).get(url) : request(app).post(url)).timeout(
      3000,
    );
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    await new Promise((r) => setTimeout(r, 50));
    expect(unhandled).toEqual([]);
  });

  it.each([
    ['GET', '/api/session-exists/ABCD'],
    ['POST', '/api/create-session/ABCD'],
  ])('%s %s returns 500 JSON when Firestore throws synchronously', async (method, url) => {
    failFirestore();
    const res = await (method === 'GET' ? request(app).get(url) : request(app).post(url)).timeout(
      3000,
    );
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('does not leak the error message to the client', async () => {
    failFirestoreAsync();
    const res = await request(app).get('/api/session-exists/ABCD').timeout(3000);
    expect(JSON.stringify(res.body)).not.toContain('firestore');
  });
});

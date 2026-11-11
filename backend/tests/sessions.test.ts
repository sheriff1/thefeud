import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { describe, it, expect, afterEach } from 'vitest';
import { db } from '../index.js';
import { createUniqueSession, generateSessionId } from '../sessions.js';

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => db.collection('sessions').doc(id).delete()));
});

describe('generateSessionId', () => {
  it('produces 4 chars of A-Z0-9', () => {
    for (let i = 0; i < 200; i++) expect(generateSessionId()).toMatch(/^[A-Z0-9]{4}$/);
  });
});

describe('createUniqueSession', () => {
  it('skips an ID that is already taken and does not overwrite the existing session', async () => {
    const taken = 'ZZ91';
    const fresh = 'ZZ92';
    created.push(taken, fresh);
    await db.collection('sessions').doc(taken).set({ sessionId: taken, marker: 'original' });

    const ids = [taken, fresh];
    const id = await createUniqueSession(db, { generate: () => ids.shift()! });

    expect(id).toBe(fresh);
    expect((await db.collection('sessions').doc(taken).get()).data()?.marker).toBe('original');
    expect((await db.collection('sessions').doc(fresh).get()).exists).toBe(true);
  });

  it('gives concurrent callers that generate the same ID different sessions', async () => {
    created.push('ZZ93', 'ZZ94');
    const ids = ['ZZ93', 'ZZ93', 'ZZ94'];
    const results = await Promise.all([
      createUniqueSession(db, { generate: () => ids.shift()! }),
      createUniqueSession(db, { generate: () => ids.shift()! }),
    ]);
    expect(new Set(results).size).toBe(2);
  });

  it('gives up after maxAttempts when every ID is taken', async () => {
    created.push('ZZ95');
    await db.collection('sessions').doc('ZZ95').set({ sessionId: 'ZZ95' });
    await expect(
      createUniqueSession(db, { generate: () => 'ZZ95', maxAttempts: 3 }),
    ).rejects.toThrow('Could not allocate a unique session ID');
  });
});

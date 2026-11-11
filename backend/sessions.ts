import { randomInt } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';

// Session IDs are exactly 4 chars of A-Z0-9 (see sessionIdSchema in index.ts).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 4;
const ALREADY_EXISTS = 6; // gRPC status code Firestore uses when create() hits an existing doc

export function generateSessionId(): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ALPHABET[randomInt(ALPHABET.length)];
  }
  return id;
}

/**
 * Create a session document under a fresh ID and return the ID.
 *
 * Uses Firestore `create()`, which fails atomically if the document already exists, so two
 * concurrent callers can never be handed the same ID (a read-then-write check could race).
 * Retries with a new ID on collision; throws after `maxAttempts` so a nearly full ID space
 * can't loop forever.
 */
export async function createUniqueSession(
  db: Firestore,
  { generate = generateSessionId, maxAttempts = 10 } = {},
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sessionId = generate();
    try {
      await db.collection('sessions').doc(sessionId).create({ sessionId, createdAt: new Date() });
      return sessionId;
    } catch (error: any) {
      if (error?.code !== ALREADY_EXISTS) throw error;
    }
  }
  throw new Error('Could not allocate a unique session ID');
}

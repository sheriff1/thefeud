/**
 * Helpers for disconnect cleanup (#123): the grace period and the pending removals.
 * Kept free of Socket.IO and Firestore so they can be unit-tested with fake timers.
 */

export const DEFAULT_DISCONNECT_GRACE_MS = 30_000;

/** `DISCONNECT_GRACE_MS`: a non-negative integer (0 = remove at once); anything else is the default. */
export function parseGraceMs(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_DISCONNECT_GRACE_MS;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_DISCONNECT_GRACE_MS;
}

export type Player = { sessionId: string; name: string; team: 'A' | 'B' };

export function playerKey({ sessionId, name, team }: Player): string {
  return JSON.stringify([sessionId, team, name]);
}

/** Pending removals by player key. Timers are unref'd so they never keep the process alive. */
export function createPendingRemovals() {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return {
    /** Runs `fn` after `ms`; replaces a removal already pending for `key`. */
    schedule(key: string, ms: number, fn: () => void) {
      this.cancel(key);
      const timer = setTimeout(() => {
        timers.delete(key);
        fn();
      }, ms);
      timer.unref?.();
      timers.set(key, timer);
    },
    cancel(key: string) {
      const timer = timers.get(key);
      if (timer) clearTimeout(timer);
      timers.delete(key);
    },
    has(key: string) {
      return timers.has(key);
    },
  };
}

/** Milliseconds since the epoch of a stored `createdAt` (Firestore Timestamp, Date or number), else null. */
export function createdAtMs(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const toMillis = (value as { toMillis?: () => number } | null)?.toMillis;
  return typeof toMillis === 'function' ? toMillis.call(value) : null;
}

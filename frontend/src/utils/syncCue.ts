/**
 * A late joiner starts with an empty store and `current-state` fills it in one step, which the
 * ding/strike watchers would read as "everything just happened" (#127). State that arrives through
 * a `current-state` sync (first join, late join, reconnect) is a catch-up, never a live event, so
 * it must not play sounds or show the strike animation. Only `update-game` cues.
 */

export interface SyncGuard {
  /** Apply a `current-state` payload; cues stay suppressed until Vue has run the watchers it triggers. */
  run(apply: () => void): void;
  isSyncing(): boolean;
}

/**
 * `nextTick` resolves after the pending watcher flush, so the guard is still raised while the
 * watchers react to `apply`. A counter (not a boolean) keeps two syncs in one tick correct.
 */
export function createSyncGuard(nextTick: (fn: () => void) => unknown): SyncGuard {
  let depth = 0;
  return {
    run(apply) {
      depth++;
      try {
        apply();
      } finally {
        nextTick(() => {
          depth--;
        });
      }
    },
    isSyncing: () => depth > 0,
  };
}

/** True when a new answer was guessed live (not synced in). */
export function shouldPlayDing(prevCount: number, nextCount: number, syncing: boolean): boolean {
  return !syncing && nextCount > prevCount;
}

/** The team that just got a live strike, or null. Team A wins a tie, as before. */
export function strikedTeam(
  prev: { A: number; B: number },
  next: { A: number; B: number },
  syncing: boolean,
): 'A' | 'B' | null {
  if (syncing) return null;
  if (next.A > prev.A) return 'A';
  if (next.B > prev.B) return 'B';
  return null;
}

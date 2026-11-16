import { describe, it, expect } from 'vitest';
import { nextTick, reactive, watch } from 'vue';
import { createSyncGuard, shouldPlayDing, strikedTeam } from './syncCue';
import { didTimeRunOut } from './timerCue';

describe('shouldPlayDing', () => {
  it('plays for a live increase', () => {
    expect(shouldPlayDing(2, 3, false)).toBe(true);
  });
  it('is silent while syncing, even for a big jump', () => {
    expect(shouldPlayDing(0, 5, true)).toBe(false);
  });
  it('is silent when the count is unchanged or goes down', () => {
    expect(shouldPlayDing(3, 3, false)).toBe(false);
    expect(shouldPlayDing(3, 0, false)).toBe(false);
  });
});

describe('strikedTeam', () => {
  it('returns the team with a live strike', () => {
    expect(strikedTeam({ A: 0, B: 0 }, { A: 1, B: 0 }, false)).toBe('A');
    expect(strikedTeam({ A: 1, B: 0 }, { A: 1, B: 2 }, false)).toBe('B');
  });
  it('is silent while syncing', () => {
    expect(strikedTeam({ A: 0, B: 0 }, { A: 3, B: 1 }, true)).toBeNull();
  });
  it('is silent without an increase', () => {
    expect(strikedTeam({ A: 2, B: 1 }, { A: 2, B: 1 }, false)).toBeNull();
    expect(strikedTeam({ A: 2, B: 1 }, { A: 0, B: 0 }, false)).toBeNull();
  });
});

describe('createSyncGuard', () => {
  it('is raised during and after apply until the next tick', async () => {
    const guard = createSyncGuard(nextTick);
    expect(guard.isSyncing()).toBe(false);
    guard.run(() => expect(guard.isSyncing()).toBe(true));
    expect(guard.isSyncing()).toBe(true);
    await nextTick();
    expect(guard.isSyncing()).toBe(false);
  });

  it('stays raised until both of two syncs in one tick are done', async () => {
    const queue: (() => void)[] = [];
    const guard = createSyncGuard((fn) => queue.push(fn));
    guard.run(() => {});
    guard.run(() => {});
    queue[0]();
    expect(guard.isSyncing()).toBe(true);
    queue[1]();
    expect(guard.isSyncing()).toBe(false);
  });

  it('is lowered even if apply throws', async () => {
    const guard = createSyncGuard(nextTick);
    expect(() =>
      guard.run(() => {
        throw new Error('bad payload');
      }),
    ).toThrow('bad payload');
    await nextTick();
    expect(guard.isSyncing()).toBe(false);
  });

  it('keeps real Vue watchers silent for a sync but not for a live update', async () => {
    const store = reactive({ guessed: [] as number[], strikes: { A: 0, B: 0 } });
    const guard = createSyncGuard(nextTick);
    const cues: string[] = [];
    watch(
      () => store.guessed,
      (n, o) => {
        if (shouldPlayDing(o.length, n.length, guard.isSyncing())) cues.push('ding');
      },
    );
    watch(
      () => store.strikes,
      (n, o) => {
        const t = strikedTeam(o, n, guard.isSyncing());
        if (t) cues.push(`strike${t}`);
      },
      { deep: true },
    );

    // late join: current-state fills everything at once
    guard.run(() => Object.assign(store, { guessed: [1, 2, 3], strikes: { A: 2, B: 1 } }));
    await nextTick();
    expect(cues).toEqual([]);

    // a reconnect with missed events is also a sync
    guard.run(() => Object.assign(store, { guessed: [1, 2, 3, 4], strikes: { A: 3, B: 1 } }));
    await nextTick();
    expect(cues).toEqual([]);

    // live update-game after joining still cues
    Object.assign(store, { guessed: [1, 2, 3, 4, 5], strikes: { A: 3, B: 2 } });
    await nextTick();
    expect(cues).toEqual(['ding', 'strikeB']);
  });
});

describe('first sync does not trigger the timer cue', () => {
  it('stays silent when a fresh store receives a stopped timer at 0', () => {
    const fresh = { timer: 0, timerRunning: false };
    expect(didTimeRunOut(fresh, { timer: 0, timerRunning: false })).toBe(false);
    expect(didTimeRunOut(fresh, { timer: 30, timerRunning: true })).toBe(false);
  });
});

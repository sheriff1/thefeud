import { describe, it, expect } from 'vitest';
import { useCountdown, COUNTDOWN_CHECK_MS } from './useCountdown';

/** A fake clock and interval so the countdown runs without real time. */
function setup(initialSeconds: number) {
  let clock = 1_000_000;
  let check: (() => void) | null = null;
  const state = { remaining: initialSeconds, running: false };
  const calls = { changes: [] as Array<{ remaining: number; running: boolean }>, expires: 0 };
  const intervals = { set: 0, cleared: 0, ms: 0 };

  const countdown = useCountdown({
    now: () => clock,
    setInterval: (fn, ms) => {
      intervals.set++;
      intervals.ms = ms;
      check = fn;
      return 'id';
    },
    clearInterval: () => {
      intervals.cleared++;
      check = null;
    },
    getRemaining: () => state.remaining,
    setRemaining: (n) => (state.remaining = n),
    setRunning: (r) => (state.running = r),
    onChange: () => calls.changes.push({ ...state }),
    onExpire: () => calls.expires++,
  });

  /** Move the clock forward and run one interval check, like a browser tick. */
  const advance = (ms: number) => {
    clock += ms;
    check?.();
  };
  return { countdown, state, calls, intervals, advance };
}

describe('useCountdown', () => {
  it('starts: marks running, sends the state once and checks 4 times a second', () => {
    const { countdown, state, calls, intervals } = setup(30);
    expect(countdown.start()).toBe(true);
    expect(state.running).toBe(true);
    expect(calls.changes).toEqual([{ remaining: 30, running: true }]);
    expect(intervals.ms).toBe(COUNTDOWN_CHECK_MS);
    expect(countdown.isActive()).toBe(true);
  });

  it('does nothing to start with 0 remaining or when already running', () => {
    const zero = setup(0);
    expect(zero.countdown.start()).toBe(false);
    expect(zero.state.running).toBe(false);
    expect(zero.intervals.set).toBe(0);

    const { countdown, intervals } = setup(10);
    countdown.start();
    expect(countdown.start()).toBe(false);
    expect(intervals.set).toBe(1);
  });

  it('only sends when the displayed second changes', () => {
    const { countdown, state, calls, advance } = setup(30);
    countdown.start();
    advance(250);
    advance(250);
    advance(250);
    expect(state.remaining).toBe(30);
    expect(calls.changes).toHaveLength(1);
    advance(250);
    expect(state.remaining).toBe(29);
    expect(calls.changes).toHaveLength(2);
  });

  it('does not drift when ticks are late: it jumps to the right remaining time', () => {
    const { countdown, state, advance } = setup(30);
    countdown.start();
    advance(12_000); // a throttled tab skipped 12 seconds of ticks
    expect(state.remaining).toBe(18);
    advance(1000);
    expect(state.remaining).toBe(17);
  });

  it('reaches 0 once: stops running, sends one final state and expires once', () => {
    const { countdown, state, calls, intervals, advance } = setup(2);
    countdown.start();
    advance(1000);
    expect(state.remaining).toBe(1);
    advance(1000);
    expect(state.remaining).toBe(0);
    expect(state.running).toBe(false);
    expect(calls.changes.at(-1)).toEqual({ remaining: 0, running: false });
    expect(calls.expires).toBe(1);
    expect(countdown.isActive()).toBe(false);
    expect(intervals.cleared).toBe(1);
    advance(5000); // the interval is gone, nothing more happens
    expect(calls.changes.filter((c) => c.remaining === 0)).toHaveLength(1);
    expect(calls.expires).toBe(1);
  });

  it('a very late first tick still ends at 0, never negative', () => {
    const { countdown, state, advance, calls } = setup(5);
    countdown.start();
    advance(60_000);
    expect(state.remaining).toBe(0);
    expect(calls.expires).toBe(1);
  });

  it('stop sends the stopped state once and is safe to repeat', () => {
    const { countdown, state, calls, advance } = setup(30);
    countdown.start();
    advance(1000);
    expect(countdown.stop()).toBe(true);
    expect(state.running).toBe(false);
    expect(state.remaining).toBe(29);
    expect(calls.changes.at(-1)).toEqual({ remaining: 29, running: false });
    const sent = calls.changes.length;
    expect(countdown.stop()).toBe(false);
    expect(calls.changes).toHaveLength(sent);
    expect(calls.expires).toBe(0);
  });

  it('stop when never started sends nothing', () => {
    const { countdown, calls } = setup(30);
    expect(countdown.stop()).toBe(false);
    expect(calls.changes).toHaveLength(0);
  });

  it('can start again from the remaining time after stop', () => {
    const { countdown, state, advance } = setup(30);
    countdown.start();
    advance(10_000);
    countdown.stop();
    expect(state.remaining).toBe(20);
    expect(countdown.start()).toBe(true);
    advance(5000);
    expect(state.remaining).toBe(15);
  });

  it('dispose clears the interval without sending anything', () => {
    const { countdown, calls, intervals } = setup(30);
    countdown.start();
    const sent = calls.changes.length;
    countdown.dispose();
    expect(intervals.cleared).toBe(1);
    expect(calls.changes).toHaveLength(sent);
    expect(countdown.isActive()).toBe(false);
  });
});

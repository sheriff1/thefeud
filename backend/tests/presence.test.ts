import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DEFAULT_DISCONNECT_GRACE_MS,
  createPendingRemovals,
  createdAtMs,
  parseGraceMs,
  playerKey,
} from '../presence.js';

afterEach(() => vi.useRealTimers());

describe('parseGraceMs', () => {
  it('defaults to 30 seconds', () => {
    expect(DEFAULT_DISCONNECT_GRACE_MS).toBe(30000);
    expect(parseGraceMs(undefined)).toBe(30000);
    expect(parseGraceMs('')).toBe(30000);
  });
  it('accepts a non-negative integer, including 0', () => {
    expect(parseGraceMs('400')).toBe(400);
    expect(parseGraceMs('0')).toBe(0);
  });
  it('falls back to the default for anything else', () => {
    for (const bad of ['abc', '-5', '1.5', 'Infinity', 'NaN']) {
      expect(parseGraceMs(bad)).toBe(30000);
    }
  });
});

describe('createPendingRemovals', () => {
  it('runs the removal after the delay', () => {
    vi.useFakeTimers();
    const pending = createPendingRemovals();
    const fn = vi.fn();
    pending.schedule('k', 100, fn);
    expect(pending.has('k')).toBe(true);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(pending.has('k')).toBe(false);
  });
  it('cancel prevents the removal', () => {
    vi.useFakeTimers();
    const pending = createPendingRemovals();
    const fn = vi.fn();
    pending.schedule('k', 100, fn);
    pending.cancel('k');
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    expect(pending.has('k')).toBe(false);
  });
  it('scheduling the same key again replaces the earlier removal', () => {
    vi.useFakeTimers();
    const pending = createPendingRemovals();
    const first = vi.fn();
    const second = vi.fn();
    pending.schedule('k', 100, first);
    pending.schedule('k', 100, second);
    vi.advanceTimersByTime(100);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});

describe('playerKey', () => {
  it('differs by session, team and name', () => {
    const base = { sessionId: 'ABCD', name: 'Ann', team: 'A' as const };
    expect(playerKey(base)).toBe(playerKey({ ...base }));
    expect(playerKey(base)).not.toBe(playerKey({ ...base, team: 'B' }));
    expect(playerKey(base)).not.toBe(playerKey({ ...base, name: 'Bob' }));
    expect(playerKey(base)).not.toBe(playerKey({ ...base, sessionId: 'WXYZ' }));
  });
});

describe('createdAtMs', () => {
  it('reads a Firestore Timestamp, a Date and a number', () => {
    expect(createdAtMs({ toMillis: () => 5 })).toBe(5);
    expect(createdAtMs(new Date(7))).toBe(7);
    expect(createdAtMs(9)).toBe(9);
  });
  it('returns null when unknown', () => {
    expect(createdAtMs(undefined)).toBeNull();
    expect(createdAtMs('x')).toBeNull();
  });
});

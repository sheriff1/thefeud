import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SESSION_GONE_MESSAGE,
  isSessionGone,
  handleSessionGone,
  leaveGoneSession,
  resetSessionGoneGuard,
} from './sessionGone';

beforeEach(() => resetSessionGoneGuard());

describe('isSessionGone', () => {
  it('matches only the exact backend message', () => {
    expect(isSessionGone({ message: 'Session does not exist' })).toBe(true);
    expect(isSessionGone({ message: 'Session does not exist.' })).toBe(false);
    expect(isSessionGone({ message: 'Failed to join team' })).toBe(false);
    expect(isSessionGone({ message: 'Session ID is required' })).toBe(false);
    expect(isSessionGone({})).toBe(false);
    expect(isSessionGone(null)).toBe(false);
    expect(isSessionGone(undefined)).toBe(false);
  });

  it('stays in sync with SESSION_NOT_FOUND in the backend', () => {
    const source = readFileSync(resolve(__dirname, '../../../backend/safe-handlers.ts'), 'utf8');
    const match = source.match(/export const SESSION_NOT_FOUND = '([^']*)'/);
    expect(match?.[1]).toBe(SESSION_GONE_MESSAGE);
  });
});

describe('handleSessionGone', () => {
  it('cleans up and redirects home with the notice, once, however many errors arrive', () => {
    const router = { replace: vi.fn() };
    const cleanup = vi.fn();
    handleSessionGone(router, cleanup);
    handleSessionGone(router, cleanup);
    handleSessionGone(router, cleanup);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/?notice=session-gone');
  });

  it('handles a later session again after the guard is reset', () => {
    const router = { replace: vi.fn() };
    handleSessionGone(router);
    resetSessionGoneGuard();
    handleSessionGone(router);
    expect(router.replace).toHaveBeenCalledTimes(2);
  });
});

describe('leaveGoneSession', () => {
  it('logs the store out, forgets the player and goes home, once', () => {
    const router = { replace: vi.fn() };
    const store = { logout: vi.fn() };
    const storage = { removeItem: vi.fn() };
    leaveGoneSession(router, store, storage);
    leaveGoneSession(router, store, storage);
    expect(store.logout).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).toHaveBeenCalledTimes(2);
    expect(storage.removeItem).toHaveBeenCalledWith('playerName');
    expect(storage.removeItem).toHaveBeenCalledWith('playerTeam');
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/?notice=session-gone');
  });
});

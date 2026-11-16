import { describe, it, expect } from 'vitest';
import { didTimeRunOut } from './timerCue';

describe('didTimeRunOut', () => {
  it('plays when a running timer with time left reaches 0', () => {
    expect(didTimeRunOut({ timer: 1, timerRunning: true }, { timer: 0, timerRunning: false })).toBe(
      true,
    );
    // a throttled host tab can skip straight from 5 to 0
    expect(didTimeRunOut({ timer: 5, timerRunning: true }, { timer: 0, timerRunning: false })).toBe(
      true,
    );
  });

  it('does not play when the timer was stopped first (manual Stop, then Reset)', () => {
    expect(
      didTimeRunOut({ timer: 12, timerRunning: false }, { timer: 0, timerRunning: false }),
    ).toBe(false);
  });

  it('does not play on load or while idle at 0', () => {
    expect(
      didTimeRunOut({ timer: 0, timerRunning: false }, { timer: 0, timerRunning: false }),
    ).toBe(false);
    expect(didTimeRunOut({ timer: 0, timerRunning: true }, { timer: 0, timerRunning: false })).toBe(
      false,
    );
  });

  it('does not play while time is left', () => {
    expect(didTimeRunOut({ timer: 5, timerRunning: true }, { timer: 4, timerRunning: true })).toBe(
      false,
    );
    expect(
      didTimeRunOut({ timer: 0, timerRunning: false }, { timer: 30, timerRunning: true }),
    ).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIMER_PRESETS,
  MAX_PRESET_SECONDS,
  TIMER_PRESETS_KEY,
  loadTimerPresets,
  presetSecondsFor,
  sanitizeSeconds,
  saveTimerPresets,
} from './timerPresets';
import { GameStep } from './gameSteps';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('timerPresets', () => {
  it('defaults to off with no durations', () => {
    expect(loadTimerPresets(memoryStorage())).toEqual({ enabled: false, buzzer: 0, guessing: 0 });
  });

  it('round-trips saved presets', () => {
    const storage = memoryStorage();
    saveTimerPresets({ enabled: true, buzzer: 20, guessing: 90 }, storage);
    expect(loadTimerPresets(storage)).toEqual({ enabled: true, buzzer: 20, guessing: 90 });
  });

  it('falls back to defaults for corrupt or hostile stored data', () => {
    expect(loadTimerPresets(memoryStorage({ [TIMER_PRESETS_KEY]: '{not json' }))).toEqual(
      DEFAULT_TIMER_PRESETS,
    );
    expect(loadTimerPresets(memoryStorage({ [TIMER_PRESETS_KEY]: '"text"' }))).toEqual(
      DEFAULT_TIMER_PRESETS,
    );
    expect(
      loadTimerPresets(
        memoryStorage({
          [TIMER_PRESETS_KEY]: JSON.stringify({ enabled: 'yes', buzzer: -5, guessing: 'abc' }),
        }),
      ),
    ).toEqual(DEFAULT_TIMER_PRESETS);
  });

  it('does not throw when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadTimerPresets(blocked)).toEqual(DEFAULT_TIMER_PRESETS);
    expect(() =>
      saveTimerPresets({ enabled: true, buzzer: 5, guessing: 5 }, blocked),
    ).not.toThrow();
  });

  it('sanitizes seconds to whole numbers from 0 to the maximum', () => {
    expect(sanitizeSeconds(30.9)).toBe(30);
    expect(sanitizeSeconds('45')).toBe(45);
    expect(sanitizeSeconds(-1)).toBe(0);
    expect(sanitizeSeconds(NaN)).toBe(0);
    expect(sanitizeSeconds('')).toBe(0);
    expect(sanitizeSeconds(99999)).toBe(MAX_PRESET_SECONDS);
  });

  it('presetSecondsFor returns the step preset only when enabled', () => {
    const on = { enabled: true, buzzer: 20, guessing: 90 };
    expect(presetSecondsFor(GameStep.Buzzer, on)).toBe(20);
    expect(presetSecondsFor(GameStep.Guessing, on)).toBe(90);
    expect(presetSecondsFor(GameStep.WhoStarts, on)).toBe(0);
    expect(presetSecondsFor(GameStep.Buzzer, { ...on, enabled: false })).toBe(0);
    expect(presetSecondsFor(GameStep.Guessing, { ...on, guessing: 0 })).toBe(0);
  });
});

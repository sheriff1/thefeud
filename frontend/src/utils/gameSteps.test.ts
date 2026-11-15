import { describe, it, expect } from 'vitest';
import { GameStep, GAME_STEP_ORDER, stepBefore } from './gameSteps';

describe('gameSteps', () => {
  it('keeps the values the backend stores (1 to 8)', () => {
    expect(Object.values(GameStep)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(GameStep.SelectBuzzers).toBe(4);
    expect(GameStep.Buzzer).toBe(5);
    expect(GameStep.Guessing).toBe(7);
  });

  it('lists every step once, in flow order', () => {
    expect(GAME_STEP_ORDER.map((s) => s.step)).toEqual(Object.values(GameStep));
    expect(GAME_STEP_ORDER.map((s) => s.label)).toEqual([
      'Start',
      'Q&A',
      'Multiplier',
      'Buzzers',
      'Buzzer',
      'Who Starts',
      'Guessing',
      'Award',
    ]);
  });

  it('stepBefore returns the previous step in the flow', () => {
    expect(stepBefore(GameStep.SelectBuzzers)).toBe(GameStep.Multiplier);
    expect(stepBefore(GameStep.Buzzer)).toBe(GameStep.SelectBuzzers);
    expect(stepBefore(GameStep.Guessing)).toBe(GameStep.WhoStarts);
    expect(stepBefore(GameStep.Award)).toBe(GameStep.Guessing);
  });

  it('stepBefore returns null for the first step and unknown values', () => {
    expect(stepBefore(GameStep.Start)).toBeNull();
    expect(stepBefore(99)).toBeNull();
  });
});

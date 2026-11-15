import { describe, it, expect } from 'vitest';
import { decideTimerAction } from './timerStepDecision';
import { GameStep } from './gameSteps';

const on = { enabled: true, buzzer: 20, guessing: 90 };

describe('decideTimerAction', () => {
  it('starts the buzzer preset on moving SelectBuzzers -> Buzzer (Confirm or Skip)', () => {
    expect(decideTimerAction(GameStep.SelectBuzzers, GameStep.Buzzer, on)).toEqual({
      action: 'start',
      seconds: 20,
    });
  });

  it('starts nothing while the host selects buzzers (Multiplier -> SelectBuzzers)', () => {
    expect(decideTimerAction(GameStep.Multiplier, GameStep.SelectBuzzers, on)).toEqual({
      action: 'none',
    });
  });

  it('does not start the buzzer preset when selection was skipped as a jump', () => {
    expect(decideTimerAction(GameStep.Multiplier, GameStep.Buzzer, on)).toEqual({ action: 'none' });
  });

  it('starts the guessing preset on moving WhoStarts -> Guessing', () => {
    expect(decideTimerAction(GameStep.WhoStarts, GameStep.Guessing, on)).toEqual({
      action: 'start',
      seconds: 90,
    });
  });

  it('stops when leaving a timed step forward', () => {
    expect(decideTimerAction(GameStep.Buzzer, GameStep.WhoStarts, on)).toEqual({ action: 'stop' });
    expect(decideTimerAction(GameStep.Guessing, GameStep.Award, on)).toEqual({ action: 'stop' });
  });

  it('does nothing with presets off, so the manual timer is untouched', () => {
    const off = { ...on, enabled: false };
    expect(decideTimerAction(GameStep.SelectBuzzers, GameStep.Buzzer, off)).toEqual({
      action: 'none',
    });
    expect(decideTimerAction(GameStep.Buzzer, GameStep.WhoStarts, off)).toEqual({ action: 'none' });
  });

  it('does nothing for a step with no preset', () => {
    const noBuzzer = { ...on, buzzer: 0 };
    expect(decideTimerAction(GameStep.SelectBuzzers, GameStep.Buzzer, noBuzzer)).toEqual({
      action: 'none',
    });
    expect(decideTimerAction(GameStep.Buzzer, GameStep.WhoStarts, noBuzzer)).toEqual({
      action: 'none',
    });
  });

  it('ignores jumps, like a reload restoring the step from the backend', () => {
    expect(decideTimerAction(GameStep.Start, GameStep.Buzzer, on)).toEqual({ action: 'none' });
    expect(decideTimerAction(GameStep.Start, GameStep.Guessing, on)).toEqual({ action: 'none' });
    expect(decideTimerAction(GameStep.Guessing, GameStep.Start, on)).toEqual({ action: 'none' });
  });

  it('ignores a step that did not change', () => {
    expect(decideTimerAction(GameStep.Buzzer, GameStep.Buzzer, on)).toEqual({ action: 'none' });
  });
});

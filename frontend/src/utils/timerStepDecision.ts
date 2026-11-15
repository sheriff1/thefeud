import { stepBefore } from './gameSteps';
import { presetSecondsFor, type TimerPresets } from './timerPresets';

export type TimerAction =
  | { action: 'start'; seconds: number }
  | { action: 'stop' }
  | { action: 'none' };

/**
 * What the host's timer should do when `currentStep` changes from `prev` to `next` (#17).
 *
 * Only a normal forward move (to the step right after `prev` in the flow) counts. A jump, like a
 * reload restoring step 4 from the backend, does nothing, so reloading never starts a timer.
 * With presets off nothing happens, so the manual timer behaves exactly as before.
 */
export function decideTimerAction(prev: number, next: number, presets: TimerPresets): TimerAction {
  if (!presets.enabled) return { action: 'none' };
  if (stepBefore(next) !== prev) return { action: 'none' };
  const seconds = presetSecondsFor(next, presets);
  if (seconds > 0) return { action: 'start', seconds };
  if (presetSecondsFor(prev, presets) > 0) return { action: 'stop' };
  return { action: 'none' };
}

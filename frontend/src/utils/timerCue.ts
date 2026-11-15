/** The two timer fields every view receives through update-game. */
export interface TimerSnapshot {
  timer: number;
  timerRunning: boolean;
}

/**
 * True when the timer just ran out by itself (#17). The host always sends a "stopped" state before
 * any manual stop, reset or step change, so a state that goes from running with time left straight
 * to 0 can only be the countdown expiring. Loading the page at 0, or a manual Reset, never matches.
 */
export function shouldPlayTimesUp(prev: TimerSnapshot, next: TimerSnapshot): boolean {
  return prev.timerRunning && prev.timer > 0 && next.timer === 0;
}

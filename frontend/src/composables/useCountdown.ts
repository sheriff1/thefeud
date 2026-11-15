/** What the countdown reads and writes, plus the clock and interval it runs on. */
export interface CountdownDeps {
  now: () => number;
  setInterval: (fn: () => void, ms: number) => unknown;
  clearInterval: (id: unknown) => void;
  getRemaining: () => number;
  setRemaining: (seconds: number) => void;
  setRunning: (running: boolean) => void;
  /** Called after the remaining time or the running flag changed (the host sends update-game). */
  onChange: () => void;
  /** Called once, after the final onChange, when the countdown reaches 0 by itself. */
  onExpire?: () => void;
}

/** How often to check the clock. The remaining time only changes (and is only sent) per second. */
export const COUNTDOWN_CHECK_MS = 250;

/**
 * A countdown driven by a wall-clock end time, not by counting ticks, so a throttled or late tick
 * jumps to the right remaining time instead of drifting (#17). Everything it touches comes in
 * through `deps`, so it runs in node with a fake clock.
 */
export function useCountdown(deps: CountdownDeps) {
  let intervalId: unknown = null;
  let endsAt = 0;

  const isActive = () => intervalId !== null;

  function clear() {
    if (intervalId !== null) deps.clearInterval(intervalId);
    intervalId = null;
  }

  function check() {
    const remaining = Math.max(0, Math.ceil((endsAt - deps.now()) / 1000));
    if (remaining > 0 && remaining === deps.getRemaining()) return;
    deps.setRemaining(remaining);
    // A stale update-game echoed back from the server can clear the running flag mid-countdown
    // (the backend does not keep events in order), so assert it on every change we send.
    if (remaining > 0) deps.setRunning(true);
    if (remaining === 0) {
      clear();
      deps.setRunning(false);
      deps.onChange();
      deps.onExpire?.();
      return;
    }
    deps.onChange();
  }

  /** Count down from the current remaining time. Returns false if already running or nothing to count. */
  function start(): boolean {
    if (isActive()) return false;
    const remaining = deps.getRemaining();
    if (!(remaining > 0)) return false;
    endsAt = deps.now() + remaining * 1000;
    deps.setRunning(true);
    intervalId = deps.setInterval(check, COUNTDOWN_CHECK_MS);
    deps.onChange();
    return true;
  }

  /** Stop counting. Tells the other views only if it was actually running. Safe to call any time. */
  function stop(): boolean {
    const wasActive = isActive();
    clear();
    if (wasActive) {
      deps.setRunning(false);
      deps.onChange();
    }
    return wasActive;
  }

  /** Clear the interval without telling anyone (the host view is going away). */
  function dispose() {
    clear();
  }

  return { start, stop, dispose, isActive };
}

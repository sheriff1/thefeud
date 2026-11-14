/**
 * Handling for "this session no longer exists" socket errors (#113).
 *
 * The text must equal `SESSION_NOT_FOUND` in backend/safe-handlers.ts; a unit test reads that
 * file and fails if the two drift apart.
 */
export const SESSION_GONE_MESSAGE = 'Session does not exist';

/** Query value Home looks for to show the "session is gone" notice. */
export const SESSION_GONE_NOTICE = 'session-gone';

export function isSessionGone(error: { message?: unknown } | null | undefined): boolean {
  return error?.message === SESSION_GONE_MESSAGE;
}

let handled = false;

/** Re-arm the once-only guard. Views call this when they mount. */
export function resetSessionGoneGuard() {
  handled = false;
}

/**
 * Clean up and send the user home, once. Several handlers answer a dead session with the same
 * error in a row (join-session, get-current-state, ...), so repeat calls are ignored until
 * `resetSessionGoneGuard` runs.
 */
export function handleSessionGone(
  router: { replace: (to: string) => unknown },
  cleanup?: () => void,
) {
  if (handled) return;
  handled = true;
  cleanup?.();
  router.replace(`/?notice=${SESSION_GONE_NOTICE}`);
}

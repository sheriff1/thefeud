import { onMounted, onUnmounted } from 'vue';

export const DEFAULT_SESSION_TIMEOUT_MS = 1800000; // 30 minutes

/**
 * Inactivity timeout for the current page. Under Cypress it is still the full default unless a
 * test opts in with `Cypress.env('sessionTimeoutMs', <ms>)`. (It used to be shortened to 1s for
 * every Cypress run, which silently logged the host/team page out whenever a test went >1s
 * without a mouse/keyboard event, e.g. while retrying an assertion on a slow CI runner.)
 */
export function resolveSessionTimeoutMs(): number {
  const cypress = (window as any).Cypress;
  const override = cypress?.env?.('sessionTimeoutMs');
  return typeof override === 'number' && override > 0 ? override : DEFAULT_SESSION_TIMEOUT_MS;
}

export function useSessionTimeout(logoutFn: () => void, timeoutMs = DEFAULT_SESSION_TIMEOUT_MS) {
  let timeout: ReturnType<typeof setTimeout>;

  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      logoutFn();
    }, timeoutMs);
  };

  const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

  onMounted(() => {
    activityEvents.forEach((event) => window.addEventListener(event, resetTimeout));
    resetTimeout();
  });

  onUnmounted(() => {
    clearTimeout(timeout);
    activityEvents.forEach((event) => window.removeEventListener(event, resetTimeout));
  });
}

import { onMounted, onUnmounted } from 'vue';

export function useSessionTimeout(logoutFn: () => void, timeoutMs = 1800000) {
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

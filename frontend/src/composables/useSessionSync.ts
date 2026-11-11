import socket from '../utils/socket';

/**
 * Join the socket room for `sessionId` and fetch the latest state, now and after every
 * (re)connect. A reconnected socket is a brand-new server-side socket that is in no rooms, so
 * without this a client would silently stop receiving updates after a backend restart or drop.
 *
 * `onSync` runs on each (re)connect after the base calls (e.g. to re-join a team).
 * Views clean up with `socket.removeAllListeners()` on unmount, which also removes this listener.
 */
export function useSessionSync(
  sessionId: string | null,
  options: { teamMembers?: boolean; onSync?: () => void } = {},
) {
  if (!sessionId) return;

  const sync = () => {
    socket.emit('join-session', { sessionId });
    socket.emit('get-current-state', { sessionId });
    if (options.teamMembers) socket.emit('get-team-members', { sessionId });
    options.onSync?.();
  };

  socket.on('connect', sync);
  // Already connected (e.g. navigated here from the home page): the 'connect' event has passed.
  if (socket.connected) sync();
}

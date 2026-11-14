/** The pieces of the socket, store, router and browser that logging out touches. */
export interface LogoutDeps {
  socket: {
    emit: (event: string, payload: unknown) => unknown;
    removeAllListeners: () => unknown;
    disconnect: () => unknown;
  };
  store: {
    removeTeamMember: (team: 'A' | 'B', name: string) => void;
    $reset: () => void;
  };
  router: { push: (to: { name: string }) => Promise<unknown> };
  /** Session to remove the player from; read when logging out. */
  sessionId: () => string | null | undefined;
  /** Defaults to `localStorage`. */
  storage?: Pick<Storage, 'getItem' | 'removeItem'>;
  /** Defaults to `window.location.reload()`. */
  reload?: () => void;
}

/**
 * Log out of the current session: remove the stored player from their team (if they joined one),
 * drop the socket, clear the stored session and player data, reset the store, go to the home
 * route and reload so no state survives.
 *
 * Shared by the host, team/spectator and app-level Log Out buttons. Pass the socket, store and
 * router in (rather than importing them) so this stays free of browser globals and testable.
 */
export function useLogout(deps: LogoutDeps) {
  return function logout() {
    const { socket, store, router } = deps;
    const storage = deps.storage ?? localStorage;

    const playerName = storage.getItem('playerName');
    const playerTeam = storage.getItem('playerTeam') as 'A' | 'B';

    if (playerName && playerTeam) {
      store.removeTeamMember(playerTeam, playerName);

      // Emit to backend to remove from session data
      socket.emit('remove-team-member', {
        sessionId: deps.sessionId(),
        team: playerTeam,
        name: playerName,
      });
    }
    socket.removeAllListeners();
    socket.disconnect();

    storage.removeItem('enteredFromHome');
    storage.removeItem('sessionId');
    storage.removeItem('playerName');
    storage.removeItem('playerTeam');
    store.$reset();

    router.push({ name: 'HomeAlias' }).then(() => {
      (deps.reload ?? (() => window.location.reload()))();
    });
  };
}

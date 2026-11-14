import { describe, expect, it, vi } from 'vitest';
import { useLogout } from './useLogout';

function setup(stored: Record<string, string>) {
  const calls: string[] = [];
  const data = { ...stored };
  const socket = {
    emit: vi.fn((e: string) => calls.push(`emit:${e}`)),
    removeAllListeners: vi.fn(() => calls.push('removeAllListeners')),
    disconnect: vi.fn(() => calls.push('disconnect')),
  };
  const store = {
    removeTeamMember: vi.fn(() => calls.push('removeTeamMember')),
    $reset: vi.fn(() => calls.push('$reset')),
  };
  const router = { push: vi.fn(() => Promise.resolve()) };
  const reload = vi.fn();
  const storage = {
    getItem: (k: string) => data[k] ?? null,
    removeItem: (k: string) => {
      delete data[k];
    },
  };
  const logout = useLogout({ socket, store, router, sessionId: () => 'AB12', storage, reload });
  return { logout, socket, store, router, reload, data, calls };
}

const all = {
  enteredFromHome: 'true',
  sessionId: 'AB12',
  playerName: 'Pat',
  playerTeam: 'B',
  theme: 'dark',
};

describe('useLogout', () => {
  it('removes a joined player from the team, in the store and on the server', () => {
    const { logout, socket, store } = setup(all);
    logout();
    expect(store.removeTeamMember).toHaveBeenCalledWith('B', 'Pat');
    expect(socket.emit).toHaveBeenCalledWith('remove-team-member', {
      sessionId: 'AB12',
      team: 'B',
      name: 'Pat',
    });
  });

  it('does not emit when no player joined a team (host, spectator)', () => {
    const { logout, socket, store } = setup({ sessionId: 'AB12' });
    logout();
    expect(store.removeTeamMember).not.toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does not emit when only one of name/team is stored', () => {
    const { logout, socket } = setup({ playerName: 'Pat' });
    logout();
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('drops the socket, clears session data (but not the theme) and resets the store', () => {
    const { logout, socket, store, data } = setup(all);
    logout();
    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(data).toEqual({ theme: 'dark' });
    expect(store.$reset).toHaveBeenCalled();
  });

  it('removes the player before dropping the socket, then goes home and reloads', async () => {
    const { logout, router, reload, calls } = setup(all);
    logout();
    expect(calls.indexOf('emit:remove-team-member')).toBeLessThan(
      calls.indexOf('removeAllListeners'),
    );
    expect(calls.indexOf('removeAllListeners')).toBeLessThan(calls.indexOf('disconnect'));
    expect(router.push).toHaveBeenCalledWith({ name: 'HomeAlias' });
    expect(reload).not.toHaveBeenCalled(); // only after navigation settles
    await Promise.resolve();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

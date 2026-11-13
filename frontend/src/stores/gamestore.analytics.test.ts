import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});
vi.mock('../utils/socket', () => ({ default: { on: vi.fn(), emit: vi.fn() } }));
const track = vi.fn();
vi.mock('../utils/analytics', () => ({ track: (...args: unknown[]) => track(...args) }));

import { useGameStore } from './gamestore';

describe('round_completed analytics', () => {
  beforeEach(() => {
    track.mockClear();
    setActivePinia(createPinia());
  });

  it('fires once per round, with the round number only', () => {
    const store = useGameStore();
    store.roundCounter = 2;
    store.endRound(vi.fn());
    store.endRound(vi.fn());
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('round_completed', { round: 2 });
  });

  it('fires again for the next round', () => {
    const store = useGameStore();
    store.roundCounter = 1;
    store.endRound(vi.fn());
    store.resetRound();
    store.roundCounter = 2;
    store.endRound(vi.fn());
    expect(track.mock.calls.map((c) => c[1])).toEqual([{ round: 1 }, { round: 2 }]);
  });

  it('does not fire when state is restored with roundOver already true', () => {
    const store = useGameStore();
    store.$patch({ roundOver: true, roundCounter: 4 });
    expect(track).not.toHaveBeenCalled();
  });
});

import { describe, it, expect } from 'vitest';
import { changedTeamNames } from './teamNames';

const server = { A: 'Reds', B: 'Blues' };

describe('changedTeamNames', () => {
  it('returns null when nothing changed', () => {
    expect(changedTeamNames(server, { A: 'Reds', B: 'Blues' })).toBeNull();
  });
  it('returns only the edited team', () => {
    expect(changedTeamNames(server, { A: 'Greens', B: 'Blues' })).toEqual({ A: 'Greens' });
    expect(changedTeamNames(server, { A: 'Reds', B: 'Whites' })).toEqual({ B: 'Whites' });
  });
  it('returns both when both changed', () => {
    expect(changedTeamNames(server, { A: 'X', B: 'Y' })).toEqual({ A: 'X', B: 'Y' });
  });
  it('trims, so surrounding spaces alone are not a change', () => {
    expect(changedTeamNames(server, { A: '  Reds ', B: ' Blues' })).toBeNull();
    expect(changedTeamNames(server, { A: ' Greens ' })).toEqual({ A: 'Greens' });
  });
  it('ignores a missing team', () => {
    expect(changedTeamNames(server, {})).toBeNull();
  });
});

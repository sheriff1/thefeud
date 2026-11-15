import { describe, it, expect } from 'vitest';
import { buzzerOwner, canBuzz, hasAnyPick, isPickConnected, NO_BUZZER_PICKS } from './buzzerAccess';

describe('buzzerAccess', () => {
  it('lets anyone buzz when there is no pick, after Skip, or when the field is missing', () => {
    expect(canBuzz('A', 'Ann', NO_BUZZER_PICKS)).toBe(true);
    expect(canBuzz('B', 'Bo', undefined)).toBe(true);
    expect(canBuzz('A', 'Ann', null)).toBe(true);
  });

  it('lets only the selected buzzer buzz on a team with a pick', () => {
    const picks = { A: 'Ann', B: null };
    expect(canBuzz('A', 'Ann', picks)).toBe(true);
    expect(canBuzz('A', 'Al', picks)).toBe(false);
    expect(canBuzz('B', 'Bo', picks)).toBe(true);
  });

  it('reports the owner, treating empty values as no pick', () => {
    expect(buzzerOwner('A', { A: 'Ann', B: null })).toBe('Ann');
    expect(buzzerOwner('B', { A: 'Ann', B: null })).toBeNull();
    expect(buzzerOwner('A', { A: '', B: null })).toBeNull();
  });

  it('detects whether any pick exists', () => {
    expect(hasAnyPick(NO_BUZZER_PICKS)).toBe(false);
    expect(hasAnyPick({ A: null, B: 'Bo' })).toBe(true);
    expect(hasAnyPick(undefined)).toBe(false);
  });

  it('detects a picked player who is no longer connected', () => {
    expect(isPickConnected('Ann', ['Ann', 'Al'])).toBe(true);
    expect(isPickConnected('Ann', ['Al'])).toBe(false);
    expect(isPickConnected('Ann', undefined)).toBe(false);
  });
});

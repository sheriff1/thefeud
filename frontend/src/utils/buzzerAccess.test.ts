import { describe, it, expect } from 'vitest';
import {
  buzzerOwner,
  canBuzz,
  hasAnyPick,
  isBuzzerBarShown,
  isBuzzerVisible,
  isPickConnected,
  NO_BUZZER_PICKS,
  type BuzzerVisibilityState,
} from './buzzerAccess';

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

  describe('buzzer visibility (#141)', () => {
    const live: BuzzerVisibilityState = {
      selectedTeam: 'A',
      roundOn: true,
      startingTeamSet: false,
      guessedCount: 0,
    };

    it('shows the buzzer only on the own team of the player, in the buzzer round', () => {
      expect(isBuzzerVisible('A', live)).toBe(true);
      expect(isBuzzerVisible('B', live)).toBe(false);
      expect(isBuzzerVisible('B', { ...live, selectedTeam: 'B' })).toBe(true);
      expect(isBuzzerVisible('A', { ...live, selectedTeam: 'B' })).toBe(false);
    });

    it('shows no buzzer to a spectator or before joining', () => {
      expect(isBuzzerVisible('A', { ...live, selectedTeam: '' })).toBe(false);
      expect(isBuzzerVisible('B', { ...live, selectedTeam: '' })).toBe(false);
    });

    it('hides the buzzer when the round is off, the starting team is set or an answer was guessed', () => {
      expect(isBuzzerVisible('A', { ...live, roundOn: false })).toBe(false);
      expect(isBuzzerVisible('A', { ...live, startingTeamSet: true })).toBe(false);
      expect(isBuzzerVisible('A', { ...live, guessedCount: 1 })).toBe(false);
    });

    it('shows the bottom bar exactly when the buzzer shows for the team of the player', () => {
      expect(isBuzzerBarShown(live)).toBe(true);
      expect(isBuzzerBarShown({ ...live, selectedTeam: 'B' })).toBe(true);
      expect(isBuzzerBarShown({ ...live, selectedTeam: '' })).toBe(false);
      expect(isBuzzerBarShown({ ...live, roundOn: false })).toBe(false);
      expect(isBuzzerBarShown({ ...live, startingTeamSet: true })).toBe(false);
      expect(isBuzzerBarShown({ ...live, guessedCount: 3 })).toBe(false);
    });
  });
});

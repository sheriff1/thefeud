import { describe, it, expect } from 'vitest';
import { isBuzzAllowed } from '../buzz-access.js';

const members = { A: ['Ann', 'Al'], B: ['Bo', 'Bea'] };

describe('isBuzzAllowed', () => {
  it('allows anyone when there is no assignment', () => {
    expect(isBuzzAllowed('Ann', undefined, members)).toBe(true);
    expect(isBuzzAllowed('Ann', null, members)).toBe(true);
  });

  it('allows anyone when the host skipped (both null)', () => {
    expect(isBuzzAllowed('Al', { A: null, B: null }, members)).toBe(true);
    expect(isBuzzAllowed('Bea', { A: null, B: null }, members)).toBe(true);
  });

  it('allows the selected buzzer and rejects their teammates', () => {
    const picks = { A: 'Ann', B: 'Bo' };
    expect(isBuzzAllowed('Ann', picks, members)).toBe(true);
    expect(isBuzzAllowed('Bo', picks, members)).toBe(true);
    expect(isBuzzAllowed('Al', picks, members)).toBe(false);
    expect(isBuzzAllowed('Bea', picks, members)).toBe(false);
  });

  it('does not restrict a team that has no pick', () => {
    const picks = { A: 'Ann', B: null };
    expect(isBuzzAllowed('Ann', picks, members)).toBe(true);
    expect(isBuzzAllowed('Al', picks, members)).toBe(false);
    expect(isBuzzAllowed('Bo', picks, members)).toBe(true);
    expect(isBuzzAllowed('Bea', picks, members)).toBe(true);
  });

  it('does not restrict names that are on neither team (same as before)', () => {
    expect(isBuzzAllowed('Stranger', { A: 'Ann', B: 'Bo' }, members)).toBe(true);
  });

  it('keeps the selected buzzer allowed when they dropped out of teamMembers', () => {
    expect(isBuzzAllowed('Ann', { A: 'Ann', B: null }, { A: ['Al'], B: [] })).toBe(true);
  });

  it('allows a name selected on either team even if it is listed on both', () => {
    const both = { A: ['Sam', 'Al'], B: ['Sam', 'Bo'] };
    expect(isBuzzAllowed('Sam', { A: 'Sam', B: 'Bo' }, both)).toBe(true);
  });
});

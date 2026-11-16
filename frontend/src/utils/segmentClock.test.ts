import { describe, it, expect } from 'vitest';
import { clockCells, segmentsFor } from './segmentClock';

const lit = (c: string) =>
  segmentsFor(c)
    .map((on, i) => (on ? 'abcdefg'[i] : ''))
    .join('');

describe('segmentsFor', () => {
  it('lights the classic 7-segment shapes', () => {
    expect(lit('0')).toBe('abcdef');
    expect(lit('1')).toBe('bc');
    expect(lit('2')).toBe('abdeg');
    expect(lit('3')).toBe('abcdg');
    expect(lit('4')).toBe('bcfg');
    expect(lit('5')).toBe('acdfg');
    expect(lit('6')).toBe('acdefg');
    expect(lit('7')).toBe('abc');
    expect(lit('8')).toBe('abcdefg');
    expect(lit('9')).toBe('abcdfg');
  });

  it('leaves a blank or unknown character unlit', () => {
    expect(lit(' ')).toBe('');
    expect(lit('x')).toBe('');
  });
});

describe('clockCells', () => {
  it('formats m:ss like the old GameInfo clock', () => {
    expect(clockCells(125).text).toBe('2:05');
    expect(clockCells(65).text).toBe('1:05');
    expect(clockCells(7).text).toBe('0:07');
    expect(clockCells(0).text).toBe('0:00');
  });

  it('gives minutes two cells, blank leading cell under 10 minutes', () => {
    expect(clockCells(7).minutes).toEqual([' ', '0']);
    expect(clockCells(125).minutes).toEqual([' ', '2']);
    expect(clockCells(600).minutes).toEqual(['1', '0']);
    expect(clockCells(600).seconds).toEqual(['0', '0']);
  });

  it('grows past two minute cells instead of truncating', () => {
    expect(clockCells(6000).minutes).toEqual(['1', '0', '0']);
    expect(clockCells(99999).text).toBe('1666:39');
  });

  it('clamps negative, fractional and non-finite input', () => {
    expect(clockCells(-5).text).toBe('0:00');
    expect(clockCells(59.9).text).toBe('0:59');
    expect(clockCells(NaN).text).toBe('0:00');
    expect(clockCells(Infinity).text).toBe('0:00');
  });
});

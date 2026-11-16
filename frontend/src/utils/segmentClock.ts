/** Segment order for one digit: a (top), b (upper right), c (lower right), d (bottom), e (lower left), f (upper left), g (middle). */
export type Segments = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

const DIGIT_SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
};

const SEGMENT_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

/** Which of the 7 segments are lit for a digit; anything else (including ' ') is blank. */
export function segmentsFor(char: string): Segments {
  const lit = DIGIT_SEGMENTS[char] ?? '';
  return SEGMENT_NAMES.map((name) => lit.includes(name)) as Segments;
}

export interface ClockCells {
  /** One character per cell: a digit, or ' ' for a blank cell. Minutes are at least 2 cells wide. */
  minutes: string[];
  seconds: string[];
  /** The time as text, m:ss (for screen readers and plain-text checks). */
  text: string;
}

/** Lay out a number of seconds as m:ss cells. Negative, fractional or non-finite input counts as whole seconds, at least 0. */
export function clockCells(totalSeconds: number): ClockCells {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  const minuteText = String(mins);
  const minutes = minuteText.padStart(2, ' ').split('');
  const seconds = String(secs).padStart(2, '0').split('');
  return { minutes, seconds, text: `${minuteText}:${seconds.join('')}` };
}

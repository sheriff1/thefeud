import { GameStep } from './gameSteps';

/** Host-chosen default durations for the timed steps (#17). Off by default. */
export interface TimerPresets {
  enabled: boolean;
  /** Seconds for the buzzer step; 0 means no timer for that step. */
  buzzer: number;
  /** Seconds for the guessing step; 0 means no timer for that step. */
  guessing: number;
}

export const MAX_PRESET_SECONDS = 600;
export const TIMER_PRESETS_KEY = 'timerPresets';
export const DEFAULT_TIMER_PRESETS: TimerPresets = { enabled: false, buzzer: 0, guessing: 0 };

/** Whole seconds from 0 to MAX_PRESET_SECONDS; anything else (NaN, negative, text) becomes 0. */
export function sanitizeSeconds(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_PRESET_SECONDS);
}

export function sanitizePresets(value: unknown): TimerPresets {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    enabled: v.enabled === true,
    buzzer: sanitizeSeconds(v.buzzer),
    guessing: sanitizeSeconds(v.guessing),
  };
}

type PresetStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Read the presets; missing, unreadable or corrupt data gives the defaults (timer off). */
export function loadTimerPresets(storage?: PresetStorage): TimerPresets {
  try {
    const raw = (storage ?? localStorage).getItem(TIMER_PRESETS_KEY);
    return raw ? sanitizePresets(JSON.parse(raw)) : { ...DEFAULT_TIMER_PRESETS };
  } catch {
    return { ...DEFAULT_TIMER_PRESETS };
  }
}

/** Save the presets; storage being blocked or full is not an error for the game. */
export function saveTimerPresets(presets: TimerPresets, storage?: PresetStorage): void {
  try {
    (storage ?? localStorage).setItem(TIMER_PRESETS_KEY, JSON.stringify(sanitizePresets(presets)));
  } catch {
    /* presets just won't persist */
  }
}

/** Seconds to start when entering `step`, or 0 if presets are off or the step has none. */
export function presetSecondsFor(step: number, presets: TimerPresets): number {
  if (!presets.enabled) return 0;
  if (step === GameStep.Buzzer) return presets.buzzer;
  if (step === GameStep.Guessing) return presets.guessing;
  return 0;
}

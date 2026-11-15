/** The part of an HTMLAudioElement that `playSound` uses. */
export interface PlayableAudio {
  play(): Promise<void> | void;
  pause?(): void;
  currentTime?: number;
  muted?: boolean;
}

export interface PlaySoundDeps {
  muted: boolean;
  /** Returns the reused element for a file (see soundRegistry). */
  getAudio: (src: string) => PlayableAudio;
  /** Called with anything that is not an expected browser refusal. */
  onError: (error: unknown) => void;
}

/** Autoplay policy (NotAllowedError) and an interrupted play (AbortError) are not app errors. */
const IGNORED_ERRORS = ['NotAllowedError', 'AbortError'];

export const isIgnoredAudioError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  IGNORED_ERRORS.includes((error as { name?: string }).name ?? '');

/**
 * Play a sound unless muted. Browsers reject `play()` when a sound was not started by a click
 * or tap; that rejection is swallowed so it does not surface as an unhandled rejection (#118).
 * Every sound should go through here. Everything it touches comes in through `deps`, so it runs
 * in node without a DOM.
 */
export function playSound(src: string, deps: PlaySoundDeps): void {
  if (deps.muted) return;
  const report = (error: unknown) => {
    if (!isIgnoredAudioError(error)) deps.onError(error);
  };
  try {
    // Older browsers return undefined from play(); Promise.resolve covers both.
    const audio = deps.getAudio(src);
    // A reused element may still be playing from last time: start over.
    if (audio.currentTime !== undefined) audio.currentTime = 0;
    Promise.resolve(audio.play()).catch(report);
  } catch (error) {
    report(error);
  }
}

/** The part of an HTMLAudioElement that `playSound` uses. */
export interface PlayableAudio {
  play(): Promise<void> | void;
}

export interface PlaySoundDeps {
  muted: boolean;
  createAudio: (src: string) => PlayableAudio;
  /** Called with anything that is not an expected browser refusal. */
  onError: (error: unknown) => void;
}

/** Autoplay policy (NotAllowedError) and an interrupted play (AbortError) are not app errors. */
const IGNORED_ERRORS = ['NotAllowedError', 'AbortError'];

const isIgnored = (error: unknown) =>
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
    if (!isIgnored(error)) deps.onError(error);
  };
  try {
    // Older browsers return undefined from play(); Promise.resolve covers both.
    Promise.resolve(deps.createAudio(src).play()).catch(report);
  } catch (error) {
    report(error);
  }
}

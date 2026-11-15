import { isIgnoredAudioError, type PlayableAudio } from './playSound';

export interface SoundRegistryDeps {
  createAudio: (src: string) => PlayableAudio;
  /** Called with anything that is not an expected browser refusal. */
  onError: (error: unknown) => void;
}

export interface SoundRegistry {
  /** The one reused element for a file (created on first use). */
  get(src: string): PlayableAudio;
  /**
   * Prime every file inside a user gesture so later socket-triggered `play()` calls are allowed
   * (Safari/iOS unlock each element separately, #119). Resolves true when none were refused.
   */
  unlock(srcs: string[]): Promise<boolean>;
}

/** Keeps one Audio element per sound so an unlocked element stays unlocked. */
export function createSoundRegistry({ createAudio, onError }: SoundRegistryDeps): SoundRegistry {
  const elements = new Map<string, PlayableAudio>();
  const get = (src: string) => {
    let audio = elements.get(src);
    if (!audio) {
      audio = createAudio(src);
      elements.set(src, audio);
    }
    return audio;
  };

  const prime = async (audio: PlayableAudio): Promise<boolean> => {
    audio.muted = true; // silent while priming; ignored by browsers that do not support it
    try {
      await Promise.resolve(audio.play());
      return true;
    } catch (error) {
      if (!isIgnoredAudioError(error)) onError(error);
      // Only a refusal means "still locked"; anything else is not fixed by another tap.
      return !(error as { name?: string })?.name?.includes('NotAllowed');
    } finally {
      audio.pause?.();
      if (audio.currentTime !== undefined) audio.currentTime = 0;
      audio.muted = false;
    }
  };

  const unlock = async (srcs: string[]) => {
    // play() must start synchronously inside the gesture, so start all of them before awaiting.
    const results = await Promise.all(srcs.map((src) => prime(get(src))));
    return results.every(Boolean);
  };

  return { get, unlock };
}

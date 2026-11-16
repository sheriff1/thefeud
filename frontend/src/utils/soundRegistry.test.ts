import { describe, it, expect, vi } from 'vitest';
import { createSoundRegistry } from './soundRegistry';
import type { PlayableAudio } from './playSound';

const named = (name: string) => Object.assign(new Error(name), { name });

function setup(play: (src: string) => Promise<void> | void = () => Promise.resolve()) {
  const made: Record<string, PlayableAudio & { pause: ReturnType<typeof vi.fn> }> = {};
  const createAudio = vi.fn((src: string) => {
    made[src] = {
      play: vi.fn(() => play(src)),
      pause: vi.fn(),
      currentTime: 2,
      muted: false,
    };
    return made[src];
  });
  const onError = vi.fn();
  return { registry: createSoundRegistry({ createAudio, onError }), createAudio, onError, made };
}

describe('createSoundRegistry', () => {
  it('creates one element per file and reuses it', () => {
    const { registry, createAudio } = setup();
    expect(registry.get('/a.mp3')).toBe(registry.get('/a.mp3'));
    expect(registry.get('/b.mp3')).not.toBe(registry.get('/a.mp3'));
    expect(createAudio).toHaveBeenCalledTimes(2);
  });

  it('primes every file: plays silently, then pauses, rewinds and unmutes', async () => {
    const { registry, made } = setup();
    let mutedDuringPlay: boolean | undefined;
    const files = ['/a.mp3', '/b.mp3'];
    const result = registry.unlock(files);
    mutedDuringPlay = made['/a.mp3'].muted;
    expect(await result).toBe(true);
    expect(mutedDuringPlay).toBe(true);
    for (const f of files) {
      expect(made[f].play).toHaveBeenCalledTimes(1);
      expect(made[f].pause).toHaveBeenCalledTimes(1);
      expect(made[f].currentTime).toBe(0);
      expect(made[f].muted).toBe(false);
    }
  });

  it('starts every play() before awaiting any (they must stay inside the gesture)', () => {
    const { registry, made } = setup(() => new Promise<void>(() => {}));
    void registry.unlock(['/a.mp3', '/b.mp3']);
    expect(made['/a.mp3'].play).toHaveBeenCalled();
    expect(made['/b.mp3'].play).toHaveBeenCalled();
  });

  it('reports still locked, without an error, when the browser refuses', async () => {
    const { registry, onError } = setup(() => Promise.reject(named('NotAllowedError')));
    expect(await registry.unlock(['/a.mp3'])).toBe(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('can retry after a refusal', async () => {
    let refuse = true;
    const { registry, made } = setup(() =>
      refuse ? Promise.reject(named('NotAllowedError')) : Promise.resolve(),
    );
    expect(await registry.unlock(['/a.mp3'])).toBe(false);
    refuse = false;
    expect(await registry.unlock(['/a.mp3'])).toBe(true);
    expect(made['/a.mp3'].play).toHaveBeenCalledTimes(2);
  });

  it('reports other errors once but does not keep the page locked', async () => {
    const error = named('NotSupportedError');
    const { registry, onError } = setup(() => Promise.reject(error));
    expect(await registry.unlock(['/a.mp3'])).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('ignores AbortError', async () => {
    const { registry, onError } = setup(() => Promise.reject(named('AbortError')));
    expect(await registry.unlock(['/a.mp3'])).toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });

  it('copes with play() returning undefined and a synchronous throw', async () => {
    const a = setup(() => undefined);
    expect(await a.registry.unlock(['/a.mp3'])).toBe(true);
    const b = setup(() => {
      throw named('NotAllowedError');
    });
    expect(await b.registry.unlock(['/a.mp3'])).toBe(false);
  });
});

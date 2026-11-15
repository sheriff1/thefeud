import { describe, it, expect, vi } from 'vitest';
import { playSound } from './playSound';

const named = (name: string) => Object.assign(new Error(name), { name });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(play: () => Promise<void> | void, muted = false) {
  const playFn = vi.fn(play);
  const createAudio = vi.fn((_src: string) => ({ play: playFn }));
  const onError = vi.fn();
  playSound('/sounds/ding.mp3', { muted, createAudio, onError });
  return { playFn, createAudio, onError };
}

describe('playSound', () => {
  it('plays the given file once and reports nothing', async () => {
    const { playFn, createAudio, onError } = setup(() => Promise.resolve());
    await flush();
    expect(createAudio).toHaveBeenCalledWith('/sounds/ding.mp3');
    expect(playFn).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('does not even create the audio when muted', () => {
    const { createAudio, playFn } = setup(() => Promise.resolve(), true);
    expect(createAudio).not.toHaveBeenCalled();
    expect(playFn).not.toHaveBeenCalled();
  });

  it('ignores NotAllowedError', async () => {
    const { onError } = setup(() => Promise.reject(named('NotAllowedError')));
    await flush();
    expect(onError).not.toHaveBeenCalled();
  });

  it('ignores AbortError', async () => {
    const { onError } = setup(() => Promise.reject(named('AbortError')));
    await flush();
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports any other rejection', async () => {
    const error = named('NotSupportedError');
    const { onError } = setup(() => Promise.reject(error));
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('copes with play() returning undefined', async () => {
    const { onError } = setup(() => undefined);
    await flush();
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a synchronous throw instead of throwing', () => {
    const error = named('NotSupportedError');
    const { onError } = setup(() => {
      throw error;
    });
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('ignores a synchronous NotAllowedError throw', () => {
    const { onError } = setup(() => {
      throw named('NotAllowedError');
    });
    expect(onError).not.toHaveBeenCalled();
  });
});

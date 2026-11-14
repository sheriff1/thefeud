import { describe, expect, it, vi } from 'vitest';
import { INVITE_BOX_DEFAULT_TEXT, inviteText, useInviteLinks } from './useInviteLinks';
import { getSessionId } from './getSessionId';

describe('getSessionId', () => {
  it('reads the sessionId query parameter', () => {
    expect(getSessionId('?sessionId=AB12')).toBe('AB12');
    expect(getSessionId('?x=1&sessionId=ZZ99')).toBe('ZZ99');
  });

  it('returns null when it is missing', () => {
    expect(getSessionId('')).toBeNull();
    expect(getSessionId('?other=1')).toBeNull();
  });
});

describe('inviteText', () => {
  it('copies the bare ID for "id" and links for the pages', () => {
    expect(inviteText('id', 'AB12', 'https://x.test')).toBe('AB12');
    expect(inviteText('host', 'AB12', 'https://x.test')).toBe('https://x.test/host?sessionId=AB12');
    expect(inviteText('team', 'AB12', 'https://x.test')).toBe('https://x.test/team?sessionId=AB12');
    expect(inviteText('spectator', 'AB12', 'https://x.test')).toBe(
      'https://x.test/spectator?sessionId=AB12',
    );
  });

  it('copies an empty string for "id" without a session ID', () => {
    expect(inviteText('id', null, 'https://x.test')).toBe('');
  });
});

describe('useInviteLinks', () => {
  const setup = (writeText: (t: string) => Promise<void>) => {
    const timers: Array<{ fn: () => void; ms: number }> = [];
    const links = useInviteLinks('AB12', {
      writeText,
      origin: () => 'https://x.test',
      setTimer: (fn, ms) => timers.push({ fn, ms }),
    });
    return { links, timers };
  };

  it('starts with the default label and no state', () => {
    const { links } = setup(async () => {});
    expect(links.sessionIdBoxText.value).toBe(INVITE_BOX_DEFAULT_TEXT);
    expect(links.sessionIdBoxText.value).toBe('🔗  Invite Others');
    expect(links.sessionIdBoxState.value).toBe('');
  });

  it('writes the text, shows Copied! and resets after 2s', async () => {
    const writeText = vi.fn(async () => {});
    const { links, timers } = setup(writeText);
    await links.copyInvite('team');
    expect(writeText).toHaveBeenCalledWith('https://x.test/team?sessionId=AB12');
    expect(links.sessionIdBoxText.value).toBe('Copied!');
    expect(links.sessionIdBoxState.value).toBe('copied');
    expect(timers).toHaveLength(1);
    expect(timers[0].ms).toBe(2000);
    timers[0].fn();
    expect(links.sessionIdBoxText.value).toBe('🔗  Invite Others');
    expect(links.sessionIdBoxState.value).toBe('');
  });

  it('shows Error when the write fails, and never rejects', async () => {
    const { links, timers } = setup(async () => {
      throw new Error('denied');
    });
    await expect(links.copyInvite('id')).resolves.toBeUndefined();
    expect(links.sessionIdBoxText.value).toBe('Error');
    expect(links.sessionIdBoxState.value).toBe('error');
    expect(timers[0].ms).toBe(2000);
    timers[0].fn();
    expect(links.sessionIdBoxText.value).toBe('🔗  Invite Others');
  });
});

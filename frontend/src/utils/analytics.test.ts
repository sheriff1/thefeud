import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ANALYTICS_HOSTNAME,
  beforeSend,
  initAnalytics,
  sanitizeUrl,
  track,
  _resetAnalyticsForTests,
} from './analytics';

const PROD_URL = `https://${ANALYTICS_HOSTNAME}`;

beforeEach(() => _resetAnalyticsForTests());

describe('initAnalytics', () => {
  it('is a no-op outside a production build', () => {
    const inject = vi.fn();
    expect(initAnalytics({}, inject)).toBe(false);
    expect(initAnalytics({ isProd: false }, inject)).toBe(false);
    expect(inject).not.toHaveBeenCalled();
  });

  it('is a no-op under Cypress even in a production build', () => {
    const inject = vi.fn();
    expect(initAnalytics({ isProd: true, isTestRun: true }, inject)).toBe(false);
    expect(inject).not.toHaveBeenCalled();
  });

  it('injects in production mode with the beforeSend hook', () => {
    const inject = vi.fn();
    expect(initAnalytics({ isProd: true }, inject)).toBe(true);
    expect(inject).toHaveBeenCalledWith({ mode: 'production', beforeSend });
  });
});

describe('sanitizeUrl / beforeSend', () => {
  it('strips query string and hash', () => {
    expect(sanitizeUrl(`${PROD_URL}/host?sessionId=ABC123#x`)).toBe(`${PROD_URL}/host`);
    expect(beforeSend({ type: 'pageview', url: `${PROD_URL}/team?sessionId=ABC123` })).toEqual({
      type: 'pageview',
      url: `${PROD_URL}/team`,
    });
  });

  it('drops events from any other host', () => {
    for (const url of [
      'http://localhost:5173/host?sessionId=ABC123',
      'https://family-feud-git-branch-team.vercel.app/',
      `https://evil.example/${ANALYTICS_HOSTNAME}`,
      `https://${ANALYTICS_HOSTNAME}.example.com/`,
    ]) {
      expect(beforeSend({ type: 'pageview', url })).toBeNull();
    }
  });

  it('drops events with an unparseable URL', () => {
    expect(beforeSend({ type: 'event', url: 'not a url' })).toBeNull();
  });
});

describe('track', () => {
  it('sends nothing until analytics is initialized', () => {
    const send = vi.fn();
    track('session_created', {}, send);
    expect(send).not.toHaveBeenCalled();
  });

  describe('when enabled', () => {
    beforeEach(() => {
      initAnalytics({ isProd: true }, vi.fn());
    });

    it('sends the four allowed events', () => {
      const send = vi.fn();
      track('session_created', {}, send);
      track('spectator_joined', {}, send);
      track('team_joined', { team: 'A' }, send);
      track('round_completed', { round: 3 }, send);
      expect(send.mock.calls).toEqual([
        ['session_created', {}],
        ['spectator_joined', {}],
        ['team_joined', { team: 'A' }],
        ['round_completed', { round: 3 }],
      ]);
    });

    it('drops any property that is not allowlisted (no session ids, names, free text)', () => {
      const send = vi.fn();
      track('session_created', { sessionId: 'ABC123' }, send);
      track('team_joined', { team: 'A', name: 'Alice', sessionId: 'ABC123' }, send);
      track('round_completed', { round: 2, sessionId: 'ABC123' }, send);
      expect(send.mock.calls).toEqual([
        ['session_created', {}],
        ['team_joined', { team: 'A' }],
        ['round_completed', { round: 2 }],
      ]);
    });

    it('rejects invalid property values and unknown events', () => {
      const send = vi.fn();
      track('team_joined', { team: 'The Smiths' }, send);
      track('team_joined', {}, send);
      track('round_completed', { round: 'ABC123' }, send);
      track('round_completed', { round: 1.5 }, send);
      track('round_completed', { round: -1 }, send);
      track('buzzer_used' as any, {}, send);
      expect(send).not.toHaveBeenCalled();
    });
  });
});

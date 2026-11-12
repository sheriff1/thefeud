import { describe, it, expect, vi } from 'vitest';
import {
  initMonitoring,
  scrubEvent,
  redactString,
  isExpectedError,
  captureHandlerError,
} from '../monitoring.js';

const DSN = 'https://publickey@o0.ingest.example.invalid/1';

describe('initMonitoring', () => {
  it('is a no-op when SENTRY_DSN is unset', () => {
    const init = vi.fn();
    expect(initMonitoring({ env: { NODE_ENV: 'production' }, init })).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('is a no-op for a blank DSN', () => {
    const init = vi.fn();
    expect(initMonitoring({ env: { SENTRY_DSN: '   ' }, init })).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('never initializes under tests or CI, even with a DSN', () => {
    const init = vi.fn();
    expect(initMonitoring({ env: { SENTRY_DSN: DSN, NODE_ENV: 'test' }, init })).toBe(false);
    expect(initMonitoring({ env: { SENTRY_DSN: DSN, CI: 'true' }, init })).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('initializes with environment and release (git sha) when configured', () => {
    const init = vi.fn();
    const env = { SENTRY_DSN: DSN, NODE_ENV: 'production', RENDER_GIT_COMMIT: 'abc123' };
    expect(initMonitoring({ env, init })).toBe(true);
    const options = init.mock.calls[0][0];
    expect(options.dsn).toBe(DSN);
    expect(options.environment).toBe('production');
    expect(options.release).toBe('abc123');
    expect(options.dataCollection).toMatchObject({ cookies: false, httpBodies: [] });
    expect(options.tracesSampleRate).toBe(0);
  });

  it('SENTRY_ENVIRONMENT overrides NODE_ENV', () => {
    const init = vi.fn();
    initMonitoring({
      env: { SENTRY_DSN: DSN, NODE_ENV: 'production', SENTRY_ENVIRONMENT: 'staging' },
      init,
    });
    expect(init.mock.calls[0][0].environment).toBe('staging');
  });

  it('drops console breadcrumbs and the Console/Express integrations', () => {
    const init = vi.fn();
    initMonitoring({ env: { SENTRY_DSN: DSN }, init });
    const { beforeBreadcrumb, integrations } = init.mock.calls[0][0];
    expect(beforeBreadcrumb({ category: 'console' })).toBeNull();
    expect(beforeBreadcrumb({ category: 'http' })).toEqual({ category: 'http' });
    const kept = integrations([{ name: 'Console' }, { name: 'Express' }, { name: 'Http' }]);
    expect(kept).toEqual([{ name: 'Http' }]);
  });
});

describe('scrubEvent', () => {
  it('removes request bodies, headers, cookies and query strings', () => {
    const event = scrubEvent(
      {
        request: {
          url: 'https://x.test/api/sessions?token=abc',
          method: 'POST',
          data: { password: 'hunter2' },
          headers: { authorization: 'Bearer secret' },
          cookies: { sid: '1' },
          query_string: 'token=abc',
        },
      },
      {},
    );
    expect(event.request).toEqual({ url: 'https://x.test/api/sessions', method: 'POST' });
  });

  it('keeps session and player tags', () => {
    const event = scrubEvent({ tags: { sessionId: 'AB12', playerName: 'Sam' } }, {});
    expect(event.tags).toEqual({ sessionId: 'AB12', playerName: 'Sam' });
  });

  it('redacts credential-looking keys in extra/contexts, at any depth', () => {
    const event = scrubEvent(
      { extra: { ok: 1, nested: { private_key: 'x', apiKey: 'y', note: 'fine' } } },
      {},
    );
    expect(event.extra).toEqual({
      ok: 1,
      nested: { private_key: '[redacted]', apiKey: '[redacted]', note: 'fine' },
    });
  });

  it('redacts PEM blocks and private_key fields from messages and exceptions', () => {
    const pem = '-----BEGIN PRIVATE KEY-----\nMIIabc\n-----END PRIVATE KEY-----';
    const event = scrubEvent(
      {
        message: `boom ${pem}`,
        exception: { values: [{ value: '{"private_key": "zzz", "a": 1}' }] },
      },
      {},
    );
    expect(JSON.stringify(event)).not.toContain('MIIabc');
    expect(JSON.stringify(event)).not.toContain('zzz');
  });

  it('redacts the literal values of secret-looking env vars', () => {
    const env = { FIREBASE_CREDENTIALS: 'super-secret-credential-blob', PORT: '4000' };
    const event = scrubEvent({ message: 'failed with super-secret-credential-blob in it' }, env);
    expect(event.message).toBe('failed with [redacted] in it');
    expect(redactString('port 4000', env)).toBe('port 4000');
  });

  it('collapses FIREBASE_CREDENTIALS parse errors', () => {
    const msg = 'Failed to parse FIREBASE_CREDENTIALS: Unexpected token } in JSON at position 5';
    expect(redactString(msg, {})).toBe('Failed to parse FIREBASE_CREDENTIALS (details redacted)');
  });

  it('keeps only the user id and drops the server name', () => {
    const event = scrubEvent(
      { user: { id: 'u1', ip_address: '1.2.3.4', email: 'a@b.c' }, server_name: 'host' },
      {},
    );
    expect(event.user).toEqual({ id: 'u1' });
    expect(event.server_name).toBeUndefined();
  });

  it('does not mutate its input', () => {
    const input = { request: { data: 'x', url: 'https://x.test/?a=1' } };
    scrubEvent(input, {});
    expect(input.request.data).toBe('x');
  });
});

describe('isExpectedError / captureHandlerError', () => {
  it('treats user-facing validation failures as expected', () => {
    expect(isExpectedError(new Error('Invalid request - getValidSessionDoc'))).toBe(true);
    expect(isExpectedError(new Error('Session does not exist'))).toBe(true);
    expect(isExpectedError(new Error('connect ECONNREFUSED'))).toBe(false);
    expect(isExpectedError(undefined)).toBe(false);
  });

  it('does nothing (and does not throw) when monitoring is not initialized', () => {
    expect(() =>
      captureHandlerError(new Error('x'), { event: 'buzz', sessionId: 'AB12' }),
    ).not.toThrow();
  });
});

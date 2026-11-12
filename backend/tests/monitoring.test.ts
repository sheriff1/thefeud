import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  initMonitoring,
  scrubEvent,
  scrubTransaction,
  parameterizePaths,
  tracesSampler,
  TRACES_SAMPLE_RATE,
  redactString,
  isExpectedError,
  captureHandlerError,
  captureExpressError,
  Sentry,
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
    expect(options.tracesSampler).toBe(tracesSampler);
    expect(options.tracesSampleRate).toBeUndefined();
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

describe('captureExpressError', () => {
  const events: any[] = [];
  const start = () => {
    events.length = 0;
    Sentry.init({
      dsn: DSN,
      defaultIntegrations: false,
      beforeSend: (event) => {
        events.push(event);
        return null; // record, never send
      },
    });
  };
  afterEach(async () => {
    await Sentry.close();
  });

  it('does not report client errors (4xx), via status or statusCode', async () => {
    start();
    captureExpressError(Object.assign(new Error('bad json'), { status: 400 }));
    captureExpressError(Object.assign(new Error('too large'), { statusCode: 413 }));
    captureExpressError(Object.assign(new Error('teapot'), { status: 499 }));
    await Sentry.flush(1000);
    expect(events).toHaveLength(0);
  });

  it('still reports 5xx and unexpected errors with the express tag', async () => {
    start();
    captureExpressError(Object.assign(new Error('boom'), { status: 500 }));
    captureExpressError(new Error('no status'));
    captureExpressError(Object.assign(new Error('weird'), { status: 'oops' }));
    await Sentry.flush(1000);
    expect(events).toHaveLength(3);
    expect(events.every((e) => e.tags?.handler === 'express')).toBe(true);
  });

  it('still ignores CORS rejections', async () => {
    start();
    captureExpressError(new Error('Not allowed by CORS'));
    await Sentry.flush(1000);
    expect(events).toHaveLength(0);
  });
});

describe('performance monitoring (#28)', () => {
  it('never traces health checks or Socket.IO transport', () => {
    expect(tracesSampler({ name: 'GET /api/health' })).toBe(0);
    expect(tracesSampler({ name: '/api/health' })).toBe(0);
    expect(tracesSampler({ name: 'GET /socket.io/' })).toBe(0);
    expect(tracesSampler({ name: 'POST /socket.io/?EIO=4' })).toBe(0);
  });

  it('samples other requests at the low base rate, honouring a parent decision', () => {
    expect(TRACES_SAMPLE_RATE).toBeLessThanOrEqual(0.1);
    expect(tracesSampler({ name: 'POST /api/sessions' })).toBe(TRACES_SAMPLE_RATE);
    const inherit = vi.fn(() => 1);
    expect(tracesSampler({ name: 'GET /api/answers-library', inheritOrSampleWith: inherit })).toBe(
      1,
    );
    expect(inherit).toHaveBeenCalledWith(TRACES_SAMPLE_RATE);
  });

  it('replaces session IDs in route paths', () => {
    expect(parameterizePaths('GET /api/session-exists/AB12CD')).toBe(
      'GET /api/session-exists/:sessionId',
    );
    expect(parameterizePaths('/api/create-session/XYZ9?x=1')).toBe(
      '/api/create-session/:sessionId?x=1',
    );
    expect(parameterizePaths('GET /api/answers-library')).toBe('GET /api/answers-library');
  });

  it('scrubs transactions and parameterizes name and url', () => {
    const out = scrubTransaction(
      {
        transaction: 'GET /api/session-exists/AB12',
        request: { url: 'https://x.test/api/session-exists/AB12?a=1', method: 'GET', headers: {} },
      },
      {},
    );
    expect(out.transaction).toBe('GET /api/session-exists/:sessionId');
    expect(out.request).toEqual({
      url: 'https://x.test/api/session-exists/:sessionId',
      method: 'GET',
    });
  });
});

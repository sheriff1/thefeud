import { describe, it, expect, vi } from 'vitest';
import {
  initMonitoring,
  scrubEvent,
  redactString,
  createConnectOutageReporter,
  captureError,
  setSessionTag,
} from './monitoring';

const DSN = 'https://publickey@o0.ingest.example.invalid/1';
const app: any = {};
const makeRouter = () => ({ onError: vi.fn() }) as any;

describe('initMonitoring', () => {
  it('is a no-op when the DSN is unset or blank', () => {
    const init = vi.fn();
    const router = makeRouter();
    expect(initMonitoring(app, router, {}, init)).toBe(false);
    expect(initMonitoring(app, router, { dsn: '  ' }, init)).toBe(false);
    expect(init).not.toHaveBeenCalled();
    expect(router.onError).not.toHaveBeenCalled();
  });

  it('is a no-op under Cypress even with a DSN', () => {
    const init = vi.fn();
    expect(initMonitoring(app, makeRouter(), { dsn: DSN, isTestRun: true }, init)).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('initializes with environment, release and router error capture when configured', () => {
    const init = vi.fn();
    const router = makeRouter();
    const ok = initMonitoring(
      app,
      router,
      { dsn: DSN, environment: 'production', release: 'abc123' },
      init,
    );
    expect(ok).toBe(true);
    const options = init.mock.calls[0][0];
    expect(options).toMatchObject({
      dsn: DSN,
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0.1,
      tracePropagationTargets: [],
    });
    expect(options.integrations).toHaveLength(1);
    expect(options.dataCollection).toMatchObject({ cookies: false, httpBodies: [] });
    expect(router.onError).toHaveBeenCalledOnce();
  });

  it('leaves release undefined when no git sha is known', () => {
    const init = vi.fn();
    initMonitoring(app, makeRouter(), { dsn: DSN, release: '' }, init);
    expect(init.mock.calls[0][0].release).toBeUndefined();
  });

  it('drops console breadcrumbs', () => {
    const init = vi.fn();
    initMonitoring(app, makeRouter(), { dsn: DSN }, init);
    const { beforeBreadcrumb } = init.mock.calls[0][0];
    expect(beforeBreadcrumb({ category: 'console' })).toBeNull();
    expect(beforeBreadcrumb({ category: 'ui.click' })).toEqual({ category: 'ui.click' });
  });
});

describe('scrubEvent', () => {
  it('removes request bodies, headers, cookies and query strings', () => {
    const event = scrubEvent({
      request: {
        url: 'https://app.test/host?token=abc',
        method: 'GET',
        data: 'secret',
        headers: { Authorization: 'x' },
        cookies: { a: 'b' },
        query_string: 'token=abc',
      },
    });
    expect(event.request).toEqual({ url: 'https://app.test/host', method: 'GET' });
  });

  it('keeps the sessionId tag but redacts credential-like keys and PEM blocks', () => {
    const event = scrubEvent({
      tags: { sessionId: 'AB12' },
      extra: { apiKey: 'k', fine: 'ok' },
      message: 'x -----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY----- y',
    });
    expect(event.tags).toEqual({ sessionId: 'AB12' });
    expect(event.extra).toEqual({ apiKey: '[redacted]', fine: 'ok' });
    expect(event.message).toBe('x [redacted] y');
  });

  it('keeps only the user id and does not mutate its input', () => {
    const input = {
      user: { id: 'u', ip_address: '1.2.3.4' },
      request: { url: 'https://a.test/?q=1' },
    };
    expect(scrubEvent(input).user).toEqual({ id: 'u' });
    expect(input.request.url).toBe('https://a.test/?q=1');
    expect(redactString('plain')).toBe('plain');
  });
});

describe('createConnectOutageReporter', () => {
  const setup = () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const reporter = createConnectOutageReporter(report, 1000);
    return { report, reporter };
  };

  it('does not report an outage that resolves within the grace period (cold start)', () => {
    const { report, reporter } = setup();
    reporter.onConnectError(new Error('xhr poll error'));
    vi.advanceTimersByTime(500);
    reporter.onConnect();
    vi.advanceTimersByTime(5000);
    expect(report).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('reports once per outage that outlasts the grace period', () => {
    const { report, reporter } = setup();
    const err = new Error('websocket error');
    reporter.onConnectError(err);
    reporter.onConnectError(new Error('again'));
    vi.advanceTimersByTime(1500);
    reporter.onConnectError(new Error('still down'));
    vi.advanceTimersByTime(5000);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(err);
    // A new outage after reconnecting can be reported again.
    reporter.onConnect();
    reporter.onConnectError(new Error('later'));
    vi.advanceTimersByTime(1500);
    expect(report).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('helpers when monitoring is not initialized', () => {
  it('do nothing and do not throw', () => {
    expect(() => captureError(new Error('x'), { source: 'test' })).not.toThrow();
    expect(() => setSessionTag('AB12')).not.toThrow();
  });
});

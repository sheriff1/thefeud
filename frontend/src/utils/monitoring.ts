// Error monitoring (Sentry, #27).
//
// - Does nothing unless VITE_SENTRY_DSN is set at build time (the DSN is config, not code).
// - Never initializes under Cypress, so e2e/component runs do not send events.
// - Every event passes through scrubEvent() before leaving the browser.
import * as Sentry from '@sentry/vue';
import type { App } from 'vue';
import type { Router } from 'vue-router';

export interface MonitoringConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  /** True under Cypress; monitoring stays off. */
  isTestRun?: boolean;
}

export const TRACES_SAMPLE_RATE = 0.1;

const SENSITIVE_KEY =
  /(credential|secret|token|password|passwd|private[_-]?key|authorization|api[_-]?key|cookie)/i;
const PEM_BLOCK = /-----BEGIN [A-Z ]+-----[\s\S]*?(?:-----END [A-Z ]+-----|$)/g;
const REDACTED = '[redacted]';
const MAX_DEPTH = 8;

export function redactString(value: string): string {
  return value.replace(PEM_BLOCK, REDACTED);
}

function scrubValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return REDACTED;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(v, depth + 1);
  }
  return out;
}

/** Remove anything that must not leave the browser. Pure; safe to unit test. */
export function scrubEvent<T extends Record<string, any>>(event: T): T {
  const e: Record<string, any> = { ...event };
  // Request bodies, headers, cookies and query strings may carry secrets.
  if (e.request) {
    const { url, method } = e.request;
    e.request = { url: typeof url === 'string' ? redactString(url.split('?')[0]) : url, method };
  }
  if (e.user) e.user = { id: e.user.id };
  // Tags (sessionId, ...) are kept; everything free-form is scrubbed.
  for (const key of [
    'extra',
    'contexts',
    'breadcrumbs',
    'exception',
    'message',
    'logentry',
    'tags',
  ]) {
    if (key in e) e[key] = scrubValue(e[key], 0);
  }
  return e as T;
}

/** Initialize Sentry. Returns true only when events can be sent. */
export function initMonitoring(
  app: App,
  router: Router,
  config: MonitoringConfig,
  init: typeof Sentry.init = Sentry.init,
): boolean {
  const dsn = config.dsn?.trim();
  if (!dsn || config.isTestRun) return false;

  init({
    app,
    dsn,
    environment: config.environment || 'production',
    release: config.release || undefined,
    // Collect no user info, cookies, headers, bodies or query strings (scrubEvent is a 2nd layer).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Performance monitoring (#28): page loads, navigations and Web Vitals at a low sample rate.
    // Query strings are dropped by scrubEvent; routes have no session IDs in their paths.
    integrations: [Sentry.browserTracingIntegration({ router })],
    // Static transactions: beforeSendTransaction (scrubbing) is ignored in v11's default 'stream' mode.
    traceLifecycle: 'static',
    tracesSampleRate: TRACES_SAMPLE_RATE,
    // No trace headers on outgoing requests (backend CORS stays untouched).
    tracePropagationTargets: [],
    beforeSendTransaction: (event) => scrubEvent(event) as typeof event,
    beforeSend: (event) => scrubEvent(event) as typeof event,
    beforeBreadcrumb: (breadcrumb) => (breadcrumb.category === 'console' ? null : breadcrumb),
  });
  router.onError((error) => captureError(error, { source: 'router' }));
  return true;
}

export const monitoringEnabled = () => Sentry.getClient() !== undefined;

export function captureError(error: unknown, tags: Record<string, string> = {}): void {
  if (!monitoringEnabled()) return;
  Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(tags)) scope.setTag(k, v);
    Sentry.captureException(error);
  });
}

/** Tag subsequent events with the current game session. No-op when disabled. */
export function setSessionTag(sessionId: string | null | undefined): void {
  if (!monitoringEnabled()) return;
  Sentry.setTag('sessionId', sessionId ? String(sessionId).slice(0, 64) : undefined);
}

/**
 * Socket.IO connect_error handling. The free-tier backend sleeps and takes about a minute to
 * wake, and the socket retries forever, so a single connect_error is normal. Only report an
 * outage that is still unresolved after `graceMs`, and at most once per outage.
 */
export function createConnectOutageReporter(
  report: (error: unknown) => void = (error) => captureError(error, { source: 'socket' }),
  graceMs = 90_000,
  timers: Pick<typeof globalThis, 'setTimeout' | 'clearTimeout'> = globalThis,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let reported = false;
  return {
    onConnectError(error: unknown) {
      if (timer !== null || reported) return;
      timer = timers.setTimeout(() => {
        timer = null;
        reported = true;
        report(error);
      }, graceMs);
    },
    onConnect() {
      if (timer !== null) timers.clearTimeout(timer);
      timer = null;
      reported = false;
    },
  };
}

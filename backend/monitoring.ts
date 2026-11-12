// Error monitoring (Sentry, #27).
//
// - Does nothing unless SENTRY_DSN is set. The DSN is configuration, never committed.
// - Never initializes under tests (NODE_ENV=test) or CI, even if a DSN is present.
// - Every event passes through scrubEvent() before leaving the process: request bodies,
//   headers, cookies, env-like values, and credential-shaped strings are removed.
import * as Sentry from '@sentry/node';

const SENSITIVE_KEY =
  /(credential|secret|token|password|passwd|private[_-]?key|authorization|api[_-]?key|cookie)/i;
const SENSITIVE_ENV_KEY = /(CREDENTIAL|SECRET|TOKEN|PRIVATE_KEY|PASSWORD|DSN|API_KEY)/i;
const PEM_BLOCK = /-----BEGIN [A-Z ]+-----[\s\S]*?(?:-----END [A-Z ]+-----|$)/g;
const PRIVATE_KEY_FIELD = /"?private_key(?:_id)?"?\s*[:=]\s*"[^"]*"/gi;
type Env = Record<string, string | undefined>;
const REDACTED = '[redacted]';
const MAX_DEPTH = 8;

// Expected, user-facing validation failures that sockets relay to the client. They are
// not bugs, so reporting them would only burn quota.
const EXPECTED_ERROR_MESSAGES = [
  'Invalid request',
  'Session does not exist',
  'Session ID is required',
  'Name is required',
];

export function isExpectedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return EXPECTED_ERROR_MESSAGES.some((m) => message.startsWith(m));
}

function secretValuesFrom(env: Env): string[] {
  return Object.entries(env)
    .filter(([key, value]) => SENSITIVE_ENV_KEY.test(key) && typeof value === 'string')
    .map(([, value]) => value as string)
    .filter((value) => value.length >= 8);
}

export function redactString(value: string, env: Env = process.env): string {
  let out = value;
  for (const secret of secretValuesFrom(env)) {
    out = out.split(secret).join(REDACTED);
  }
  out = out.replace(PEM_BLOCK, REDACTED).replace(PRIVATE_KEY_FIELD, REDACTED);
  // JSON.parse errors can quote part of the input; never let that carry credentials out.
  if (out.includes('FIREBASE_CREDENTIALS') && /JSON|token|position/i.test(out)) {
    return 'Failed to parse FIREBASE_CREDENTIALS (details redacted)';
  }
  return out;
}

function scrubValue(value: unknown, env: Env, depth: number): unknown {
  if (typeof value === 'string') return redactString(value, env);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return REDACTED;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, env, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(v, env, depth + 1);
  }
  return out;
}

/** Remove anything that must not leave the process. Pure; safe to unit test. */
export function scrubEvent<T extends Record<string, any>>(event: T, env: Env = process.env): T {
  const e: Record<string, any> = { ...event };
  // Request bodies, headers, cookies and query strings may carry secrets.
  if (e.request) {
    const { url, method } = e.request;
    e.request = {
      url: typeof url === 'string' ? redactString(url.split('?')[0], env) : url,
      method,
    };
  }
  delete e.server_name; // hostname
  if (e.user) e.user = { id: e.user.id };
  // Tags stay (sessionId, player name, event name); everything else is scrubbed.
  const { tags } = e;
  for (const key of ['extra', 'contexts', 'breadcrumbs', 'exception', 'message', 'logentry']) {
    if (key in e) e[key] = scrubValue(e[key], env, 0);
  }
  if (tags) e.tags = scrubValue(tags, env, 0);
  return e as T;
}

// Performance monitoring (#28). Low sample rate keeps us far below the free span quota.
export const TRACES_SAMPLE_RATE = 0.1;
// Health checks and Socket.IO long-polling would dominate the span count and say nothing useful.
const UNTRACED_PATH = /^\/(api\/health|socket\.io)(\/|\?|$)/;
// Routes that carry a game session ID in the path.
const SESSION_PATH = /(\/api\/(?:session-exists|create-session)\/)[^/?#\s]+/g;

/** Replace session IDs in URL paths so they never end up in transaction names or URLs. */
export function parameterizePaths(value: string): string {
  return value.replace(SESSION_PATH, '$1:sessionId');
}

/** Sampling decision: never trace health checks or Socket.IO transport, otherwise the base rate. */
export function tracesSampler({ name, inheritOrSampleWith }: any): number {
  if (typeof name === 'string' && UNTRACED_PATH.test(name.replace(/^[A-Z]+\s+/, ''))) return 0;
  return typeof inheritOrSampleWith === 'function'
    ? inheritOrSampleWith(TRACES_SAMPLE_RATE)
    : TRACES_SAMPLE_RATE;
}

/** Scrub a transaction event, then parameterize session IDs in its name and URL. */
export function scrubTransaction<T extends Record<string, any>>(
  event: T,
  env: Env = process.env,
): T {
  const e: Record<string, any> = scrubEvent(event, env);
  if (typeof e.transaction === 'string') e.transaction = parameterizePaths(e.transaction);
  if (typeof e.request?.url === 'string') e.request.url = parameterizePaths(e.request.url);
  return e as T;
}

export interface MonitoringOptions {
  env?: Env;
  /** Test seam: replaces Sentry.init. */
  init?: typeof Sentry.init;
}

/** Initialize Sentry. Returns true only when events can be sent. */
export function initMonitoring({
  env = process.env,
  init = Sentry.init,
}: MonitoringOptions = {}): boolean {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return false;
  if (env.NODE_ENV === 'test' || env.CI) return false;

  init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || 'production',
    release: env.RENDER_GIT_COMMIT || undefined,
    // Collect no user info, cookies, headers, bodies or query strings (scrubEvent is a 2nd layer).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampler,
    beforeSendTransaction: (event) => scrubTransaction(event, env) as typeof event,
    // Console breadcrumbs could echo error text that bypasses the key-based scrubbing. Express
    // errors are reported by captureExpressError (below), so skip the SDK's own capture.
    integrations: (defaults) => defaults.filter((i) => !['Console', 'Express'].includes(i.name)),
    beforeSend: (event) => scrubEvent(event, env) as typeof event,
    beforeBreadcrumb: (breadcrumb) => (breadcrumb.category === 'console' ? null : breadcrumb),
  });
  return true;
}

export const monitoringEnabled = () => Sentry.getClient() !== undefined;

function clip(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value.slice(0, 64) : undefined;
}

/** Report an unexpected error from a socket handler or route. No-op when disabled. */
export function captureHandlerError(
  error: unknown,
  context: { event?: string; sessionId?: unknown; name?: unknown } = {},
): void {
  if (!monitoringEnabled() || isExpectedError(error)) return;
  Sentry.withScope((scope) => {
    const tags: Record<string, string | undefined> = {
      handler: clip(context.event),
      sessionId: clip(context.sessionId),
      playerName: clip(context.name),
    };
    for (const [k, v] of Object.entries(tags)) if (v) scope.setTag(k, v);
    Sentry.captureException(error);
  });
}

/** Express error middleware body: report unexpected errors (not CORS rejections or 4xx). */
export function captureExpressError(error: unknown): void {
  if (error instanceof Error && error.message === 'Not allowed by CORS') return;
  // Client errors (e.g. malformed JSON from the body parser) are not bugs (#88).
  const status =
    (error as { status?: unknown; statusCode?: unknown } | null)?.status ??
    (error as { statusCode?: unknown } | null)?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) return;
  captureHandlerError(error, { event: 'express' });
}

/** Flush queued events before the process exits (crash handlers). */
export async function flushMonitoring(timeoutMs = 2000): Promise<void> {
  if (!monitoringEnabled()) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {
    // Never let monitoring block shutdown.
  }
}

export { Sentry };

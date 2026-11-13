// Product analytics (#25): Vercel Web Analytics, cookie-free.
//
// - Only runs in a production build, never under Cypress, and only reports from the production
//   hostname (so previews, localhost and *.vercel.app send nothing).
// - Every URL is reduced to its path before leaving the browser: routes carry the session code in
//   `?sessionId=`, which must never be sent.
// - Custom events go through track(), which accepts an allowlist of event names and property keys.
//   No names, team names, session ids or free text can be sent.
import { inject, track as vercelTrack, type BeforeSendEvent } from '@vercel/analytics';

export const ANALYTICS_HOSTNAME = 'ff.sheriffjolaoso.com';

export interface AnalyticsConfig {
  /** True for a production build (import.meta.env.PROD). */
  isProd?: boolean;
  /** True under Cypress; analytics stays off. */
  isTestRun?: boolean;
}

type Props = Record<string, string | number>;

/** Event name -> validator for its (optional) properties. Anything not listed is dropped. */
const EVENTS: Record<string, (props: Props) => Props | null> = {
  session_created: () => ({}),
  spectator_joined: () => ({}),
  team_joined: (p) => (p.team === 'A' || p.team === 'B' ? { team: p.team } : null),
  round_completed: (p) =>
    Number.isInteger(p.round) && (p.round as number) >= 0 && (p.round as number) <= 1000
      ? { round: p.round }
      : null,
};

export type AnalyticsEvent =
  | 'session_created'
  | 'spectator_joined'
  | 'team_joined'
  | 'round_completed';

/** Keep only the origin and path. Returns null for anything that is not the production host. */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== ANALYTICS_HOSTNAME) return null;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/** Vercel `beforeSend` hook: drop events from other hosts, strip query and hash from the rest. */
export function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = sanitizeUrl(event.url);
  return url === null ? null : { ...event, url };
}

let enabled = false;

/** Start analytics. Returns true only when events can be sent. */
export function initAnalytics(config: AnalyticsConfig, injectFn: typeof inject = inject): boolean {
  if (!config.isProd || config.isTestRun) return false;
  injectFn({ mode: 'production', beforeSend });
  enabled = true;
  return true;
}

/** Send an allowlisted custom event. No-op unless initAnalytics() started analytics. */
export function track(
  name: AnalyticsEvent,
  props: Props = {},
  send: typeof vercelTrack = vercelTrack,
): void {
  if (!enabled) return;
  const validate = EVENTS[name];
  if (!validate) return;
  const clean = validate(props);
  if (clean === null) return;
  send(name, clean);
}

/** Test helper: reset module state. */
export function _resetAnalyticsForTests(): void {
  enabled = false;
}

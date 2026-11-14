// Wrappers that stop a failure in one request from taking down the whole process (#86).
// Express 4 does not forward rejected promises to the error middleware, and an async Socket.IO
// listener that throws becomes an unhandled rejection (which used to exit the process).
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Socket } from 'socket.io';
import { captureHandlerError } from './monitoring.js';

/** Wrap an async Express route so any rejection or sync throw reaches the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
}

/** Read a string field from an untrusted payload without throwing (null, primitives, arrays). */
function field(payload: unknown, key: string): unknown {
  return payload !== null && typeof payload === 'object' ? (payload as any)[key] : undefined;
}

/**
 * Register a socket listener whose failures never escape. An unexpected error is reported (tags
 * only: event, sessionId, name; never the payload) and the client gets a generic `error` event.
 * Listeners that take an ack callback (last argument) are answered with `{ exists: false }`.
 */
export function onSafe(socket: Socket, event: string, handler: (...args: any[]) => unknown): void {
  socket.on(event, (...args: any[]) => {
    Promise.resolve()
      .then(() => handler(...args))
      .catch((error: unknown) => {
        console.error(`Unhandled error in socket handler "${event}":`, error);
        const payload = args[0];
        captureHandlerError(error, {
          event,
          sessionId: field(payload, 'sessionId'),
          name: field(payload, 'name'),
        });
        socket.emit('error', { message: 'Internal server error' });
        const ack = args[args.length - 1];
        if (event === 'validate-session' && typeof ack === 'function') ack({ exists: false });
      });
  });
}

/** The one error text clients see verbatim: the session does not exist. */
export const SESSION_NOT_FOUND = 'Session does not exist';

/**
 * Text for a socket `error` event after a handler failure (#107). Every failure is reported to
 * the client as the handler's fixed `fallback`, except a missing session. The real message stays
 * in logs and Sentry (captureHandlerError), since it can carry Firestore or runtime internals.
 */
export function clientErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message === SESSION_NOT_FOUND
    ? SESSION_NOT_FOUND
    : fallback;
}

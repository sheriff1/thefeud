import { describe, it, expect, vi, beforeEach } from 'vitest';

const { captureHandlerError } = vi.hoisted(() => ({ captureHandlerError: vi.fn() }));
vi.mock('../monitoring.js', () => ({ captureHandlerError }));

import { onSafe, asyncHandler, clientErrorMessage } from '../safe-handlers.js';

function fakeSocket() {
  const listeners: Record<string, (...args: any[]) => unknown> = {};
  return {
    on: (event: string, fn: (...args: any[]) => unknown) => (listeners[event] = fn),
    emit: vi.fn(),
    fire: (event: string, ...args: any[]) => listeners[event](...args),
  };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  captureHandlerError.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('onSafe', () => {
  it('turns an async throw into an error event and reports tags only', async () => {
    const socket = fakeSocket();
    onSafe(socket as any, 'buzz', async () => {
      throw new Error('boom');
    });
    socket.fire('buzz', { sessionId: 'ABCD', name: 'Sam', secret: 'do-not-send' });
    await flush();
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Internal server error' });
    const [, context] = captureHandlerError.mock.calls[0];
    expect(context).toEqual({ event: 'buzz', sessionId: 'ABCD', name: 'Sam' });
  });

  it('survives null, primitive and missing payloads', async () => {
    const socket = fakeSocket();
    onSafe(socket as any, 'buzz', () => {
      throw new Error('boom');
    });
    for (const payload of [undefined, null, 5, 'x']) socket.fire('buzz', payload);
    await flush();
    expect(socket.emit).toHaveBeenCalledTimes(4);
  });

  it('answers a validate-session ack with exists:false on failure', async () => {
    const socket = fakeSocket();
    onSafe(socket as any, 'validate-session', () => {
      throw new Error('boom');
    });
    const ack = vi.fn();
    socket.fire('validate-session', { sessionId: 'ABCD' }, ack);
    await flush();
    expect(ack).toHaveBeenCalledWith({ exists: false });
  });
});

describe('asyncHandler', () => {
  it('forwards sync throws and rejections to next', async () => {
    const next = vi.fn();
    asyncHandler(() => {
      throw new Error('sync');
    })({} as any, {} as any, next);
    asyncHandler(async () => {
      throw new Error('async');
    })({} as any, {} as any, next);
    await flush();
    expect(next).toHaveBeenCalledTimes(2);
  });
});

describe('clientErrorMessage', () => {
  it('passes the missing-session message through', () => {
    expect(clientErrorMessage(new Error('Session does not exist'), 'Failed to join team')).toBe(
      'Session does not exist',
    );
  });

  it('replaces any other error with the fallback', () => {
    expect(clientErrorMessage(new TypeError('Cannot read properties of undefined'), 'Failed')).toBe(
      'Failed',
    );
    expect(clientErrorMessage('9 FAILED_PRECONDITION: index', 'Failed')).toBe('Failed');
    expect(clientErrorMessage(undefined, 'Failed')).toBe('Failed');
  });
});

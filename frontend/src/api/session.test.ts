import { describe, it, expect, vi, beforeEach } from 'vitest';

const captureError = vi.fn();
vi.mock('../utils/monitoring', () => ({ captureError: (...a: unknown[]) => captureError(...a) }));
vi.mock('../utils/socket', () => ({ default: {} }));

import { requestNewSessionId } from './session';

const alertMock = vi.fn();

beforeEach(() => {
  captureError.mockReset();
  alertMock.mockReset();
  vi.stubGlobal('alert', alertMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('requestNewSessionId', () => {
  it('returns the session ID and reports nothing on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sessionId: 'ABCD' }) }),
    );
    expect(await requestNewSessionId('https://api.test')).toBe('ABCD');
    expect(captureError).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('reports an HTTP failure with its status, alerts, and returns null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    expect(await requestNewSessionId('https://api.test')).toBeNull();
    expect(alertMock).toHaveBeenCalledOnce();
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), {
      source: 'create-session',
      status: '502',
    });
  });

  it('reports a network/CORS failure as status "network"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await requestNewSessionId('https://api.test')).toBeNull();
    expect(captureError).toHaveBeenCalledWith(expect.any(TypeError), {
      source: 'create-session',
      status: 'network',
    });
  });
});

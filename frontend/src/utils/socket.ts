// filepath: /src/utils/socket.ts
import { reactive } from 'vue';
import { io } from 'socket.io-client';
import { createConnectOutageReporter } from './monitoring';

const backendUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// The backend may be asleep (e.g. Render Free tier spins down after ~15 min idle and takes
// ~1 min to wake), so never give up reconnecting and allow slow handshakes.
const socket = io(backendUrl, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
});

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting';

/**
 * Reactive connection state for UI feedback.
 * `hasConnectedOnce` distinguishes the first connect from a reconnect.
 *
 * Driven by the Manager (`socket.io`) events rather than the socket's own, because views call
 * `socket.removeAllListeners()` on unmount, which would drop socket-level listeners (but not
 * the Manager's).
 */
export const connectionStatus = reactive<{ state: ConnectionState; hasConnectedOnce: boolean }>({
  state: socket.connected ? 'connected' : 'connecting',
  hasConnectedOnce: socket.connected,
});

// Report only outages that outlast a normal cold start (no-op when monitoring is off).
const outage = createConnectOutageReporter();
socket.on('connect_error', (error) => outage.onConnectError(error));
socket.on('connect', () => outage.onConnect());

socket.io.on('open', () => {
  connectionStatus.state = 'connected';
  connectionStatus.hasConnectedOnce = true;
});
socket.io.on('close', () => {
  connectionStatus.state = 'reconnecting';
});
socket.io.on('reconnect_attempt', () => {
  connectionStatus.state = 'reconnecting';
});
socket.io.on('error', () => {
  connectionStatus.state = connectionStatus.hasConnectedOnce ? 'reconnecting' : 'connecting';
});

// Add debug logging for development
if (import.meta.env.DEV) {
  socket.on('connect', () => {
    console.log('Socket connected to:', backendUrl);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
}

export default socket;

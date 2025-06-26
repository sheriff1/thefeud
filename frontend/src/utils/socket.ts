// filepath: /src/utils/socket.js
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const socket = io(backendUrl, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 10000,
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

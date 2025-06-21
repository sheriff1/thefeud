// filepath: /src/utils/socket.js
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const socket = io(backendUrl, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

export default socket;

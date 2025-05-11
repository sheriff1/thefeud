// filepath: /src/utils/socket.js
import { io } from 'socket.io-client';

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://family-feud-backend-3df546793e25.herokuapp.com/" // Production backend URL
    : "http://localhost:4000" // Local backend URL
);

export default socket;
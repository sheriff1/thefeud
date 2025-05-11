// filepath: family-feud/backend/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://family-feud-eta.vercel.app', // Deployed frontend
  'https://familyfeud.sheriffjolaoso.com', // Deployed custom domain
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Family Feud Backend is running!!!!');
});

// WebSocket Communication
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-session', async ({ sessionId }) => {
    console.log(`User ${socket.id} is joining session: ${sessionId}`);
    socket.join(sessionId);
  });

  // Handle request for the current game state
  socket.on('get-current-state', async ({ sessionId }) => {
    console.log(`Fetching current state for session: ${sessionId}`);
    try {
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      if (sessionDoc.exists) {
        const currentState = sessionDoc.data();
        socket.emit('current-state', currentState); // Send the current state to the client
      } else {
        console.error(`Session ${sessionId} not found.`);
        socket.emit('current-state', null); // Send null if the session does not exist
      }
    } catch (error) {
      console.error('Error fetching current state:', error);
      socket.emit('current-state', null); // Send null in case of an error
    }
  });

  socket.on('update-game', async ({ sessionId, gameState }) => {
    if (!sessionId) {
      console.error('Error: sessionId is missing or undefined');
      socket.emit('error', { message: 'Session ID is required to update the game state.' });
      return;
    }

    console.log(`Game state update received for session: ${sessionId}`);
    console.log('Game state:', gameState);

    try {
      // Add expiryTime to the gameState object
      const expiryDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      gameState.expiryTime = new Date(Date.now() + expiryDuration); // Set expiry time 24 hours from now

      // Save the updated gameState to Firestore
      await db.collection('sessions').doc(sessionId).set(gameState);
      console.log(`Game state saved to Firestore for session: ${sessionId}`);

      // Broadcast the updated game state to all clients in the session
      io.to(sessionId).emit('game-updated', gameState);
    } catch (error) {
      console.error('Error updating game state:', error);
      socket.emit('error', { message: 'Failed to update game state' });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
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
const socketToPlayer = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('play-strike-sound', async ({ sessionId }) => {
    // Broadcast to all other clients (except sender)
    //socket.broadcast.emit('play-strike-sound');
    // Or, if using rooms:
    io.to(sessionId).emit('play-strike-sound');
  });

  socket.on('join-session', async ({ sessionId }) => {
    console.log(`User ${socket.id} is joining session: ${sessionId}`);
    socket.join(sessionId);
  });

  socket.on('join-team', async ({ sessionId, name, team }) => {
    try {
      const sessionRef = db.collection('sessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();
      let members = { A: [], B: [] };

      if (sessionDoc.exists && sessionDoc.data().teamMembers) {
        members = sessionDoc.data().teamMembers;
      }

      // Prevent duplicates
      if (!members[team].includes(name)) {
        members[team].push(name);
      }

      // Update Firestore with new team members
      await sessionRef.set({ teamMembers: members }, { merge: true });

      // Broadcast updated team members to all clients in the session
      io.to(sessionId).emit('team-members-updated', members);

      socket.join(sessionId);

      // Track player info for disconnect
      socketToPlayer[socket.id] = { sessionId, name, team };
    } catch (error) {
      console.error('Error joining team:', error);
      socket.emit('error', { message: 'Failed to join team' });
    }
  });

  // Optionally: handle disconnects, etc.

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

  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);

    const player = socketToPlayer[socket.id];
    if (player) {
      const { sessionId, name, team } = player;
      try {
        const sessionRef = db.collection('sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (sessionDoc.exists && sessionDoc.data().teamMembers) {
          let members = sessionDoc.data().teamMembers;
          // Remove player from their team
          if (members[team]) {
            members[team] = members[team].filter(memberName => memberName !== name);
            // Update Firestore
            await sessionRef.set({ teamMembers: members }, { merge: true });
            // Broadcast updated team members
            io.to(sessionId).emit('team-members-updated', members);
          }
        }
      } catch (error) {
        console.error('Error removing player on disconnect:', error);
      }
      // Remove from tracking
      delete socketToPlayer[socket.id];
    }
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
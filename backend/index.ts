// filepath: family-feud/backend/index.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import helmet from 'helmet';

// Load environment variables
dotenv.config();
const projectId = process.env.FIREBASE_PROJECT_ID || 'family-feud-12345';
// Set emulator environment variables if running in test or CI
let credential: admin.credential.Credential;
if (
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.NODE_ENV === 'test' ||
  process.env.CI
) {
  credential = admin.credential.applicationDefault();
} else {
  if (!process.env.FIREBASE_CREDENTIALS) {
    throw new Error('FIREBASE_CREDENTIALS environment variable is not set');
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS as string);
  credential = admin.credential.cert(serviceAccount);
}

// Initialize Firebase
if (!process.env.FIREBASE_CREDENTIALS) {
  throw new Error('FIREBASE_CREDENTIALS environment variable is not set');
}

// Only use import.meta.url if module is ESM
let __filename: string;
let __dirname: string;
if (typeof fileURLToPath === 'function' && typeof import.meta !== 'undefined') {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  __filename = __filename || '';
  __dirname = __dirname || '';
}

admin.initializeApp({ credential, projectId });
const db = admin.firestore();

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

// -------------------------- Express CORS -------------------------- //
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use('/answers', express.static(path.join(__dirname, 'answers')));
// Routes
app.get('/', (req, res) => {
  res.send('Family Feud Backend is running!!!!');
});

app.get('/api/session-exists/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const sessionDoc = await db.collection('sessions').doc(sessionId).get();
  res.json({ exists: sessionDoc.exists });
});

app.post('/api/create-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();
  if (!sessionDoc.exists) {
    await sessionRef.set({ createdAt: new Date() });
  }
  res.json({ ok: true });
});

// List files
app.get('/api/answers-library', (req, res) => {
  const answersDir = path.join(__dirname, 'answers');
  fs.readdir(answersDir, (err, files) => {
    if (err) {
      console.error('Failed to list files:', err);
      return res.status(500).json({ error: 'Failed to list files' });
    }
    const csvFiles = files.filter((f) => f.endsWith('.csv'));
    res.json(csvFiles);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// WebSocket Communication
const socketToPlayer = {};

// -------------------------- Socket.IO CORS -------------------------- //
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('buzz', async ({ sessionId, name }) => {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      // Optionally, you can emit an error or just return
      socket.emit('error', { message: 'Session does not exist.' });
      return;
    }

    // Update buzzedPlayer in Firestore
    await sessionRef.set({ buzzedPlayer: name }, { merge: true });

    // Fetch the latest session state
    const updatedSessionDoc = await sessionRef.get();
    const sessionData = updatedSessionDoc.data();

    // Broadcast the updated state to all clients in the session
    console.log('GERALLLLLLD Emitting update-game:', sessionData);
    io.to(sessionId).emit('update-game', sessionData);
  });

  socket.on('play-strike-sound', async ({ sessionId }) => {
    io.to(sessionId).emit('play-strike-sound');
  });

  socket.on('join-session', async ({ sessionId }) => {
    console.log(`User ${socket.id} is joining session: ${sessionId}`);
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      socket.emit('error', { message: 'Session does not exist.' });
      return;
    }
    socket.join(sessionId);
  });

  socket.on('join-team', async ({ sessionId, name, team }) => {
    try {
      const sessionRef = db.collection('sessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();
      let members = { A: [], B: [] };

      const sessionData = sessionDoc.data();
      if (sessionDoc.exists && sessionData && sessionData.teamMembers) {
        members = sessionData.teamMembers;
      }

      members[team].push(name);

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

  socket.on('get-current-state', async ({ sessionId }) => {
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

    try {
      const sessionRef = db.collection('sessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();
      const firestoreState = sessionDoc.data() || {};

      // Get previous roundOver value
      const prevRoundOver = !!firestoreState.roundOver;
      const newRoundOver = !!gameState.roundOver;

      if (!gameState.expiryTime) {
        // Add expiryTime to the gameState object
        const expiryDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        gameState.expiryTime = new Date(Date.now() + expiryDuration);
      }

      // Emit "round-over" ONLY if transitioning from not over to over
      if (!prevRoundOver && newRoundOver) {
        io.to(sessionId).emit('round-over');
      }

      // Emit "next-round" ONLY if transitioning from over to not over
      if (prevRoundOver && !newRoundOver && !gameState.roundReset) {
        gameState.roundReset = false;
        gameState.roundOver = false; // Reset roundOver if roundReset is true
        gameState.buzzedPlayer = ''; // Reset buzzedPlayer if roundReset is true
        gameState.startingTeamSet = false; // Reset startingTeamSet if roundReset is true
        gameState.currentTeam = 'A'; // Reset currentTeam to 'A'
        gameState.strikes = 0; // Reset strikes
        gameState.pointPool = 0; // Reset point pool
        gameState.firstTeam = null; // Reset firstTeam
        gameState.secondTeamGuessUsed = false; // Reset secondTeamGuessUsed
        gameState.scoreMultiplier = null; // Reset scoreMultiplier
        gameState.timer = 0; // Reset timer
        gameState.timerRunning = false; // Reset timerRunning
        gameState.question = ''; // Reset question
        gameState.pointsAwarded = 0; // Reset pointsAwarded
        gameState.winningTeam = null; // Reset winningTeam
        gameState.answers = []; // Reset answers
        gameState.guessedAnswers = []; // Reset guessedAnswers
        gameState.teamStrikes = { A: 0, B: 0 }; // Reset team strikes
        gameState.currentStep = 1; // Reset currentStep to 'manage'
        gameState.nextRound = false;
        io.to(sessionId).emit('next-round');
        io.to(sessionId).emit('reset-buzzers');
      }

      // --- Reset the flag here, after logic that depends on it ---
      if (gameState.roundReset) {
        gameState.roundReset = false;
        gameState.roundOver = false; // Reset roundOver if roundReset is true
        gameState.buzzedPlayer = ''; // Reset buzzedPlayer if roundReset is true
        gameState.startingTeamSet = false; // Reset startingTeamSet if roundReset is true
        gameState.currentTeam = 'A'; // Reset currentTeam to 'A'
        gameState.strikes = 0; // Reset strikes
        gameState.pointPool = 0; // Reset point pool
        gameState.firstTeam = null; // Reset firstTeam
        gameState.secondTeamGuessUsed = false; // Reset secondTeamGuessUsed
        gameState.scoreMultiplier = null; // Reset scoreMultiplier
        gameState.timer = 0; // Reset timer
        gameState.timerRunning = false; // Reset timerRunning
        gameState.question = ''; // Reset question
        gameState.pointsAwarded = 0; // Reset pointsAwarded
        gameState.winningTeam = null; // Reset winningTeam
        gameState.answers = []; // Reset answers
        gameState.guessedAnswers = []; // Reset guessedAnswers
        gameState.teamStrikes = { A: 0, B: 0 }; // Reset team strikes
        gameState.currentStep = 1; // Reset currentStep to 'manage'
        gameState.roundReset = false;

        io.to(sessionId).emit('reset-round');
        io.to(sessionId).emit('reset-buzzers');
      }

      // --- Reset the flag here, after logic that depends on it ---
      if (gameState.gameReset) {
        getResetGameState();
        io.to(sessionId).emit('reset-round');
        io.to(sessionId).emit('reset-buzzers');
      }

      // Save the updated gameState to Firestore
      await sessionRef.set(gameState);

      // Optionally reset buzzedPlayer if this is a round/game reset
      await sessionRef.set({ buzzedPlayer: '' }, { merge: true });

      // Broadcast the updated game state to all clients in the session
      io.to(sessionId).emit('update-game', gameState);
    } catch (error) {
      console.error('Error updating game state:', error);
      socket.emit('error', { message: 'Failed to update game state' });
    }
  });

  socket.on('update-team-name', async ({ sessionId, team, name }) => {
    try {
      const sessionRef = db.collection('sessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();
      const sessionData = sessionDoc.data() || {};
      const currentTeamNames = sessionData.teamNames || { A: 'Team A', B: 'Team B' };
      const updatedTeamNames = { ...currentTeamNames, [team]: name };
      await sessionRef.set({ teamNames: updatedTeamNames }, { merge: true });

      // Emit only the team-names-updated event
      io.to(sessionId).emit('team-names-updated', updatedTeamNames);

      // Do NOT emit 'update-game' here
    } catch (error) {
      console.error('Error updating team name:', error);
    }
  });

  socket.on('get-team-members', async ({ sessionId }) => {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    const data = sessionDoc.data() || {};
    socket.emit('team-members-updated', data.teamMembers || { A: [], B: [] });
  });

  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);

    const player = socketToPlayer[socket.id];
    if (player) {
      const { sessionId, name, team } = player;
      try {
        const sessionRef = db.collection('sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        const sessionData = sessionDoc.data();
        if (sessionDoc.exists && sessionData && sessionData.teamMembers) {
          let members = sessionData.teamMembers;
          // Remove player from their team
          if (members[team]) {
            members[team] = members[team].filter((memberName) => memberName !== name);
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

function getResetGameState() {
  return {
    roundReset: false,
    roundOver: false,
    buzzedPlayer: '',
    startingTeamSet: false,
    currentTeam: 'A',
    strikes: 0,
    pointPool: 0,
    firstTeam: null,
    secondTeamGuessUsed: false,
    scoreMultiplier: null,
    timer: 0,
    timerRunning: false,
    question: '',
    pointsAwarded: 0,
    winningTeam: null,
    answers: [],
    guessedAnswers: [],
    teamStrikes: { A: 0, B: 0 },
    currentStep: 1,
    multiplierSet: false,
    answersSaved: false,
    startingTeam: null,
    questionSaved: false,
    buzzerOnlyPressed: false,
    correctAfterBuzzer: false,
    roundCounter: 0,
    teamScores: { A: 0, B: 0 },
    gameReset: false,
  };
}

export default app;

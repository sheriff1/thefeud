import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GameStateSchema = z
  .object({
    answers: z.array(z.object({ id: z.string(), text: z.string(), points: z.number() })),
    answersSaved: z.boolean(),
    buzzedPlayer: z.string().nullable(),
    buzzerOnlyPressed: z.boolean(),
    // Host's pick of who may buzz per team (#23). Optional so older clients that omit it still work.
    buzzerPlayers: z
      .object({ A: z.string().nullable(), B: z.string().nullable() })
      .strict()
      .optional(),
    correctAfterBuzzer: z.boolean(),
    correctBeforeBuzzer: z.boolean(),
    createdAt: z.object({ _seconds: z.number(), _nanoseconds: z.number() }).optional(),
    currentStep: z.number(),
    currentTeam: z.string(),
    enteredFromHome: z.boolean(),
    expiryTime: z.string().optional(), // Optional expiry time for the game state
    firstTeam: z.string().nullable(),
    gameReset: z.boolean(),
    guessedAnswers: z.array(z.object({ id: z.string() })),
    guessedAnswersCount: z.number(),
    isLoading: z.boolean(),
    multiplierSet: z.boolean(),
    nextRound: z.boolean(), // New property to track if the next round is started
    pointPool: z.number(),
    pointsAwarded: z.number(),
    question: z.string(),
    questionSaved: z.boolean(),
    roundCounter: z.number(),
    roundOver: z.boolean(),
    roundReset: z.boolean(),
    scoreMultiplier: z.number().nullable(),
    secondTeamGuessUsed: z.boolean(),
    sessionId: z.string().optional(), // Optional session ID for the game state
    startingTeam: z.string().nullable(),
    startingTeamSet: z.boolean(),
    strikes: z.number(),
    teamMembers: z.object({ A: z.array(z.string()), B: z.array(z.string()) }),
    teamNames: z.object({ A: z.string(), B: z.string() }),
    teamScores: z.object({ A: z.number(), B: z.number() }),
    teamStrikes: z.object({ A: z.number(), B: z.number() }),
    timer: z.number(),
    timerRunning: z.boolean(),
    winningTeam: z.string().nullable(),
  })
  .strict();

const sessionIdSchema = z
  .string()
  .regex(/^[A-Z0-9]{4}$/, { message: 'Session ID must be exactly 4 characters: A-Z, 0-9' });
const nameSchema = z.string().min(1);
const teamSchema = z.enum(['A', 'B']);

const SNTSchema = z
  .object({
    sessionId: sessionIdSchema,
    name: nameSchema,
    team: teamSchema,
  })
  .strict();

const SNSchema = z
  .object({
    sessionId: sessionIdSchema,
    name: nameSchema,
  })
  .strict();

const SGSchema = z
  .object({
    sessionId: sessionIdSchema,
    gameState: GameStateSchema,
  })
  .strict();

const SCSchema = z
  .object({
    sessionId: sessionIdSchema,
  })
  .strict();

const SessionIdSchema = z
  .object({
    sessionId: sessionIdSchema,
  })
  .strict();

// Load environment variables in development/test environments
if (process.env.NODE_ENV !== 'production') {
  try {
    const { default: dotenv } = await import('dotenv');
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      dotenv.config({ path: path.resolve(__dirname, '.env.test') });
    } else {
      dotenv.config();
    }
    console.log('✅ Environment variables loaded from .env file');
  } catch (error) {
    console.log('⚠️ Could not load dotenv (expected in production):', error);
  }
} else {
  console.log('🚀 Using host-provided environment variables in production');
}

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import helmet from 'helmet';
import { createUniqueSession } from './sessions.js';
import { isBuzzAllowed } from './buzz-access.js';
import { asyncHandler, onSafe, clientErrorMessage, SESSION_NOT_FOUND } from './safe-handlers.js';
import {
  initMonitoring,
  captureHandlerError,
  flushMonitoring,
  captureExpressError,
} from './monitoring.js';

// Error monitoring (#27): no-op unless SENTRY_DSN is set. Initialized after dotenv so a local
// .env can opt in, and before Firebase so startup failures are reported.
initMonitoring();

// Load environment variables
const projectId = process.env.FIREBASE_PROJECT_ID || 'fam-feud-2';
// Set emulator environment variables if running in test or CI
let credential: admin.credential.Credential;

console.log('Starting Firebase initialization...');
console.log('Project ID:', projectId);
console.log(
  'Using emulator:',
  !!(
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.NODE_ENV === 'test' ||
    process.env.CI
  ),
);

if (
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.NODE_ENV === 'test' ||
  process.env.CI
) {
  console.log('Using default credentials for emulator/test environment');
  credential = admin.credential.applicationDefault();
} else {
  if (!process.env.FIREBASE_CREDENTIALS) {
    console.error('FIREBASE_CREDENTIALS environment variable is not set');
    throw new Error('FIREBASE_CREDENTIALS environment variable is not set');
  }
  try {
    console.log('Parsing Firebase credentials...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS as string);
    console.log('Firebase credentials parsed successfully');
    credential = admin.credential.cert(serviceAccount);
  } catch (error) {
    console.error('Error parsing FIREBASE_CREDENTIALS:', error);
    throw new Error(`Failed to parse FIREBASE_CREDENTIALS: ${error.message}`);
  }
}

// Initialize Firebase
// Only require FIREBASE_CREDENTIALS if not using the emulator
const usingEmulator =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.NODE_ENV === 'test' ||
  process.env.CI;

if (!usingEmulator && !process.env.FIREBASE_CREDENTIALS) {
  console.error('FIREBASE_CREDENTIALS environment variable is not set for production');
  throw new Error('FIREBASE_CREDENTIALS environment variable is not set');
}

try {
  console.log('Initializing Firebase Admin SDK...');
  admin.initializeApp({ credential, projectId });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  throw new Error(`Failed to initialize Firebase: ${error.message}`);
}

export const db = admin.firestore();

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

app.get(
  '/api/session-exists/:sessionId',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    res.json({ exists: sessionDoc.exists });
  }),
);

// Create a session under a server-generated, guaranteed-unique ID.
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionId = await createUniqueSession(db);
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Failed to create session:', error);
    captureHandlerError(error, { event: 'create-session' });
    res.status(503).json({ error: 'Could not create a session. Please try again.' });
  }
});

app.post(
  '/api/create-session/:sessionId',
  asyncHandler(async (req, res) => {
    // Same rule as every socket event, so a session created here is always usable (#107).
    const parsed = sessionIdSchema.safeParse(req.params.sessionId);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    const sessionId = parsed.data;
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      await sessionRef.set({ sessionId, createdAt: new Date() });
    }
    res.json({ ok: true });
  }),
);

// List files
app.get('/api/answers-library', (req, res) => {
  const answersDir = path.join(__dirname, 'answers');
  fs.readdir(answersDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list files' });
    }
    const csvFiles = files.filter((f) => f.endsWith('.csv'));
    res.json(csvFiles);
  });
});

// Health check endpoint (used by Render healthCheckPath and by the deploy-backend job to confirm a deploy)
app.get('/api/health', (req, res) => {
  // commit is a public git sha set by Render; the deploy job compares it to the pushed sha (#89).
  const commit = process.env.RENDER_GIT_COMMIT;
  res.status(200).json(commit ? { status: 'ok', commit } : { status: 'ok' });
});
// Report unexpected Express errors (CORS rejections are expected and not reported).
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  captureExpressError(err);
  next(err);
});
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: err.message });
  } else {
    next(err);
  }
});
// Last resort: JSON 500 (or the 4xx a middleware such as the body parser chose). Never expose
// internal error messages to clients.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const status = err?.status ?? err?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({ error: 'Bad request' });
  }
  res.status(500).json({ error: 'Internal server error' });
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
  onSafe(socket, 'buzz', async (payload) => {
    const parseResult = SNSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      if (!payload?.name) {
        socket.emit('error', { message: 'Name is required to buzz' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - buzz' });
      return;
    }
    const { sessionId, name } = parseResult.data;
    try {
      const { sessionRef } = await getValidSessionDoc(sessionId);

      // First buzz wins (#23): read and write in one transaction, so two simultaneous buzzes
      // cannot both be accepted. A buzz is ignored when someone already buzzed or when the
      // host's buzzer assignment does not allow this name.
      const accepted = await db.runTransaction(async (tx) => {
        const doc = await tx.get(sessionRef);
        if (!doc.exists) {
          throw new Error(SESSION_NOT_FOUND);
        }
        const data = doc.data() || {};
        if (data.buzzedPlayer) return null;
        if (!isBuzzAllowed(name, data.buzzerPlayers, data.teamMembers)) return null;
        tx.set(sessionRef, { buzzedPlayer: name }, { merge: true });
        return { ...data, buzzedPlayer: name };
      });

      // Broadcast the updated state to all clients in the session
      if (accepted) {
        io.to(sessionId).emit('update-game', accepted);
      }
    } catch (error) {
      captureHandlerError(error, {
        event: 'buzz',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to buzz') });
    }
  });

  onSafe(socket, 'play-strike-sound', async (payload) => {
    const parseResult = SessionIdSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - play-strike-sound' });
      return;
    }
    const { sessionId } = parseResult.data;
    try {
      await getValidSessionDoc(sessionId); // Throws if session doesn't exist
      io.to(sessionId).emit('play-strike-sound');
    } catch (error) {
      captureHandlerError(error, {
        event: 'play-strike-sound',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to play strike sound') });
    }
  });

  onSafe(socket, 'join-session', async (payload) => {
    const parseResult = SessionIdSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - join-session' });
      return;
    }
    const { sessionId } = parseResult.data;
    try {
      await getValidSessionDoc(sessionId);
      socket.join(sessionId);
      socket.emit('joined-session', { sessionId });
    } catch (error) {
      captureHandlerError(error, {
        event: 'join-session',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to join session') });
    }
  });

  onSafe(socket, 'join-team', async (payload) => {
    const parseResult = SNTSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      if (!payload?.name) {
        socket.emit('error', { message: 'Name is required to join team' });
        return;
      }
      if (!payload?.team) {
        socket.emit('error', { message: 'Team is required to join team' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - join-team' });
      return;
    }
    const { sessionId, name, team } = parseResult.data;

    try {
      // Idempotent: a reconnecting client re-joins its team, and after a backend restart it may
      // still be listed (the disconnect cleanup never ran).
      const members = await updateTeamMembers(sessionId, (m) => {
        if (!m[team].includes(name)) m[team].push(name);
        return true;
      });

      socket.join(sessionId);

      io.to(sessionId).emit('team-members-updated', members);

      // Track player info for disconnect
      socketToPlayer[socket.id] = { sessionId, name, team };
    } catch (error) {
      captureHandlerError(error, {
        event: 'join-team',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to join team') });
    }
  });

  onSafe(socket, 'get-current-state', async (payload) => {
    const parseResult = SessionIdSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - get-current-state' });
      return;
    }
    const { sessionId } = parseResult.data;
    try {
      const { sessionDoc } = await getValidSessionDoc(sessionId);
      const currentState = sessionDoc.data();
      socket.emit('current-state', currentState); // Send the current state to the client
    } catch (error) {
      captureHandlerError(error, {
        event: 'get-current-state',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', {
        message: clientErrorMessage(error, 'Failed to get current game state'),
      });
    }
  });

  onSafe(socket, 'update-game', async (payload) => {
    const parseResult = SGSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      if (!payload?.gameState) {
        socket.emit('error', { message: 'Game state is required to update game' });
        return;
      }

      socket.emit('error', { message: 'Invalid request - update-game' });
      return;
    }
    const { sessionId, gameState: payloadState } = parseResult.data;
    try {
      const sessionRef = db.collection('sessions').doc(sessionId);

      // One transaction (#122): the host's copy may be stale, so teamMembers and buzzedPlayer
      // (written by join-team, remove-team-member and buzz) always come from the stored document,
      // and the roundOver transition is detected against the stored value it replaces. Events are
      // collected and emitted after the commit because Firestore may run this callback again.
      const events: string[] = [];
      let gameState: Record<string, any> = payloadState;
      await db.runTransaction(async (tx) => {
        events.length = 0;
        // Fresh copy per attempt: a retry must not see the resets applied by the previous one.
        gameState = { ...payloadState };
        const doc = await tx.get(sessionRef);
        if (!doc.exists) {
          throw new Error(SESSION_NOT_FOUND);
        }
        const firestoreState = doc.data() || {};

        gameState.teamMembers = firestoreState.teamMembers ?? { A: [], B: [] };
        gameState.buzzedPlayer = firestoreState.buzzedPlayer ?? '';

        // Get previous roundOver value
        const prevRoundOver = !!firestoreState.roundOver;
        const newRoundOver = !!gameState.roundOver;

        if (!gameState.expiryTime) {
          // Add expiryTime to the gameState object
          const expiryDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          gameState.expiryTime = new Date(Date.now() + expiryDuration).toISOString();
        }

        // Emit "round-over" ONLY if transitioning from not over to over
        if (!prevRoundOver && newRoundOver) {
          events.push('round-over');
        }

        // Emit "next-round" ONLY if transitioning from over to not over
        if (prevRoundOver && !newRoundOver && !gameState.roundReset) {
          gameState.roundReset = false;
          gameState.roundOver = false; // Reset roundOver if roundReset is true
          gameState.buzzedPlayer = ''; // Reset buzzedPlayer if roundReset is true
          gameState.buzzerPlayers = { A: null, B: null }; // The host picks buzzers again each round
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
          events.push('next-round', 'reset-buzzers');
        }

        // --- Reset the flag here, after logic that depends on it ---
        if (gameState.roundReset) {
          Object.assign(gameState, getResetRoundState());
          events.push('reset-round', 'reset-buzzers');
        }

        // --- Reset the flag here, after logic that depends on it ---
        if (gameState.gameReset) {
          Object.assign(gameState, getResetGameState());
          events.push('reset-round', 'reset-buzzers');
        }

        // Save the updated gameState to Firestore
        tx.set(sessionRef, gameState);
      });

      // Literal emit calls: tests/api-docs.test.ts finds the events by reading this file.
      for (const event of events) {
        if (event === 'round-over') io.to(sessionId).emit('round-over');
        if (event === 'next-round') io.to(sessionId).emit('next-round');
        if (event === 'reset-round') io.to(sessionId).emit('reset-round');
        if (event === 'reset-buzzers') io.to(sessionId).emit('reset-buzzers');
      }

      // Broadcast the updated game state to all clients in the session
      io.to(sessionId).emit('update-game', gameState);
    } catch (error) {
      captureHandlerError(error, {
        event: 'update-game',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to update game state') });
    }
  });

  onSafe(socket, 'update-team-name', async (payload) => {
    const parseResult = SNTSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      if (!payload?.name) {
        socket.emit('error', { message: 'Name is required to update team name' });
        return;
      }
      if (!payload?.team) {
        socket.emit('error', { message: 'Team is required to update team name' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - update-team-name' });
      return;
    }
    const { sessionId, name, team } = parseResult.data;
    try {
      const sessionRef = db.collection('sessions').doc(sessionId);
      const updatedTeamNames = await db.runTransaction(async (tx) => {
        const doc = await tx.get(sessionRef);
        if (!doc.exists) throw new Error(SESSION_NOT_FOUND);
        const currentTeamNames = (doc.data() || {}).teamNames || { A: 'A', B: 'B' };
        const next = { ...currentTeamNames, [team]: name };
        tx.set(sessionRef, { teamNames: next }, { merge: true });
        return next;
      });
      io.to(sessionId).emit('team-names-updated', updatedTeamNames);
    } catch (error) {
      captureHandlerError(error, {
        event: 'update-team-name',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to update team name') });
    }
  });

  onSafe(socket, 'get-team-members', async (payload) => {
    const parseResult = SessionIdSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - get-team-members' });
      return;
    }
    const { sessionId } = parseResult.data;

    try {
      const { sessionDoc } = await getValidSessionDoc(sessionId);
      const data = sessionDoc.data() || {};
      socket.emit('team-members-updated', data.teamMembers || { A: [], B: [] });
    } catch (error) {
      captureHandlerError(error, {
        event: 'get-team-members',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Failed to get team members') });
    }
  });

  onSafe(socket, 'remove-team-member', async (payload) => {
    const parseResult = SNTSchema.safeParse(payload);
    if (!parseResult.success) {
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      if (!payload?.name) {
        socket.emit('error', { message: 'Name is required to remove team member' });
        return;
      }
      if (!payload?.team) {
        socket.emit('error', { message: 'Team is required to remove team member' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - remove-team-member' });
      return;
    }

    const { sessionId, name, team } = parseResult.data;
    try {
      const members = await updateTeamMembers(sessionId, (m) => {
        m[team] = m[team].filter((memberName: string) => memberName !== name);
        return true;
      });
      io.to(sessionId).emit('team-members-updated', members);
    } catch (error) {
      captureHandlerError(error, {
        event: 'remove-team-member',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Error removing team member') });
    }
  });

  onSafe(socket, 'validate-session', async (payload, callback) => {
    const parseResult = SCSchema.safeParse(payload);
    if (!parseResult.success) {
      // Always answer the ack, so the caller does not wait for a timeout.
      if (typeof callback === 'function') {
        callback({ exists: false });
      }
      if (!payload?.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      socket.emit('error', { message: 'Invalid request - validate-session' });
      return;
    }
    const { sessionId } = parseResult.data;
    try {
      const { sessionDoc } = await getValidSessionDoc(sessionId);
      if (typeof callback === 'function') {
        callback({ exists: sessionDoc.exists });
      }
    } catch (error) {
      captureHandlerError(error, {
        event: 'validate-session',
        sessionId: payload?.sessionId,
        name: payload?.name,
      });
      socket.emit('error', { message: clientErrorMessage(error, 'Error validating session') });
      if (typeof callback === 'function') {
        callback({ exists: false });
      }
    }
  });

  socket.on('disconnect', async () => {
    // console.log('A user disconnected:', socket.id);

    const player = socketToPlayer[socket.id];
    if (player) {
      const { sessionId, name, team } = player;
      try {
        const members = await updateTeamMembers(sessionId, (m) => {
          m[team] = m[team].filter((memberName: string) => memberName !== name);
          return true;
        });
        io.to(sessionId).emit('team-members-updated', members);
      } catch (error) {
        console.error('Error removing player on disconnect:', error);
        captureHandlerError(error, { event: 'disconnect', sessionId, name });
      }
      // Remove from tracking
      delete socketToPlayer[socket.id];
    }
  });
});

async function getValidSessionDoc(sessionId: string) {
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();
  if (!sessionDoc.exists) {
    throw new Error(SESSION_NOT_FOUND);
  }
  return { sessionRef, sessionDoc };
}

type TeamMembers = { A: string[]; B: string[] };

/**
 * Read-modify-write of `teamMembers` in one transaction (#122), so simultaneous joins, removals
 * and disconnects cannot lose each other's change. `mutate` edits the members in place and may
 * run more than once (Firestore retries a contended transaction), so it must be pure. Returns the
 * committed members; callers broadcast after the commit. Throws SESSION_NOT_FOUND.
 */
async function updateTeamMembers(
  sessionId: string,
  mutate: (members: TeamMembers) => boolean,
): Promise<TeamMembers> {
  const sessionRef = db.collection('sessions').doc(sessionId);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(sessionRef);
    if (!doc.exists) throw new Error(SESSION_NOT_FOUND);
    const stored = (doc.data() || {}).teamMembers;
    const members: TeamMembers = {
      A: [...(stored?.A ?? [])],
      B: [...(stored?.B ?? [])],
    };
    if (mutate(members)) {
      tx.set(sessionRef, { teamMembers: members }, { merge: true });
    }
    return members;
  });
}

function getResetRoundState() {
  return {
    roundReset: false,
    roundOver: false, // Reset roundOver if roundReset is true
    buzzedPlayer: '', // Reset buzzedPlayer if roundReset is true
    buzzerPlayers: { A: null, B: null }, // Reset the host's buzzer picks
    startingTeamSet: false, // Reset startingTeamSet if roundReset is true
    currentTeam: 'A', // Reset currentTeam to 'A'
    strikes: 0, // Reset strikes
    pointPool: 0, // Reset point pool
    firstTeam: null, // Reset firstTeam
    secondTeamGuessUsed: false, // Reset secondTeamGuessUsed
    scoreMultiplier: null, // Reset scoreMultiplier
    timer: 0, // Reset timer
    timerRunning: false, // Reset timerRunning
    question: '', // Reset question
    pointsAwarded: 0, // Reset pointsAwarded
    winningTeam: null, // Reset winningTeam
    answers: [], // Reset answers
    guessedAnswers: [], // Reset guessedAnswers
    teamStrikes: { A: 0, B: 0 }, // Reset team strikes
    currentStep: 1, // Reset currentStep to 'manage'
    multiplierSet: false,
    answersSaved: false,
    startingTeam: null, // Reset startingTeam
    questionSaved: false, // Reset questionSaved
    buzzerOnlyPressed: false, // Reset buzzerOnlyPressed
    correctAfterBuzzer: false, // Reset correctAfterBuzzer
  };
}

function getResetGameState() {
  return {
    roundReset: false,
    roundOver: false,
    buzzedPlayer: '',
    buzzerPlayers: { A: null, B: null },
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
    nextRound: false, // Added to handle next round logic
  };
}

// Global error handlers.
// Sentry's default integrations capture both of these; we only log and, for crashes, flush.
// An uncaught exception leaves the process in an unknown state, so exit (after flushing).
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await flushMonitoring();
  process.exit(1);
});

// Request-scoped code (routes, socket listeners) is wrapped so its failures never get here; a
// stray rejection must not drop every active game, so log it and keep serving.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (process kept running):', reason);
});

export default app;
export { server, io };

# Backend API reference

Internal reference for the backend in [backend/index.ts](../backend/index.ts): the REST routes and the Socket.IO events. It describes what the code does today, including its quirks (see [Known quirks](#known-quirks)).

**The code is the source of truth.** If this page and the code disagree, the code wins and this page is wrong. `backend/tests/api-docs.test.ts` fails when a route, an event or a `GameState` field exists in only one of the two. It checks names, not payload shapes, so read the handler when you change behavior.

**Adding or changing an event:** edit the handler in `backend/index.ts`, add or update its `### \`event-name\``entry in the right section below, then run`npm test`in`backend/`.

- [Conventions](#conventions)
- [REST routes](#rest-routes)
- [Socket.IO: client to server](#socketio-client-to-server)
- [Socket.IO: server to client](#socketio-server-to-client)
- [GameState](#gamestate)
- [Known quirks](#known-quirks)

## Conventions

**Session.** A game is one Firestore document `sessions/{sessionId}`. Socket events accept only IDs matching `^[A-Z0-9]{4}$`. `POST /api/create-session/:sessionId` enforces the same rule; `GET /api/session-exists/:sessionId` does not, and answers `{ "exists": false }` for any other string.

**Roles are not enforced.** The server has no notion of host, team member or spectator. The "sent by" notes below describe which frontend view normally sends an event: the host is `HostDashboard.vue`, a team member is `TeamDisplay.vue`, and a spectator is `Spectator.vue`, which renders `TeamDisplay.vue` without joining a team. Any socket that knows a session ID can send any event.

**Rooms.** A socket joins the Socket.IO room named after the session ID with `join-session` or `join-team`. "Broadcast" below means `io.to(sessionId).emit(...)`, which reaches every socket in that room, including the sender if it joined. "Reply" means `socket.emit(...)`, which reaches only the sender. Rooms are per socket: a reconnected socket is in no room until it joins again, which is why the frontend re-sends `join-session` on every connect (`useSessionSync`).

**Validation.** Payloads are checked with strict zod schemas, so unknown extra fields are rejected. `name` must be a non-empty string. `team` must be `A` or `B`. When validation fails the handler replies with an `error` event and does nothing else:

1. no `sessionId` in the payload: `Session ID is required`
2. a missing or empty `name`, or a missing `team`, where the event needs one: `Name is required to ...` or `Team is required to ...` (the exact text differs per event)
3. any other failure, including a malformed session ID, a `team` other than `A` or `B`, or an unknown extra field: `Invalid request - <event>`

**Errors.** Errors are always the event `error` with payload `{ message: string }`. A missing session produces `Session does not exist`. Any other failure inside a handler's `try`/`catch` produces that handler's fixed fallback text (for example `Failed to join team`), never the underlying error message, which stays in the server log and Sentry. Any error thrown outside a handler's own `try`/`catch` is caught by `onSafe` ([safe-handlers.ts](../backend/safe-handlers.ts)), reported to Sentry (tags only, never the payload), and answered with `{ message: 'Internal server error' }`. A handler failure never crashes the process.

**CORS.** Allowed origins come from `ALLOWED_ORIGINS` (comma-separated, default `http://localhost:5173`) and apply to both Express and Socket.IO. Express also sets `helmet()` headers and parses JSON bodies. Requests without an `Origin` header (curl, server-to-server) are allowed.

## REST routes

| Route                                 | Sent by                                          | Success                                                                                  | Errors                                                               |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /`                               | anyone                                           | `200` text `Family Feud Backend is running!!!!`                                          | none                                                                 |
| `GET /api/health`                     | Render health check, the `deploy-backend` CI job | `200` `{ "status": "ok" }`, plus `"commit": "<git sha>"` when `RENDER_GIT_COMMIT` is set | none                                                                 |
| `GET /api/session-exists/:sessionId`  | Home view, HTTP fallback in `validateSessionId`  | `200` `{ "exists": boolean }`                                                            | `500` generic                                                        |
| `POST /api/sessions`                  | Home view (`requestNewSessionId`)                | `201` `{ "sessionId": "ABCD" }`: a new session under a server-generated unique ID        | `503` `{ "error": "Could not create a session. Please try again." }` |
| `POST /api/create-session/:sessionId` | HostDashboard on mount, Cypress setup            | `200` `{ "ok": true }`: creates the session if it does not exist, otherwise does nothing | `400` invalid ID, `500` generic                                      |
| `GET /api/answers-library`            | HostDashboard                                    | `200` JSON array of `.csv` file names in `backend/answers`                               | `500` `{ "error": "Failed to list files" }`                          |

Also served: `GET /answers/<file>` returns the static files in `backend/answers` (the CSVs listed above).

Details:

- **`POST /api/sessions`** picks 4 random characters from `A-Z0-9` and creates the Firestore document atomically (`create()`, which fails if the ID is taken), retrying up to 10 times. The new document is `{ sessionId, createdAt }` only, not a full `GameState`.
- **`POST /api/create-session/:sessionId`** is the older route where the client picks the ID. `:sessionId` must match `^[A-Z0-9]{4}$`, the same rule as the socket events. Any other value returns `400` `{ "error": "Invalid session ID" }` and writes nothing.
- **Errors in any route:** a rejected CORS origin returns `403` `{ "error": "Not allowed by CORS" }`. A 4xx raised by middleware (for example a malformed JSON body) returns that status with `{ "error": "Bad request" }`. Anything else returns `500` `{ "error": "Internal server error" }`. Internal messages are never returned over REST.

## Socket.IO: client to server

Ten events plus the built-in `disconnect`. All take one object payload unless stated. No event except `validate-session` has an ack.

### `join-session`

Subscribes the socket to a session's room.

- **Payload:** `{ sessionId }`
- **Reply:** `joined-session` `{ sessionId }`
- **Errors:** `error`. A missing session gives `Session does not exist`; any other failure gives `Failed to join session`.
- **Side effects:** the socket joins the room. No Firestore write.
- **Sent by:** every view on connect and reconnect, through `useSessionSync`, together with `get-current-state` (and `get-team-members` for the host).

### `join-team`

Adds a player to a team.

- **Payload:** `{ sessionId, name, team }` where `team` is `"A"` or `"B"`
- **Broadcast:** `team-members-updated` `{ A: string[], B: string[] }`
- **Errors:** `error`.
- **Side effects:** reads `teamMembers`, appends `name` to the team if not already there (idempotent), writes `teamMembers` with merge, joins the room, and records `socket.id -> { sessionId, name, team }` in memory for the `disconnect` cleanup. The read-modify-write is not a transaction.
- **Sent by:** a team member on `TeamDisplay.vue` after choosing a name and team, and again on reconnect.

### `update-team-name`

Renames a team. Note the field meaning: `name` is the new team name, and `team` is the team key to rename.

- **Payload:** `{ sessionId, name, team }`
- **Broadcast:** `team-names-updated` `{ A: string, B: string }`
- **Errors:** `error`
- **Side effects:** writes `teamNames` with merge, as `{ ...current, [team]: name }`. A missing `teamNames` defaults to `{ A: 'A', B: 'B' }`.
- **Sent by:** a team member on `TeamDisplay.vue`.

### `remove-team-member`

Removes a player from a team.

- **Payload:** `{ sessionId, name, team }`
- **Broadcast:** `team-members-updated` `{ A: string[], B: string[] }`, only if the team key exists
- **Errors:** `error`. A session that has no `teamMembers` yet fails with `Error removing team member`. A `team` key that is not present is a silent no-op: no event, no error.
- **Side effects:** writes `teamMembers` with merge. It broadcasts even if `name` was not in the team.
- **Sent by:** the host (to kick a player) and a team member (to leave).

### `get-team-members`

Asks for the current team lists.

- **Payload:** `{ sessionId }`
- **Reply:** `team-members-updated` `{ A: string[], B: string[] }`, or `{ A: [], B: [] }` if none are stored. This is a reply to the sender only, not a broadcast.
- **Errors:** `error`
- **Sent by:** the host on connect and reconnect.

### `get-current-state`

Asks for the stored session document.

- **Payload:** `{ sessionId }`
- **Reply:** `current-state`, the raw Firestore document. For a session that has never had `update-game`, it is only `{ sessionId, createdAt }` and not a full `GameState`. Timestamps arrive as `{ _seconds, _nanoseconds }`.
- **Errors:** `error`
- **Sent by:** every view on connect and reconnect. The host and `TeamDisplay.vue` listen for `current-state`.

### `update-game`

Replaces the whole game state. This is the main write path and the host's only way to change the game.

- **Payload:** `{ sessionId, gameState }` where `gameState` is the complete [GameState](#gamestate). The schema is strict: every required field must be present, and no extra field is allowed.
- **Broadcast:** `update-game` with the state as saved (after the transitions below), preceded by any of `round-over`, `next-round`, `reset-round`, `reset-buzzers`
- **Errors:** `error`. A missing `gameState` gives `Game state is required to update game`.
- **Side effects, in order:**
  1. Reads the stored `roundOver` and compares it with the incoming one.
  2. If `expiryTime` is absent, sets it to now plus 24 hours (ISO string). An existing value is kept.
  3. Stored `roundOver` false and incoming true: broadcasts `round-over`.
  4. Stored `roundOver` true and incoming false and `roundReset` false: this is "next round". It overwrites these fields in the incoming state and broadcasts `next-round` then `reset-buzzers`: `roundReset`, `roundOver`, `startingTeamSet`, `strikes`, `pointPool`, `secondTeamGuessUsed`, `timerRunning`, `pointsAwarded` and `nextRound` become false or `0`; `buzzedPlayer` and `question` become `''`; `currentTeam` becomes `'A'`; `firstTeam`, `scoreMultiplier` and `winningTeam` become `null`; `timer` becomes `0`; `answers` and `guessedAnswers` become `[]`; `teamStrikes` becomes `{ A: 0, B: 0 }`; `currentStep` becomes `1`. It does not touch `multiplierSet`, `answersSaved`, `startingTeam`, `questionSaved`, `buzzerOnlyPressed` or `correctAfterBuzzer`.
  5. `roundReset` true: overwrites the state with the round-reset values and broadcasts `reset-round` then `reset-buzzers`. This set is the step 4 list plus `multiplierSet`, `answersSaved`, `startingTeam`, `questionSaved`, `buzzerOnlyPressed` and `correctAfterBuzzer`, all reset (`roundReset` is also set back to false).
  6. `gameReset` true: overwrites the state with the game-reset values and broadcasts `reset-round` then `reset-buzzers`. It resets the round fields as in step 5, plus `roundCounter` to `0`, `teamScores` to `{ A: 0, B: 0 }`, `gameReset` and `nextRound` to false, and sets `currentTeam` to `'A'`. It keeps `teamMembers` and `teamNames`.
  7. Writes the result to Firestore with `set()` and no merge, replacing the document.
  8. Broadcasts `update-game`.
- **Sent by:** the host only, from `HostDashboard.vue`.

### `buzz`

A player buzzes in.

- **Payload:** `{ sessionId, name }`
- **Broadcast:** `update-game` with the whole stored session document (not a validated `GameState`)
- **Errors:** `error`
- **Side effects:** writes `buzzedPlayer: name` with merge, then reads the document back and broadcasts it. There is no check that someone already buzzed, so the last buzz wins (quirk 6). `name` is not checked against `teamMembers`.
- **Sent by:** a team member on `TeamDisplay.vue`.

### `play-strike-sound`

Tells every client to play the strike sound.

- **Payload:** `{ sessionId }`
- **Broadcast:** `play-strike-sound` with no payload
- **Errors:** `error`
- **Side effects:** none besides the broadcast. It checks only that the session exists.
- **Sent by:** the host. `TeamDisplay.vue` (and so spectators) listens.

### `validate-session`

Checks that a session exists. The only event with an ack.

- **Payload:** `{ sessionId }`, plus an ack callback as the last argument
- **Ack:** `{ exists: boolean }`
- **Behavior:**
  - Session exists: ack `{ exists: true }`.
  - Session missing: ack `{ exists: false }` and `error` `Session does not exist`.
  - Payload has a `sessionId` but fails validation: ack `{ exists: false }` and `error` `Invalid request - validate-session`.
  - Payload has no `sessionId`: ack `{ exists: false }` and `error` `Session ID is required`.
  - Unexpected failure: ack `{ exists: false }` and `error` `Error validating session`.
- **Sent by:** `validateSessionId` in `frontend/src/api/session.ts`, which waits for the ack and falls back to `GET /api/session-exists/:sessionId` on a timeout.

### `disconnect`

Built into Socket.IO, not sent by clients on purpose.

- **Behavior:** if the socket earlier sent `join-team`, removes that name from that team, writes `teamMembers` with merge, and broadcasts `team-members-updated`. The tracking map is in memory, so it is lost on a backend restart and has one entry per socket (a second `join-team` on the same socket replaces the first). Hosts and spectators are not tracked, so nothing happens when they disconnect.

## Socket.IO: server to client

Eleven events. The frontend registers listeners in `HostDashboard.vue`, `TeamDisplay.vue` (which spectators also use) and `stores/gamestore.ts`.

### `error`

- **Payload:** `{ message: string }`
- **To:** the sender only, in response to a failed event. See [Conventions](#conventions) for the messages.
- **Listened to by:** `HostDashboard.vue` and `TeamDisplay.vue`.

### `joined-session`

- **Payload:** `{ sessionId }`
- **To:** the sender only, after `join-session`. Nothing in the frontend listens for it today.

### `current-state`

- **Payload:** the stored session document (may be partial, see `get-current-state`)
- **To:** the sender only. Listened to by the host and `TeamDisplay.vue`.

### `team-members-updated`

- **Payload:** `{ A: string[], B: string[] }`
- **To:** everyone in the room after `join-team`, `remove-team-member` and `disconnect`. Only the sender after `get-team-members`.

### `team-names-updated`

- **Payload:** `{ A: string, B: string }`
- **To:** everyone in the room after `update-team-name`.

### `update-game`

- **Payload:** the full `GameState` after `update-game`, or the raw session document after `buzz`
- **To:** everyone in the room. The `gamestore` listener (started by the host) and `TeamDisplay.vue` apply it to local state.

### `round-over`

- **Payload:** none
- **To:** everyone in the room, sent by `update-game` when `roundOver` goes from false to true.

### `next-round`

- **Payload:** none
- **To:** everyone in the room, sent by `update-game` when `roundOver` goes from true to false without `roundReset`. Always followed by `reset-buzzers`.

### `reset-round`

- **Payload:** none
- **To:** everyone in the room, sent by `update-game` when `roundReset` or `gameReset` is true. Always followed by `reset-buzzers`.

### `reset-buzzers`

- **Payload:** none
- **To:** everyone in the room, after `next-round` or `reset-round`.

### `play-strike-sound`

- **Payload:** none
- **To:** everyone in the room, after the `play-strike-sound` client event.

## GameState

The shape that `update-game` accepts and that the host sends. The source of truth is `GameStateSchema` in `backend/index.ts`, which is `.strict()`: all fields are required except `createdAt`, `expiryTime` and `sessionId`. Types are the zod types.

**Round flow**

| Field             | Type    | Notes                                               |
| ----------------- | ------- | --------------------------------------------------- |
| `currentStep`     | number  | Host wizard step; reset to `1`                      |
| `roundCounter`    | number  | Reset to `0` only by `gameReset`                    |
| `roundOver`       | boolean | Its transitions drive `round-over` and `next-round` |
| `roundReset`      | boolean | Request flag: true triggers the round reset         |
| `gameReset`       | boolean | Request flag: true triggers the full game reset     |
| `nextRound`       | boolean | Tracks that the next round has started              |
| `isLoading`       | boolean | Client UI flag                                      |
| `enteredFromHome` | boolean | Client navigation flag                              |

**Question and answers**

| Field                 | Type                                             | Notes         |
| --------------------- | ------------------------------------------------ | ------------- |
| `question`            | string                                           | Reset to `''` |
| `questionSaved`       | boolean                                          |               |
| `answers`             | `{ id: string, text: string, points: number }[]` | Reset to `[]` |
| `answersSaved`        | boolean                                          |               |
| `guessedAnswers`      | `{ id: string }[]`                               | Reset to `[]` |
| `guessedAnswersCount` | number                                           |               |

**Buzzer and turns**

| Field                 | Type           | Notes                                               |
| --------------------- | -------------- | --------------------------------------------------- |
| `buzzedPlayer`        | string or null | `buzz` sets it to a name; resets use `''`           |
| `buzzerOnlyPressed`   | boolean        |                                                     |
| `correctAfterBuzzer`  | boolean        |                                                     |
| `correctBeforeBuzzer` | boolean        |                                                     |
| `currentTeam`         | string         | `'A'` after a round reset, `'a'` after a game reset |
| `firstTeam`           | string or null | Reset to `null`                                     |
| `startingTeam`        | string or null | Reset to `null`                                     |
| `startingTeamSet`     | boolean        |                                                     |
| `secondTeamGuessUsed` | boolean        |                                                     |

**Scoring**

| Field             | Type                       | Notes                     |
| ----------------- | -------------------------- | ------------------------- |
| `pointPool`       | number                     | Reset to `0`              |
| `pointsAwarded`   | number                     | Reset to `0`              |
| `scoreMultiplier` | number or null             | Reset to `null`           |
| `multiplierSet`   | boolean                    |                           |
| `teamScores`      | `{ A: number, B: number }` | Reset only by `gameReset` |
| `winningTeam`     | string or null             | Reset to `null`           |
| `strikes`         | number                     | Reset to `0`              |
| `teamStrikes`     | `{ A: number, B: number }` | Reset to zeros            |

**Teams**

| Field         | Type                           | Notes                                                              |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| `teamMembers` | `{ A: string[], B: string[] }` | Also written by `join-team`, `remove-team-member` and `disconnect` |
| `teamNames`   | `{ A: string, B: string }`     | Also written by `update-team-name`                                 |

**Timer**

| Field          | Type    | Notes          |
| -------------- | ------- | -------------- |
| `timer`        | number  | Reset to `0`   |
| `timerRunning` | boolean | Reset to false |

**Bookkeeping**

| Field        | Type                                                   | Notes                                                         |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------- |
| `sessionId`  | string, optional                                       |                                                               |
| `createdAt`  | `{ _seconds: number, _nanoseconds: number }`, optional | A Firestore Timestamp as the client sees it                   |
| `expiryTime` | string, optional                                       | ISO time; set to now plus 24 hours by `update-game` if absent |

## Known quirks

Current behavior that may surprise you, documented as is. None are fixed by this document; the follow-up issue (#107) tracks them. Fixed quirks are removed and the rest keep the numbers used in #107, so the numbering has gaps. "Code" means read from the source; nothing here was reproduced against a running server.

- **Quirk 1: No authorization (code).** Anyone with a 4-character session ID can send any event, including `update-game`, `remove-team-member` and `buzz` as any name. Roles exist only in the frontend.
- **Quirk 5: `update-game` replaces the document (code).** `set()` without merge means a stale client overwrites newer data written by other events (for example `teamMembers` from `join-team`, or `buzzedPlayer` from `buzz`). The read-modify-write in `join-team`, `remove-team-member` and `update-team-name` is not transactional either, so two simultaneous writes can lose one.
- **Quirk 6: `buzz` has no "first wins" rule (code).** Every buzz overwrites `buzzedPlayer`, so the last one in wins, and the broadcast `update-game` carries the raw document, not a validated `GameState`.
- **Quirk 8: Disconnect cleanup is partial (code).** It covers only sockets that sent `join-team`, uses an in-memory map, and a second `join-team` on the same socket replaces the first entry. A player who switches team on one socket stays listed on the old team.

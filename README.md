# The Feud

## Game Overview

**The Feud** is a multiplayer game
![Screenshot 2025-06-18 at 11-38-04 The Feud](https://github.com/user-attachments/assets/cadb11c6-7508-4f8b-9b8b-a9b2f5c41d34)
![Screenshot 2025-06-18 at 11-38-16 The Feud](https://github.com/user-attachments/assets/f5861b77-ddf8-42b3-a487-153bf6ccc964)
![Screenshot 2025-06-18 at 11-38-32 The Feud](https://github.com/user-attachments/assets/cb029000-f90e-48f1-9a63-5769f5918aee)
![Screenshot 2025-06-18 at 11-38-40 The Feud](https://github.com/user-attachments/assets/a0830a4c-6ffb-4ce3-9458-95398a28ba57)
![Screenshot 2025-06-18 at 11-40-04 The Feud](https://github.com/user-attachments/assets/7f9249be-4f07-4b49-8dce-6ae1da0b21cc)
![Screenshot 2025-06-18 at 11-40-12 The Feud](https://github.com/user-attachments/assets/89d0e6e9-0cd3-4954-b0db-30b03ff491ea)
![Screenshot 2025-06-18 at 11-40-19 The Feud](https://github.com/user-attachments/assets/29474ec4-fe5e-4652-84a9-166ffc16e7a7)
![Screenshot 2025-06-18 at 11-40-37 The Feud](https://github.com/user-attachments/assets/76675cd0-e571-49c5-9234-acac50368116)
![Screenshot 2025-06-18 at 11-40-54 The Feud](https://github.com/user-attachments/assets/a11394a3-9964-43a3-9c49-6eac4975f071)
![Screenshot 2025-06-18 at 11-41-05 The Feud](https://github.com/user-attachments/assets/09fc47d2-cf5a-44dc-9b53-293c5a0f95c9)
![Screenshot 2025-06-18 at 11-41-20 The Feud](https://github.com/user-attachments/assets/69d5fa1c-8f37-4e55-8800-a88915c6bc2a)
![Screenshot 2025-06-18 at 11-41-26 The Feud](https://github.com/user-attachments/assets/4e8c3b12-3098-4dae-9f0c-d770ec414758)
![Screenshot 2025-06-18 at 11-41-31 The Feud](https://github.com/user-attachments/assets/2b432140-a0c6-4f44-a789-b55071c7347f)
![Screenshot 2025-06-18 at 11-41-57 The Feud](https://github.com/user-attachments/assets/d8c6d28c-7c33-44a7-aeb9-49bcfdb316b8)
![Screenshot 2025-06-18 at 11-42-10 The Feud](https://github.com/user-attachments/assets/5b23472b-24f2-47c5-97d1-a24bd92c930f)
![Screenshot 2025-06-18 at 11-42-27 The Feud](https://github.com/user-attachments/assets/ffd4f1bd-fcdb-48fd-b749-d7b72235da82)
![Screenshot 2025-06-18 at 11-42-42 The Feud](https://github.com/user-attachments/assets/9d07c733-4c03-434a-8bf2-9c81ff4e79ee)
![Screenshot 2025-06-18 at 11-42-49 The Feud](https://github.com/user-attachments/assets/2a6a28b1-fa69-4a7e-9ae1-eebb2ce6f6e4)
![Screenshot 2025-06-18 at 11-43-00 The Feud](https://github.com/user-attachments/assets/50cbd702-0d95-4f5a-837a-a498f689ad7d)

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

---

## Testing

- **Backend** (`cd backend && npm test`): requires the Firebase Firestore emulator on `127.0.0.1:8080` (start it with `npm run dev` from the repo root, or `firebase emulators:start --only firestore,auth`).
- **Frontend component tests** (`cd frontend && npm run test:component`).
- **Frontend e2e**: needs the backend, the Firestore/Auth emulators and the Vite dev server running (CI starts them the same way, see `.github/workflows/monorepo-deploy.yml`). See [Running e2e locally](#running-e2e-locally).

### Running e2e locally

A full run takes 9+ minutes, so run one spec at a time while developing.

1. Make sure ports 4000, 5173, 8080 and 8089 are free: `lsof -nP -iTCP:4000 -iTCP:5173 -iTCP:8080 -iTCP:8089 -sTCP:LISTEN`. A leftover backend or Vite from an earlier session is the usual cause of a blank page or odd failures; stop it (check the owner with `lsof -p <pid> -a -d cwd`) before starting.
2. Build the backend once: `npm run build` (repo root). The `firebase` CLI must be installed globally and logged in.
3. Start the stack from the repo root: `npm run dev` (emulators, backend, Vite). Restart it after editing `firebase.json` or `firestore.rules`.
4. In another terminal, run one spec: `cd frontend && npm run test:e2e:local -- --spec cypress/e2e/home.cy.ts` (about 15 s; `retries=0` so failures show up immediately). From the VS Code integrated terminal this script already unsets `ELECTRON_RUN_AS_NODE`.

To mirror CI exactly instead, start the emulators with `firebase emulators:start --only firestore,auth --project demo-test`, the backend with `FIREBASE_CREDENTIALS='{}' FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:8089 FIREBASE_PROJECT_ID=demo-test node backend/dist/server.js`, and Vite with `VITE_FIREBASE_CONFIG='{"apiKey":"test","authDomain":"test","projectId":"test"}' VITE_USE_FIREBASE_EMULATOR=true`. Both setups pass `home.cy.ts` locally. If you see a blank page, `npm run test:e2e:chrome` (system Chrome) is the fallback, because Cypress's bundled Electron has rendered blank on some Macs.

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In Project Settings, generate a service account key and download the JSON file.
3. Set the `FIREBASE_CREDENTIALS` environment variable with the contents of your service account JSON.
   - For local development, you can use a `.env` file:
     ```
     FIREBASE_CREDENTIALS='{"type":"service_account",...}'
     ```
4. Make sure Firestore is enabled in your Firebase project.

---

## Vercel Deployment (Frontend)

1. [Sign up for Vercel](https://vercel.com/) and connect your GitHub repository.
2. Set up your project in Vercel, specifying the frontend directory if using a monorepo.
3. Add any necessary environment variables in the Vercel dashboard (e.g., for Firebase or API endpoints).
4. Deploy! Vercel will automatically build and host your frontend.

### Keeping Vercel deployments under the free-plan limit

The Vercel free plan allows **100 deployments per rolling 24 hours, shared across every project on the team**. The git integration builds a preview for every push to every branch and a production build for every push to `main`. Once the limit is hit, CLI/API deploys fail with `api-deployments-free-per-day`. Git-integration deploys are **not** safe below 100 either: a production deploy was rejected as rate limited when the team count was about 85, so treat roughly 60 as the working ceiling. Builds canceled by an `ignoreCommand` (Ignored Build Step) most likely still count toward the limit, so skipping builds that way is not used here.

Working agreement:

- One issue per branch and PR; put follow-ups on the same branch instead of opening new PRs.
- Verify locally (build, lint, tests) before the first push, then push once when ready. Every push to a PR branch creates a preview deployment.
- Avoid throwaway PRs (temporary triggers, "remove the trigger" follow-ups); verify those changes locally or on one branch.
- Before opening or merging a batch of PRs, check the count:

  ```bash
  scripts/vercel-deploy-count.sh        # last 24h; pass a number of hours to change the window
  ```

  It needs the Vercel CLI (`vercel login`) and `jq`, and prints counts by project, source and target. If the team total is above about 60, hold pushes and merges until it drops.

---

## Analytics and privacy

The app uses [Vercel Web Analytics](https://vercel.com/docs/analytics) to see whether games get played. It sets no cookies and collects no personal data.

- **What is sent:** page views (path only) and four events: `session_created`, `spectator_joined`, `team_joined` (property `team`: `A` or `B`) and `round_completed` (property `round`: the round number). The custom events are sent, but on Vercel's Hobby plan they can only be read on Pro, so the free signal is the page views (paths `/host`, `/team`, `/spectator`).
- **What is never sent:** session codes, player or team names, query strings, or any user identifier. URLs are reduced to their path before leaving the browser, and `track()` in `frontend/src/utils/analytics.ts` only accepts those event names and properties.
- **When it runs:** only in a production build, never under Cypress or in dev, and only on the production hostname, so previews and localhost send nothing. There is no environment variable; the code is in `frontend/src/utils/analytics.ts` and is started from `frontend/src/main.ts`.
- **Looking at the data:** the project's Analytics tab in Vercel (the Events panel needs Pro), or `vercel metrics vercel.analytics.page_view.count --group-by requestPath --since 1d -p family-feud` (`-p family-feud` is needed because this checkout is not linked; run `vercel metrics schema vercel.analytics` for dimensions). On Hobby, `vercel.analytics.event.count` returns `payment_required`.
- **Turning it off:** remove the `initAnalytics()` call in `main.ts` (events become no-ops), and disable Web Analytics in the Vercel project settings.

---

## Render Deployment (Backend)

The backend (Express + Socket.IO) runs on [Render](https://render.com/) and is defined by [render.yaml](render.yaml).

1. In the Render dashboard choose **New > Blueprint**, connect this repo, and select `render.yaml`. This creates the `thefeud-backend` web service (build: `npm ci && npm run build`, start: `npm start`, health check: `/api/health`).
2. Set the two dashboard-only environment variables (they are `sync: false` in the Blueprint and never go in git):
   - `FIREBASE_CREDENTIALS`: the service-account JSON as a single line.
   - `ALLOWED_ORIGINS`: the frontend origin(s) allowed by CORS, comma-separated, e.g. `https://family-feud-eta.vercel.app`.
3. Auto-deploy is off (`autoDeployTrigger: 'off'`). CI deploys instead: after CI passes on a push to `main` that changed `backend/` or `render.yaml`, the `deploy-backend` job in [monorepo-deploy.yml](.github/workflows/monorepo-deploy.yml) calls the service's Deploy Hook. Create the hook under **Service > Settings > Deploy Hook** and store it as the GitHub secret `RENDER_DEPLOY_HOOK_URL` (`gh secret set RENDER_DEPLOY_HOOK_URL`); without it the job skips with a warning. You can still deploy manually from the dashboard.
4. Point the frontend at it: in Vercel set `VITE_API_BASE` to the Render URL (e.g. `https://thefeud-backend.onrender.com`) and redeploy the frontend. Locally it defaults to `http://localhost:4000`.

**Free plan behaviour:** the service sleeps after ~15 minutes without traffic and takes ~1 minute to cold start. Connected clients drop and show a reconnect banner, then rejoin automatically once the service is back. For an always-on backend, change `plan: free` to `plan: starter` in `render.yaml`.

---

## API reference

[docs/api.md](docs/api.md) documents the backend's REST routes, every Socket.IO event (payloads, responses, rooms, side effects), the `GameState` shape and the known quirks. Read it before adding or changing an event. `npm test` in `backend/` fails if a route, event or `GameState` field exists in only the code or only the doc.

---

## Environment Variables

- Backend: `FIREBASE_CREDENTIALS` (service account JSON, single line) and `ALLOWED_ORIGINS` (comma-separated CORS origins). Set in the Render dashboard in production, or in `backend/.env` locally.
- Frontend: `VITE_API_BASE` (backend URL; defaults to `http://localhost:4000`). Set in Vercel in production.
- Error monitoring (optional, [Sentry](https://sentry.io); off when unset, and always off under tests/Cypress): backend `SENTRY_DSN` (Render dashboard); frontend `VITE_SENTRY_DSN` (Vercel project settings, build-time). Events are tagged with `environment` and `release` (git sha from `RENDER_GIT_COMMIT` / `VERCEL_GIT_COMMIT_SHA`), and request bodies, headers, cookies and credential-like values are scrubbed before sending. Optional frontend source maps: set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` in the Vercel build environment (never in the repo); without all three, no source maps are built or uploaded. DSNs and tokens are never committed.

---

**See each platform’s documentation for more details and troubleshooting.**

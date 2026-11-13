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
- **Frontend e2e** (`cd frontend && npm run test:e2e:chrome`): runs Cypress in system Chrome. Cypress's bundled Electron can render a blank page on some Macs, so use Chrome locally. If you run it from the VS Code integrated terminal, unset `ELECTRON_RUN_AS_NODE` first (`env -u ELECTRON_RUN_AS_NODE npm run test:e2e:chrome`).

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

The Vercel free plan allows **100 deployments per rolling 24 hours, shared across every project on the team**. The git integration builds a preview for every push to every branch and a production build for every push to `main`. Once the limit is hit, CLI/API deploys fail with `api-deployments-free-per-day`.

Working agreement:

- One issue per branch and PR; put follow-ups on the same branch instead of opening new PRs.
- Verify locally (build, lint, tests) before the first push, then push once when ready. Every push to a PR branch creates a preview deployment.
- Avoid throwaway PRs (temporary triggers, "remove the trigger" follow-ups); verify those changes locally or on one branch.
- Before opening or merging a batch of PRs, check the count:

  ```bash
  scripts/vercel-deploy-count.sh        # last 24h; pass a number of hours to change the window
  ```

  It needs the Vercel CLI (`vercel login`) and `jq`, and prints counts by project, source and target. If the team total is near 100, hold merges until it drops.

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

## Environment Variables

- Backend: `FIREBASE_CREDENTIALS` (service account JSON, single line) and `ALLOWED_ORIGINS` (comma-separated CORS origins). Set in the Render dashboard in production, or in `backend/.env` locally.
- Frontend: `VITE_API_BASE` (backend URL; defaults to `http://localhost:4000`). Set in Vercel in production.
- Error monitoring (optional, [Sentry](https://sentry.io); off when unset, and always off under tests/Cypress): backend `SENTRY_DSN` (Render dashboard); frontend `VITE_SENTRY_DSN` (Vercel project settings, build-time). Events are tagged with `environment` and `release` (git sha from `RENDER_GIT_COMMIT` / `VERCEL_GIT_COMMIT_SHA`), and request bodies, headers, cookies and credential-like values are scrubbed before sending. Optional frontend source maps: set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` in the Vercel build environment (never in the repo); without all three, no source maps are built or uploaded. DSNs and tokens are never committed.

---

**See each platform’s documentation for more details and troubleshooting.**

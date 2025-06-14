# family-feud

## Game Overview

**The Feud** is a multiplayer game with four main interfaces:

### 1. Home Page

![home](https://github.com/user-attachments/assets/fad93376-0705-4140-bffd-216a9ba7f5e3)

- Users can **create a new game session** or **join an existing session** using a session ID.
- The home page is the starting point for hosts, team members, and spectators.

### 2. Host Dashboard

![host-dashboard](https://github.com/user-attachments/assets/63ee3155-717d-40a7-80a3-e53a8edd4796)

- The host can **administer the game** using the dashboard.
- Features include:
  - **Loading questions and answers** from a CSV file or selecting from a built-in library.
  - **Setting the score multiplier** for each round.
  - **Marking answers as correct or incorrect** as teams guess.
  - **Game controls** to start/stop timers, reset rounds, and manage team scores.
- The host dashboard is the control center for running the game and updating the game state in real time.

### 3. Team Display

- Team members can **join a session** using the session ID provided by the host.
![join-team](https://github.com/user-attachments/assets/fd5ae385-88b6-42c0-8c94-fa9d8b2f2d2b)
- Players can **press buzzers** when the round is open to answer questions.
![in-game-1](https://github.com/user-attachments/assets/429b85d1-9b52-4056-9688-1a3b638cd40d)
- The team display updates in real time based on the host's actions, showing current questions, scores, and round status.
![in-game-2](https://github.com/user-attachments/assets/85e456f1-5ccf-4e39-a3c0-7206e32dc038)
- Round end condition is met: all answers guessed, 1st team gets 3 strikes and 2nd team guesses 1 correct answer, or 1st team gets 3 strikes and 2nd team gets 1 strike.
![round-end](https://github.com/user-attachments/assets/6ef9d5b5-396f-40e7-876f-88c7fe6daf88)
- Host reveals all answers
![reveal-all](https://github.com/user-attachments/assets/0e57855d-baeb-4b65-9010-ca7f46495b41)

### 4. Specator Mode

- People who want to spectate can **join a session** using the session ID provided by the host.
- Spectators see the Team Display without any controls.

---

This setup allows for interactive, real-time gameplay where the host manages the flow and teams participate live.

This template should help get you started developing with Vue 3 in Vite.

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

---

## Heroku Deployment (Backend)

1. [Sign up for Heroku](https://heroku.com/) and install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).
2. Create a new Heroku app:
   ```sh
   heroku create your-app-name
   ```
3. Set your environment variables on Heroku:
   ```sh
   heroku config:set FIREBASE_CREDENTIALS='{"type":"service_account",...}'
   ```
4. Push your backend code to Heroku:
   ```sh
   git push heroku main
   ```
5. Your backend will be deployed and accessible at `https://your-app-name.herokuapp.com`.

---

## Environment Variables

- `FIREBASE_CREDENTIALS`: Your Firebase service account JSON (as a single line).
- Any other variables required by your app (e.g., API keys).

---

**See each platform’s documentation for more details and troubleshooting.**

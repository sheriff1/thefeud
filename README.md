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

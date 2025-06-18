# The Feud

## Game Overview

**The Feud** is a multiplayer game

![Screenshot 2025-06-18 at 11-38-04 The Feud](https://github.com/user-attachments/assets/48722220-b00a-49b5-8aad-58e776b374f5)
![Screenshot 2025-06-18 at 11-38-16 The Feud](https://github.com/user-attachments/assets/34953557-7a9d-4460-8f39-7e2ff5ebdc45)
![Screenshot 2025-06-18 at 11-38-32 The Feud](https://github.com/user-attachments/assets/fc338287-c53c-4a39-99f8-3e442caf010e)
![Screenshot 2025-06-18 at 11-38-40 The Feud](https://github.com/user-attachments/assets/6b11b6a6-8eda-4b38-9ae3-b164df83a250)
![Screenshot 2025-06-18 at 11-40-04 The Feud](https://github.com/user-attachments/assets/c25af6d9-9188-45f9-aa07-d877204282c3)
![Screenshot 2025-06-18 at 11-40-12 The Feud](https://github.com/user-attachments/assets/480d00cd-b930-4f27-9996-57fae574fb09)
![Screenshot 2025-06-18 at 11-40-19 The Feud](https://github.com/user-attachments/assets/61fc7340-8b66-4544-82e9-dcd5f0472e07)
![Screenshot 2025-06-18 at 11-40-37 The Feud](https://github.com/user-attachments/assets/03a1ff4a-97cf-4226-8eb9-0c159e60fe4e)
![Screenshot 2025-06-18 at 11-40-54 The Feud](https://github.com/user-attachments/assets/9ca07611-937d-4018-b983-350c95c435a0)
![Screenshot 2025-06-18 at 11-41-05 The Feud](https://github.com/user-attachments/assets/eae58454-fb88-407e-94e8-0625fef8d342)
![Screenshot 2025-06-18 at 11-41-20 The Feud](https://github.com/user-attachments/assets/30be5eca-11e3-42ba-9e3d-04862eb53969)
![Screenshot 2025-06-18 at 11-41-26 The Feud](https://github.com/user-attachments/assets/8b5d4af3-6b25-4baa-a2c4-d1789c5b1ac9)
![Screenshot 2025-06-18 at 11-41-31 The Feud](https://github.com/user-attachments/assets/8068a24f-3993-4335-945e-35c40710338f)
![Screenshot 2025-06-18 at 11-41-57 The Feud](https://github.com/user-attachments/assets/5869184a-011d-4baf-91e0-67f24557b361)
![Screenshot 2025-06-18 at 11-42-10 The Feud](https://github.com/user-attachments/assets/bf23068d-db4b-4bb8-8105-dbb7db2902ce)
![Screenshot 2025-06-18 at 11-42-27 The Feud](https://github.com/user-attachments/assets/f7008e45-8585-4a47-baec-9a5796483dae)
![Screenshot 2025-06-18 at 11-42-42 The Feud](https://github.com/user-attachments/assets/ef61af80-9885-44d2-9b1a-b067b0a18425)
![Screenshot 2025-06-18 at 11-42-49 The Feud](https://github.com/user-attachments/assets/f1442bb9-46f3-4c89-930d-a786fd591ec9)
![Screenshot 2025-06-18 at 11-43-00 The Feud](https://github.com/user-attachments/assets/56924cd9-2eee-4312-8f89-2a1b8b4e5be7)

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

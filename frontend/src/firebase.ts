import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';

const configString = import.meta.env.VITE_FIREBASE_CONFIG;
if (!configString) {
  throw new Error('VITE_FIREBASE_CONFIG is not set');
}
const firebaseConfig = JSON.parse(configString);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

if (import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:8089');
  console.log('Connected to Firebase Auth Emulator');
}

export { auth, signInAnonymously, onAuthStateChanged };

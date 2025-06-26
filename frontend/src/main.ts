import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import './assets/global.css';

const app = createApp(App);
const pinia = createPinia();

// Add error handling for app initialization
app.config.errorHandler = (err, vm, info) => {
  console.warn('Vue app error handled:', err, info);
  // Don't throw in test environments
  if (typeof window !== 'undefined' && (window as any).Cypress) {
    return;
  }
};

app.use(pinia);
app.use(router);

// Ensure mounting is completed properly
const mountApp = async () => {
  try {
    app.mount('#app');

    // Set global indicators for Cypress
    if (typeof window !== 'undefined') {
      (window as any).__VUE_APP_MOUNTED__ = true;
      (window as any).__PINIA__ = pinia;
    }
  } catch (error) {
    console.error('Failed to mount Vue app:', error);
    // Retry mounting once after a short delay
    setTimeout(() => {
      try {
        app.mount('#app');
        if (typeof window !== 'undefined') {
          (window as any).__VUE_APP_MOUNTED__ = true;
          (window as any).__PINIA__ = pinia;
        }
      } catch (retryError) {
        console.error('Failed to mount Vue app on retry:', retryError);
      }
    }, 100);
  }
};

mountApp();

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Uncomment the following line to connect to the Firestore emulator
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  // console.log('Using Firestore emulator!');
}

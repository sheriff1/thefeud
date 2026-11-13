import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import './assets/global.css';
import { initMonitoring, setSessionTag } from './utils/monitoring';
import { initAnalytics } from './utils/analytics';
import { useGameStore } from './stores/gamestore';
import { watch } from 'vue';

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

// Error monitoring (#27): no-op unless VITE_SENTRY_DSN was set at build time. Runs after the
// errorHandler above so Sentry wraps it (the handler still runs).
const monitoringOn = initMonitoring(app, router, {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  release: import.meta.env.VITE_APP_RELEASE,
  isTestRun: typeof window !== 'undefined' && !!(window as any).Cypress,
});
if (monitoringOn) {
  const gameStore = useGameStore(pinia);
  watch(
    () => gameStore.sessionId,
    (id) => setSessionTag(id),
    { immediate: true },
  );
}

// Product analytics (#25): production build only, never under Cypress, production host only.
initAnalytics({
  isProd: import.meta.env.PROD,
  isTestRun: typeof window !== 'undefined' && !!(window as any).Cypress,
});

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

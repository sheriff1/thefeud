import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import './assets/global.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount('#app');

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Uncomment the following line to connect to the Firestore emulator
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('Using Firestore emulator!');
}

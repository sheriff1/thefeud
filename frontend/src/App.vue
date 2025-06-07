<template>
  <div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// Example: in main.ts or App.vue setup
import { auth, signInAnonymously, onAuthStateChanged } from './firebase';

console.log('About to call signInAnonymously');
console.log('VITE_FIREBASE_CONFIG:', import.meta.env.VITE_FIREBASE_CONFIG);
console.log('import.meta.env.MODE:', import.meta.env.MODE);
signInAnonymously(auth)
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch((error) => {
    console.error('Anonymous sign-in failed:', error);
  });
console.log('signInAnonymously() promise created');

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in anonymously
    console.log('User ID:', user.uid);
  }
});
</script>

<style>
/* Optional: some base styling */
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>

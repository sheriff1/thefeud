<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <p class="btn btn-ghost text-base-content !text-base-content">The Feud</p>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1">
        <li><a class="text-base-content !text-base-content">How To Play</a></li>
        <li>
          <a
            href="https://github.com/sheriff1/thefeud"
            target="_blank"
            class="text-base-content !text-base-content"
            >About</a
          >
        </li>
        <li><a @click="logout" class="text-base-content !text-base-content">Log Out</a></li>
      </ul>
    </div>
  </div>
  <router-view />
</template>

<script setup lang="ts">
import { auth, signInAnonymously } from './firebase';
import { useRouter } from 'vue-router';
import { useGameStore } from './stores/gamestore'; // adjust path if needed
const router = useRouter();

const store = useGameStore();
signInAnonymously(auth);

const logout = () => {
  store.enteredFromHome = false;
  store.sessionId = '';
  localStorage.removeItem('enteredFromHome');
  localStorage.removeItem('sessionId');
  router.push({ name: 'Home' });
};
</script>

<style>
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>

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
            class="text-base-content !text-base-content flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482
                0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608
                1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951
                0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004
                1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688
                0 3.847-2.339 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.579.688.481C19.138
                20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"
              />
            </svg>
            About</a
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
  store.resetGame();
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

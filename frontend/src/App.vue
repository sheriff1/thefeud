<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <a href="/" class="btn btn-ghost text-base-content !text-base-content">The Feud</a>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1 flex-row items-center">
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
        <li v-if="store.sessionId">
          <a @click="logout" class="text-base-content !text-base-content">Log Out</a>
        </li>
        <li>
          <label class="flex cursor-pointer gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
              />
            </svg>
            <input
              type="checkbox"
              class="toggle toggle-xs theme-controller"
              :checked="theme === 'dark'"
              @change="theme = theme === 'dark' ? 'light' : 'dark'"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </label>
        </li>
      </ul>
    </div>
  </div>
  <div
    v-if="store.isLoading"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
  >
    <span class="loading loading-spinner loading-lg text-primary"></span>
  </div>
  <router-view />
</template>

<script setup lang="ts">
import { auth, signInAnonymously } from './firebase';
import { useRouter } from 'vue-router';
import { useGameStore } from './stores/gamestore'; // adjust path if needed
import socket from './utils/socket';
import { ref, watch, onMounted } from 'vue';

const theme = ref('light');
const router = useRouter();
const store = useGameStore();
signInAnonymously(auth);

const logout = () => {
  // Get the player's name and team from localStorage or store
  const playerName = localStorage.getItem('playerName');
  const playerTeam = localStorage.getItem('playerTeam') as 'A' | 'B';

  // Remove from Pinia store
  if (playerName && playerTeam) {
    store.removeTeamMember(playerTeam, playerName);

    // Emit to backend to remove from session data
    socket.emit('remove-team-member', {
      sessionId: store.sessionId,
      team: playerTeam,
      name: playerName,
    });
  }
  socket.removeAllListeners();
  socket.disconnect();

  localStorage.removeItem('enteredFromHome');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('playerName');
  localStorage.removeItem('playerTeam');
  // Clear session data
  store.$reset();

  router.push({ name: 'HomeAlias' }).then(() => {
    window.location.reload();
  });
};

onMounted(() => {
  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme;
  } else {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.value = prefersDark ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme.value);
});

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
</script>

<style>
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>

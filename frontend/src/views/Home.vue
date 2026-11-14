<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div
      v-if="showSessionGoneNotice"
      role="alert"
      class="alert alert-warning fixed top-4 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-md"
      data-cy="session-gone-notice"
    >
      <span>
        That session no longer exists, or the link is wrong. Check the Session ID or start a new
        game.
      </span>
      <button class="btn btn-sm btn-ghost" data-cy="session-gone-dismiss" @click="dismissNotice">
        Dismiss
      </button>
    </div>
    <div class="flex flex-col md:flex-row gap-8 md:gap-12 w-full max-w-4xl p-4 md:p-8">
      <!-- Left: Welcome Section -->
      <div
        class="flex-1 bg-base-300 text-base-content rounded-xl shadow-lg p-8 flex flex-col justify-center mb-6 md:mb-0"
      >
        <h1 class="text-4xl font-bold mb-4">Welcome to The Feud!</h1>
        <p class="text-lg">Select an option to get started:</p>
      </div>
      <!-- Right: Actions Section -->
      <div
        class="flex-1 bg-base-300 text-base-content rounded-xl shadow-lg p-8 flex flex-col justify-center"
      >
        <button class="btn btn-primary mb-4" @click="createSession">Create a New Session</button>
        <div class="divider">OR</div>
        <div class="flex flex-col gap-2">
          <div class="flex flex-col">
            <input
              type="text"
              v-model="sessionId"
              class="input validator input-bordered w-full"
              placeholder="Enter Session ID"
              required
              minlength="4"
              maxlength="4"
            />
            <div class="validator-hint text-xs hidden left-align">Session ID invalid</div>
          </div>
          <button class="btn btn-accent" @click="joinAsHost">Join as Host</button>
          <button class="btn btn-secondary" @click="joinAsTeam">Join as a Team Member</button>
          <button class="btn btn-info" @click="joinAsSpectator">Join as Spectator</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'; // Import ref from Vue
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gamestore';
import { requestNewSessionId } from '../api/session';
import { track } from '../utils/analytics';
import { SESSION_GONE_NOTICE } from '../utils/sessionGone';

const store = useGameStore();

const apiBase = import.meta.env.VITE_API_BASE || '';
const router = useRouter();
const route = useRoute();

// Shown once after being sent home from a session that no longer exists (#113).
const showSessionGoneNotice = ref(false);
const dismissNotice = () => (showSessionGoneNotice.value = false);
onMounted(() => {
  if (route.query.notice === SESSION_GONE_NOTICE) {
    showSessionGoneNotice.value = true;
    router.replace({ path: route.path, query: {} });
  }
});
const sessionId = ref(''); // Define sessionId as a reactive variable

// Create a new session (the backend picks a unique ID) and navigate to the Host Dashboard
const createSession = async () => {
  const newSessionId = await requestNewSessionId(apiBase);
  if (!newSessionId) return;
  track('session_created');
  store.enteredFromHome = true;
  store.sessionId = newSessionId;
  localStorage.setItem('enteredFromHome', 'true');
  localStorage.setItem('sessionId', store.sessionId);
  router.push(`/host?sessionId=${newSessionId}`);
};

// Join an existing session as Host
const joinAsHost = async () => {
  const id = sessionId.value.trim().toUpperCase();
  if (!isValidSessionId(id)) {
    alert('Invalid Session ID format.');
    return;
  }
  if (!sessionId.value.trim()) {
    alert('Please enter a valid Session ID.');
    return;
  }
  // Always use uppercase for backend check
  const response = await fetch(`${apiBase}/api/session-exists/${id}`);
  const data = await response.json();
  if (data.exists) {
    store.enteredFromHome = true;
    store.sessionId = id;
    localStorage.setItem('enteredFromHome', 'true');
    localStorage.setItem('sessionId', sessionId.value);
    router.push(`/host?sessionId=${id}`);
  } else {
    alert('Session does not exist. Please check the Session ID.');
  }
};

// Join an existing session as Team
const joinAsTeam = async () => {
  const id = sessionId.value.trim().toUpperCase();
  if (!isValidSessionId(id)) {
    alert('Invalid Session ID format.');
    return;
  }
  if (!sessionId.value.trim()) {
    alert('Please enter a valid Session ID.');
    return;
  }
  // Always use uppercase for backend check
  const response = await fetch(`${apiBase}/api/session-exists/${id}`);
  const data = await response.json();
  if (data.exists) {
    store.enteredFromHome = true;
    store.sessionId = id;
    localStorage.setItem('enteredFromHome', 'true');
    localStorage.setItem('sessionId', id);
    router.push(`/team?sessionId=${id}`);
  } else {
    alert('Session does not exist. Please check the Session ID.');
  }
};

const joinAsSpectator = async () => {
  const id = sessionId.value.trim().toUpperCase();
  if (!isValidSessionId(id)) {
    alert('Invalid Session ID format.');
    return;
  }
  if (!sessionId.value.trim()) {
    alert('Please enter a valid Session ID.');
    return;
  }
  // Always use uppercase for backend check
  const response = await fetch(`${apiBase}/api/session-exists/${id}`);
  const data = await response.json();
  if (data.exists) {
    store.enteredFromHome = true;
    store.sessionId = id;
    localStorage.setItem('enteredFromHome', 'true');
    localStorage.setItem('sessionId', sessionId.value);
    track('spectator_joined');
    router.push(`/spectator?sessionId=${id}`);
  } else {
    alert('Session does not exist. Please check the Session ID.');
  }
};

function isValidSessionId(id: string) {
  // Example: Only allow 4-8 uppercase alphanumeric characters
  return /^[A-Z0-9]{4,8}$/.test(id);
}
</script>

<style></style>

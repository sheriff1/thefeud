<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
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
          <input
            v-model="sessionId"
            type="text"
            class="input input-bordered mb-2 w-full"
            placeholder="Enter Session ID"
          />
          <button class="btn btn-accent" @click="joinAsHost">Join as Host</button>
          <button class="btn btn-secondary" @click="joinAsTeam">Join as a Team Member</button>
          <button class="btn btn-info" @click="joinAsSpectator">Join as Spectator</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'; // Import ref from Vue
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gamestore';

const store = useGameStore();

const apiBase = import.meta.env.VITE_API_BASE || '';
const router = useRouter();
const sessionId = ref(''); // Define sessionId as a reactive variable

// Generate a short ID
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase(); // Generates a 4-character string
};

// Create a new session and navigate to the Host Dashboard
const createSession = async () => {
  const newSessionId = generateShortId(); // Generate a short session ID
  await fetch(`${apiBase}/api/create-session/${newSessionId}`, {
    method: 'POST',
  });
  store.enteredFromHome = true;
  store.sessionId = newSessionId;
  localStorage.setItem('enteredFromHome', 'true');
  localStorage.setItem('sessionId', sessionId.value);
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

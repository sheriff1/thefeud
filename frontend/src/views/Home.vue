<template>
    <div class="home-container">
      <h1>Welcome to The Feud!</h1>
      <p>Select an option to get started:</p>
  
      <div class="actions">
        <!-- Create a new session -->
        <button @click="createSession">Create a New Session</button>
  
        <!-- Join an existing session -->
        <div class="join-session">
          <input
            v-model="sessionId"
            type="text"
            placeholder="Enter Session ID"
          />
          <button @click="joinAsHost">Join as Host</button>
          <button @click="joinAsTeam">Join as a Team Member</button>
        </div>
      </div>
    </div>
</template>

<script>
import { ref } from 'vue'; // Import ref from Vue
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid'; // For generating unique session IDs

export default {
  name: 'Home',
  setup() {
    const router = useRouter();
    const sessionId = ref(''); // Define sessionId as a reactive variable

    // Generate a short ID
    const generateShortId = () => {
      return Math.random().toString(36).substring(2, 6).toUpperCase(); // Generates a 4-character string
    };

    // Create a new session and navigate to the Host Dashboard
    const createSession = () => {
      const newSessionId = generateShortId(); // Generate a short session ID
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
      const response = await fetch(
        `/api/session-exists/${id}`
      );
      const data = await response.json();
      if (data.exists) {
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
      const response = await fetch(
        `/api/session-exists/${id}`
      );
      const data = await response.json();
      if (data.exists) {
        router.push(`/team?sessionId=${id}`);
      } else {
        alert('Session does not exist. Please check the Session ID.');
      }
    };

    function isValidSessionId(id) {
      // Example: Only allow 4-8 uppercase alphanumeric characters
      return /^[A-Z0-9]{4,8}$/.test(id);
    }

    return {
      sessionId,
      createSession,
      joinAsHost,
      joinAsTeam,
    };
  },
};
</script>

<style>
.home-container {
  text-align: center;
  margin-top: 50px;
}

.actions {
  margin-top: 20px;
}

.join-session {
  margin-top: 10px;
}

input {
  padding: 8px;
  margin-right: 5px;
}

button {
  padding: 10px 15px;
  margin: 5px;
  cursor: pointer;
}
</style>
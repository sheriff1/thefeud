<template>
  <!-- Join Team Dialog -->
  <div v-if="!isSpectator && !hasJoined">
    <div class="join-team-dialog-backdrop">
      <div class="join-team-dialog">
        <h2>Join the Game</h2>
        <h3 class="left-align">Enter your name:</h3>
        <input
          v-model="playerName"
          placeholder="Enter your name"
          class="full-width-input"
        />
        <hr class="dialog-divider" />
        <h3 class="left-align">Select your team:</h3>
        <div class="radio-group">
          <label
            v-for="team in ['A', 'B']"
            :key="team"
            :class="['radio-option', { selected: selectedTeam === team }]"
          >
            <input type="radio" :value="team" v-model="selectedTeam" />
            {{ store.teamNames[team] || team }}
          </label>
        </div>
        <button @click="joinTeam" :disabled="!playerName || !selectedTeam">
          Join
        </button>
      </div>
    </div>
  </div>

  <!-- Main Gameboard -->
  <div v-else>
    <div class="floating-buttons">
      <button
        class="session-id-box"
        :class="sessionIdBoxState"
        @click="copySessionId"
      >
        {{ sessionIdBoxText }}
      </button>
      <button
        class="mute-btn"
        :class="{ muted: isMuted }"
        @click="toggleMute"
        :aria-pressed="isMuted"
      >
        {{ isMuted ? "🔇 Sound Off" : "🔊 Sound On" }}
      </button>
    </div>

    <div class="gameboard-container">
      <!-- Round Over Message -->
      <div v-if="store.roundOver" class="round-over-message">
        <h4>Round Over:</h4>
        <p v-if="store.winningTeam && store.pointsAwarded > 0">
          {{ store.teamNames[store.winningTeam] }} wins this round. They scored
          {{ store.pointsAwarded }} points!
        </p>
        <p v-else>No points were awarded this round.</p>
      </div>

      <!-- Scoreboard Section -->
      <div class="scoreboard">
        <!-- Team A Info -->
        <TeamPanel
          team="A"
          :teamName="store.teamNames['A']"
          :score="store.teamScores['A']"
          :members="teamMembers['A']"
          :strikes="store.teamStrikes['A']"
          :strikeCount="store.firstTeam === 'A' ? 3 : 1"
          :buzzedPlayer="buzzedPlayer"
          :active="store.currentTeam === 'A'"
          :editing="editingTeam === 'A'"
          :isWinning="store.teamScores['A'] > store.teamScores[otherTeam('A')]"
          :showBuzzer="
            isMultiplierSet && selectedTeam === 'A' && !store.startingTeamSet
          "
          :buzzerDisabled="isBuzzerDisabled"
          :initialEditedName="editedTeamName"
          @edit-team="startEditingTeamName"
          @save-team="({ team, name }) => saveTeamName(team, name)"
          @buzz="pressBuzzer"
        />

        <!-- Answers & Game Info Section -->
        <div class="center-info">
          <!-- Answers Section -->
          <div v-if="store.answers.length > 0" class="answers-container">
            <!-- Question Display -->
            <transition name="fade-x">
              <div v-if="showStrikeX" class="strike-x-overlay">
                <span class="strike-x">X</span>
              </div>
            </transition>

            <div class="question-display">
              <h3>{{ store.question }}</h3>
            </div>

            <!-- Answers Grid -->
            <div class="answers-grid">
              <div
                v-for="(answer, index) in store.answers"
                :key="answer.id"
                class="answer-box"
              >
                <!-- Hidden Answer (Blue Box) -->
                <div
                  v-if="!store.guessedAnswers.includes(answer.id)"
                  class="blue-box"
                >
                  <span class="answer-number-circle">{{ index + 1 }}</span>
                </div>

                <!-- Revealed Answer with Flip Animation -->
                <div v-else class="revealed-answer flip-animation">
                  <span class="answer-text">{{
                    answer.text.toUpperCase()
                  }}</span>
                  <span class="answer-points-box">{{ answer.points }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="no-answers-message">No answers available yet.</p>

          <!-- Game Info Container -->
          <div class="game-info-container">
            <!-- Round Counter -->
            <div class="game-info-item">
              <div class="game-info-value">{{ store.roundCounter }}</div>
              <div class="game-info-label">Round</div>
            </div>
            <!-- Timer Display -->
            <div class="game-info-item">
              <div class="game-info-value">{{ store.timer }}</div>
              <div class="game-info-label">Time Remaining</div>
            </div>
            <!-- Points Pool -->
            <div class="game-info-item">
              <div class="game-info-value">{{ store.pointPool }}</div>
              <div class="game-info-label">Points Pool</div>
            </div>
            <!-- Score Multiplier -->
            <div class="game-info-item">
              <div class="game-info-value">x{{ store.scoreMultiplier }}</div>
              <div class="game-info-label">Score Multiplier</div>
            </div>
          </div>
        </div>

        <!-- Team B Info -->
        <TeamPanel
          team="B"
          :teamName="store.teamNames['B']"
          :score="store.teamScores['B']"
          :members="teamMembers['B']"
          :strikes="store.teamStrikes['B']"
          :strikeCount="store.firstTeam === 'B' ? 3 : 1"
          :buzzedPlayer="buzzedPlayer"
          :active="store.currentTeam === 'B'"
          :editing="editingTeam === 'B'"
          :isWinning="store.teamScores['B'] > store.teamScores[otherTeam('B')]"
          :showBuzzer="
            isMultiplierSet && selectedTeam === 'B' && !store.startingTeamSet
          "
          :buzzerDisabled="isBuzzerDisabled"
          :initialEditedName="editedTeamName"
          @edit-team="startEditingTeamName"
          @save-team="({ team, name }) => saveTeamName(team, name)"
          @buzz="pressBuzzer"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useGameStore } from "@/stores/gamestore";
import { io } from "socket.io-client";
import socket from "../utils/socket";
import TeamPanel from "@/components/teamDisplay/TeamPanel.vue";

defineProps({
  isSpectator: {
    type: Boolean,
    default: false,
  },
});

const store = useGameStore();
const sessionId = new URLSearchParams(window.location.search).get("sessionId"); // Get sessionId from URL query params
const sessionIdBoxText = ref(`Session ID: ${sessionId}`); // Default text
const sessionIdBoxState = ref(""); // Default state (no additional class)
const playerName = ref("");
const selectedTeam = ref("");
const hasJoined = ref(false);
const hasBuzzed = ref(false);
const buzzedPlayer = ref(""); // Name of the player who buzzed first
const isBuzzerDisabled = computed(
  () => hasBuzzed.value || !!buzzedPlayer.value
);
const isMultiplierSet = computed(() => !!store.scoreMultiplier);
const editingTeam = ref(null); // 'A' or 'B' or null
const editedTeamName = ref("");
const isMuted = ref(false); // Mute state

function toggleMute() {
  isMuted.value = !isMuted.value;
}

// Store team members locally for display
const teamMembers = ref({ A: [], B: [] });

// Helper function to get the other team
const otherTeam = (team) => (team === "A" ? "B" : "A");
const showStrikeX = ref(false);

// Function to play the "ding" sound
const playDingSound = () => {
  if (isMuted.value) return;
  const audio = new Audio("/sounds/ding.mp3"); // Path to the "ding" sound file
  audio.play();
};

const playBuzzerSound = () => {
  if (isMuted.value) return;
  const audio = new Audio("/sounds/buzzer.mp3");
  audio.play();
};

const playStrikeSound = () => {
  // Show the X
  showStrikeX.value = true;
  setTimeout(() => {
    showStrikeX.value = false;
  }, 1200); // Show for 1.2 seconds
  if (isMuted.value) {
    return;
  } else {
    const audio = new Audio("/sounds/strike.mp3");
    audio.play();
  }
};

const playRoundOverSound = () => {
  if (isMuted.value) return;
  const audio = new Audio("/sounds/round-over.mp3");
  audio.play();
};

const playNextRoundSound = () => {
  if (isMuted.value) return;
  const audio = new Audio("/sounds/next-round.mp3");
  audio.play();
};

const joinTeam = () => {
  if (!playerName.value.trim() || !selectedTeam.value) return;
  socket.emit("join-team", {
    sessionId,
    name: playerName.value.trim(),
    team: selectedTeam.value,
  });
  hasJoined.value = true;
};

const pressBuzzer = () => {
  if (!hasBuzzed.value) {
    socket.emit("buzz", { sessionId, name: playerName.value });
    hasBuzzed.value = true;
  }
};

const startEditingTeamName = (team) => {
  editingTeam.value = team;
  editedTeamName.value = store.teamNames[team] || "";
};

function saveTeamName(team, name) {
  if (name && name.trim()) {
    socket.emit("update-team-name", {
      sessionId,
      team,
      name: name.trim(),
    });
    editingTeam.value = null;
  }
}

socket.on("play-strike-sound", () => {
  playStrikeSound();
});

socket.on("team-names-updated", (teamNames) => {
  store.teamNames = { ...store.teamNames, ...teamNames };
});

// Watch for changes in guessed answers
watch(
  () => store.guessedAnswers,
  (newGuessedAnswers, oldGuessedAnswers) => {
    if (newGuessedAnswers.length > oldGuessedAnswers.length) {
      playDingSound(); // Play sound when a new answer is guessed
    }
  }
);

// Watch for changes in team strikes
watch(
  () => store.teamStrikes,
  (newStrikes, oldStrikes) => {
    if (
      newStrikes.A > oldStrikes.A || // Check if Team A got a new strike
      newStrikes.B > oldStrikes.B // Check if Team B got a new strike
    ) {
      playStrikeSound(); // Play sound when a strike is given
    }
  },
  { deep: true } // Watch for deep changes in the teamStrikes object
);

// Join a session and listen for updates
onMounted(() => {
  if (!sessionId) {
    alert("No session ID provided. Please join a valid session.");
    return;
  }

  // Join the session
  socket.emit("join-session", { sessionId });

  // Request the current game state from the backend
  socket.emit("get-current-state", { sessionId });

  socket.on("buzzed", ({ name }) => {
    buzzedPlayer.value = name;
    playBuzzerSound(); // <-- Make sure this is here!
  });

  // Listen for the current game state from the backend
  socket.on("current-state", (currentState) => {
    console.log("Current game state received:", currentState);
    Object.assign(store.$state, currentState);
    buzzedPlayer.value = currentState?.buzzedPlayer || "";
  });

  // Listen for game state updates
  socket.on("game-updated", (newState) => {
    store.teamNames = { ...store.teamNames, ...newState.teamNames };
    Object.assign(store.$state, newState);
    buzzedPlayer.value = newState?.buzzedPlayer || "";
    hasBuzzed.value = false;
  });

  // Listen for the "play-strike-sound" event from the backend
  socket.on("play-strike-sound", () => {
    console.log("play-strike-sound event received");
    playStrikeSound();
  });

  socket.on("team-members-updated", (members) => {
    teamMembers.value = members;
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
    alert("Failed to connect to the game session. Please try again.");
  });

  socket.on("round-over", () => {
    playRoundOverSound();
  });
  socket.on("next-round", () => {
    console.log("next-round event received");
    playNextRoundSound();
  });
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  socket.removeAllListeners();
});

const copySessionId = () => {
  if (sessionId) {
    navigator.clipboard
      .writeText(sessionId)
      .then(() => {
        // Show "Copied" and turn the box green
        sessionIdBoxText.value = "Copied!";
        sessionIdBoxState.value = "copied";

        // Revert back to the original state after 2 seconds
        setTimeout(() => {
          sessionIdBoxText.value = `Session ID: ${sessionId}`;
          sessionIdBoxState.value = "";
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy session ID:", err);

        // Show "Error" and turn the box red
        sessionIdBoxText.value = "Error";
        sessionIdBoxState.value = "error";

        // Revert back to the original state after 2 seconds
        setTimeout(() => {
          sessionIdBoxText.value = `Session ID: ${sessionId}`;
          sessionIdBoxState.value = "";
        }, 2000);
      });
  }
};

// After setting roundOver to true
socket.emit("round-over", { sessionId });
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap");
/* Root Container Styles */
.gameboard-container {
  padding: 4rem; /* Add padding around the perimeter */
}

/* Scoreboard Styles */
.scoreboard {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 1rem; /* 1rem gap between all 3 sections */
  margin-bottom: 16px;
}

.divider {
  width: 2px;
  height: 100%;
  background-color: #ccc;
  margin-right: 8px;
}
/* Game Info Container Styles */
.game-info-container {
  display: flex; /* Use flexbox for horizontal layout */
  justify-content: space-around; /* Space out the items evenly */
  align-items: center; /* Align items vertically in the center */
  margin-top: 16px;
  padding: 16px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* Game Info Item Styles */
.game-info-item {
  display: flex;
  flex-direction: column; /* Stack value and label vertically */
  align-items: center; /* Center align the content */
  margin: 0 16px; /* Add horizontal spacing between items */
}

.game-info-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

hr {
  display: none; /* Remove horizontal lines since items are now horizontal */
}

/* Timer Display Styles */
.timer-display {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: bold;
}

/* Round Counter Styles */
.round-counter {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: bold;
}

/* Round Over Message Styles */
.round-over-message {
  position: relative; /* Ensure it stays in the flow of the page */
  width: 100%; /* Full width of the container */
  text-align: center;
  padding: 8px; /* Reduce padding for a more compact banner */
  background-color: #ccffcc; /* Light red background for visibility */
  color: #007525; /* Dark red text for contrast */
  font-size: 1rem; /* Smaller font size for the banner */
  font-weight: bold;
  border-bottom: 2px solid #007525; /* Add a border to emphasize the banner */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add a subtle shadow for depth */
  margin-bottom: 16px; /* Add spacing below the banner */
  white-space: nowrap; /* Ensure the text stays on one line */
  overflow: hidden; /* Prevent overflow if the text is too long */
  text-overflow: ellipsis; /* Add ellipsis if the text overflows */
}

.round-over-message h4,
.round-over-message p {
  display: inline; /* Ensure all text is inline */
  margin: 0; /* Remove default margins */
  font-size: inherit; /* Use the same font size as the parent */
}

/* Points Pool Styles */
.points-pool {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: bold;
}

/* Score Multiplier Styles */
.score-multiplier {
  font-size: 16px;
  font-weight: bold;
}

/* Strikes Styles */
.strikes {
  color: red;
  font-weight: bold;
  font-size: 1.5rem;
  letter-spacing: 4px;
}

/* Team Display Styles */
.team-display {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* Answers Section Styles */
.answers-container {
  width: 90%;
  display: flex;
  flex-direction: column; /* Stack the question and answers vertically */
  gap: 16px; /* Space between the question and the answers grid */
  margin-top: 16px;
  padding: 16px;
  background-color: #e0f3ff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Question Display Styles */
.question-display {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

/* Answers Grid Styles */
.answers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, auto); /* 4 rows to force 4 items per column */
  grid-auto-flow: column;
  gap: 1rem;
}

/* Answer Box Styles */
.answer-box {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.answer-box:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Blue Box for Hidden Answers */
.blue-box {
  width: 100%;
  height: 100%;
  background-color: #007bff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.answer-number-circle {
  width: 40px;
  height: 40px;
  background-color: white;
  color: #007bff;
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Revealed Answer Styles */
.revealed-answer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  background-color: #003f83;
  color: white;
  border-radius: 8px;
  padding-left: 12px;
  font-size: 2rem;
  font-weight: bold;
  text-align: left;
  font-family: "Bebas Neue", Arial, sans-serif;
  overflow: hidden;
}

/* Flip Animation */
.flip-animation {
  animation: flipIn 0.6s ease-in-out;
}

.answer-text {
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(1rem, 2.5vw, 2.2rem); /* Responsive font size */
  font-family: "Bebas Neue", Arial, sans-serif;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
}

.answer-points-box {
  background-color: #007bff;
  color: white;
  border-left: 4px solid #fff;
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  min-width: 40px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 8px 8px 0;
  margin-left: 12px;
  padding: 0 16px;
  height: 100%;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

/* No Answers Message Styles */
.no-answers-message {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 16px;
}

/* Keyframe Animation for Vertical Flip */
@keyframes flipIn {
  0% {
    transform: rotateX(90deg);
    opacity: 0;
  }
  50% {
    transform: rotateX(-10deg);
    opacity: 0.5;
  }
  100% {
    transform: rotateX(0deg);
    opacity: 1;
  }
}

.session-id-box {
  bottom: 16px;
  right: 16px;
  background-color: black;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  opacity: 0.7; /* Default opacity */
  transition: opacity 0.3s ease, background-color 0.3s ease; /* Smooth transition for hover and color changes */
  border: none;
  cursor: pointer; /* Make it clear that it's clickable */
}

.session-id-box:hover {
  opacity: 1; /* Fully opaque on hover */
}

.session-id-box.copied {
  background-color: green; /* Green for success */
  color: white;
}

.session-id-box.error {
  background-color: red; /* Red for error */
  color: white;
}

.strike-x-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.strike-x {
  font-size: 10vw;
  color: #e53935;
  font-weight: bold;
  text-shadow: 0 0 30px #e53935, 0 0 10px #fff;
  border: 8px solid #e53935;
  border-radius: 16px;
  padding: 2vw 4vw;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 40px #e53935;
}

.fade-x-enter-active,
.fade-x-leave-active {
  transition: opacity 0.5s;
}
.fade-x-enter-from,
.fade-x-leave-to {
  opacity: 0;
}
.fade-x-enter-to,
.fade-x-leave-from {
  opacity: 1;
}

.join-team-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-team-dialog {
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.join-team-dialog input[type="text"] {
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.join-team-dialog label {
  margin-right: 1rem;
  font-size: 1rem;
}

.join-team-dialog button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  background: #007bff;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.join-team-dialog button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.full-width-input {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.left-align {
  width: 100%;
  text-align: left;
  margin-bottom: 0.5rem;
}

.dialog-divider {
  width: 100%;
  border: none;
  border-top: 1px solid #ddd;
  margin: 1rem 0;
}

.radio-group {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 2px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  background: #f9f9f9;
  transition: border-color 0.2s, background 0.2s;
  font-size: 1rem;
}

.radio-option.selected {
  border-color: #007bff;
  background: #e6f0ff;
}

.radio-option input[type="radio"] {
  margin-right: 0.5rem;
}

.floating-buttons {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 1000;
}

.mute-btn {
  background-color: black;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  opacity: 0.7;
  transition: opacity 0.3s ease, background-color 0.3s ease;
  border: none;
  cursor: pointer;
}

.mute-btn:hover {
  opacity: 1;
}

.mute-btn.muted {
  background-color: gray;
}

.center-info {
  width: 50vw; /* 50% of viewport width */
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

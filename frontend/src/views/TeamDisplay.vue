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
      <FloatingButton
        :label="sessionIdBoxText"
        :onClick="copySessionId"
        className="session-id-box"
        :state="sessionIdBoxState"
      />
      <FloatingButton
        :label="isMuted ? '🔇 Sound Off' : '🔊 Sound On'"
        :onClick="toggleMute"
        className="mute-btn"
        :state="isMuted ? 'muted' : ''"
        :ariaPressed="isMuted"
      />
    </div>

    <div class="gameboard-container">
      <!-- Round Over Banner -->
      <Banner
        v-if="store.roundOver"
        :heading="`Round ${store.roundCounter} Over! `"
        :paragraph="
          store.winningTeam
            ? `${
                store.teamNames[store.winningTeam]
              } wins this round! They scored ${store.pointsAwarded} points!`
            : 'No points were awarded this round.'
        "
      />

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
          <AnswersBoard
            :answers="store.answers"
            :question="store.question"
            :guessedAnswers="store.guessedAnswers"
            :showStrikeX="showStrikeX"
            @strikeX="showStrikeX = false"
          />

          <!-- Game Info Container -->
          <GameInfo
            :roundCounter="store.roundCounter"
            :timer="store.timer"
            :pointPool="store.pointPool"
            :scoreMultiplier="store.scoreMultiplier"
          />
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
import AnswersBoard from "@/components/teamDisplay/AnswersBoard.vue";
import GameInfo from "@/components/teamDisplay/GameInfo.vue";
import FloatingButton from "@/components/teamDisplay/FloatingButton.vue";
import Banner from "@/components/teamDisplay/Banner.vue";

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

hr {
  display: none; /* Remove horizontal lines since items are now horizontal */
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

.center-info {
  width: 50vw; /* 50% of viewport width */
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
</style>

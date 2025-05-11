<template>
  <div class="gameboard-container">
    <!-- Round Over Message -->
    <div v-if="store.roundOver" class="round-over-message">
      <h4>Round Over: </h4>
      <p v-if="store.winningTeam && store.pointsAwarded > 0">
        {{ store.teamNames[store.winningTeam] }} wins this round. 
        They scored {{ store.pointsAwarded }} points!
      </p>
      <p v-else>No points were awarded this round.</p>
    </div>

    <!-- Scoreboard Section -->
    <div class="scoreboard">
      <!-- Team Info -->
      <div
        class="team-info"
        :class="{ active: store.currentTeam === team }"
        v-for="(team, index) in ['A', 'B']"
        :key="team"
      >
        <!-- Team Name and Score -->
        <div class="team-header">
          <span class="team-name">
            <!-- Add crown emoji conditionally -->
            <span v-if="store.teamScores[team] > store.teamScores[otherTeam(team)]">👑</span>
            {{ store.teamNames[team].toUpperCase() }}
          </span>
          <span class="team-score">
            <span class="divider"></span>
            {{ store.teamScores[team] }}
          </span>
        </div>

        <!-- Strikes -->
        <div class="team-strikes">
          <span
            v-for="strike in (store.firstTeam === team ? 3 : 1)"
            :key="team + '-' + strike"
            class="strike-dot"
            :class="{ active: strike <= store.teamStrikes[team] }"
          ></span>
        </div>
        <div class="game-info-label">Strikes</div>
      </div>
    </div>

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

    <!-- Answers Section -->
    <div v-if="store.answers.length > 0" class="answers-container">
      <!-- Question Display -->
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
          <div
            v-else
            class="revealed-answer flip-animation"
          >
            <span class="answer-text">{{ answer.text.toUpperCase() }}</span>
            <span class="answer-points-box">{{ answer.points }}</span>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="no-answers-message">No answers available yet.</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../stores/gamestore';
import { io } from 'socket.io-client';
import socket from '../utils/socket';

const store = useGameStore();

// Helper function to get the other team
const otherTeam = (team) => (team === 'A' ? 'B' : 'A');

// Function to play the "ding" sound
const playDingSound = () => {
  const audio = new Audio('/sounds/ding.mp3'); // Path to the "ding" sound file
  audio.play();
};

// Function to play the "strike" sound
const playStrikeSound = () => {
  const audio = new Audio('/sounds/strike.mp3'); // Path to the "strike" sound file
  audio.play();
};

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
  const sessionId = new URLSearchParams(window.location.search).get('sessionId'); // Get sessionId from URL query params
  if (!sessionId) {
    alert('No session ID provided. Please join a valid session.');
    return;
  }

  // Join the session
  socket.emit('join-session', { sessionId });

  // Request the current game state from the backend
  socket.emit('get-current-state', { sessionId });

  // Listen for the current game state from the backend
  socket.on('current-state', (currentState) => {
    console.log('Current game state received:', currentState);
    Object.assign(store.$state, currentState); // Update the local store with the current game state
  });

  // Listen for game state updates
  socket.on('game-updated', (newState) => {
    console.log('Game state updated:', newState);
    Object.assign(store.$state, newState); // Update the local store with the new game state
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    alert('Failed to connect to the game session. Please try again.');
  });
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  socket.removeAllListeners();
});

</script>

<style scoped>
/* Root Container Styles */
.gameboard-container {
  padding: 4rem; /* Add padding around the perimeter */
}

/* Scoreboard Styles */
.scoreboard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* Team Info Styles */
.team-info {
  text-align: center;
  border: 2px solid #ccc;
  padding: 16px;
  border-radius: 8px;
  width: 40%;
  background-color: #f9f9f9;
  transition: box-shadow 0.3s ease;
}

.team-info.active {
  box-shadow: 0 0 15px 5px rgba(0, 123, 255, 0.7);
  border-color: #007bff;
}

/* Team Header Styles */
.team-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.team-name {
  flex: 1;
  text-align: left;
}

.team-score {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.divider {
  width: 2px;
  height: 100%;
  background-color: #ccc;
  margin-right: 8px;
}

/* Team Strikes Styles */
.team-strikes {
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.strike-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ccc; /* Inactive state */
  transition: background-color 0.3s ease;
}

.strike-dot.active {
  background-color: red; /* Active state */
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

.game-info-label {
  font-size: 0.9rem;
  font-weight: normal;
  color: #555;
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
  display: flex;
  flex-direction: column; /* Stack the question and answers vertically */
  gap: 16px; /* Space between the question and the answers grid */
  margin-top: 16px;
  padding: 16px;
  background-color: #f4f4f4;
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
  padding: 0 12px;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: left;
}

/* Flip Animation */
.flip-animation {
  animation: flipIn 0.6s ease-in-out;
}

.answer-text {
  flex: 1;
  text-transform: uppercase;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.answer-points-box {
  background-color: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 2px solid white;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
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
</style>

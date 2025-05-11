<template>
  <button
    class="session-id-box"
    :class="sessionIdBoxState"
    @click="copySessionId">
    {{ sessionIdBoxText }}
  </button>
  
  <div>
    <!-- Reset Game and Reset Round Container -->
    <div class="container reset-container">
      <h3>Game Controls</h3>
      <button @click="resetGame">Reset Game</button>
      <button @click="resetRound">Reset Round</button>
      <button @click="nextRound">Next Round</button>
      <!-- Set Score Multiplier Section -->
      <div>
        <h4>Set Score Multiplier</h4>
        <p v-if="multiplierSet">Score Multiplier: {{ selectedMultiplier }}x</p>
        <button
          @click="setMultiplier(1)"
          :disabled="multiplierSet"
        >
          1x
        </button>
        <button
          @click="setMultiplier(2)"
          :disabled="multiplierSet"
        >
          2x
        </button>
        <button
          @click="setMultiplier(3)"
          :disabled="multiplierSet"
        >
          3x
        </button>
      </div>

      <!-- Who Starts Section -->
      <div>
        <h4>Who Starts?</h4>
        <p v-if="startingTeamSet">Starting Team: {{ store.teamNames[startingTeam] }}</p>
        <button
          @click="setStartingTeam('A')"
          :disabled="startingTeamSet"
        >
          {{ store.teamNames.A }}
        </button>
        <button
          @click="setStartingTeam('B')"
          :disabled="startingTeamSet"
        >
          {{ store.teamNames.B }}
        </button>
      </div>

    </div>

    <!-- Team Names Section -->
    <div class="team-names-container">
      <h3>Team Names</h3>
      <div>
        <label for="team-a-name">Team A:</label>
        <input
          id="team-a-name"
          type="text"
          v-model="teamAName"
          placeholder="Enter Team A Name"
        />
      </div>
      <div>
        <label for="team-b-name">Team B:</label>
        <input
          id="team-b-name"
          type="text"
          v-model="teamBName"
          placeholder="Enter Team B Name"
        />
      </div>
      <p v-if="!isTeamNamesUnique" class="error-message">
        Team names must be unique.
      </p>
      <button @click="saveTeamNames" :disabled="!isTeamNamesUnique">Save Team Names</button>
    </div>

    <!-- Manage Question and Answers Container -->
    <div class="container question-answers-container">
      <h3>Manage Question and Answers</h3>

      <!-- File Upload -->
      <div>
        <label for="file-upload">Upload CSV File:</label>
        <input id="file-upload" type="file" @change="handleUpload" />

        <!-- Download Template Button -->
        <a
          href="/answers/family-feud-template.csv"
          download
          class="download-template-button"
        >
          Download Template
        </a>
      </div>

      <!-- Question Input -->
      <div>
        <h4>Question</h4>
        <label for="question-input">Question:</label>
        <input
          id="question-input"
          type="text"
          v-model="questionInput"
          :disabled="questionSaved"
        />
      </div>

      <!-- Answers Management -->
      <div>
        <h4>Answers</h4>
        <div
          v-for="(pair, index) in answerPairs"
          :key="index"
          class="answer-pair"
        >
          <label :for="'answer-' + index">Answer:</label>
          <input
            :id="'answer-' + index"
            type="text"
            v-model="pair.text"
            :disabled="answersSaved"
          />
          <label :for="'points-' + index">Points:</label>
          <input
            :id="'points-' + index"
            type="number"
            v-model.number="pair.points"
            :disabled="answersSaved"
          />
          <button
            @click="removeAnswerPair(index)"
            :disabled="answersSaved"
          >
            Remove
          </button>
        </div>
        <button @click="addAnswerPair" :disabled="answersSaved || answerPairs.length >= 8">
          Add Answer
        </button>
        <button @click="removeAllAnswers" :disabled="answersSaved || answerPairs.length === 0">
          Remove All Answers
        </button>
      </div>

      <!-- Save Both Question and Answers -->
      <button
        class="save-button"
        @click="saveQuestionAndAnswers"
        :disabled="questionSaved && answersSaved"
      >
        Save Question and Answers
      </button>
    </div>

    <!-- Available Answers, Strikes, and Points Pool Container -->
    <div class="container game-info-container">
      <h3>Active Game Info</h3>

      <p>Strikes: {{ store.strikes }}</p>
      <p>Points Pool: {{ store.pointPool }}</p>

      <!-- Hide Available Answers and Incorrect Button when the round is over -->
      <template v-if="!store.roundOver">
        <h4>Available Answers</h4>
        <ul>
          <li v-for="answer in store.answers" :key="answer.id">
            <span :style="{ textDecoration: store.guessedAnswers.includes(answer.id) ? 'line-through' : 'none' }">
              {{ answer.text }} ({{ answer.points }} pts)
            </span>
            <!-- Correct Button -->
            <button
              v-if="!store.guessedAnswers.includes(answer.id)"
              @click="handleCorrectGuess(answer.id)"
            >
              Correct
            </button>
          </li>
        </ul>
        <!-- Incorrect Button -->
        <button 
          v-if="answersSaved && startingTeamSet && multiplierSet && !store.roundOver" 
          @click="handleIncorrectGuess"
        >
          Incorrect
        </button>
      </template>

      <!-- Reveal All Answers Button -->
      <button 
        v-if="store.roundOver" 
        @click="revealAllAnswers"
      >
        Reveal All Answers
      </button>
    </div>

    <!-- Score and Manual Score Override Container -->
    <div class="container score-container">
      <h3>Score Management</h3>
      <div>
        <label :for="'team-a-score'">{{ store.teamNames.A }}:</label>
        <input
          id="team-a-score"
          type="number"
          v-model.number="store.teamScores.A"
          @change="updateTeamScore('A', store.teamScores.A)"
        />
      </div>
      <div>
        <label :for="'team-b-score'">{{ store.teamNames.B }}:</label>
        <input
          id="team-b-score"
          type="number"
          v-model.number="store.teamScores.B"
          @change="updateTeamScore('B', store.teamScores.B)"
        />
      </div>
      <div>
        <label for="round-counter">Round:</label>
        <input
          id="round-counter"
          type="number"
          v-model.number="store.roundCounter"
          @change="updateRoundCounter(store.roundCounter)"
        />
      </div>
      <div>
        <label for="score-multiplier">Score Multiplier:</label>
        <input
          id="score-multiplier"
          type="number"
          v-model.number="store.scoreMultiplier"
          @change="updateScoreMultiplier(store.scoreMultiplier)"
          min="1"
          max="3"
        />
      </div>
    </div>

    <!-- Timer Container -->
    <div class="container timer-container">
      <h3>Timer</h3>
      <label for="timer-input">Set Timer (seconds):</label>
      <input
        id="timer-input"
        type="number"
        v-model.number="timerInput"
        @change="setTimer"
      />
      <button @click="startTimer">Start</button>
      <button @click="stopTimer">Stop</button>
      <button @click="resetTimer">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gamestore';
import { io } from 'socket.io-client';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';

const sessionId = new URLSearchParams(window.location.search).get('sessionId'); // Get sessionId from URL query params
const store = useGameStore();

onMounted(() => {
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
    Object.assign(store.$state, currentState); // Update the global store with the current game state

    // Sync local variables with the global state
    teamAName.value = store.teamNames.A;
    teamBName.value = store.teamNames.B;

    // Sync "Who Starts" state
    if (store.firstTeam) {
      startingTeam.value = store.firstTeam;
      startingTeamSet.value = true;
    }

    // Sync "Score Multiplier" state
    if (store.scoreMultiplier) {
      selectedMultiplier.value = store.scoreMultiplier;
      multiplierSet.value = true;
    }
  });

  // Listen for game state updates
  socket.on('game-updated', (updatedGameState) => {
    console.log('Game state updated:', updatedGameState);
    Object.assign(store.$state, updatedGameState); // Update the global store with the new game state

    // Sync local variables with the updated global state
    teamAName.value = store.teamNames.A;
    teamBName.value = store.teamNames.B;

    // Sync "Who Starts" state
    if (store.firstTeam) {
      startingTeam.value = store.firstTeam;
      startingTeamSet.value = true;
    }

    // Sync "Score Multiplier" state
    if (store.scoreMultiplier) {
      selectedMultiplier.value = store.scoreMultiplier;
      multiplierSet.value = true;
    }
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    alert('Failed to connect to the game session. Please try again.');
  });
});

// Update game state
const updateGameState = (gameState) => {
  console.log('Session ID:', sessionId);
  console.log('Game State:', gameState);

  if (!sessionId) {
    alert('YERRRR Session ID is missing. Cannot update game state.');
    return;
  }

  socket.emit('update-game', { sessionId, gameState });
};

// Listen for game state updates
socket.on('game-updated', (updatedGameState) => {
  console.log('Game state updated:', updatedGameState);
});

// Handle errors
socket.on('error', (error) => {
  console.error('Error from backend:', error.message);
  alert(`Error: ${error.message}`);
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});

const fileUploaded = ref(false);
const startingTeam = ref(null); // Track the selected starting team
const selectedMultiplier = ref(null); // Track the selected multiplier
const startingTeamSet = ref(false);
const multiplierSet = ref(false);
const timerInput = ref(0);
let timerInterval = null;

const answerPairs = ref([]); // Initialize with an empty array
const answersSaved = ref(false); // Track if answers have been saved
const questionInput = ref(''); // Track the question input
const questionSaved = ref(false); // Track if the question has been saved
const previousRound = ref(store.roundCounter); // Track the previous round value
const previousTeamNames = ref({ ...store.teamNames }); // Track the previous team names
const sessionIdBoxText = ref(`Session ID: ${sessionId}`); // Default text
const sessionIdBoxState = ref(''); // Default state (no additional class)

const teamAName = ref('');
const teamBName = ref('');

const isTeamNamesUnique = computed(() => {
  return teamAName.value.trim().toLowerCase() !== teamBName.value.trim().toLowerCase();
});

onMounted(() => {
  store.initSocket();
  teamAName.value = store.teamNames.A;
  teamBName.value = store.teamNames.B;
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  socket.removeAllListeners();
});

const emitGameState = () => {
  // Check if the team names have changed
  if (
    previousTeamNames.value.A !== store.teamNames.A ||
    previousTeamNames.value.B !== store.teamNames.B
  ) {
    socket.emit('update-game', { teamNames: { ...store.teamNames } }); // Emit only the team names
    previousTeamNames.value = { ...store.teamNames }; // Update the previous team names
  }

  // Emit the full game state if both question and answers are saved
  if (questionSaved.value && answersSaved.value) {
    socket.emit('update-game', { ...store.$state });
  }

  // Emit the game state when the game is reset
  if (!questionSaved.value && !answersSaved.value) {
    socket.emit('update-game', { ...store.$state, reset: true }); // Include a reset flag
  }

  // Emit the game state when the round is reset
  if (store.roundOver === false && store.pointPool === 0) {
    socket.emit('update-game', { ...store.$state, roundReset: true }); // Include a round reset flag
  }
};

const handleUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data;

      if (data.length > 0) {
        // Use the first entry's question
        questionInput.value = data[0].Question || '';

        // Populate the answers and points, assigning unique IDs
        answerPairs.value = data.map((row) => ({
          id: uuidv4(), // Assign a unique ID
          text: row.Answer || '',
          points: parseInt(row.Points, 10) || 0,
        }));
      } else {
        alert('The uploaded CSV file is empty or invalid.');
      }
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
      alert('Failed to parse the CSV file. Please check the format.');
    },
  });
};

const setStartingTeam = (team) => {
  store.setStartingTeam(team);
  startingTeam.value = team; // Set the selected starting team
  startingTeamSet.value = true; // Disable the buttons
  updateGameState(store.$state); // Emit the updated game state
};

const setMultiplier = (multiplier) => {
  store.setScoreMultiplier(multiplier);
  selectedMultiplier.value = multiplier; // Set the selected multiplier
  multiplierSet.value = true; // Disable the buttons
  updateGameState(store.$state); // Emit the updated game state
};

const resetGame = () => {
  store.resetGame();
  fileUploaded.value = false;
  startingTeamSet.value = false;
  multiplierSet.value = false;
  startingTeam.value = null;
  selectedMultiplier.value = null;
  answersSaved.value = false; // Reset the answers saved flag
  answerPairs.value = []; // Clear the answer pairs completely
  questionInput.value = ''; // Reset the question input
  questionSaved.value = false; // Reset the question saved flag
  updateGameState(store.$state); // Emit the reset state to the Team Display
};

const resetRound = () => {
  stopTimer();
  store.resetRound();
  fileUploaded.value = false;
  startingTeamSet.value = false;
  multiplierSet.value = false;
  startingTeam.value = null;
  selectedMultiplier.value = null;
  answersSaved.value = false; // Reset the answers saved flag
  answerPairs.value = []; // Clear the answer pairs completely
  questionInput.value = ''; // Reset the question input
  questionSaved.value = false; // Reset the question saved flag
  store.updateRoundCounter(previousRound.value); // Reset the round counter to the previous value
  updateGameState(store.$state); // Emit the updated game state
};

const nextRound = () => {
  previousRound.value = store.roundCounter; // Store the current round value
  store.nextRound(); // Advance to the next round
  fileUploaded.value = false;
  startingTeamSet.value = false;
  multiplierSet.value = false;
  startingTeam.value = null;
  selectedMultiplier.value = null;
  answersSaved.value = false; // Reset the answers saved flag
  answerPairs.value = []; // Clear the answer pairs
  questionInput.value = ''; // Reset the question input
  questionSaved.value = false; // Reset the question saved flag
  updateGameState(store.$state); // Emit the updated game state for the next round
};

const updateTeamScore = (team, score) => {
  store.updateTeamScore(team, score);
  updateGameState(store.$state); // Emit the updated game state
};

const updateTeamName = (team, name) => {
  store.updateTeamName(team, name);
  updateGameState(store.$state); // Emit the updated game state
};

const updateRoundCounter = (round) => {
  store.updateRoundCounter(round);
  updateGameState(store.$state); // Emit the updated game state
};

const updateScoreMultiplier = (multiplier) => {
  store.setScoreMultiplier(multiplier);
  updateGameState(store.$state); // Emit the updated game state
};

const setTimer = () => {
  store.setTimer(timerInput.value);
};

const startTimer = () => {
  if (timerInterval) return;
  store.startTimer();
  timerInterval = setInterval(() => {
    if (store.timer > 0) {
      store.decrementTimer();
      updateGameState(store.$state); // Emit the updated game state
    } else {
      stopTimer();
    }
  }, 1000);
};

const stopTimer = () => {
  store.stopTimer();
  clearInterval(timerInterval);
  timerInterval = null;
  updateGameState(store.$state); // Emit the updated game state
};

const resetTimer = () => {
  stopTimer();
  store.resetTimer();
  timerInput.value = 0;
  updateGameState(store.$state); // Emit the updated game state
};

const handleCorrectGuess = (answerId) => {
  if (!store.firstTeam) {
    const match = store.answers.find((a) => a.id === answerId);
    if (match && !store.guessedAnswers.includes(match.id)) {
      store.guessedAnswers.push(match.id); // Use the unique ID to track guessed answers
      store.pointPool += match.points * store.scoreMultiplier; // Add points to the points pool
    } 
  } else {
      // Normal gameplay: Award points to the current team
      if (store.currentTeam === store.firstTeam) {
        store.guessAnswer(answerId);
      } else {
        store.secondTeamGuess(answerId);
      }
    }
  updateGameState(store.$state); // Emit the updated game state
};

const handleIncorrectGuess = () => {
  // Increment the temporary strike count for the current team
  store.strikes++;

  if (store.currentTeam === store.firstTeam) {
    // If the starting team reaches 3 strikes, handle the three-strike logic
    if (store.strikes >= 3) {
      store.handleThreeStrikes();
    } else {
      // Increment the persistent strike count for the current team
      store.teamStrikes[store.currentTeam]++;
    }
  } else {
    // If the second team guesses incorrectly, award the points to the starting team
    if (store.strikes >= 1) {
      store.handleThreeStrikes();
    } else {
      // Increment the persistent strike count for the second team
      store.teamStrikes[store.currentTeam]++;
    }
  }
  updateGameState(store.$state); // Emit the updated game state
};

const addAnswerPair = () => {
  if (answerPairs.value.length < 8) {
    answerPairs.value.push({ id: uuidv4(), text: '', points: 0 });
  } else {
    alert('You can only add up to 8 answers.');
  }
};

const removeAnswerPair = (index) => {
  answerPairs.value.splice(index, 1); // Remove the selected answer pair
};

const removeAllAnswers = () => {
  answerPairs.value = [{ text: '', points: 0 }]; // Reset to one empty pair
};

const saveQuestionAndAnswers = () => {
  if (questionInput.value.trim()) {
    store.uploadQuestion(questionInput.value.trim());
    questionSaved.value = true;
  } else {
    alert('Please enter a valid question.');
    return;
  }

  const validAnswers = answerPairs.value.filter(
    (pair) => pair.text.trim() && !isNaN(pair.points)
  );

  if (validAnswers.length > 0) {
    store.uploadAnswers(validAnswers);
    answersSaved.value = true;
  } else {
    alert('Please provide at least one valid answer with points.');
    return;
  }

  if (questionSaved.value && answersSaved.value) {
    store.incrementRoundCounter();
    updateGameState(store.$state); // Emit the updated game state
  }
};

const saveTeamNames = () => {
  const trimmedTeamAName = teamAName.value.trim();
  const trimmedTeamBName = teamBName.value.trim();

  if (!trimmedTeamAName || !trimmedTeamBName) {
    alert('Both team names are required.');
    return;
  }

  if (trimmedTeamAName.toLowerCase() === trimmedTeamBName.toLowerCase()) {
    alert('Team names must be unique.');
    return;
  }

  // Update the global state with the trimmed names
  store.teamNames.A = trimmedTeamAName;
  store.teamNames.B = trimmedTeamBName;

  //alert('Team names saved successfully!');
  updateGameState(store.$state); // Emit the updated game state
};

const revealAllAnswers = () => {
  const unrevealedAnswers = store.answers
    .filter(answer => !store.guessedAnswers.includes(answer.id)) // Find answers not yet revealed
    .map(answer => answer.id); // Get their IDs

  store.guessedAnswers.push(...unrevealedAnswers); // Add all unrevealed IDs to guessedAnswers
  updateGameState(store.$state); // Emit the updated game state
};

const copySessionId = () => {
  if (sessionId) {
    navigator.clipboard.writeText(sessionId)
      .then(() => {
        // Show "Copied" and turn the box green
        sessionIdBoxText.value = 'Copied!';
        sessionIdBoxState.value = 'copied';

        // Revert back to the original state after 2 seconds
        setTimeout(() => {
          sessionIdBoxText.value = `Session ID: ${sessionId}`;
          sessionIdBoxState.value = '';
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy session ID:', err);

        // Show "Error" and turn the box red
        sessionIdBoxText.value = 'Error';
        sessionIdBoxState.value = 'error';

        // Revert back to the original state after 2 seconds
        setTimeout(() => {
          sessionIdBoxText.value = `Session ID: ${sessionId}`;
          sessionIdBoxState.value = '';
        }, 2000);
      });
  }
};

</script>

<style scoped>
.container {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.reset-container {
  background-color: #ffe6e6;
}

.settings-container {
  background-color: #e6f7ff;
}

.game-info-container {
  background-color: #e6ffe6;
}

.score-container {
  background-color: #fffbe6;
}

.timer-container {
  background-color: #f0e6ff;
}

.answers-container {
  background-color: #e6e6ff;
  margin-bottom: 16px;
}

.question-container,
.team-names-container { /* Reuse the same styles for both sections */
  background-color: #e6e6ff;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.question-answers-container {
  background-color: #e6e6ff;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.question-answers-container h3 {
  margin-top: 0;
}

.answer-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.answer-pair input {
  padding: 4px;
  width: 150px;
}

button {
  padding: 4px 8px;
  cursor: pointer;
}

.save-button {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.save-button:hover {
  background-color: #218838;
}

.save-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.download-template-button {
  display: inline-block;
  margin-left: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.download-template-button:hover {
  background-color: #0056b3;
}

.download-template-button:active {
  background-color: #003f7f;
}

.session-id-box {
  position: fixed;
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
  background-color: rgb(22, 150, 105); /* Green for success */
  color: white;
}

.session-id-box.error {
  background-color: rgb(232, 59, 59); /* Red for error */
  color: white;
}

.error-message {
  color: red;
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>
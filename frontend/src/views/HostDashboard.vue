<template>
  <div>
    <FloatingButton
      :label="sessionIdBoxText"
      :onClick="copySessionId"
      className="session-id-box"
      :state="sessionIdBoxState"
    />
    <!-- Reset Game and Reset Round Container -->

    <GameStatusMgr
      :resetGame="resetGame"
      :resetRound="resetRound"
      :nextRound="nextRound"
      :roundOver="store.roundOver"
      :isLoading="isLoading"
    />

    <div class="flex-row">
      <!-- Manage Question and Answers Section -->
      <QuestionAndAnswersMgr
        v-model:questionInput="questionInput"
        :startingTeamSet="store.startingTeamSet"
        :startingTeam="startingTeam"
        :teamNames="store.teamNames"
        :setStartingTeam="setStartingTeam"
        :currentStep="store.currentStep"
        :handleUpload="handleUpload"
        :fetchLibraryFiles="fetchLibraryFiles"
        :showLibraryDialog="showLibraryDialog"
        :libraryFiles="libraryFiles"
        :loadLibraryFile="loadLibraryFile"
        :questionSaved="questionSaved"
        :answerPairs="answerPairs"
        :answersSaved="store.answersSaved"
        :removeAnswerPair="removeAnswerPair"
        :addAnswerPair="addAnswerPair"
        :removeAllAnswers="removeAllAnswers"
        :saveQuestionAndAnswers="saveQuestionAndAnswers"
        :selectedMultiplier="selectedMultiplier"
        :multiplierSet="store.multiplierSet"
        :setMultiplier="setMultiplier"
        :question="store.question"
        :answers="answers"
        :guessedAnswers="guessedAnswers"
        :roundOver="store.roundOver"
        :showWhoStartsSection="showWhoStartsSection"
        :handleCorrectGuess="handleCorrectGuess"
        :handleIncorrectAndStrike="handleIncorrectAndStrike"
        :emitStrikeSound="emitStrikeSound"
        :revealAllAnswers="revealAllAnswers"
        :setShowLibraryDialog="setShowLibraryDialog"
      />
      <!-- Available Answers, Strikes, and Points Pool Container -->

      <ActiveGameInfoMgr
        :teamNames="store.teamNames"
        :teamStrikes="store.teamStrikes"
        :teamScores="store.teamScores"
        :roundCounter="Number(store.roundCounter) || 0"
        :currentTeam="store.currentTeam"
        :pointPool="store.pointPool"
        :roundOver="store.roundOver"
        :scoreMultiplier="store.scoreMultiplier"
        :revealAllAnswers="revealAllAnswers"
      />
    </div>

    <div class="flex-row">
      <ManualOverrideMgr
        :teamNames="store.teamNames"
        :teamScores="store.teamScores"
        :roundCounter="store.roundCounter"
        :scoreMultiplier="store.scoreMultiplier ?? 1"
        :isTeamNamesUnique="isTeamNamesUnique"
        @saveScoreMgmt="saveScoreMgmt"
      />

      <!-- Timer Container -->
      <TimerMgr
        v-model:timerInput="timerInput"
        :timerRunning="store.timerRunning"
        :timer="store.timer"
        :startTimer="startTimer"
        :stopTimer="stopTimer"
        :resetTimer="resetTimer"
        :setTimer="setTimer"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/gamestore';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';
import FloatingButton from '../components/teamDisplay/FloatingButton.vue';
import GameStatusMgr from '@/components/hostDashboard/GameStatusMgr.vue';
import QuestionAndAnswersMgr from '@/components/hostDashboard/QuestionAndAnswersMgr.vue';
import ActiveGameInfoMgr from '@/components/hostDashboard/ActiveGameInfoMgr.vue';
import TimerMgr from '@/components/hostDashboard/TimerMgr.vue';
import ManualOverrideMgr from '@/components/hostDashboard/ManualOverrideMgr.vue';

let timerInterval = null;
const sessionId = new URLSearchParams(window.location.search).get('sessionId'); // Get sessionId from URL query params
const store = useGameStore();
const showLibraryDialog = ref(false);
const libraryFiles = ref([]);
const apiBase = import.meta.env.VITE_API_BASE || '';
const fileUploaded = ref(false);
const startingTeam = ref(null); // Track the selected starting team
const selectedMultiplier = ref(null); // Track the selected multiplier
const timerInput = ref(0);
const answerPairs = ref([]); // Initialize with an empty array
const questionInput = ref(''); // Track the question input
const questionSaved = ref(false); // Track if the question has been saved
const previousRound = ref(store.roundCounter); // Track the previous round value
const sessionIdBoxText = ref(`Session ID: ${sessionId}`); // Default text
const sessionIdBoxState = ref(''); // Default state (no additional class)
const showAvailableAnswers = ref(false); // Track whether to show the Available Answers section
const correctCount = ref(0);
const buzzerOnlyCount = ref(0);
const answers = computed(() => store.answers || []); // Use store's answers
const guessedAnswers = computed(() => store.guessedAnswers || []); // Use store's guessed answers
const buzzerOnlyPressed = ref(false);
const correctAfterBuzzer = ref(false);
const isTeamNamesUnique = computed(() => {
  return store.teamNames.A.trim().toLowerCase() !== store.teamNames.B.trim().toLowerCase();
});
const isLoading = ref(false);
const correctBeforeBuzzer = ref(false);

// Update game state
const updateGameState = (gameState) => {
  if (!sessionId) {
    alert('YERRRR Session ID is missing. Cannot update game state.');
    return;
  }
  socket.emit('update-game', { sessionId, gameState });
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
  store.startingTeamSet = true;
  updateGameState(store.$state); // Emit the updated game state
};

const setMultiplier = (multiplier) => {
  store.setScoreMultiplier(multiplier);
  selectedMultiplier.value = multiplier; // Set the selected multiplier
  // multiplierSet.value = true; // Disable the buttons
  store.currentStep = 'answers'; // Update the store's current step
  store.multiplierSet = true; // Set the multiplier set flag in the store
  updateGameState(store.$state); // Emit the updated game state
};

const resetGame = async () => {
  isLoading.value = true;
  console.log(isLoading.value, 'isLoading set to true in resetGame');
  stopTimer();

  // Reset all local refs
  fileUploaded.value = false;
  startingTeam.value = null;
  selectedMultiplier.value = null;
  answerPairs.value = [];
  questionInput.value = '';
  questionSaved.value = false;
  showAvailableAnswers.value = false;
  correctCount.value = 0;
  buzzerOnlyCount.value = 0;
  buzzerOnlyPressed.value = false;
  correctAfterBuzzer.value = false;

  store.resetGame();
  const gameResetState = { ...store.$state, gameReset: true };
  updateGameState(gameResetState);
};

const resetRound = async () => {
  isLoading.value = true;
  console.log(isLoading.value, 'isLoading set to true in resetRound');
  stopTimer();

  // Deduct awarded points from the team that received them, if any
  if (store.pointsAwarded > 0 && store.winningTeam) {
    store.teamScores[store.winningTeam] -= store.pointsAwarded;
    // Ensure the score doesn't go negative
    if (store.teamScores[store.winningTeam] < 0) {
      store.teamScores[store.winningTeam] = 0;
    }
    store.pointsAwarded = 0; // Reset awarded points
    store.winningTeam = null; // Reset winning team
  }

  store.updateRoundCounter(previousRound.value);

  // Reset all local refs
  fileUploaded.value = false;
  startingTeam.value = null;
  selectedMultiplier.value = null;
  answerPairs.value = [];
  questionInput.value = '';
  questionSaved.value = false;
  showAvailableAnswers.value = false;
  correctCount.value = 0;
  buzzerOnlyCount.value = 0;
  buzzerOnlyPressed.value = false;
  correctAfterBuzzer.value = false;

  store.resetRound();
  const resetRoundState = { ...store.$state, roundReset: true };
  updateGameState(resetRoundState);
};

const nextRound = async () => {
  isLoading.value = true;
  console.log(isLoading.value, 'isLoading set to true in nextRound');
  stopTimer();

  previousRound.value = store.roundCounter; // Store the current round value

  // Reset all local refs
  fileUploaded.value = false;
  startingTeam.value = null;
  selectedMultiplier.value = null;
  answerPairs.value = [];
  questionInput.value = '';
  questionSaved.value = false;
  showAvailableAnswers.value = false;
  correctCount.value = 0;
  buzzerOnlyCount.value = 0;
  buzzerOnlyPressed.value = false;
  correctAfterBuzzer.value = false;

  store.resetRound(); // Advance to the next round
  // Emit the updated game state for the next round
  const nextRoundState = { ...store.$state, nextRound: true };
  updateGameState(nextRoundState);
};

const handleIncorrectAndStrike = () => {
  handleIncorrectGuess();
  emitStrikeSound();
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
  correctCount.value++;
  if (buzzerOnlyPressed.value) {
    correctAfterBuzzer.value = true;
  }
  if (!buzzerOnlyPressed.value) {
    correctBeforeBuzzer.value = true;
  }
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

const saveQuestionAndAnswers = async () => {
  if (questionInput.value.trim()) {
    await store.uploadQuestion(questionInput.value.trim());
    questionSaved.value = true;
    store.question = questionInput.value.trim();
  } else {
    alert('Please enter a valid question.');
    return;
  }

  const validAnswers = answerPairs.value.filter((pair) => pair.text.trim() && !isNaN(pair.points));
  if (validAnswers.length > 0) {
    await store.uploadAnswers(validAnswers);
    store.currentStep = 'multiplier';
    store.answersSaved = true;
  } else {
    alert('Please provide at least two valid answers with points.');
    return;
  }

  if (questionSaved.value && store.answersSaved) {
    store.incrementRoundCounter();
    store.questionSaved = true;
    updateGameState(store.$state); // Emit the updated game state LAST
  }
};

const saveScoreMgmt = () => {
  const trimmedTeamAName = store.teamNames.A.trim();
  const trimmedTeamBName = store.teamNames.B.trim();

  if (!trimmedTeamAName || !trimmedTeamBName) {
    alert('Both team names are required.');
    return;
  }

  if (trimmedTeamAName.toLowerCase() === trimmedTeamBName.toLowerCase()) {
    alert('Team names must be unique.');
    return;
  }

  // Build a fresh game state object
  const gameState2 = {
    ...store.$state,
    teamNames: {
      A: trimmedTeamAName,
      B: trimmedTeamBName,
    },
  };

  updateGameState(gameState2);
};

const revealAllAnswers = () => {
  const unrevealedAnswers = store.answers
    .filter((answer) => !store.guessedAnswers.includes(answer.id)) // Find answers not yet revealed
    .map((answer) => answer.id); // Get their IDs

  store.guessedAnswers.push(...unrevealedAnswers); // Add all unrevealed IDs to guessedAnswers
  updateGameState(store.$state); // Emit the updated game state
};

const emitStrikeSound = () => {
  buzzerOnlyCount.value++;
  buzzerOnlyPressed.value = true;
  // If a correct was pressed before the buzzer, set a flag
  if (correctBeforeBuzzer.value) {
    correctBeforeBuzzer.value = false; // Reset for next use
    correctAfterBuzzer.value = true; // This triggers the new condition
  }
  console.log('emitStrikeSound called');
  socket.emit('play-strike-sound', { sessionId });
};

const copySessionId = () => {
  if (sessionId) {
    navigator.clipboard
      .writeText(sessionId)
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

const highestPointAnswerId = computed(() => {
  if (!store.answers.length) return null;
  return store.answers.reduce(
    (max, curr) => (curr.points > max.points ? curr : max),
    store.answers[0],
  ).id;
});

const highestPointAnswered = computed(() =>
  store.guessedAnswers.includes(highestPointAnswerId.value),
);

const guessedAnswersCount = computed(() => store.guessedAnswers.length);

const showWhoStartsSection = computed(() => {
  if (store.startingTeamSet) return false;
  // 1. Highest point answer selected
  if (highestPointAnswered.value) return true;
  // 2. Any answer selected after buzzer only
  if (buzzerOnlyPressed.value && correctAfterBuzzer.value) return true;
  // 3. Any 2 answers selected (including highest-point)
  if (guessedAnswersCount.value >= 2) return true;
  // 4. Correct pressed, then buzzer only
  if (correctAfterBuzzer.value) return true;
  return false;
});

const fetchLibraryFiles = async () => {
  const res = await fetch(`${apiBase}/api/answers-library`);
  libraryFiles.value = await res.json();
  showLibraryDialog.value = true;
};

function setShowLibraryDialog(value) {
  showLibraryDialog.value = value;
}

// Load and parse the selected CSV file
const loadLibraryFile = async (filename) => {
  const res = await fetch(`/answers/${filename}`);
  const csvText = await res.text();
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data;
      if (data.length > 0) {
        questionInput.value = data[0].Question || '';
        answerPairs.value = data.map((row) => ({
          id: uuidv4(),
          text: row.Answer || '',
          points: parseInt(row.Points, 10) || 0,
        }));
      } else {
        alert('The selected CSV file is empty or invalid.');
      }
      showLibraryDialog.value = false;
    },
    error: (error) => {
      alert('Failed to parse the selected CSV file.');
      showLibraryDialog.value = false;
    },
  });
};

// Listen for game state updates
socket.on('update-game', (updatedGameState) => {
  Object.assign(store.$state, updateGameState);
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

onMounted(() => {
  store.initSocket();

  // Listen for team name updates from the backend
  socket.on('team-names-updated', (teamNames) => {
    store.teamNames = { ...store.teamNames, ...teamNames };
  });
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
    // teamAName.value = store.teamNames.A;
    // teamBName.value = store.teamNames.B;

    // Sync "Who Starts" state
    if (store.firstTeam) {
      startingTeam.value = store.firstTeam;
      //startingTeamSet.value = true;
    }

    // Sync "Score Multiplier" state
    if (store.scoreMultiplier) {
      selectedMultiplier.value = store.scoreMultiplier;
      //multiplierSet.value = true;
    }
  });

  // Listen for game state updates
  socket.on('update-game', (updatedGameState) => {
    Object.assign(store.$state, updatedGameState);

    isLoading.value = false;
    console.log(isLoading.value, 'isLoading set to false in update-game');

    // Sync "Who Starts" state
    if (store.firstTeam) {
      startingTeam.value = store.firstTeam;
      //startingTeamSet.value = true;
    } else {
      startingTeam.value = null;
      //startingTeamSet.value = false;
    }

    // Sync "Score Multiplier" state
    if (store.scoreMultiplier) {
      selectedMultiplier.value = store.scoreMultiplier;
      //multiplierSet.value = true;
    } else {
      selectedMultiplier.value = null;
      //multiplierSet.value = false;
    }

    store.teamNames = { ...store.teamNames, ...updateGameState.teamNames };

    // Instead of replacing the whole object, update properties
    // if (updatedGameState.teamNames) {
    //   store.teamNames.A = updatedGameState.teamNames.A;
    //   store.teamNames.B = updatedGameState.teamNames.B;
    // }
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    alert('Failed to connect to the game session. Please try again.');
  });

  fetch(`${apiBase}/api/create-session/${sessionId}`, { method: 'POST' });
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  // socket.off('team-names-updated');
  socket.removeAllListeners();
});
</script>

<style scoped>
.container {
  padding: 1rem;
  margin: 1rem;
  border-radius: 0.5rem;
  background-color: #f9f9f9;
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
.team-names-container {
  /* Reuse the same styles for both sections */
  background-color: #e6e6ff;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

button {
  padding: 4px 8px;
  cursor: pointer;
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
  transition:
    opacity 0.3s ease,
    background-color 0.3s ease; /* Smooth transition for hover and color changes */
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
.flex-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.flex-row > .container {
  flex: 1 1 350px;
  min-width: 300px;
}

/* Generic Button Style */
.btn {
  display: inline-block;
  padding: 8px 16px;
  margin-top: 8px;
  margin-bottom: 8px;
  background-color: #888; /* Gray shade */
  color: white !important;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.btn:hover {
  background-color: #666;
}

.btn:active {
  background-color: #444;
}

.btn:disabled,
.btn[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
  color: #666 !important;
}

.btn.primary {
  background-color: #007bff;
}

.btn.primary:hover {
  background-color: #0056b3;
}

.btn.primary:active {
  background-color: #003f7f;
}

.btn.success {
  background-color: #28a745;
}
.btn.success:hover {
  background-color: #218838;
}
.btn.success:active {
  background-color: #007f3d;
}

.info-key {
  font-weight: bold;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.form-row label {
  flex: 0 0 150px; /* Fixed width for labels */
  text-align: right;
  margin-right: 8px;
}

.form-row input {
  flex: 1 1 180px; /* Inputs take remaining space */
  min-width: 0;
  padding: 6px 8px;
}
</style>

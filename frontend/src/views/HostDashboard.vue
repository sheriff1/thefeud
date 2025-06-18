<template>
  <div class="flex flex-col items-center my-8">
    <h1>The Feud Host Dashboard</h1>
    <div class="floating-buttons">
      <FloatingButton
        :label="sessionIdBoxText"
        :onClick="() => (showSessionIdDialog = true)"
        class="session-id-box"
        :state="sessionIdBoxState"
      />
      <FloatingButton label="Log Out" :onClick="logout" className="logout-box" />
    </div>
    <!-- Reset Game and Reset Round Container -->

    <!-- Session ID Modal -->
    <input
      type="checkbox"
      id="session-id-modal"
      class="modal-toggle"
      v-model="showSessionIdDialog"
    />
    <div class="modal" v-if="showSessionIdDialog">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Invite Others</h3>
        <div class="flex flex-col gap-3">
          <button class="btn btn-outline" @click="copySessionIdOption('id')">
            Copy Session ID
          </button>
          <button class="btn btn-outline" @click="copySessionIdOption('host')">
            Copy Invite Host Link
          </button>
          <button class="btn btn-outline" @click="copySessionIdOption('team')">
            Copy Invite Team Member Link
          </button>
          <button class="btn btn-outline" @click="copySessionIdOption('spectator')">
            Copy Invite Spectator Link
          </button>
        </div>
        <div class="modal-action">
          <label class="btn" @click="showSessionIdDialog = false">Close</label>
        </div>
      </div>
    </div>

    <!-- Manage Question and Answers Section -->
    <GameMgr
      :updateGameState="updateGameState"
      :nextRound="nextRound"
      :handleUpload="handleUpload"
      :fetchLibraryFiles="fetchLibraryFiles"
      :showLibraryDialog="showLibraryDialog"
      :libraryFiles="libraryFiles"
      :loadLibraryFile="loadLibraryFile"
      :setShowLibraryDialog="setShowLibraryDialog"
      v-model:questionInput="questionInput"
      :answerPairs="answerPairs"
      :removeAnswerPair="removeAnswerPair"
      :addAnswerPair="addAnswerPair"
      :removeAllAnswers="removeAllAnswers"
      :saveQuestionAndAnswers="saveQuestionAndAnswers"
      :setMultiplier="setMultiplier"
      :handleCorrectGuess="handleCorrectGuess"
      :handleIncorrectAndStrike="handleIncorrectAndStrike"
      :emitStrikeSound="emitStrikeSound"
      :showWhoStartsSection="showWhoStartsSection"
      :setStartingTeam="setStartingTeam"
      :guessedAnswersCount="guessedAnswersCount"
      :revealAllAnswers="revealAllAnswers"
      :showQASection="showQASection"
      @update:showQASection="(val: boolean) => (showQASection = val)"
    />
    <!-- Available Answers, Strikes, and Points Pool Container -->

    <ActiveGameInfoMgr />

    <ManualOverrideMgr
      :updateGameState="updateGameState"
      :isTeamNamesUnique="isTeamNamesUnique"
      :resetGame="resetGame"
      :resetRound="resetRound"
      :isLoading="isLoading"
      @saveScoreMgmt="saveScoreMgmt"
      @resetShowQASection="resetShowQASection"
    />

    <!-- Timer Container -->
    <TimerMgr
      v-model:timerInput="timerInput"
      :startTimer="startTimer"
      :stopTimer="stopTimer"
      :resetTimer="resetTimer"
      :setTimer="setTimer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gamestore';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';
import FloatingButton from '../components/teamDisplay/FloatingButton.vue';
import ActiveGameInfoMgr from '../components/hostDashboard/ActiveGameInfoMgr.vue';
import TimerMgr from '../components/hostDashboard/TimerMgr.vue';
import GameMgr from '../components/hostDashboard/GameMgr.vue';
import ManualOverrideMgr from '../components/hostDashboard/ManualOverrideMgr.vue';
import { useRouter } from 'vue-router';
import { useSessionTimeout } from '@/composables/useSessionTimeout';
const router = useRouter();

let timerInterval: number | null = null;
const sessionId = new URLSearchParams(window.location.search).get('sessionId'); // Get sessionId from URL query params
const store = useGameStore();
const showLibraryDialog = ref(false);
const libraryFiles = ref([]);
const apiBase = import.meta.env.VITE_API_BASE || '';
const fileUploaded = ref(false);
const selectedMultiplier = ref<number | null>(null); // Track the selected multiplier
const timerInput = ref(0);
const answerPairs = ref<{ id: string; text: string; points: number }[]>([]); // Initialize with an empty array and type
const questionInput = ref(''); // Track the question input
const previousRound = ref(store.roundCounter); // Track the previous round value
const sessionIdBoxText = ref(`🔗  Invite Others`); // Default text
const sessionIdBoxState = ref(''); // Default state (no additional class)
const showAvailableAnswers = ref(false); // Track whether to show the Available Answers section
const correctCount = ref(0);
const buzzerOnlyCount = ref(0);
const isLoading = ref(false);
const showQASection = ref(false);
const showSessionIdDialog = ref(false);

const isTeamNamesUnique = computed(() => {
  return store.teamNames.A.trim().toLowerCase() !== store.teamNames.B.trim().toLowerCase();
});

const updateGameState = (gameState: any) => {
  if (!sessionId) {
    alert('Session ID is missing. Cannot update game state.');
    return;
  }

  socket.emit('update-game', { sessionId, gameState });
};

const handleUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Validate file type (MIME) and extension
  const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

  if (!isCsv) {
    alert('Please upload a valid CSV file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Validate header
    const expectedHeader = 'Question,Answer,Points';
    if (lines[0].trim() !== expectedHeader) {
      alert(`CSV header must be exactly: ${expectedHeader}`);
      return;
    }

    // Validate each row
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length !== 3) {
        alert(`Row ${i + 1} is invalid. Each row must have exactly 3 columns.`);
        return;
      }
    }

    parseCsv(
      file,
      (row) => ({
        id: uuidv4(),
        text: row.Answer,
        points: Number(row.Points),
      }),
      (parsedAnswers, rawData) => {
        questionInput.value = rawData[0]?.Question || '';
        answerPairs.value = parsedAnswers;
      },
    );
  };
  reader.readAsText(file);
};

const setStartingTeam = (team: string) => {
  store.setStartingTeam(team);
  store.startingTeamSet = true;
  // startingTeam.value = team; // Set the selected starting team
  // console.log('setStartingTeam() called from HostDashboard.vue');
  // updateGameState(store.$state); // Emit the updated game state
};

const setMultiplier = (multiplier: number) => {
  selectedMultiplier.value = multiplier; // Set the selected multiplier
  store.multiplierSet = true; // Set the multiplier set flag in the store
  store.scoreMultiplier = multiplier; // Update the store's score multiplier
  // multiplierSet.value = true; // Disable the buttons
  // store.currentStep = 4; // Update the store's current step
  // console.log('setMultiplier() called from HostDashboard.vue');
  // updateGameState(store.$state); // Emit the updated game state
};

const resetGame = async () => {
  isLoading.value = true;
  stopTimer();

  // Reset all local refs
  fileUploaded.value = false;
  selectedMultiplier.value = null;
  answerPairs.value = [];
  questionInput.value = '';
  buzzerOnlyCount.value = 0;
  showAvailableAnswers.value = false;
  correctCount.value = 0;

  store.resetGame();
  // const gameResetState = { ...store.$state, gameReset: true };
  // console.log('resetGame() called from HostDashboard.vue');
  // updateGameState(gameResetState);
};

const resetRound = async () => {
  isLoading.value = true;
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
  store.resetRound();

  // Reset all local refs
  fileUploaded.value = false;
  selectedMultiplier.value = null;
  answerPairs.value = [];
  questionInput.value = '';
  showAvailableAnswers.value = false;
  correctCount.value = 0;
  buzzerOnlyCount.value = 0;

  // console.log('resetRoundState() called from HostDashboard.vue');
};

const nextRound = async () => {
  isLoading.value = true;
  stopTimer();

  store.resetRound(); // Advance to the next round
  previousRound.value = store.roundCounter; // Store the current round value

  // Reset all local refs
  fileUploaded.value = false;
  selectedMultiplier.value = null;
  answerPairs.value = [];
  questionInput.value = '';
  showAvailableAnswers.value = false;
  correctCount.value = 0;
  buzzerOnlyCount.value = 0;

  // console.log('nextRound() called from HostDashboard.vue');
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
      // console.log('startTimer() called from HostDashboard.vue');
      updateGameState(store.$state); // Emit the updated game state
    } else {
      stopTimer();
    }
  }, 1000) as unknown as number;
};

function stopTimer() {
  store.stopTimer();
  if (timerInterval !== null && timerInterval !== undefined) {
    clearInterval(timerInterval);
  }
  timerInterval = null;
  // console.log('stopTimer() called from HostDashboard.vue');
  // if (emit) updateGameState(store.$state); // Emit the updated game state
}

const resetTimer = () => {
  stopTimer();
  store.resetTimer();
  timerInput.value = 0;
  // console.log('resetTimer() called from HostDashboard.vue');
  updateGameState(store.$state); // Emit the updated game state
};

const handleCorrectGuess = (answerId: any) => {
  correctCount.value++;
  if (store.buzzerOnlyPressed) {
    store.correctAfterBuzzer = true;
  }
  if (!store.buzzerOnlyPressed) {
    store.correctBeforeBuzzer = true;
  }
  if (!store.firstTeam) {
    const match = store.answers.find((a: { id: any }) => a.id === answerId);
    if (
      match &&
      !store.guessedAnswers.some((a: string | { id: string }) =>
        typeof a === 'string' ? a === match.id : a.id === match.id,
      )
    ) {
      store.guessedAnswers.push({ id: match.id }); // Use the unique ID object to track guessed answers
      store.pointPool += match.points * (store.scoreMultiplier ?? 1); // Add points to the points pool, default multiplier to 1 if null
    }
  } else {
    // Normal gameplay: Award points to the current team
    if (store.currentTeam === store.firstTeam) {
      store.guessAnswer(answerId, updateGameState); // Use the store's method to handle guessing
    } else {
      store.secondTeamGuess(answerId, updateGameState);
    }
  }
  // console.log('handleCorrectGuess() called from HostDashboard.vue');
  //  updateGameState(store.$state); // Emit the updated game state
};

const handleIncorrectGuess = () => {
  // Increment the temporary strike count for the current team
  store.strikes++;

  if (store.currentTeam === store.firstTeam) {
    // If the starting team reaches 3 strikes, handle the three-strike logic
    if (store.strikes >= 3) {
      store.handleThreeStrikes(updateGameState);
    } else {
      // Increment the persistent strike count for the current team
      store.teamStrikes[store.currentTeam]++;
    }
  } else {
    // If the second team guesses incorrectly, award the points to the starting team
    if (store.strikes >= 1) {
      store.handleThreeStrikes(updateGameState);
    } else {
      // Increment the persistent strike count for the second team
      store.teamStrikes[store.currentTeam]++;
    }
  }
  // console.log('handleIncorrectGuess() called from HostDashboard.vue');
  // updateGameState(store.$state); // Emit the updated game state
};

const addAnswerPair = () => {
  if (answerPairs.value.length < 8) {
    answerPairs.value.push({ id: uuidv4(), text: '', points: 1 });
  } else {
    alert('You can only add up to 8 answers.');
  }
};

const removeAnswerPair = (index: number) => {
  answerPairs.value.splice(index, 1); // Remove the selected answer pair
};

const removeAllAnswers = () => {
  answerPairs.value = [{ id: uuidv4(), text: '', points: 0 }]; // Reset to one empty pair with unique id
};

function saveQuestionAndAnswers() {
  const question = questionInput.value.trim();
  if (!question) {
    alert('Please enter a valid question.');
    return false;
  }

  const validAnswers = answerPairs.value.filter((pair) => pair.text.trim() && !isNaN(pair.points));
  if (validAnswers.length === 0) {
    alert('Please provide at least two valid answers with points.');
    return false;
  }

  store.uploadQuestion(question);
  store.questionSaved = true;
  store.question = question;

  store.uploadAnswers(validAnswers);
  store.answersSaved = true;

  if (store.questionSaved && store.answersSaved) {
    store.incrementRoundCounter();
    // console.log('saveQuestionAndAnswers() called from HostDashboard.vue');
  }
}

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

  // console.log('saveScoreMgmt() called from HostDashboard.vue');
  updateGameState(gameState2);
};

const revealAllAnswers = () => {
  // Find answers not yet revealed
  const unrevealedAnswers = store.answers
    .filter(
      (answer: { id: any }) => !store.guessedAnswers.some((a: { id: any }) => a.id === answer.id),
    )
    .map((answer: { id: any }) => ({ id: answer.id })); // Map to { id: ... } objects

  store.guessedAnswers.push(...unrevealedAnswers); // Add all unrevealed objects to guessedAnswers
  // console.log('revealAllAnswers() called from HostDashboard.vue');
  updateGameState(store.$state); // Emit the updated game state
};

const emitStrikeSound = () => {
  buzzerOnlyCount.value++;
  store.buzzerOnlyPressed = true;
  // If a correct was pressed before the buzzer, set a flag
  if (store.correctBeforeBuzzer) {
    store.correctBeforeBuzzer = false; // Reset for next use
    store.correctAfterBuzzer = true; // This triggers the new condition
  }
  socket.emit('play-strike-sound', { sessionId });
};

const logout = () => {
  // Get the player's name and team from localStorage or store
  const playerName = localStorage.getItem('playerName');
  const playerTeam = localStorage.getItem('playerTeam') as 'A' | 'B';

  // Remove from Pinia store
  if (playerName && playerTeam) {
    store.removeTeamMember(playerTeam, playerName);

    // Emit to backend to remove from session data
    socket.emit('remove-team-member', {
      sessionId,
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

// @ts-ignore
const isTest = window.Cypress; // Cypress sets this global variable
useSessionTimeout(logout, isTest ? 1000 : 1800000);

const guessedAnswersCount = computed(() => store.guessedAnswers.length);

const showWhoStartsSection = computed(() => {
  if (store.startingTeamSet) return false;
  // 1. Highest point answer selected
  if (store.highestPointAnswered) return true;
  // 2. Any answer selected after buzzer only
  if (store.buzzerOnlyPressed && store.correctAfterBuzzer) return true;
  // 3. Any 2 answers selected (including highest-point)
  if (guessedAnswersCount.value >= 2) return true;
  // 4. Correct pressed, then buzzer only
  if (store.correctAfterBuzzer) return true;
  return false;
});

const fetchLibraryFiles = async () => {
  const res = await fetch(`${apiBase}/api/answers-library`);
  libraryFiles.value = await res.json();
  showLibraryDialog.value = true;
};

function setShowLibraryDialog(value: boolean) {
  showLibraryDialog.value = value;
}
function resetShowQASection() {
  showQASection.value = false;
}

function parseCsv<T>(
  input: File | string,
  mapRow: (row: any) => T,
  onComplete: (parsed: T[], rawData: any[]) => void,
  onError?: () => void,
) {
  Papa.parse(input, {
    header: true,
    skipEmptyLines: true,
    complete: (results: { data: any[] }) => {
      const mapped = results.data
        .filter((row) => row && Object.values(row).some((v) => v !== undefined && v !== ''))
        .map(mapRow);
      onComplete(mapped.slice(0, 8), results.data); // Only first 8
    },
    error: onError || (() => alert('Failed to parse the CSV file. Please check the format.')),
  });
}

// Load and parse the selected CSV file
const loadLibraryFile = async (filename: string) => {
  try {
    const res = await fetch(`${apiBase}/answers/${encodeURIComponent(filename)}`);
    const csvText = await res.text();
    if (!csvText) {
      alert('The selected CSV file is empty or invalid.');
      return;
    }

    parseCsv(
      csvText,
      (row) => ({
        id: uuidv4(),
        text: row.Answer,
        points: Number(row.Points),
      }),
      (parsedAnswers, rawData) => {
        questionInput.value = rawData[0]?.Question || '';
        answerPairs.value = parsedAnswers;
      },
      () => {
        alert('Failed to parse the selected CSV file.');
      },
    );
  } finally {
    showLibraryDialog.value = false;
  }
};

function handleUpdatedGame(updatedGameState: any) {
  // (`Session ${sessionId} currentStep updated to:`, updatedGameState.currentStep);
  Object.assign(store.$state, updatedGameState);

  isLoading.value = false;

  // Sync "Who Starts" state
  if (store.firstTeam) {
    store.startingTeam = store.firstTeam;
  } else {
    store.startingTeam = null;
  }

  // Sync "Score Multiplier" state
  if (store.scoreMultiplier) {
    selectedMultiplier.value = store.scoreMultiplier;
  } else {
    selectedMultiplier.value = null;
  }

  store.teamNames = { ...store.teamNames, ...updatedGameState.teamNames };
}

function copySessionIdOption(type: 'id' | 'host' | 'team' | 'spectator') {
  let textToCopy = '';
  const baseUrl = window.location.origin;
  if (type === 'id') {
    textToCopy = sessionId || '';
  } else if (type === 'host') {
    textToCopy = `${baseUrl}/host?sessionId=${sessionId}`;
  } else if (type === 'team') {
    textToCopy = `${baseUrl}/team?sessionId=${sessionId}`;
  } else if (type === 'spectator') {
    textToCopy = `${baseUrl}/spectator?sessionId=${sessionId}`;
  }
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      sessionIdBoxText.value = 'Copied!';
      sessionIdBoxState.value = 'copied';
      showSessionIdDialog.value = false;
      setTimeout(() => {
        sessionIdBoxText.value = `🔗  Invite Others`;
        sessionIdBoxState.value = '';
      }, 2000);
    })
    .catch(() => {
      sessionIdBoxText.value = 'Error';
      sessionIdBoxState.value = 'error';
      showSessionIdDialog.value = false;
      setTimeout(() => {
        sessionIdBoxText.value = `🔗  Invite Others`;
        sessionIdBoxState.value = '';
      }, 2000);
    });
}

// Handle errors
socket.on('error', (error: { message: any }) => {
  console.error('Error from backend:', error.message);
  alert(`Error: ${error.message}`);

  // Handle invalid session error
  if (
    error.message === 'Session does not exist.' ||
    error.message === 'No session ID provided.' // Add any other relevant backend error messages
  ) {
    // Redirect to home page
    window.location.href = '/';
  }
});

// Handle connection errors
socket.on('connect_error', (error: any) => {
  console.error('WebSocket connection error:', error);
});

onMounted(() => {
  store.initSocket();

  if (!sessionId) {
    alert('No session ID provided. Please join a valid session.');
    return;
  }

  socket.on('team-names-updated', (teamNames: any) => {
    store.teamNames = { ...store.teamNames, ...teamNames };
  });

  socket.on(
    'team-members-updated',
    (members: { A: never[]; B: never[] } | { A: never[]; B: never[] }) => {
      store.teamMembers = members;
    },
  );

  socket.on('current-state', (currentState: any) => {
    Object.assign(store.$state, currentState); // Update the global store with the current game state

    // Sync "Who Starts" state
    if (store.firstTeam) {
      store.startingTeam = store.firstTeam;
    }

    // Sync "Score Multiplier" state
    if (store.scoreMultiplier) {
      selectedMultiplier.value = store.scoreMultiplier;
    }
  });

  socket.on('update-game', handleUpdatedGame);

  socket.on('connect_error', (error: any) => {
    console.error('WebSocket connection error:', error);
    alert('Failed to connect to the game session. Please try again.');
  });

  socket.emit('join-session', { sessionId });

  socket.emit('get-current-state', { sessionId });

  fetch(`${apiBase}/api/create-session/${sessionId}`, { method: 'POST' });
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  socket.off('update-game', handleUpdatedGame);
  socket.removeAllListeners();
});
</script>

<style scoped>
.container {
  padding: 1rem;
  margin: 1rem;
  border-radius: 0.5rem;
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

.floating-buttons {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 1000;
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

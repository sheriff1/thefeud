<template>
  <div class="host-page flex flex-col items-center my-8">
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
    <InviteModal
      v-model="showSessionIdDialog"
      title="🔗 Invite Others"
      :options="inviteOptions"
      @select="copySessionIdOption"
    />

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
      v-model:presets="timerPresets"
      :timeUp="timeUp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gamestore';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';
import InviteModal, { type InviteOption } from '../components/InviteModal.vue';
import FloatingButton from '../components/teamDisplay/FloatingButton.vue';
import ActiveGameInfoMgr from '../components/hostDashboard/ActiveGameInfoMgr.vue';
import TimerMgr from '../components/hostDashboard/TimerMgr.vue';
import GameMgr from '../components/hostDashboard/GameMgr.vue';
import ManualOverrideMgr from '../components/hostDashboard/ManualOverrideMgr.vue';
import { useRouter } from 'vue-router';
import { useSessionTimeout, resolveSessionTimeoutMs } from '@/composables/useSessionTimeout';
import { useSessionSync } from '@/composables/useSessionSync';
import { useLogout } from '@/composables/useLogout';
import { getSessionId } from '@/composables/getSessionId';
import { useInviteLinks } from '@/composables/useInviteLinks';
import { useCountdown } from '@/composables/useCountdown';
import { loadTimerPresets, saveTimerPresets } from '../utils/timerPresets';
import { decideTimerAction } from '../utils/timerStepDecision';
import { leaveGoneSession, isSessionGone, resetSessionGoneGuard } from '../utils/sessionGone';
import { changedTeamNames, type TeamNames } from '../utils/teamNames';
const router = useRouter();

const sessionId = getSessionId(); // from the URL query params
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
const showAvailableAnswers = ref(false); // Track whether to show the Available Answers section
const correctCount = ref(0);
const buzzerOnlyCount = ref(0);
const isLoading = ref(false);
const showQASection = ref(false);
const showSessionIdDialog = ref(false);
const inviteOptions: InviteOption[] = [
  { label: 'Copy Session ID', type: 'id' },
  { label: 'Invite Host Link', type: 'host' },
  { label: 'Invite Team Member Link', type: 'team' },
  { label: 'Invite Spectator Link', type: 'spectator' },
];
const { sessionIdBoxText, sessionIdBoxState, copyInvite } = useInviteLinks(sessionId);

const isTeamNamesUnique = computed(() => {
  return store.teamNames.A.trim().toLowerCase() !== store.teamNames.B.trim().toLowerCase();
});

// The team names as the server last sent them (#133). The host sends only the names it changed,
// so a player's rename of the other team is never undone by a stale copy.
let serverTeamNames: TeamNames = { A: 'A', B: 'B' };
const rememberServerTeamNames = (names?: Partial<TeamNames>) => {
  if (names) serverTeamNames = { ...serverTeamNames, ...names };
};
const sendTeamNames = (edited: Partial<TeamNames>) => {
  const patch = changedTeamNames(serverTeamNames, edited);
  if (patch && sessionId) socket.emit('update-team-names', { sessionId, teamNames: patch });
};

const updateGameState = (gameState: any) => {
  if (!sessionId) {
    alert('Session ID is missing. Cannot update game state.');
    return;
  }
  //console.log('-------- updateGameState called in parent -------- ', gameState);
  socket.emit('update-game', { sessionId, gameState });
};

const handleUpload = (event: Event): Promise<boolean> => {
  return new Promise((resolve) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return resolve(false);

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      alert('Please upload a valid CSV file.');
      return resolve(false);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);

      const expectedHeader = 'Question,Answer,Points';
      if (lines[0].trim() !== expectedHeader) {
        alert(`CSV header must be exactly: ${expectedHeader}`);
        return resolve(false);
      }

      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length !== 3) {
          alert(`Row ${i + 1} is invalid. Each row must have exactly 3 columns.`);
          return resolve(false);
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
      resolve(true);
    };
    reader.readAsText(file);
  });
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
  // update-game no longer carries team names to the stored session (#133)
  sendTeamNames({ A: 'A', B: 'B' });
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

const timerPresets = ref(loadTimerPresets());
watch(timerPresets, (presets) => saveTimerPresets(presets), { deep: true });
const timeUp = ref(false); // the timer ran out by itself; cleared by the next start or reset

// Counts down from a wall-clock end time and tells everyone through update-game (#17).
const countdown = useCountdown({
  now: () => Date.now(),
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clearInterval: (id) => window.clearInterval(id as number),
  getRemaining: () => store.timer,
  setRemaining: (seconds) => store.setTimer(seconds),
  setRunning: (running) => (running ? store.startTimer() : store.stopTimer()),
  onChange: () => updateGameState(store.$state),
  onExpire: () => {
    timeUp.value = true;
  },
});

const startTimer = () => {
  timeUp.value = false;
  countdown.start();
};

function stopTimer() {
  countdown.stop();
  store.stopTimer(); // also clears a stale "running" flag restored after a reload
}

const resetTimer = () => {
  stopTimer();
  timeUp.value = false;
  store.resetTimer();
  timerInput.value = 0;
  updateGameState(store.$state); // Emit the updated game state
};

// Auto-start the preset timer when the game moves forward into the buzzer or guessing step,
// and stop it when that step is left. Reload-safe: see decideTimerAction.
watch(
  () => store.currentStep,
  (next, prev) => {
    const decision = decideTimerAction(prev, next, timerPresets.value);
    if (decision.action === 'stop') {
      stopTimer();
    } else if (decision.action === 'start') {
      stopTimer();
      timeUp.value = false;
      store.setTimer(decision.seconds);
      countdown.start();
    }
  },
  // Synchronous, so the timer is already set when GameMgr sends the new step right after
  // assigning it; both updates then carry the same timer and the backend cannot reorder them
  // into a stale "timer 0" state.
  { flush: 'sync' },
);

// After a host reload the backend can still say "running": pick the countdown back up once.
let resumeChecked = false;
watch(
  () => store.timerRunning,
  (running) => {
    if (!running || resumeChecked) return;
    resumeChecked = true;
    if (!countdown.isActive() && store.timer > 0) countdown.start();
  },
  { immediate: true },
);

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
  // The names also stay in gameState2: the schema requires them and an older backend still
  // applies them from update-game.
  sendTeamNames({ A: trimmedTeamAName, B: trimmedTeamBName });
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

const logout = useLogout({ socket, store, router, sessionId: () => sessionId });

useSessionTimeout(logout, resolveSessionTimeoutMs());

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
  rememberServerTeamNames(updatedGameState.teamNames);
}

async function copySessionIdOption(type: 'id' | 'host' | 'team' | 'spectator') {
  await copyInvite(type);
  showSessionIdDialog.value = false;
}

// Handle errors
socket.on('error', (error: { message: any }) => {
  console.error('Error from backend:', error.message);
  if (isSessionGone(error)) {
    leaveGoneSession(router, store);
    return;
  }
  alert(`Error: ${error.message}`);
});

onMounted(async () => {
  store.initSocket();
  resetSessionGoneGuard();

  if (!sessionId) {
    alert('No session ID provided. Please join a valid session.');
    return;
  }

  socket.on('team-names-updated', (teamNames: any) => {
    store.teamNames = { ...store.teamNames, ...teamNames };
    rememberServerTeamNames(teamNames);
  });

  socket.on(
    'team-members-updated',
    (members: { A: never[]; B: never[] } | { A: never[]; B: never[] }) => {
      store.teamMembers = members;
    },
  );

  socket.on('current-state', (currentState: any) => {
    Object.assign(store.$state, currentState); // Update the global store with the current game state
    rememberServerTeamNames(currentState.teamNames);

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

  // Create the session first, so join-session can never be answered with "Session does not
  // exist" for a brand-new host session (#113). A 400 means the ID itself is invalid.
  try {
    const res = await fetch(`${apiBase}/api/create-session/${sessionId}`, { method: 'POST' });
    if (res.status === 400) {
      leaveGoneSession(router, store);
      return;
    }
  } catch {
    // Network error (e.g. the backend is waking up): join anyway; <ConnectionBanner /> shows it.
  }

  // Join the room and fetch state now and after every (re)connect; connection problems are
  // surfaced by <ConnectionBanner /> instead of an alert.
  useSessionSync(sessionId, { teamMembers: true });
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  countdown.dispose();
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

/* Phones (#131): the floating buttons join the page flow, forms stack, and controls reach 44px.
   Child components are reached with :deep so each of them keeps its desktop styles untouched. */
@media (max-width: 767px) {
  .host-page h1 {
    text-align: center;
    padding: 0 1rem;
  }
  .container {
    margin: 0.5rem;
    padding: 0.75rem;
    /* Tailwind's `container` caps the width at 640px from 640px up; a landscape phone is wider. */
    max-width: none;
  }
  .floating-buttons {
    position: static;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    padding: 0.5rem 0.5rem 0.75rem;
  }
  .host-page :deep(.btn),
  .host-page :deep(.input),
  .host-page :deep(.file-input) {
    min-height: 44px;
  }
  .host-page :deep(.btn-circle) {
    width: 44px;
    min-width: 44px;
  }
  .host-page :deep(a.link) {
    display: inline-block;
    padding: 0.6rem 0;
  }
  /* Rows that put a label next to a field stack on phones. */
  .host-page :deep(.form-row) {
    flex-direction: column;
    align-items: stretch;
  }
  .host-page :deep(.form-row label),
  .host-page :deep(.form-row > div),
  .host-page :deep(.form-row input) {
    width: 100%;
  }
  /* Whole rows are the tap target for toggles and radio buttons. */
  .host-page :deep(label:has(input[type='checkbox'])),
  .host-page :deep(label:has(input[type='radio'])) {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}
</style>

<template>
  <div class="container bg-base-300 text-base-content">
    <h3 class="mb-4">Game Manager</h3>
    <ul class="steps text-xs w-full">
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 1 }">Start</li>
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 2 }">Q&A</li>
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 3 }">Multiplier</li>
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 4 }">Buzzer</li>
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 5 }">Who Starts</li>
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 6 }">Guessing</li>
      <li class="step" :class="{ 'step-primary': gameStore.currentStep >= 7 }">Award</li>
    </ul>

    <div class="divider"></div>

    <!-- 1. Start Next Round -->
    <div v-if="gameStore.currentStep === 1">
      <h4 class="mb-4">Let's get started!</h4>
      <button class="btn btn-primary" @click="startRoundStep">Start Round</button>
    </div>

    <!-- 2. Add Question & Answers -->
    <div v-else-if="gameStore.currentStep === 2">
      <h4 class="mb-4">Add Question & Answers</h4>
      <!-- File Upload -->
      <div v-if="!showQASection" class="flex flex-col my-4 p-4 rounded bg-base-100">
        <h5 class="mb-4">Select a method to add questions and answers:</h5>
        <div class="flex flex-row flex-wrap md:flex-row flex-col gap-4 w-full justify-stretch">
          <!-- Select from library -->
          <button class="btn flex-1 min-w-[160px]" @click="fetchLibraryFiles">
            Select from library
          </button>
          <!-- Upload CSV File -->
          <button class="btn flex-1 min-w-[160px]" @click="showCsvUpload = true">
            Upload CSV File
          </button>
          <!-- Enter manually -->
          <button class="btn flex-1 min-w-[160px]" @click="emit('update:showQASection', true)">
            Enter manually
          </button>
        </div>

        <!-- CSV Upload Modal/Card -->
        <div
          v-if="showCsvUpload"
          class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
        >
          <div class="card bg-base-100 shadow-xl p-8 w-96 relative">
            <button
              class="btn btn-sm btn-circle absolute right-2 top-2"
              @click="showCsvUpload = false"
            >
              ✕
            </button>
            <h5 class="mb-4 text-lg font-semibold">Upload CSV File</h5>
            <label for="file-upload" class="mb-2 block">Choose a CSV file:</label>
            <input
              type="file"
              id="file-upload"
              class="file-input file-input-bordered w-full mb-4"
              @change="onCsvFileChange"
            />
            <div v-if="csvUploadError" class="text-error mb-2">{{ csvUploadError }}</div>
            <a :href="`${apiBase}/answers/Sample Template.csv`" download class="link link-primary">
              Download Template
            </a>
          </div>
        </div>
      </div>

      <!-- Library Dialog -->
      <div v-if="showLibraryDialog" class="library-dialog-backdrop">
        <div
          class="library-dialog bg-base-100 p-8 rounded-lg shadow-xl w-[500px] max-w-full mx-auto"
        >
          <h5 class="mb-4 text-xl font-semibold text-center">Select a Question Set</h5>
          <ul class="library-grid">
            <li v-for="file in libraryFiles" :key="file">
              <button
                class="btn library-btn text-sm break-words"
                @click="
                  () => {
                    loadLibraryFile(file);
                    emit('update:showQASection', true);
                  }
                "
              >
                {{ file.replace(/\.csv$/i, '') }}
              </button>
            </li>
          </ul>
          <button class="btn btn-block mt-4" @click="closeLibraryDialog">Cancel</button>
        </div>
      </div>

      <div v-if="showQASection" class="p-4 bg-base-100 rounded">
        <!-- Question Input -->
        <button
          class="btn btn-sm btn-soft btn-outline flex items-center gap-2 mb-4"
          @click="emit('update:showQASection', false)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Change method
        </button>
        <div>
          <div class="form-row mb-4 flex flex-col">
            <label class="text-lg font-medium" for="question-input">Question</label>
            <input
              type="text"
              id="question-input"
              class="input validator"
              required
              placeholder="Enter the question here"
              :value="questionInput"
              @input="
                (e: Event) => emit('update:questionInput', (e.target as HTMLInputElement).value)
              "
              :disabled="gameStore.questionSaved"
            />
            <div class="validator-hint text-xs">{{ questionError }}</div>
          </div>
        </div>
        <div class="divider"></div>
        <!-- Answers Management -->
        <div>
          <h5>Answers</h5>
          <div v-if="answerPairs.length === 0" class="no-answers-message">
            No answers added yet. Upload CSV or press "Add Answer" below to start adding answers. At
            least 2 answers are required to save.
          </div>
          <div v-for="(pair, index) in answerPairs" :key="index" class="answer-pair">
            <label :for="'answer-' + index">Answer:</label>
            <input
              type="text"
              :id="'answer-' + index"
              class="input validator"
              required
              minlength="1"
              :placeholder="'Enter answer ' + (index + 1)"
              v-model="pair.text"
              :disabled="gameStore.answersSaved"
            />
            <div class="validator-hint text-xs">Cannot be blank</div>
            <label :for="'points-' + index">Points:</label>
            <input
              type="number"
              :id="'points-' + index"
              class="input validator"
              required
              v-model.number="pair.points"
              :disabled="gameStore.answersSaved"
              min="1"
              step="1"
              @input="onPointsInput($event, index)"
            />
            <div class="validator-hint text-xs" v-if="pair.points < 1">Cannot be less than 1</div>
            <button class="btn" @click="removeAnswerPair(index)" :disabled="gameStore.answersSaved">
              Remove
            </button>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              class="btn success"
              @click="addAnswerPair"
              :disabled="gameStore.answersSaved || answerPairs.length >= 8"
            >
              Add Answer
            </button>
            <button
              class="btn"
              @click="removeAllAnswers"
              :disabled="gameStore.answersSaved || answerPairs.length === 0"
            >
              Remove All Answers
            </button>
          </div>
        </div>
        <div class="divider"></div>
        <!-- Save Both Question and Answers -->
        <button
          class="btn btn-primary"
          @click="saveQuestionAndAnswersStep"
          :disabled="
            !isFormValid ||
            (gameStore.questionSaved && gameStore.answersSaved) ||
            answerPairs.length < 1
          "
        >
          Save Question and Answers
        </button>
      </div>
    </div>

    <!-- 3. Set Round Multiplier -->
    <div class="flex flex-col gap-2" v-else-if="gameStore.currentStep === 3">
      <h4 class="mb-4">Set Round Multiplier</h4>
      <div class="join mb-4">
        <input
          type="radio"
          v-for="mult in [1, 2, 3]"
          :key="mult"
          class="btn join-item"
          v-model="selectedMultiplier"
          :value="mult"
          :aria-label="`${mult}x`"
        />
      </div>
      <button
        class="btn btn-primary self-start"
        @click="() => confirmMultiplierStep(selectedMultiplier)"
      >
        Confirm
      </button>
    </div>

    <!-- 4. Start Buzzer Round -->
    <div v-else-if="gameStore.currentStep === 4">
      <h4 class="mb-4">Buzzer Round:</h4>
      <div v-if="gameStore.buzzedPlayer" role="alert" class="alert alert-success alert-soft mb-4">
        <span>🚨 - {{ gameStore.buzzedPlayer }} buzzed in!</span>
      </div>
      <h5>Question:</h5>
      <p>{{ gameStore.question }}</p>
      <div class="divider"></div>
      <h5>Available Answers:</h5>
      <ul>
        <li
          v-for="answer in gameStore.answers"
          :key="answer.id"
          class="flex items-center gap-4 mb-2"
        >
          <span
            class="flex-1"
            :style="{
              textDecoration: gameStore.guessedAnswers
                .map((a) => String(a.id))
                .includes(String(answer.id))
                ? 'line-through'
                : 'none',
            }"
          >
            {{ answer.text }} ({{ answer.points }} pts)
          </span>
          <button
            class="btn btn-accent"
            v-if="
              !gameStore.guessedAnswers.map((a) => String(a.id)).includes(String(answer.id)) &&
              !gameStore.roundOver
            "
            @click="
              () => {
                handleCorrectGuess && handleCorrectGuess(String(answer.id));
                nextTick(() => {
                  startBuzzerRoundStep();
                });
              }
            "
          >
            Correct
          </button>
        </li>
      </ul>
      <button
        class="btn btn-error"
        v-if="
          gameStore.answersSaved &&
          gameStore.multiplierSet &&
          !gameStore.startingTeamSet &&
          !gameStore.roundOver
        "
        @click="
          () => {
            props.emitStrikeSound && props.emitStrikeSound();
            nextTick(() => {
              gameStore.buzzerOnlyPressed = true;
              startBuzzerRoundStep();
            });
          }
        "
      >
        Incorrect (buzzer only)
      </button>
    </div>

    <!-- 5. Set Who Starts -->
    <div v-else-if="gameStore.currentStep === 5">
      <h4 class="mb-4">Who Starts?</h4>
      <p class="mb-4">Select the team that will play first in the guessing round:</p>
      <div class="flex flex-row flex-wrap md:flex-row flex-col gap-2 items-center">
        <button
          class="btn btn-wide flex-1 min-w-[160px]"
          @click="confirmStartingTeamStep('A')"
          :disabled="gameStore.startingTeamSet"
        >
          {{ gameStore.teamNames.A }}
        </button>
        <button
          class="btn btn-wide flex-1 min-w-[160px]"
          @click="confirmStartingTeamStep('B')"
          :disabled="gameStore.startingTeamSet"
        >
          {{ gameStore.teamNames.B }}
        </button>
      </div>
    </div>

    <!-- 6. Start Guessing Round (Mark Guesses) -->
    <div v-else-if="gameStore.currentStep === 6">
      <h4 class="mb-4">Guessing Round:</h4>
      <h5>Question:</h5>
      <p>{{ gameStore.question }}</p>

      <div class="divider"></div>
      <h5>Available Answers:</h5>
      <ul>
        <li
          v-for="answer in gameStore.answers"
          :key="answer.id"
          class="flex items-center gap-4 mb-2"
        >
          <span
            class="flex-1"
            :style="{
              textDecoration: gameStore.guessedAnswers
                .map((a) => String(a.id))
                .includes(String(answer.id))
                ? 'line-through'
                : 'none',
            }"
          >
            {{ answer.text }} ({{ answer.points }} pts)
          </span>
          <!-- Correct Button: Only show if round is not over -->
          <button
            class="btn btn-accent"
            v-if="
              !gameStore.guessedAnswers.map((a) => String(a.id)).includes(String(answer.id)) &&
              !gameStore.roundOver
            "
            @click="
              () => {
                handleCorrectGuess && handleCorrectGuess(String(answer.id));
                props.updateGameState(gameStore.$state);
              }
            "
          >
            Correct
          </button>
        </li>
      </ul>
      <!-- Incorrect Button -->
      <button
        class="btn btn-error"
        v-if="
          gameStore.answersSaved &&
          gameStore.multiplierSet &&
          gameStore.startingTeamSet &&
          !gameStore.roundOver
        "
        @click="
          () => {
            handleIncorrectAndStrike && handleIncorrectAndStrike();
            props.updateGameState(gameStore.$state);
          }
        "
      >
        Incorrect
      </button>
    </div>

    <!-- 7. Award Points Static State -->
    <div v-else-if="gameStore.currentStep === 7">
      <h4 class="mb-4">Points Awarded</h4>
      <p class="mb-4">
        Team {{ gameStore.winningTeam }} earned {{ gameStore.pointsAwarded }} points!
      </p>
      <div>
        <h5>Current Scores</h5>
        <div v-for="(score, team) in gameStore.teamScores" :key="team">{{ team }}: {{ score }}</div>
      </div>
      <div class="mt-2">
        <button
          class="btn btn-primary mr-2"
          @click="
            () => {
              startNextRound();
              emit('update:showQASection', false);
            }
          "
        >
          Start Next Round
        </button>
        <!-- Reveal All Answers Button -->
        <button
          class="btn"
          v-if="gameStore.roundOver"
          :disabled="gameStore.guessedAnswers.length == gameStore.answers.length"
          @click="revealAllAnswers"
        >
          {{
            gameStore.guessedAnswers.length == gameStore.answers.length
              ? 'All Answers Revealed'
              : 'Reveal All Answers'
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Project variables
const apiBase = import.meta.env.VITE_API_BASE || '';

// State management
import { ref, computed, nextTick } from 'vue';
import { useGameStore } from '../../stores/gamestore';
const gameStore = useGameStore();
const showCsvUpload = ref(false);
const csvUploadError = ref('');

// Props
interface GameMgrProps {
  updateGameState: (state: any) => void;
  nextRound: () => void;
  /* --- currentStep = 2 --- */
  handleUpload: (event: Event) => Promise<boolean>;
  fetchLibraryFiles: () => void;
  showLibraryDialog: boolean;
  libraryFiles: string[];
  loadLibraryFile: (fileName: string) => void;
  setShowLibraryDialog?: (show: boolean) => void;
  questionInput: string;
  answerPairs: { text: string; points: number }[];
  removeAnswerPair: (index: number) => void;
  addAnswerPair: () => void;
  removeAllAnswers: () => void;
  saveQuestionAndAnswers: () => void;
  showQASection: boolean;
  /* --- currentStep = 3 --- */
  setMultiplier: (multiplier: number) => void;
  /* --- currentStep = 4 --- */
  handleCorrectGuess?: (answerId: string) => void;
  handleIncorrectAndStrike?: () => void;
  emitStrikeSound?: () => void;
  // roundOver: boolean;
  /* --- currentStep = 5 --- */
  showWhoStartsSection?: boolean;
  setStartingTeam: (team: string) => void;
  /* --- currentStep = 6 --- */
  /* --- currentStep = 7 --- */
  revealAllAnswers: () => void;
  /* --- currentStep = TBD --- */
}
interface GameMgrEmits {
  (e: 'update:questionInput', value: string): void;
  (e: 'update:showQASection', value: boolean): void;
}
const props = defineProps<GameMgrProps>();
const emit = defineEmits<GameMgrEmits>();

// Local variables
const awardedTeam = ref<string | null>(null);
const awardedPoints = ref<number>(0);
const selectedMultiplier = ref<number>(1);

// Handlers for transitions
function startRoundStep() {
  gameStore.currentStep = 2;
  // console.log('startRoundStep() called from GamgeMgr.vue');
  props.updateGameState(gameStore.$state);
}

function saveQuestionAndAnswersStep() {
  props.saveQuestionAndAnswers();
  gameStore.currentStep = 3;
  // console.log('saveQuestionAndAnswersStep() called from GamgeMgr.vue');
  props.updateGameState(gameStore.$state);
}

function confirmMultiplierStep(multiplier: number) {
  props.setMultiplier(multiplier);
  gameStore.currentStep = 4;
  // console.log('confirmMultiplierStep() called from GamgeMgr.vue');
  props.updateGameState(gameStore.$state);
}

function startBuzzerRoundStep() {
  if (
    gameStore.highestPointAnswered ||
    (gameStore.buzzerOnlyPressed && gameStore.correctAfterBuzzer) ||
    gameStore.guessedAnswers.length >= 2 ||
    gameStore.correctAfterBuzzer
  ) {
    gameStore.currentStep = 5;
    // console.log('startBuzzerRoundStep() condition met in GamgeMgr.vue');
  }
  props.updateGameState(gameStore.$state);
}

function confirmStartingTeamStep(startingTeam: string) {
  props.setStartingTeam(startingTeam);
  gameStore.currentStep = 6;
  // console.log('confirmStartingTeamStep() called from GamgeMgr.vue');
  props.updateGameState(gameStore.$state);
}

function startNextRound() {
  awardedTeam.value = null;
  awardedPoints.value = 0;
  props.nextRound();
  props.updateGameState(gameStore.$state);
}

/* ---- helper functions ---- */

/* --- currentStep = 2 --- */
function closeLibraryDialog() {
  if (props.setShowLibraryDialog) {
    props.setShowLibraryDialog(false);
  }
}
const questionError = computed(() => {
  if (!props.questionInput.trim()) return 'Question cannot be empty.';
  return '';
});
const answersError = computed(() => {
  if (props.answerPairs.length < 2) return 'At least 2 answers are required.';
  for (const [i, pair] of props.answerPairs.entries()) {
    if (!pair || typeof pair.text !== 'string' || pair.text.trim() === '')
      return `Answer ${i + 1} cannot be empty.`;
    if (isNaN(pair.points) || pair.points < 1 || !Number.isInteger(pair.points))
      return `Points for answer ${i + 1} must be an integer greater than 0.`;
  }
  return '';
});
function onPointsInput(event: Event, idx: number) {
  const value = Math.floor(Number((event.target as HTMLInputElement).value));
  if (isNaN(value) || value < 1) {
    props.answerPairs[idx].points = 1;
  } else {
    props.answerPairs[idx].points = value;
  }
}
async function onCsvFileChange(e: Event) {
  csvUploadError.value = '';
  const result = await props.handleUpload(e);
  if (result === true) {
    emit('update:showQASection', true);
    showCsvUpload.value = false;
  } else {
    csvUploadError.value = 'Invalid CSV file. Please try again.';
    // Clear the file input so user can re-upload the same file
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
    input?.focus();
  }
}
const isFormValid = computed(() => !questionError.value && !answersError.value);

/* --- currentStep = 3 --- */
/* --- currentStep = 4 --- */
/* --- currentStep = 5 --- */
/* --- currentStep = 6 --- */
/* --- currentStep = 7 --- */
</script>

<style scoped>
.no-answers-message {
  color: #555;
  font-size: 1rem;
  margin-bottom: 12px;
  font-style: italic;
}

.library-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.library-dialog {
  padding: 2rem;
  border-radius: 12px;
  min-width: 300px;
  max-width: 90vw;
  /* Set height to 60% of viewport height */
  height: 60vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.library-dialog ul {
  list-style: none;
  padding: 0;
  margin: 0;
  /* Make the list scrollable if it overflows */
  overflow-y: auto;
  flex: 1 1 auto;
}

.library-dialog li {
  margin-bottom: 1rem;
}

.answer-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.error-message {
  color: #d32f2f;
  font-size: 0.95rem;
  margin-top: 4px;
}
.answer-pair input {
  padding: 4px;
  width: 150px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.library-btn {
  aspect-ratio: 1 / 1;
  width: 100%;
  min-width: 0;
  min-height: 80px;
  font-size: 0.875rem; /* text-sm */
  word-break: break-word;
  white-space: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Responsive: Stack fields vertically on small screens */
@media (max-width: 600px) {
  .answer-pair {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .answer-pair input,
  .answer-pair label,
  .answer-pair button {
    width: 100%;
    min-width: 0;
  }
  .library-grid {
    grid-template-columns: 1fr;
  }
  .library-dialog {
    width: 95vw;
    min-width: 0;
  }
}
</style>

<script setup lang="ts">
// Project variables
const apiBase = import.meta.env.VITE_API_BASE || '';

// State management
import { ref, computed, nextTick } from 'vue';
import { useGameStore } from '../../stores/gamestore';
const gameStore = useGameStore();

// Props
interface GameMgrProps {
  updateGameState: (state: any) => void;
  nextRound: () => void;
  /* --- currentStep = 2 --- */
  handleUpload: (event: Event) => void;
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
  console.log('startRoundStep() called from GamgeMgr.vue');
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
  console.log('confirmMultiplierStep() called from GamgeMgr.vue');
  props.updateGameState(gameStore.$state);
}

function startBuzzerRoundStep() {
  console.log('startBuzzerRoundStep() called from GamgeMgr.vue');
  if (
    gameStore.highestPointAnswered ||
    (gameStore.buzzerOnlyPressed && gameStore.correctAfterBuzzer) ||
    gameStore.guessedAnswers.length >= 2 ||
    gameStore.correctAfterBuzzer
  ) {
    gameStore.currentStep = 5;
    console.log('startBuzzerRoundStep() condition met in GamgeMgr.vue');
  }
  props.updateGameState(gameStore.$state);
}

function confirmStartingTeamStep(startingTeam: string) {
  props.setStartingTeam(startingTeam);
  gameStore.currentStep = 6;
  console.log('confirmStartingTeamStep() called from GamgeMgr.vue');
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
    if (isNaN(pair.points) || pair.points < 2 || !Number.isInteger(pair.points))
      return `Points for answer ${i + 1} must be an integer greater than 1.`;
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
const isFormValid = computed(() => !questionError.value && !answersError.value);

/* --- currentStep = 3 --- */
/* --- currentStep = 4 --- */
/* --- currentStep = 5 --- */
/* --- currentStep = 6 --- */
/* --- currentStep = 7 --- */
</script>

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
      <div class="flex flex-col my-4 p-4 rounded bg-base-100">
        <button class="btn" @click="fetchLibraryFiles">Select From Library</button>
        <div class="divider">OR</div>
        <label for="file-upload">Upload CSV File:</label>
        <input id="file-upload" type="file" class="file-input" @change="handleUpload" />
        <div class="divider">OR</div>
        <a :href="`${apiBase}/answers/Sample Template.csv`" download>Download Template</a>
      </div>

      <!-- Library Dialog -->
      <div v-if="showLibraryDialog" class="library-dialog-backdrop">
        <div class="library-dialog bg-base-100">
          <h5>Select a Question Set</h5>
          <ul class="flex flex-col overflow-y-auto">
            <li v-for="file in libraryFiles" :key="file">
              <button class="btn w-full block" @click="loadLibraryFile(file)">
                {{ file.replace(/\.csv$/i, '') }}
              </button>
            </li>
          </ul>
          <button class="btn" @click="closeLibraryDialog">Cancel</button>
        </div>
      </div>

      <!-- Question Input -->
      <div>
        <div class="form-row mb-4 flex flex-col gap-2">
          <label class="text-xl font-medium" for="question-input">Question</label>
          <input
            id="question-input"
            type="text"
            class="input"
            :value="questionInput"
            @input="
              (e: Event) => emit('update:questionInput', (e.target as HTMLInputElement).value)
            "
            :disabled="gameStore.questionSaved"
          />
        </div>
        <div v-if="questionError" class="error-message">{{ questionError }}</div>
      </div>
      <div class="divider"></div>
      <!-- Answers Management -->
      <div>
        <h5>Answers</h5>
        <div v-if="answersError" class="error-message">{{ answersError }}</div>
        <div v-if="answerPairs.length === 0" class="no-answers-message">
          No answers added yet. Upload CSV or press "Add Answer" below to start adding answers. At
          least 2 answers are required to save.
        </div>
        <div v-for="(pair, index) in answerPairs" :key="index" class="answer-pair">
          <label :for="'answer-' + index">Answer:</label>
          <input
            :id="'answer-' + index"
            type="text"
            class="input"
            v-model="pair.text"
            :disabled="gameStore.answersSaved"
          />
          <label :for="'points-' + index">Points:</label>
          <input
            :id="'points-' + index"
            type="number"
            class="input"
            v-model.number="pair.points"
            :disabled="gameStore.answersSaved"
            min="1"
            step="1"
            @input="onPointsInput($event, index)"
          />
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

    <!-- 3. Set Round Multiplier -->
    <div class="flex flex-col gap-2" v-else-if="gameStore.currentStep === 3">
      <h4 class="mb-4">Set Round Multiplier</h4>
      <div class="join mb-4">
        <input
          v-for="mult in [1, 2, 3]"
          :key="mult"
          type="radio"
          class="btn join-item"
          v-model="selectedMultiplier"
          :value="mult"
          :aria-label="`${mult}x`"
        />
      </div>
      <button class="btn btn-primary" @click="() => confirmMultiplierStep(selectedMultiplier)">
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
      <div class="flex gap-2 items-center">
        <button
          class="btn btn-wide"
          @click="confirmStartingTeamStep('A')"
          :disabled="gameStore.startingTeamSet"
        >
          {{ gameStore.teamNames.A }}
        </button>
        <div class="divider divider-horizontal divider-secondary">OR</div>
        <button
          class="btn btn-wide"
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
        <button class="btn btn-primary mr-2" @click="startNextRound">Start Next Round</button>
        <!-- Reveal All Answers Button -->
        <button class="btn" v-if="gameStore.roundOver" @click="revealAllAnswers">
          Reveal All Answers
        </button>
      </div>
    </div>
  </div>
</template>

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
}

.answer-pair input {
  padding: 4px;
  width: 150px;
}
</style>

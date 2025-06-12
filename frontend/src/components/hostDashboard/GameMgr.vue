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
  // console.log('Starting Buzzer Round Step');
  // console.log('props.highestPointAnswered: ', gameStore.highestPointAnswered);
  // console.log('props.correctAfterBuzzer: ', gameStore.correctAfterBuzzer);
  // console.log('props.buzzerOnlyPressed: ', gameStore.buzzerOnlyPressed);
  // console.log('props.guessedAnswersCount >= 2?: ', gameStore.guessedAnswersCount >= 2);
  // console.log('props.correctAfterBuzzer: ', gameStore.correctAfterBuzzer);

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
  <div class="container question-answers-container">
    <!-- 1. Start Next Round -->
    <div v-if="gameStore.currentStep === 1">
      <h3>Let's get started!</h3>
      <button @click="startRoundStep">Start Round</button>
    </div>

    <!-- 2. Add Question & Answers -->
    <div v-else-if="gameStore.currentStep === 2">
      <h3>Add Question & Answers</h3>
      <!-- File Upload -->
      <div>
        <label for="file-upload">Upload CSV File:</label>
        <input id="file-upload" type="file" @change="handleUpload" />
        <button class="btn" @click="fetchLibraryFiles">Select from library</button>
      </div>

      <!-- Library Dialog -->
      <div v-if="showLibraryDialog" class="library-dialog-backdrop">
        <div class="library-dialog">
          <h4>Select a Question Set</h4>
          <ul>
            <li v-for="file in libraryFiles" :key="file">
              <button class="btn" @click="loadLibraryFile(file)">
                {{ file.replace(/\.csv$/i, '') }}
              </button>
            </li>
          </ul>
          <button class="btn" @click="closeLibraryDialog">Cancel</button>
        </div>
      </div>

      <!-- Question Input -->
      <div>
        <h4>Question</h4>
        <label for="question-input">Question:</label>
        <input
          id="question-input"
          type="text"
          :value="questionInput"
          @input="(e: Event) => emit('update:questionInput', (e.target as HTMLInputElement).value)"
          :disabled="gameStore.questionSaved"
        />
        <div v-if="questionError" class="error-message">{{ questionError }}</div>
      </div>

      <!-- Answers Management -->
      <div>
        <h4>Answers</h4>
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
            v-model="pair.text"
            :disabled="gameStore.answersSaved"
          />
          <label :for="'points-' + index">Points:</label>
          <input
            :id="'points-' + index"
            type="number"
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

      <!-- Save Both Question and Answers -->
      <button
        class="btn primary"
        @click="saveQuestionAndAnswersStep"
        :disabled="
          !isFormValid ||
          (gameStore.questionSaved && gameStore.answersSaved) ||
          answerPairs.length < 1
        "
      >
        Save Question and Answers
      </button>
      <!-- Download Template Button -->
      <a :href="`${apiBase}/answers/Sample Template.csv`" download class="btn">Download Template</a>
    </div>

    <!-- 3. Set Round Multiplier -->
    <div v-else-if="gameStore.currentStep === 3">
      <h3>Set Round Multiplier</h3>
      <div>
        <label v-for="mult in [1, 2, 3]" :key="mult">
          <input type="radio" v-model="selectedMultiplier" :value="mult" />
          x{{ mult }}
        </label>
      </div>
      <button @click="() => confirmMultiplierStep(selectedMultiplier)">Confirm</button>
    </div>

    <!-- 4. Start Buzzer Round -->
    <div v-else-if="gameStore.currentStep === 4">
      <h3>Buzzer Round:</h3>
      <p>{{ gameStore.question }}</p>
      <h4>Available Answers</h4>
      <ul>
        <li v-for="answer in gameStore.answers" :key="answer.id">
          <span
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
            class="btn"
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
        class="btn"
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
      <h3>Who Starts?</h3>
      <p v-if="gameStore.startingTeamSet && gameStore.startingTeam">
        Starting Team: {{ gameStore.teamNames[gameStore.startingTeam as 'A' | 'B'] }}
      </p>
      <button
        class="btn"
        @click="confirmStartingTeamStep('A')"
        :disabled="gameStore.startingTeamSet"
      >
        {{ gameStore.teamNames.A }}
      </button>
      <button
        class="btn"
        @click="confirmStartingTeamStep('B')"
        :disabled="gameStore.startingTeamSet"
      >
        {{ gameStore.teamNames.B }}
      </button>
    </div>

    <!-- 6. Start Guessing Round (Mark Guesses) -->
    <div v-else-if="gameStore.currentStep === 6">
      <h3>Guessing Round:</h3>
      <p>{{ gameStore.question }}</p>
      <h4>Available Answers</h4>
      <ul>
        <li v-for="answer in gameStore.answers" :key="answer.id">
          <span
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
            class="btn"
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
        class="btn"
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
      <h3>Points Awarded</h3>
      <div v-if="awardedTeam">{{ awardedTeam }} earned {{ awardedPoints }} points!</div>
      <div>
        <h4>Current Scores</h4>
        <div v-for="(score, team) in gameStore.teamScores" :key="team">{{ team }}: {{ score }}</div>
      </div>
      <button @click="startNextRound">Start next round</button>
    </div>
  </div>
</template>

<style scoped>
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
  background: #fff;
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

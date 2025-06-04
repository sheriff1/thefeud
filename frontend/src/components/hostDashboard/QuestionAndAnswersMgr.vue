<template>
  <div class="container question-answers-container">
    <h3>Manage Question and Answers</h3>

    <!-- Who Starts Section -->
    <div v-if="showWhoStartsSection">
      <h4>Who Starts?</h4>
      <p v-if="startingTeamSet">Starting Team: {{ teamNames[startingTeam] }}</p>
      <button class="btn" @click="setStartingTeam('A')" :disabled="startingTeamSet">
        {{ teamNames.A }}
      </button>
      <button class="btn" @click="setStartingTeam('B')" :disabled="startingTeamSet">
        {{ teamNames.B }}
      </button>
    </div>

    <!-- Manage Question and Answers Section -->
    <template v-if="currentStep === 'manage'">
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
          :disabled="questionSaved"
        />
      </div>

      <!-- Answers Management -->
      <div>
        <h4>Answers</h4>
        <div v-if="answerPairs.length === 0" class="no-answers-message">
          No answers added yet. Upload CSV or press "Add Answer" below to start adding answers. At
          least 2 answers are required to save.
        </div>
        <div v-for="(pair, index) in answerPairs" :key="index" class="answer-pair">
          <label :for="'answer-' + index">Answer:</label>
          <input :id="'answer-' + index" type="text" v-model="pair.text" :disabled="answersSaved" />
          <label :for="'points-' + index">Points:</label>
          <input
            :id="'points-' + index"
            type="number"
            v-model.number="pair.points"
            :disabled="answersSaved"
          />
          <button class="btn" @click="removeAnswerPair(index)" :disabled="answersSaved">
            Remove
          </button>
        </div>
        <button
          class="btn success"
          @click="addAnswerPair"
          :disabled="answersSaved || answerPairs.length >= 8"
        >
          Add Answer
        </button>
        <button
          class="btn"
          @click="removeAllAnswers"
          :disabled="answersSaved || answerPairs.length === 0"
        >
          Remove All Answers
        </button>
      </div>

      <!-- Save Both Question and Answers -->
      <button
        class="btn primary"
        @click="saveQuestionAndAnswers"
        :disabled="(questionSaved && answersSaved) || answerPairs.length < 1"
      >
        Save Question and Answers
      </button>
      <!-- Download Template Button -->
      <a href="/answers/family-feud-template.csv" download class="btn">Download Template</a>
    </template>

    <!-- Set Score Multiplier Section -->
    <template v-if="currentStep === 'multiplier'">
      <h4>Set Score Multiplier</h4>
      <p v-if="multiplierSet">Score Multiplier: {{ selectedMultiplier }}x</p>
      <button class="btn" @click="setMultiplier(1)" :disabled="multiplierSet">1x</button>
      <button class="btn" @click="setMultiplier(2)" :disabled="multiplierSet">2x</button>
      <button class="btn" @click="setMultiplier(3)" :disabled="multiplierSet">3x</button>
    </template>

    <!-- Available Answers Section -->
    <template v-if="currentStep === 'answers'">
      <h4>Current Question:</h4>
      <p>{{ question }}</p>
      <h4>Available Answers</h4>
      <ul>
        <li v-for="answer in answers" :key="answer.id">
          <span
            :style="{
              textDecoration: guessedAnswers.map((a) => String(a.id)).includes(String(answer.id))
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
              !guessedAnswers.map((a) => String(a.id)).includes(String(answer.id)) && !roundOver
            "
            @click="props.handleCorrectGuess && props.handleCorrectGuess(Number(answer.id))"
          >
            Correct
          </button>
        </li>
      </ul>
      <!-- Incorrect Button -->
      <button
        class="btn"
        v-if="answersSaved && multiplierSet && startingTeamSet && !roundOver"
        @click="handleIncorrectAndStrike"
      >
        Incorrect
      </button>
      <button
        class="btn"
        v-if="answersSaved && multiplierSet && !startingTeamSet && !roundOver"
        @click="emitStrikeSound"
      >
        Incorrect (buzzer only)
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
interface QuestionAndAnswersMgrProps {
  startingTeamSet: boolean;
  startingTeam: string;
  teamNames: Record<string, string>;
  setStartingTeam: (team: string) => void;
  currentStep: 'manage' | 'multiplier' | 'answers';
  handleUpload: (event: Event) => void;
  fetchLibraryFiles: () => void;
  showLibraryDialog: boolean;
  libraryFiles: string[];
  loadLibraryFile: (fileName: string) => void;
  questionInput: string;
  questionSaved: boolean;
  answerPairs: { text: string; points: number }[];
  answersSaved: boolean;
  removeAnswerPair: (index: number) => void;
  addAnswerPair: () => void;
  removeAllAnswers: () => void;
  saveQuestionAndAnswers: () => void;
  selectedMultiplier: number;
  multiplierSet: boolean;
  setMultiplier: (multiplier: number) => void;
  question: string;
  answers: { id: string; text: string; points: number }[];
  guessedAnswers: { id: string; text: string; points: number }[];
  roundOver: boolean;
  showWhoStartsSection?: boolean;
  handleCorrectGuess?: (answerId: number) => void;
  handleIncorrectAndStrike?: () => void;
  emitStrikeSound?: () => void;
  revealAllAnswers?: () => void;
  setShowLibraryDialog?: (show: boolean) => void;
}
interface QuestionAndAnswersMgrEmits {
  (e: 'update:questionInput', value: string): void;
}

// Props
const props = defineProps<QuestionAndAnswersMgrProps>();

const emit = defineEmits<QuestionAndAnswersMgrEmits>();

function closeLibraryDialog() {
  if (props.setShowLibraryDialog) {
    props.setShowLibraryDialog(false);
  }
}
</script>

<style>
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

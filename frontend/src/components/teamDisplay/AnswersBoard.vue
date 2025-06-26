<template>
  <div v-if="answers.length > 0" class="container bg-base-300 text-base-content answers-container">
    <!-- Question Display -->
    <transition name="fade-x">
      <div v-if="localShowStrikeX" class="strike-x-overlay">
        <div class="strike-x-container">
          <span
            v-for="(x, index) in strikeCount"
            :key="index"
            class="strike-x"
            :style="{ animationDelay: `${index * 0.2}s` }"
          >
            X
          </span>
        </div>
      </div>
    </transition>

    <div class="question-display">
      <h3>{{ question }}</h3>
    </div>

    <!-- Answers Grid -->
    <div class="answers-grid">
      <div v-for="(answer, index) in answers" :key="answer.id" class="answer-box">
        <!-- Hidden Answer (Blue Box) -->
        <div v-if="!guessedAnswers.map((a) => a.id).includes(String(answer.id))" class="blue-box">
          <span class="answer-number-circle">{{ index + 1 }}</span>
        </div>

        <!-- Revealed Answer with Flip Animation -->
        <div v-else class="revealed-answer flip-animation">
          <span class="answer-text">{{ answer.text.toUpperCase() }}</span>
          <span class="answer-points-box">{{ answer.points }}</span>
        </div>
      </div>
    </div>
  </div>
  <p v-else class="no-answers-message">No answers available yet.</p>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface AnswerBoardProps {
  answers: { id: string; text: string; points: number }[];
  question: string;
  guessedAnswers: { id: string }[]; // updated
  showStrikeX: boolean;
  strikeCount: number;
}

const props = defineProps<AnswerBoardProps>();
const emit = defineEmits(['strikeX']); // <-- use array of event names

const localShowStrikeX = ref(false);
watch(
  () => props.showStrikeX,
  (newVal) => {
    if (newVal) {
      localShowStrikeX.value = true;
      setTimeout(() => {
        localShowStrikeX.value = false;
        emit('strikeX');
      }, 1200);
    } else {
      localShowStrikeX.value = false;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.answers-container {
  display: flex;
  flex-direction: column; /* Stack the question and answers vertically */
  gap: 16px; /* Space between the question and the answers grid */
  padding: 16px;
  background-color: #e0f3ff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.question-display {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(4, auto); /* 4 rows to force 4 items per column */
  grid-auto-flow: column;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
}

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
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  container-type: inline-size;
}

.answer-box:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

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

.revealed-answer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  background-color: #003f83;
  color: white;
  border-radius: 8px;
  padding-left: 12px;
  font-size: 2rem;
  font-weight: bold;
  text-align: left;
  font-family: 'Bebas Neue', Arial, sans-serif;
  overflow: hidden;
}

.flip-animation {
  animation: flipIn 0.6s ease-in-out;
}

.answer-text {
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(2rem, 8cqw, 3rem); /* Responsive font size */
  font-family: 'Bebas Neue', Arial, sans-serif;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
}

.answer-points-box {
  background-color: #007bff;
  color: white;
  border-left: 4px solid #fff;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  min-width: 0.5rem;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 8px 8px 0;
  margin-left: 12px;
  padding: 0 1rem;
  height: 100%;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

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
.strike-x-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.strike-x-container {
  display: flex;
  gap: 2vw;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.strike-x {
  font-size: 8vw;
  color: #e53935;
  font-weight: bold;
  text-shadow:
    0 0 30px #e53935,
    0 0 10px #fff;
  border: 6px solid #e53935;
  border-radius: 16px;
  padding: 1.5vw 3vw;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 40px #e53935;
  animation: strikeXAppear 0.6s ease-out forwards;
  opacity: 0;
  transform: scale(0.3) rotate(-15deg);
}

@keyframes strikeXAppear {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-15deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.fade-x-enter-active,
.fade-x-leave-active {
  transition: opacity 0.5s;
}
.fade-x-enter-from,
.fade-x-leave-to {
  opacity: 0;
}
.fade-x-enter-to,
.fade-x-leave-from {
  opacity: 1;
}

/* Responsive: 1 column on tablet or smaller */
@media (max-width: 980px) {
  .answers-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-flow: row;
  }

  .strike-x {
    font-size: 12vw;
    padding: 2vw 4vw;
    border: 4px solid #e53935;
  }

  .strike-x-container {
    gap: 3vw;
  }
}
</style>

<template>
  <div class="container reset-container">
    <h3>Game Controls</h3>
    <button class="btn" @click="handleResetGame" :disabled="isLoading">Reset Game</button>
    <button class="btn" @click="handleResetRound" :disabled="isLoading">Reset Round</button>
    <button class="btn" @click="handleNextRound" :disabled="!roundOver || isLoading">
      Next Round
    </button>
  </div>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  resetGame: Function,
  resetRound: Function,
  nextRound: Function,
  roundOver: Boolean,
  isLoading: Boolean,
});

function handleResetGame() {
  props.resetGame();
}
function handleResetRound() {
  props.resetRound();
}
function handleNextRound() {
  props.nextRound();
}

// Watch for resetGame and resetRound events to handle any additional logic
watch(
  () => props.resetGame,
  (newVal) => {
    if (newVal) {
      // Handle any additional logic when the game is reset
      console.log('Game has been reset');
    }
  },
);

watch(
  () => props.resetRound,
  (newVal) => {
    if (newVal) {
      // Handle any additional logic when the round is reset
      console.log('Round has been reset');
    }
  },
);

watch(
  () => props.nextRound,
  (newVal) => {
    if (newVal) {
      // Handle any additional logic when moving to the next round
      console.log('Moving to the next round');
    }
  },
);
</script>

<style scoped>
.reset-container {
  background-color: #ffc4c4;
}
</style>

<template>
  <div class="container reset-container">
    <h3>Game Controls</h3>
    <button class="btn" @click="props.resetGame()" :disabled="isLoading">Reset Game</button>
    <button class="btn" @click="props.resetRound()" :disabled="isLoading">Reset Round</button>
    <button class="btn" @click="props.nextRound()" :disabled="!roundOver || isLoading">
      Next Round
    </button>
  </div>
</template>

<script setup lang="ts">
interface GameStatusMgrProps {
  resetGame: () => void;
  resetRound: () => void;
  nextRound: () => void;
  roundOver: boolean;
  isLoading: boolean;
}

const props = defineProps<GameStatusMgrProps>();
</script>

<style scoped>
.reset-container {
  background-color: #ffc4c4;
}
</style>

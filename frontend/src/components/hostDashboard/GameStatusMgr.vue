<template>
  <div class="container bg-base-300 text-base-content">
    <h3>Game Controls</h3>
    <button
      class="btn"
      @click="
        () => {
          props.resetGame();
          props.updateGameState(gameStore.$state);
        }
      "
      :disabled="isLoading"
    >
      Reset Game
    </button>
    <button
      class="btn"
      @click="
        () => {
          props.resetRound();
          props.updateGameState(gameStore.$state);
        }
      "
      :disabled="isLoading"
    >
      Reset Round
    </button>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gamestore';
const gameStore = useGameStore();

interface GameStatusMgrProps {
  updateGameState: (state: any) => void;
  resetGame: () => void;
  resetRound: () => void;
  isLoading: boolean;
}

const props = defineProps<GameStatusMgrProps>();
</script>

<style scoped></style>

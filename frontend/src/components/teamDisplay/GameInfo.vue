<template>
  <div class="game-info-container">
    <!-- Round Counter -->
    <div class="game-info-item">
      <div class="game-info-value">{{ formattedRoundCounter }}</div>
      <div class="game-info-label">Round</div>
    </div>
    <!-- Timer Display -->
    <div class="game-info-item">
      <div class="game-info-value">{{ formattedTimer }}</div>
      <div class="game-info-label">Time Remaining</div>
    </div>
    <!-- Points Pool -->
    <div class="game-info-item">
      <div class="game-info-value">{{ formattedPointPool }}</div>
      <div class="game-info-label">Points Pool</div>
    </div>
    <!-- Score Multiplier -->
    <div class="game-info-item">
      <div class="game-info-value">{{ formattedScoreMultiplier }}</div>
      <div class="game-info-label">Score Multiplier</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface GameInfoProps {
  roundCounter: number;
  timer: number; // in seconds
  pointPool: number;
  scoreMultiplier: number | null; // null if not set
}

const props = defineProps<GameInfoProps>();

// Computed properties for displaying values
const formattedRoundCounter = computed(() => props.roundCounter.toString());
const formattedTimer = computed(() => {
  const minutes = Math.floor(props.timer / 60);
  const seconds = props.timer % 60;
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
});
const formattedPointPool = computed(() => props.pointPool.toLocaleString());
const formattedScoreMultiplier = computed(() =>
  props.scoreMultiplier == null ? 'x' : `x${props.scoreMultiplier}`,
);
</script>

<style scoped>
/* Game Info Container Styles */
.game-info-container {
  display: flex; /* Use flexbox for horizontal layout */
  justify-content: space-around; /* Space out the items evenly */
  align-items: center; /* Align items vertically in the center */
  margin-top: 16px;
  padding: 16px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}
/* Game Info Item Styles */
.game-info-item {
  display: flex;
  flex-direction: column; /* Stack value and label vertically */
  align-items: center; /* Center align the content */
  margin: 0 16px; /* Add horizontal spacing between items */
}
.game-info-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}
.game-info-label {
  font-size: 0.75rem;
  color: #555;
  margin-top: 4px; /* Space between value and label */
}
</style>

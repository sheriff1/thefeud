<template>
  <div class="container game-info-container">
    <h3>Active Game Info</h3>

    <!-- Team Strike Counts -->
    <p>
      <span class="info-key">{{ gameStore.teamNames.A }} Strikes:</span>
      {{ gameStore.teamStrikes.A }}
    </p>
    <p>
      <span class="info-key">{{ gameStore.teamNames.B }} Strikes:</span>
      {{ gameStore.teamStrikes.B }}
    </p>
    <p>
      <span class="info-key">{{ gameStore.teamNames.A }} Score:</span>
      {{ gameStore.teamScores.A }}
    </p>
    <p>
      <span class="info-key">{{ gameStore.teamNames.B }} Score:</span>
      {{ gameStore.teamScores.B }}
    </p>

    <p><span class="info-key">Current Round:</span> {{ gameStore.roundCounter }}</p>
    <p>
      <span class="info-key">Current Team:</span>
      {{ gameStore.teamNames[gameStore.currentTeam] }}
    </p>
    <p><span class="info-key">Points Pool:</span> {{ gameStore.pointPool }}</p>
    <p>
      <span class="info-key">Score Multiplier:</span>
      {{ gameStore.scoreMultiplier }}x
    </p>

    <!-- Reveal All Answers Button -->
    <button class="btn" v-if="gameStore.roundOver" @click="revealAllAnswers">
      Reveal All Answers
    </button>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gamestore';
const gameStore = useGameStore();
interface ActiveGameInfoMgrProps {
  revealAllAnswers: () => void;
}

defineProps<ActiveGameInfoMgrProps>();
</script>

<style scoped></style>

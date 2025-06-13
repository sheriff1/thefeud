<template>
  <div class="container bg-base-300 text-base-content">
    <h3>Manual Overrides</h3>
    <div class="form-row my-4 flex items-center gap-2">
      <label :for="'team-a-score'" class="w-32">
        <span class="info-key">{{ gameStore.teamNames.A }} Points:</span>
      </label>
      <input
        id="team-a-score"
        type="number"
        class="input"
        v-model.number="gameStore.teamScores.A"
        min="0"
        step="1"
      />
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label :for="'team-b-score'" class="w-32">
        <span class="info-key">{{ gameStore.teamNames.B }} Points:</span>
      </label>
      <input
        id="team-b-score"
        type="number"
        class="input"
        v-model.number="gameStore.teamScores.B"
        min="0"
        step="1"
      />
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="round-counter" class="w-32">
        <span class="info-key">Round:</span>
      </label>
      <input
        id="round-counter"
        type="number"
        class="input"
        v-model.number="gameStore.roundCounter"
        min="0"
        step="1"
      />
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="score-multiplier" class="w-32">
        <span class="info-key">Score Multiplier:</span>
      </label>
      <input
        id="score-multiplier"
        type="number"
        class="input"
        v-model.number="gameStore.scoreMultiplier"
        min="1"
        max="3"
      />
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="team-a-name" class="w-32">
        <span class="info-key">Team A Name:</span>
      </label>
      <input
        id="team-a-name"
        type="text"
        class="input"
        v-model="gameStore.teamNames.A"
        placeholder="Enter Team A Name"
      />
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="team-b-name" class="w-32">
        <span class="info-key">Team B Name:</span>
      </label>
      <input
        id="team-b-name"
        type="text"
        class="input"
        v-model="gameStore.teamNames.B"
        placeholder="Enter Team B Name"
      />
    </div>
    <p v-if="!isTeamNamesUnique" class="error-message">Team names must be unique.</p>
    <div v-if="!teamScoresValid" class="error-message">
      Team points must be nonnegative integers.
    </div>
    <div v-if="!roundCounterValid" class="error-message">Round must be a nonnegative integer.</div>

    <div class="flex gap-2">
      <button
        class="btn btn-soft btn-info"
        @click="
          () => {
            saveScoreMgmt();
          }
        "
        :disabled="!canSave"
      >
        Save All
      </button>
      <button
        class="btn btn-soft btn-warning"
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
      <button
        class="btn btn-soft btn-error"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gamestore';

interface ManualOverrideMgrProps {
  updateGameState: (state: any) => void;
  isTeamNamesUnique: boolean;
  resetGame: () => void;
  resetRound: () => void;
  isLoading: boolean;
}

const props = defineProps<ManualOverrideMgrProps>();

const emit = defineEmits<{
  'update:teamNames': [Record<string, string>];
  'update:teamScores': [Record<string, number>];
  'update:roundCounter': [number | string];
  'update:scoreMultiplier': [number | string];
  saveScoreMgmt: [];
}>();

// Use two-way binding for v-model
const gameStore = useGameStore();

function saveScoreMgmt() {
  emit('saveScoreMgmt');
}

const teamScoresValid = computed(
  () =>
    Number.isInteger(gameStore.teamScores.A) &&
    gameStore.teamScores.A >= 0 &&
    Number.isInteger(gameStore.teamScores.B) &&
    gameStore.teamScores.B >= 0,
);

const roundCounterValid = computed(
  () => Number.isInteger(Number(gameStore.roundCounter)) && Number(gameStore.roundCounter) >= 0,
);

const canSave = computed(
  () => props.isTeamNamesUnique && teamScoresValid.value && roundCounterValid.value,
);
</script>

<style scoped>
.error-message {
  color: #d32f2f;
  font-size: 0.95rem;
  margin-top: 4px;
}
</style>

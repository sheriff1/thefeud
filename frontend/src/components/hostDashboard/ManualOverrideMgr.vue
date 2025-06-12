<template>
  <div class="container score-container">
    <h3>Manual Overrides</h3>
    <div class="form-row">
      <label :for="'team-a-score'">
        <span class="info-key">{{ gameStore.teamNames.A }} Points:</span>
      </label>
      <input
        id="team-a-score"
        type="number"
        v-model.number="gameStore.teamScores.A"
        min="0"
        step="1"
      />
    </div>
    <div class="form-row">
      <label :for="'team-b-score'">
        <span class="info-key">{{ gameStore.teamNames.B }} Points:</span>
      </label>
      <input
        id="team-b-score"
        type="number"
        v-model.number="gameStore.teamScores.B"
        min="0"
        step="1"
      />
    </div>
    <div class="form-row">
      <label for="round-counter">
        <span class="info-key">Round:</span>
      </label>
      <input
        id="round-counter"
        type="number"
        v-model.number="gameStore.roundCounter"
        min="0"
        step="1"
      />
    </div>
    <div class="form-row">
      <label for="score-multiplier">
        <span class="info-key">Score Multiplier:</span>
      </label>
      <input
        id="score-multiplier"
        type="number"
        v-model.number="gameStore.scoreMultiplier"
        min="1"
        max="3"
      />
    </div>
    <div class="form-row">
      <label for="team-a-name">
        <span class="info-key">Team A Name:</span>
      </label>
      <input
        id="team-a-name"
        type="text"
        v-model="gameStore.teamNames.A"
        placeholder="Enter Team A Name"
      />
    </div>
    <div class="form-row">
      <label for="team-b-name">
        <span class="info-key">Team B Name:</span>
      </label>
      <input
        id="team-b-name"
        type="text"
        v-model="gameStore.teamNames.B"
        placeholder="Enter Team B Name"
      />
    </div>
    <p v-if="!isTeamNamesUnique" class="error-message">Team names must be unique.</p>
    <div v-if="!teamScoresValid" class="error-message">
      Team points must be nonnegative integers.
    </div>
    <div v-if="!roundCounterValid" class="error-message">Round must be a nonnegative integer.</div>
    <button
      class="btn"
      @click="
        () => {
          saveScoreMgmt();
        }
      "
      :disabled="!canSave"
    >
      Save All
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gamestore';

interface ManualOverrideMgrProps {
  updateGameState: (state: any) => void;
  isTeamNamesUnique: boolean;
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

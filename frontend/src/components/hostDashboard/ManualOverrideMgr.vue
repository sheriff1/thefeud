<template>
  <div class="container bg-base-300 text-base-content">
    <h3>Manual Overrides</h3>
    <div class="form-row my-4 flex items-center gap-2">
      <label :for="'team-a-score'" class="w-32">
        <span class="info-key">{{ gameStore.teamNames.A }} Points:</span>
      </label>
      <div class="flex flex-col">
        <input
          type="number"
          id="team-a-score"
          class="input validator"
          v-model.number="gameStore.teamScores.A"
          min="0"
          step="1"
          @keydown="preventNonNumeric"
        />
        <div class="validator-hint text-xs hidden" v-if="gameStore.teamScores.A < 0">
          Cannot be less than 0
        </div>
      </div>
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label :for="'team-b-score'" class="w-32">
        <span class="info-key">{{ gameStore.teamNames.B }} Points:</span>
      </label>
      <div class="flex flex-col">
        <input
          type="number"
          id="team-b-score"
          class="input validator"
          v-model.number="gameStore.teamScores.B"
          min="0"
          step="1"
          @keydown="preventNonNumeric"
        />
        <div class="validator-hint text-xs hidden" v-if="gameStore.teamScores.B < 0">
          Cannot be less than 0
        </div>
      </div>
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="round-counter" class="w-32">
        <span class="info-key">Round:</span>
      </label>
      <div class="flex flex-col">
        <input
          type="number"
          id="round-counter"
          class="input validator"
          v-model.number="gameStore.roundCounter"
          min="0"
          step="1"
          @keydown="preventNonNumeric"
        />
        <div class="validator-hint text-xs hidden" v-if="gameStore.roundCounter < 0">
          Cannot be less than 0
        </div>
      </div>
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="score-multiplier" class="w-32">
        <span class="info-key">Score Multiplier:</span>
      </label>
      <div class="flex flex-col">
        <input
          type="number"
          id="score-multiplier"
          class="input validator"
          v-model.number="gameStore.scoreMultiplier"
          min="1"
          max="3"
          @keydown="preventNonNumeric"
        />
        <div
          class="validator-hint text-xs hidden"
          v-if="
            gameStore.scoreMultiplier !== null &&
            (gameStore.scoreMultiplier < 1 || gameStore.scoreMultiplier > 3)
          "
        >
          Multiplier has to be between 1 and 3
        </div>
      </div>
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="team-a-name" class="w-32">
        <span class="info-key">Team A Name:</span>
      </label>

      <div class="flex flex-col">
        <input
          type="text"
          id="team-a-name"
          class="input validator"
          required
          minlength="1"
          v-model="gameStore.teamNames.A"
          placeholder="Enter Team A Name"
        />
        <div class="validator-hint text-xs hidden">Cannot be blank</div>
      </div>
    </div>
    <div class="form-row mb-4 flex items-center gap-2">
      <label for="team-b-name" class="w-32">
        <span class="info-key">Team B Name:</span>
      </label>
      <div class="flex flex-col">
        <input
          type="text"
          id="team-b-name"
          class="input validator"
          required
          minlength="1"
          v-model="gameStore.teamNames.B"
          placeholder="Enter Team B Name"
        />
        <div class="validator-hint text-xs hidden">Cannot be blank</div>
      </div>
    </div>

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
            emit('resetShowQASection');
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
            emit('resetShowQASection');
            props.updateGameState(gameStore.$state);
          }
        "
        :disabled="isLoading"
      >
        Reset Game
      </button>
    </div>

    <div v-if="!(gameStore.teamNames.A !== gameStore.teamNames.B)" class="mt-2 text-error text-xs">
      Team names must be unique.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gamestore';
import { preventNonNumeric } from '@/composables/preventNonNumeric';

interface ManualOverrideMgrProps {
  updateGameState: (state: any) => void;
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
  resetShowQASection: [];
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

const teamNamesValid = computed(
  () =>
    gameStore.teamNames.A.trim() !== '' &&
    gameStore.teamNames.B.trim() !== '' &&
    gameStore.teamNames.A !== gameStore.teamNames.B,
);

const canSave = computed(
  () => teamNamesValid.value && teamScoresValid.value && roundCounterValid.value,
);
</script>

<style scoped></style>

<template>
  <div class="container score-container">
    <h3>Manual Overrides</h3>
    <div class="form-row">
      <label :for="'team-a-score'">
        <span class="info-key">{{ teamNames.A }} Points:</span>
      </label>
      <input
        id="team-a-score"
        type="number"
        v-model.number="localTeamScores.A"
        @input="onTeamScoresInput(localTeamScores)"
      />
    </div>
    <div class="form-row">
      <label :for="'team-b-score'">
        <span class="info-key">{{ teamNames.B }} Points:</span>
      </label>
      <input
        id="team-b-score"
        type="number"
        v-model.number="localTeamScores.B"
        @input="onTeamScoresInput(localTeamScores)"
      />
    </div>
    <div class="form-row">
      <label for="round-counter">
        <span class="info-key">Round:</span>
      </label>
      <input
        id="round-counter"
        type="number"
        v-model.number="localRoundCounter"
        @input="onRoundCounterInput(localRoundCounter)"
      />
    </div>
    <div class="form-row">
      <label for="score-multiplier">
        <span class="info-key">Score Multiplier:</span>
      </label>
      <input
        id="score-multiplier"
        type="number"
        v-model.number="localScoreMultiplier"
        min="1"
        max="3"
        @input="onScoreMultiplierInput(localScoreMultiplier)"
      />
    </div>
    <div class="form-row">
      <label for="team-a-name">
        <span class="info-key">Team A Name (doesn't work currently 😬):</span>
      </label>
      <input
        id="team-a-name"
        type="text"
        v-model="teamNames.A"
        placeholder="Enter Team A Name"
        @input="onTeamNamesInput({ ...teamNames, A: ($event.target as HTMLInputElement).value })"
      />
    </div>
    <div class="form-row">
      <label for="team-b-name">
        <span class="info-key">Team B Name (doesn't work currently 😬):</span>
      </label>
      <input
        id="team-b-name"
        type="text"
        v-model="teamNames.B"
        placeholder="Enter Team B Name"
        @input="onTeamNamesInput({ ...teamNames, B: ($event.target as HTMLInputElement).value })"
      />
    </div>
    <p v-if="!isTeamNamesUnique" class="error-message">Team names must be unique.</p>
    <button class="btn" @click="saveScoreMgmt" :disabled="!isTeamNamesUnique">Save All</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs } from 'vue';

interface ManualOverrideMgrProps {
  teamNames: Record<string, string>;
  teamScores: Record<string, number>;
  roundCounter: number | string;
  scoreMultiplier: number | string;
  isTeamNamesUnique: boolean;
}

interface ManualOverrideMgrEmits {
  (e: 'update:teamNames', teamNames: Record<string, string>): void;
  (e: 'update:teamScores', teamScores: Record<string, number>): void;
  (e: 'update:roundCounter', roundCounter: number | string): void;
  (e: 'update:scoreMultiplier', scoreMultiplier: number | string): void;
  (e: 'saveScoreMgmt'): void;
}

const props = defineProps<ManualOverrideMgrProps>();

const emit = defineEmits<ManualOverrideMgrEmits>();

// Use two-way binding for v-model
const { teamNames } = toRefs(props);

const localScoreMultiplier = ref(props.scoreMultiplier);
// const localTeamNames = ref(props.teamNames);
const localTeamScores = ref(props.teamScores);
const localRoundCounter = ref(props.roundCounter);

watch(
  () => props.scoreMultiplier,
  (val) => {
    localScoreMultiplier.value = val;
  },
);

function onScoreMultiplierInput(val: number | string) {
  emit('update:scoreMultiplier', val);
}
function onTeamNamesInput(val: Record<string, string>) {
  emit('update:teamNames', val);
}

function onTeamScoresInput(val: Record<string, number>) {
  emit('update:teamScores', val);
}

function onRoundCounterInput(val: number | string) {
  emit('update:roundCounter', val);
}

watch(
  () => props.teamScores,
  (val) => {
    localTeamScores.value = val;
  },
);

watch(
  () => props.roundCounter,
  (val) => {
    localRoundCounter.value = val;
  },
);

function saveScoreMgmt() {
  emit('saveScoreMgmt');
}
</script>

<style scoped>
/* You can copy the relevant styles from HostDashboard.vue */
</style>

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
        @input="onTeamNamesInput({ ...teamNames, A: $event.target.value })"
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
        @input="onTeamNamesInput({ ...teamNames, B: $event.target.value })"
      />
    </div>
    <p v-if="!isTeamNamesUnique" class="error-message">Team names must be unique.</p>
    <button class="btn" @click="saveScoreMgmt" :disabled="!isTeamNamesUnique">Save All</button>
  </div>
</template>

<script setup>
import { ref, watch, toRefs } from 'vue';

const props = defineProps({
  teamNames: { type: Object, required: true },
  teamScores: { type: Object, required: true },
  roundCounter: { type: [Number, String], required: true },
  scoreMultiplier: { type: [Number, String], required: true },
  isTeamNamesUnique: { type: Boolean, required: true },
});

const emit = defineEmits([
  'update:teamNames',
  'update:teamScores',
  'update:roundCounter',
  'update:scoreMultiplier',
  'saveScoreMgmt',
]);

// Use two-way binding for v-model
const { teamNames, teamScores, roundCounter, scoreMultiplier } = toRefs(props);

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

function onScoreMultiplierInput(val) {
  emit('update:scoreMultiplier', val);
}

// watch(
//   () => props.teamNames,
//   (val) => {
//     localTeamNames.value = val;
//   },
// );

function onTeamNamesInput(val) {
  emit('update:teamNames', val);
}

watch(
  () => props.teamScores,
  (val) => {
    localTeamScores.value = val;
  },
);

function onTeamScoresInput(val) {
  emit('update:teamScores', val);
}

watch(
  () => props.roundCounter,
  (val) => {
    localRoundCounter.value = val;
  },
);

function onRoundCounterInput(val) {
  emit('update:roundCounter', val);
}

function saveScoreMgmt() {
  emit('saveScoreMgmt');
}
</script>

<style scoped>
/* You can copy the relevant styles from HostDashboard.vue */
</style>

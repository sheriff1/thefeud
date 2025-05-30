<template>
  <div class="container game-info-container">
    <h3>Active Game Info</h3>

    <!-- Team Strike Counts -->
    <p>
      <span class="info-key">{{ teamNames.A }} Strikes:</span>
      {{ teamStrikes.A }}
    </p>
    <p>
      <span class="info-key">{{ teamNames.B }} Strikes:</span>
      {{ teamStrikes.B }}
    </p>
    <p>
      <span class="info-key">{{ teamNames.A }} Score:</span>
      {{ teamScores.A }}
    </p>
    <p>
      <span class="info-key">{{ teamNames.B }} Score:</span>
      {{ teamScores.B }}
    </p>

    <p><span class="info-key">Current Round:</span> {{ roundCounter }}</p>
    <p>
      <span class="info-key">Current Team:</span>
      {{ teamNames[currentTeam] }}
    </p>
    <p><span class="info-key">Points Pool:</span> {{ pointPool }}</p>
    <p>
      <span class="info-key">Score Multiplier:</span>
      {{ scoreMultiplier }}x
    </p>

    <!-- Reveal All Answers Button -->
    <button class="btn" v-if="roundOver" @click="revealAllAnswers">Reveal All Answers</button>
  </div>
</template>

<script setup>
const props = defineProps({
  teamNames: Object,
  teamStrikes: Object,
  teamScores: Object,
  roundCounter: Number,
  currentTeam: String,
  pointPool: Number,
  roundOver: Boolean,
  scoreMultiplier: Number,
  revealAllAnswers: Function,
});
</script>

<style scoped></style>

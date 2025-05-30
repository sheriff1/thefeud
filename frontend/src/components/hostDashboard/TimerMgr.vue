<template>
  <div class="container timer-container">
    <h3>Timer</h3>
    <label for="timer-input">Set Timer (seconds):</label>
    <input
      id="timer-input"
      type="number"
      :value="timerInput"
      @input="(e) => emit('update:timerInput', Number(e.target.value))"
      @change="setTimer"
    />
    <div>
      <p>Current Timer: {{ timer }} seconds</p>
      <p v-if="timerRunning">Timer is running...</p>
      <p v-else>Timer is stopped.</p>
      <button class="btn" @click="startTimer">Start</button>
      <button class="btn" @click="stopTimer">Stop</button>
      <button class="btn" @click="resetTimer">Reset</button>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  timerRunning: Boolean,
  timer: Number,
  timerInput: Number,
  startTimer: Function,
  stopTimer: Function,
  resetTimer: Function,
  setTimer: Function,
});

const emit = defineEmits(['update:timerInput']);
</script>

<style scoped></style>

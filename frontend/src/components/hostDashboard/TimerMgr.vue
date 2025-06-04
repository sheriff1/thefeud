<template>
  <div class="container timer-container">
    <h3>Timer</h3>
    <label for="timer-input">Set Timer (seconds):</label>
    <input
      id="timer-input"
      type="number"
      :value="timerInput"
      @input="onTimerInput"
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

<script setup lang="ts">
interface TimerMgrProps {
  timerRunning: boolean;
  timer: number;
  timerInput: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setTimer: () => void;
}
interface TimerMgrEmits {
  (e: 'update:timerInput', value: number): void;
}

const props = defineProps<TimerMgrProps>();

const emit = defineEmits<TimerMgrEmits>();

function onTimerInput(e: Event) {
  const value = Number((e.target as HTMLInputElement).value);
  emit('update:timerInput', value);
}
</script>

<style scoped></style>

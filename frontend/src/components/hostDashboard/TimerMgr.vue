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
      min="0"
      step="1"
    />
    <div v-if="!timerValid" class="error-message">Timer value must be positive.</div>
    <div>
      <p>Current Timer: {{ timer }} seconds</p>
      <p v-if="timerRunning">Timer is running...</p>
      <p v-else>Timer is stopped.</p>
      <button class="btn" @click="startTimer" :disabled="!timerValid">Start</button>
      <button class="btn" @click="stopTimer" :disabled="!timerValid">Stop</button>
      <button class="btn" @click="resetTimer" :disabled="!timerValid">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

const timerValid = computed(() => props.timerInput > 0);
</script>

<style scoped></style>

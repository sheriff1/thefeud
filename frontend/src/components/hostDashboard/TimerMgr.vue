<template>
  <div class="container bg-base-300 text-base-content">
    <h3>Timer</h3>
    <label for="timer-input" class="w-32">Set Timer (seconds):</label>
    <input
      id="timer-input"
      type="number"
      class="input"
      :value="timerInput"
      @input="onTimerInput"
      @change="setTimer"
      min="0"
      step="1"
    />
    <div v-if="!timerValid" class="error-message">Timer value must be positive.</div>
    <div>
      <p>Current Timer: {{ gameStore.timer }} seconds</p>
      <p v-if="gameStore.timerRunning">Timer is running...</p>
      <p v-else>Timer is stopped.</p>
      <div class="join">
        <button
          class="btn btn-soft btn-success join-item"
          @click="startTimer"
          :disabled="!timerValid"
        >
          Start
        </button>
        <button class="btn btn-soft join-item" @click="stopTimer" :disabled="!timerValid">
          Stop
        </button>
        <button
          class="btn btn-soft btn-error join-item"
          @click="resetTimer"
          :disabled="!timerValid"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gamestore';
const gameStore = useGameStore();

interface TimerMgrProps {
  timerInput: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setTimer: () => void;
}

const props = defineProps<TimerMgrProps>();

const emit = defineEmits<{
  'update:timerInput': [number];
}>();

function onTimerInput(e: Event) {
  const value = Number((e.target as HTMLInputElement).value);
  emit('update:timerInput', value);
}

const timerValid = computed(() => props.timerInput > 0);
</script>

<style scoped></style>

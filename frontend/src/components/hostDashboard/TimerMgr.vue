<template>
  <div class="container bg-base-300 text-base-content">
    <h3>Timer</h3>
    <div>
      <p class="my-2">Current Timer: {{ gameStore.timer }} seconds</p>
      <p class="mb-2" v-if="gameStore.timerRunning">Timer is running...</p>
      <p class="mb-2" v-else>Timer is stopped.</p>
    </div>
    <div v-if="showTimerInput">
      <div class="divider"></div>
      <fieldset class="fieldset">
        <label for="timer-input" class="w-32">Set Timer (seconds):</label>
        <input
          type="number"
          id="timer-input"
          class="input validator"
          :value="timerInput"
          @input="onTimerInput"
          @change="setTimer"
          @keydown="preventNonNumeric"
          min="0"
          step="1"
        />
        <div class="validator-hint text-xs hidden" v-if="timerInput < 0">Cannot be less than 0</div>
      </fieldset>
    </div>
    <div>
      <div class="my-4 join">
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
import { preventNonNumeric } from '@/composables/preventNonNumeric';

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

const showTimerInput = computed(() => !gameStore.timerRunning || gameStore.timer === 0);
</script>

<style scoped></style>

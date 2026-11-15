<template>
  <div class="container bg-base-300 text-base-content">
    <h3>Timer</h3>
    <div>
      <p class="my-2">Current Timer: {{ gameStore.timer }} seconds</p>
      <p class="mb-2" v-if="gameStore.timerRunning">Timer is running...</p>
      <p class="mb-2" v-else>Timer is stopped.</p>
      <div
        v-if="timeUp"
        role="alert"
        class="alert alert-warning alert-soft mb-2"
        id="timer-time-up"
      >
        <span>Time's up!</span>
      </div>
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
    <div class="divider"></div>
    <fieldset class="fieldset" id="timer-presets">
      <label class="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          class="toggle toggle-sm"
          id="timer-auto-start"
          :checked="currentPresets.enabled"
          @change="onEnabledChange"
        />
        <span>Auto-start timer for the buzzer and guessing rounds</span>
      </label>
      <div v-if="currentPresets.enabled" class="flex flex-col gap-2 mt-2">
        <label for="timer-preset-buzzer" class="w-full"
          >Buzzer round (seconds, 0 = no timer):</label
        >
        <input
          type="number"
          id="timer-preset-buzzer"
          class="input"
          :value="currentPresets.buzzer"
          @change="(e) => onSecondsChange('buzzer', e)"
          @keydown="preventNonNumeric"
          min="0"
          :max="MAX_PRESET_SECONDS"
          step="1"
        />
        <label for="timer-preset-guessing" class="w-full">
          Guessing round (seconds, 0 = no timer):
        </label>
        <input
          type="number"
          id="timer-preset-guessing"
          class="input"
          :value="currentPresets.guessing"
          @change="(e) => onSecondsChange('guessing', e)"
          @keydown="preventNonNumeric"
          min="0"
          :max="MAX_PRESET_SECONDS"
          step="1"
        />
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gamestore';
import { preventNonNumeric } from '@/composables/preventNonNumeric';
import {
  DEFAULT_TIMER_PRESETS,
  MAX_PRESET_SECONDS,
  sanitizeSeconds,
  type TimerPresets,
} from '../../utils/timerPresets';

const gameStore = useGameStore();

interface TimerMgrProps {
  timerInput: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setTimer: () => void;
  /** Preset durations for the buzzer and guessing rounds; off when omitted. */
  presets?: TimerPresets;
  /** Show "Time's up!" (the timer ran out by itself). */
  timeUp?: boolean;
}

const props = defineProps<TimerMgrProps>();

const emit = defineEmits<{
  'update:timerInput': [number];
  'update:presets': [TimerPresets];
}>();

const currentPresets = computed(() => props.presets ?? DEFAULT_TIMER_PRESETS);

function onEnabledChange(e: Event) {
  emit('update:presets', {
    ...currentPresets.value,
    enabled: (e.target as HTMLInputElement).checked,
  });
}

function onSecondsChange(key: 'buzzer' | 'guessing', e: Event) {
  const input = e.target as HTMLInputElement;
  const seconds = sanitizeSeconds(input.value);
  input.value = String(seconds); // show what was kept (rounded, clamped)
  emit('update:presets', { ...currentPresets.value, [key]: seconds });
}

function onTimerInput(e: Event) {
  const value = Number((e.target as HTMLInputElement).value);
  emit('update:timerInput', value);
}

const timerValid = computed(() => props.timerInput > 0);

const showTimerInput = computed(() => !gameStore.timerRunning || gameStore.timer === 0);
</script>

<style scoped></style>

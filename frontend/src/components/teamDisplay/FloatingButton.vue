<template>
  <button
    :class="['floating-button', className, buttonState]"
    @click="handleClick"
    :aria-pressed="ariaPressed"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
interface FloatingButtonProps {
  label: string;
  onClick?: () => void;
  className?: string | Record<string, boolean>;
  state?: string;
  ariaPressed?: boolean;
}

const props = defineProps<FloatingButtonProps>();
const emit = defineEmits<{
  click: [];
}>();

const buttonState = ref(props.state);
watch(
  () => props.state,
  (newState) => {
    buttonState.value = newState;
  },
);

function handleClick() {
  emit('click');
  if (props.onClick) {
    props.onClick();
  }
}
</script>

<style scoped>
.mute-btn,
.session-id-box {
  background-color: black;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  opacity: 0.7;
  transition:
    opacity 0.3s ease,
    background-color 0.3s ease;
  border: none;
  cursor: pointer;
}

.mute-btn:hover {
  opacity: 1;
}

.mute-btn.muted {
  background-color: gray;
}

.session-id-box:hover {
  opacity: 1; /* Fully opaque on hover */
}

.session-id-box.copied {
  background-color: green; /* Green for success */
  color: white;
}

.session-id-box.error {
  background-color: red; /* Red for error */
  color: white;
}
</style>

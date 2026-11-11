<template>
  <div
    v-if="visible"
    role="status"
    aria-live="polite"
    class="alert alert-warning rounded-none justify-center text-center"
    data-cy="connection-banner"
  >
    <span class="loading loading-spinner loading-xs"></span>
    <span v-if="connectionStatus.hasConnectedOnce">
      Connection lost. Reconnecting&hellip; the server may be waking up, which can take up to a
      minute.
    </span>
    <span v-else
      >Connecting to the server&hellip; it may be waking up, which can take up to a minute.</span
    >
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { connectionStatus } from '../utils/socket';

// Only show the banner after a short grace period so quick connects/blips don't flash it.
const GRACE_MS = 1500;
const graceElapsed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  timer = setTimeout(() => (graceElapsed.value = true), GRACE_MS);
});
onBeforeUnmount(() => clearTimeout(timer));

const visible = computed(() => connectionStatus.state !== 'connected' && graceElapsed.value);
</script>

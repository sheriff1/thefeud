<template>
  <input type="checkbox" id="session-id-modal" class="modal-toggle" v-model="open" />
  <div class="modal" v-if="open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">{{ title }}</h3>
      <div class="flex flex-col gap-3">
        <button
          v-for="option in options"
          :key="option.type"
          class="btn btn-outline"
          @click="emit('select', option.type)"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="modal-action">
        <label class="btn" @click="open = false">Close</label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InviteType } from '../composables/useInviteLinks';

export interface InviteOption {
  label: string;
  type: InviteType;
}

defineProps<{ title: string; options: InviteOption[] }>();
const emit = defineEmits<{ select: [type: InviteType] }>();
/** Whether the dialog is open (`v-model`). */
const open = defineModel<boolean>({ required: true });
</script>

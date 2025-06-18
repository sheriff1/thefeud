<template>
  <div class="join-team-dialog-backdrop">
    <div class="join-team-dialog bg-base-100">
      <h2>Join the Game</h2>
      <div class="divider"></div>
      <h3 class="left-align">Enter your name:</h3>
      <input
        type="text"
        v-model="playerName"
        placeholder="Enter your name"
        class="input validator full-width-input"
        required
        minlength="1"
      />
      <div class="validator-hint text-xs hidden left-align">Cannot be blank</div>
      <div class="divider"></div>
      <h3 class="left-align">Select your team:</h3>
      <div class="radio-group">
        <label
          v-for="team in ['A', 'B']"
          :key="team"
          :class="['radio-option', { selected: selectedTeam === team }]"
        >
          <input type="radio" class="radio radio-xs" :value="team" v-model="selectedTeam" />
          Team {{ props.teamNames[team] || team }}
        </label>
      </div>
      <button
        class="btn btn-primary btn-block"
        @click="handleJoin"
        :disabled="!playerName || !selectedTeam"
      >
        Join
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface JoinTeamDialogProps {
  teamNames: Record<string, string>;
}

const props = defineProps<JoinTeamDialogProps>();
const playerName = ref('');
const selectedTeam = ref('A'); // Default to team A
const emit = defineEmits<{
  joinTeam: [{ playerName: string; selectedTeam: string }];
}>();

function handleJoin() {
  localStorage.setItem('playerName', playerName.value);
  localStorage.setItem('playerTeam', selectedTeam.value);
  emit('joinTeam', { playerName: playerName.value, selectedTeam: selectedTeam.value });
}
// Watch for changes in team names to update the UI dynamically
watch(
  () => props.teamNames,
  (newNames) => {
    if (newNames.A) {
      selectedTeam.value = 'A';
    } else if (newNames.B) {
      selectedTeam.value = 'B';
    }
  },
  { immediate: true },
);

// Ensure selected team is valid
watch(selectedTeam, (newTeam) => {
  if (!['A', 'B'].includes(newTeam)) {
    selectedTeam.value = 'A'; // Reset to default if invalid
  }
});
// Ensure player name is not empty
watch(playerName, (newName) => {
  if (newName.trim() === '') {
    playerName.value = ''; // Reset to empty if name is invalid
  }
});
</script>

<style scoped>
.join-team-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-team-dialog {
  padding: 2rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.left-align {
  width: 100%;
  text-align: left;
  margin-bottom: 0.5rem;
}

.dialog-divider {
  width: 100%;
  border: none;
  border-top: 1px solid #ddd;
  margin: 1rem 0;
}

.radio-group {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-base-content, #fff);
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  font-size: 1rem;
}

.radio-option.selected {
  border-color: var(--color-primary);
}

.radio-option input[type='radio'] {
  margin-right: 0.5rem;
}
</style>

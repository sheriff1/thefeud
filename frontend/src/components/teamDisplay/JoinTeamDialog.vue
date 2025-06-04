<template>
  <div class="join-team-dialog-backdrop">
    <div class="join-team-dialog">
      <h2>Join the Game</h2>
      <h3 class="left-align">Enter your name:</h3>
      <input v-model="playerName" placeholder="Enter your name" class="full-width-input" />
      <hr class="dialog-divider" />
      <h3 class="left-align">Select your team:</h3>
      <div class="radio-group">
        <label
          v-for="team in ['A', 'B']"
          :key="team"
          :class="['radio-option', { selected: selectedTeam === team }]"
        >
          <input type="radio" :value="team" v-model="selectedTeam" />
          Team {{ props.teamNames[team] || team }}
        </label>
      </div>
      <button @click="handleJoin" :disabled="!playerName || !selectedTeam">Join</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
const props = defineProps({
  teamNames: Object,
  joinTeam: Function,
});
const playerName = ref('');
const selectedTeam = ref('A'); // Default to team A
const emit = defineEmits(['joinTeam']);

function handleJoin() {
  emit('joinTeam', {
    playerName: playerName.value,
    selectedTeam: selectedTeam.value,
  });
}
const teamNames = computed(() => teamNames);
// Watch for changes in team names to update the UI dynamically
watch(
  () => teamNames,
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
hr {
  display: none; /* Remove horizontal lines since items are now horizontal */
}

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
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.join-team-dialog input[type='text'] {
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.join-team-dialog label {
  margin-right: 1rem;
  font-size: 1rem;
}

.join-team-dialog button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  background: #007bff;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.join-team-dialog button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.full-width-input {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
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
  border: 2px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  background: #f9f9f9;
  transition:
    border-color 0.2s,
    background 0.2s;
  font-size: 1rem;
}

.radio-option.selected {
  border-color: #007bff;
  background: #e6f0ff;
}

.radio-option input[type='radio'] {
  margin-right: 0.5rem;
}
</style>

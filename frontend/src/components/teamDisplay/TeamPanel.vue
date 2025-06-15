<template>
  <div class="container bg-base-300 text-base-content team-info" :class="{ active }">
    <span class="team-score text-7xl">{{ score }}</span>
    <span>points</span>
    <div class="divider"></div>
    <div class="team-header">
      <span class="">
        <span v-if="!editing">
          <span v-if="isWinning">👑 </span> Team
          {{ teamName.toUpperCase() }}
          <button
            v-if="currentPlayerTeam === team"
            class="btn btn-xs ml-4"
            @click="$emit('edit-team', team)"
          >
            ✏️
          </button>
        </span>
        <span v-else>
          <input
            v-if="currentPlayerTeam === team"
            v-model="editedName"
            @keyup.enter="saveTeamNameChange"
            @blur="saveTeamNameChange"
            class="edit-team-input"
            maxlength="20"
            autofocus
          />
          <button
            v-if="currentPlayerTeam === team"
            class="btn btn-xs ml-4"
            @click="saveTeamNameChange"
          >
            💾
          </button>
          <span v-else>{{ teamName.toUpperCase() }}</span>
        </span>
      </span>
    </div>
    <div class="team-row">
      <ul class="team-members-list">
        <li
          v-for="member in members"
          :key="member"
          :class="{ buzzed: store.buzzedPlayer === member }"
        >
          😎 {{ member }}
        </li>
      </ul>
      <div v-if="startingTeamSet" class="team-strikes">
        <span class="flex">
          <span v-for="strike in strikes" :key="strike" class="strike-x">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </span>
        </span>
        <span class="game-info-label">Strikes</span>
      </div>
    </div>
    <div class="buzzer-container" v-if="showBuzzer && guessedAnswers.length == 0">
      <button class="buzzer-button" :disabled="buzzerDisabled" @click="$emit('buzz')">
        {{ store.buzzedPlayer ? 'Buzzed!' : 'BUZZER' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGameStore } from '../../stores/gamestore';
const store = useGameStore();
const currentPlayerTeam = localStorage.getItem('playerTeam');

interface TeamPanelProps {
  team: string;
  teamName: string;
  score: number;
  members: string[];
  strikes: number;
  strikeCount: number;
  active: boolean;
  editing: boolean;
  isWinning: boolean;
  showBuzzer: boolean;
  startingTeamSet: boolean;
  buzzerDisabled: boolean;
  initialEditedName?: string;
  guessedAnswers: { id: string }[]; // updated
}

const props = defineProps<TeamPanelProps>();
const emit = defineEmits<{
  'edit-team': [string];
  'save-team': [{ team: string; name: string }];
  buzz: [];
}>();

const editedName = ref(props.initialEditedName || props.teamName);

watch(
  () => props.teamName,
  (newVal) => {
    editedName.value = newVal;
  },
);

function saveTeamNameChange() {
  emit('save-team', { team: props.team, name: editedName.value });
}
</script>

<style scoped>
.team-info {
  border-radius: 12px;
  padding: 1.5rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 220px;
  position: relative;
  transition: box-shadow 0.2s;
}
.team-info.active {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--color-primary, #000);
}

.team-score {
  color: var(--color-base-content, #000);
}

.team-header {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* .team-name {
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
} */

/* .edit-team-btn,
.save-team-btn {
  background: none;
  border: none;
  margin-left: 0.5rem;
  cursor: pointer;
  font-size: 1.1rem;
} */

.edit-team-input {
  font-size: 1.1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  border: 1px solid var(--color-base-content, #fff);
  margin-left: 0.5rem;
  width: 120px;
}

.team-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 0.5rem;
}

.team-members-list {
  list-style: none;
  padding: 0;
  margin: 0 1rem 0 0;
  flex: 1 1 auto;
}
.team-members-list li {
  font-size: 1rem;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
}
.team-members-list li.buzzed {
  background-color: var(--color-secondary, #f5425a);
  font-weight: bold;
  border-radius: 0.5rem;
  padding: 0.125rem 0.25rem;
  color: var(--color-base-content, #fff);
}

.team-strikes {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.strike-x svg {
  color: #ef4444; /* Tailwind red-500 */
  width: 1.5rem;
  height: 1.5rem;
}

.game-info-label {
  font-size: 0.8rem;
  color: var(--color-base-content, #fff);
  margin-top: 0.2rem;
}

.buzzer-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 0.7rem;
}
.buzzer-button {
  background-color: var(--color-secondary, #f5425a);
  color: #fff;
  font-weight: bold;
  font-size: 1.5rem;
  border: none;
  border-radius: 100%;
  padding: 3rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
.buzzer-button:disabled {
  background: #e5e7eb;
  color: #aaa;
  cursor: not-allowed;
}
</style>

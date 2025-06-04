<template>
  <div class="team-info" :class="{ active }">
    <span class="team-score">{{ score }}</span>
    <div class="team-header">
      <span class="team-name">
        <span v-if="!editing">
          <span v-if="isWinning">👑</span>
          {{ teamName.toUpperCase() }}
          <button class="edit-team-btn" @click="$emit('edit-team', team)">✏️</button>
        </span>
        <span v-else>
          <input
            v-model="editedName"
            @keyup.enter="saveTeamNameChange"
            @blur="saveTeamNameChange"
            class="edit-team-input"
            maxlength="20"
            autofocus
          />
          <button class="save-team-btn" @click="saveTeamNameChange">💾</button>
        </span>
      </span>
    </div>
    <div class="team-row">
      <ul class="team-members-list">
        <li v-for="member in members" :key="member" :class="{ buzzed: buzzedPlayer === member }">
          😎 {{ member }}
        </li>
      </ul>
      <div class="team-strikes">
        <span
          v-for="strike in strikeCount"
          :key="team + '-' + strike"
          class="strike-dot"
          :class="{ active: strike <= strikes }"
        ></span>
        <span class="game-info-label">Strikes</span>
      </div>
    </div>
    <div class="buzzer-container" v-if="showBuzzer && guessedAnswers.length == 0">
      <button class="buzzer-button" :disabled="buzzerDisabled" @click="$emit('buzz')">
        {{ buzzedPlayer ? 'Buzzed!' : 'BUZZER' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface TeamPanelProps {
  team: string;
  teamName: string;
  score: number;
  members: string[];
  strikes: number;
  strikeCount: number;
  buzzedPlayer: string;
  active: boolean;
  editing: boolean;
  isWinning: boolean;
  showBuzzer: boolean;
  buzzerDisabled: boolean;
  initialEditedName?: string;
  guessedAnswers: { id: string }[]; // updated
}

interface TeamPanelEmits {
  (e: 'edit-team', team: string): void;
  (e: 'save-team', payload: { team: string; name: string }): void;
  (e: 'buzz'): void;
}

const props = defineProps<TeamPanelProps>();
const emit = defineEmits<TeamPanelEmits>();

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
  background: #f7f7f7;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  margin: 0.5rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 220px;
  position: relative;
  transition: box-shadow 0.2s;
}
.team-info.active {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid #3b82f6;
}

.team-score {
  font-size: 2.2rem;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  align-self: flex-end;
}

.team-header {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.team-name {
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}

.edit-team-btn,
.save-team-btn {
  background: none;
  border: none;
  margin-left: 0.5rem;
  cursor: pointer;
  font-size: 1.1rem;
}

.edit-team-input {
  font-size: 1.1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #ccc;
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
  background-color: #f87171;
  font-weight: bold;
  border-radius: 0.5rem;
  padding: 0.125rem 0.2gi5rem;
  color: #fff;
  border: 0.25rem solid #f5425a;
}

.team-strikes {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.strike-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin: 2px;
  border-radius: 50%;
  background: #e5e7eb;
  border: 1.5px solid #f87171;
  transition: background 0.2s;
}
.strike-dot.active {
  background: #f87171;
}
.game-info-label {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.2rem;
}

.buzzer-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 0.7rem;
}
.buzzer-button {
  background: #f5425a;
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

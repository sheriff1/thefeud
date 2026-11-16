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
        <span class="flex flex-row" v-else>
          <div class="flex flex-col">
            <input
              type="text"
              v-if="currentPlayerTeam === team"
              v-model="editedName"
              @keyup.enter="saveTeamNameChange"
              @blur="saveTeamNameChange"
              class="input validator"
              maxlength="20"
              autofocus
              minlength="1"
              required
            />
            <div class="validator-hint text-xs hidden">Cannot be blank</div>
          </div>
          <button v-if="currentPlayerTeam === team" class="btn ml-4" @click="saveTeamNameChange">
            💾
          </button>
          <span v-else>{{ teamName.toUpperCase() }}</span>
        </span>
      </span>
    </div>
    <div class="team-row">
      <!-- Phones only (#131): the list is collapsed to the buzzed player; this toggles the rest. -->
      <button
        type="button"
        class="members-toggle"
        :aria-expanded="membersOpen"
        @click="membersOpen = !membersOpen"
      >
        👥 {{ members.length }} {{ membersOpen ? '▴' : '▾' }}
      </button>
      <ul class="team-members-list" :class="{ collapsed: !membersOpen }">
        <li
          v-for="member in members"
          :key="member"
          :class="{ buzzed: store.buzzedPlayer === member }"
        >
          {{ member }}
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
      <button class="buzzer-button" :disabled="buzzerDisabled || !canBuzz" @click="$emit('buzz')">
        {{ store.buzzedPlayer ? 'Buzzed!' : idleBuzzerLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
  /** False when the host selected someone else on this team (#23). */
  canBuzz?: boolean;
  /** The selected buzzer of this team, if any. */
  buzzerOwner?: string | null;
  initialEditedName?: string;
  guessedAnswers: { id: string }[]; // updated
}

const props = withDefaults(defineProps<TeamPanelProps>(), {
  canBuzz: true,
  buzzerOwner: null,
});

// A teammate who was not selected sees who may buzz instead of a live button (#23).
const idleBuzzerLabel = computed(() => {
  if (!props.canBuzz && props.buzzerOwner) return `Buzzer: ${props.buzzerOwner}`;
  return 'BUZZER';
});
const emit = defineEmits<{
  'edit-team': [string];
  'save-team': [{ team: string; name: string }];
  buzz: [];
}>();

const membersOpen = ref(false);

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

/* .edit-team-input {
  font-size: 1.1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  border: 1px solid var(--color-base-content, #fff);
  margin-left: 0.5rem;
  width: 120px;
} */

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

.members-toggle {
  display: none;
}

/* Phones (#131): a compact card in the score strip; the buzzer becomes a full-width bottom bar. */
@media (max-width: 767px) {
  .team-info {
    min-width: 0;
    width: 100%;
    padding: 0.75rem 0.5rem;
  }
  .team-score {
    font-size: 2.75rem;
    line-height: 1;
  }
  .team-info .divider {
    margin: 0.25rem 0;
  }
  .team-header {
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }
  .team-header .btn {
    min-width: 44px;
    min-height: 44px;
    margin-left: 0.25rem;
  }
  .team-header input {
    width: 100%;
    min-width: 0;
  }
  .team-header .btn.ml-4 {
    margin-left: 0.25rem;
  }
  .team-row {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 0;
  }
  .members-toggle {
    display: block;
    min-height: 44px;
    text-align: left;
    background: none;
    border: none;
    padding: 0 0.25rem;
    font-size: 0.9rem;
  }
  .team-members-list {
    margin: 0;
  }
  /* Collapsed: only the player who buzzed stays visible. */
  .team-members-list.collapsed li:not(.buzzed) {
    display: none;
  }
  .team-strikes {
    flex-direction: row;
    gap: 0.5rem;
    justify-content: flex-start;
    align-items: center;
    min-width: 0;
    margin-top: 0.25rem;
  }
  .team-strikes .game-info-label {
    margin-top: 0;
  }
  .buzzer-container {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 900;
    margin: 0;
    padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
    background-color: var(--color-base-100, #fff);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
  }
  .buzzer-button {
    width: 100%;
    height: 72px;
    padding: 0 1rem;
    border-radius: 12px;
  }
}
</style>

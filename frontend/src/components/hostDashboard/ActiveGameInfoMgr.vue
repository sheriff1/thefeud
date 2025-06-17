<template>
  <div class="container bg-base-300 text-base-content">
    <h3 class="mb-4">Game Info</h3>
    <!-- Team A Panel -->
    <div class="active-game-info-grid">
      <div class="team-info" :class="{ active: gameStore.currentTeam === 'A' }">
        <h4>Team {{ gameStore.teamNames.A }}</h4>
        <span class="team-score text-4xl">{{ gameStore.teamScores.A }}</span>
        <div class="team-strikes">
          <span class="game-info-label">Strikes</span>
          <span class="flex">
            <span v-for="strike in gameStore.teamStrikes.A" :key="strike" class="strike-x">
              <svg
                width="16"
                height="16"
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
        </div>
      </div>

      <!-- Center Game Info -->
      <div class="game-info-container">
        <div class="game-info-item">
          <div class="game-info-value">{{ gameStore.roundCounter }}</div>
          <div class="game-info-label">Round</div>
        </div>
        <div class="game-info-item">
          <div class="game-info-value">{{ gameStore.pointPool }}</div>
          <div class="game-info-label">Points Pool</div>
        </div>
        <div class="game-info-item">
          <div class="game-info-value">x{{ gameStore.scoreMultiplier }}</div>
          <div class="game-info-label">Score Multiplier</div>
        </div>
      </div>

      <!-- Team B Panel -->
      <div class="team-info" :class="{ active: gameStore.currentTeam === 'B' }">
        <h4>Team {{ gameStore.teamNames.B }}</h4>
        <span class="team-score text-4xl">{{ gameStore.teamScores.B }}</span>
        <div class="team-strikes">
          <span class="game-info-label">Strikes</span>
          <span class="flex">
            <span v-for="strike in gameStore.teamStrikes.B" :key="strike" class="strike-x">
              <svg
                width="16"
                height="16"
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gamestore';
const gameStore = useGameStore();
</script>

<style scoped>
.active-game-info-grid {
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: stretch;
  margin: 2rem 0;
}

/* Team Panel Styles (reuse from TeamPanel.vue) */
.team-info {
  border-radius: 12px;
  padding: 1.5rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 220px;
  position: relative;
  transition:
    box-shadow 0.2s,
    border 0.2s;
  background: var(--color-base-300, #23272f);
  border: 2px solid transparent;
  gap: calc(0.5rem);
}
.team-info.active {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--color-primary, #6366f1);
}

.team-score {
  color: var(--color-base-content, #fff);
}

.team-header {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 1px;
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

.team-strikes {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.strike-x svg {
  color: #ef4444;
  width: 1rem;
  height: 1rem;
}

/* Center Game Info Styles (reuse from GameInfo.vue) */
.game-info-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  background: var(--color-base-300, #23272f);
  margin: 0 1rem;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 280px;
}
.game-info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 16px;
}
.game-info-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary, #6366f1);
}
.game-info-label {
  font-size: 0.75rem;
  color: #bbb;
}

.divider {
  width: 90%;
  height: 1px;
  background: #444;
  margin: 1rem 0;
}
</style>

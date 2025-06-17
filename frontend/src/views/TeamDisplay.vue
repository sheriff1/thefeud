<template>
  <div class="flex flex-col items-center my-8">
    <h1>The Feud!</h1>
    <!-- Join Team Dialog -->
    <JoinTeamDialog
      v-if="!isSpectator && !hasJoined"
      :teamNames="store.teamNames"
      @joinTeam="joinTeam"
    />

    <!-- Main Gameboard -->
    <div class="w-full" v-else>
      <!-- Session ID Modal -->
      <input
        type="checkbox"
        id="session-id-modal"
        class="modal-toggle"
        v-model="showSessionIdDialog"
      />
      <div class="modal" v-if="showSessionIdDialog">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Share Session</h3>
          <div class="flex flex-col gap-3">
            <button class="btn btn-outline" @click="copySessionIdOption('id')">
              Copy Session ID
            </button>
            <button class="btn btn-outline" @click="copySessionIdOption('team')">
              Invite Team Member Link
            </button>
            <button class="btn btn-outline" @click="copySessionIdOption('spectator')">
              Invite Spectator Link
            </button>
          </div>
          <div class="modal-action">
            <label class="btn" @click="showSessionIdDialog = false">Close</label>
          </div>
        </div>
      </div>
      <div class="floating-buttons">
        <FloatingButton
          :label="sessionIdBoxText"
          :onClick="() => (showSessionIdDialog = true)"
          class="session-id-box"
          :state="sessionIdBoxState"
        />
        <FloatingButton
          :label="isMuted ? '🔇 Sound Off' : '🔊 Sound On'"
          @click="toggleMute"
          className="mute-btn"
          :state="isMuted ? 'muted' : ''"
          :ariaPressed="isMuted"
        />
        <FloatingButton label="Log Out" :onClick="logout" className="logout-box" />
      </div>

      <div class="gameboard-container">
        <!-- Round Over Banner -->
        <Banner
          v-if="store.roundOver"
          :heading="`Round ${store.roundCounter} Over! `"
          :paragraph="
            store.winningTeam
              ? `${
                  store.teamNames[store.winningTeam]
                } wins this round! They scored ${store.pointsAwarded} points!`
              : 'No points were awarded this round.'
          "
        />

        <!-- Scoreboard Section -->
        <div class="scoreboard">
          <!-- Team A Info -->
          <div class="basis-1/4">
            <TeamPanel
              team="A"
              :teamName="store.teamNames['A']"
              :score="store.teamScores['A']"
              :members="store.teamMembers['A']"
              :strikes="store.teamStrikes['A']"
              :strikeCount="store.firstTeam === 'A' ? 3 : 1"
              :active="store.currentTeam === 'A'"
              :editing="editingTeam === 'A'"
              :isWinning="store.teamScores['A'] > store.teamScores[otherTeam('A')]"
              :showBuzzer="isMultiplierSet && selectedTeam === 'A' && !store.startingTeamSet"
              :startingTeamSet="store.startingTeamSet"
              :buzzerDisabled="isBuzzerDisabled"
              :initialEditedName="editedTeamName"
              :guessedAnswers="store.guessedAnswers"
              @edit-team="startEditingTeamName"
              @save-team="saveTeamName"
              @buzz="pressBuzzer"
            />
          </div>
          <!-- Answers & Game Info Section -->
          <div>
            <AnswersBoard
              :answers="store.answers.map((a) => ({ ...a, id: String(a.id) }))"
              :question="store.question"
              :guessedAnswers="store.guessedAnswers"
              :showStrikeX="showStrikeX"
              @strikeX="showStrikeX = false"
            />

            <!-- Game Info Container -->
            <GameInfo
              :roundCounter="store.roundCounter"
              :timer="store.timer"
              :pointPool="store.pointPool"
              :scoreMultiplier="store.scoreMultiplier"
            />
          </div>

          <!-- Team B Info -->
          <div class="basis-1/4">
            <TeamPanel
              team="B"
              :teamName="store.teamNames['B']"
              :score="store.teamScores['B']"
              :members="store.teamMembers['B']"
              :strikes="store.teamStrikes['B']"
              :strikeCount="store.firstTeam === 'B' ? 3 : 1"
              :active="store.currentTeam === 'B'"
              :editing="editingTeam === 'B'"
              :isWinning="store.teamScores['B'] > store.teamScores[otherTeam('B')]"
              :showBuzzer="isMultiplierSet && selectedTeam === 'B' && !store.startingTeamSet"
              :startingTeamSet="store.startingTeamSet"
              :buzzerDisabled="isBuzzerDisabled"
              :initialEditedName="editedTeamName"
              :guessedAnswers="store.guessedAnswers"
              @edit-team="startEditingTeamName"
              @save-team="saveTeamName"
              @buzz="pressBuzzer"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../stores/gamestore';
import socket from '../utils/socket';
import TeamPanel from '../components/teamDisplay/TeamPanel.vue';
import AnswersBoard from '../components/teamDisplay/AnswersBoard.vue';
import GameInfo from '../components/teamDisplay/GameInfo.vue';
import FloatingButton from '../components/teamDisplay/FloatingButton.vue';
import Banner from '../components/teamDisplay/Banner.vue';
import JoinTeamDialog from '../components/teamDisplay/JoinTeamDialog.vue';
import { useRouter } from 'vue-router';
import { useSessionTimeout } from '@/composables/useSessionTimeout';

interface TeamDisplayProps {
  isSpectator?: boolean; // Optional prop to indicate if the user is a spectator
}

const props = defineProps<TeamDisplayProps>();

const store = useGameStore();
const sessionId = new URLSearchParams(window.location.search).get('sessionId'); // Get sessionId from URL query params
const sessionIdBoxText = ref(`🔗  Share Session`); // Default text
const sessionIdBoxState = ref(''); // Default state (no additional class)
const playerName = ref('');
const selectedTeam = ref('');
const hasJoined = ref(false);
const hasBuzzed = ref(false);
const isBuzzerDisabled = computed(() => hasBuzzed.value || !!store.buzzedPlayer);
const isMultiplierSet = computed(() => !!store.scoreMultiplier);
const editingTeam = ref<'A' | 'B' | null>(null); // 'A' or 'B' or null
const editedTeamName = ref('');
const isMuted = ref(false); // Mute state
// const teamMembers = ref({ A: [], B: [] }); // Store team members locally for display
const otherTeam = (team: string) => (team === 'A' ? 'B' : 'A'); // Helper function to get the other team
const showStrikeX = ref(false);
const isSpectator = props.isSpectator ?? false;
const router = useRouter();
const emojiList = ['😎', '😄', '🤔', '😜', '🥸', '🥳', '🫠', '🤩', '🤯', '🤨'];
const showSessionIdDialog = ref(false);

const playDingSound = () => {
  if (isMuted.value) return;
  const audio = new Audio('/sounds/ding.mp3'); // Path to the "ding" sound file
  audio.play();
};

const playBuzzerSound = () => {
  if (isMuted.value) return;
  const audio = new Audio('/sounds/buzzer.mp3');
  audio.play();
};

const playStrikeSound = () => {
  // Show the X
  showStrikeX.value = true;
  setTimeout(() => {
    showStrikeX.value = false;
  }, 1200); // Show for 1.2 seconds
  if (isMuted.value) {
    return;
  } else {
    const audio = new Audio('/sounds/strike.mp3');
    audio.play();
  }
};

const playRoundOverSound = () => {
  if (isMuted.value) return;
  const audio = new Audio('/sounds/round-over.mp3');
  audio.play();
};

const playNextRoundSound = () => {
  if (isMuted.value) return;
  const audio = new Audio('/sounds/next-round.mp3');
  audio.play();
};

const pressBuzzer = () => {
  if (!hasBuzzed.value) {
    hasBuzzed.value = true;
    socket.emit('buzz', { sessionId, name: playerName.value });
    playBuzzerSound();
  }
};

const startEditingTeamName = (team: string | number | null) => {
  editingTeam.value = team as 'A' | 'B' | null;
  editedTeamName.value = store.teamNames[team as 'A' | 'B'] || '';
};

function toggleMute() {
  isMuted.value = !isMuted.value;
}

function saveTeamName({ team, name }: { team: string; name: string }) {
  if (name && name.trim()) {
    store.teamNames = { ...store.teamNames, [team]: name };
    socket.emit('update-team-name', {
      sessionId,
      team,
      name: name.trim(),
    });
    editingTeam.value = null;
  }
}

function assignEmojiToPlayer(name: string) {
  const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
  return `${emoji} ${name}`;
}

function joinTeam(payload: { playerName: string; selectedTeam: string }) {
  const { playerName: name, selectedTeam: team } = payload;
  const emojiAssignedName = assignEmojiToPlayer(name.trim());
  if (!name.trim() || !team) return;
  socket.emit('join-team', {
    sessionId,
    name: emojiAssignedName,
    team,
  });
  playerName.value = emojiAssignedName;
  localStorage.setItem('playerName', playerName.value);
  selectedTeam.value = team;
  hasJoined.value = true;
}

const logout = () => {
  // Get the player's name and team from localStorage or store
  const playerName = localStorage.getItem('playerName');
  const playerTeam = localStorage.getItem('playerTeam') as 'A' | 'B';

  // Remove from Pinia store
  if (playerName && playerTeam) {
    store.removeTeamMember(playerTeam, playerName);

    // Emit to backend to remove from session data
    socket.emit('remove-team-member', {
      sessionId,
      team: playerTeam,
      name: playerName,
    });
  }
  socket.removeAllListeners();
  socket.disconnect();

  localStorage.removeItem('enteredFromHome');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('playerName');
  localStorage.removeItem('playerTeam');
  // Clear session data
  store.$reset();

  router.push({ name: 'HomeAlias' }).then(() => {
    window.location.reload();
  });
};

// @ts-ignore
const isTest = window.Cypress; // Cypress sets this global variable
useSessionTimeout(logout, isTest ? 1000 : 1800000);

function copySessionIdOption(type: 'id' | 'host' | 'team' | 'spectator') {
  let textToCopy = '';
  const baseUrl = window.location.origin;
  if (type === 'id') {
    textToCopy = sessionId || '';
  } else if (type === 'host') {
    textToCopy = `${baseUrl}/host?sessionId=${sessionId}`;
  } else if (type === 'team') {
    textToCopy = `${baseUrl}/team?sessionId=${sessionId}`;
  } else if (type === 'spectator') {
    textToCopy = `${baseUrl}/spectator?sessionId=${sessionId}`;
  }
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      sessionIdBoxText.value = 'Copied!';
      sessionIdBoxState.value = 'copied';
      showSessionIdDialog.value = false;
      setTimeout(() => {
        sessionIdBoxText.value = `Session ID: ${sessionId}`;
        sessionIdBoxState.value = '';
      }, 2000);
    })
    .catch(() => {
      sessionIdBoxText.value = 'Error';
      sessionIdBoxState.value = 'error';
      showSessionIdDialog.value = false;
      setTimeout(() => {
        sessionIdBoxText.value = `Session ID: ${sessionId}`;
        sessionIdBoxState.value = '';
      }, 2000);
    });
}

socket.on('play-strike-sound', () => {
  playStrikeSound();
});

socket.on('team-names-updated', (teamNames: any) => {
  store.teamNames = { ...store.teamNames, ...teamNames };
});

// Handle errors
socket.on('error', (error: { message: any }) => {
  console.error('Error from backend:', error.message);
  alert(`Error: ${error.message}`);

  // Handle invalid session error
  if (
    error.message === 'Session does not exist.' ||
    error.message === 'No session ID provided.' // Add any other relevant backend error messages
  ) {
    // Redirect to home page
    window.location.href = '/';
  }
});

// Watch for changes in guessed answers
watch(
  () => store.guessedAnswers,
  (newGuessedAnswers, oldGuessedAnswers) => {
    if (newGuessedAnswers.length > oldGuessedAnswers.length) {
      playDingSound(); // Play sound when a new answer is guessed
    }
  },
);

// Watch for changes in team strikes
watch(
  () => store.teamStrikes,
  (newStrikes, oldStrikes) => {
    if (
      newStrikes.A > oldStrikes.A || // Check if Team A got a new strike
      newStrikes.B > oldStrikes.B // Check if Team B got a new strike
    ) {
      playStrikeSound(); // Play sound when a strike is given
    }
  },
  { deep: true }, // Watch for deep changes in the teamStrikes object
);

// Join a session and listen for updates
onMounted(() => {
  if (!sessionId) {
    alert('No session ID provided. Please join a valid session.');
    return;
  }

  // Join the session
  socket.emit('join-session', { sessionId });

  // Request the current game state from the backend
  socket.emit('get-current-state', { sessionId });

  // Listen for the current game state from the backend
  socket.on('current-state', (currentState: { buzzedPlayer: string }) => {
    if (!store.sessionId) return; // Don't update if logged out
    Object.assign(store.$state, currentState);
    store.buzzedPlayer = currentState?.buzzedPlayer || '';
  });

  // Listen for game state updates
  socket.on('update-game', (newState: { teamNames: any; buzzedPlayer: string }) => {
    if (!store.sessionId) return;
    Object.assign(store.$state, newState);
    store.teamNames = { ...store.teamNames, ...newState.teamNames };
    if ('buzzedPlayer' in newState) {
      store.buzzedPlayer = newState.buzzedPlayer;
    }
    hasBuzzed.value = false;
  });

  // Listen for the "play-strike-sound" event from the backend
  socket.on('play-strike-sound', () => {
    playStrikeSound();
  });

  socket.on(
    'team-members-updated',
    (members: { A: never[]; B: never[] } | { A: never[]; B: never[] }) => {
      store.teamMembers = members;
    },
  );

  // Handle connection errors
  socket.on('connect_error', (error: any) => {
    console.error('WebSocket connection error:', error);
    alert('Failed to connect to the game session. Please try again.');
  });

  socket.on('round-over', () => {
    playRoundOverSound();
  });
  socket.on('next-round', () => {
    playNextRoundSound();
  });
  socket.on('reset-round', () => {
    store.buzzedPlayer = '';
    hasBuzzed.value = false;
    editingTeam.value = null;
    editedTeamName.value = '';
    showStrikeX.value = false;
  });
  socket.on('reset-buzzers', () => {
    store.buzzedPlayer = '';
    hasBuzzed.value = false;
  });
});

// Clean up listeners when the component is unmounted
onUnmounted(() => {
  socket.removeAllListeners();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
/* Root Container Styles */
.gameboard-container {
  padding: 1rem;
  width: 100%;
}

.scoreboard {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 1rem;
  margin-bottom: 16px;
  width: 100%;
}
.floating-buttons {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 1000;
}
</style>

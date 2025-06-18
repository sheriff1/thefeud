<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <a href="/" class="btn btn-ghost text-base-content !text-base-content">The Feud</a>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1 flex-row items-center">
        <li>
          <button class="text-base-content !text-base-content" @click="showHowToPlay = true">
            How To Play
          </button>
        </li>
        <li>
          <a
            href="https://github.com/sheriff1/thefeud"
            target="_blank"
            class="text-base-content !text-base-content flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482
                0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608
                1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951
                0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004
                1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688
                0 3.847-2.339 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.579.688.481C19.138
                20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"
              />
            </svg>
            About</a
          >
        </li>
        <li v-if="store.sessionId">
          <a @click="logout" class="text-base-content !text-base-content">Log Out</a>
        </li>
        <li>
          <label class="flex cursor-pointer gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
              />
            </svg>
            <input
              type="checkbox"
              class="toggle toggle-xs theme-controller"
              :checked="theme === 'dark'"
              @change="theme = theme === 'dark' ? 'light' : 'dark'"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </label>
        </li>
      </ul>
    </div>
  </div>
  <div
    v-if="store.isLoading"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
  >
    <span class="loading loading-spinner loading-lg text-primary"></span>
  </div>
  <!-- How to Play Modal -->
  <input type="checkbox" class="modal-toggle" v-model="showHowToPlay" />
  <div class="modal" v-if="showHowToPlay">
    <div class="modal-box">
      <h3 class="mb-4">How to Play</h3>
      <div class="carousel carousel-center bg-neutral rounded-box w-full mt-4">
        <!-- Card 1: Roles -->
        <div id="slide1" class="carousel-item relative w-full flex justify-center">
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body flex-none">
              <h4 class="card-title">Welcome to The Feud</h4>
              <p class="mb-2">
                The Feud is a multiplayer game where players can join as one of three roles:
              </p>
              <ul class="list-disc ml-6">
                <li><b>Host</b></li>
                <li><b>Team Member</b></li>
                <li><b>Spectator</b></li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Card 2: Host Responsibilities -->
        <div id="slide2" class="carousel-item relative w-full flex justify-center">
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body flex-none">
              <h4 class="card-title">Hosts</h4>
              <p class="mb-2">
                The host access the host dashboard where they can manage the game flow by:
              </p>
              <ul class="list-disc ml-6">
                <li>Loading question and answers from library or via CSV</li>
                <li>Marking answers correct as team members guess</li>
                <li>Selecting who plays or passes</li>
                <li>Setting score multiplier</li>
                <li>And general management of the flow of rounds</li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Card 3: Team Members -->
        <div id="slide3" class="carousel-item relative w-full flex justify-center">
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body flex-none">
              <h4 class="card-title">Team Members & Spectators</h4>
              <p class="mb-2">
                Team members access the team member view, where they see the live Feud experience.
                In gameplay they:
              </p>
              <ul class="list-disc ml-6">
                <li>Give the host answers for the host to mark correct or incorrect</li>
                <li>
                  Get a <span class="text-success font-bold">ding</span> if they provide a correct
                  answer
                </li>
                <li>
                  Or an <span class="text-error font-bold">X</span> if they provide a incorrect
                  answer
                </li>
                <li>
                  If you join as a Spectator, you see the team member view without access to the
                  buzzer
                </li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Card 4: Buzzer Round -->
        <div id="slide4" class="carousel-item relative w-full flex justify-center">
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body flex-none">
              <h4 class="card-title">Buzzer Round</h4>
              <p class="mb-2">
                In the Buzzer Round, team members can buzz in to provide what they think the top
                answer on the board is
              </p>
              <ul class="list-disc ml-6">
                <li>Both teams see a buzzer button underneath their scores</li>
                <li>First team to buzz in guesses first</li>
                <li>If they guess the top answer, they choose to play or pass</li>
                <li>
                  If they do not guess the top answer, the second team gets to guess the top answer
                </li>
                <li>
                  If neither team guesses the top answer, whichever team guesses the highest point
                  answer gets to decide if they play or pass
                </li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Card 5: Guessing Round -->
        <div id="slide5" class="carousel-item relative w-full flex justify-center">
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body flex-none">
              <h4 class="card-title">Guessing Round</h4>
              <p class="mb-2">
                After the Buzzer Round, the Guessing Round starts with whichever team plays. In this
                round, the team tries to guess all answers on the board
              </p>
              <ul class="list-disc ml-6">
                <li>Correct guesses reveal the answer and points get added to the points pool</li>
                <li>Incorrect guesses, on the other hand, give a team a strike</li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Card 6: How to Get Points -->
        <div id="slide6" class="carousel-item relative w-full flex justify-center">
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body flex-none">
              <h4 class="card-title">How to Score Points</h4>
              <p class="mb-2">
                Points are awarded from the points pool when one of the following happens:
              </p>
              <ol class="list-decimal ml-6">
                <li>Initial guessing team gets all answers correct</li>
                <li>If 3 strikes, other team can steal with one correct guess</li>
                <li>If the steal fails, initial team gets the points pool</li>
              </ol>
              <p class="mt-2">
                At the end, the host can reveal any remaining answers before starting the next
                round.
              </p>
            </div>
          </div>
        </div>
        <!-- Card 7: Ready to Play? (only if no sessionId) -->
        <div
          id="slide7"
          class="carousel-item relative w-full flex justify-center"
          v-if="!store.sessionId"
        >
          <div class="card w-full max-w-lg bg-base-100 shadow-xl m-8">
            <div class="card-body items-center justify-center text-center">
              <h4 class="card-title">Ready to play?</h4>
              <button class="btn btn-primary mt-4" @click="createSessionFromModal">
                Create a New Session
              </button>
            </div>
          </div>
        </div>
        <!-- If sessionId exists, loop back to slide1 from slide6 -->
        <div
          id="slide7"
          class="carousel-item relative w-full flex justify-center"
          v-else
          style="display: none"
        ></div>
      </div>
      <div class="flex w-full justify-center gap-2 py-2">
        <a href="#slide1" class="btn btn-circle btn-xs !text-base-content">1</a>
        <a href="#slide2" class="btn btn-circle btn-xs !text-base-content">2</a>
        <a href="#slide3" class="btn btn-circle btn-xs !text-base-content">3</a>
        <a href="#slide4" class="btn btn-circle btn-xs !text-base-content">4</a>
        <a href="#slide5" class="btn btn-circle btn-xs !text-base-content">5</a>
        <a href="#slide6" class="btn btn-circle btn-xs !text-base-content">6</a>
        <a v-if="!store.sessionId" href="#slide7" class="btn btn-circle btn-xs !text-base-content"
          >7</a
        >
      </div>
      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn" @click="showHowToPlay = false">Close</button>
        </form>
      </div>
    </div>
  </div>
  <router-view />
</template>

<script setup lang="ts">
import { auth, signInAnonymously } from './firebase';
import { useRouter } from 'vue-router';
import { useGameStore } from './stores/gamestore'; // adjust path if needed
import socket from './utils/socket';
import { ref, watch, onMounted } from 'vue';

const theme = ref('light');
const router = useRouter();
const store = useGameStore();
signInAnonymously(auth);
const showHowToPlay = ref(false);
const apiBase = import.meta.env.VITE_API_BASE || '';

const createSessionFromModal = async () => {
  const newSessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  await fetch(`${apiBase}/api/create-session/${newSessionId}`, {
    method: 'POST',
  });
  store.enteredFromHome = true;
  store.sessionId = newSessionId;
  localStorage.setItem('enteredFromHome', 'true');
  localStorage.setItem('sessionId', newSessionId);
  showHowToPlay.value = false;
  router.push(`/host?sessionId=${newSessionId}`);
};

const logout = () => {
  // Get the player's name and team from localStorage or store
  const playerName = localStorage.getItem('playerName');
  const playerTeam = localStorage.getItem('playerTeam') as 'A' | 'B';

  // Remove from Pinia store
  if (playerName && playerTeam) {
    store.removeTeamMember(playerTeam, playerName);

    // Emit to backend to remove from session data
    socket.emit('remove-team-member', {
      sessionId: store.sessionId,
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

onMounted(() => {
  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme;
  } else {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.value = prefersDark ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme.value);
});

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
</script>

<style>
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>

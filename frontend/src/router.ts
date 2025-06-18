import { createRouter, createWebHistory } from 'vue-router';
import { useGameStore } from './stores/gamestore';
import Home from './views/Home.vue';
import HostDashboard from './views/HostDashboard.vue';
import TeamDisplay from './views/TeamDisplay.vue';
import Spectator from './views/Spectator.vue';
import NotFound from './views/NotFound.vue';
import { validateSessionId } from './api/session'; // Assuming this function is defined to validate session IDs

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/home', name: 'HomeAlias', component: Home },
  { path: '/host', name: 'HostDashboard', component: HostDashboard },
  { path: '/team', name: 'TeamDisplay', component: TeamDisplay },
  { path: '/spectator', name: 'Spectator', component: Spectator },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const guardedRoutes = ['HostDashboard', 'TeamDisplay', 'Spectator'];

router.beforeEach(async (to, from, next) => {
  const store = useGameStore();

  if (guardedRoutes.includes(to.name as string)) {
    const sessionId = to.query.sessionId as string;

    if (store.enteredFromHome) {
      next();
      return;
    }

    if (sessionId) {
      store.isLoading = true; // Start loading
      const isValid = await validateSessionId(sessionId);
      store.isLoading = false; // Stop loading
      if (isValid) {
        store.enteredFromHome = true;
        store.sessionId = sessionId;
        next();
      } else {
        next({ name: 'Home' });
      }
      return;
    }

    // No sessionId and not entered from home: redirect
    next({ name: 'Home' });
    return;
  }

  next();
});

export default router;

import { createRouter, createWebHistory } from 'vue-router';
import { useGameStore } from './stores/gamestore';
import Home from './views/Home.vue';
import HostDashboard from './views/HostDashboard.vue';
import TeamDisplay from './views/TeamDisplay.vue';
import Spectator from './views/Spectator.vue';
import NotFound from './views/NotFound.vue';

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
router.beforeEach((to, from, next) => {
  const store = useGameStore();
  if (guardedRoutes.includes(to.name as string) && !store.enteredFromHome) {
    next({ name: 'Home' });
    return;
  }
  next();
});

export default router;

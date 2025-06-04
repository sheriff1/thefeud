import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import HostDashboard from './views/HostDashboard.vue';
import TeamDisplay from './views/TeamDisplay.vue';
import Spectator from './views/Spectator.vue';
import NotFound from './views/NotFound.vue';

const routes = [
  { path: '/', component: Home }, // Home page
  { path: '/host', component: HostDashboard }, // Host Dashboard
  { path: '/team', component: TeamDisplay }, // Team Display
  { path: '/spectator', component: Spectator },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

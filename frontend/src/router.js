import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import HostDashboard from './views/HostDashboard.vue';
import TeamDisplay from './views/TeamDisplay.vue';

const routes = [
  { path: '/', component: Home }, // Home page
  { path: '/host', component: HostDashboard }, // Host Dashboard
  { path: '/team', component: TeamDisplay }, // Team Display
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

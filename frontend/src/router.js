import { createRouter, createWebHistory } from 'vue-router'
// import HostView from './views/HostDashboard.vue'
// import TeamView from './views/TeamDisplay.vue'
import HostDashboard from './views/HostDashboard.vue'
import TeamDisplay from './views/TeamDisplay.vue'

const routes = [
  { path: '/', redirect: '/host' },
  { path: '/host', component: HostDashboard },
  { path: '/team', component: TeamDisplay },
]

export default createRouter({
  history: createWebHistory(),
  routes
})

import { createRouter, createWebHistory } from 'vue-router'
import CreateView from './views/CreateView.vue'
import ReadView from './views/ReadView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'create',
      component: CreateView
    },
    {
      path: '/s/:token',
      name: 'read',
      component: ReadView
    }
  ]
})

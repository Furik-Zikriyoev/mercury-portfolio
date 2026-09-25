import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  // страница работ грузится отдельным файлом — главная от этого не тяжелеет
  { path: '/works', name: 'works', component: () => import('@/views/WorksView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  // прокрутку между страницами двигаем сами, вместе с Lenis
  scrollBehavior: () => false,
})

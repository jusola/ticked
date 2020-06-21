import Vue from 'vue'
import VueRouter from 'vue-router'

import net from '@/modules/net'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: require('@/components/Login').default,
    props: true
  },
  {
    path: '/main',
    name: 'Main',
    component: require('@/components/MainPage').default,
    props: true
  },
  {
    path: '/payments',
    name: 'Payments',
    component: require('@/components/Payments').default,
    props: true
  },
  {
    path: '/',
    name: 'redirect',
    redirect: to => {
      if (net.isLoggedIn()) {
        return {
          name: 'Main'
        }
      } else {
        return {
          name: 'Login'
        }
      }
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router

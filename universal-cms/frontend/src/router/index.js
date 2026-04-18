import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/projects/ProjectsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/projects/ProjectDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/builder/:pageId',
    name: 'Builder',
    component: () => import('@/views/builder/EditorView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cms',
    name: 'CMS',
    component: () => import('@/views/cms/CmsDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team',
    name: 'Team',
    component: () => import('@/views/admin/TeamView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/billing',
    name: 'Billing',
    component: () => import('@/views/admin/BillingView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

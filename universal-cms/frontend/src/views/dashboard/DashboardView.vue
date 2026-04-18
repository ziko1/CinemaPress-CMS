<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button @click="logout" class="text-sm text-red-600 hover:text-red-500">Logout</button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Welcome Card -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-2xl font-semibold text-gray-900 mb-2">Welcome to Universal CMS!</h2>
            <p class="text-gray-600">Start building your no-code website today.</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <router-link to="/projects" class="bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-lg transition">
            <h3 class="text-lg font-medium text-gray-900 mb-2">📁 Projects</h3>
            <p class="text-gray-600 text-sm">Manage all your websites and applications</p>
          </router-link>

          <router-link to="/cms" class="bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-lg transition">
            <h3 class="text-lg font-medium text-gray-900 mb-2">📊 CMS</h3>
            <p class="text-gray-600 text-sm">Create and manage content collections</p>
          </router-link>

          <router-link to="/settings" class="bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-lg transition">
            <h3 class="text-lg font-medium text-gray-900 mb-2">⚙️ Settings</h3>
            <p class="text-gray-600 text-sm">Configure your account and billing</p>
          </router-link>
        </div>

        <!-- Stats -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">Projects</dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">0</dd>
          </div>
          <div class="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">Pages</dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">0</dd>
          </div>
          <div class="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">Storage</dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">0 MB</dd>
          </div>
          <div class="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">Plan</dt>
            <dd class="mt-1 text-3xl font-semibold text-primary-600">Free</dd>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Projects</h1>
          <button class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
            + New Project
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Empty State -->
          <div class="col-span-full text-center py-12">
            <p class="text-gray-500 text-lg">No projects yet. Create your first project to get started!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Projects view - placeholder
</script>

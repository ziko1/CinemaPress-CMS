<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<script setup>
// Global app component
</script>

<style>
#app {
  min-height: 100vh;
}
</style>

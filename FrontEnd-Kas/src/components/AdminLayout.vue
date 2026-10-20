<script setup>
import { ref, provide } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

const isSidebarOpen = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

provide('isSidebarOpen', isSidebarOpen)
provide('toggleSidebar', toggleSidebar)
</script>

<template>
  <div class="flex h-screen bg-gray-50/30 overflow-hidden font-sans">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* You can add global font styles in your style.css, but this ensures a clean base font if not already set */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
body {
  font-family: 'Inter', sans-serif;
}
</style>

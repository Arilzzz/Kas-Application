<script setup>
import { ref, provide } from 'vue'
import StudentTopbar from './StudentTopbar.vue'
</script>

<template>
  <div class="flex h-screen bg-gray-50/30 overflow-hidden font-sans">
    <div class="flex-1 flex flex-col overflow-hidden">
      <StudentTopbar />
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa]">
        <div class="w-full px-4 sm:px-6 md:px-8 py-8">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
body {
  font-family: 'Inter', sans-serif;
}
</style>

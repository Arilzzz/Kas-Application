<script setup>
import { inject, ref, onMounted } from 'vue'

const toggleSidebar = inject('toggleSidebar')
const adminName = ref('Admin Kas')
const initials = ref('AK')
const subTitle = ref('Admin Kas')

const getInitials = (name) => {
  if (!name) return 'AK'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

onMounted(() => {
  const userDataStr = localStorage.getItem('user_data')
  if (userDataStr) {
    try {
      const user = JSON.parse(userDataStr)
      if (user) {
        const nama = user.name || user.nama_siswa
        if (nama) {
          adminName.value = nama
          initials.value = getInitials(nama)
        }
        subTitle.value = user.nis ? 'XI TJKT 1' : 'Admin Kas'
      }
    } catch (e) {
      console.error(e)
    }
  }
})
</script>

<template>
  <header class="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
    <div class="flex-1 max-w-2xl flex items-center">
      <button @click="toggleSidebar" class="p-2 mr-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-100 hidden md:block">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>

    <div class="flex items-center gap-6 ml-6">
      <div class="flex items-center gap-3 pl-6 border-l border-gray-200">
        <div class="hidden text-right md:block">
          <p class="text-sm font-semibold text-gray-900 leading-none">{{ adminName }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ subTitle }}</p>
        </div>
        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          {{ initials }}
        </div>
      </div>
    </div>
  </header>
</template>

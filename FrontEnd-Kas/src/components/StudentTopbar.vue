<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const studentName = ref('Siswa')
const initials = ref('SI')

const getInitials = (name) => {
  if (!name) return 'SI'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

onMounted(() => {
  const userDataStr = localStorage.getItem('user_data')
  if (userDataStr) {
    try {
      const user = JSON.parse(userDataStr)
      const nama = user.nama_siswa || user.nama_lengkap || user.name
      if (nama) {
        studentName.value = nama
        initials.value = getInitials(nama)
      }
    } catch (e) {
      console.error(e)
    }
  }
})

function logout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_role')
  localStorage.removeItem('user_data')
  router.push('/login')
}
</script>

<template>
  <header class="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
    <div class="flex items-center gap-3">
      <img src="/Logo.png" alt="Kasku" class="h-9 w-9" />
      <div>
        <h1 class="text-lg font-bold text-blue-900 tracking-tight leading-none">Kasku</h1>
        <p class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Portal Siswa</p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-3 text-right">
        <div>
          <p class="text-sm font-semibold text-gray-900 leading-none">{{ studentName }}</p>
          <p class="text-xs text-gray-500 mt-1">Siswa</p>
        </div>
        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {{ initials }}
        </div>
      </div>
      <button @click="logout"
        class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="hidden sm:block">Keluar</span>
      </button>
    </div>
  </header>
</template>

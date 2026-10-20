<script setup>
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: 'Dashboard', path: '/dashboardstd', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
]

function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_data');
  router.push('/login');
}

const isSidebarOpen = inject('isSidebarOpen')
</script>

<template>
  <div 
    :class="isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'"
    class="bg-slate-50 min-h-screen border-r border-gray-200 flex flex-col justify-between hidden md:flex transition-all duration-300 overflow-hidden flex-shrink-0"
  >
    <div class="w-64 flex flex-col justify-between h-full">
    <div>
      <div class="flex items-center px-6 py-8">
        <img src="/Logo.png" alt="Kasku" class="h-10 w-10 mr-3" />
        <div>
          <h1 class="text-xl font-bold text-blue-900 tracking-tight">Kasku</h1>
          <p class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Portal Siswa</p>
        </div>
      </div>

      <nav class="mt-4 flex flex-col gap-1 px-4">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-white text-blue-700 shadow-sm border border-gray-100/50'
              : 'text-gray-500 hover:bg-white/60 hover:text-gray-900'
          ]"
        >
          <svg
            class="mr-3 h-5 w-5 transition-colors duration-200"
            :class="[
              route.path.startsWith(item.path)
                ? 'text-blue-600'
                : 'text-gray-400 group-hover:text-gray-600'
            ]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          {{ item.name }}
        </router-link>
      </nav>
    </div>

    <div class="p-4 mb-4">
      <button @click="logout" class="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors duration-200 group">
        <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Keluar
      </button>
    </div>
    </div>
  </div>
</template>

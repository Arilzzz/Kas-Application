<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const navigateTo = (path) => router.push(path)

const actions = [
  {
    label: 'Catat Pembayaran',
    desc: 'Input iuran siswa',
    path: '/admin/payment',
    color: 'blue',
    icon: 'M12 4v16m8-8H4'
  },
  {
    label: 'Catat Pengeluaran',
    desc: 'Input pengeluaran kas',
    path: '/admin/expenditure',
    color: 'red',
    icon: 'M20 12H4'
  },
  {
    label: 'Tambah Siswa',
    desc: 'Daftarkan siswa baru',
    path: '/admin/addstudent',
    color: 'green',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
  }
]

const colorMap = {
  blue:  { bg: 'bg-blue-50 hover:bg-blue-600',  icon: 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white', text: 'text-blue-700 group-hover:text-white', sub: 'text-blue-400 group-hover:text-blue-100', ring: 'ring-blue-200' },
  red:   { bg: 'bg-red-50 hover:bg-red-600',    icon: 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white',    text: 'text-red-700 group-hover:text-white',   sub: 'text-red-400 group-hover:text-red-100',   ring: 'ring-red-200' },
  green: { bg: 'bg-green-50 hover:bg-green-600',icon: 'bg-green-100 text-green-600 group-hover:bg-green-500 group-hover:text-white', text: 'text-green-700 group-hover:text-white', sub: 'text-green-400 group-hover:text-green-100', ring: 'ring-green-200' }
}
</script>

<template>
  <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
    <div class="mb-4">
      <h3 class="text-base font-bold text-gray-900">Aksi Cepat</h3>
      <p class="text-xs text-gray-400 mt-0.5">Pintasan untuk mengelola kas kelas</p>
    </div>

    <div class="flex flex-col gap-3">
      <button
        v-for="action in actions"
        :key="action.path"
        @click="navigateTo(action.path)"
        :class="[colorMap[action.color].bg, 'group flex items-center gap-4 p-4 rounded-2xl border border-transparent transition-all duration-200 text-left w-full hover:shadow-md active:scale-[0.98]']"
      >
        <!-- Icon -->
        <div :class="[colorMap[action.color].icon, 'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors']">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="action.icon" />
          </svg>
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <p :class="[colorMap[action.color].text, 'text-sm font-bold leading-tight transition-colors']">{{ action.label }}</p>
          <p :class="[colorMap[action.color].sub, 'text-xs font-medium mt-0.5 transition-colors']">{{ action.desc }}</p>
        </div>

        <!-- Arrow -->
        <svg class="w-4 h-4 text-gray-300 group-hover:text-white/60 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</template>

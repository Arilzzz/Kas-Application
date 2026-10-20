<script setup>
defineProps({
  recentLedger:      { type: Array,    required: true },
  formatDate:        { type: Function, required: true },
  formatShortRupiah: { type: Function, required: true },
  formatRupiah:      { type: Function, required: true },
  weeklyTotalRaw:    { type: Number,   required: true },
  isExpanded:        { type: Boolean,  default: false },
  filterMonth:       { type: String,   default: '' },
  filterWeek:        { type: String,   default: '' },
})

const emit = defineEmits(['toggle', 'update:filterMonth', 'update:filterWeek'])

const BASE_URL   = 'http://127.0.0.1:8000/storage/'
import { ref } from 'vue'
const previewUrl = ref(null)
const openPreview  = (url) => { previewUrl.value = url }
const closePreview = ()    => { previewUrl.value = null }
</script>

<template>
  <div class="bg-slate-50/50 rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col">

    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-base font-bold text-gray-900">Aktivitas Terbaru</h2>
      <button
        v-if="recentLedger.length > 3"
        @click="emit('toggle')"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg"
      >
        {{ isExpanded ? '↑ Tutup' : 'Lihat Semua →' }}
      </button>
    </div>

    <!-- Filter bulan & minggu -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div class="relative">
        <select :value="filterMonth" @change="emit('update:filterMonth', $event.target.value)"
          class="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer">
          <option value="">Semua Bulan</option>
          <option v-for="(name, i) in ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']"
            :key="i" :value="String(i)">{{ name }}</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
      <div class="relative">
        <select :value="filterWeek" @change="emit('update:filterWeek', $event.target.value)"
          class="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer">
          <option value="">Semua Minggu</option>
          <option v-for="n in 4" :key="n" :value="`Minggu ${n}`">Minggu {{ n }}</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="recentLedger.length === 0" class="text-center text-sm text-gray-500 py-8">
      Tidak ada aktivitas pada periode ini
    </div>

    <template v-else>
      <!--
        COLLAPSED: tampilkan hanya 3 item pertama (tidak bisa discroll)
        EXPANDED:  tampilkan SEMUA item dalam container yang bisa discroll (max-height tetap).
                   Item 1–3 ikut discroll bersama item lainnya — tidak ada yang di-fixed.
      -->

      <!-- Collapsed: 3 item saja -->
      <div v-if="!isExpanded" class="flex flex-col gap-2">
        <div
          v-for="item in recentLedger.slice(0, 3)"
          :key="item.id"
          class="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm gap-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
              :class="item.type === 'income' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'">
              <svg v-if="item.type === 'income'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate leading-tight">{{ item.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.date) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button v-if="item.type === 'expense' && item.bukti_foto"
              @click="openPreview(BASE_URL + item.bukti_foto)"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
              title="Lihat bukti foto">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
            <span class="text-sm font-bold whitespace-nowrap"
              :class="item.type === 'income' ? 'text-green-600' : 'text-red-600'">
              {{ item.type === 'income' ? '+' : '-' }}{{ formatShortRupiah(item.amount) }}
            </span>
          </div>
        </div>

        <!-- Hint: berapa transaksi tersembunyi -->
        <button
          v-if="recentLedger.length > 3"
          @click="emit('toggle')"
          class="text-xs text-gray-400 hover:text-blue-600 font-medium transition-colors text-center mt-1 py-1"
        >
          +{{ recentLedger.length - 3 }} transaksi lainnya →
        </button>
      </div>

      <!--
        Expanded: SEMUA item dalam scroll container.
        max-h-[440px] = tinggi tetap, overflow-y-auto = bisa discroll.
        Item 1–3 tidak di-fixed, mereka ikut discroll bersama item lainnya.
      -->
      <div
        v-else
        class="overflow-y-auto max-h-[440px] flex flex-col gap-2 pr-1"
        style="scroll-behavior: smooth;"
      >
        <div
          v-for="item in recentLedger"
          :key="item.id"
          class="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm gap-3 flex-shrink-0"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
              :class="item.type === 'income' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'">
              <svg v-if="item.type === 'income'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate leading-tight">{{ item.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.date) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button v-if="item.type === 'expense' && item.bukti_foto"
              @click="openPreview(BASE_URL + item.bukti_foto)"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
              title="Lihat bukti foto">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
            <span class="text-sm font-bold whitespace-nowrap"
              :class="item.type === 'income' ? 'text-green-600' : 'text-red-600'">
              {{ item.type === 'income' ? '+' : '-' }}{{ formatShortRupiah(item.amount) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Total periode -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div class="w-full bg-blue-600 rounded-xl py-3 px-4 flex justify-between items-center shadow-sm shadow-blue-200">
        <span class="flex items-center gap-2 text-white/80 text-sm">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Total Periode
        </span>
        <span class="text-white text-sm font-bold">+{{ formatRupiah(weeklyTotalRaw) }}</span>
      </div>
    </div>
  </div>

  <!-- Modal preview bukti foto -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="previewUrl" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closePreview"></div>
        <div class="relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 class="text-sm font-bold text-gray-900">Bukti Pengeluaran</h3>
            <button @click="closePreview" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-4 flex items-center justify-center bg-gray-50 min-h-[260px]">
            <img :src="previewUrl" alt="Bukti pengeluaran" class="max-h-[65vh] max-w-full object-contain rounded-xl" />
          </div>
          <div class="px-5 py-3 flex justify-end border-t border-gray-100">
            <a :href="previewUrl" target="_blank" class="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Buka di tab baru
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active { transition: all 0.2s ease-out; }
.modal-fade-leave-active { transition: all 0.15s ease-in; }
.modal-fade-enter-from   { opacity: 0; transform: scale(0.97); }
.modal-fade-leave-to     { opacity: 0; transform: scale(0.97); }

/* Scrollbar tipis untuk area expanded */
.overflow-y-auto::-webkit-scrollbar       { width: 4px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
.overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>

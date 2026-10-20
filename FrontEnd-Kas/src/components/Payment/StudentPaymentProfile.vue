<script setup>
defineProps({
  selectedStudent: Object,
  totalPaid: Number,
  outstanding: Number,
  formatRupiah: Function,
  recentHistory: Array
})

const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="space-y-6">
    <!-- Student Profile -->
    <div class="bg-white rounded-3xl p-6 border-l-4 border-l-blue-600 border border-t-gray-100 border-r-gray-100 border-b-gray-100 shadow-sm relative overflow-hidden">
      <div v-if="!selectedStudent" class="absolute inset-0 bg-gray-50 z-10 flex flex-col items-center justify-center gap-2">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        <p class="text-sm font-bold text-gray-500">Pilih siswa untuk melihat profil</p>
      </div>
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold">
          {{ selectedStudent ? (() => { const n = selectedStudent.nama_siswa || 'U'; const w = n.trim().split(/\s+/); return w.length === 1 ? w[0].substring(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase() })() : '?' }}
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">{{ selectedStudent ? selectedStudent.nama_siswa : 'Nama Siswa' }}</h3>
          <p class="text-xs font-bold text-blue-600 uppercase tracking-wider">NIS: {{ selectedStudent ? selectedStudent.nis : '-----' }}</p>
        </div>
      </div>
      <div class="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
        <span class="text-sm font-medium text-gray-500">Status</span>
        <span class="bg-green-300/30 text-green-800 text-xs font-bold px-3 py-1 rounded-full">ANGGOTA AKTIF</span>
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        <div v-if="!selectedStudent" class="absolute inset-0 bg-gray-50 z-10"></div>
        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">TOTAL DIBAYAR</p>
        <h4 class="text-2xl font-black text-green-600">{{ formatRupiah(totalPaid) }}</h4>
      </div>
      <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        <div v-if="!selectedStudent" class="absolute inset-0 bg-gray-50 z-10"></div>
        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">TUNGGAKAN</p>
        <h4 class="text-2xl font-black text-red-600">{{ outstanding > 0 ? formatRupiah(outstanding) : 'Rp 0' }}</h4>
      </div>
    </div>

    <!-- Recent History -->
    <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
      <div v-if="!selectedStudent" class="absolute inset-0 bg-gray-50 z-10 flex flex-col items-center justify-center gap-2">
        <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-sm font-bold text-gray-400">Pilih siswa untuk melihat riwayat</p>
      </div>
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-bold text-gray-900 text-sm">Riwayat Terakhir</h3>
        <a href="#" class="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</a>
      </div>

      <div class="space-y-4">
        <div v-if="recentHistory.length === 0" class="text-center py-4 text-sm font-medium text-gray-400">
          Belum ada pembayaran.
        </div>
        <div v-for="item in recentHistory" :key="item.id" class="flex justify-between items-center group">
          <div class="flex gap-3">
            <div class="w-1 h-10 bg-green-600 rounded-full"></div>
            <div>
              <p class="text-sm font-bold text-gray-900">{{ item.weekLabel }}</p>
              <p class="text-[10px] font-semibold text-gray-500 mt-0.5">{{ item.dateFormatted }} • Tunai</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-gray-900 mr-2">{{ item.amount }}</span>
            <button @click="emit('edit', item.id)" class="text-gray-400 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button @click="emit('delete', item.id)" class="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Hapus">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <!-- Missing example if outstanding is high -->
        <div v-if="outstanding > 0" class="flex justify-between items-center opacity-80 pt-2">
          <div class="flex gap-3">
            <div class="w-1 h-10 bg-red-200 rounded-full"></div>
            <div>
              <p class="text-sm font-bold text-gray-900 line-through text-gray-400">Minggu Lalu</p>
              <p class="text-[10px] font-bold text-gray-400 mt-0.5 italic">Belum Dibayar</p>
            </div>
          </div>
          <span class="text-sm font-bold text-red-600">Tunggakan</span>
        </div>
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
      <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">i</div>
      <p class="text-xs font-medium text-gray-600 leading-relaxed">
        <span class="font-bold text-gray-900">Tips:</span> Menyimpan pembayaran ini akan memperbarui status iuran kelas siswa secara otomatis.
      </p>
    </div>
  </div>
</template>

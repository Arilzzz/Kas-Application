<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  matrixData: { type: Array, required: true },
  getMonthWeekText: { type: Function, required: true },
  loading: { type: Boolean, required: true },
  readonly: { type: Boolean, default: false }
})

const currentPage = ref(1)
const itemsPerPage = 5

const totalPages = computed(() => Math.ceil(props.matrixData.length / itemsPerPage))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return props.matrixData.slice(start, start + itemsPerPage)
})

const setPage = (page) => { currentPage.value = page }
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
</script>

<template>
  <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
    <div class="p-8 pb-6 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Status Pembayaran</h2>
        <p class="text-sm font-medium text-gray-500 mt-1">{{ getMonthWeekText() }}</p>
      </div>
      <div class="flex bg-gray-100/80 p-1 rounded-lg self-start">
        <button class="px-5 py-2 text-xs font-bold text-gray-800 bg-white rounded-md shadow-sm">Minggu Ini</button>
        <button class="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">Minggu Lalu</button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-100">
        <thead class="bg-white">
          <tr>
            <th scope="col" cla
            <th scope="col" class="px-8 py-5 text-left text-xs font-black text-gray-900 uppercase tracking-widest">Status</th>
            <th scope="col" class="px-8 py-5 text-left text-xs font-black text-gray-900 uppercase tracking-widest">Tanggal Bayar</th>
            <th scope="col" class="px-8 py-5 text-left text-xs font-black text-gray-900 uppercase tracking-widest">Jumlah</th>
            <th v-if="!readonly" scope="col" class="px-8 py-5 text-right text-xs font-black text-gray-900 uppercase tracking-widest">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-if="loading"><td :colspan="readonly ? 4 : 5" class="px-8 py-8 text-center text-gray-500 font-medium">Memuat data...</td></tr>
          <tr v-else-if="matrixData.length === 0"><td :colspan="readonly ? 4 : 5" class="px-8 py-8 text-center text-gray-500 font-medium">Tidak ada data siswa.</td></tr>
          <tr v-for="student in paginatedData" :key="student.id" class="hover:bg-gray-50/50 transition-colors">
            <td class="px-8 py-5 whitespace-nowrap">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-100">
                  {{ student.avatar }}
                </div>
             <span class="font-bold text-sm text-gray-900">{{ student.name }}</span>
              </div>
            </td>
            <td class="px-8 py-5 whitespace-nowrap">
              <span v-if="student.status === 'PAID'" class="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full tracking-wider uppercase">Lunas</span>
              <span v-else class="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full tracking-wider uppercase">Belum Bayar</span>
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
              {{ student.date }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
              {{ student.amount }}
            </td>
            <td v-if="!readonly" class="px-8 py-5 whitespace-nowrap text-right">
              <button v-if="student.status === 'UNPAID'" class="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-md transition-colors uppercase tracking-wider">Ingatkan</button>
              <button v-else class="text-gray-400 hover:text-gray-600 p-1">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="matrixData.length > itemsPerPage" class="p-6 flex items-center justify-between border-t border-gray-100">
      <div class="text-sm text-gray-500 font-medium">
        Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} sampai {{ Math.min(currentPage * itemsPerPage, matrixData.length) }} dari {{ matrixData.length }} data
      </div>
      <div class="flex items-center gap-1.5">
        <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors">
          Sebelumnya
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          @click="setPage(page)"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
          :class="currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'"
        <th>ss="px-8 py-5 text-left text-xs font-black text-gray-900 uppercase tracking-widest">Nama Siswa</th>   
          {{ page }}
        </button>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors">
          Berikutnya
        </button>
      </div>
    </div>
  </div>
</template>

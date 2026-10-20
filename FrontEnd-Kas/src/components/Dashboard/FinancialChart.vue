<script setup>
defineProps({
  chartData: { type: Array, required: true },
  formatShortRupiah: { type: Function, required: true }
})
</script>

<template>
  <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col h-full">
    <div class="flex justify-between items-start mb-8">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Performa Keuangan</h2>
        <p class="text-sm font-medium text-gray-500 mt-1">Analisis Pemasukan vs Pengeluaran</p>
      </div>
      <div class="flex items-center gap-4 text-xs font-bold text-gray-600">
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-700"></span> Pemasukan</div>
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-600"></span> Pengeluaran</div>
      </div>
    </div>

    <div class="flex-1 flex items-end justify-between gap-2 md:gap-8 pt-10 pb-4">
      <div v-for="(data, i) in chartData" :key="i" class="flex flex-col items-center flex-1">
        <div class="flex items-end justify-center gap-1.5 md:gap-3 w-full h-32 border-b border-gray-100 pb-4">
          <div class="w-1/3 max-w-[40px] bg-green-700/40 rounded-t-sm transition-all duration-500 hover:bg-green-700 relative group" :style="{ height: data.incomeHeight }">
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Masuk: {{ formatShortRupiah(data.income) }}
            </div>
          </div>
          <div class="w-1/3 max-w-[40px] bg-red-400 rounded-t-sm transition-all duration-500 hover:bg-red-600 relative group" :style="{ height: data.expenseHeight }">
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Keluar: {{ formatShortRupiah(data.expense) }}
            </div>
          </div>
        </div>
        <span class="text-xs font-bold text-gray-400 mt-4">{{ data.month }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  collectionRate: { type: String, required: true },
  outstanding: { type: String, required: true },
  totalStudents: { type: Number, required: true },
  treasuryBalance: { type: String, required: true }
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <div class="lg:col-span-2 flex flex-col gap-6">
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 border-l-green-500 relative overflow-hidden group hover:shadow-md transition-all">
          <p class="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Persentase Masuk</p>
          <p class="text-3xl font-extrabold text-gray-900">{{ collectionRate }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 border-l-red-500 relative overflow-hidden group hover:shadow-md transition-all">
          <p class="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Tunggakan</p>
          <p class="text-3xl font-extrabold text-gray-900">{{ outstanding }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 border-l-blue-500 relative overflow-hidden group hover:shadow-md transition-all">
          <p class="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Total Siswa</p>
          <p class="text-3xl font-extrabold text-gray-900">{{ totalStudents }}</p>
        </div>
      </div>
    </div>
    <!-- Treasury -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden flex flex-col justify-center">
      <div class="absolute top-0 right-0 p-4 opacity-20"><svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zM15.9 8.1c-.2-.1-.4-.1-.6-.1H15V6c0-1.1-.9-2-2-2h-2c-.55 0-1 .45-1 1s.45 1 1 1h2v2h-1c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h3c.55 0 1 .45 1 1v1h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v3h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-3c-.55 0-1-.45-1-1V9h1c1.1 0 2 .9 2 2v1c0 .55.45 1 1 1s1-.45 1-1v-2.1c0-.4-.1-.8-.3-1.1l-.8-.8z"/></svg></div>
      <p class="text-sm font-semibold tracking-wider text-blue-100 uppercase mb-2">Total Saldo Kas</p>
      <p class="text-4xl font-black mb-4 z-10">{{ treasuryBalance }}</p>
      <div class="flex items-center gap-2 z-10">
        <span class="bg-white/20 text-blue-50 text-xs font-bold px-2 py-1 rounded">+12.4% vs bln lalu</span>
        <svg class="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
      </div>
    </div>
  </div>
</template>

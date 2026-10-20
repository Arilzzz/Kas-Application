<script setup>
defineProps({
  currentBalance: { type: String, required: true },
  balanceTrend: { type: String, required: true },
  totalStudents: { type: Number, required: true },
  incomeThisMonth: { type: String, required: true },
  totalTunggakan: { type: String, required: true },
  totalExpense: { type: String, default: "Rp 0" },
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-6">
    <!-- Top 1: Current Balance -->
    <div
      class="bg-blue-600 rounded-3xl p-5 text-white relative overflow-hidden flex flex-col justify-between h-44 shadow-lg shadow-blue-200"
    >
      <div class="absolute -right-6 -bottom-6 opacity-20 text-white">
        <svg class="w-36 h-36" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          />
        </svg>
      </div>
      <div class="relative z-10">
        <p
          class="text-xs font-bold tracking-wider text-blue-100 uppercase mb-1"
        >
          Total Saldo
        </p>
        <h2 class="text-2xl font-black mb-1 tracking-tight">
          {{ currentBalance }}
        </h2>
      </div>
      <div class="flex items-center gap-2 relative z-10 mt-auto">
        <span
          class="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          {{ balanceTrend }}
        </span>
        <span class="text-blue-100 text-[10px] font-medium"
          >dari bulan lalu</span
        >
      </div>
    </div>

    <!-- Top 2: Income This Month -->
    <div
      class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-44"
    >
      <div>
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs font-bold text-gray-500">Pemasukan Bulan Ini</p>
          <div
            class="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-600"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl font-black text-gray-900 mt-1">
          {{ incomeThisMonth }}
        </h2>
      </div>
      <div class="text-[10px] font-medium text-gray-400 mt-auto">
        Dana masuk bulan ini
      </div>
    </div>

    <!-- Top 3: Pengeluaran Bulan Ini -->
    <div
      class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm border-l-4 border-l-amber-500 flex flex-col justify-between h-44"
    >
      <div>
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs font-bold text-gray-500">Pengeluaran Bulan Ini</p>
          <div
            class="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 12H4"
              />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl font-black text-amber-600 mt-1">
          {{ totalExpense }}
        </h2>
      </div>
      <div
        class="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 self-start mt-auto"
      >
        <svg
          class="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        DANA KELUAR
      </div>
    </div>

    <!-- Top 4: Total Tunggakan -->
    <div
      class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between h-44"
    >
      <div>
        <p class="text-xs font-bold text-gray-500 mb-1">Total Tunggakan</p>
        <h2 class="text-2xl font-black text-red-600 mt-1">
          {{ totalTunggakan }}
        </h2>
      </div>
      <div
        class="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1.5 self-start mt-auto"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        PERLU DITAGIH
      </div>
    </div>

    <!-- Top 5: Total Students -->
    <div
      class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-44"
    >
      <div>
        <p class="text-xs font-bold text-gray-500 mb-1">Total Siswa</p>
        <div class="flex items-baseline gap-2">
          <h2 class="text-3xl font-black text-gray-900">{{ totalStudents }}</h2>
          <span class="text-xs font-medium text-gray-400">Siswa</span>
        </div>
      </div>
      <div class="flex -space-x-2 mt-auto">
        <img
          class="w-7 h-7 rounded-full border-2 border-white bg-blue-100 object-cover"
          src="https://ui-avatars.com/api/?name=A&background=random"
        />
        <img
          class="w-7 h-7 rounded-full border-2 border-white bg-green-100 object-cover"
          src="https://ui-avatars.com/api/?name=B&background=random"
        />
        <img
          class="w-7 h-7 rounded-full border-2 border-white bg-purple-100 object-cover"
          src="https://ui-avatars.com/api/?name=C&background=random"
        />
        <div
          class="w-7 h-7 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[9px] font-bold text-blue-600 z-10"
        >
          +{{ totalStudents > 3 ? totalStudents - 3 : 0 }}
        </div>
      </div>
    </div>
  </div>
</template>

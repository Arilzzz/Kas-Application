<script setup>
defineProps({
  totalStudents: { type: Number, required: true },
  collectionRate: { type: String, required: true },
  unpaidThisWeek: { type: Number, default: 0 },
  weeklyDues: { type: Number, default: 2000 },
});
</script>

<template>
  <div
    class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col h-full"
  >
    <div class="mb-4">
      <h3 class="text-lg font-bold text-gray-900">Informasi Kelas</h3>
      <p class="text-xs text-gray-500 mt-1">
        Ringkasan data dan status kelas kamu.
      </p>
    </div>

    <div class="flex flex-col gap-4 flex-1">
      <!-- Class Summary -->
      <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-blue-900">
              {{ totalStudents }} Siswa
            </p>
            <p class="text-xs text-blue-600">Terdaftar di kelas</p>
          </div>
        </div>
      </div>

      <!-- Weekly Dues Info -->
      <div class="bg-green-50 rounded-xl p-4 border border-green-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-green-900">
              Rp {{ weeklyDues.toLocaleString("id-ID") }} / minggu
            </p>
            <p class="text-xs text-green-600">Iuran kas kelas</p>
          </div>
        </div>
      </div>

      <!-- Collection Rate -->
      <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-bold text-gray-700">
            Tingkat Koleksi Bulan Ini
          </p>
          <span class="text-xs font-black text-blue-600">{{
            collectionRate
          }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            :style="{ width: collectionRate }"
          ></div>
        </div>
      </div>

      <!-- Reminder -->
      <div class="bg-amber-50 rounded-xl p-4 border border-amber-100 mt-auto">
        <div class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <div>
            <p class="text-xs font-bold text-amber-800">Pengingat</p>
            <p class="text-[11px] text-amber-700 mt-0.5">
              Jangan lupa bayar kas mingguan kamu ya! Bayar tepat waktu membantu
              kelancaran kegiatan kelas.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue 3 Composition API
import { ref, computed, watch } from 'vue'

const props = defineProps({
  students:   { type: Array,  required: true },
  payments:   { type: Array,  required: true },
  weeklyDues: { type: Number, default: 2000 }
})

const filterMonth    = ref(new Date().getMonth().toString())
const filterWeek     = ref('')
const activeTab      = ref('all')
const currentPage    = ref(1)
const ITEMS_PER_PAGE = 5

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

// watch: reset halaman saat filter/tab berubah
watch([filterMonth, filterWeek, activeTab], () => { currentPage.value = 1 })

// Parse tanggal string → Date objek lokal (hindari off-by-one UTC)
const parseDate = (str) => {
  if (!str) return new Date()
  const s = str.includes('T') ? str.split('T')[0] : str
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Ambil inisial dari 2 kata pertama nama
const getInitials = (name = '') => {
  const w = name.trim().split(/\s+/)
  return w.length === 1 ? w[0].substring(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase()
}

// Temukan Senin pertama bulan pembayaran pertama siswa (basis carry-over)
const getStudentBase = (sp) => {
  const m = Number(filterMonth.value)
  const y = new Date().getFullYear()
  if (!sp.length) {
    const d = new Date(y, m, 1)
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
    return d
  }
  const first = parseDate([...sp].sort((a, b) => parseDate(a.tanggal_pemasukkan) - parseDate(b.tanggal_pemasukkan))[0].tanggal_pemasukkan)
  const d = new Date(first.getFullYear(), first.getMonth(), 1)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return d
}

// Kembalikan Date objek Senin ke-n pada bulan/tahun tertentu
const getNthMonday = (year, month, n) => {
  const d = new Date(year, month, 1)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return new Date(d.getTime() + (n - 1) * 7 * 86_400_000)
}

// Hitung minggu mana yang sudah terlunasi berdasarkan carry-over total bayar
const getCoveredWeeks = (totalPaid, year, month, base) => {
  const covered = Math.floor(totalPaid / props.weeklyDues)
  return [1,2,3,4].reduce((acc, n) => {
    const ord = Math.floor((getNthMonday(year, month, n) - base) / (7 * 86_400_000)) + 1
    if (ord >= 1 && ord <= covered) acc.push(`w${n}`)
    return acc
  }, [])
}

// Intl.NumberFormat: API bawaan browser untuk format mata uang
const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const targetMonth = computed(() => Number(filterMonth.value))
const targetYear  = computed(() => new Date().getFullYear())

// computed: nilai turunan reaktif, recalculate otomatis saat dependency berubah
const allStudentsEnriched = computed(() => {
  const enriched = props.students.map(s => {
    const sp       = props.payments.filter(p => Number(p.data_student_id) === Number(s.id))
    const total    = sp.reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0)
    const progress = getCoveredWeeks(total, targetYear.value, targetMonth.value, getStudentBase(sp))
    const lunas    = progress.length >= 4
    const tunggak  = Math.max(0, (4 - progress.length)) * props.weeklyDues
    return {
      id:           s.id,
      name:         s.nama_siswa || s.nama_lengkap || 'Tidak Diketahui',
      nisn:         s.nis,
      avatar:       getInitials(s.nama_siswa || s.nama_lengkap || ''),
      progress,
      status:       lunas ? 'Lunas' : 'Belum Bayar',
      totalPaid:    formatRupiah(total),
      tunggakan:    tunggak > 0 ? formatRupiah(tunggak) : null,
      tunggakanRaw: tunggak,
    }
  })
  // Tab "all": urut berdasarkan nama (A–Z) — lunas dan belum bayar tercampur
  // Tab "lunas"/"belum": sorted nama juga, konsisten
  return enriched.sort((a, b) => a.name.localeCompare(b.name, 'id'))
})

// filteredStudents: tab "all" → semua siswa (belum + lunas), tab lain → filter status
const filteredStudents = computed(() => {
  if (activeTab.value === 'lunas') return allStudentsEnriched.value.filter(s => s.status === 'Lunas')
  if (activeTab.value === 'belum') return allStudentsEnriched.value.filter(s => s.status === 'Belum Bayar')
  return allStudentsEnriched.value
})

const totalPages        = computed(() => Math.ceil(filteredStudents.value.length / ITEMS_PER_PAGE))
const paginatedStudents = computed(() => filteredStudents.value.slice((currentPage.value - 1) * ITEMS_PER_PAGE, currentPage.value * ITEMS_PER_PAGE))

const lunasCount = computed(() => allStudentsEnriched.value.filter(s => s.status === 'Lunas').length)
const belumCount = computed(() => allStudentsEnriched.value.filter(s => s.status === 'Belum Bayar').length)

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
</script>

<template>
  <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Status Pembayaran Siswa</h3>
        <p class="text-xs text-gray-500 mt-0.5">{{ MONTH_NAMES[targetMonth] }} · {{ students.length }} siswa</p>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>{{ lunasCount }} Lunas
        </span>
        <span class="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>{{ belumCount }} Tunggak
        </span>
      </div>
    </div>

    <!-- Filter bulan & minggu -->
    <div class="flex gap-2 mb-3">
      <div class="relative flex-1">
        <select v-model="filterMonth"
          class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-7 py-2.5 text-xs font-bold text-gray-700 focus:outline-none appearance-none cursor-pointer">
          <option v-for="(name, i) in MONTH_NAMES" :key="i" :value="String(i)">{{ name }}</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
      <div class="relative flex-1">
        <select v-model="filterWeek"
          class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-7 py-2.5 text-xs font-bold text-gray-700 focus:outline-none appearance-none cursor-pointer">
          <option value="">Semua Minggu</option>
          <option v-for="n in 4" :key="n" :value="`Minggu ${n}`">Minggu {{ n }}</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
    </div>

    <!-- Tab Semua / Lunas / Belum Bayar -->
    <div class="flex gap-1 bg-gray-100/70 rounded-xl p-1 mb-4">
      <button
        v-for="[key, label, count] in [['all','Semua', students.length],['lunas','Lunas', lunasCount],['belum','Belum Bayar', belumCount]]"
        :key="key"
        @click="activeTab = key"
        class="flex-1 py-1.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1"
        :class="activeTab === key ? 'bg-white shadow-sm text-gray-900 font-black' : 'text-gray-500 hover:text-gray-700 font-bold'">
        {{ label }}
        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          :class="activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200/80 text-gray-500'">
          {{ count }}
        </span>
      </button>
    </div>

    <!-- Daftar siswa -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div v-if="filteredStudents.length === 0" class="text-center py-10">
        <div class="text-3xl mb-2">🎉</div>
        <p class="text-sm text-gray-500 font-medium">Tidak ada siswa di kategori ini</p>
      </div>

      <!-- TransitionGroup: animasi otomatis saat item list masuk/keluar/pindah -->
      <TransitionGroup name="slist" tag="div" class="space-y-2">
        <div
          v-for="student in paginatedStudents"
          :key="student.id"
          class="flex items-center gap-3 p-3 rounded-2xl border transition-all"
          :class="student.status === 'Lunas'
            ? 'bg-green-50/40 border-green-100/70 hover:bg-green-50'
            : 'bg-gray-50/50 border-gray-100 hover:bg-red-50/20 hover:border-red-100/60'">

          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border"
            :class="student.status === 'Lunas' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-600 border-red-200'">
            {{ student.avatar }}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-gray-900 truncate leading-tight">{{ student.name }}</p>
            <p class="text-[10px] text-gray-400 font-medium">NIS: {{ student.nisn }}</p>
          </div>

          <!-- Indikator minggu w1–w4 -->
          <div class="flex gap-0.5">
            <div v-for="w in ['w1','w2','w3','w4']" :key="w"
              class="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center transition-colors"
              :class="student.progress.includes(w) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'">
              {{ w.slice(1) }}
            </div>
          </div>

          <div class="text-right flex-shrink-0 min-w-[60px]">
            <p class="text-xs font-black leading-tight"
              :class="student.status === 'Lunas' ? 'text-green-600' : 'text-red-500'">
              {{ student.totalPaid }}
            </p>
            <p class="text-[9px] font-bold mt-0.5"
              :class="student.status === 'Lunas' ? 'text-green-500' : 'text-red-400'">
              {{ student.status }}
            </p>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
      <p class="text-xs text-gray-400 font-bold">
        {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}–{{ Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length) }} / {{ filteredStudents.length }}
      </p>
      <div class="flex items-center gap-2">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span class="text-xs font-bold text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages"
          class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* TransitionGroup: animasi masuk, keluar, dan geser posisi item list */
.slist-enter-active { transition: all 0.25s ease; }
.slist-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.slist-enter-from   { opacity: 0; transform: translateY(-6px); }
.slist-leave-to     { opacity: 0; }
.slist-move         { transition: transform 0.25s ease; }
</style>

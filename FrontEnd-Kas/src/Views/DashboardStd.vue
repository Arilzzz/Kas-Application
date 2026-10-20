<script setup>
// Vue 3 Composition API
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '../components/StudentLayout.vue'
import DashboardSummaryCards from '../components/Dashboard/DashboardSummaryCards.vue'
import FinancialChart from '../components/Dashboard/FinancialChart.vue'
import RecentLedger from '../components/Dashboard/RecentLedger.vue'
import SiswaMenunggak from '../components/Dashboard/SiswaMenunggak.vue'
import api from '../services/api'

// ─── State reaktif utama ─────────────────────────────────────────────────────
// ref() membungkus nilai menjadi reaktif; akses/ubah via .value di dalam script
const students = ref([])
const payments = ref([])
const expenses = ref([])
const loading  = ref(true)

const WEEKLY_DUES = 2000  // iuran per minggu

// ─── Helper: format rupiah menggunakan Intl.NumberFormat bawaan browser ───────
const formatRupiah      = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const formatShortRupiah = (n) => n >= 1_000_000 ? `Rp ${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `Rp ${(n/1_000).toFixed(0)}k` : `Rp ${n}`

// ─── Helper: parse tanggal lokal (menghindari off-by-one timezone UTC) ────────
const parseDate = (s) => {
  if (!s) return new Date()
  const clean = s.includes('T') ? s.split('T')[0] : s
  const [y, m, d] = clean.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─── Helper: pengecekan hari relatif ─────────────────────────────────────────
const sameDate  = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
const isToday   = (d) => sameDate(d, new Date())
const isYesterday = (d) => { const y = new Date(); y.setDate(y.getDate() - 1); return sameDate(d, y) }

const formatDate = (s) => {
  const d = parseDate(s)
  if (isToday(d))     return 'Hari Ini'
  if (isYesterday(d)) return 'Kemarin'
  // toLocaleDateString: format tanggal sesuai locale 'id-ID' (Bahasa Indonesia)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Helper: deteksi minggu ini (Senin–Minggu) ────────────────────────────────
const getMonday = (d) => {
  const x = new Date(d)
  const day = x.getDay()
  x.setDate(x.getDate() - day + (day === 0 ? -6 : 1))
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}
const isThisWeek  = (s) => { const t = new Date(s).getTime(); const mon = getMonday(new Date()); return t >= mon && t < mon + 7*86_400_000 }
const isLastMonth = (s) => {
  const d = new Date(s), now = new Date()
  let m = now.getMonth() - 1, y = now.getFullYear()
  if (m < 0) { m = 11; y-- }
  return d.getMonth() === m && d.getFullYear() === y
}

// ─── Helper: minggu ke-n berdasarkan Senin pertama bulan ─────────────────────
const getWeekOfMonth = (s) => {
  const date = parseDate(s)
  const mon  = new Date(date.getFullYear(), date.getMonth(), 1)
  while (mon.getDay() !== 1) mon.setDate(mon.getDate() + 1)
  if (date < mon) return 'Minggu 1'
  const diff = Math.floor((date - mon) / 86_400_000)
  return `Minggu ${Math.min(Math.floor(diff / 7) + 1, 4)}`
}

// ─── State filter ledger & expand ────────────────────────────────────────────
const filterMonth      = ref('')
const filterWeek       = ref('')
const isLedgerExpanded = ref(false)
const toggleLedger     = () => { isLedgerExpanded.value = !isLedgerExpanded.value }

// ─── Helper: ambil total pemasukan bulan tertentu ────────────────────────────
const incomeOfMonth = (m, y) =>
  payments.value
    .filter(p => { const d = new Date(p.tanggal_pemasukkan); return d.getMonth() === m && d.getFullYear() === y })
    .reduce((s, p) => s + Number(p.jumlah_pemasukkan), 0)

const expenseOfMonth = (m, y) =>
  expenses.value
    .filter(e => { const d = new Date(e.tanggal_pengeluaran); return d.getMonth() === m && d.getFullYear() === y })
    .reduce((s, e) => s + Number(e.jumlah_pengeluaran), 0)

// ─── computed(): nilai turunan; di-cache, hanya recalculate saat dependency berubah ──
const currentBalanceRaw   = computed(() =>
  payments.value.reduce((s,p) => s + Number(p.jumlah_pemasukkan), 0) -
  expenses.value.reduce((s,e) => s + Number(e.jumlah_pengeluaran), 0)
)
const currentBalance = computed(() => formatRupiah(currentBalanceRaw.value))

const balanceTrend = computed(() => {
  const now = new Date()
  const cur = incomeOfMonth(now.getMonth(), now.getFullYear())
  const prv = payments.value.filter(p => isLastMonth(p.tanggal_pemasukkan)).reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0)
  if (!prv) return '+100%'
  return `${((cur-prv)/prv*100).toFixed(1).replace(/^(?!-)/, '+')}%`
})

const totalStudents      = computed(() => students.value.length)
const incomeThisMonthRaw = computed(() => incomeOfMonth(new Date().getMonth(), new Date().getFullYear()))
const incomeThisMonth    = computed(() => formatRupiah(incomeThisMonthRaw.value))

const totalTunggakanRaw  = computed(() => Math.max(0, totalStudents.value * 4 * WEEKLY_DUES - incomeThisMonthRaw.value))
const totalTunggakan     = computed(() => formatRupiah(totalTunggakanRaw.value))

const totalExpenseThisMonth = computed(() => formatRupiah(expenseOfMonth(new Date().getMonth(), new Date().getFullYear())))

// ─── Data untuk chart performa 5 bulan terakhir ──────────────────────────────
const chartData = computed(() => {
  const MONTHS = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGS','SEP','OKT','NOV','DES']
  const now = new Date()
  const data = Array.from({ length: 5 }, (_, i) => {
    let m = now.getMonth() - (4 - i), y = now.getFullYear()
    if (m < 0) { m += 12; y-- }
    return { month: MONTHS[m], income: incomeOfMonth(m, y), expense: expenseOfMonth(m, y) }
  })
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 10_000)
  return data.map(d => ({
    ...d,
    incomeHeight:  `${(d.income  / maxVal) * 100}%`,
    expenseHeight: `${(d.expense / maxVal) * 100}%`,
  }))
})

// ─── Ledger: gabungan pemasukan dan pengeluaran, difilter dan diurutkan ───────
const recentLedger = computed(() => {
  let list = [
    ...payments.value.map(p => {
      const s = students.value.find(x => Number(x.id) === Number(p.data_student_id))
      return {
        id:         `p-${p.id}`,
        type:       'income',
        title:      `Pembayaran - ${s ? (s.nama_siswa||'').split(' ')[0] : 'Tidak Diketahui'}`,
        amount:     Number(p.jumlah_pemasukkan),
        date:       p.tanggal_pemasukkan,
        created_at: p.created_at || p.tanggal_pemasukkan,
      }
    }),
    ...expenses.value.map(e => ({
      id:         `e-${e.id}`,
      type:       'expense',
      title:      e.keterangan || 'Pengeluaran',
      amount:     Number(e.jumlah_pengeluaran),
      date:       e.tanggal_pengeluaran,
      created_at: e.created_at || e.tanggal_pengeluaran,
      bukti_foto: e.bukti_foto || null,
    })),
  ]

  if (filterMonth.value !== '')
    list = list.filter(i => parseDate(i.date).getMonth() === Number(filterMonth.value))
  if (filterWeek.value !== '')
    list = list.filter(i => getWeekOfMonth(i.date) === filterWeek.value)

  // Urutkan terbaru di atas berdasarkan waktu dibuat (bukan tanggal bayar)
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const weeklyTotalRaw = computed(() => {
  const inc = payments.value.filter(p => isThisWeek(p.tanggal_pemasukkan)).reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0)
  const exp = expenses.value.filter(e => isThisWeek(e.tanggal_pengeluaran)).reduce((s,e)=>s+Number(e.jumlah_pengeluaran),0)
  return inc - exp
})

// ─── State & logic kartu status pembayaran personal siswa ────────────────────
const loggedInUser = ref(null)

const myPayments = computed(() => {
  if (!loggedInUser.value) return []
  return payments.value.filter(p => Number(p.data_student_id) === Number(loggedInUser.value.id))
})

const selectedMonth = ref(new Date().getMonth())
const selectedYear  = ref(new Date().getFullYear())
const MONTH_SHORT   = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

const shiftMonth = (dir) => {
  const next = selectedMonth.value + dir
  if (next < 0)  { selectedMonth.value = 11; selectedYear.value-- }
  else if (next > 11) { selectedMonth.value = 0;  selectedYear.value++ }
  else selectedMonth.value = next
}

// Base = Senin pertama bulan pembayaran pertama → titik awal penghitungan carry-over
const myBase = computed(() => {
  const sp = myPayments.value
  const fallbackDate = new Date(selectedYear.value, selectedMonth.value, 1)
  const startDate = sp.length
    ? [...sp].sort((a,b) => parseDate(a.tanggal_pemasukkan) - parseDate(b.tanggal_pemasukkan))[0].tanggal_pemasukkan
    : fallbackDate.toISOString()
  const d = parseDate(startDate)
  const base = new Date(d.getFullYear(), d.getMonth(), 1)
  while (base.getDay() !== 1) base.setDate(base.getDate() + 1)
  return base
})

// Senin ke-n dalam bulan tertentu
const getNthMonday = (y, m, n) => {
  const d = new Date(y, m, 1)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return new Date(d.getTime() + (n-1) * 7 * 86_400_000)
}

// Minggu mana saja yang sudah lunas di bulan yang dipilih
const myWeeksPaid = computed(() => {
  const total   = myPayments.value.reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0)
  if (!total) return []
  const covered = Math.floor(total / WEEKLY_DUES)
  return [1,2,3,4].reduce((acc, n) => {
    const ord = Math.floor((getNthMonday(selectedYear.value, selectedMonth.value, n) - myBase.value) / (7*86_400_000)) + 1
    if (ord >= 1 && ord <= covered) acc.push(`Minggu ${n}`)
    return acc
  }, [])
})

const myTotalPaid = computed(() =>
  formatRupiah(myPayments.value.reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0))
)

const myOutstanding = computed(() => {
  const now = new Date()
  let mon   = new Date(now)
  while (mon.getDay() !== 1) mon.setDate(mon.getDate() - 1)
  const weekOrd = Math.floor((mon - myBase.value) / (7*86_400_000)) + 1
  const covered = Math.floor(myPayments.value.reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0) / WEEKLY_DUES)
  return formatRupiah(Math.max(0, weekOrd - covered) * WEEKLY_DUES)
})

// ─── Fetch data dari API menggunakan Promise.all (parallel request) ───────────
// Promise.all: semua request dijalankan bersamaan, tunggu semuanya selesai
const fetchData = async () => {
  loading.value = true
  try {
    const [sRes, pRes, eRes] = await Promise.all([
      api.get('/student').catch(()   => ({ data: { Data: [] } })),
      api.get('/pembayaran').catch(() => ({ data: { Data: [] } })),
      api.get('/pengeluaran').catch(() => ({ data: { Data: [] } })),
    ])
    students.value = sRes.data.Data || sRes.data || []
    payments.value = pRes.data.Data || pRes.data || []
    expenses.value = eRes.data.Data || eRes.data || []
  } catch (e) {
    console.error('Gagal memuat data:', e)
  } finally {
    loading.value = false
  }
}

// onMounted: lifecycle hook Vue, dijalankan setelah komponen pertama kali ditampilkan di DOM
onMounted(() => {
  fetchData()
  const raw = localStorage.getItem('user_data')
  if (raw) loggedInUser.value = JSON.parse(raw)
})
</script>

<template>
  <StudentLayout>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Keuangan Kelas</h1>
      <p class="text-gray-500 mt-1">Pantau pemasukan, pengeluaran, dan saldo kas kelas secara transparan dan akurat.</p>
    </div>

    <!-- Kartu ringkasan KPI atas -->
    <DashboardSummaryCards
      :currentBalance="currentBalance"
      :balanceTrend="balanceTrend"
      :totalStudents="totalStudents"
      :incomeThisMonth="incomeThisMonth"
      :totalTunggakan="totalTunggakan"
      :totalExpense="totalExpenseThisMonth"
    />

    <!-- Baris tengah: Chart kiri, Status pembayaran personal kanan -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <div class="xl:col-span-2">
        <FinancialChart :chartData="chartData" :formatShortRupiah="formatShortRupiah" />
      </div>

      <div class="xl:col-span-1">
        <div v-if="loggedInUser" class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full min-h-[350px]">
          <!-- Header kartu personal -->
          <div class="mb-4 flex items-center gap-2.5">
            <span class="text-xl">👋</span>
            <div>
              <h3 class="text-sm font-black text-gray-900 leading-none">Status Pembayaran Kamu</h3>
              <p class="text-[11px] font-semibold text-gray-500 mt-1">
                {{ loggedInUser.nama_siswa || loggedInUser.nama_lengkap }} (NIS: {{ loggedInUser.nis }})
              </p>
            </div>
          </div>

          <!-- Navigator bulan + indikator minggu -->
          <div class="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100/50">
            <div class="flex items-center justify-between mb-3">
              <button @click="shiftMonth(-1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <p class="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                Progres Pembayaran — {{ MONTH_SHORT[selectedMonth] }} {{ selectedYear }}
              </p>
              <button @click="shiftMonth(1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            <!-- Indikator 4 minggu -->
            <div class="flex justify-between items-center px-2">
              <div v-for="n in 4" :key="n" class="flex flex-col items-center gap-1.5">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-sm border"
                  :class="myWeeksPaid.includes(`Minggu ${n}`)
                    ? 'bg-green-600 text-white border-green-700 shadow-green-100'
                    : 'bg-red-50 text-red-600 border-red-100 shadow-red-50'">
                  <svg v-if="myWeeksPaid.includes(`Minggu ${n}`)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span v-else class="text-xs">✕</span>
                </div>
                <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">{{ n }}</span>
              </div>
            </div>
          </div>

          <!-- Total setor & tunggakan -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-blue-50/50 border border-blue-100/30 rounded-xl p-3 text-center">
              <p class="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-0.5">Total Setor</p>
              <p class="text-sm font-black text-blue-800">{{ myTotalPaid }}</p>
            </div>
            <div class="bg-amber-50/50 border border-amber-100/30 rounded-xl p-3 text-center">
              <p class="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-0.5">Tunggakan Kamu</p>
              <p class="text-sm font-black" :class="myOutstanding !== 'Rp 0' ? 'text-red-600' : 'text-green-600'">
                {{ myOutstanding }}
              </p>
            </div>
          </div>

          <!-- Info cara bayar -->
          <div class="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex gap-3 text-[11px] leading-relaxed">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="font-bold text-blue-900 mb-1">Cara Pembayaran Kas:</p>
              <p class="text-blue-700 font-medium">Setor langsung ke Bendahara Kelas (Rp 2.000/minggu) atau transfer ke rekening kelas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Baris bawah: Status Pembayaran Siswa (2 kolom) + Aktivitas Terbaru (1 kolom) -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div :class="isLedgerExpanded ? 'xl:col-span-1' : 'xl:col-span-2'">
        <SiswaMenunggak :students="students" :payments="payments" :weeklyDues="WEEKLY_DUES" />
      </div>
      <div :class="isLedgerExpanded ? 'xl:col-span-2' : 'xl:col-span-1'">
        <RecentLedger
          :recentLedger="recentLedger"
          :formatDate="formatDate"
          :formatShortRupiah="formatShortRupiah"
          :formatRupiah="formatRupiah"
          :weeklyTotalRaw="weeklyTotalRaw"
          :isExpanded="isLedgerExpanded"
          v-model:filterMonth="filterMonth"
          v-model:filterWeek="filterWeek"
          @toggle="toggleLedger"
        />
      </div>
    </div>
  </StudentLayout>
</template>

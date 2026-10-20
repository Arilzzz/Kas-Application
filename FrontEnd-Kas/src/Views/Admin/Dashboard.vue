<script setup>
// Vue 3 Composition API
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import DashboardSummaryCards from '../../components/Dashboard/DashboardSummaryCards.vue'
import FinancialChart from '../../components/Dashboard/FinancialChart.vue'
import RecentLedger from '../../components/Dashboard/RecentLedger.vue'
import QuickActions from '../../components/Dashboard/QuickActions.vue'
import SiswaMenunggak from '../../components/Dashboard/SiswaMenunggak.vue'
import api from '../../services/api'

// ─── State reaktif utama ─────────────────────────────────────────────────────
const students = ref([])
const payments = ref([])
const expenses = ref([])
const loading  = ref(true)

const WEEKLY_DUES = 2000

// ─── Helper: format rupiah menggunakan Intl.NumberFormat bawaan browser ───────
const formatRupiah      = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const formatShortRupiah = (n) => n >= 1_000_000 ? `Rp ${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `Rp ${(n/1_000).toFixed(0)}k` : `Rp ${n}`

// ─── Helper: parse tanggal lokal (hindari off-by-one akibat UTC) ──────────────
const parseDate = (s) => {
  if (!s) return new Date()
  const clean = s.includes('T') ? s.split('T')[0] : s
  const [y, m, d] = clean.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─── Helper: pengecekan hari relatif ─────────────────────────────────────────
const sameDate    = (a, b) => a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear()
const isToday     = (d) => sameDate(d, new Date())
const isYesterday = (d) => { const y=new Date(); y.setDate(y.getDate()-1); return sameDate(d,y) }

const formatDate = (s) => {
  const d = parseDate(s)
  if (isToday(d))     return 'Hari Ini'
  if (isYesterday(d)) return 'Kemarin'
  // toLocaleDateString: format tanggal sesuai locale Bahasa Indonesia
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Helper: deteksi minggu ini ───────────────────────────────────────────────
const getMonday  = (d) => { const x=new Date(d), day=x.getDay(); x.setDate(x.getDate()-day+(day===0?-6:1)); x.setHours(0,0,0,0); return x.getTime() }
const isThisWeek = (s) => { const t=new Date(s).getTime(), mon=getMonday(new Date()); return t>=mon && t<mon+7*86_400_000 }
const isLastMonth = (s) => {
  const d=new Date(s), now=new Date()
  let m=now.getMonth()-1, y=now.getFullYear()
  if(m<0){m=11;y--}
  return d.getMonth()===m && d.getFullYear()===y
}

const getWeekOfMonth = (s) => {
  const date = parseDate(s)
  const mon  = new Date(date.getFullYear(), date.getMonth(), 1)
  while (mon.getDay() !== 1) mon.setDate(mon.getDate() + 1)
  if (date < mon) return 'Minggu 1'
  return `Minggu ${Math.min(Math.floor((date - mon) / 86_400_000 / 7) + 1, 4)}`
}

// ─── State filter ledger & expand ────────────────────────────────────────────
const filterMonth      = ref('')
const filterWeek       = ref('')
const isLedgerExpanded = ref(false)
const toggleLedger     = () => { isLedgerExpanded.value = !isLedgerExpanded.value }

// ─── Helper: total pemasukan/pengeluaran suatu bulan ─────────────────────────
const incomeOfMonth  = (m, y) => payments.value.filter(p=>{const d=new Date(p.tanggal_pemasukkan);return d.getMonth()===m&&d.getFullYear()===y}).reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0)
const expenseOfMonth = (m, y) => expenses.value.filter(e=>{const d=new Date(e.tanggal_pengeluaran);return d.getMonth()===m&&d.getFullYear()===y}).reduce((s,e)=>s+Number(e.jumlah_pengeluaran),0)

// ─── computed(): nilai turunan yang di-cache otomatis ─────────────────────────
const currentBalanceRaw   = computed(() => payments.value.reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0) - expenses.value.reduce((s,e)=>s+Number(e.jumlah_pengeluaran),0))
const currentBalance      = computed(() => formatRupiah(currentBalanceRaw.value))

const balanceTrend = computed(() => {
  const now = new Date()
  const cur = incomeOfMonth(now.getMonth(), now.getFullYear())
  const prv = payments.value.filter(p=>isLastMonth(p.tanggal_pemasukkan)).reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0)
  if (!prv) return '+100%'
  return `${((cur-prv)/prv*100).toFixed(1).replace(/^(?!-)/,'+')}%`
})

const totalStudents      = computed(() => students.value.length)
const incomeThisMonthRaw = computed(() => incomeOfMonth(new Date().getMonth(), new Date().getFullYear()))
const incomeThisMonth    = computed(() => formatRupiah(incomeThisMonthRaw.value))
const totalTunggakan     = computed(() => formatRupiah(Math.max(0, totalStudents.value*4*WEEKLY_DUES - incomeThisMonthRaw.value)))
const totalExpenseThisMonth = computed(() => formatRupiah(expenseOfMonth(new Date().getMonth(), new Date().getFullYear())))

// ─── Data chart performa 5 bulan terakhir ────────────────────────────────────
const chartData = computed(() => {
  const MONTHS = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGS','SEP','OKT','NOV','DES']
  const now = new Date()
  const data = Array.from({ length: 5 }, (_, i) => {
    let m = now.getMonth() - (4 - i), y = now.getFullYear()
    if (m < 0) { m += 12; y-- }
    return { month: MONTHS[m], income: incomeOfMonth(m,y), expense: expenseOfMonth(m,y) }
  })
  const maxVal = Math.max(...data.flatMap(d=>[d.income, d.expense]), 10_000)
  return data.map(d => ({ ...d, incomeHeight:`${d.income/maxVal*100}%`, expenseHeight:`${d.expense/maxVal*100}%` }))
})

// ─── Ledger: gabungan pemasukan & pengeluaran dengan filter dan sort ──────────
const recentLedger = computed(() => {
  let list = [
    ...payments.value.map(p => {
      const s = students.value.find(x => Number(x.id) === Number(p.data_student_id))
      // Kalkulasi tunggakan bulan saat transaksi terjadi (hanya untuk admin)
      const pm = new Date(p.tanggal_pemasukkan).getMonth()
      const py = new Date(p.tanggal_pemasukkan).getFullYear()
      const paidInMonth = payments.value
        .filter(x => Number(x.data_student_id)===Number(p.data_student_id) && new Date(x.tanggal_pemasukkan).getMonth()===pm && new Date(x.tanggal_pemasukkan).getFullYear()===py)
        .reduce((sum,x)=>sum+Number(x.jumlah_pemasukkan),0)
      return {
        id:         `p-${p.id}`,
        type:       'income',
        title:      `Pembayaran - ${s ? (s.nama_siswa||'').split(' ')[0] : 'Tidak Diketahui'}`,
        amount:     Number(p.jumlah_pemasukkan),
        tunggakan:  Math.max(0, 4*WEEKLY_DUES - paidInMonth),
        date:       p.tanggal_pemasukkan,
        created_at: p.created_at || p.tanggal_pemasukkan,
      }
    }),
    ...expenses.value.map(e => ({
      id:         `e-${e.id}`,
      type:       'expense',
      title:      e.keterangan || 'Pengeluaran',
      amount:     Number(e.jumlah_pengeluaran),
      tunggakan:  0,
      date:       e.tanggal_pengeluaran,
      created_at: e.created_at || e.tanggal_pengeluaran,
      bukti_foto: e.bukti_foto || null,
    })),
  ]

  if (filterMonth.value !== '')
    list = list.filter(i => parseDate(i.date).getMonth() === Number(filterMonth.value))
  if (filterWeek.value !== '')
    list = list.filter(i => getWeekOfMonth(i.date) === filterWeek.value)

  return list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
})

const weeklyTotalRaw = computed(() => {
  const inc = payments.value.filter(p=>isThisWeek(p.tanggal_pemasukkan)).reduce((s,p)=>s+Number(p.jumlah_pemasukkan),0)
  const exp = expenses.value.filter(e=>isThisWeek(e.tanggal_pengeluaran)).reduce((s,e)=>s+Number(e.jumlah_pengeluaran),0)
  return inc - exp
})

// ─── Fetch semua data secara paralel menggunakan Promise.all ──────────────────
// Promise.all: menjalankan semua request bersamaan, lebih cepat dari sequential await
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

// onMounted: lifecycle hook — dijalankan setelah komponen pertama kali mount ke DOM
onMounted(() => { fetchData() })
</script>

<template>
  <AdminLayout>
    <!-- Kartu ringkasan KPI atas -->
    <DashboardSummaryCards
      :currentBalance="currentBalance"
      :balanceTrend="balanceTrend"
      :totalStudents="totalStudents"
      :incomeThisMonth="incomeThisMonth"
      :totalTunggakan="totalTunggakan"
      :totalExpense="totalExpenseThisMonth"
    />

    <!-- Baris tengah: Chart kiri, Aktivitas kanan (expand-able) -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <div :class="isLedgerExpanded ? 'xl:col-span-1' : 'xl:col-span-2'">
        <FinancialChart :chartData="chartData" :formatShortRupiah="formatShortRupiah" />
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

    <!-- Baris bawah: Status pembayaran siswa kiri, Aksi cepat kanan -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2">
        <SiswaMenunggak :students="students" :payments="payments" :weeklyDues="WEEKLY_DUES" />
      </div>
      <div class="self-start">
        <QuickActions />
      </div>
    </div>
  </AdminLayout>
</template>

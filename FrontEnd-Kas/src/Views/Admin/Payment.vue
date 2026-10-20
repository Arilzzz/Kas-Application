<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import StudentPaymentProfile from '../../components/Payment/StudentPaymentProfile.vue'
import api from '../../services/api'

const router = useRouter()
const students = ref([])
const payments = ref([])
const expenses = ref([])
const loading = ref(true)
const isSubmitting = ref(false)

// Form State
const selectedStudentId = ref('')
const amount = ref('')
const useTodayDate = ref(true)
const showSuccess = ref(false)

const WEEKLY_DUES = 2000

// Use local date — new Date().toISOString() is UTC and causes off-by-one at midnight WIB
const getTodayLocalDate = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const transactionDate = ref(getTodayLocalDate())

const todayFormatted = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

watch(useTodayDate, (isToday) => {
  if (isToday) transactionDate.value = getTodayLocalDate()
})

// Fetch Data
const fetchData = async () => {
  loading.value = true
  try {
    const [studentsRes, paymentsRes, expensesRes] = await Promise.all([
      api.get('/student'),
      api.get('/pembayaran').catch(() => ({ data: { Data: [] } })),
      api.get('/pengeluaran').catch(() => ({ data: { Data: [] } }))
    ])
    students.value = studentsRes.data.Data || studentsRes.data || []
    payments.value = paymentsRes.data.Data || paymentsRes.data || []
    expenses.value = expensesRes.data.Data || expensesRes.data || []
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

const treasuryBalance = computed(() => {
  const totalIn = payments.value.reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0)
  const totalOut = expenses.value.reduce((sum, e) => sum + Number(e.jumlah_pengeluaran), 0)
  return totalIn - totalOut
})

const selectedStudent = computed(() => {
  if (!selectedStudentId.value) return null
  return students.value.find(s => Number(s.id) === Number(selectedStudentId.value))
})

const studentPayments = computed(() => {
  if (!selectedStudent.value) return []
  return payments.value
    .filter(p => Number(p.data_student_id) === Number(selectedStudent.value.id))
    .sort((a, b) => new Date(b.created_at || b.tanggal_pemasukkan) - new Date(a.created_at || a.tanggal_pemasukkan))
})

const totalPaid = computed(() =>
  studentPayments.value.reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0)
)

const outstanding = computed(() => {
  const currentMonth = new Date().getMonth()
  const monthsActive = Math.max(1, currentMonth - 5)
  const target = monthsActive * 4 * WEEKLY_DUES
  const diff = target - totalPaid.value
  return diff > 0 ? diff : 0
})

const formatRupiah = (num) => {
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}k`
  return `Rp ${num}`
}

const getWeekOfMonth = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth()
  let firstMonday = new Date(year, month, 1)
  while (firstMonday.getDay() !== 1) firstMonday.setDate(firstMonday.getDate() + 1)
  if (date < firstMonday) return 'Minggu 1'
  const diffDays = Math.floor((date - firstMonday) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) return 'Minggu 1'
  if (diffDays < 14) return 'Minggu 2'
  if (diffDays < 21) return 'Minggu 3'
  return 'Minggu 4'
}

const recentHistory = computed(() =>
  studentPayments.value.slice(0, 3).map(p => {
    const d = new Date(p.tanggal_pemasukkan)
    return {
      id: p.id,
      dateFormatted: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      weekLabel: `${d.toLocaleString('id-ID', { month: 'short' })} ${getWeekOfMonth(p.tanggal_pemasukkan)}`,
      amount: formatRupiah(p.jumlah_pemasukkan)
    }
  })
)

const savePayment = async () => {
  const dateToSave = useTodayDate.value ? getTodayLocalDate() : transactionDate.value
  if (!selectedStudentId.value || !amount.value || !dateToSave) return

  isSubmitting.value = true
  try {
    await api.post('/pembayaran', {
      data_student_id: selectedStudentId.value,
      jumlah_pemasukkan: Math.round(Number(amount.value)),
      tanggal_pemasukkan: dateToSave
    })
    const paymentsRes = await api.get('/pembayaran')
    payments.value = paymentsRes.data.Data || paymentsRes.data || []
    amount.value = ''
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } catch (error) {
    console.error('Failed to save payment:', error)
    if (error.response) alert('Error: ' + JSON.stringify(error.response.data))
  } finally {
    isSubmitting.value = false
  }
}

const editPayment = (id) => router.push({ path: '/admin/editpayment', query: { id } })

const deletePayment = async (id) => {
  if (!confirm('Hapus pembayaran ini?')) return
  try {
    await api.delete(`/pembayaran/${id}`)
    const paymentsRes = await api.get('/pembayaran')
    payments.value = paymentsRes.data.Data || paymentsRes.data || []
  } catch (error) {
    console.error('Failed to delete payment:', error)
    alert('Gagal menghapus pembayaran.')
  }
}

onMounted(() => { fetchData() })
</script>

<template>
  <AdminLayout>
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <router-link to="/admin/dashboard" class="flex items-center text-blue-600 text-sm font-medium hover:underline mb-2">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Kembali ke Dashboard
        </router-link>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">Catat Pembayaran</h1>
        <p class="text-gray-500 font-medium mt-2 mb-6">Kelola iuran siswa dengan presisi akademik.</p>
        <div class="flex bg-gray-200 rounded-full p-1 max-w-fit relative overflow-hidden">
          <div class="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm"></div>
          <button class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-900 w-32 cursor-default">Catat Baru</button>
          <button @click="router.push('/admin/editpayment')" class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors w-32">Edit Data</button>
        </div>
      </div>
      <div class="bg-white rounded-2xl px-6 py-4 border border-gray-100 shadow-sm flex items-center gap-6">
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL SALDO KAS</p>
          <h3 class="text-2xl font-black text-green-600">{{ formatRupiah(treasuryBalance) }}</h3>
        </div>
        <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

      <!-- Left: Form -->
      <div class="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">

        <!-- Student Selector -->
        <div>
          <label class="block text-sm font-bold text-gray-900 mb-2">Pilih Siswa</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
            </div>
            <select v-model="selectedStudentId" class="block w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-all shadow-sm">
              <option value="" disabled>Cari atau pilih nama siswa...</option>
              <option v-for="s in students" :key="s.id" :value="s.id">{{ s.nama_siswa || s.nama_lengkap }} (NIS: {{ s.nis }})</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-sm font-bold text-gray-900 mb-2">Jumlah Pembayaran</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="text-gray-500 font-bold text-sm">Rp</span>
            </div>
            <input v-model="amount" type="number" @wheel.prevent placeholder="0" class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
          </div>
          <p class="text-[11px] text-gray-400 mt-1.5 font-medium">Iuran: Rp 2.000/minggu — Bayar lebih untuk melunasi minggu berikutnya</p>
        </div>

        <!-- Date Toggle -->
        <div>
          <label class="block text-sm font-bold text-gray-900 mb-2">Tanggal Pembayaran</label>
          <div class="flex gap-2 mb-2">
            <button type="button" @click="useTodayDate = true"
              :class="useTodayDate ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              class="flex-1 py-2.5 text-xs font-bold border rounded-xl transition-all">
              📅 Hari Ini
            </button>
            <button type="button" @click="useTodayDate = false"
              :class="!useTodayDate ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              class="flex-1 py-2.5 text-xs font-bold border rounded-xl transition-all">
              🗓️ Pilih Tanggal
            </button>
          </div>
          <div v-if="useTodayDate" class="w-full px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-bold text-center">
            {{ todayFormatted }}
          </div>
          <input v-else v-model="transactionDate" type="date"
            class="block w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
        </div>

        <!-- Submit -->
        <button @click="savePayment" :disabled="!selectedStudentId || !amount || isSubmitting"
          class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
          <svg v-if="!isSubmitting" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          <svg v-else class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isSubmitting ? 'Memproses...' : 'Simpan Pembayaran' }}
        </button>

        <div v-if="showSuccess" class="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-3">
          <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Pembayaran berhasil disimpan!
        </div>
      </div>

      <!-- Right: Student Profile -->
      <div>
        <StudentPaymentProfile
          :selectedStudent="selectedStudent"
          :totalPaid="totalPaid"
          :outstanding="outstanding"
          :formatRupiah="formatRupiah"
          :recentHistory="recentHistory"
          @edit="editPayment"
          @delete="deletePayment"
        />
      </div>
    </div>
  </AdminLayout>
</template>

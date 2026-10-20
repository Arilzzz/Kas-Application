<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../services/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const isSubmitting = ref(false)
const students = ref([])
const payments = ref([])
const expenses = ref([])

const paymentId = ref(null)
const formStudentId = ref('')
const formAmount = ref('')
const formDate = ref('')
const showSuccess = ref(false)

const searchQuery = ref('')
const filterMonth = ref('')
const currentPage = ref(1)
const itemsPerPage = 8

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

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
    if (route.query.id) loadPayment(route.query.id)
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchData() })

const treasuryBalance = computed(() => {
  const totalIn = payments.value.reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0)
  const totalOut = expenses.value.reduce((sum, e) => sum + Number(e.jumlah_pengeluaran), 0)
  return totalIn - totalOut
})

const formatRupiah = (num) => {
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}k`
  return `Rp ${num}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const parts = clean.split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return dateStr
}

const enrichedPayments = computed(() => {
  return payments.value
    .map(p => {
      const student = students.value.find(s => Number(s.id) === Number(p.data_student_id))
      const name = student ? (student.nama_siswa || 'U') : 'U'
      const words = name.trim().split(/\s+/)
      const avatar = words.length === 1 ? words[0].substring(0, 2).toUpperCase() : (words[0][0] + words[1][0]).toUpperCase()
      return {
        id: p.id,
        studentId: p.data_student_id,
        studentName: student ? (student.nama_siswa || student.nama_lengkap || 'Tidak Diketahui') : 'Tidak Diketahui',
        nis: student ? student.nis : '-',
        avatar,
        amount: Number(p.jumlah_pemasukkan),
        date: p.tanggal_pemasukkan,
        dateObj: (() => {
          const clean = (p.tanggal_pemasukkan || '').includes('T')
            ? p.tanggal_pemasukkan.split('T')[0]
            : p.tanggal_pemasukkan
          const parts = (clean || '').split('-')
          return parts.length === 3
            ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            : new Date()
        })(),
        created_at: p.created_at || p.tanggal_pemasukkan
      }
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const filteredPayments = computed(() => {
  let list = enrichedPayments.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.studentName.toLowerCase().includes(q) || String(p.nis).includes(q))
  }
  if (filterMonth.value !== '') {
    list = list.filter(p => p.dateObj.getMonth() === Number(filterMonth.value))
  }
  return list
})

const totalPages = computed(() => Math.ceil(filteredPayments.value.length / itemsPerPage))

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredPayments.value.slice(start, start + itemsPerPage)
})

const resetPage = () => { currentPage.value = 1 }

const loadPayment = (id) => {
  const p = payments.value.find(pay => Number(pay.id) === Number(id))
  if (!p) return
  paymentId.value = p.id
  formStudentId.value = p.data_student_id
  formAmount.value = p.jumlah_pemasukkan
  const clean = (p.tanggal_pemasukkan || '').includes('T')
    ? p.tanggal_pemasukkan.split('T')[0]
    : p.tanggal_pemasukkan
  formDate.value = clean
  document.getElementById('edit-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const cancelEdit = () => {
  paymentId.value = null
  formStudentId.value = ''
  formAmount.value = ''
  formDate.value = ''
}

const submitPayment = async () => {
  if (!paymentId.value || !formStudentId.value || !formAmount.value || !formDate.value) return
  isSubmitting.value = true
  try {
    await api.put(`/pembayaran/${paymentId.value}`, {
      data_student_id: formStudentId.value,
      jumlah_pemasukkan: Math.round(Number(formAmount.value)),
      tanggal_pemasukkan: formDate.value
    })
    const res = await api.get('/pembayaran')
    payments.value = res.data.Data || res.data || []
    cancelEdit()
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } catch (error) {
    console.error('Failed to update payment:', error)
    if (error.response) alert('Error: ' + JSON.stringify(error.response.data))
  } finally {
    isSubmitting.value = false
  }
}

const deletePayment = async (id) => {
  if (!confirm('Hapus pembayaran ini?')) return
  try {
    await api.delete(`/pembayaran/${id}`)
    const res = await api.get('/pembayaran')
    payments.value = res.data.Data || res.data || []
    if (paymentId.value === id) cancelEdit()
  } catch (error) {
    console.error('Failed to delete:', error)
    alert('Gagal menghapus pembayaran.')
  }
}

const editingStudent = computed(() => {
  if (!formStudentId.value) return null
  return students.value.find(s => Number(s.id) === Number(formStudentId.value))
})
</script>

<template>
  <AdminLayout>
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <router-link to="/admin/payment" class="flex items-center text-blue-600 text-sm font-medium hover:underline mb-2">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Kembali ke Catat Pembayaran
        </router-link>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">Edit Pembayaran</h1>
        <p class="text-gray-500 font-medium mt-2 mb-6">Perbarui atau hapus catatan pembayaran siswa.</p>
        <div class="flex bg-gray-200 rounded-full p-1 max-w-fit relative overflow-hidden">
          <div class="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm translate-x-full"></div>
          <button @click="router.push('/admin/payment')" class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors w-32">Catat Baru</button>
          <button class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-900 cursor-default w-32">Edit Data</button>
        </div>
      </div>
      <div class="bg-white rounded-2xl px-6 py-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL SALDO KAS</p>
          <h3 class="text-2xl font-black text-green-600">{{ formatRupiah(treasuryBalance) }}</h3>
        </div>
        <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400 font-medium">Memuat data...</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">

      <!-- LEFT: Edit Form Panel -->
      <div id="edit-form-panel" class="lg:col-span-4">
        <div v-if="!paymentId" class="bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center min-h-[320px]">
          <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </div>
          <h3 class="text-sm font-black text-gray-600 mb-1">Belum Ada Pembayaran Dipilih</h3>
          <p class="text-xs text-gray-400 font-medium">Klik tombol <span class="text-blue-600 font-bold">Edit</span> pada baris pembayaran di sebelah kanan untuk mulai mengedit.</p>
        </div>

        <div v-else class="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col gap-5">
          <!-- Student info banner -->
          <div class="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div class="w-10 h-10 rounded-full bg-blue-200 text-blue-700 font-black flex items-center justify-center text-sm flex-shrink-0">
              {{ editingStudent ? (() => { const n = editingStudent.nama_siswa || 'U'; const w = n.trim().split(/\s+/); return w.length === 1 ? w[0].substring(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase() })() : '?' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-black text-blue-900 truncate">{{ editingStudent ? (editingStudent.nama_siswa || editingStudent.nama_lengkap) : 'Unknown' }}</p>
              <p class="text-xs text-blue-600 font-medium">NIS: {{ editingStudent ? editingStudent.nis : '-' }} · ID Transaksi: #{{ paymentId }}</p>
            </div>
          </div>

          <!-- Student selector -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">Siswa</label>
            <div class="relative">
              <select v-model="formStudentId" class="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none shadow-sm cursor-pointer">
                <option value="" disabled>Pilih siswa...</option>
                <option v-for="s in students" :key="s.id" :value="s.id">{{ s.nama_siswa || s.nama_lengkap }} ({{ s.nis }})</option>
              </select>
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">Jumlah Pembayaran</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-bold text-sm">Rp</span>
              <input v-model="formAmount" type="number" @wheel.prevent placeholder="0"
                class="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
            </div>
          </div>

          <!-- Date -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">Tanggal Pembayaran</label>
            <input v-model="formDate" type="date"
              class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="cancelEdit" class="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
              Batal
            </button>
            <button @click="submitPayment" :disabled="!formStudentId || !formAmount || !formDate || isSubmitting"
              class="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg v-if="!isSubmitting" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <svg v-else class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>

          <div v-if="showSuccess" class="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            Pembayaran berhasil diperbarui!
          </div>
        </div>
      </div>

      <!-- RIGHT: Payment List Table -->
      <div class="lg:col-span-8">
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          <!-- Table Header + Filters -->
          <div class="px-6 py-5 border-b border-gray-100">
            <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900">Daftar Pembayaran</h2>
                <p class="text-xs text-gray-500 font-medium mt-0.5">{{ filteredPayments.length }} transaksi ditemukan</p>
              </div>
            </div>
            <div class="flex gap-3 flex-wrap">
              <!-- Search -->
              <div class="relative flex-1 min-w-[180px]">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
                </div>
                <input v-model="searchQuery" @input="resetPage" type="text" placeholder="Cari nama / NIS..."
                  class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <!-- Month filter -->
              <div class="relative">
                <select v-model="filterMonth" @change="resetPage" class="bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
                  <option value="">Semua Bulan</option>
                  <option v-for="(name, i) in MONTH_NAMES" :key="i" :value="String(i)">{{ name }}</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-50">
              <thead class="bg-gray-50/60">
                <tr>
                  <th class="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Siswa</th>
                  <th class="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Jumlah</th>
                  <th class="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Tanggal</th>
                  <th class="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-50">
                <tr v-if="filteredPayments.length === 0">
                  <td colspan="4" class="px-6 py-10 text-center text-sm text-gray-400 font-medium">
                    Tidak ada pembayaran ditemukan
                  </td>
                </tr>
                <tr v-for="p in paginatedPayments" :key="p.id"
                  class="hover:bg-gray-50/60 transition-colors group"
                  :class="paymentId === p.id ? 'bg-blue-50/40 border-l-2 border-blue-400' : ''">
                  <!-- Student -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 border"
                        :class="paymentId === p.id ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'">
                        {{ p.avatar }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900">{{ p.studentName }}</p>
                        <p class="text-xs text-gray-400 font-medium">NIS: {{ p.nis }}</p>
                      </div>
                    </div>
                  </td>
                  <!-- Amount -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-black text-green-600">+{{ formatRupiah(p.amount) }}</span>
                  </td>
                  <!-- Date -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-medium text-gray-600">{{ formatDate(p.date) }}</span>
                  </td>
                  <!-- Actions -->
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="loadPayment(p.id)"
                        :class="paymentId === p.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-300' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'"
                        class="p-2 rounded-xl transition-all text-sm font-bold flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        <span class="text-xs hidden sm:block">{{ paymentId === p.id ? 'Dipilih' : 'Edit' }}</span>
                      </button>
                      <button @click="deletePayment(p.id)"
                        class="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p class="text-xs font-bold text-gray-500">
              {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredPayments.length) }} dari {{ filteredPayments.length }}
            </p>
            <div class="flex items-center gap-2">
              <button @click="currentPage--" :disabled="currentPage === 1"
                class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div class="flex gap-1">
                <button v-for="p in Math.min(totalPages, 5)" :key="p"
                  @click="currentPage = p"
                  :class="currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'"
                  class="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all">
                  {{ p }}
                </button>
              </div>
              <button @click="currentPage++" :disabled="currentPage === totalPages"
                class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

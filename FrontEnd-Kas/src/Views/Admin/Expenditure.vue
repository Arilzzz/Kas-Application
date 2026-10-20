<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../services/api'

const loading = ref(true)
const isSubmitting = ref(false)
const description = ref('')
const amount = ref('')
const transactionDate = ref(new Date().toISOString().split('T')[0])
const selectedFile = ref(null)
const previewImage = ref(null)
const fileError = ref('')
const expenditures = ref([])
const payments = ref([])

const router = useRouter()

const saldoAktif = computed(() => {
  const totalIn = payments.value.reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0)
  const totalOut = expenditures.value.reduce((sum, e) => sum + Number(e.jumlah_pengeluaran), 0)
  return totalIn - totalOut
})

const fetchExpenditures = async () => {
  loading.value = true
  try {
    const [expRes, payRes] = await Promise.all([
      api.get('/pengeluaran').catch(() => ({ data: { Data: [] } })),
      api.get('/pembayaran').catch(() => ({ data: { Data: [] } }))
    ])
    expenditures.value = expRes.data.Data || expRes.data || []
    payments.value = payRes.data.Data || payRes.data || []
  } catch (error) {
    console.error('Error fetching expenditures:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchExpenditures() })

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    fileError.value = 'Ukuran file melebihi batas 5MB.'
    selectedFile.value = null
    previewImage.value = null
    return
  }
  fileError.value = ''
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { previewImage.value = e.target.result }
  reader.readAsDataURL(file)
}

const submitExpenditure = async () => {
  if (!description.value || !amount.value || !transactionDate.value || !selectedFile.value) return
  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('tanggal_pengeluaran', transactionDate.value)
    formData.append('jumlah_pengeluaran', Math.round(Number(amount.value)))
    formData.append('keterangan', description.value)
    formData.append('bukti_foto', selectedFile.value)
    formData.append('user_id', 1)
    await api.post('/pengeluaran', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    description.value = ''
    amount.value = ''
    selectedFile.value = null
    await fetchExpenditures()
  } catch (error) {
    console.error('Failed to submit:', error)
    if (error.response) alert('Error: ' + (error.response.data.message || JSON.stringify(error.response.data)))
  } finally {
    isSubmitting.value = false
  }
}

const editExpenditure = (id) => router.push({ path: '/admin/editexpenditure', query: { id } })

const deleteExpenditure = async (id) => {
  if (!confirm('Hapus data pengeluaran ini?')) return
  try {
    await api.delete(`/pengeluaran/${id}`)
    await fetchExpenditures()
  } catch (error) {
    console.error('Failed to delete:', error)
    alert('Gagal menghapus pengeluaran.')
  }
}

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date()
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const parts = clean.split('-')
  if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return new Date(dateStr)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Tanggal tidak valid'
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const recentProofs = computed(() =>
  expenditures.value.slice(0, 3).map(e => ({
    id: e.id,
    url: e.bukti_foto ? `http://127.0.0.1:8000/storage/${e.bukti_foto}` : 'https://placehold.co/100x100?text=Tidak+Ada'
  }))
)
</script>

<template>
  <AdminLayout>
    <!-- Header -->
    <div class="mb-8">
      <p class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">MANAJEMEN PENGELUARAN</p>
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-4xl font-black text-gray-900 tracking-tight mb-2">Pencatatan Pengeluaran</h1>
          <p class="text-gray-500 font-medium max-w-lg mb-6">Jaga transparansi kas dengan bukti transaksi dan log pengeluaran yang terverifikasi.</p>

          <!-- Mode Toggle -->
          <div class="flex bg-gray-200 rounded-full p-1 max-w-fit relative overflow-hidden">
            <div class="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out translate-x-0"></div>
            <button class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-900 transition-colors w-32 cursor-default">
              Catat Baru
            </button>
            <button @click="router.push('/admin/editexpenditure')" class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors w-32">
              Edit Data
            </button>
          </div>
        </div>
        
        <!-- Saldo Kas -->
        <div class="bg-white rounded-2xl px-6 py-4 border border-gray-100 shadow-sm flex items-center gap-6">
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL SALDO KAS</p>
            <h3 class="text-2xl font-black text-blue-600">{{ formatRupiah(saldoAktif) }}</h3>
          </div>
          <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Left Column: Form -->
      <div class="lg:col-span-8">
        <div class="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          
          <div class="flex items-center gap-3 mb-8">
            <div class="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h2 class="text-xl font-bold text-gray-900">Catat Pengeluaran Baru</h2>
          </div>

          <form @submit.prevent="submitExpenditure" class="space-y-6 relative z-10">
            <div>
              <label class="block text-sm font-bold text-gray-900 mb-2">Keterangan Transaksi</label>
              <input v-model="description" type="text" required class="w-full bg-gray-100/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3.5 text-sm font-medium transition-all" placeholder="Misalnya: Alat Laboratorium IPA" />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">Jumlah (Rp)</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-900 font-bold">Rp</span>
                  </div>
                  <input v-model="amount" type="number" @wheel.prevent required class="w-full bg-gray-100/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium transition-all" placeholder="0" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">Tanggal Transaksi</label>
                <input v-model="transactionDate" type="date" required class="w-full bg-gray-100/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3.5 text-sm font-medium transition-all" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-900 mb-2">Unggah Bukti/Nota</label>
              <div class="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-blue-400 transition-colors bg-gray-50/50">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 bg-gray-200 rounded-xl flex flex-shrink-0 items-center justify-center overflow-hidden">
                    <img v-if="previewImage" :src="previewImage" class="w-full h-full object-cover" />
                    <svg v-else class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 text-sm mb-1">Pilih file untuk diunggah</h4>
                    <p class="text-xs font-medium text-gray-500">PNG, JPG atau PDF hingga 5MB. Pastikan gambar jelas.</p>
                    <p v-if="fileError" class="text-xs font-bold text-red-500 mt-1">{{ fileError }}</p>
                  </div>
                </div>
                <div class="relative">
                  <input type="file" @change="handleFileChange" accept="image/*,.pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors pointer-events-none">
                    Cari File
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
              <svg v-if="!isSubmitting" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              <svg v-else class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isSubmitting ? 'Memproses...' : 'Simpan Transaksi' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Right Column: Info Cards -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- Sisa Saldo Kas Card -->
        <div class="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
          <div class="absolute -right-6 -bottom-6 w-32 h-32 border-[20px] border-blue-500/30 rounded-full"></div>
          <div class="absolute -right-2 -bottom-2 w-20 h-20 bg-blue-500/20 rounded-full"></div>
          
          <h3 class="text-sm font-bold text-blue-100 mb-2 relative z-10">Total Dana Tersedia</h3>
          <h2 class="text-3xl font-black mb-6 relative z-10">{{ formatRupiah(saldoAktif) }}</h2>
          
          <div class="relative z-10">
            <div class="w-full bg-blue-800/50 rounded-full h-1.5 mb-2">
              <div class="bg-green-400 h-1.5 rounded-full" style="width: 100%"></div>
            </div>
            <p class="text-[10px] font-medium text-blue-100">Kapasitas Maksimal Pengeluaran</p>
          </div>
        </div>

        <!-- Transparency Rule -->
        <div class="bg-green-50 border border-green-100 rounded-3xl p-6 relative">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 class="font-bold text-gray-900 text-sm">Aturan Kas</h3>
          </div>
          <p class="text-xs font-medium text-gray-600 leading-relaxed">
            Semua transaksi pengeluaran <span class="font-bold text-gray-900">wajib</span> menyertakan bukti foto nota atau resi pembayaran yang jelas.
          </p>
        </div>

        <!-- Recent Proofs -->
        <div class="bg-white border border-gray-100 rounded-3xl p-6">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">BUKTI TERAKHIR</h3>
          <div class="flex gap-3">
            <div v-for="proof in recentProofs" :key="proof.id" class="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden border border-gray-100 shadow-sm">
              <img :src="proof.url" class="w-full h-full object-cover" />
            </div>
            <div v-if="expenditures.length > 3" class="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              +{{ expenditures.length - 3 }}
            </div>
            <div v-if="expenditures.length === 0" class="text-xs text-gray-400 font-medium italic py-2">
              Belum ada bukti yang diunggah.
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Audit History Table -->
    <div class="mt-8">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-1 h-6 bg-red-600 rounded-full"></div>
          <h2 class="text-xl font-bold text-gray-900">Riwayat Pengeluaran</h2>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Tanggal</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan</th>
              <th scope="col" class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Bukti</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-48">Jumlah</th>
              <th scope="col" class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="5" class="px-6 py-8 text-center text-gray-500 font-medium">Memuat riwayat...</td></tr>
            <tr v-else-if="expenditures.length === 0"><td colspan="5" class="px-6 py-8 text-center text-gray-500 font-medium">Tidak ada data pengeluaran.</td></tr>
            <tr v-for="exp in expenditures" :key="exp.id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {{ formatDate(exp.tanggal_pengeluaran) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-1 h-8 rounded-full" :class="Number(exp.jumlah_pengeluaran) > 500000 ? 'bg-red-500' : 'bg-yellow-400'"></div>
                  <div>
                    <p class="text-sm font-bold text-gray-900">{{ exp.keterangan }}</p>
                    <p class="text-[10px] font-medium text-gray-500 mt-0.5 uppercase">{{ Number(exp.jumlah_pengeluaran) > 500000 ? 'Pengeluaran Besar' : 'Operasional' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <a v-if="exp.bukti_foto" :href="`http://127.0.0.1:8000/storage/${exp.bukti_foto}`" target="_blank" class="inline-flex w-10 h-10 bg-gray-100 rounded-lg items-center justify-center hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </a>
                <span v-else class="text-xs text-gray-400 font-medium">Tidak ada</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-red-600">
                {{ formatRupiah(exp.jumlah_pengeluaran) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div class="flex items-center justify-center gap-2">
                  <button @click="editExpenditure(exp.id)" class="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button @click="deleteExpenditure(exp.id)" class="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </AdminLayout>
</template>

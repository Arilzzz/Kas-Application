<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../services/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const isSubmitting = ref(false)
const description = ref('')
const amount = ref('')
const transactionDate = ref('')
const selectedFile = ref(null)
const previewImage = ref(null)
const fileError = ref('')

const expenditureId = route.query.id

const fetchExpenditure = async () => {
  if (!expenditureId) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await api.get(`/pengeluaran/${expenditureId}`)
    const exp = res.data.Data || res.data
    if (exp) {
      description.value = exp.keterangan || ''
      amount.value = exp.jumlah_pengeluaran || ''
      transactionDate.value = exp.tanggal_pengeluaran ? exp.tanggal_pengeluaran.split('T')[0] : ''
      if (exp.bukti_foto) {
        previewImage.value = `http://127.0.0.1:8000/storage/${exp.bukti_foto}`
      }
    }
  } catch (error) {
    console.error('Error fetching expenditure:', error)
    alert('Gagal memuat data pengeluaran.')
    router.push('/admin/expenditure')
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchExpenditure() })

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    fileError.value = 'Ukuran file melebihi batas 5MB.'
    selectedFile.value = null
    return
  }
  fileError.value = ''
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { previewImage.value = e.target.result }
  reader.readAsDataURL(file)
}

const submitExpenditure = async () => {
  if (!description.value || !amount.value || !transactionDate.value) return
  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('tanggal_pengeluaran', transactionDate.value)
    formData.append('jumlah_pengeluaran', Math.round(Number(amount.value)))
    formData.append('keterangan', description.value)
    if (selectedFile.value) formData.append('bukti_foto', selectedFile.value)
    await api.post(`/pengeluaran/${expenditureId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    router.push('/admin/expenditure')
  } catch (error) {
    console.error('Failed to update:', error)
    if (error.response) alert('Error: ' + (error.response.data.message || JSON.stringify(error.response.data)))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <router-link to="/admin/expenditure" class="flex items-center text-blue-600 text-sm font-medium hover:underline mb-2">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Kembali ke Pengeluaran
        </router-link>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">Edit Pengeluaran</h1>
        <p class="text-gray-500 font-medium mt-2 mb-6">Perbarui data transaksi pengeluaran.</p>

        <!-- Mode Toggle -->
        <div class="flex bg-gray-200 rounded-full p-1 max-w-fit relative overflow-hidden">
          <div class="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out translate-x-[100%]"></div>
          <button @click="router.push('/admin/expenditure')" class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors w-32">
            Catat Baru
          </button>
          <button class="relative z-10 px-6 py-2 rounded-full text-sm font-bold text-gray-900 transition-colors w-32 cursor-default">
            Edit Data
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 font-medium">Memuat data...</div>

    <div v-else-if="!expenditureId" class="max-w-3xl mx-auto bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-sm">
      <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
      <h3 class="text-lg font-bold text-gray-900">Pilih Transaksi</h3>
      <p class="mt-2 text-sm text-gray-500 max-w-sm mx-auto">Silakan kembali ke halaman Pengeluaran dan klik icon Edit pada riwayat transaksi yang ingin Anda ubah.</p>
    </div>

    <div v-else class="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden max-w-4xl mx-auto">
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
          <label class="block text-sm font-bold text-gray-900 mb-2">Unggah Bukti/Nota Baru (Opsional)</label>
          <div class="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-blue-400 transition-colors bg-gray-50/50">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gray-200 rounded-xl flex flex-shrink-0 items-center justify-center overflow-hidden">
                <img v-if="previewImage" :src="previewImage" class="w-full h-full object-cover" />
                <svg v-else class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">Pilih file untuk mengganti bukti saat ini</h4>
                <p class="text-xs font-medium text-gray-500">PNG, JPG atau PDF hingga 5MB. Kosongkan jika tidak ingin mengubah foto.</p>
                <p v-if="fileError" class="text-xs font-bold text-red-500 mt-1">{{ fileError }}</p>
              </div>
            </div>
            <div class="relative">
              <input type="file" @change="handleFileChange" accept="image/*,.pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors pointer-events-none">
                Ganti File
              </button>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
          <svg v-if="!isSubmitting" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <svg v-else class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan' }}
        </button>
      </form>
    </div>
  </AdminLayout>
</template>

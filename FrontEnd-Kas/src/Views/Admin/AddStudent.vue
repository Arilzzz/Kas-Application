<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../services/api'

const router = useRouter()
const route = useRoute()
const studentForm = ref({ nis: '', nama_siswa: '' })
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const successMessage = ref('')
const recentlyAdded = ref([])
const students = ref([])
const mode = ref('add') // 'add' or 'update'
const selectedStudentId = ref('')

const showImportModal = ref(false)
const importFile = ref(null)
const importMode = ref('replace')
const importLoading = ref(false)
const importResult = ref(null)
const importFileName = ref('')

const goBack = () => {
  router.push('/admin/datastudent')
}

const fetchStudents = async () => {
  try {
    const res = await api.get('/student')
    students.value = res.data.Data || res.data || []
    if (route.query.editId) {
      mode.value = 'update'
      selectedStudentId.value = Number(route.query.editId)
      handleStudentSelect()
    }
  } catch (error) {
    console.error("Failed to fetch students:", error)
  }
}

onMounted(() => {
  fetchStudents()
})

const handleStudentSelect = () => {
  const student = students.value.find(s => Number(s.id) === Number(selectedStudentId.value))
  if (student) {
    studentForm.value.nis = student.nis
    studentForm.value.nama_siswa = student.nama_siswa || student.nama_lengkap
  } else {
    studentForm.value.nis = ''
    studentForm.value.nama_siswa = ''
  }
}

watch(mode, (newMode) => {
  if (newMode === 'add') {
    selectedStudentId.value = ''
    studentForm.value.nis = ''
    studentForm.value.nama_siswa = ''
  }
})

const submitForm = async () => {
  if (!studentForm.value.nis || !studentForm.value.nama_siswa) return
  
  isSubmitting.value = true
  try {
    if (mode.value === 'add') {
      await api.post('/student', studentForm.value)
      recentlyAdded.value.unshift({
        id: Date.now(),
        name: studentForm.value.nama_siswa,
        nis: studentForm.value.nis,
        time: 'Baru saja ditambahkan'
      })
      successMessage.value = 'Siswa berhasil ditambahkan!'
      studentForm.value.nis = ''
      studentForm.value.nama_siswa = ''
    } else {
      await api.put(`/student/${selectedStudentId.value}`, studentForm.value)
      successMessage.value = 'Data siswa berhasil diperbarui!'
      recentlyAdded.value.unshift({
        id: Date.now(),
        name: studentForm.value.nama_siswa,
        nis: studentForm.value.nis,
        time: 'Baru saja diperbarui'
      })
    }
    
    submitSuccess.value = true
    await fetchStudents()

    setTimeout(() => {
      submitSuccess.value = false
    }, 3000)
    
  } catch (error) {
    console.log(error.message)
    console.error("Failed to submit student:", error)
    alert("Gagal memproses data. Silakan cek konsol.")
  } finally {
    isSubmitting.value = false
  }
}

const openImportModal = () => {
  importFile.value = null
  importMode.value = 'replace'
  importResult.value = null
  importFileName.value = ''
  showImportModal.value = true
}

const closeImportModal = () => {
  showImportModal.value = false
  importResult.value = null
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    importFile.value = file
    importFileName.value = file.name
  }
}

const executeImport = async () => {
  if (!importFile.value) return

  importLoading.value = true
  importResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    formData.append('mode', importMode.value)

    const response = await api.post('/student/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    importResult.value = {
      success: true,
      message: response.data.Message,
      imported: response.data.imported,
      skipped: response.data.skipped || 0,
      errors: response.data.errors || []
    }

    recentlyAdded.value.unshift({
      id: Date.now(),
      name: `Import Massal (${response.data.imported} siswa)`,
      nis: '-',
      time: 'Baru saja diimport'
    })

    await fetchStudents()
  } catch (error) {
    const errMsg = error.response?.data?.Message || error.response?.data?.errors?.file?.[0] || 'Gagal mengimport file CSV'
    importResult.value = {
      success: false,
      message: errMsg,
      errors: error.response?.data?.errors || []
    }
  } finally {
    importLoading.value = false
  }
}

const downloadTemplate = () => {
  const csvContent = "data:text/csv;charset=utf-8,nis,nama_siswa\n2024001,Alexander Graham\n2024002,Jane Doe"
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "template_siswa.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <AdminLayout>
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <button @click="goBack" class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <span class="text-sm font-bold text-blue-600 uppercase tracking-widest">Registrasi Siswa</span>
      </div>
      <div class="flex items-center justify-between">
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">Manajemen Data Siswa</h1>
        <div class="bg-gray-100 rounded-full px-4 py-1.5 flex items-center gap-3">
          <div class="text-right">
            <p class="text-xs font-bold text-gray-900 leading-none">Kelas 12-A</p>
            <p class="text-[10px] font-semibold text-gray-500 mt-0.5">Database Siswa</p>
          </div>
          <img class="w-8 h-8 rounded-full shadow-sm" src="/Logo.png" alt="Admin" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Left Column: Manual Registration/Update -->
      <div class="flex flex-col gap-6">
        <div class="bg-gray-50 rounded-3xl p-8 border border-gray-100">
          
          <!-- Mode Toggle -->
          <div class="flex bg-gray-200 rounded-full p-1 mb-8 max-w-fit mx-auto">
            <button @click="mode = 'add'" :class="mode === 'add' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'" class="px-6 py-2 rounded-full text-sm font-bold transition-all">
              Tambah Data
            </button>
            <button @click="mode = 'update'" :class="mode === 'update' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'" class="px-6 py-2 rounded-full text-sm font-bold transition-all">
              Update Data
            </button>
          </div>

          <div class="flex items-center gap-3 mb-6">
            <div class="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h2 class="text-xl font-bold text-gray-900">{{ mode === 'add' ? 'Registrasi Manual' : 'Pembaruan Data' }}</h2>
          </div>
          
          <form @submit.prevent="submitForm" class="space-y-4">
            <!-- Search field for Update Mode -->
            <div v-if="mode === 'update'" class="mb-4">
              <label class="block text-sm font-bold text-gray-700 mb-1.5">Pilih Siswa yang akan diupdate</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
                </div>
                <select v-model="selectedStudentId" @change="handleStudentSelect" class="block w-full pl-11 pr-10 py-3.5 bg-gray-200/50 border-transparent rounded-xl text-gray-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-all">
                  <option value="" disabled>Pilih nama siswa...</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">{{ s.nama_siswa || s.nama_lengkap }} (NIS: {{ s.nis }})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1.5">NIS (Nomor Induk Siswa)</label>
                <input v-model="studentForm.nis" type="text" required class="w-full bg-gray-200/50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm font-medium transition-all" placeholder="Contoh: 2024001" :disabled="mode === 'update' && !selectedStudentId" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input v-model="studentForm.nama_siswa" type="text" required class="w-full bg-gray-200/50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm font-medium transition-all" placeholder="Contoh: Alexander Graham" :disabled="mode === 'update' && !selectedStudentId" />
              </div>
            </div>
            <div class="flex justify-end pt-2">
              <button type="submit" :disabled="isSubmitting || (mode === 'update' && !selectedStudentId)" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-70">
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                {{ mode === 'add' ? 'Simpan Siswa' : 'Update Data' }}
              </button>
            </div>
          </form>
          <div v-if="submitSuccess" class="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            {{ successMessage }}
          </div>
        </div>

        <div>
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Aktivitas Terakhir</h3>
          <div class="space-y-3">
            <div v-for="student in recentlyAdded" :key="student.id" class="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-4">
                <div class="w-1 h-8 bg-green-500 rounded-full"></div>
                <div>
                  <p class="font-bold text-gray-900 text-sm">{{ student.name }}</p>
                  <p class="text-xs font-medium text-gray-500">NIS: {{ student.nis }} • {{ student.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Sukses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Bulk Import (Same style as DataStudent) -->
      <div class="bg-slate-50/80 rounded-3xl p-8 border border-gray-100 flex flex-col justify-center items-center text-center h-full min-h-[300px]">
        <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500 shadow-inner">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Impor Data Siswa</h3>
        <p class="text-gray-500 mb-6 font-medium text-sm max-w-sm">
          Punya file data siswa? Unggah file CSV untuk mengimpor seluruh data secara massal sekaligus.
        </p>
        <div class="flex flex-col gap-3 w-full max-w-xs">
          <button @click="openImportModal" class="px-6 py-3 bg-blue-600 shadow-sm shadow-blue-200 rounded-xl font-bold text-white hover:bg-blue-700 transition-all active:scale-95 flex-1">
            Mulai Impor CSV
          </button>
          <button @click="downloadTemplate" class="px-6 py-3 bg-white border border-gray-200 shadow-sm rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all flex-1">
            Unduh Template CSV
          </button>
        </div>
      </div>
    </div>

    <!-- CSV Import Modal (Same as DataStudent.vue) -->
    <Teleport to="body">
      <div
        v-if="showImportModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeImportModal"
        ></div>

        <!-- Modal -->
        <div
          class="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 z-10"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Impor Data Siswa</h2>
              <p class="text-sm text-gray-500 mt-1">
                Upload file CSV dengan format:
                <code
                  class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono"
                  >nis,nama_siswa</code
                >
              </p>
            </div>
            <button
              @click="closeImportModal"
              class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- File Upload Zone -->
          <div class="mb-6">
            <label class="block w-full cursor-pointer">
              <div
                class="border-2 border-dashed rounded-2xl p-8 text-center transition-all"
                :class="
                  importFile
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
                "
              >
                <div v-if="!importFile" class="flex flex-col items-center">
                  <svg
                    class="w-10 h-10 text-gray-400 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p class="text-sm font-semibold text-gray-700">
                    Klik untuk pilih file CSV
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    atau drag & drop file ke sini
                  </p>
                </div>
                <div v-else class="flex items-center justify-center gap-3">
                  <svg
                    class="w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div class="text-left">
                    <p class="text-sm font-bold text-gray-900">
                      {{ importFileName }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ (importFile.size / 1024).toFixed(1) }} KB
                    </p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                class="hidden"
                @change="handleFileSelect"
              />
            </label>
          </div>

          <!-- Import Mode Selection -->
          <div class="mb-6">
            <p class="text-sm font-bold text-gray-700 mb-3">Mode Import:</p>
            <div class="grid grid-cols-2 gap-3">
              <label class="relative cursor-pointer">
                <input
                  type="radio"
                  v-model="importMode"
                  value="replace"
                  class="peer sr-only"
                />
                <div
                  class="border-2 rounded-xl p-4 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 border-gray-200 hover:border-gray-300"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg
                      class="w-4 h-4 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span class="text-sm font-bold text-gray-900"
                      >Ganti Semua</span
                    >
                  </div>
                  <p class="text-xs text-gray-500">
                    Hapus data lama, ganti dengan data baru
                  </p>
                </div>
              </label>
              <label class="relative cursor-pointer">
                <input
                  type="radio"
                  v-model="importMode"
                  value="append"
                  class="peer sr-only"
                />
                <div
                  class="border-2 rounded-xl p-4 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 border-gray-200 hover:border-gray-300"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg
                      class="w-4 h-4 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span class="text-sm font-bold text-gray-900"
                      >Tambahkan</span
                    >
                  </div>
                  <p class="text-xs text-gray-500">
                    Tambah ke data yang sudah ada (skip NIS duplikat)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Warning for replace mode -->
          <div
            v-if="importMode === 'replace'"
            class="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3"
          >
            <svg
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p class="text-sm font-bold text-amber-800">Perhatian!</p>
              <p class="text-xs text-amber-700 mt-0.5">
                Mode ini akan menghapus semua data siswa yang lama dan
                menggantinya dengan data baru dari CSV.
              </p>
            </div>
          </div>

          <!-- Import Result -->
          <div
            v-if="importResult"
            class="mb-6 rounded-xl p-4 flex gap-3 text-sm"
            :class="
              importResult.success
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            "
          >
            <div>
              <p class="font-bold">{{ importResult.message }}</p>
              <p v-if="importResult.success" class="mt-1 text-xs text-green-700">✓ {{ importResult.imported }} data diimport</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button
              @click="closeImportModal"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {{ importResult?.success ? "Tutup" : "Batal" }}
            </button>
            <button
              v-if="!importResult?.success"
              @click="executeImport"
              :disabled="!importFile || importLoading"
              class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
            >
              <svg
                v-if="importLoading"
                class="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              {{ importLoading ? "Mengimport..." : "Import Sekarang" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

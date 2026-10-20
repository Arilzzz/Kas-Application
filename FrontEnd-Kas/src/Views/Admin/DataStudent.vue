<script setup>
import { ref, onMounted, computed } from "vue";
import AdminLayout from "../../components/AdminLayout.vue";
import StudentKPIs from "../../components/DataStudent/StudentKPIs.vue";
import StudentRegistryTable from "../../components/DataStudent/StudentRegistryTable.vue";
import api from "../../services/api";
import { useRouter } from "vue-router";

const router = useRouter();
const students = ref([]);
const payments = ref([]);
const expenses = ref([]);
const loading = ref(true);
const searchQuery = ref("")

const WEEKLY_DUES = 2000

const parseLocalDateDS = (dateStr) => {
  if (!dateStr) return new Date()
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const parts = clean.split('-')
  if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return new Date(dateStr)
}
const getStudentBase = (studentPayments) => {
  if (!studentPayments.length) {
    // No payments: use first Monday of current month as fallback
    const now = new Date()
    let d = new Date(now.getFullYear(), now.getMonth(), 1)
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
    return d
  }
  const sorted = [...studentPayments].sort(
    (a, b) => parseLocalDateDS(a.tanggal_pemasukkan) - parseLocalDateDS(b.tanggal_pemasukkan)
  )
  const first = parseLocalDateDS(sorted[0].tanggal_pemasukkan)
  let d = new Date(first.getFullYear(), first.getMonth(), 1)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return d
}

const getNthMondayOfMonth = (year, month, n) => {
  let d = new Date(year, month, 1)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return new Date(d.getTime() + (n - 1) * 7 * 86400000)
}

const getCoveredWeeksForMonth = (totalPaid, year, month, base) => {
  const covered = Math.floor(totalPaid / WEEKLY_DUES)
  const result = []
  for (let n = 1; n <= 4; n++) {
    const monday = getNthMondayOfMonth(year, month, n)
    const ord = Math.floor((monday.getTime() - base.getTime()) / (7 * 86400000)) + 1
    if (ord >= 1 && ord <= covered) result.push(`w${n}`)
  }
  return result
}

const selectedViewMonth = ref(new Date().getMonth())
const selectedViewYear = ref(new Date().getFullYear())
const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const prevViewMonth = () => {
  if (selectedViewMonth.value === 0) { selectedViewMonth.value = 11; selectedViewYear.value-- }
  else selectedViewMonth.value--
}
const nextViewMonth = () => {
  if (selectedViewMonth.value === 11) { selectedViewMonth.value = 0; selectedViewYear.value++ }
  else selectedViewMonth.value++
}

const showImportModal = ref(false)
const importFile = ref(null)
const importMode = ref('replace')
const importLoading = ref(false)
const importResult = ref(null)
const importFileName = ref('')

const openImportModal = () => {
  importFile.value = null
  importMode.value = 'replace'
  importResult.value = null
  importFileName.value = ''
  showImportModal.value = true
}

const closeImportModal = () => {
  showImportModal.value = false;
  importResult.value = null;
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    importFile.value = file;
    importFileName.value = file.name;
  }
};

const executeImport = async () => {
  if (!importFile.value) return;

  importLoading.value = true;
  importResult.value = null;

  try {
    const formData = new FormData();
    formData.append("file", importFile.value);
    formData.append("mode", importMode.value);

    const response = await api.post("/student/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    importResult.value = {
      success: true,
      message: response.data.Message,
      imported: response.data.imported,
      skipped: response.data.skipped || 0,
      errors: response.data.errors || [],
    };

    // Refresh table data
    await fetchData();
  } catch (error) {
    const errMsg =
      error.response?.data?.Message ||
      error.response?.data?.errors?.file?.[0] ||
      "Gagal mengimport file CSV";
    importResult.value = {
      success: false,
      message: errMsg,
      errors: error.response?.data?.errors || [],
    };
  } finally {
    importLoading.value = false;
  }
};

const totalStudents = computed(() => students.value.length);

// Helper to format currency
const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// Calculate Treasury Balance
const treasuryBalanceRaw = computed(() => {
  const totalIn = payments.value.reduce(
    (sum, p) => sum + Number(p.jumlah_pemasukkan),
    0,
  );
  const totalOut = expenses.value.reduce(
    (sum, e) => sum + Number(e.jumlah_pengeluaran),
    0,
  );
  return totalIn - totalOut;
});
const treasuryBalance = computed(() => formatRupiah(treasuryBalanceRaw.value));

// Determine which week of the month a date belongs to based on the First Monday
const getWeekOfMonth = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();

  // Find first Monday
  let firstMonday = new Date(year, month, 1);
  while (firstMonday.getDay() !== 1) {
    // 1 = Monday
    firstMonday.setDate(firstMonday.getDate() + 1);
  }

  if (date < firstMonday) return "w1";

  const diffDays = Math.floor((date - firstMonday) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return "w1";
  if (diffDays < 14) return "w2";
  if (diffDays < 21) return "w3";
  return "w4";
};

// Map students with their payment data
const enrichedStudents = computed(() => {
  return students.value.map((student) => {
    const studentPayments = payments.value.filter(
      (p) => Number(p.data_student_id) === Number(student.id),
    );

    const totalPaid = studentPayments.reduce(
      (sum, p) => sum + Number(p.jumlah_pemasukkan),
      0,
    );

    // Carry-over: weeks covered are determined by total paid, starting from first payment month
    const base = getStudentBase(studentPayments)
    const progress = getCoveredWeeksForMonth(totalPaid, selectedViewYear.value, selectedViewMonth.value, base)

    // Status: Lunas if all 4 weeks of the selected month are covered
    const status = progress.length >= 4 ? 'Lunas' : 'Belum Bayar'

    // Find last payment date (sorted by created_at)
    let lastPaid = '-'
    if (studentPayments.length > 0) {
      const sorted = [...studentPayments].sort(
        (a, b) => new Date(b.created_at || b.tanggal_pemasukkan) - new Date(a.created_at || a.tanggal_pemasukkan),
      )
      const d = new Date(sorted[0].tanggal_pemasukkan)
      lastPaid = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const isDue = progress.length < 4

    return {
      id: student.id,
      nisn: student.nis,
      name: student.nama_siswa || student.nama_lengkap || 'Unknown',
      status: status,
      progress: progress,
      total: formatRupiah(totalPaid),
      lastPaid: lastPaid,
      isDue: isDue,
      avatar: (() => {
        const name = student.nama_siswa || student.nama_lengkap || 'U'
        const words = name.trim().split(/\s+/)
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
        return (words[0][0] + words[1][0]).toUpperCase()
      })(),
    };
  });
});

const filteredStudents = computed(() => {
  let result = enrichedStudents.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.nisn).toLowerCase().includes(q),
    );
  }

  return [...result].sort((a, b) => {
    const nisA = Number(a.nisn);
    const nisB = Number(b.nisn);
    if (nisA < nisB) return -1;
    if (nisA > nisB) return 1;
    return 0;
  });
});

const lunasCount = computed(
  () => filteredStudents.value.filter((s) => s.status === "Lunas").length,
);
const belumBayarCount = computed(
  () => filteredStudents.value.filter((s) => s.status === "Belum Bayar").length,
);

// Collection Rate and Outstanding for Current Month
const collectionRate = computed(() => {
  if (totalStudents.value === 0) return "0%";
  const targetTotal = totalStudents.value * 4 * WEEKLY_DUES;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const paidThisMonth = payments.value
    .filter((p) => {
      const d = new Date(p.tanggal_pemasukkan);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0);

  if (targetTotal === 0) return "100%";
  const rate = Math.round((paidThisMonth / targetTotal) * 100);
  return `${rate > 100 ? 100 : rate}%`;
});

const outstanding = computed(() => {
  const targetTotal = totalStudents.value * 4 * WEEKLY_DUES;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const paidThisMonth = payments.value
    .filter((p) => {
      const d = new Date(p.tanggal_pemasukkan);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.jumlah_pemasukkan), 0);

  const diff = targetTotal - paidThisMonth;
  return diff > 0 ? formatRupiah(diff) : "Rp 0";
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [studentsRes, paymentsRes, expensesRes] = await Promise.all([
      api.get("/student"),
      api.get("/pembayaran").catch(() => ({ data: { Data: [] } })),
      api.get("/pengeluaran").catch(() => ({ data: { Data: [] } })),
    ]);

    students.value = studentsRes.data.Data || studentsRes.data || [];
    payments.value = paymentsRes.data.Data || paymentsRes.data || [];
    expenses.value = expensesRes.data.Data || expensesRes.data || [];
  } catch (error) {
    console.error("Error fetching data:", error);
    if (students.value.length === 0) {
      students.value = [
        { id: 1, nama_siswa: "Jane Smith", nis: "202100142" },
        { id: 2, nama_siswa: "Ahmad Maulana", nis: "202100145" },
      ];
      payments.value = [
        {
          id: 1,
          data_student_id: 1,
          tanggal_pemasukkan: new Date().toISOString(),
          jumlah_pemasukkan: 8000,
        },
      ];
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const navigateToAddPayment = () => {
  router.push("/admin/payment");
};
const navigateToAddStudent = () => {
  router.push("/admin/AddStudent");
};

const handleEdit = (id) => {
  router.push({ path: "/admin/addstudent", query: { editId: id } });
};

const handleDelete = async (id) => {
  try {
    await api.delete(`/student/${id}`);
    await fetchData();
  } catch (error) {
    console.error("Failed to delete student:", error);
    alert("Gagal menghapus siswa.");
  }
};
</script>

<template>
  <AdminLayout>
    <div
      class="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
          Kontribusi Siswa
        </h1>
        <p class="text-gray-500 mt-1">
          Kelola database kas kelas dan pantau riwayat pembayaran per siswa.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="navigateToAddPayment"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200 transition-all active:scale-95"
        >
          Transaksi Baru
        </button>
      </div>
    </div>

    <StudentKPIs
      :collectionRate="collectionRate"
      :outstanding="outstanding"
      :totalStudents="totalStudents"
      :treasuryBalance="treasuryBalance"
    />

    <!-- Search Bar -->
    <div class="mb-6 relative max-w-md">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <svg
          class="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        class="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 sm:text-sm transition-all duration-200 shadow-sm"
        placeholder="Cari nama siswa atau NIS..."
      />
    </div>

    <!-- Month selector for progress column -->
    <div class="flex items-center gap-3 mb-4 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm max-w-sm">
      <button @click="prevViewMonth" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progres Bulan</p>
        <p class="text-sm font-black text-gray-900">{{ MONTH_NAMES_ID[selectedViewMonth] }} {{ selectedViewYear }}</p>
      </div>
      <button @click="nextViewMonth" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>

    <StudentRegistryTable
      :enrichedStudents="filteredStudents"
      :lunasCount="lunasCount"
      :belumBayarCount="belumBayarCount"
      :loading="loading"
      @edit="handleEdit"
      @delete="handleDelete"
    />


    <!-- Expand Class Roster CTA -->
    <div
      class="border border-dashed border-gray-300 bg-gray-50/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
    >
      <div
        class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500 shadow-inner"
      >
        <svg
          class="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Kelola Data Kelas</h3>
      <p class="text-gray-500 mb-6 font-medium text-sm">
        Semester baru dimulai? Anda dapat mengimpor siswa dari file CSV atau
        menambahkannya secara manual.
      </p>
      <div class="flex gap-4">
        <button
          @click="openImportModal"
          class="px-6 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Impor CSV
        </button>
        <button
          @click="navigateToAddStudent"
          class="px-6 py-2.5 bg-blue-600 shadow-sm shadow-blue-200 rounded-xl font-semibold text-white hover:bg-blue-700 transition-all active:scale-95"
        >
          Tambah Siswa Baru
        </button>
      </div>
    </div>

    <!-- CSV Import Modal -->
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
            class="mb-6 rounded-xl p-4 flex gap-3"
            :class="
              importResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            "
          >
            <svg
              v-if="importResult.success"
              class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p
                class="text-sm font-bold"
                :class="
                  importResult.success ? 'text-green-800' : 'text-red-800'
                "
              >
                {{ importResult.message }}
              </p>
              <div v-if="importResult.success" class="mt-1 text-xs space-y-0.5">
                <p class="text-green-700">
                  ✓ {{ importResult.imported }} data berhasil diimport
                </p>
                <p v-if="importResult.skipped > 0" class="text-amber-600">
                  ⊘ {{ importResult.skipped }} data di-skip (NIS sudah ada)
                </p>
              </div>
              <div
                v-if="importResult.errors && importResult.errors.length > 0"
                class="mt-2 text-xs text-red-600 space-y-0.5"
              >
                <p
                  v-for="(err, idx) in importResult.errors.slice(0, 5)"
                  :key="idx"
                >
                  • {{ err }}
                </p>
                <p v-if="importResult.errors.length > 5" class="font-bold">
                  ...dan {{ importResult.errors.length - 5 }} error lainnya
                </p>
              </div>
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

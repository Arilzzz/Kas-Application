import { reactive } from 'vue'
import api from './api'

// Centralized reactive cache state
const state = reactive({
  students: [],
  payments: [],
  expenses: [],
  isLoaded: false,
  lastUpdated: null,
  isFetching: false
})

// Cache Time-To-Live: 5 menit (hanya auto-refresh di background jika lebih dari 5 menit)
const CACHE_TTL = 5 * 60 * 1000

export const useDataStore = () => {
  const fetchAll = async (force = false) => {
    const isExpired = !state.lastUpdated || (Date.now() - state.lastUpdated > CACHE_TTL)

    // Jika data sudah ada di cache dan tidak dipaksa reload (serta belum expired),
    // langsung gunakan data cache tanpa menunggu network (instant loading!)
    if (state.isLoaded && !force && !isExpired) {
      return {
        students: state.students,
        payments: state.payments,
        expenses: state.expenses
      }
    }

    if (state.isFetching) {
      return {
        students: state.students,
        payments: state.payments,
        expenses: state.expenses
      }
    }

    state.isFetching = true
    try {
      const [sRes, pRes, eRes] = await Promise.all([
        api.get('/student').catch(() => ({ data: { Data: [] } })),
        api.get('/pembayaran').catch(() => ({ data: { Data: [] } })),
        api.get('/pengeluaran').catch(() => ({ data: { Data: [] } }))
      ])

      state.students = sRes.data?.Data || sRes.data || []
      state.payments = pRes.data?.Data || pRes.data || []
      state.expenses = eRes.data?.Data || eRes.data || []
      state.isLoaded = true
      state.lastUpdated = Date.now()
    } catch (err) {
      console.error('Error refreshing data cache:', err)
    } finally {
      state.isFetching = false
    }

    return {
      students: state.students,
      payments: state.payments,
      expenses: state.expenses
    }
  }

  // Force re-fetch untuk memperbarui cache saat ada perubahan data baru (tambah/edit/hapus)
  const invalidate = async () => {
    return await fetchAll(true)
  }

  // Hapus cache (misalnya saat logout)
  const clearCache = () => {
    state.students = []
    state.payments = []
    state.expenses = []
    state.isLoaded = false
    state.lastUpdated = null
    state.isFetching = false
  }

  return {
    state,
    fetchAll,
    invalidate,
    clearCache
  }
}

export default useDataStore

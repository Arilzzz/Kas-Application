<script setup>
import { ref } from 'vue'
import api from '../../services/api'

const email = ref('')
const statusMsg = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function requestReset() {
  errorMsg.value = ''
  statusMsg.value = ''
  if (!email.value) {
    errorMsg.value = 'Email wajib diisi'
    return
  }

  loading.value = true
  try {
    await api.get('http://127.0.0.1:8000/sanctum/csrf-cookie')
    const res = await api.post('/forgot-password', { email: email.value })
    statusMsg.value = res.data.status || 'Link reset password telah dikirim ke email Anda!'
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      errorMsg.value = err.response.data.message
    } else {
      errorMsg.value = 'Terjadi kesalahan server'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
    <div class="max-w-md w-full relative z-10 px-6">
      <div class="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
        <div class="px-8 pt-12 pb-8 text-center">
          <h2 class="text-3xl font-black text-white mb-2">Lupa Password</h2>
          <p class="text-gray-400 font-medium text-sm">Masukkan email Anda untuk menerima link reset</p>
        </div>

        <div class="px-8 pb-12">
          <div class="space-y-5">
            <div>
              <label for="email" class="block text-sm font-bold text-gray-300 mb-2">Alamat Email</label>
              <input id="email" type="email" v-model="email" @keyup.enter="requestReset"
                class="block w-full px-4 py-3.5 border border-gray-600 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/50 outline-none transition-all placeholder-gray-500"
                placeholder="admin@example.com" />
            </div>

            <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/50 text-red-400 text-sm font-medium rounded-xl p-4 flex items-center gap-3">
              {{ errorMsg }}
            </div>

            <div v-if="statusMsg" class="bg-green-500/10 border border-green-500/50 text-green-400 text-sm font-medium rounded-xl p-4 flex items-center gap-3">
              {{ statusMsg }}
            </div>

            <button @click="requestReset" :disabled="loading"
              class="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
              <span v-if="!loading">Kirim Link Reset</span>
              <span v-else>Memproses...</span>
            </button>
          </div>

          <div class="mt-8 text-center text-sm font-medium text-gray-400">
            <router-link to="/admin/login" class="text-blue-400 font-bold hover:text-blue-300 transition-colors inline-block ml-1">← Kembali ke Login</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

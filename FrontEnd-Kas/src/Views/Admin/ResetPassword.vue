<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../services/api'

const password = ref('')
const password_confirmation = ref('')
const errorMsg = ref('')
const statusMsg = ref('')
const loading = ref(false)

const router = useRouter()
const route = useRoute()

async function resetPassword() {
  errorMsg.value = ''
  if (!password.value || !password_confirmation.value) {
    errorMsg.value = 'Semua kolom wajib diisi'
    return
  }

  if (password.value !== password_confirmation.value) {
    errorMsg.value = 'Password tidak cocok'
    return
  }

  loading.value = true
  try {
    await api.get('http://127.0.0.1:8000/sanctum/csrf-cookie')
    const res = await api.post('/reset-password', {
      token: route.params.token,
      email: route.query.email,
      password: password.value,
      password_confirmation: password_confirmation.value
    })
    statusMsg.value = res.data.status || 'Password berhasil direset!'
    setTimeout(() => {
      router.push('/admin/login')
    }, 2000)
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
          <h2 class="text-3xl font-black text-white mb-2">Buat Password Baru</h2>
          <p class="text-gray-400 font-medium text-sm">Buat password baru untuk akun Anda</p>
        </div>

        <div class="px-8 pb-12">
          <div class="space-y-5">
            <div>
              <label for="password" class="block text-sm font-bold text-gray-300 mb-2">Password Baru</label>
              <input id="password" type="password" v-model="password"
                class="block w-full px-4 py-3.5 border border-gray-600 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/50 outline-none transition-all placeholder-gray-500"
                placeholder="••••••••" />
            </div>

            <div>
              <label for="password_confirmation" class="block text-sm font-bold text-gray-300 mb-2">Konfirmasi Password</label>
              <input id="password_confirmation" type="password" v-model="password_confirmation" @keyup.enter="resetPassword"
                class="block w-full px-4 py-3.5 border border-gray-600 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/50 outline-none transition-all placeholder-gray-500"
                placeholder="••••••••" />
            </div>

            <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/50 text-red-400 text-sm font-medium rounded-xl p-4">
              {{ errorMsg }}
            </div>

            <div v-if="statusMsg" class="bg-green-500/10 border border-green-500/50 text-green-400 text-sm font-medium rounded-xl p-4">
              {{ statusMsg }}
            </div>

            <button @click="resetPassword" :disabled="loading"
              class="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
              <span v-if="!loading">Reset Password</span>
              <span v-else>Memproses...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

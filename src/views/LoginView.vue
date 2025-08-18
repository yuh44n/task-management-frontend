<template>
  <div class="auth-container">
    <div class="container" :class="{ active: isRegisterMode }">
      <!-- Login Form -->
      <div class="form-box login">
        <form @submit.prevent="handleLogin">
          <h1>Login</h1>
          <p>Welcome back! Please login to your account.</p>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="input-box">
            <input 
              type="email" 
              placeholder="Email" 
              v-model="loginForm.email"
              required
            />
            <i class="fas fa-envelope"></i>
          </div>
          
          <div class="input-box">
            <input 
              type="password" 
              placeholder="Password" 
              v-model="loginForm.password"
              required
            />
            <i class="fas fa-lock"></i>
          </div>
          
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>
      </div>

      <!-- Register Form -->
      <div class="form-box register">
        <form @submit.prevent="handleRegister">
          <h1>Register</h1>
          <p>Create your account to get started.</p>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="input-box">
            <input 
              type="text" 
              placeholder="Full Name" 
              v-model="registerForm.name"
              required
            />
            <i class="fas fa-user"></i>
          </div>
          
          <div class="input-box">
            <input 
              type="email" 
              placeholder="Email" 
              v-model="registerForm.email"
              required
            />
            <i class="fas fa-envelope"></i>
          </div>
          
          <div class="input-box">
            <input 
              type="password" 
              placeholder="Password" 
              v-model="registerForm.password"
              required
            />
            <i class="fas fa-lock"></i>
          </div>
          
          <div class="input-box">
            <input 
              type="password" 
              placeholder="Confirm Password" 
              v-model="registerForm.password_confirmation"
              required
            />
            <i class="fas fa-lock"></i>
          </div>
          
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Creating Account...' : 'Sign Up' }}
          </button>
        </form>
      </div>

      <!-- Toggle Panel -->
      <div class="toggle-box">
        <div class="toggle-panel toggle-left">
          <h1>Hello, Friend!</h1>
          <p>Register with your personal details to use all of site features</p>
          <button class="btn" @click="toggleMode">Sign Up</button>
        </div>
        <div class="toggle-panel toggle-right">
          <h1>Welcome Back!</h1>
          <p>Enter your personal details to use all of site features</p>
          <button class="btn" @click="toggleMode">Sign In</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/counter'

const router = useRouter()
const authStore = useAuthStore()

const isRegisterMode = ref(false)
const loading = ref(false)
const error = ref('')

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  error.value = ''
  
  // Reset forms
  Object.keys(loginForm).forEach(key => loginForm[key] = '')
  Object.keys(registerForm).forEach(key => registerForm[key] = '')
}

const handleLogin = async () => {
  if (loginForm.password.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    return
  }

  loading.value = true
  error.value = ''
  
  const result = await authStore.login(loginForm)
  
  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error
  }
  
  loading.value = false
}

const handleRegister = async () => {
  if (registerForm.password !== registerForm.password_confirmation) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (registerForm.password.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    return
  }

  loading.value = true
  error.value = ''
  
  const result = await authStore.register(registerForm)
  
  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error
  }
  
  loading.value = false
}
</script>
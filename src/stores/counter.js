import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = () => {
    return !!token.value && !!user.value
  }

  const isAdmin = () => {
    return user.value?.role === 'admin'
  }

  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/login', credentials)
      const { user: userData, token: userToken } = response.data
      
      user.value = userData
      token.value = userToken
      
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', userToken)
      
      // Initialize notifications after successful login
      const { useInteractionsStore } = await import('./interactions')
      const interactionsStore = useInteractionsStore()
      await interactionsStore.getUnreadCount()
      await interactionsStore.fetchNotifications() // Add this line
      await interactionsStore.fetchPendingInvitations()
      
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/register', userData)
      const { user: newUser, token: userToken } = response.data
      
      user.value = newUser
      token.value = userToken
      
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('token', userToken)
      
      // Initialize notifications after successful registration
      const { useInteractionsStore } = await import('./interactions')
      const interactionsStore = useInteractionsStore()
      await interactionsStore.getUnreadCount()
      await interactionsStore.fetchNotifications() // Add this line
      await interactionsStore.fetchPendingInvitations()
      
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout
  }
})

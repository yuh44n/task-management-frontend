import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

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
      const { auth } = useApi()
      const response = await auth.login(credentials)
      
      // Check if we have a valid response with user data
      if (!response || !response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response from server')
      }
      
      const { user: userData, token: userToken } = response.data
      
      user.value = userData
      token.value = userToken
      
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', userToken)
      
      // Initialize notifications after successful login
      try {
        const { useInteractionsStore } = await import('./interactions')
        const interactionsStore = useInteractionsStore()
        await interactionsStore.getUnreadCount()
        await interactionsStore.fetchNotifications()
        await interactionsStore.fetchPendingInvitations()
      } catch (notificationError) {
        console.error('Error initializing notifications:', notificationError)
        // Continue with login success even if notifications fail
      }
      
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      error.value = err.response?.data?.message || 'Login failed. Please try again.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    error.value = null
    
    try {
      const { auth } = useApi()
      const response = await auth.register(userData)
      
      // Check if we have a valid response with user data
      if (!response || !response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response from server')
      }
      
      const { user: newUser, token: userToken } = response.data
      
      user.value = newUser
      token.value = userToken
      
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('token', userToken)
      
      // Initialize notifications after successful registration
      try {
        const { useInteractionsStore } = await import('./interactions')
        const interactionsStore = useInteractionsStore()
        await interactionsStore.getUnreadCount()
        await interactionsStore.fetchNotifications()
        await interactionsStore.fetchPendingInvitations()
      } catch (notificationError) {
        console.error('Error initializing notifications:', notificationError)
        // Continue with registration success even if notifications fail
      }
      
      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      error.value = err.response?.data?.message || 'Registration failed. Please try again.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      const { auth } = useApi()
      await auth.logout()
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

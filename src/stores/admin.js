import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const allTasks = ref([])
  const dashboardStats = ref({
    total_users: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0
  })
  const loading = ref(false)
  const error = ref(null)

  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { admin: adminApi } = useApi()
      const response = await adminApi.getUsers()
      users.value = response.data.data || response.data
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch users'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchAllTasks = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { admin: adminApi } = useApi()
      const response = await adminApi.getAllTasks()
      allTasks.value = response.data.data || response.data
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch tasks'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchDashboardStats = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { admin: adminApi } = useApi()
      const response = await adminApi.getDashboardStats()
      dashboardStats.value = response.data
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch stats'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateUserRole = async (userId, role) => {
    loading.value = true
    error.value = null
    
    try {
      const { admin: adminApi } = useApi()
      const response = await adminApi.updateUserRole(userId, role)
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index] = response.data.data || response.data
      }
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update user role'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId) => {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(`/admin/users/${userId}`)
      users.value = users.value.filter(user => user.id !== userId)
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete user'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    allTasks,
    dashboardStats,
    loading,
    error,
    fetchUsers,
    fetchAllTasks,
    fetchDashboardStats,
    updateUserRole,
    deleteUser
  }
})
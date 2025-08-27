import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const stats = ref({
    total: 0,
    completed: 0,
    in_progress: 0,
    overdue: 0
  })

  const fetchTasks = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)
      
      const { tasks: tasksApi } = useApi()
      const response = await tasksApi.getAll(Object.fromEntries(params))
      tasks.value = response.data.tasks.data || response.data.tasks
      
      // Calculate stats
      calculateStats()
      
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch tasks'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const createTask = async (taskData) => {
    loading.value = true
    error.value = null
    
    try {
      const { tasks: tasksApi } = useApi()
      const response = await tasksApi.create(taskData)
      tasks.value.unshift(response.data.task)
      calculateStats()
      return { success: true, data: response.data }
    } catch (err) {
      console.error('Task creation error:', err.response?.data)
      if (err.response?.data?.errors) {
        // Format validation errors
        const errorMessages = Object.values(err.response.data.errors).flat()
        error.value = errorMessages.join('\n')
      } else {
        error.value = err.response?.data?.message || 'Failed to create task'
      }
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (taskId, taskData) => {
    error.value = null
    
    try {
      const { tasks: tasksApi } = useApi()
      const response = await tasksApi.update(taskId, taskData)
      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value[index] = response.data.task
      }
      calculateStats()
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update task'
      throw err
    }
  }

  const deleteTask = async (taskId) => {
    loading.value = true
    error.value = null
    
    try {
      const { tasks: tasksApi } = useApi()
      await tasksApi.delete(taskId)
      tasks.value = tasks.value.filter(task => task.id !== taskId)
      calculateStats()
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete task'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const calculateStats = () => {
    const now = new Date()
    
    stats.value = {
      total: tasks.value.length,
      completed: tasks.value.filter(task => task.status === 'completed').length,
      in_progress: tasks.value.filter(task => task.status === 'in_progress').length,
      overdue: tasks.value.filter(task => {
        if (task.status === 'completed') return false
        const dueDate = new Date(task.due_date)
        return dueDate < now
      }).length
    }
  }
  
  // Add this new method
  const getUsers = async () => {
    try {
      const { api } = useApi()
      const response = await api.get('/api/tasks/users/list')
      return response.data
    } catch (err) {
      console.error('Failed to fetch users:', err)
      return { users: [] }
    }
  }

  return {
    tasks,
    loading,
    error,
    stats,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    calculateStats,
    getUsers  // Don't forget to add it to the returned object
  }
})
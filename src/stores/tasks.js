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

  const fetchTasks = async (filters = {}, forceRefresh = false) => {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)
      
      const { tasks: tasksApi, cache } = useApi()
      
      // If forceRefresh is true, clear the tasks cache before fetching
      if (forceRefresh) {
        cache.clear('tasks-all')
      }
      
      const response = await tasksApi.getAll(Object.fromEntries(params))
      
      // Check if we have valid data
      if (response.data && (response.data.tasks.data || response.data.tasks)) {
        tasks.value = response.data.tasks.data || response.data.tasks
        
        // Calculate stats
        calculateStats()
        
        return { success: true }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      
      // If we have tasks already, don't clear them on error
      if (tasks.value.length === 0) {
        error.value = err.response?.data?.message || 'Failed to fetch tasks'
      } else {
        // Just show error message but keep existing tasks
        error.value = 'Failed to refresh tasks. Showing cached data.'
      }
      
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const createTask = async (taskData) => {
    loading.value = true
    error.value = null
    
    // Validate required fields client-side before sending to server
    const requiredFields = ['title', 'due_date', 'priority']
    const missingFields = requiredFields.filter(field => !taskData[field])
    
    if (missingFields.length > 0) {
      error.value = `Missing required fields: ${missingFields.join(', ')}`
      loading.value = false
      return { success: false, error: error.value }
    }
    
    try {
      const { tasks: tasksApi } = useApi()
      const response = await tasksApi.create(taskData)
      
      // Add the new task to the beginning of the list
      if (response.data.task) {
        tasks.value.unshift(response.data.task)
        calculateStats()
      }
      
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
    
    // Store the original task for rollback if needed
    const index = tasks.value.findIndex(task => task.id === taskId)
    let originalTask = null
    
    if (index !== -1) {
      // Create a deep copy of the original task
      originalTask = JSON.parse(JSON.stringify(tasks.value[index]))
      
      // Apply optimistic update
      tasks.value[index] = { ...tasks.value[index], ...taskData }
      calculateStats()
    }
    
    try {
      const { tasks: tasksApi } = useApi()
      const response = await tasksApi.update(taskId, taskData)
      
      // Update with server response data
      if (index !== -1) {
        tasks.value[index] = response.data.task
      }
      
      calculateStats()
      return response.data
    } catch (err) {
      // Rollback to original state if update fails
      if (index !== -1 && originalTask) {
        tasks.value[index] = originalTask
        calculateStats()
      }
      
      error.value = err.response?.data?.message || 'Failed to update task'
      throw err
    }
  }

  const deleteTask = async (taskId) => {
    error.value = null
    
    // Store the original tasks array for rollback if needed
    const originalTasks = JSON.parse(JSON.stringify(tasks.value))
    const taskToDelete = tasks.value.find(task => task.id === taskId)
    
    if (!taskToDelete) {
      return { success: false, error: 'Task not found' }
    }
    
    // Apply optimistic update
    tasks.value = tasks.value.filter(task => task.id !== taskId)
    calculateStats()
    
    try {
      loading.value = true
      const { tasks: tasksApi } = useApi()
      await tasksApi.delete(taskId)
      return { success: true }
    } catch (err) {
      // Rollback to original state if delete fails
      tasks.value = originalTasks
      calculateStats()
      
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
  
  // Fetch a single task by ID
  const fetchTaskById = async (taskId) => {
    error.value = null
    
    try {
      // First check if we already have this task in our local state
      const existingTask = tasks.value.find(task => task.id === taskId)
      
      // If we have a recent task and it's not a force refresh, use the cached version
      if (existingTask) {
        return { success: true, task: existingTask }
      }
      
      // Otherwise fetch from API
      const { tasks: tasksApi } = useApi()
      const response = await tasksApi.get(taskId)
      
      if (response.data && response.data.task) {
        // If the task isn't in our list yet, add it
        if (!existingTask) {
          tasks.value.push(response.data.task)
        } else {
          // Otherwise update the existing task
          const index = tasks.value.findIndex(task => task.id === taskId)
          if (index !== -1) {
            tasks.value[index] = response.data.task
          }
        }
        
        return { success: true, task: response.data.task }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      error.value = err.response?.data?.message || `Failed to fetch task #${taskId}`
      return { success: false, error: error.value }
    }
  }
  
  // Get users for task assignment
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
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    calculateStats,
    getUsers  // Don't forget to add it to the returned object
  }
})
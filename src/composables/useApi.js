import api, { getCsrfToken } from '@/utils/api'

// Cache for API responses
const apiCache = new Map()

// Helper function to handle API calls with fallback
const callApiWithFallback = async (endpoint, method = 'get', data = null, config = {}) => {
  try {
    // Try with /api prefix first
    if (method === 'get') {
      return await api.get(endpoint, config)
    } else if (method === 'post') {
      return await api.post(endpoint, data, config)
    } else if (method === 'put') {
      return await api.put(endpoint, data, config)
    } else if (method === 'delete') {
      return await api.delete(endpoint, config)
    } else if (method === 'patch') {
      return await api.patch(endpoint, data, config)
    }
  } catch (err) {
    // Only try fallback for 404 errors
    if (err.response?.status === 404 && endpoint.startsWith('/api/')) {
      const fallbackEndpoint = endpoint.replace('/api/', '/')
      if (method === 'get') {
        return await api.get(fallbackEndpoint, config)
      } else if (method === 'post') {
        return await api.post(fallbackEndpoint, data, config)
      } else if (method === 'put') {
        return await api.put(fallbackEndpoint, data, config)
      } else if (method === 'delete') {
        return await api.delete(fallbackEndpoint, config)
      } else if (method === 'patch') {
        return await api.patch(fallbackEndpoint, data, config)
      }
    }
    throw err
  }
}

export function useApi() {
  /**
   * Authentication API calls
   */
  const auth = {
    login: async (credentials) => {
      await getCsrfToken() // Get CSRF token before login
      return api.post('/api/login', credentials)
    },
    register: async (userData) => {
      await getCsrfToken() // Get CSRF token before registration
      return api.post('/api/register', userData)
    },
    logout: async () => {
      await getCsrfToken() // Get CSRF token before logout
      return api.post('/api/logout')
    },
    getUser: () => api.get('/api/user')
  }

  /**
   * Tasks API calls
   */
  const tasks = {
    getAll: async (params) => {
      const cacheKey = `tasks-all-${JSON.stringify(params || {})}`
      // Use cached data if available and not older than 30 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/tasks', 'get', null, { params })
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    get: async (id) => {
      const cacheKey = `task-${id}`
      // Use cached data if available and not older than 30 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback(`/api/tasks/${id}`, 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    create: (taskData) => callApiWithFallback('/api/tasks', 'post', taskData),
    update: (id, taskData) => {
      // Invalidate cache for this task and task list
      apiCache.delete(`task-${id}`)
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('tasks-all'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/tasks/${id}`, 'put', taskData)
    },
    delete: (id) => {
      // Invalidate cache for this task and task list
      apiCache.delete(`task-${id}`)
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('tasks-all'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/tasks/${id}`, 'delete')
    },
    updateStatus: (id, status) => {
      // Invalidate cache for this task and task list
      apiCache.delete(`task-${id}`)
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('tasks-all'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/tasks/${id}/status`, 'patch', { status })
    },
    getStats: async () => {
      const cacheKey = 'tasks-stats'
      // Use cached data if available and not older than 60 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 60000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/tasks/stats', 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    }
  }

  /**
   * Task Comments API calls
   */
  const comments = {
    getForTask: async (taskId, forceRefresh = false) => {
      const cacheKey = `comments-task-${taskId}`
      // Use cached data if available, not older than 30 seconds, and not forcing refresh
      if (!forceRefresh && apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback(`/api/tasks/${taskId}/comments`, 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    create: (taskId, commentData) => {
      // Invalidate comments cache for this task
      apiCache.delete(`comments-task-${taskId}`)
      return callApiWithFallback(`/api/tasks/${taskId}/comments`, 'post', commentData)
    },
    update: (commentId, commentData) => {
      // Invalidate all comments caches as we don't know which task this belongs to
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('comments-task-'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/comments/${commentId}`, 'put', commentData)
    },
    delete: (commentId) => {
      // Invalidate all comments caches as we don't know which task this belongs to
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('comments-task-'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/comments/${commentId}`, 'delete')
    },
    clearCache: (taskId = null) => {
      if (taskId) {
        // Clear specific task comments cache
        apiCache.delete(`comments-task-${taskId}`)
      } else {
        // Clear all comments caches
        Array.from(apiCache.keys())
          .filter(key => key.startsWith('comments-task-'))
          .forEach(key => apiCache.delete(key))
      }
    }
  }

  /**
   * File Attachments API calls
   */
  const attachments = {
    getForTask: async (taskId, forceRefresh = false) => {
      const cacheKey = `attachments-task-${taskId}`
      // Use cached data if available, not older than 30 seconds, and not forcing refresh
      if (!forceRefresh && apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback(`/api/tasks/${taskId}/attachments`, 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    getForInteraction: async (interactionId, forceRefresh = false) => {
      const cacheKey = `attachments-interaction-${interactionId}`
      // Use cached data if available, not older than 30 seconds, and not forcing refresh
      if (!forceRefresh && apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback(`/api/interactions/${interactionId}/attachments`, 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    upload: (taskId, formData) => {
      // Invalidate attachments cache for this task
      apiCache.delete(`attachments-task-${taskId}`)
      return callApiWithFallback(`/api/tasks/${taskId}/attachments`, 'post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          // For future progress tracking implementation
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          // console.log(`Upload progress: ${percentCompleted}%`)
        }
      })
    },
    delete: (attachmentId) => {
      // Invalidate all attachment caches as we don't know which task this belongs to
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('attachments-'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/attachments/${attachmentId}`, 'delete')
    },
    clearCache: (taskId = null, interactionId = null) => {
      if (taskId) {
        // Clear specific task attachments cache
        apiCache.delete(`attachments-task-${taskId}`)
      } else if (interactionId) {
        // Clear specific interaction attachments cache
        apiCache.delete(`attachments-interaction-${interactionId}`)
      } else {
        // Clear all attachments caches
        Array.from(apiCache.keys())
          .filter(key => key.startsWith('attachments-'))
          .forEach(key => apiCache.delete(key))
      }
    }
  }

  /**
   * Invitations API calls
   */
  const invitations = {
    getForTask: async (taskId) => {
      const cacheKey = `invitations-task-${taskId}`
      // Use cached data if available and not older than 30 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback(`/api/tasks/${taskId}/invitations`, 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    getPending: async () => {
      const cacheKey = 'invitations-pending'
      // Use cached data if available and not older than 30 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 30000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/user/invitations/pending', 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    accept: (invitationId) => {
      // Invalidate all invitations caches
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('invitations-'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/interactions/${invitationId}/accept`, 'post')
    },
    decline: (invitationId) => {
      // Invalidate all invitations caches
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('invitations-'))
        .forEach(key => apiCache.delete(key))
      
      return callApiWithFallback(`/api/interactions/${invitationId}/decline`, 'post')
    },
    invite: (taskId, invitationData) => {
      // Invalidate invitations cache for this task and pending invitations
      apiCache.delete(`invitations-task-${taskId}`)
      apiCache.delete('invitations-pending')
      return callApiWithFallback(`/api/tasks/${taskId}/invitations`, 'post', invitationData)
    }
  }

  /**
   * Notifications API calls
   */
  const notifications = {
    getAll: async (params = {}) => {
      const cacheKey = `notifications-all-${JSON.stringify(params || {})}`
      // Use cached data if available and not older than 15 seconds (shorter time for notifications)
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 15000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/user/notifications', 'get', null, { params })
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    getUnreadCount: async () => {
      const cacheKey = 'notifications-unread-count'
      // Use cached data if available and not older than 15 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 15000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/user/notifications/unread-count', 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    markAsRead: (notificationId) => {
      // Invalidate notifications cache
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('notifications-'))
        .forEach(key => apiCache.delete(key))
      return callApiWithFallback(`/api/interactions/${notificationId}/read`, 'patch')
    },
    markAllAsRead: () => {
      // Invalidate notifications cache
      Array.from(apiCache.keys())
        .filter(key => key.startsWith('notifications-'))
        .forEach(key => apiCache.delete(key))
      return callApiWithFallback('/api/user/notifications/mark-all-read', 'patch')
    },
    clearCache: (endpoint = null) => {
      if (endpoint) {
        // Clear specific endpoint cache
        Array.from(apiCache.keys())
          .filter(key => key.includes(endpoint))
          .forEach(key => apiCache.delete(key))
      } else {
        // Clear all notification caches
        Array.from(apiCache.keys())
          .filter(key => key.startsWith('notifications-'))
          .forEach(key => apiCache.delete(key))
      }
    }
  }

  /**
   * Admin API calls
   */
  const admin = {
    getUsers: async () => {
      const cacheKey = 'admin-users'
      // Use cached data if available and not older than 60 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 60000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/admin/users', 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    updateUserRole: (userId, role) => {
      // Invalidate user caches
      apiCache.delete('admin-users')
      return callApiWithFallback(`/api/admin/users/${userId}/role`, 'put', { role })
    },
    deleteUser: (userId) => {
      // Invalidate user caches
      apiCache.delete('admin-users')
      return callApiWithFallback(`/api/admin/users/${userId}`, 'delete')
    },
    getDashboardStats: async () => {
      const cacheKey = 'admin-dashboard-stats'
      // Use cached data if available and not older than 60 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 60000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/admin/dashboard-stats', 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
    getAllTasks: async () => {
      const cacheKey = 'admin-all-tasks'
      // Use cached data if available and not older than 60 seconds
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey)
        if (Date.now() - cachedData.timestamp < 60000) {
          return cachedData.response
        }
      }
      
      const response = await callApiWithFallback('/api/admin/tasks', 'get')
      // Cache the response
      apiCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
      return response
    },
  /**
   * Cache management functions
   */
  const : cache = {

    clear: (pattern = null) => {
      if (pattern) {
        // Clear cache entries matching the pattern
        Array.from(apiCache.keys())
          .filter(key => key.includes(pattern))
          .forEach(key => apiCache.delete(key))
      } else {
        // Clear all cache
        apiCache.clear()
      }
    },
    clearAll: () => apiCache.clear(),
    getSize: () => apiCache.size
  },

  return : {

    auth,
    tasks,
    comments,
    attachments,
    invitations,
    notifications,
    admin,
    cache,
    // Expose the raw api instance for any custom calls
    api
  }
}
}
import api, { getCsrfToken } from '@/utils/api'

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
    getAll: (params) => api.get('/api/tasks', { params }),
    get: (id) => api.get(`/api/tasks/${id}`),
    create: (taskData) => api.post('/api/tasks', taskData),
    update: (id, taskData) => api.put(`/api/tasks/${id}`, taskData),
    delete: (id) => api.delete(`/api/tasks/${id}`),
    updateStatus: (id, status) => api.patch(`/api/tasks/${id}/status`, { status }),
    getStats: () => api.get('/api/tasks/stats')
  }

  /**
   * Task Comments API calls
   */
  const comments = {
    getForTask: (taskId) => api.get(`/api/tasks/${taskId}/comments`),
    create: (taskId, commentData) => api.post(`/api/tasks/${taskId}/comments`, commentData),
    delete: (commentId) => api.delete(`/api/comments/${commentId}`)
  }

  /**
   * Task Attachments API calls
   */
  const attachments = {
    getForTask: async (taskId) => {
      try {
        return await api.get(`/api/tasks/${taskId}/attachments`)
      } catch (err) {
        console.error('Error fetching task attachments with /api prefix:', err)
        // Try without /api prefix as fallback
        return await api.get(`/tasks/${taskId}/attachments`)
      }
    },
    getForInteraction: async (interactionId) => {
      try {
        return await api.get(`/api/interactions/${interactionId}/attachments`)
      } catch (err) {
        console.error('Error fetching interaction attachments with /api prefix:', err)
        // Try without /api prefix as fallback
        return await api.get(`/interactions/${interactionId}/attachments`)
      }
    },
    upload: async (taskId, formData) => {
      try {
        return await api.post(`/api/tasks/${taskId}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } catch (err) {
        console.error('Error uploading attachment with /api prefix:', err)
        // Try without /api prefix as fallback
        return await api.post(`/tasks/${taskId}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }
    },
    delete: async (attachmentId) => {
      try {
        return await api.delete(`/api/attachments/${attachmentId}`)
      } catch (err) {
        console.error('Error deleting attachment with /api prefix:', err)
        // Try without /api prefix as fallback
        return await api.delete(`/attachments/${attachmentId}`)
      }
    }
  }

  /**
   * Invitations API calls
   */
  const invitations = {
    getPending: () => api.get('/api/user/invitations/pending'),
    accept: (invitationId) => api.post(`/api/interactions/${invitationId}/accept`),
    decline: (invitationId) => api.post(`/api/interactions/${invitationId}/decline`),
    invite: (taskId, invitationData) => api.post(`/api/tasks/${taskId}/invitations`, invitationData)
  }

  /**
   * Notifications API calls
   */
  const notifications = {
    getAll: () => api.get('/api/user/notifications'),
    getUnreadCount: () => api.get('/api/user/notifications/unread-count'),
    markAsRead: (notificationId) => api.patch(`/api/interactions/${notificationId}/read`),
    markAllAsRead: () => api.patch('/api/user/notifications/mark-all-read')
  }

  /**
   * Admin API calls
   */
  const admin = {
    getUsers: () => api.get('/api/admin/users'),
    updateUserRole: (userId, role) => api.put(`/api/admin/users/${userId}/role`, { role }),
    deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
    getDashboardStats: () => api.get('/api/admin/dashboard-stats'),
    getAllTasks: () => api.get('/api/admin/tasks')
  }

  return {
    auth,
    tasks,
    comments,
    attachments,
    invitations,
    notifications,
    admin,
    // Expose the raw api instance for any custom calls
    api
  }
}
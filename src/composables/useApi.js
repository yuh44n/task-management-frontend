import api from '@/utils/api'

export function useApi() {
  /**
   * Authentication API calls
   */
  const auth = {
    login: (credentials) => api.post('/api/login', credentials),
    register: (userData) => api.post('/api/register', userData),
    logout: () => api.post('/api/logout'),
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
    getForTask: (taskId) => api.get(`/api/tasks/${taskId}/attachments`),
    upload: (taskId, formData) => api.post(`/api/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    delete: (attachmentId) => api.delete(`/api/attachments/${attachmentId}`)
  }

  /**
   * Invitations API calls
   */
  const invitations = {
    getPending: () => api.get('/api/user/invitations/pending'),
    accept: (invitationId) => api.post(`/api/user/invitations/${invitationId}/accept`),
    decline: (invitationId) => api.post(`/api/user/invitations/${invitationId}/decline`),
    invite: (taskId, email) => api.post(`/api/tasks/${taskId}/invite`, { email })
  }

  /**
   * Notifications API calls
   */
  const notifications = {
    getAll: () => api.get('/api/user/notifications'),
    getUnreadCount: () => api.get('/api/user/notifications/unread-count'),
    markAsRead: (notificationId) => api.patch(`/api/user/notifications/${notificationId}/read`),
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
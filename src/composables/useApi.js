import api from '@/utils/api'

export function useApi() {
  /**
   * Authentication API calls
   */
  const auth = {
    login: (credentials) => api.post('/login', credentials),
    register: (userData) => api.post('/register', userData),
    logout: () => api.post('/logout'),
    getUser: () => api.get('/user')
  }

  /**
   * Tasks API calls
   */
  const tasks = {
    getAll: (params) => api.get('/tasks', { params }),
    get: (id) => api.get(`/tasks/${id}`),
    create: (taskData) => api.post('/tasks', taskData),
    update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
    delete: (id) => api.delete(`/tasks/${id}`),
    updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
    getStats: () => api.get('/tasks/stats')
  }

  /**
   * Task Comments API calls
   */
  const comments = {
    getForTask: (taskId) => api.get(`/tasks/${taskId}/comments`),
    create: (taskId, commentData) => api.post(`/tasks/${taskId}/comments`, commentData),
    delete: (commentId) => api.delete(`/comments/${commentId}`)
  }

  /**
   * Task Attachments API calls
   */
  const attachments = {
    getForTask: (taskId) => api.get(`/tasks/${taskId}/attachments`),
    upload: (taskId, formData) => api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    delete: (attachmentId) => api.delete(`/attachments/${attachmentId}`)
  }

  /**
   * Invitations API calls
   */
  const invitations = {
    getPending: () => api.get('/user/invitations/pending'),
    accept: (invitationId) => api.post(`/user/invitations/${invitationId}/accept`),
    decline: (invitationId) => api.post(`/user/invitations/${invitationId}/decline`),
    invite: (taskId, email) => api.post(`/tasks/${taskId}/invite`, { email })
  }

  /**
   * Notifications API calls
   */
  const notifications = {
    getAll: () => api.get('/user/notifications'),
    getUnreadCount: () => api.get('/user/notifications/unread-count'),
    markAsRead: (notificationId) => api.patch(`/user/notifications/${notificationId}/read`),
    markAllAsRead: () => api.patch('/user/notifications/mark-all-read')
  }

  /**
   * Admin API calls
   */
  const admin = {
    getUsers: () => api.get('/admin/users'),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
    getDashboardStats: () => api.get('/admin/dashboard-stats'),
    getAllTasks: () => api.get('/admin/tasks')
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
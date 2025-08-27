import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

export const useInteractionsStore = defineStore('interactions', () => {
  const comments = ref([])
  const invitations = ref([])
  const notifications = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchComments = async (taskId, forceRefresh = false) => {
    error.value = null
    loading.value = true
    
    try {
      const { comments: commentsApi } = useApi()
      
      // If forceRefresh is true, clear the cache for this endpoint
      if (forceRefresh) {
        commentsApi.clearCache(`/tasks/${taskId}/comments`)
      }
      
      const response = await commentsApi.getForTask(taskId)
      
      // Validate response data
      if (response.data && Array.isArray(response.data.comments)) {
        comments.value = response.data.comments
      } else {
        console.warn('Invalid comments data format received')
        // Keep existing comments if response format is invalid
      }
      
      loading.value = false
      return comments.value
    } catch (err) {
      loading.value = false
      error.value = err.response?.data?.message || 'Failed to fetch comments'
      // Don't clear existing comments on error to maintain UI state
      throw err
    }
  }

  const addComment = async (taskId, commentData) => {
    error.value = null
    
    // Create a temporary comment for optimistic UI update
    const tempId = `temp-${Date.now()}`
    const tempComment = {
      id: tempId,
      content: commentData.content,
      parent_id: commentData.parent_id || null,
      task_id: taskId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { ...JSON.parse(localStorage.getItem('user')) },
      is_temp: true // Flag to identify temporary comments
    }
    
    // Add the temporary comment to the UI immediately
    if (commentData.parent_id) {
      const parentIndex = comments.value.findIndex(c => c.id === commentData.parent_id)
      if (parentIndex !== -1) {
        if (!comments.value[parentIndex].replies) {
          comments.value[parentIndex].replies = []
        }
        comments.value[parentIndex].replies.push(tempComment)
      }
    } else {
      comments.value.unshift(tempComment)
    }
    
    try {
      const { comments: commentsApi } = useApi()
      const response = await commentsApi.create(taskId, commentData)
      const newComment = response.data.comment
      
      if (!newComment.user) {
        newComment.user = { name: 'Unknown User', id: 0 }
      }
      
      // Replace the temporary comment with the real one
      if (commentData.parent_id) {
        const parentIndex = comments.value.findIndex(c => c.id === commentData.parent_id)
        if (parentIndex !== -1 && comments.value[parentIndex].replies) {
          const tempIndex = comments.value[parentIndex].replies.findIndex(c => c.id === tempId)
          if (tempIndex !== -1) {
            comments.value[parentIndex].replies[tempIndex] = newComment
          }
        }
      } else {
        const tempIndex = comments.value.findIndex(c => c.id === tempId)
        if (tempIndex !== -1) {
          comments.value[tempIndex] = newComment
        }
      }
      
      return newComment
    } catch (err) {
      // Remove the temporary comment on error
      if (commentData.parent_id) {
        const parentIndex = comments.value.findIndex(c => c.id === commentData.parent_id)
        if (parentIndex !== -1 && comments.value[parentIndex].replies) {
          const tempIndex = comments.value[parentIndex].replies.findIndex(c => c.id === tempId)
          if (tempIndex !== -1) {
            comments.value[parentIndex].replies.splice(tempIndex, 1)
          }
        }
      } else {
        const tempIndex = comments.value.findIndex(c => c.id === tempId)
        if (tempIndex !== -1) {
          comments.value.splice(tempIndex, 1)
        }
      }
      
      error.value = err.response?.data?.message || 'Failed to add comment'
      throw err
    }
  }

  const updateComment = async (interactionId, commentData) => {
    error.value = null
    
    // Find the comment to update
    const index = comments.value.findIndex(c => c.id === interactionId)
    let originalComment = null
    
    // Store the original comment for rollback if needed
    if (index !== -1) {
      originalComment = JSON.parse(JSON.stringify(comments.value[index]))
      
      // Apply optimistic update
      comments.value[index] = {
        ...comments.value[index],
        content: commentData.content,
        updated_at: new Date().toISOString()
      }
    }
    
    try {
      const { comments: commentsApi } = useApi()
      const response = await commentsApi.update(interactionId, commentData)
      const updatedComment = response.data.comment
      
      if (!updatedComment.user && originalComment) {
        updatedComment.user = originalComment.user || { name: 'Unknown User', id: 0 }
      }
      
      // Update with server response
      if (index !== -1) {
        comments.value[index] = updatedComment
      }
      
      return updatedComment
    } catch (err) {
      // Rollback to original state if update fails
      if (index !== -1 && originalComment) {
        comments.value[index] = originalComment
      }
      
      error.value = err.response?.data?.message || 'Failed to update comment'
      throw err
    }
  }

  const deleteComment = async (interactionId) => {
    error.value = null
    
    // Find the comment to delete
    const index = comments.value.findIndex(c => c.id === interactionId)
    let originalComment = null
    let originalIndex = -1
    
    // Store the original comment and remove it optimistically
    if (index !== -1) {
      originalComment = JSON.parse(JSON.stringify(comments.value[index]))
      originalIndex = index
      comments.value.splice(index, 1)
    }
    
    try {
      const { comments: commentsApi } = useApi()
      await commentsApi.delete(interactionId)
      // Comment already removed from UI, no need to do it again
    } catch (err) {
      // Rollback deletion if the API call fails
      if (originalComment && originalIndex !== -1) {
        comments.value.splice(originalIndex, 0, originalComment)
      }
      
      error.value = err.response?.data?.message || 'Failed to delete comment'
      throw err
    }
  }

  // Refresh comments to get latest data including attachments
  const refreshComments = async (taskId, forceRefresh = false) => {
    error.value = null
    loading.value = true
    
    try {
      const { comments: commentsApi } = useApi()
      
      // If forceRefresh is true, clear the cache for this endpoint
      if (forceRefresh) {
        commentsApi.clearCache(`/tasks/${taskId}/comments`)
      }
      
      const response = await commentsApi.getForTask(taskId)
      
      // Validate response data
      if (response.data && Array.isArray(response.data.comments)) {
        comments.value = response.data.comments
      } else {
        console.warn('Invalid comments data format received')
        // Keep existing comments if response format is invalid
      }
      
      loading.value = false
      return comments.value
    } catch (err) {
      loading.value = false
      error.value = err.response?.data?.message || 'Failed to fetch comments'
      // Don't clear existing comments on error to maintain UI state
      throw err
    }
  }

  const fetchPendingInvitations = async (forceRefresh = false) => {
    loading.value = true
    error.value = null
    
    try {
      const { invitations: invitationsApi } = useApi()
      
      // Clear cache if forceRefresh is true
      if (forceRefresh) {
        // Clear invitations cache
        Array.from(apiCache.keys())
          .filter(key => key.startsWith('invitations-'))
          .forEach(key => apiCache.delete(key))
      }
      
      const response = await invitationsApi.getPending()
      
      // Validate response data
      if (response.data && Array.isArray(response.data.invitations)) {
        const rawInvitations = response.data.invitations || []
        invitations.value = rawInvitations.map(invitation => ({
          ...invitation,
          user: invitation.user || { name: 'Unknown User', id: 0 }
        }))
      } else {
        console.warn('Invalid invitations data format received')
        // Keep existing invitations if response format is invalid
      }
      
      return invitations.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch invitations'
      // Don't clear existing invitations on error to maintain UI state
      throw err
    } finally {
      loading.value = false
    }
  }

  const sendInvitation = async (taskId, invitationData) => {
    loading.value = true
    error.value = null
    
    try {
      const { api } = useApi()
      const response = await api.post(`/api/tasks/${taskId}/invitations`, invitationData)
      
      // Force refresh pending invitations to get the latest data
      await fetchPendingInvitations(true)
      
      // Show success toast
      toast.success('Invitation sent successfully')
      
      return response.data.invitation
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send invitation'
      error.value = errorMessage
      
      // Show error toast
      toast.error(errorMessage)
      
      throw err
    } finally {
      loading.value = false
    }
  }

  const acceptInvitation = async (interactionId) => {
    loading.value = true
    error.value = null
    
    // Store original invitations for rollback if needed
    const originalInvitations = [...invitations.value]
    
    // Optimistically update UI by removing the accepted invitation
    const index = invitations.value.findIndex(i => i.id === interactionId)
    if (index !== -1) {
      invitations.value.splice(index, 1)
    }
    
    try {
      const notificationExists = notifications.value.some(n => n.id === interactionId || n.metadata?.invitation_id === interactionId)
      const invitationExists = invitations.value.some(i => i.id === interactionId)
      
      const { invitations: invitationsApi } = useApi()
      const response = await invitationsApi.accept(interactionId)
      
      const processedInvitation = {
        ...response.data.invitation,
        user: response.data.invitation.user || { name: 'Unknown User', id: 0 }
      }
      
      let notificationIndex = notifications.value.findIndex(n => n.id === interactionId)
      if (notificationIndex !== -1) {
        notifications.value.splice(notificationIndex, 1)
      } else {
        notificationIndex = notifications.value.findIndex(n => n.metadata?.invitation_id === interactionId)
        if (notificationIndex !== -1) {
          notifications.value.splice(notificationIndex, 1)
        }
      }
      
      // Show success toast
      toast.success('Invitation accepted successfully')
      
      return processedInvitation
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to accept invitation'
      error.value = errorMessage
      
      // Rollback to original state on error
      invitations.value = originalInvitations
      
      // Show error toast
      toast.error(errorMessage)
      
      throw err
    } finally {
      loading.value = false
    }
  }

  const declineInvitation = async (interactionId) => {
    loading.value = true
    error.value = null
    
    // Store original invitations for rollback if needed
    const originalInvitations = [...invitations.value]
    
    // Optimistically update UI by removing the declined invitation
    const index = invitations.value.findIndex(i => i.id === interactionId)
    if (index !== -1) {
      invitations.value.splice(index, 1)
    }
    
    try {
      const notificationExists = notifications.value.some(n => n.id === interactionId || n.metadata?.invitation_id === interactionId)
      const invitationExists = invitations.value.some(i => i.id === interactionId)
      
      const { invitations: invitationsApi } = useApi()
      const response = await invitationsApi.decline(interactionId)
      
      // Process the returned invitation to ensure it has a user property
      const processedInvitation = {
        ...response.data.invitation,
        user: response.data.invitation.user || { name: 'Unknown User', id: 0 }
      }
      
      // Also remove from notifications list if it exists there
      // First try by direct ID match
      let notificationIndex = notifications.value.findIndex(n => n.id === interactionId)
      if (notificationIndex !== -1) {
        notifications.value.splice(notificationIndex, 1)
      } else {
        // Then try by invitation_id in metadata
        notificationIndex = notifications.value.findIndex(n => n.metadata?.invitation_id === interactionId)
        if (notificationIndex !== -1) {
          notifications.value.splice(notificationIndex, 1)
        }
      }
      
      // Show success toast
      toast.success('Invitation declined')
      
      return processedInvitation
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to decline invitation'
      error.value = errorMessage
      
      // Rollback to original state on error
      invitations.value = originalInvitations
      
      // Show error toast
      toast.error(errorMessage)
      
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchNotifications = async (params = {}, forceRefresh = false) => {
    loading.value = true
    error.value = null
    
    try {
      const { notifications: notificationsApi } = useApi()
      
      // Clear cache if forceRefresh is true
      if (forceRefresh) {
        notificationsApi.clearCache('/notifications')
      }
      
      const response = await notificationsApi.getAll(params)
      
      // Validate response data
      if (response.data && (response.data.notifications.data || response.data.notifications)) {
        const rawNotifications = response.data.notifications.data || response.data.notifications
        
        notifications.value = rawNotifications.map(notification => ({
          ...notification,
          user: notification.user || { name: 'Unknown User', id: 0 }
        }))
      } else {
        // Keep existing notifications if response format is invalid
        console.warn('Invalid notifications data format received')
      }
      
      return notifications.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch notifications'
      // Don't clear existing notifications on error to maintain UI state
      throw err
    } finally {
      loading.value = false
    }
  }

  const getUnreadCount = async (forceRefresh = false) => {
    try {
      const { notifications: notificationsApi } = useApi()
      
      // Clear cache if forceRefresh is true
      if (forceRefresh) {
        notificationsApi.clearCache('/notifications/unread-count')
      }
      
      const response = await notificationsApi.getUnreadCount()
      
      // Validate response data
      if (response.data && typeof response.data.count === 'number') {
        return response.data.count
      } else {
        console.warn('Invalid unread count data format received')
        return unreadCount.value // Return computed value as fallback
      }
    } catch (err) {
      console.warn('Failed to fetch unread count:', err.message || err)
      return unreadCount.value // Return computed value as fallback
    }
  }

  const markAsRead = async (interactionId) => {
    error.value = null
    
    // Find the notification to update
    const index = notifications.value.findIndex(n => n.id === interactionId)
    let originalNotification = null
    
    // Store the original notification for rollback if needed
    if (index !== -1) {
      originalNotification = JSON.parse(JSON.stringify(notifications.value[index]))
      
      // Apply optimistic update
      notifications.value[index] = {
        ...notifications.value[index],
        status: 'read',
        updated_at: new Date().toISOString()
      }
    }
    
    try {
      const { notifications: notificationsApi } = useApi()
      const response = await notificationsApi.markAsRead(interactionId)
      const updatedNotification = response.data.notification
      
      const processedNotification = {
        ...updatedNotification,
        user: updatedNotification.user || { name: 'Unknown User', id: 0 }
      }
      
      // Update with server response
      if (index !== -1) {
        notifications.value[index] = processedNotification
      }
      
      return processedNotification
    } catch (err) {
      // Rollback to original state if update fails
      if (index !== -1 && originalNotification) {
        notifications.value[index] = originalNotification
      }
      
      error.value = err.response?.data?.message || 'Failed to mark notification as read'
      throw err
    }
  }

  const markAllAsRead = async () => {
    error.value = null
    
    // Store original notifications for rollback if needed
    const originalNotifications = JSON.parse(JSON.stringify(notifications.value))
    
    // Apply optimistic update
    notifications.value.forEach(n => {
      if (n.status === 'unread') {
        n.status = 'read'
        n.updated_at = new Date().toISOString()
      }
      if (!n.user) {
        n.user = { name: 'Unknown User', id: 0 }
      }
    })
    
    try {
      const { notifications: notificationsApi } = useApi()
      const response = await notificationsApi.markAllAsRead()
      
      // If the API returns updated notifications, use them
      if (response?.data?.notifications) {
        const updatedNotifications = response.data.notifications
        notifications.value = updatedNotifications.map(notification => ({
          ...notification,
          user: notification.user || { name: 'Unknown User', id: 0 }
        }))
      }
      
      return notifications.value
    } catch (err) {
      // Rollback to original state if update fails
      notifications.value = originalNotifications
      
      error.value = err.response?.data?.message || 'Failed to mark all notifications as read'
      throw err
    }
  }

  const getMentionableUsers = async (taskId, forceRefresh = false) => {
    if (!taskId) {
      return []
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { api } = useApi()
      // Try with /api prefix first
      try {
        // Clear cache if forceRefresh is true
        if (forceRefresh) {
          // We would need to implement cache clearing here
          console.log(`Cache cleared for mentionable users of task ${taskId}`)
        }
        
        const response = await api.get(`/api/tasks/${taskId}/mentionable-users`)
        if (response.data && Array.isArray(response.data.users)) {
          return response.data.users
        } else {
          console.warn('Invalid response format for mentionable users:', response.data)
          // Continue to next attempt
        }
      } catch (apiPrefixErr) {
        // Log the error for debugging
        console.warn('Error fetching mentionable users with /api prefix:', apiPrefixErr.message || apiPrefixErr)
      }
      
      try {
        const response = await api.get(`/tasks/${taskId}/mentionable-users`)
        if (response.data && Array.isArray(response.data.users)) {
          return response.data.users
        }
      } catch (apiErr) {
        console.warn('Error fetching mentionable users without prefix:', apiErr.message || apiErr)
      }
      
      try {
        const { tasks: tasksApi } = useApi()
        const taskResponse = await tasksApi.get(taskId)
        
        if (taskResponse.data && taskResponse.data.task) {
          const task = taskResponse.data.task
          const users = []
          
          if (task.creator && typeof task.creator === 'object' && task.creator.id) {
            users.push(task.creator)
          }
          
          if (task.assigned_users && Array.isArray(task.assigned_users)) {
            task.assigned_users.forEach(user => {
              if (user && typeof user === 'object' && user.id && !users.some(u => u.id === user.id)) {
                users.push(user)
              }
            })
          }
          
          try {
            const { auth: authApi } = useApi()
            const userResponse = await authApi.getUser()
            if (userResponse.data && userResponse.data.user) {
              const currentUser = userResponse.data.user
              if (currentUser && typeof currentUser === 'object' && currentUser.id && 
                  !users.some(u => u.id === currentUser.id)) {
                users.push(currentUser)
              }
            }
          } catch (userErr) {
            console.warn('Error fetching current user:', userErr.message || userErr)
          }
          
          return users
        }
      } catch (fallbackErr) {
        console.warn('Error using fallback method for mentionable users:', fallbackErr.message || fallbackErr)
      }
      
      error.value = 'Failed to fetch mentionable users'
      return []
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch mentionable users'
      return []
    } finally {
      loading.value = false
    }
  }

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => n.status === 'unread')
  })

  const unreadCount = computed(() => {
    return unreadNotifications.value.length
  })

  const pendingInvitations = computed(() => {
    return invitations.value.filter(i => i.status === 'pending')
  })

  return {
    // State
    comments,
    invitations,
    notifications,
    loading,
    error,

    // Comments
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    refreshComments,

    // Invitations
    fetchPendingInvitations,
    sendInvitation,
    acceptInvitation,
    declineInvitation,

    // Notifications
    fetchNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,

    // Utilities
    getMentionableUsers,

    // Computed
    unreadNotifications,
    unreadCount,
    pendingInvitations,
  }
})
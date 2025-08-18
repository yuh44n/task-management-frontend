import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

export const useInteractionsStore = defineStore('interactions', () => {
  const comments = ref([])
  const invitations = ref([])
  const notifications = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Comments
  const fetchComments = async (taskId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/tasks/${taskId}/comments`)
      // Process comments to ensure user property exists
      const rawComments = response.data.comments.data || response.data.comments || []
      comments.value = rawComments.map(comment => ({
        ...comment,
        user: comment.user || { name: 'Unknown User', id: 0 }
      }))
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch comments'
      console.error('Error fetching comments:', err)
      comments.value = [] // Reset to empty array on error
      throw err
    } finally {
      loading.value = false
    }
  }

  const addComment = async (taskId, commentData) => {
    error.value = null
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, commentData)
      const newComment = response.data.comment
      // Ensure user property exists
      if (!newComment.user) {
        newComment.user = { name: 'Unknown User', id: 0 }
      }
      
      // Handle replies differently than top-level comments
      if (commentData.parent_id) {
        // This is a reply - find the parent comment and add this as a reply
        const parentIndex = comments.value.findIndex(c => c.id === commentData.parent_id)
        if (parentIndex !== -1) {
          // Initialize replies array if it doesn't exist
          if (!comments.value[parentIndex].replies) {
            comments.value[parentIndex].replies = []
          }
          // Add the new reply to the parent's replies
          comments.value[parentIndex].replies.push(newComment)
          
          // Note: The visibility of replies is managed by the component
        } else {
          console.error('Parent comment not found for reply')
        }
      } else {
        // This is a top-level comment - add it to the beginning of the comments array
        comments.value.unshift(newComment)
      }
      
      return newComment
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add comment'
      console.error('Error adding comment:', err)
      throw err
    }
  }

  const updateComment = async (interactionId, commentData) => {
    error.value = null
    try {
      const response = await api.put(`/interactions/${interactionId}/comment`, commentData)
      const updatedComment = response.data.comment
      // Ensure user property exists
      if (!updatedComment.user) {
        // Try to preserve the existing user data if available
        const existingComment = comments.value.find(c => c.id === interactionId)
        updatedComment.user = existingComment?.user || { name: 'Unknown User', id: 0 }
      }
      const index = comments.value.findIndex(c => c.id === interactionId)
      if (index !== -1) {
        comments.value[index] = updatedComment
      }
      return updatedComment
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update comment'
      console.error('Error updating comment:', err)
      throw err
    }
  }

  const deleteComment = async (interactionId) => {
    error.value = null
    try {
      await api.delete(`/interactions/${interactionId}/comment`)
      const index = comments.value.findIndex(c => c.id === interactionId)
      if (index !== -1) {
        comments.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete comment'
      throw err
    }
  }

  // Refresh comments to get latest data including attachments
  const refreshComments = async (taskId) => {
    await fetchComments(taskId)
  }

  // Invitations
  const fetchPendingInvitations = async () => {
    loading.value = true
    error.value = null
    try {
      const { invitations: invitationsApi } = useApi()
      const response = await invitationsApi.getPending()
      // Process invitations to ensure user property exists
      const rawInvitations = response.data.invitations || []
      invitations.value = rawInvitations.map(invitation => ({
        ...invitation,
        user: invitation.user || { name: 'Unknown User', id: 0 }
      }))
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch invitations'
      console.error('Error fetching invitations:', err)
      invitations.value = [] // Reset to empty array on error
      throw err
    } finally {
      loading.value = false
    }
  }

  const sendInvitation = async (taskId, invitationData) => {
    error.value = null
    try {
      const response = await api.post(`/tasks/${taskId}/invitations`, invitationData)
      return response.data.invitation
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send invitation'
      throw err
    }
  }

  const acceptInvitation = async (interactionId) => {
    error.value = null
    console.log('Accepting invitation with ID:', interactionId)
    try {
      // Check if the interactionId exists in our notifications or invitations
      const notificationExists = notifications.value.some(n => n.id === interactionId || n.metadata?.invitation_id === interactionId)
      const invitationExists = invitations.value.some(i => i.id === interactionId)
      console.log('Notification exists:', notificationExists)
      console.log('Invitation exists:', invitationExists)
      
      const response = await api.post(`/interactions/${interactionId}/accept`)
      console.log('Invitation acceptance API response:', response.data)
      
      // Remove from pending invitations list if it exists there
      const index = invitations.value.findIndex(i => i.id === interactionId)
      if (index !== -1) {
        console.log('Removing invitation from invitations list')
        invitations.value.splice(index, 1)
      }
      
      // Also remove from notifications list if it exists there
      // First try by direct ID match
      let notificationIndex = notifications.value.findIndex(n => n.id === interactionId)
      if (notificationIndex !== -1) {
        console.log('Removing notification by direct ID match')
        notifications.value.splice(notificationIndex, 1)
      } else {
        // Then try by invitation_id in metadata
        notificationIndex = notifications.value.findIndex(n => n.metadata?.invitation_id === interactionId)
        if (notificationIndex !== -1) {
          console.log('Removing notification by invitation_id in metadata')
          notifications.value.splice(notificationIndex, 1)
        }
      }
      
      return response.data.invitation
    } catch (err) {
      console.error('Error accepting invitation:', err.response?.data || err)
      error.value = err.response?.data?.message || 'Failed to accept invitation'
      throw err
    }
  }

  const declineInvitation = async (interactionId) => {
    error.value = null
    console.log('Declining invitation with ID:', interactionId)
    try {
      // Check if the interactionId exists in our notifications or invitations
      const notificationExists = notifications.value.some(n => n.id === interactionId || n.metadata?.invitation_id === interactionId)
      const invitationExists = invitations.value.some(i => i.id === interactionId)
      console.log('Notification exists:', notificationExists)
      console.log('Invitation exists:', invitationExists)
      
      const response = await api.post(`/interactions/${interactionId}/decline`)
      console.log('Invitation decline API response:', response.data)
      
      // Remove from pending invitations list if it exists there
      const index = invitations.value.findIndex(i => i.id === interactionId)
      if (index !== -1) {
        console.log('Removing invitation from invitations list')
        invitations.value.splice(index, 1)
      }
      
      // Also remove from notifications list if it exists there
      // First try by direct ID match
      let notificationIndex = notifications.value.findIndex(n => n.id === interactionId)
      if (notificationIndex !== -1) {
        console.log('Removing notification by direct ID match')
        notifications.value.splice(notificationIndex, 1)
      } else {
        // Then try by invitation_id in metadata
        notificationIndex = notifications.value.findIndex(n => n.metadata?.invitation_id === interactionId)
        if (notificationIndex !== -1) {
          console.log('Removing notification by invitation_id in metadata')
          notifications.value.splice(notificationIndex, 1)
        }
      }
      
      return response.data.invitation
    } catch (err) {
      console.error('Error declining invitation:', err.response?.data || err)
      error.value = err.response?.data?.message || 'Failed to decline invitation'
      throw err
    }
  }

  // Notifications
  const fetchNotifications = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/user/notifications', { params })
      notifications.value = response.data.notifications.data || response.data.notifications
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch notifications'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getUnreadCount = async () => {
    try {
      const response = await api.get('/user/notifications/unread-count')
      return response.data.count
    } catch (err) {
      console.error('Failed to get unread count:', err)
      return 0
    }
  }

  const markAsRead = async (interactionId) => {
    error.value = null
    try {
      const response = await api.patch(`/interactions/${interactionId}/read`)
      const updatedNotification = response.data.notification
      const index = notifications.value.findIndex(n => n.id === interactionId)
      if (index !== -1) {
        notifications.value[index] = updatedNotification
      }
      return updatedNotification
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to mark notification as read'
      throw err
    }
  }

  const markAllAsRead = async () => {
    error.value = null
    try {
      const { notifications: notificationsApi } = useApi()
      await notificationsApi.markAllAsRead()
      notifications.value.forEach(n => {
        if (n.status === 'unread') {
          n.status = 'read'
        }
      })
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to mark all notifications as read'
      throw err
    }
  }

  // Mentionable users
  const getMentionableUsers = async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/mentionable-users`)
      return response.data.users
    } catch (err) {
      console.error('Failed to get mentionable users:', err)
      return []
    }
  }

  // Computed properties
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => n.status === 'unread')
  })

  const unreadCount = computed(() => {
    return unreadNotifications.value.length
  })

  const pendingInvitations = computed(() => {
    return invitations.value.filter(i => i.status === 'pending')
  })

  // Reminders - All reminder-related functionality has been removed

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
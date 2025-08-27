<template>
  <div class="notifications-panel">

    <div class="notifications-toggle">
      <button @click="togglePanel" class="btn-icon notifications-btn">
        <i class="fas fa-bell" :class="{'notification-icon-bell': unreadCount > 0}"></i>
        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
      </button>
    </div>


    <div v-if="isOpen" class="notifications-dropdown">
      <div class="notifications-header">
        <h3>Notifications</h3>
        <div class="header-actions">
          <button
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="btn-link"
          >
            Mark all as read
          </button>
          <button @click="togglePanel" class="btn-icon">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>


      <div class="notifications-list">
        <div v-if="interactionsStore.loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Loading notifications...
        </div>

        <div v-else-if="notifications.length === 0" class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications</p>
        </div>

        <div v-else class="notification-items">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': notification.status === 'unread' }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <i :class="getNotificationIcon(notification)"></i>
            </div>
            <div class="notification-content">
              <div class="notification-title">
                {{ notification.metadata?.title || 'Notification' }}
              </div>
              <div class="notification-message">
                {{ notification.content }}
              </div>
              <div class="notification-time">
                {{ formatTimeAgo(notification.created_at) }}
              </div>
            </div>
            <div class="notification-actions">
              <button
                v-if="notification.status === 'unread'"
                @click.stop="markAsRead(notification.id)"
                class="btn-icon"
                title="Mark as read"
              >
                <i class="fas fa-check"></i>
              </button>
            </div>
          </div>
        </div>
      </div>


      <div v-if="notifications.length > 0" class="notifications-footer">
        <button @click="viewAllNotifications" class="btn-link">
          View all notifications
        </button>
      </div>
    </div>


    <div v-if="showFullView" class="modal-overlay" @click="closeFullView">
      <div class="modal-content notifications-modal" @click.stop>
        <div class="modal-header">
          <h3>All Notifications</h3>
          <div class="modal-actions">
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="btn btn-sm"
            >
              Mark all as read
            </button>
            <button @click="closeFullView" class="btn-icon">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="notifications-filters">
            <select v-model="filterType" class="form-select">
              <option value="">All notifications</option>
              <option value="task_assigned">Task assignments</option>
              <option value="task_status_changed">Status changes</option>
              <option value="task_comment">Comments</option>
              <option value="comment_mention">Mentions</option>
              <option value="task_invitation">Invitations</option>
              <option value="invitation_accepted">Accepted invitations</option>
              <option value="invitation_declined">Declined invitations</option>
            </select>
          </div>
          
          <div class="full-notifications-list">
            <div v-if="interactionsStore.loading" class="loading">
              <i class="fas fa-spinner fa-spin"></i> Loading notifications...
            </div>

            <div v-else-if="filteredNotifications.length === 0" class="no-notifications">
              <i class="fas fa-bell-slash"></i>
              <p>No notifications found</p>
            </div>

            <div v-else class="notification-items">
              <div
                v-for="notification in filteredNotifications"
                :key="notification.id"
                class="notification-item"
                :class="{ 'unread': notification.status === 'unread' }"
                @click="handleNotificationClick(notification)"
              >
                <div class="notification-icon">
                  <i :class="getNotificationIcon(notification)"></i>
                </div>
                <div class="notification-content">
                  <div class="notification-title">
                    {{ notification.metadata?.title || 'Notification' }}
                  </div>
                  <div class="notification-message">
                    {{ notification.content }}
                  </div>
                  <div class="notification-time">
                    {{ formatDate(notification.created_at) }}
                  </div>
                </div>
                <div class="notification-actions">
                  <button
                    v-if="notification.status === 'unread'"
                    @click.stop="markAsRead(notification.id)"
                    class="btn-icon"
                    title="Mark as read"
                  >
                    <i class="fas fa-check"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInteractionsStore } from '@/stores/interactions'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'

const interactionsStore = useInteractionsStore()
const router = useRouter()
const tasksStore = useTasksStore()

const isOpen = ref(false)
const showFullView = ref(false)
const filterType = ref('')


const notifications = computed(() => {
  return interactionsStore.notifications.slice(0, 5) // Show only first 5 in dropdown
})

const filteredNotifications = computed(() => {
  if (!filterType.value) return interactionsStore.notifications
  return interactionsStore.notifications.filter(n => 
    n.metadata?.notification_type === filterType.value
  )
})

const unreadCount = computed(() => {
  return interactionsStore.unreadCount
})


const togglePanel = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadNotifications()
  }
}

const closeFullView = () => {
  showFullView.value = false
  filterType.value = ''
}

const viewAllNotifications = () => {
  showFullView.value = true
  loadNotifications()
}

const loadNotifications = async () => {
  try {
    await interactionsStore.fetchNotifications()
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
}

const markAsRead = async (notificationId) => {
  try {
    await interactionsStore.markAsRead(notificationId)
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await interactionsStore.markAllAsRead()
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}

const handleNotificationClick = async (notification) => {
  // Mark as read if unread
  if (notification.status === 'unread') {
    markAsRead(notification.id)
  }

  // Navigate based on notification type
  const type = notification.metadata?.notification_type
  
  if (type === 'task_invitation') {
    // For task invitations, show accept/decline options
    // Get the correct invitation ID from the metadata
    // The notification contains the invitation_id in its metadata
    const invitationId = notification.metadata?.invitation_id || notification.id
    console.log('Processing invitation with ID:', invitationId)
    
    // Confirm with the user if they want to accept the invitation
    if (confirm('Do you want to accept this invitation to collaborate on the task?')) {
      try {
        console.log('Accepting invitation with ID:', invitationId)
        const result = await interactionsStore.acceptInvitation(invitationId)
        console.log('Invitation acceptance result:', result)
        alert('Invitation accepted successfully!')
        // Refresh tasks to show new assignment
        await tasksStore.fetchTasks()
        // Navigate to collaborations page
        router.push('/collaborations')
      } catch (error) {
        console.error('Failed to accept invitation:', error)
        alert('Failed to accept invitation. Please try again.')
        // Still navigate to the task
        router.push(`/dashboard?task=${notification.task_id}`)
      }
    } else if (confirm('Do you want to decline this invitation?')) {
      try {
        console.log('Declining invitation with ID:', invitationId)
        const result = await interactionsStore.declineInvitation(invitationId)
        console.log('Invitation decline result:', result)
        alert('Invitation declined.')
      } catch (error) {
        console.error('Failed to decline invitation:', error)
        alert('Failed to decline invitation. Please try again.')
      }
    } else {
      // Just navigate to the task without accepting/declining
      router.push(`/dashboard?task=${notification.task_id}`)
    }
  } else if (type === 'task_assigned' || type === 'task_status_changed' || type === 'task_comment' || 
             type === 'invitation_accepted' || type === 'invitation_declined') {
    // Navigate to the task
    router.push(`/dashboard?task=${notification.task_id}`)
  }
  
  // Close panels
  isOpen.value = false
  showFullView.value = false
}

const getNotificationIcon = (notification) => {
  const type = notification.metadata?.notification_type
  switch (type) {
    case 'task_assigned':
      return 'fas fa-user-plus'
    case 'task_status_changed':
      return 'fas fa-edit'
    case 'task_comment':
      return 'fas fa-comment'
    case 'comment_mention':
      return 'fas fa-at'
    case 'task_invitation':
      return 'fas fa-envelope'
    case 'invitation_accepted':
      return 'fas fa-check-circle'
    case 'invitation_declined':
      return 'fas fa-times-circle'
    // Reminder case removed
    default:
      return 'fas fa-bell'
  }
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return notificationDate.toLocaleDateString()
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}


const handleClickOutside = (event) => {
  if (!event.target.closest('.notifications-panel')) {
    isOpen.value = false
  }
}


onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Load initial unread count
  interactionsStore.getUnreadCount()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notifications-panel {
  position: relative;
}

.notifications-toggle {
  position: relative;
}

.notifications-btn {
  position: relative;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
  font-size: 18px;
  color: #666;
}

.notifications-btn:hover {
  background-color: #f0f4ff;
  color: #7494ec;
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.notification-icon-bell {
  animation: bell-shake 2s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes bell-shake {
  0%, 100% { transform: rotate(0); }
  5%, 15% { transform: rotate(10deg); }
  10%, 20% { transform: rotate(-10deg); }
  25% { transform: rotate(0); }
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
}

.notifications-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 350px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 500px;
  overflow: hidden;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.notifications-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-items {
  gap: 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f4ff;
}

.notification-item.unread:hover {
  background-color: #e3f2fd;
}

.notification-icon {
  margin-right: 12px;
  margin-top: 2px;
  width: 20px;
  text-align: center;
  color: #7494ec;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-message {
  color: #666;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 11px;
  color: #999;
}

.notification-actions {
  margin-left: 10px;
}

.notifications-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  text-align: center;
  background: #f8f9fa;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-notifications {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-notifications i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ddd;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.notifications-modal {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.notifications-filters {
  margin-bottom: 20px;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.full-notifications-list {
  max-height: 50vh;
  overflow-y: auto;
}

.btn-link {
  background: none;
  border: none;
  color: #7494ec;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-icon {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #f0f4ff;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}
</style>
<template>
  <div class="task-invitations">
    <div class="invitations-header">
      <h3>Collaboration</h3>
      <button @click="showInviteForm = true" class="btn btn-sm">
        <i class="fas fa-user-plus"></i> Invite User
      </button>
    </div>

    <!-- Invite Form Modal -->
    <div v-if="showInviteForm" class="modal-overlay" @click="closeInviteForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Invite User to Collaborate</h3>
          <button @click="closeInviteForm" class="btn-icon">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select User</label>
            <select v-model="inviteForm.invited_user_id" class="form-select">
              <option value="">Choose a user...</option>
              <option
                v-for="user in availableUsers"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="inviteForm.role" class="form-select">
              <option value="assignee">Assignee</option>
              <option value="collaborator">Collaborator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div class="form-group">
            <label>Message (Optional)</label>
            <textarea
              v-model="inviteForm.message"
              class="form-textarea"
              placeholder="Add a personal message..."
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeInviteForm" class="btn btn-secondary">
            Cancel
          </button>
          <button
            @click="sendInvitation"
            :disabled="!inviteForm.invited_user_id || sending"
            class="btn"
          >
            <i v-if="sending" class="fas fa-spinner fa-spin"></i>
            <span v-else>Send Invitation</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pending Invitations -->
    <div v-if="pendingInvitations.length > 0" class="pending-invitations">
      <h4>Pending Invitations</h4>
      <div class="invitation-list">
        <div
          v-for="invitation in pendingInvitations"
          :key="invitation.id"
          class="invitation-item"
        >
          <div class="invitation-info">
            <div class="user-info">
              <div class="user-avatar-small">
                {{ getUserInitials(invitation.user?.name || 'Unknown') }}
              </div>
              <div>
                <div class="user-name">{{ invitation.user?.name || 'Unknown User' }}</div>
                <div class="invitation-details">
                  Role: <span class="role-badge">{{ invitation.role }}</span>
                  <span class="invitation-date">{{ formatDate(invitation.created_at) }}</span>
                </div>
              </div>
            </div>
            <div class="invitation-message" v-if="invitation.content">
              <p>{{ invitation.content }}</p>
            </div>
          </div>
          <div class="invitation-actions">
            <button
              @click="acceptInvitation(invitation.id)"
              class="btn btn-sm btn-success"
            >
              <i class="fas fa-check"></i> Accept
            </button>
            <button
              @click="declineInvitation(invitation.id)"
              class="btn btn-sm btn-danger"
            >
              <i class="fas fa-times"></i> Decline
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Collaborators -->
    <div class="collaborators-section">
      <h4>Current Collaborators</h4>
      <div class="collaborators-list">
        <div
          v-for="assignment in taskAssignments"
          :key="assignment.id || Math.random()"
          class="collaborator-item"
        >
          <div class="user-info">
            <div class="user-avatar-small">
              {{ getUserInitials(assignment.user?.name || 'Unknown') }}
            </div>
            <div>
              <div class="user-name">{{ assignment.user?.name || 'Unknown User' }}</div>
              <div class="role-badge">{{ assignment.role || assignment.pivot?.role || 'Collaborator' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Collaborators Message -->
    <div v-if="taskAssignments.length === 0" class="no-collaborators">
      <i class="fas fa-users"></i>
      <p>No collaborators yet. Invite users to start collaborating!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useInteractionsStore } from '@/stores/interactions'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/counter'
import { toast } from '@/composables/useToast'

const props = defineProps({
  taskId: {
    type: [Number, String],
    required: true
  }
})

const interactionsStore = useInteractionsStore()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const showInviteForm = ref(false)
const sending = ref(false)
const availableUsers = ref([])

const inviteForm = ref({
  invited_user_id: '',
  role: 'assignee',
  message: ''
})

// Computed properties
const pendingInvitations = computed(() => {
  return interactionsStore.pendingInvitations.filter(inv => inv.task_id == props.taskId)
})

const taskAssignments = computed(() => {
  const task = tasksStore.tasks.find(t => t.id == props.taskId)
  if (!task) return []
  
  // Handle case where assigned_users might be null or undefined
  if (!task.assigned_users) {
    console.warn('Task has no assigned_users property:', task)
    return []
  }
  
  console.log('Task assigned_users:', task.assigned_users)
  
  // Ensure each assignment has a valid user property
  return task.assigned_users.map(assignment => {
    // If assignment is null or undefined, create a placeholder
    if (!assignment) {
      console.warn('Invalid assignment in task.assigned_users')
      return {
        id: Math.random().toString(),
        role: 'unknown',
        user: { name: 'Unknown User', id: 0 }
      }
    }
    
    // If assignment is directly a user object (no pivot/role info)
    if (assignment.name && !assignment.user) {
      return {
        id: assignment.id || Math.random().toString(),
        role: 'Collaborator',
        user: { 
          name: assignment.name, 
          id: assignment.id || 0 
        }
      }
    }
    
    // Check if user property exists and is valid
    if (!assignment.user || typeof assignment.user !== 'object') {
      console.warn('Assignment missing or invalid user property:', assignment)
      return {
        ...assignment,
        user: { 
          name: 'Unknown User', 
          id: assignment.user_id || assignment.pivot?.user_id || 0 
        }
      }
    }
    
    // Check if user has a name property
    if (!assignment.user.name) {
      console.warn('User missing name property:', assignment.user)
      return {
        ...assignment,
        user: { 
          ...assignment.user,
          name: 'Unknown User'
        }
      }
    }
    
    return assignment
  })
})

// Debug computed property to check what's happening with collaborators
const debugCollaborators = computed(() => {
  const assignments = taskAssignments.value
  console.log('Current collaborators:', assignments)
  return assignments
})

const isCollaborationTask = computed(() => {
  const task = tasksStore.tasks.find(t => t.id == props.taskId)
  if (!task) return false
  return task.title && task.title.startsWith('Collaboration on:')
})

// Methods
const loadAvailableUsers = async () => {
  try {
    const response = await tasksStore.getUsers()
    availableUsers.value = response.users.filter(user => 
      user.id !== authStore.user?.id && 
      !taskAssignments.value.some(assignment => assignment.user_id === user.id)
    )
  } catch (error) {
    toast.error('Failed to load available users')
  }
}

// Watch for changes in taskId
watch(() => props.taskId, async (newTaskId) => {
  if (newTaskId) {
    // Force refresh tasks to ensure we have the latest data
    await tasksStore.fetchTasks()
  }
})

// Initialize component
onMounted(async () => {
  if (props.taskId) {
    await tasksStore.fetchTasks()
    await loadAvailableUsers()
    await interactionsStore.fetchPendingInvitations()
  }
})

const sendInvitation = async () => {
  if (!inviteForm.value.invited_user_id) return
  
  sending.value = true
  try {
    await interactionsStore.sendInvitation(props.taskId, inviteForm.value)
    closeInviteForm()
    // Refresh pending invitations with force refresh
    await interactionsStore.fetchPendingInvitations(true)
  } catch (error) {
    // Error handling is now done in the store with toast notifications
  } finally {
    sending.value = false
  }
}

const acceptInvitation = async (invitationId) => {
  try {
    await interactionsStore.acceptInvitation(invitationId)
    // Refresh tasks to show new assignment
    await tasksStore.fetchTasks()
  } catch (error) {
    // Error handling is now done in the store with toast notifications
  }
}

const declineInvitation = async (invitationId) => {
  try {
    await interactionsStore.declineInvitation(invitationId)
  } catch (error) {
    // Error handling is now done in the store with toast notifications
  }
}

const closeInviteForm = () => {
  showInviteForm.value = false
  inviteForm.value = {
    invited_user_id: '',
    role: 'assignee',
    message: ''
  }
}

const getUserInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(async () => {
  try {
    await loadAvailableUsers()
    await interactionsStore.fetchPendingInvitations(true) // Force refresh on initial load
  } catch (error) {
    // Error handling is now done in the store with toast notifications
  }
})

watch(() => props.taskId, async (newTaskId) => {
  if (newTaskId) {
    try {
      await loadAvailableUsers()
      await interactionsStore.fetchPendingInvitations(true) // Force refresh when task changes
    } catch (error) {
      // Error handling is now done in the store with toast notifications
    }
  }
})
</script>

<style scoped>
.task-invitations {
  margin-top: 20px;
}

.invitations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.invitations-header h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

/* Form Styles */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

/* Invitation List Styles */
.pending-invitations {
  margin-bottom: 30px;
}

.pending-invitations h4 {
  color: #333;
  font-size: 16px;
  margin-bottom: 15px;
}

.invitation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invitation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  background: #f8fbff;
}

.invitation-info {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  background: #7494ec;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.invitation-details {
  font-size: 12px;
  color: #666;
  margin-left: 42px;
}

.role-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.invitation-date {
  margin-left: 10px;
  color: #999;
}

.invitation-message {
  margin-left: 42px;
  font-size: 13px;
  color: #666;
  font-style: italic;
}

.invitation-actions {
  display: flex;
  gap: 8px;
}

/* Collaborators Section */
.collaborators-section {
  margin-top: 30px;
}

.collaborators-section h4 {
  color: #333;
  font-size: 16px;
  margin-bottom: 15px;
}

.collaborators-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
}

.collaborator-item .user-info {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  width: 100%;
}

/* No Collaborators */
.no-collaborators {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-collaborators i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ddd;
}

/* Button Styles */
.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
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
</style>
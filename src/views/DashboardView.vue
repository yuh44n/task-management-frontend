<template>
  <div class="dashboard-layout">
    <Sidebar />
    
    <div class="main-content">
      <!-- Header -->
      <div class="content-header">
        <h1>Dashboard</h1>
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <span>{{ authStore.user?.name }}</span>
          <NotificationsPanel />
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-list"></i>
          </div>
          <div class="stat-number">{{ tasksStore.stats.total }}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon completed">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-number">{{ tasksStore.stats.completed }}</div>
          <div class="stat-label">Completed</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon progress">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-number">{{ tasksStore.stats.in_progress }}</div>
          <div class="stat-label">In Progress</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon overdue">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-number">{{ tasksStore.stats.overdue }}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
      
      <!-- Filters Section -->
      <div class="tasks-container" style="margin-bottom: 20px;">
        <div class="tasks-header">
          <h2>Filter Tasks</h2>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="filters.status" @change="applyFilters">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" v-model="filters.priority" @change="applyFilters">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Search</label>
              <input 
                type="text" 
                class="form-input"
                v-model="filters.search"
                @input="applyFilters"
                placeholder="Search tasks..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks List -->
      <div class="tasks-container">
        <div class="tasks-header">
          <h2>Tasks ({{ tasksStore.tasks.length }})</h2>
          <button class="add-task-btn" @click="showAddTaskModal = true">
            <i class="fas fa-plus"></i>
            Add New Task
          </button>
        </div>
        
        <div class="tasks-list" v-if="!tasksStore.loading">
          <div 
            v-for="task in tasksStore.tasks" 
            :key="task.id"
            class="task-card"
          >
            <!-- Task Header with Checkbox and Collab Button -->
            <div style="display: flex; align-items: start; gap: 15px; margin-bottom: 12px;">
              <button
                @click.stop="toggleTaskStatus(task)"
                :disabled="taskUpdating === task.id"
                class="task-checkbox flex-shrink-0"
                :class="{ 'completed': task.status === 'completed' }"
                style="margin-top: 3px;"
                title="Mark as completed"
              >
                <i v-if="taskUpdating === task.id" class="fas fa-spinner fa-spin" style="font-size: 14px;"></i>
                <i v-else-if="task.status === 'completed'" class="fas fa-check" style="font-size: 14px;"></i>
              </button>
              
              <div class="flex-1" @click="openTaskDetails(task)" style="cursor: pointer;">
                <div class="task-title-row">
                  <div class="task-title" :class="{ 'line-through text-gray-500': task.status === 'completed' }">
                    {{ task.title }}
                  </div>
                  <button
                    v-if="!task.title.startsWith('Collaboration on:')"
                    @click.stop="startCollaboration(task)"
                    class="collab-btn"
                    title="Start Collaboration"
                  >
                    <i class="fas fa-user-friends"></i>
                  </button>
                </div>
                <div class="task-description" :class="{ 'line-through text-gray-400': task.status === 'completed' }">
                  {{ task.description }}
                </div>
              </div>
            </div>
            
            <div class="task-meta">
              <span class="task-status" :class="task.status">
                {{ formatStatus(task.status) }}
              </span>
              <span class="task-priority" :class="task.priority">
                {{ task.priority }}
              </span>
              <span class="task-date">
                Due: {{ formatDate(task.due_date) }}
              </span>
              <div style="display: flex; gap: 10px;">
                <button 
                  class="task-action-btn edit-btn" 
                  @click.stop="editTask(task)"
                  title="Edit Task"
                >
                  <i class="fas fa-edit"></i>
                  <span>Edit</span>
                </button>
                <button 
                  class="task-action-btn delete-btn" 
                  @click.stop="deleteTask(task.id)"
                  title="Delete Task"
                >
                  <i class="fas fa-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
            </div>
            
            <!-- Assigned Users -->
            <div v-if="task.assigned_users && task.assigned_users.length > 0" style="margin-top: 10px;">
              <small style="color: #666;">Assigned to: </small>
              <span 
                v-for="user in task.assigned_users" 
                :key="user.id"
                style="display: inline-block; background: #f0f4ff; color: #7494ec; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px;"
              >
                {{ user.name }}
              </span>
            </div>
          </div>
          
          <div v-if="tasksStore.tasks.length === 0" class="loading">
            No tasks found. Create your first task!
          </div>
        </div>
        
        <div v-else class="loading">
          Loading tasks...
        </div>
      </div>
    </div>
    
    <!-- Add Task Modal -->
    <TaskModal 
      v-if="showAddTaskModal"
      @close="showAddTaskModal = false"
      @task-created="handleTaskCreated"
    />
    
    <!-- Edit Task Modal -->
    <TaskModal 
      v-if="showEditTaskModal"
      :task="selectedTask"
      @close="showEditTaskModal = false"
      @task-updated="handleTaskUpdated"
    />

        <!-- Task Details Modal -->
        <div v-if="selectedTask && showTaskModal" class="modal-overlay" @click="closeTaskModal">
          <div class="modal-content task-details-modal" @click.stop>
            <div class="modal-header">
              <h3>Task Details</h3>
              <button @click="closeTaskModal" class="btn-icon">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="task-details">
                <div class="task-header">
                  <h4>{{ selectedTask.title }}</h4>
                  <div class="task-meta">
                    <span class="priority-badge" :class="selectedTask.priority">
                      {{ selectedTask.priority }}
                    </span>
                    <span class="status-badge" :class="selectedTask.status">
                      {{ selectedTask.status }}
                    </span>
                  </div>
                </div>
                
                <div class="task-description">
                  <h5>Description</h5>
                  <p>{{ selectedTask.description || 'No description provided.' }}</p>
                </div>
                
                <div class="task-info">
                  <div class="info-item">
                    <strong>Created by:</strong> {{ selectedTask.creator?.name }}
                  </div>
                  <div class="info-item">
                    <strong>Due date:</strong> {{ selectedTask.due_date ? formatDate(selectedTask.due_date) : 'No due date' }}
                  </div>
                  <div class="info-item">
                    <strong>Created:</strong> {{ formatDate(selectedTask.created_at) }}
                  </div>
                </div>
                
                <div class="task-assignees" v-if="selectedTask.assigned_users && selectedTask.assigned_users.length > 0">
                  <h5>Assigned to:</h5>
                  <div class="assignees-list">
                    <div
                      v-for="assignment in selectedTask.assigned_users"
                      :key="assignment.id"
                      class="assignee-item"
                    >
                      <div class="user-avatar-small">
                        {{ getUserInitials(assignment.user.name) }}
                      </div>
                      <span>{{ assignment.user.name }}</span>
                      <span class="role-badge">{{ assignment.role }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Task Attachments -->
              <div class="task-attachments">
                <h5>Attachments</h5>
                <FileAttachments :taskId="selectedTask.id" />
              </div>
              
              <!-- Collaboration Components -->
              <div class="collaboration-section">
                <TaskComments :taskId="selectedTask.id" />
                <TaskInvitations :taskId="selectedTask.id" />
              </div>
            </div>
          </div>
        </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/counter'
import { useTasksStore } from '@/stores/tasks'
import { useApi } from '@/composables/useApi'
import Sidebar from '@/components/Sidebar.vue'
import TaskModal from '@/components/TaskModal.vue'
import TaskComments from '@/components/TaskComments.vue'
import TaskInvitations from '@/components/TaskInvitations.vue'
import NotificationsPanel from '@/components/NotificationsPanel.vue'
import FileAttachments from '@/components/FileAttachments.vue'

const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

const showAddTaskModal = ref(false)
const showEditTaskModal = ref(false)
const showTaskModal = ref(false)
const selectedTask = ref(null)
const taskUpdating = ref(null)

const filters = reactive({
  status: '',
  priority: '',
  search: ''
})

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const handleTaskCreated = () => {
  showAddTaskModal.value = false
  tasksStore.fetchTasks()
}

const handleTaskUpdated = async () => {
  showEditTaskModal.value = false
  
  // If we have a selectedTask, refresh its data using the optimized fetchTaskById method
  if (selectedTask.value && selectedTask.value.id) {
    try {
      const result = await tasksStore.fetchTaskById(selectedTask.value.id, true) // Force refresh
      if (result.success && result.task) {
        selectedTask.value = result.task
        console.log('Task updated successfully')
      }
    } catch (error) {
      console.error('Error refreshing task details: ' + (error.response?.data?.message || 'Unknown error'))
    }
  }
}

const editTask = (task) => {
  // Create a copy of the task to avoid affecting the task details modal
  const taskCopy = JSON.parse(JSON.stringify(task))
  selectedTask.value = taskCopy
  showEditTaskModal.value = true
  // Close the task details modal if it's open
  if (showTaskModal.value) {
    showTaskModal.value = false
  }
}

const deleteTask = async (taskId) => {
  if (confirm('Are you sure you want to delete this task?')) {
    await tasksStore.deleteTask(taskId)
  }
}

const toggleTaskStatus = async (task) => {
  taskUpdating.value = task.id
  try {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await tasksStore.updateTask(task.id, { status: newStatus })
    console.log(`Task marked as ${newStatus}`)
  } catch (err) {
    console.error('Failed to update task status: ' + (err.response?.data?.message || 'Unknown error'))
  } finally {
    taskUpdating.value = null
  }
}

const applyFilters = async () => {
  const activeFilters = {}
  if (filters.status) activeFilters.status = filters.status
  if (filters.priority) activeFilters.priority = filters.priority
  if (filters.search) activeFilters.search = filters.search
  
  try {
    await tasksStore.fetchTasks(activeFilters, true) // Force refresh
  } catch (error) {
    console.error('Error applying filters: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

const formatStatus = (status) => {
  if (!status) return ''
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const getUserInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const closeTaskModal = () => {
  selectedTask.value = null
  showTaskModal.value = false
}

const startCollaboration = async (task) => {
  try {
    // Create a new task with default values for collaboration
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 7); // Due date 7 days from now
    
    // First create the task without assignees
    const newTaskData = {
      title: `Collaboration on: ${task.title}`,
      description: `This is a collaboration based on the task: ${task.title}`,
      priority: task.priority || 'medium',
      status: 'pending',
      due_date: dueDate.toISOString().split('T')[0]
    };
    
    // Create the new task
    const result = await tasksStore.createTask(newTaskData);
    
    if (result.success) {
      // Now manually create a task interaction with collaborator role
      try {
        const taskId = result.data.task.id;
        
        // Get the API instances
        const { invitations: invitationsApi } = useApi();
        
        // Create an invitation for the current user as a collaborator
        const inviteResponse = await invitationsApi.create(taskId, {
          invited_user_id: authStore.user.id,
          role: 'collaborator',
          message: 'Self-assigned as collaborator'
        });
        
        // Auto-accept the invitation
        if (inviteResponse.data.success && inviteResponse.data.invitation && inviteResponse.data.invitation.id) {
          const interactionId = inviteResponse.data.invitation.id;
          await invitationsApi.accept(interactionId);
        }
      } catch (err) {
        console.error('Error creating collaborator assignment: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        // Continue with the process even if this part fails
      }
      
      // Delete the original task with optimistic UI update
      await tasksStore.deleteTask(task.id);
      
      // Force refresh tasks with cache clearing before navigating
      await tasksStore.fetchTasks({}, true);
      
      // Navigate to collaborations page
      router.push('/collaborations');
      console.log('Collaboration created successfully');
    } else {
      console.error('Failed to create collaboration: ' + result.error);
    }
  } catch (error) {
    console.error('Error creating collaboration: ' + (error.response?.data?.message || 'Unknown error'));
  }
}

const openTaskDetails = (task) => {
  selectedTask.value = task
  showTaskModal.value = true
}


onMounted(async () => {
  try {
    await tasksStore.fetchTasks({}, true) // Force refresh on initial load
  } catch (error) {
    console.error('Error loading tasks: ' + (error.response?.data?.message || 'Unknown error'))
  }
})
</script>

<style scoped>
/* Task Details Modal Styles */
.task-details-modal {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.collab-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-left: 10px;
}

.collab-btn:hover {
  background: #1976d2;
  color: white;
  transform: scale(1.1);
}

.task-details {
  margin-bottom: 30px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.task-header h4 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.task-meta {
  display: flex;
  gap: 10px;
}

.priority-badge, .status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.priority-badge.high {
  background: #fee;
  color: #e74c3c;
}

.priority-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.priority-badge.low {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.in_progress {
  background: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.task-description {
  margin-bottom: 20px;
}

.task-description h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.task-description p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.task-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 8px;
  color: #666;
}

.info-item strong {
  color: #333;
}

.task-assignees h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.task-attachments {
  margin-top: 20px;
  margin-bottom: 20px;
}

.task-attachments h5 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
}

.assignees-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.assignee-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 20px;
  font-size: 14px;
}

.user-avatar-small {
  width: 24px;
  height: 24px;
  background: #7494ec;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.role-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  text-transform: capitalize;
}

.collaboration-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
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
  max-width: 600px;
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
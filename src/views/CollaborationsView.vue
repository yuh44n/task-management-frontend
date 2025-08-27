<template>
<div class="dashboard-layout">
    <Sidebar />
    
    <div class="main-content">
      <div class="content-header">
        <h1>Collaborations</h1>
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <span>{{ authStore.user?.name }}</span>
          <NotificationsPanel />
        </div>
      </div>
      
      <div class="collaborations-view">
        <div class="page-header">
          <p>Tasks you're collaborating on with other users</p>
        </div>

        <div class="collaborations-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading collaborations...
      </div>

      <div v-else-if="collaborativeTasks.length === 0" class="no-collaborations">
        <i class="fas fa-users"></i>
        <p>You don't have any active collaborations yet.</p>
        <p>When you collaborate on tasks, they will appear here.</p>
      </div>

      <div v-else class="collaborations-list">
        <div 
          v-for="task in collaborativeTasks" 
          :key="task.id"
          class="collab-task-card"
        >
          <div class="collab-task-header">
            <div class="task-title-section">
              <h3 class="task-title">{{ task.title }}</h3>
              <span class="task-status" :class="task.status">
                {{ formatStatus(task.status) }}
              </span>
            </div>
            <div class="task-actions">
              <button 
                @click.prevent.stop="openTaskDetails(task)" 
                class="btn-icon" 
                title="View Details"
                :data-task-id="task.id"
              >
                <i class="fas fa-eye"></i>
              </button>
              <button 
                v-if="canEditTask(task)"
                @click.prevent.stop="editTask(task)" 
                class="btn-icon" 
                title="Edit Task"
                :data-task-id="task.id"
              >
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>

          <div class="task-description">{{ task.description }}</div>

          <div class="task-meta">
            <div class="task-meta-item">
              <i class="fas fa-calendar-alt"></i>
              <span>Due: {{ formatDate(task.due_date) }}</span>
            </div>
            <div class="task-meta-item">
              <i class="fas fa-flag"></i>
              <span class="task-priority" :class="task.priority">{{ task.priority }}</span>
            </div>
            <div class="task-meta-item">
              <i class="fas fa-user"></i>
              <span>Created by: {{ task.creator?.name || 'Unknown' }}</span>
            </div>
          </div>

          <div class="task-collaborators">
            <h4>Collaborators</h4>
            <div class="collaborators-list">
              <div 
                v-for="user in task.assigned_users" 
                :key="user.id"
                class="collaborator-item"
              >
                <div class="user-avatar-small">
                  {{ getUserInitials(user.name) }}
                </div>
                <div class="collaborator-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-role">{{ user.pivot?.role || 'Collaborator' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="task-activity">
            <h4>Recent Activity</h4>
            <div v-if="task.recent_comments && task.recent_comments.length > 0" class="activity-list">
              <div 
                v-for="comment in task.recent_comments" 
                :key="comment.id"
                class="activity-item"
              >
                <div class="activity-avatar">
                  {{ getUserInitials(comment.user?.name) }}
                </div>
                <div class="activity-content">
                  <div class="activity-header">
                    <span class="activity-user">{{ comment.user?.name }}</span>
                    <span class="activity-time">{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <div class="activity-text">{{ comment.content }}</div>
                </div>
              </div>
            </div>
            <div v-else class="no-activity">
              <p>No recent activity</p>
            </div>
          </div>

          <div class="task-footer">
            <button 
              @click.prevent.stop="openTaskDetails(task)" 
              class="btn-primary"
              :data-task-id="task.id"
            >
              <i class="fas fa-comments"></i> View Full Details
            </button>
            <button 
              v-if="canEditTask(task)"
              @click.prevent.stop="editTask(task)" 
              class="btn"
              :data-task-id="task.id"
            >
              <i class="fas fa-edit"></i> Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
      </div>

    <div v-if="showTaskDetails" class="modal-overlay" @click="closeTaskDetails">
      <div class="modal-content task-details-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedTask?.title || 'Task Details' }}</h2>
          <button @click="closeTaskDetails" class="btn-icon">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="loadingTaskDetails" class="modal-body">
          <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading task details...
          </div>
        </div>

        <div v-else-if="selectedTask.id" class="modal-body">
          <div class="task-info-section">
            <div class="task-info-row">
              <div class="task-info-label">Status:</div>
              <div class="task-status" :class="selectedTask?.status || 'pending'">
                {{ formatStatus(selectedTask?.status || 'pending') }}
              </div>
            </div>
            <div class="task-info-row">
              <div class="task-info-label">Priority:</div>
              <div class="task-priority" :class="selectedTask?.priority || 'medium'">
                {{ selectedTask?.priority || 'Medium' }}
              </div>
            </div>
            <div class="task-info-row">
              <div class="task-info-label">Due Date:</div>
              <div>{{ formatDate(selectedTask?.due_date) }}</div>
            </div>
            <div class="task-info-row">
              <div class="task-info-label">Created By:</div>
              <div>{{ selectedTask?.creator?.name || 'Unknown' }}</div>
            </div>
            <div class="task-info-row">
              <div class="task-info-label">Description:</div>
              <div class="task-description-full">{{ selectedTask?.description || 'No description provided' }}</div>
            </div>
          </div>

          <div class="collaborators-section">
            <h4>Current Collaborators</h4>
            <div class="collaborators-list">
              <div 
                v-for="user in selectedTask.assigned_users" 
                :key="user.id || Math.random()"
                class="collaborator-item"
              >
                <div class="user-avatar-small">
                  {{ getUserInitials(user.name || 'Unknown') }}
                </div>
                <div class="collaborator-info">
                  <div class="user-name">{{ user.name || 'Unknown User' }}</div>
                  <div class="user-role">{{ user.pivot?.role || 'Collaborator' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedTask && selectedTask.id" class="task-attachments">
            <h5>Attachments</h5>
            <FileAttachments :taskId="selectedTask.id" />
          </div>

          <div v-if="selectedTask && selectedTask.id">
            <TaskComments :taskId="selectedTask.id" />
          </div>

          <div v-if="selectedTask && selectedTask.id">
            <TaskInvitations :taskId="selectedTask.id" />
          </div>
        </div>

        <div class="modal-footer">
          <button 
            v-if="canEditTask(selectedTask)" 
            @click="editTask(selectedTask)" 
            class="btn"
          >
            <i class="fas fa-edit"></i> Edit Task
          </button>
          <button @click="closeTaskDetails" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <TaskModal 
      v-if="showEditTaskModal"
      :task="selectedTask"
      @close="showEditTaskModal = false"
      @task-updated="handleTaskUpdated"
    />
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/counter'
import TaskComments from '@/components/TaskComments.vue'
import TaskInvitations from '@/components/TaskInvitations.vue'
import TaskModal from '@/components/TaskModal.vue'
import Sidebar from '@/components/Sidebar.vue'
import NotificationsPanel from '@/components/NotificationsPanel.vue'
import FileAttachments from '@/components/FileAttachments.vue'

const tasksStore = useTasksStore()
const authStore = useAuthStore()

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'U'
  return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
})

// Method to handle logout
const handleLogout = () => {
  authStore.logout()
}

const loading = ref(true)
const showTaskDetails = ref(false)
const showEditTaskModal = ref(false)
const selectedTask = ref({})
const loadingTaskDetails = ref(false)

const collaborativeTasks = computed(() => {
  console.log('Tasks in store:', tasksStore.tasks);
  
  // First check if we have any tasks with assigned_users
  const tasksWithAssignments = tasksStore.tasks.filter(task => 
    Array.isArray(task.assigned_users) && task.assigned_users.length > 0
  );
  console.log('Tasks with assignments:', tasksWithAssignments.length);
  
  // Check for any tasks with missing IDs
  const tasksWithoutIds = tasksStore.tasks.filter(task => !task.id);
  if (tasksWithoutIds.length > 0) {
    console.error('Found tasks without IDs:', tasksWithoutIds);
  }
  
  const filteredTasks = tasksStore.tasks.filter(task => {
    // Check if the current user is assigned to this task
    const userAssignment = task.assigned_users?.find(user => 
      user.id === authStore.user?.id
    );
    
    // Log each task for debugging
    console.log('Checking task:', task.id, task.title);
    console.log('- User assigned:', !!userAssignment);
    console.log('- Title check:', task.title.startsWith('Collaboration on:'));
    console.log('- Assigned users:', task.assigned_users);
    console.log('- Task data structure:', JSON.stringify(task));
    
    // Consider it a collaboration if:
    // 1. The task title starts with 'Collaboration on:'
    // 2. User is assigned to the task OR user created the task
    const isCollaborationTitle = task.title.startsWith('Collaboration on:');
    const isUserInvolved = userAssignment || task.created_by === authStore.user?.id;
    
    return isCollaborationTitle && isUserInvolved;
  });
  
  console.log('Filtered collaborative tasks:', filteredTasks);
  return filteredTasks;
})

onMounted(async () => {
  loading.value = true
  try {
    console.log('Fetching tasks for collaborations view')
    await tasksStore.fetchTasks()
    console.log('Fetched tasks:', tasksStore.tasks)
    console.log('Filtered collaborative tasks:', collaborativeTasks.value)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
  } finally {
    loading.value = false
  }
})

const openTaskDetails = async (task) => {
  console.log('Opening task details for:', task)
  // Make sure we have a valid task object with an ID
  if (!task || !task.id) {
    console.error('Invalid task object:', task)
    return
  }
  
  // Show the modal immediately with loading state
  selectedTask.value = { id: task.id, title: task.title || 'Loading...' }
  showTaskDetails.value = true
  loadingTaskDetails.value = true
  
  try {
    // Fetch the latest task data to ensure we have the most up-to-date information
    await tasksStore.fetchTasks()
    
    // Find the task in the updated tasks list
    const updatedTask = tasksStore.tasks.find(t => t.id === task.id)
    if (updatedTask) {
      // Create a deep copy of the task to avoid reference issues
      // Ensure all required properties exist to prevent undefined errors
      const taskCopy = JSON.parse(JSON.stringify(updatedTask))
      
      // Ensure user objects have required properties
      if (taskCopy.assigned_users) {
        taskCopy.assigned_users = taskCopy.assigned_users.map(user => ({
          ...user,
          name: user?.name || 'Unknown User',
          id: user?.id || 0
        }))
      } else {
        taskCopy.assigned_users = []
      }
      
      // Ensure creator has required properties
      if (!taskCopy.creator || !taskCopy.creator.name) {
        taskCopy.creator = { name: 'Unknown', id: 0, ...taskCopy.creator }
      }
      
      selectedTask.value = taskCopy
    } else {
      // If task not found in updated list, use the provided task with safety checks
      const taskCopy = JSON.parse(JSON.stringify(task))
      
      // Apply the same safety checks
      if (taskCopy.assigned_users) {
        taskCopy.assigned_users = taskCopy.assigned_users.map(user => ({
          ...user,
          name: user?.name || 'Unknown User',
          id: user?.id || 0
        }))
      } else {
        taskCopy.assigned_users = []
      }
      
      if (!taskCopy.creator || !taskCopy.creator.name) {
        taskCopy.creator = { name: 'Unknown', id: 0, ...taskCopy.creator }
      }
      
      selectedTask.value = taskCopy
    }
    
    console.log('Task details loaded, selectedTask:', selectedTask.value)
  } catch (error) {
    console.error('Error fetching updated task data:', error)
    // Fallback to using the provided task with safety checks
    const taskCopy = JSON.parse(JSON.stringify(task))
    
    // Apply safety checks
    if (taskCopy.assigned_users) {
      taskCopy.assigned_users = taskCopy.assigned_users.map(user => ({
        ...user,
        name: user?.name || 'Unknown User',
        id: user?.id || 0
      }))
    } else {
      taskCopy.assigned_users = []
    }
    
    if (!taskCopy.creator || !taskCopy.creator.name) {
      taskCopy.creator = { name: 'Unknown', id: 0, ...taskCopy.creator }
    }
    
    selectedTask.value = taskCopy
  } finally {
    loadingTaskDetails.value = false
  }
}

const closeTaskDetails = () => {
  showTaskDetails.value = false
  loadingTaskDetails.value = false
  // Reset the selected task after a short delay to allow for transition effects
  setTimeout(() => {
    selectedTask.value = {}
  }, 300)
}

const editTask = (task) => {
  // Create a deep copy of the task to avoid reference issues
  const taskCopy = JSON.parse(JSON.stringify(task))
  selectedTask.value = taskCopy
  showEditTaskModal.value = true
  
  // Close the task details modal if it's open
  if (showTaskDetails.value) {
    showTaskDetails.value = false
  }
}

const handleTaskUpdated = async () => {
  showEditTaskModal.value = false
  await tasksStore.fetchTasks()
  
  // If we have a selectedTask, refresh its data from the updated tasks list
  if (selectedTask.value && selectedTask.value.id) {
    const updatedTask = tasksStore.tasks.find(task => task.id === selectedTask.value.id)
    if (updatedTask) {
      selectedTask.value = updatedTask
    }
  }
}

const canEditTask = (task) => {
  if (!task || !authStore.user) return false
  
  // Admin can edit any task
  if (authStore.isAdmin()) return true
  
  // Creator can edit their own task
  if (task?.creator_id === authStore.user?.id) return true
  
  // Check if user has edit permission based on role
  const userAssignment = task?.assigned_users?.find(user => user?.id === authStore.user?.id)
  return userAssignment && ['assignee', 'collaborator'].includes(userAssignment?.pivot?.role)
}

const formatStatus = (status) => {
  if (!status) return ''
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const formatDate = (date) => {
  if (!date) return 'No date'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getUserInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  /* Changed from fixed height to min-height to match global styles */
  /* Removed overflow: hidden to prevent content cutoff */
}

.main-content {
  flex: 1;
  overflow-y: auto;
  /* Remove the solid background color to let the body gradient show through */
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.content-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: #7494ec;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.logout-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #f0f0f0;
}

.collaborations-view {
  padding: 0;
  /* Removed padding to eliminate gap */
}

.page-header {
  margin: 20px 20px 30px 20px;
  /* Added horizontal and top margin to compensate for removed padding */
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.collaborations-container {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin: 0 20px 20px 20px;
  /* Changed from solid white to semi-transparent to blend with gradient */
  /* Added margin to compensate for removed padding */
}

.loading, .no-collaborations {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-collaborations i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 20px;
}

.collaborations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.collab-task-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.collab-task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.collab-task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.task-title-section {
  flex: 1;
}

.task-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
}

.task-status {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.task-status.completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.task-status.in_progress {
  background: #e3f2fd;
  color: #1565c0;
}

.task-status.pending {
  background: #fff8e1;
  color: #f57f17;
}

.task-description {
  color: #555;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.task-meta-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.task-meta-item i {
  margin-right: 5px;
  width: 16px;
  color: #7494ec;
}

.task-priority {
  text-transform: capitalize;
  font-weight: 500;
}

.task-priority.high {
  color: #e53935;
}

.task-priority.medium {
  color: #fb8c00;
}

.task-priority.low {
  color: #43a047;
}

.task-collaborators, .task-activity {
  margin-bottom: 20px;
}

.task-collaborators h4, .task-activity h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.collaborators-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  background: #7494ec;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
}

.collaborator-info {
  font-size: 13px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 11px;
  color: #666;
  text-transform: capitalize;
}

.activity-list {
  max-height: 150px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.activity-avatar {
  width: 28px;
  height: 28px;
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

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.activity-user {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.activity-time {
  font-size: 12px;
  color: #999;
}

.activity-text {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
}

.no-activity {
  text-align: center;
  padding: 15px;
  color: #999;
  font-style: italic;
}

.task-footer {
  margin-top: 20px;
  text-align: center;
}

.btn-primary {
  background: #7494ec;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #5a7ddb;
}

/* Modal Styles */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

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
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
}

.task-details-modal {
  display: flex;
  flex-direction: column;
  height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.task-info-section {
  margin-bottom: 30px;
}

.task-attachments {
  margin-top: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.task-attachments h5 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
  font-weight: 600;
}

.task-info-row {
  display: flex;
  margin-bottom: 10px;
}

.task-info-label {
  width: 100px;
  font-weight: 600;
  color: #333;
}

.task-description-full {
  line-height: 1.6;
  color: #333;
}

/* Collaborators section styles */
.collaborators-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.collaborators-section h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
  color: #333;
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  margin-right: 12px;
}

.collaborator-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-role {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.btn {
  background: #7494ec;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn:hover {
  background: #5a7ddb;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-icon {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #f0f4ff;
}

@media (max-width: 768px) {
  .collaborations-list {
    grid-template-columns: 1fr;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
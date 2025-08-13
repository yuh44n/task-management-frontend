<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ task ? 'Edit Task' : 'Create New Task' }}</h2>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="error-message">
          <div v-if="error.includes('\n')">
            <ul>
              <li v-for="(err, index) in error.split('\n')" :key="index">{{ err }}</li>
            </ul>
          </div>
          <div v-else>{{ error }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Title</label>
          <input 
            type="text" 
            class="form-input"
            v-model="form.title"
            placeholder="Enter task title"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea 
            class="form-input form-textarea"
            v-model="form.description"
            placeholder="Enter task description"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" v-model="form.priority" required>
            <option value="">Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div class="form-group" v-if="task && authStore.isAdmin()">
          <label class="form-label">Status</label>
          <select class="form-select" v-model="form.status" required>
            <option value="">Select Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input 
            type="date" 
            class="form-input"
            v-model="form.due_date"
            :min="getTomorrowDate()"
            required
          />
        </div>
        
        <!-- Task Reminder Component has been removed -->
        
        <div class="form-group" v-if="authStore.isAdmin() && users.length > 0">
          <label class="form-label">Assign to Users</label>
          <div style="max-height: 150px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 8px; padding: 10px;">
            <div v-for="user in users" :key="user.id" style="margin-bottom: 8px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input 
                  type="checkbox" 
                  :value="user.id"
                  v-model="form.assignees"
                  style="margin-right: 8px;"
                />
                {{ user.name }} ({{ user.email }})
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeModal">
            Cancel
          </button>
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/counter'
import api from '@/utils/api'
// TaskReminder import has been removed

const props = defineProps({
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'task-created', 'task-updated'])

const tasksStore = useTasksStore()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const users = ref([])

const form = reactive({
  title: '',
  description: '',
  priority: '',
  status: '',
  due_date: '',
  assignees: []
})

// Initialize form with task data if editing
watch(() => props.task, (newTask) => {
  if (newTask) {
    Object.keys(form).forEach(key => {
      if (key === 'assignees') {
        form[key] = newTask.assigned_users?.map(user => user.id) || []
      } else if (key === 'due_date') {
        form[key] = newTask.due_date ? newTask.due_date.split('T')[0] : ''
      } else {
        form[key] = newTask[key] || ''
      }
    })
  }
}, { immediate: true })

const fetchUsers = async () => {
  try {
    const response = await api.get('/tasks/users/list')
    users.value = response.data.data || response.data
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

const closeModal = () => {
  emit('close')
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const taskData = { ...form }
    
    // Set default status for new tasks
    if (!props.task) {
      taskData.status = 'pending'
    }
    
    let result
    if (props.task) {
      result = await tasksStore.updateTask(props.task.id, taskData)
      if (result.success) {
        emit('task-updated')
      }
    } else {
      result = await tasksStore.createTask(taskData)
      if (result.success) {
        emit('task-created')
      }
    }
    
    if (!result.success) {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Task submission error:', err)
  } finally {
    loading.value = false
  }
}

const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #f5c6cb;
}

.error-message ul {
  margin: 0;
  padding-left: 20px;
}

.error-message li {
  margin-bottom: 5px;
}
</style>
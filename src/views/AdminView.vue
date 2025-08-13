<template>
  <div class="dashboard-layout">
    <Sidebar />
    
    <div class="main-content">
      <!-- Header -->
      <div class="content-header">
        <h1>Admin Dashboard</h1>
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <span>{{ authStore.user?.name }}</span>
          <button class="logout-btn" @click="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
      
      <!-- Admin Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-number">{{ adminStore.dashboardStats.total_users }}</div>
          <div class="stat-label">Total Users</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-list"></i>
          </div>
          <div class="stat-number">{{ adminStore.dashboardStats.total_tasks }}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon completed">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-number">{{ adminStore.dashboardStats.completed_tasks }}</div>
          <div class="stat-label">Completed Tasks</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon overdue">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-number">{{ adminStore.dashboardStats.overdue_tasks }}</div>
          <div class="stat-label">Overdue Tasks</div>
        </div>
      </div>
      
      <!-- Tabs -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; border-bottom: 2px solid #eee;">
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'users' }"
            @click="activeTab = 'users'"
          >
            <i class="fas fa-users"></i> Users Management
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'tasks' }"
            @click="activeTab = 'tasks'"
          >
            <i class="fas fa-tasks"></i> All Tasks
          </button>
        </div>
      </div>
      
      <!-- Users Management Tab -->
      <div v-if="activeTab === 'users'" class="tasks-container">
        <div class="tasks-header">
          <h2>Users Management</h2>
        </div>
        
        <div class="tasks-list" v-if="!adminStore.loading">
          <div 
            v-for="user in adminStore.users" 
            :key="user.id"
            class="task-card"
          >
            <div class="task-title">{{ user.name }}</div>
            <div class="task-description">{{ user.email }}</div>
            <div class="task-meta">
              <span class="task-status" :class="user.role">
                {{ user.role.toUpperCase() }}
              </span>
              <span class="task-date">
                Joined: {{ formatDate(user.created_at) }}
              </span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <select 
                  :value="user.role"
                  @change="updateUserRole(user.id, $event.target.value)"
                  class="form-select"
                  style="width: auto; padding: 5px 10px; font-size: 12px;"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button 
                  class="btn" 
                  style="padding: 5px 10px; font-size: 12px; height: auto; background: #ff4757;"
                  @click="deleteUser(user.id)"
                  :disabled="user.id === authStore.user.id"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="adminStore.users.length === 0" class="loading">
            No users found.
          </div>
        </div>
        
        <div v-else class="loading">
          Loading users...
        </div>
      </div>
      
      <!-- All Tasks Tab -->
      <div v-if="activeTab === 'tasks'" class="tasks-container">
        <div class="tasks-header">
          <h2>All Tasks</h2>
        </div>
        
        <div class="tasks-list" v-if="!adminStore.loading">
          <div 
            v-for="task in adminStore.allTasks" 
            :key="task.id"
            class="task-card"
          >
            <div class="task-title">{{ task.title }}</div>
            <div class="task-description">{{ task.description }}</div>
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
            </div>
            
            <!-- Task Creator and Assigned Users -->
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
              <div>
                <strong>Created by:</strong> {{ task.creator?.name || 'Unknown' }}
              </div>
              <div v-if="task.assigned_users && task.assigned_users.length > 0">
                <strong>Assigned to:</strong>
                <span 
                  v-for="user in task.assigned_users" 
                  :key="user.id"
                  style="display: inline-block; background: #f0f4ff; color: #7494ec; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 5px;"
                >
                  {{ user.name }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="adminStore.allTasks.length === 0" class="loading">
            No tasks found.
          </div>
        </div>
        
        <div v-else class="loading">
          Loading tasks...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/counter'
import { useAdminStore } from '@/stores/admin'
import Sidebar from '@/components/Sidebar.vue'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const activeTab = ref('users')

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const updateUserRole = async (userId, newRole) => {
  if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
    await adminStore.updateUserRole(userId, newRole)
  }
}

const deleteUser = async (userId) => {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    await adminStore.deleteUser(userId)
  }
}

const formatStatus = (status) => {
  if (!status) return ''
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

onMounted(async () => {
  await Promise.all([
    adminStore.fetchDashboardStats(),
    adminStore.fetchUsers(),
    adminStore.fetchAllTasks()
  ])
})
</script>

<style scoped>
.tab-button {
  background: none;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  color: #7494ec;
}

.tab-button.active {
  color: #7494ec;
  border-bottom-color: #7494ec;
}

.task-status.admin {
  background: #7494ec;
  color: #fff;
}

.task-status.user {
  background: #6c757d;
  color: #fff;
}
</style>
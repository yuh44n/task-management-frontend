<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>Task Manager</h2>
    </div>
    
    <div class="sidebar-content">
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <i class="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </router-link>
        
        <router-link to="/collaborations" class="nav-item" active-class="active">
          <i class="fas fa-users"></i>
          <span>Collaborations</span>
        </router-link>
        
        <router-link v-if="authStore.isAdmin()" to="/admin" class="nav-item" active-class="active">
          <i class="fas fa-user-shield"></i>
          <span>Admin Panel</span>
        </router-link>
      </nav>
    </div>
    
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">
          {{ getUserInitials(authStore.user?.name) }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ authStore.user?.name }}</div>
          <div class="user-role">{{ authStore.user?.role }}</div>
        </div>
        <button @click="logout" class="btn-icon" title="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/counter'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const getUserInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sidebar-content {
  flex: 1;
  padding: 20px 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #34495e;
  color: white;
}

.nav-item.active {
  background: #34495e;
  color: white;
  border-left-color: #3498db;
}

.nav-item i {
  margin-right: 12px;
  width: 16px;
  text-align: center;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #34495e;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  justify-content: space-between;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #3498db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
}

.user-details {
  flex: 1;
  margin-right: 10px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.user-role {
  font-size: 12px;
  color: #bdc3c7;
  text-transform: capitalize;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-icon {
  background: none;
  border: none;
  color: #bdc3c7;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #34495e;
  color: white;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
</style>
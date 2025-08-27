<script setup>
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/counter'
import { useInteractionsStore } from './stores/interactions'

const authStore = useAuthStore()
const interactionsStore = useInteractionsStore()
let notificationInterval = null

const startNotificationPolling = () => {
  // Poll every 30 seconds
  notificationInterval = setInterval(async () => {
    if (authStore.isAuthenticated()) {
      try {
        // Use forceRefresh to ensure we get the latest data
        await interactionsStore.getUnreadCount(true)
        await interactionsStore.fetchNotifications({}, true)
      } catch (err) {
        // Silent fail for background polling
        console.warn('Background notification polling failed:', err.message || err)
      }
    } else {
      clearInterval(notificationInterval)
    }
  }, 30000)
}

onMounted(async () => {
  // If user is authenticated, initialize notifications
  if (authStore.isAuthenticated()) {
    try {
      // Initialize with latest data
      await interactionsStore.getUnreadCount(true)
      await interactionsStore.fetchNotifications({}, true)
      await interactionsStore.fetchPendingInvitations()
      startNotificationPolling()
    } catch (err) {
      console.warn('Failed to initialize notifications:', err.message || err)
      // Still start polling even if initial fetch fails
      startNotificationPolling()
    }
  }
})

onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
  }
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>

<template>
  <div class="file-attachments">
    <!-- File Upload Form -->
    <form @submit.prevent class="file-upload">
      <label for="file-upload" class="file-upload-label">
        <i class="fas fa-paperclip"></i>
        <span>{{ selectedFile ? selectedFile.name : 'Attach a file' }}</span>
      </label>
      <input 
        type="file" 
        id="file-upload" 
        @change="handleFileSelect" 
        class="file-input"
      />
      <button 
        type="button"
        v-if="selectedFile" 
        @click="uploadFile" 
        :disabled="uploading" 
        class="btn btn-sm"
      >
        <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
        <span v-else>Upload</span>
      </button>
    </form>
    
    <!-- Error message -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
    </div>

    <!-- Attachments List -->
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading attachments...
    </div>

    <div v-else-if="attachments.length === 0" class="no-attachments">
      <p>No attachments yet.</p>
    </div>

    <div v-else class="attachments-list">
      <div v-for="attachment in attachments" :key="attachment.id" class="attachment-item">
        <div class="attachment-icon">
          <i :class="getFileIcon(attachment.mime_type)"></i>
        </div>
        <div class="attachment-info">
          <div class="attachment-name">
            <a :href="attachment.url" target="_blank" class="attachment-link">{{ attachment.filename }}</a>
          </div>
          <div class="attachment-meta">
            <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
            <span class="attachment-uploader">Uploaded by {{ attachment.uploaded_by.name }}</span>
            <span class="attachment-date">{{ formatDate(attachment.uploaded_at) }}</span>
          </div>
        </div>
        <div class="attachment-actions" v-if="canDelete(attachment)">
          <button @click="deleteAttachment(attachment.id)" class="btn-icon delete" title="Delete attachment">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/counter'
import { useApi } from '@/composables/useApi'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/composables/useToast'

const props = defineProps({
  taskId: {
    type: [Number, String],
    required: true
  },
  interactionId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['file-uploaded'])

const authStore = useAuthStore()
const attachments = ref([])
const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const error = ref(null)

// Load attachments when component is mounted
onMounted(() => {
  // Force refresh on initial load to ensure we have the latest data
  fetchAttachments(true)
})

const fetchAttachments = async (forceRefresh = false) => {
  loading.value = true
  error.value = null
  try {
    const { attachments: attachmentsApi } = useApi()
    let response
    
    if (props.interactionId) {
      response = await attachmentsApi.getForInteraction(props.interactionId, forceRefresh)
    } else {
      response = await attachmentsApi.getForTask(props.taskId, forceRefresh)
    }
    
    if (response && response.data) {
      if (Array.isArray(response.data.attachments)) {
        attachments.value = response.data.attachments
      } else {
        console.error('Invalid attachments data format')
        attachments.value = []
      }
    } else {
      attachments.value = []
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch attachments'
    error.value = errorMessage
    toast.error(errorMessage)
    console.error('Error fetching attachments:', err)
    // Keep existing attachments if there's an error
    if (attachments.value.length === 0) {
      attachments.value = []
    }
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event) => {
  error.value = null
  
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  } else {
    selectedFile.value = null
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) {
    return
  }
  
  // Validate file size before uploading
  const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
  if (selectedFile.value.size > maxSizeInBytes) {
    error.value = `File size exceeds the maximum limit of ${formatFileSize(maxSizeInBytes)}`
    return
  }
  
  uploading.value = true
  error.value = null
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  if (props.interactionId) {
    formData.append('interaction_id', props.interactionId)
  }
  
  // Create a temporary attachment for optimistic UI update
  const tempAttachment = {
    id: 'temp-' + Date.now(),
    filename: selectedFile.value.name,
    mime_type: selectedFile.value.type,
    size: selectedFile.value.size,
    uploaded_by: { id: authStore.user.id, name: authStore.user.name },
    uploaded_at: new Date().toISOString(),
    url: '#',
    isUploading: true
  }
  
  // Add temporary attachment to the UI
  attachments.value.unshift(tempAttachment)
  
  try {
    const { attachments: attachmentsApi } = useApi()
    const response = await attachmentsApi.upload(props.taskId, formData)
    
    if (response.data.attachment) {
      // Replace the temporary attachment with the real one
      const tempIndex = attachments.value.findIndex(a => a.id === tempAttachment.id)
      if (tempIndex !== -1) {
        attachments.value.splice(tempIndex, 1, response.data.attachment)
      } else {
        // If for some reason the temp attachment is not found, add the new one
        attachments.value.unshift(response.data.attachment)
      }
      emit('file-uploaded', response.data.attachment)
      toast.success('File uploaded successfully')
    } else {
      // Remove the temporary attachment and fetch all attachments
      attachments.value = attachments.value.filter(a => a.id !== tempAttachment.id)
      await fetchAttachments(true)
      emit('file-uploaded', null)
      toast.success('File uploaded successfully')
    }
    
    // Reset file input
    selectedFile.value = null
    document.getElementById('file-upload').value = ''
  } catch (err) {
    // Remove the temporary attachment on error
    attachments.value = attachments.value.filter(a => a.id !== tempAttachment.id)
    const errorMessage = err.response?.data?.message || 'Failed to upload file'
    error.value = errorMessage
    toast.error(errorMessage)
    console.error('Error uploading file:', err)
  } finally {
    uploading.value = false
  }
}

const deleteAttachment = async (attachmentId) => {
  if (!confirm('Are you sure you want to delete this attachment?')) return
  
  // Find the attachment to delete
  const attachmentToDelete = attachments.value.find(a => a.id === attachmentId)
  if (!attachmentToDelete) {
    error.value = 'Attachment not found'
    return
  }
  
  // Store original state for potential rollback
  const attachmentIndex = attachments.value.findIndex(a => a.id === attachmentId)
  const removedAttachment = { ...attachmentToDelete }
  
  // Optimistically remove from UI first for better UX
  attachments.value.splice(attachmentIndex, 1)
  
  try {
    const { attachments: attachmentsApi } = useApi()
    await attachmentsApi.delete(attachmentId)
    
    // Clear the cache to ensure fresh data on next fetch
    if (props.interactionId) {
      attachmentsApi.clearCache(null, props.interactionId)
    } else {
      attachmentsApi.clearCache(props.taskId)
    }
    
    // Already removed from UI, no need to filter again
    error.value = null
    toast.success('File deleted successfully')
  } catch (err) {
    // Restore the attachment if deletion failed
    attachments.value.splice(attachmentIndex, 0, removedAttachment)
    const errorMessage = err.response?.data?.message || 'Failed to delete attachment'
    error.value = errorMessage
    toast.error(errorMessage)
    console.error('Error deleting attachment:', err)
  }
}

const canDelete = (attachment) => {
  return attachment.uploaded_by.id === authStore.user.id
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'fas fa-file'
  
  if (mimeType.startsWith('image/')) return 'fas fa-file-image'
  if (mimeType.startsWith('video/')) return 'fas fa-file-video'
  if (mimeType.startsWith('audio/')) return 'fas fa-file-audio'
  if (mimeType.includes('pdf')) return 'fas fa-file-pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'fas fa-file-archive'
  if (mimeType.includes('text/')) return 'fas fa-file-alt'
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'fas fa-file-code'
  
  return 'fas fa-file'
}
</script>

<style scoped>
.file-attachments {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.file-upload {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.file-upload-label {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload-label:hover {
  background-color: #e9e9e9;
}

.file-upload-label i {
  margin-right: 0.5rem;
}

.file-input {
  display: none;
}

.attachments-list {
  margin-top: 1rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-color: #f9f9f9;
}

.attachment-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  color: #666;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-link {
  color: #4a6cf7;
  text-decoration: none;
}

.attachment-link:hover {
  text-decoration: underline;
}

.attachment-meta {
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #666;
}

.attachment-meta > span {
  margin-right: 1rem;
}

.attachment-actions {
  margin-left: 0.5rem;
}

.btn-icon.delete {
  color: #dc3545;
}

.no-attachments {
  color: #666;
  font-style: italic;
  margin: 1rem 0;
}

.loading {
  display: flex;
  align-items: center;
  color: #666;
  margin: 1rem 0;
}

.loading i {
  margin-right: 0.5rem;
}

.error-message {
  color: #dc3545;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.error-message i {
  margin-right: 0.5rem;
}
</style>
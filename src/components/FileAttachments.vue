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
  fetchAttachments()
})

// Fetch attachments for task or interaction
const fetchAttachments = async () => {
  loading.value = true
  error.value = null
  try {
    const { attachments: attachmentsApi } = useApi()
    let response
    
    if (props.interactionId) {
      // For interaction attachments, use the new helper method
      response = await attachmentsApi.getForInteraction(props.interactionId)
    } else {
      response = await attachmentsApi.getForTask(props.taskId)
    }
    
    if (response && response.data) {
      attachments.value = response.data.attachments || []
    } else {
      console.warn('Invalid response format for attachments:', response)
      attachments.value = []
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch attachments'
    console.error('Error fetching attachments:', err)
    attachments.value = []
  } finally {
    loading.value = false
  }
}

// Handle file selection
const handleFileSelect = (event) => {
  // Clear any previous errors
  error.value = null
  
  const file = event.target.files[0]
  if (file) {
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
    selectedFile.value = file
  } else {
    console.log('No file selected')
    selectedFile.value = null
  }
}

// Upload file
const uploadFile = async () => {
  console.log('Upload file function called')
  if (!selectedFile.value) {
    console.log('No file selected')
    return
  }
  
  console.log('Selected file:', selectedFile.value)
  uploading.value = true
  error.value = null
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  if (props.interactionId) {
    formData.append('interaction_id', props.interactionId)
    console.log('Added interaction_id to form data:', props.interactionId)
  }
  
  console.log('Task ID for upload:', props.taskId)
  console.log('Form data prepared:', formData)
  
  try {
    console.log('Sending API request to:', `/tasks/${props.taskId}/attachments`)
    const { attachments: attachmentsApi } = useApi()
    const response = await attachmentsApi.upload(props.taskId, formData)
    
    console.log('Upload response:', response.data)
    console.log('Response data structure:', Object.keys(response.data))
    console.log('Current attachments before update:', attachments.value)
    
    // Add the new attachment to the list
    if (response.data.attachment) {
      console.log('Attachment data found:', response.data.attachment)
      attachments.value.unshift(response.data.attachment)
      console.log('Added attachment to list, current attachments:', attachments.value)
    } else {
      console.log('No attachment data in response')
      // Refresh attachments list to ensure we have the latest data
      await fetchAttachments()
    }
    
    // Emit event to notify parent component that a file was uploaded
    emit('file-uploaded', response.data.attachment)
    
    // Refresh the attachments list to ensure we have the latest data
    // This is important for when files are uploaded without an interactionId
    await fetchAttachments()
    
    // Reset the file input
    selectedFile.value = null
    document.getElementById('file-upload').value = ''
    console.log('File input reset')
  } catch (err) {
    console.error('Error uploading file:', err)
    console.error('Error response:', err.response?.data)
    error.value = err.response?.data?.message || 'Failed to upload file'
  } finally {
    uploading.value = false
    console.log('Upload process completed')
  }
}

// Delete attachment
const deleteAttachment = async (attachmentId) => {
  if (!confirm('Are you sure you want to delete this attachment?')) return
  
  try {
    const { attachments: attachmentsApi } = useApi()
    await attachmentsApi.delete(attachmentId)
    
    // Remove the attachment from the list
    attachments.value = attachments.value.filter(a => a.id !== attachmentId)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete attachment'
    console.error('Error deleting attachment:', err)
  }
}

// Check if current user can delete an attachment
const canDelete = (attachment) => {
  return attachment.uploaded_by.id === authStore.user.id
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
const formatDate = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Get appropriate icon for file type
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
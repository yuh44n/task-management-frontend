<template>
  <div class="task-comments">
    <div class="comments-header">
      <h3>Comments ({{ interactionsStore.comments.length }})</h3>
    </div>

    <!-- Add Comment Form -->
    <div class="comment-form">
      <div class="form-group">
        <textarea
          v-model="newComment"
          class="form-textarea"
          placeholder="Add a comment... Use @username to mention someone"
          rows="3"
          @input="handleMentionInput"
        ></textarea>
        <div v-if="showMentionSuggestions" class="mention-suggestions">
          <div v-if="filteredMentionableUsers.length === 0" class="no-mentions">
            No users found. Try a different name.
          </div>
          <div
            v-else
            v-for="user in filteredMentionableUsers"
            :key="user.id"
            class="mention-suggestion"
            @click="selectMention(user)"
          >
            <div class="user-avatar-small">
              {{ getUserInitials(user.name) }}
            </div>
            <span>{{ user.name }}</span>
          </div>
        </div>
      </div>
      <div class="comment-attachments">
        <FileAttachments :taskId="props.taskId" @file-uploaded="handleFileUploaded" />
      </div>
      <div class="comment-actions">
        <button
          @click="submitComment"
          :disabled="!newComment.trim() || submitting"
          class="btn"
        >
          <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
          <span v-else>Add Comment</span>
        </button>
      </div>
    </div>

    <!-- Comments List -->
    <div v-if="interactionsStore.loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading comments...
    </div>

    <div v-else-if="interactionsStore.comments.length === 0" class="no-comments">
      <i class="fas fa-comments"></i>
      <p>No comments yet. Be the first to comment!</p>
    </div>

    <div v-else class="comments-list">
      <div
        v-for="comment in interactionsStore.comments"
        :key="comment.id"
        class="comment-item"
        :class="{ 'is-reply': comment.parent_id }"
      >
        <!-- Comment Header -->
        <div class="comment-header">
          <div class="comment-author">
            <div class="user-avatar-small">
              {{ getUserInitials(comment.user?.name || 'Unknown') }}
            </div>
            <div class="author-info">
              <span class="author-name">{{ comment.user?.name || 'Unknown User' }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>
          </div>
          <div class="comment-actions" v-if="canEditComment(comment)">
            <button
              @click="editComment(comment)"
              class="btn-icon"
              title="Edit comment"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              @click="deleteComment(comment.id)"
              class="btn-icon delete"
              title="Delete comment"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Comment Content -->
        <div class="comment-content">
          <div v-if="editingComment?.id === comment.id" class="edit-form">
            <textarea
              v-model="editingComment.content"
              class="form-textarea"
              rows="3"
            ></textarea>
            <div class="edit-actions">
              <button
                @click="saveEdit"
                :disabled="!editingComment.content.trim()"
                class="btn btn-sm"
              >
                Save
              </button>
              <button @click="cancelEdit" class="btn btn-sm btn-secondary">
                Cancel
              </button>
            </div>
          </div>
          <div v-else class="comment-text" v-html="formatCommentText(comment.content)"></div>
          
          <!-- Comment Attachments -->
          <div v-if="comment.attachments && comment.attachments.length > 0" class="comment-attachments-list">
            <div class="attachments-header">
              <i class="fas fa-paperclip"></i>
              <span>Attachments ({{ comment.attachments.length }})</span>
            </div>
            <div class="attachments-grid">
              <div v-for="attachment in comment.attachments" :key="attachment.id" class="attachment-item">
                <div class="attachment-icon">
                  <i :class="getFileIcon(attachment.mime_type)"></i>
                </div>
                <div class="attachment-info">
                  <a :href="attachment.url" target="_blank" class="attachment-link">
                    {{ attachment.original_filename }}
                  </a>
                  <div class="attachment-meta">
                    <span class="attachment-size">{{ formatFileSize(attachment.file_size) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comment Actions -->
        <div class="comment-footer">
          <button
            @click="showReplyForm = comment.id"
            class="btn-link"
            v-if="!comment.parent_id"
          >
            <i class="fas fa-reply"></i> Reply
          </button>
        </div>

        <!-- Reply Form -->
        <div v-if="showReplyForm === comment.id" class="reply-form">
          <div class="form-group">
            <textarea
              v-model="replyContent"
              class="form-textarea"
              placeholder="Write a reply... Use @username to mention someone"
              rows="2"
              @input="handleMentionInput"
            ></textarea>
            <div v-if="showMentionSuggestions" class="mention-suggestions">
              <div v-if="filteredMentionableUsers.length === 0" class="no-mentions">
                No users found. Try a different name.
              </div>
              <div
                v-else
                v-for="user in filteredMentionableUsers"
                :key="user.id"
                class="mention-suggestion"
                @click="selectMention(user)"
              >
                <div class="user-avatar-small">
                  {{ getUserInitials(user.name) }}
                </div>
                <span>{{ user.name }}</span>
              </div>
            </div>
          </div>
          <div class="reply-attachments">
            <FileAttachments :taskId="props.taskId" :interactionId="comment.id" @file-uploaded="handleFileUploaded" />
          </div>
          <div class="reply-actions">
            <button
              @click="submitReply(comment.id)"
              :disabled="!replyContent.trim()"
              class="btn btn-sm"
            >
              Reply
            </button>
            <button @click="cancelReply" class="btn btn-sm btn-secondary">
              Cancel
            </button>
          </div>
        </div>

        <!-- Replies Toggle Button -->
        <div v-if="comment.replies && comment.replies.length > 0" class="replies-toggle">
          <button @click="toggleReplies(comment.id)" class="btn-link replies-toggle-btn">
            <i class="fas" :class="showRepliesFor.includes(comment.id) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            {{ showRepliesFor.includes(comment.id) ? 'Hide' : 'See' }} {{ comment.replies.length }} {{ comment.replies.length === 1 ? 'Reply' : 'Replies' }}
          </button>
        </div>

        <!-- Replies -->
        <div v-if="comment.replies && comment.replies.length > 0 && showRepliesFor.includes(comment.id)" class="replies">
          <div
            v-for="reply in comment.replies"
            :key="reply.id"
            class="comment-item reply"
          >
            <div class="comment-header">
              <div class="comment-author">
                <div class="user-avatar-small">
                  {{ getUserInitials(reply.user?.name || 'Unknown') }}
                </div>
                <div class="author-info">
                  <span class="author-name">{{ reply.user?.name || 'Unknown User' }}</span>
                  <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
                </div>
              </div>
              <div class="comment-actions" v-if="canEditComment(reply)">
                <button
                  @click="editComment(reply)"
                  class="btn-icon"
                  title="Edit reply"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="deleteComment(reply.id)"
                  class="btn-icon delete"
                  title="Delete reply"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="comment-content">
              <div v-if="editingComment?.id === reply.id" class="edit-form">
                <textarea
                  v-model="editingComment.content"
                  class="form-textarea"
                  rows="2"
                ></textarea>
                <div class="edit-actions">
                  <button
                    @click="saveEdit"
                    :disabled="!editingComment.content.trim()"
                    class="btn btn-sm"
                  >
                    Save
                  </button>
                  <button @click="cancelEdit" class="btn btn-sm btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
              <div v-else class="comment-text" v-html="formatCommentText(reply.content)"></div>
              
              <!-- Reply Attachments -->
              <div v-if="reply.attachments && reply.attachments.length > 0" class="comment-attachments-list">
                <div class="attachments-header">
                  <i class="fas fa-paperclip"></i>
                  <span>Attachments ({{ reply.attachments.length }})</span>
                </div>
                <div class="attachments-grid">
                  <div v-for="attachment in reply.attachments" :key="attachment.id" class="attachment-item">
                    <div class="attachment-icon">
                      <i :class="getFileIcon(attachment.mime_type)"></i>
                    </div>
                    <div class="attachment-info">
                      <a :href="attachment.url" target="_blank" class="attachment-link">
                        {{ attachment.original_filename }}
                      </a>
                      <div class="attachment-meta">
                        <span class="attachment-size">{{ formatFileSize(attachment.file_size) }}</span>
                      </div>
                    </div>
                  </div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useInteractionsStore } from '@/stores/interactions'
import { useAuthStore } from '@/stores/counter'
import FileAttachments from '@/components/FileAttachments.vue'

const props = defineProps({
  taskId: {
    type: [Number, String],
    required: true
  }
})

const interactionsStore = useInteractionsStore()
const authStore = useAuthStore()

const newComment = ref('')
const replyContent = ref('')
const submitting = ref(false)
const editingComment = ref(null)
const showReplyForm = ref(null)
const mentionableUsers = ref([])
const showMentionSuggestions = ref(false)
const mentionQuery = ref('')

// Debug log for initial state
console.log('Initial state:', {
  mentionableUsers: mentionableUsers.value,
  showMentionSuggestions: showMentionSuggestions.value,
  mentionQuery: mentionQuery.value
})
const showRepliesFor = ref([]) // Track which comments have their replies visible

// Handle file upload events
const handleFileUploaded = async (attachment) => {
  console.log('File uploaded, refreshing comments:', attachment)
  // Refresh comments to show any new attachments
  await interactionsStore.refreshComments(props.taskId)
}

// Fetch comments when component mounts
onMounted(async () => {
  console.log('Component mounted, taskId:', props.taskId)
  await interactionsStore.fetchComments(props.taskId)
  await loadMentionableUsers()
  console.log('After loading mentionable users in onMounted')
})

// Watch for taskId changes
watch(() => props.taskId, async (newTaskId) => {
  if (newTaskId) {
    await interactionsStore.fetchComments(newTaskId)
    await loadMentionableUsers()
  }
})

const loadMentionableUsers = async () => {
  try {
    if (!props.taskId) {
      console.warn('No taskId provided to loadMentionableUsers')
      mentionableUsers.value = []
      return
    }
    
    console.log('Loading mentionable users for task:', props.taskId)
    const users = await interactionsStore.getMentionableUsers(props.taskId)
    
    if (Array.isArray(users)) {
      mentionableUsers.value = users
      console.log('Loaded mentionable users:', users.length)
    } else {
      console.warn('getMentionableUsers did not return an array:', users)
      mentionableUsers.value = []
    }
  } catch (error) {
    console.error('Failed to load mentionable users:', error)
    mentionableUsers.value = []
  }
}

const filteredMentionableUsers = computed(() => {
  console.log('Filtering mentionable users with query:', mentionQuery.value)
  console.log('Available mentionable users:', mentionableUsers.value)
  
  // Ensure mentionableUsers is an array
  if (!Array.isArray(mentionableUsers.value)) {
    console.warn('mentionableUsers is not an array in computed property')
    return []
  }
  
  if (!mentionQuery.value) {
    console.log('No query, returning all users:', mentionableUsers.value)
    return mentionableUsers.value
  }
  
  try {
    const filtered = mentionableUsers.value.filter(user => {
      // Check if user object is valid and has a name property
      if (!user || typeof user !== 'object' || !user.name) {
        console.warn('Invalid user object in filter:', user)
        return false
      }
      return user.name.toLowerCase().includes(mentionQuery.value.toLowerCase())
    })
    
    console.log('Filtered users:', filtered)
    return filtered
  } catch (error) {
    console.error('Error filtering mentionable users:', error)
    return []
  }
})

const handleMentionInput = (event) => {
  try {
    if (!event || !event.target) {
      console.error('Invalid event in handleMentionInput:', event)
      return
    }
    
    // Store a reference to the active textarea
    activeTextareaRef.value = event.target
    
    const text = event.target.value || ''
    const cursorPosition = event.target.selectionStart || 0
    const beforeCursor = text.substring(0, cursorPosition)
    
    // Check if the user has typed '@' character
    // This will match '@' followed by any word characters or just '@' by itself
    const mentionMatch = beforeCursor.match(/(?:^|\s)@(\w*)$/)
    
    if (mentionMatch) {
      // If we just typed '@', mentionMatch[1] will be empty string
      mentionQuery.value = mentionMatch[1]
      showMentionSuggestions.value = true
      
      // If we don't have mentionable users yet, load them
      if (!mentionableUsers.value || mentionableUsers.value.length === 0) {
        loadMentionableUsers()
      }
    } else {
      showMentionSuggestions.value = false
    }
    
    // Force a check for '@' character if it's in the text
    if (text.includes('@') && !showMentionSuggestions.value) {
      const atIndex = beforeCursor.lastIndexOf('@')
      if (atIndex !== -1 && atIndex === cursorPosition - 1) {
        // We just typed '@'
        showMentionSuggestions.value = true
        mentionQuery.value = ''
        
        // If we don't have mentionable users yet, load them
        if (!mentionableUsers.value || mentionableUsers.value.length === 0) {
          loadMentionableUsers()
        }
      }
    }
  } catch (error) {
    console.error('Error in handleMentionInput:', error)
    showMentionSuggestions.value = false
  }
}

// Track the active textarea element
const activeTextareaRef = ref(null)

const selectMention = (user) => {
  try {
    // Validate user object
    if (!user || typeof user !== 'object') {
      console.error('Invalid user object:', user)
      showMentionSuggestions.value = false
      return
    }
    
    // Ensure user has a name property
    if (!user.name) {
      console.warn('User object missing name property:', user)
      user.name = user.email || user.username || 'user'
    }
    
    // Use the stored reference to the active textarea
    const activeTextarea = activeTextareaRef.value
    if (!activeTextarea || (activeTextarea.tagName !== 'TEXTAREA')) {
      console.error('No active textarea found')
      showMentionSuggestions.value = false
      return
    }
    
    // Determine which textarea is active and get its value
    let text, textSetter
    if (activeTextarea === document.querySelector('.comment-form textarea')) {
      text = newComment.value || ''
      textSetter = (newValue) => { newComment.value = newValue }
    } else if (activeTextarea === document.querySelector('.reply-form textarea')) {
      text = replyContent.value || ''
      textSetter = (newValue) => { replyContent.value = newValue }
    } else {
      console.error('Unknown textarea')
      showMentionSuggestions.value = false
      return
    }
    
    const cursorPosition = activeTextarea.selectionStart || 0
    const beforeCursor = text.substring(0, cursorPosition)
    const afterCursor = text.substring(cursorPosition)
    
    const mentionMatch = beforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      // Create a safe display name (remove any @ symbols from the user's name)
      const safeName = user.name.replace(/@/g, '')
      const newText = beforeCursor.replace(/@(\w*)$/, `@${safeName} `) + afterCursor
      textSetter(newText)
      
      // Set focus back to the textarea and place cursor after the inserted mention
      setTimeout(() => {
        try {
          activeTextarea.focus()
          const newCursorPosition = beforeCursor.length - mentionMatch[0].length + `@${safeName} `.length
          activeTextarea.setSelectionRange(newCursorPosition, newCursorPosition)
        } catch (focusError) {
          console.error('Error setting focus or cursor position:', focusError)
        }
      }, 0)
    } else {
      console.warn('No mention pattern found in text')
    }
  } catch (error) {
    console.error('Error in selectMention:', error)
  } finally {
    showMentionSuggestions.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  
  submitting.value = true
  try {
    await interactionsStore.addComment(props.taskId, {
      content: newComment.value
    })
    newComment.value = ''
    // Refresh comments to ensure we have the latest data including attachments
    await interactionsStore.refreshComments(props.taskId)
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    submitting.value = false
  }
}

const submitReply = async (parentId) => {
  if (!replyContent.value.trim()) return
  
  try {
    await interactionsStore.addComment(props.taskId, {
      content: replyContent.value,
      parent_id: parentId
    })
    replyContent.value = ''
    showReplyForm.value = null
    
    // Automatically show replies for this comment after adding a reply
    if (!showRepliesFor.value.includes(parentId)) {
      showRepliesFor.value.push(parentId)
    }
    
    // Refresh comments to ensure we have the latest data including attachments
    await interactionsStore.refreshComments(props.taskId)
  } catch (error) {
    console.error('Failed to add reply:', error)
  }
}

const editComment = (comment) => {
  editingComment.value = { ...comment }
}

const saveEdit = async () => {
  if (!editingComment.value?.content.trim()) return
  
  try {
    await interactionsStore.updateComment(editingComment.value.id, {
      content: editingComment.value.content
    })
    editingComment.value = null
    // Refresh comments to ensure we have the latest data including attachments
    await interactionsStore.refreshComments(props.taskId)
  } catch (error) {
    console.error('Failed to update comment:', error)
  }
}

const cancelEdit = () => {
  editingComment.value = null
}

const cancelReply = () => {
  replyContent.value = ''
  showReplyForm.value = null
}

const toggleReplies = (commentId) => {
  const index = showRepliesFor.value.indexOf(commentId)
  if (index === -1) {
    // Show replies for this comment
    showRepliesFor.value.push(commentId)
  } else {
    // Hide replies for this comment
    showRepliesFor.value.splice(index, 1)
  }
}

const deleteComment = async (commentId) => {
  if (!confirm('Are you sure you want to delete this comment?')) return
  
  try {
    await interactionsStore.deleteComment(commentId)
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

const canEditComment = (comment) => {
  return comment.user_id === authStore.user?.id || authStore.isAdmin()
}

const getUserInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
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

const formatCommentText = (text) => {
  if (!text) return ''
  
  try {
    // Convert line breaks to <br>
    let formattedText = text.replace(/\n/g, '<br>')
    
    // Ensure mentionableUsers is an array
    if (!Array.isArray(mentionableUsers.value)) {
      console.warn('mentionableUsers is not an array in formatCommentText')
      return formattedText
    }
    
    // Convert @mentions to highlighted text
    formattedText = formattedText.replace(/@([\w\s]+)/g, (match, username) => {
      try {
        // Find if this username exists in mentionable users
        const mentionedUser = mentionableUsers.value.find(user => {
          if (!user || typeof user !== 'object' || !user.name) return false
          return user.name.toLowerCase() === username.trim().toLowerCase()
        })
        
        if (mentionedUser) {
          return `<span class="mention">@${username}</span>`
        } else {
          return match // Keep as is if user not found
        }
      } catch (innerError) {
        console.error('Error processing mention:', innerError)
        return match
      }
    })
    
    return formattedText
  } catch (error) {
    console.error('Error formatting comment text:', error)
    return text || ''
  }
}

// File handling helper functions
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.task-comments {
  margin-top: 20px;
}

.comments-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.comments-header h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.comment-form {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-attachments {
  margin-top: 10px;
  margin-bottom: 10px;
}

.reply-attachments {
  margin-top: 10px;
  margin-bottom: 10px;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #7494ec;
  box-shadow: 0 0 0 2px rgba(116, 148, 236, 0.1);
}

.form-group {
  position: relative;
}

.mention-suggestions {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  /* Debug styles to make it more visible */
  min-height: 50px;
  padding: 5px;
}

/* Comment Attachments Styles */
.comment-attachments-list {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.attachments-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.attachments-header i {
  margin-right: 0.5rem;
  color: #6c757d;
}

.attachments-grid {
  display: grid;
  gap: 0.5rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.attachment-item:hover {
  border-color: #adb5bd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.attachment-icon {
  font-size: 1.25rem;
  margin-right: 0.75rem;
  color: #6c757d;
  min-width: 1.25rem;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-link {
  display: block;
  color: #4a6cf7;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-link:hover {
  text-decoration: underline;
  color: #3a5bd9;
}

.attachment-meta {
  font-size: 0.75rem;
  color: #6c757d;
}

.mention-suggestion {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mention-suggestion:hover {
  background-color: #f0f4ff;
}

.mention-suggestion .user-avatar-small {
  margin-right: 8px;
}

.no-mentions {
  padding: 10px;
  text-align: center;
  color: #666;
}

.comment-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.comments-list {
  space-y: 20px;
}

.comment-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 15px;
  background: white;
}

.comment-item.reply {
  margin-left: 30px;
  border-left: 3px solid #7494ec;
  margin-bottom: 15px;
  padding: 12px;
  background: #f9f9f9;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  display: flex;
  align-items: center;
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

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #666;
}

.comment-actions {
  display: flex;
  gap: 5px;
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

.btn-icon.delete:hover {
  background-color: #fee;
  color: #e74c3c;
}

.comment-content {
  margin-bottom: 10px;
}

.comment-text {
  line-height: 1.5;
  color: #333;
}

.mention {
  background-color: #e8f0fe;
  color: #1a73e8;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.comment-footer {
  display: flex;
  justify-content: flex-start;
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

.reply-form {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.reply-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.edit-form {
  margin-top: 10px;
}

.edit-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.replies-toggle {
  margin-top: 10px;
  margin-bottom: 5px;
}

.replies-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #5c7cfa;
}

.replies-toggle-btn:hover {
  color: #4263eb;
}

.replies {
  margin-top: 10px;
  margin-left: 20px;
  padding-left: 15px;
  border-left: 2px solid #e9ecef;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-comments {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-comments i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ddd;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>
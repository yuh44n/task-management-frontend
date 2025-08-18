import axios from 'axios'

// Make sure we have a valid API URL, fallback to a default if not defined
const API_URL = import.meta.env.VITE_APP_API_URL || 'https://task-management-backend-8obs.onrender.com'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable sending cookies with cross-origin requests
})

// Function to get CSRF token
async function getCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
      withCredentials: true
    })
    return response
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    return null
  }
}

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token expiration and other errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    // Log network errors
    if (!error.response) {
      console.error('Network Error: Unable to connect to the API server. Please check your connection or try again later.')
    }
    
    return Promise.reject(error)
  }
)

// Export the CSRF token function along with the API instance
export { getCsrfToken }
export default api
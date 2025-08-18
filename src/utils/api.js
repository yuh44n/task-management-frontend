import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable sending cookies with cross-origin requests
})

// Function to get CSRF token
async function getCsrfToken() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/sanctum/csrf-cookie`, {
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

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Export the CSRF token function along with the API instance
export { getCsrfToken }
export default api
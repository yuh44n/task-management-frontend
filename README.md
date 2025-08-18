# Task Management Frontend

A modern Vue.js frontend application for the Task Management System with a beautiful UI inspired by your custom CSS design.

## Features

### Authentication
- **Login/Register**: Beautiful sliding form with your custom CSS styling
- **JWT Token Authentication**: Secure authentication with automatic token handling
- **Route Protection**: Protected routes for authenticated users

### Dashboard
- **Task Statistics**: Visual cards showing total, completed, in-progress, and overdue tasks
- **Recent Tasks**: Quick overview of your latest tasks
- **User Profile**: Display user information and logout functionality

### Task Management
- **Create Tasks**: Modal-based task creation with all necessary fields
- **Edit Tasks**: Update existing tasks with the same intuitive interface
- **Delete Tasks**: Remove tasks with confirmation
- **Task Filtering**: Filter by status, priority, and search terms
- **Task Assignment**: Assign tasks to multiple users
- **Priority Levels**: Low, Medium, High priority with color-coded indicators
- **Status Tracking**: Pending, In Progress, Completed status management

### Admin Panel (Admin Users Only)
- **User Management**: View all users, change roles, delete users
- **System Statistics**: Overview of all users and tasks in the system
- **All Tasks View**: Monitor all tasks across the system
- **Role Management**: Promote users to admin or demote to regular users

### UI/UX Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern Styling**: Clean, professional design with Poppins font
- **Smooth Animations**: Elegant transitions and hover effects
- **Color-Coded Elements**: Visual indicators for status, priority, and roles
- **Modal Interfaces**: Clean popup forms for task creation/editing
- **Sidebar Navigation**: Easy navigation between different sections

## Technology Stack

- **Vue 3**: Modern Vue.js with Composition API
- **Vue Router**: Client-side routing with navigation guards
- **Pinia**: State management for auth, tasks, and admin data
- **Axios**: HTTP client for API communication
- **CSS3**: Custom styling with gradients, animations, and responsive design
- **Font Awesome**: Icons for better visual experience

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## API Integration

The frontend is configured to work with the Laravel backend API:

- **Base URL**: `http://localhost:8000/api`
- **Proxy Configuration**: Vite proxy setup for seamless development
- **Authentication**: Bearer token authentication
- **Error Handling**: Automatic token refresh and error management

## Project Structure

```
src/
├── components/
│   ├── Sidebar.vue          # Navigation sidebar
│   └── TaskModal.vue        # Task creation/editing modal
├── stores/
│   ├── counter.js           # Auth store (user authentication)
│   ├── tasks.js            # Tasks management store
│   └── admin.js            # Admin functionality store
├── views/
│   ├── LoginView.vue       # Login/Register page
│   ├── DashboardView.vue   # Main dashboard
│   ├── TasksView.vue       # Tasks management page
│   └── AdminView.vue       # Admin panel
├── utils/
│   └── api.js              # Axios configuration
├── assets/
│   └── main.css            # Global styles with your custom design
├── router/
│   └── index.js            # Vue Router configuration
└── main.js                 # Application entry point
```

## Key Features Implemented

✅ **Authentication System**: Complete login/register with sliding animation  
✅ **Dashboard**: Statistics cards and recent tasks overview  
✅ **Task Management**: Full CRUD operations with filtering  
✅ **Admin Panel**: User management and system overview  
✅ **Responsive Design**: Mobile-friendly interface  
✅ **Modern UI**: Custom CSS styling as requested  
✅ **API Integration**: Complete backend integration  
✅ **Route Protection**: Role-based access control  
✅ **Error Handling**: User-friendly error messages  
✅ **Loading States**: Visual feedback during operations  

## Environment Configuration

### Development
- **Frontend**: http://localhost:3001
- **Backend API**: https://task-management-backend-8obs.onrender.com

### Production
- **Frontend**: https://task-management-frontend-tau-three.vercel.app
- **Backend API**: https://task-management-backend-8obs.onrender.com

### Environment Variables
The application uses the following environment variables:

```
VITE_APP_API_URL=https://task-management-backend-8obs.onrender.com
```

This variable is set in both `.env` and `.env.production` files to ensure proper API routing in all environments.

## Notes

- No Vue DevTools are included as requested
- The CSS styling matches your provided design specifications
- All backend API endpoints are properly integrated
- The application includes proper error handling and loading states
- Admin features are only accessible to users with admin role
# Frontend Authentication Integration

## Overview

The frontend now includes a complete authentication system that integrates with the backend's extended authentication API. Users can sign up, log in, manage projects, and upload datasets.

## Features

### 🔐 Authentication
- **User Registration**: Create new accounts with username/password
- **User Login**: Secure JWT-based authentication
- **User Logout**: Clear session and redirect to login
- **Protected Routes**: Automatic redirect to login for unauthenticated users

### 📁 Project Management
- **Create Projects**: Add new projects to organize datasets
- **View Projects**: See all user projects with dataset counts
- **Project Details**: View datasets within each project

### 📊 Dataset Upload
- **CSV Upload**: Upload CSV files to specific projects
- **File Validation**: Ensure only CSV files are uploaded
- **Progress Feedback**: Real-time upload status
- **Project Association**: Datasets are linked to projects

## How to Use

### 1. Start the Backend
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3001`

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### 3. User Flow

#### First Time Users
1. **Sign Up**: Click "Sign up" on the login page
2. **Create Account**: Enter username (min 3 chars) and password (min 6 chars)
3. **Auto Login**: After successful signup, you're automatically logged in
4. **Create Project**: Click "New Project" to create your first project
5. **Upload Dataset**: Click "Upload CSV File" to add datasets to projects

#### Returning Users
1. **Login**: Enter your username and password
2. **View Projects**: See all your projects and their datasets
3. **Manage Data**: Create new projects or upload more datasets

## URL Navigation

- `#login` - Login page (default)
- `#signup` - Signup page
- `#profile` - Profile page (requires authentication)

## Components

### AuthContext (`src/contexts/AuthContext.tsx`)
- Global authentication state management
- API service for backend communication
- Login, signup, logout functions

### LoginPage (`src/components/LoginPage.tsx`)
- User login form
- Error handling and validation
- Link to signup page

### SignupPage (`src/components/SignupPage.tsx`)
- User registration form
- Client-side validation
- Password confirmation
- Link to login page

### ProfilePage (`src/components/ProfilePage.tsx`)
- User profile display
- Projects management
- Dataset upload interface
- Logout functionality

### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
- Route protection wrapper
- Automatic redirect to login
- Loading state handling

## API Integration

The frontend communicates with these backend endpoints:

- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile with projects
- `POST /projects/create` - Create new project
- `GET /projects` - List user projects
- `POST /uploadDataset` - Upload CSV file to project

## Error Handling

- **Network Errors**: Graceful handling of connection issues
- **Validation Errors**: Client-side form validation
- **Server Errors**: User-friendly error messages
- **Authentication Errors**: Automatic redirect to login

## Security Features

- **JWT Tokens**: Secure token-based authentication
- **Token Storage**: Safe localStorage management
- **Input Validation**: Both client and server-side validation
- **Protected Routes**: Automatic authentication checks

## Styling

- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, professional interface
- **Loading States**: Visual feedback during operations
- **Error States**: Clear error message display

## Testing

The backend includes comprehensive tests that verify:
- User registration and login
- Project creation and management
- Dataset upload functionality
- Authentication flow
- Error handling

Run tests with:
```bash
cd testing
node test-auth-extended.js
```

## Development Notes

- The app uses hash-based routing for simplicity
- Authentication state persists across page refreshes
- All API calls include proper error handling
- Components are fully typed with TypeScript
- CSS is organized by component for maintainability

## Next Steps

- Add React Router for more sophisticated routing
- Implement token refresh mechanism
- Add more dataset management features
- Enhance UI with animations and transitions
- Add user settings and preferences

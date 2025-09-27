# Backend API Testing

This directory contains comprehensive test scripts for the Data Science Copilot backend API.

## Prerequisites

1. **Backend Server Running**: Make sure the backend server is running on `http://localhost:3001`
   ```bash
   cd backend
   npm run dev
   ```

2. **Dependencies**: For the Node.js test script, install required packages:
   ```bash
   npm install form-data node-fetch
   ```

## Test Scripts

### 1. Node.js Test Script (Recommended)
**File**: `test-backend.js`

**Features**:
- ✅ Complete API endpoint testing
- ✅ File upload testing with actual CSV files
- ✅ Authentication flow testing
- ✅ Error handling and edge cases
- ✅ Colored console output
- ✅ Detailed test results and summary

**Usage**:
```bash
node test-backend.js
```

### 2. PowerShell Test Script (Windows)
**File**: `test-backend.ps1`

**Features**:
- ✅ Basic API endpoint testing
- ✅ Authentication flow testing
- ✅ Error handling
- ⚠️ Limited file upload testing (use Node.js script for full testing)

**Usage**:
```powershell
.\test-backend.ps1
```

## Test Coverage

The test scripts cover the following endpoints and scenarios:

### 🔍 **Health Check**
- `GET /health` - Server health verification

### 🔐 **Authentication**
- `POST /auth/login` - Login with fake credentials
- `GET /datasets` (unauthorized) - Unauthorized access protection
- `GET /datasets` (invalid token) - Invalid token rejection
- `GET /datasets` (missing token) - Missing token rejection

### 📁 **File Upload**
- `POST /uploadDataset` - CSV file upload with authentication
- File validation and storage verification
- Database metadata insertion

### 📋 **Dataset Management**
- `GET /datasets` - Retrieve user's uploaded datasets
- Dataset listing and metadata verification

### 💬 **Chat Endpoints**
- `POST /chat` - Basic chat functionality
- `POST /chat/stream` - Streaming chat (basic test)

## Sample Data

**File**: `sample-data.csv`

A sample CSV file with employee data for testing file upload functionality:
- 10 rows of data
- 5 columns: name, age, city, country, salary
- Various international locations and salary ranges

## Expected Test Results

When all tests pass, you should see:
- ✅ All endpoint tests passing
- 📁 File upload working with database storage
- 🔐 Authentication properly protecting endpoints
- 📋 Dataset retrieval working correctly

## Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   ❌ Server is not running. Please start the backend server first.
   ```
   **Solution**: Start the backend server with `cd backend && npm run dev`

2. **TypeScript Compilation Errors**
   ```
   TSError: ⨯ Unable to compile TypeScript
   ```
   **Solution**: The TypeScript issues have been fixed in the latest version

3. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   **Solution**: Kill existing processes on port 3001 or restart your terminal

4. **File Upload Issues**
   - Use the Node.js test script for full file upload testing
   - Ensure the backend server is running
   - Check that the uploads directory exists

### Manual Testing

You can also test endpoints manually:

#### 1. Health Check
```bash
curl http://localhost:3001/health
```

#### 2. Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

#### 3. Upload File (with token from login)
```bash
curl -X POST http://localhost:3001/uploadDataset \
  -H "Authorization: Bearer fake-jwt" \
  -F "file=@sample-data.csv"
```

#### 4. Get Datasets
```bash
curl -X GET http://localhost:3001/datasets \
  -H "Authorization: Bearer fake-jwt"
```

## API Documentation

### Authentication
All protected endpoints require the `Authorization: Bearer fake-jwt` header.

### File Upload
- **Content-Type**: `multipart/form-data`
- **Field Name**: `file`
- **File Types**: CSV files
- **Response**: Returns dataset metadata with fake row/column counts

### Database
- **Type**: SQLite
- **Location**: `backend/data/main.db`
- **Tables**: `users`, `datasets`

## Success Criteria

✅ **All tests should pass** for a fully functional backend
✅ **File uploads** should save files and store metadata
✅ **Authentication** should protect all endpoints
✅ **Database** should persist data correctly
✅ **Error handling** should return appropriate HTTP status codes

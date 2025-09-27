const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_CSV_CONTENT = `name,age,city,country,salary
John,25,New York,USA,50000
Jane,30,London,UK,60000
Bob,35,Paris,France,55000
Alice,28,Berlin,Germany,52000
Charlie,32,Tokyo,Japan,58000`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    if (details) {
      log(`   Details: ${details}`, 'red');
    }
  }
}

function logSection(title) {
  log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    const passed = response.status === 200 && data.status === 'ok';
    logTest('Health Check', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed;
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

async function testSignup() {
  try {
    const uniqueUsername = `testuser_${Date.now()}`;
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: uniqueUsername,
        password: 'testpassword'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.token && data.userId && data.username === uniqueUsername;
    logTest('Signup Endpoint', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Signup Endpoint', false, error.message);
    return null;
  }
}

async function testLogin() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'debuguser', // Use the user we created earlier
        password: 'debugpass'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 200 && data.token && data.userId && data.username === 'debuguser';
    logTest('Login Endpoint', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Login Endpoint', false, error.message);
    return null;
  }
}

async function testLogout(authToken) {
  try {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const passed = response.status === 200 && data.success === true;
    logTest('Logout Endpoint', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed;
  } catch (error) {
    logTest('Logout Endpoint', false, error.message);
    return false;
  }
}

async function testProfile(authToken) {
  try {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const passed = response.status === 200 && data.userId && data.username && Array.isArray(data.projects);
    logTest('Profile Endpoint', passed, passed ? `Found ${data.projects.length} projects` : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Profile Endpoint', false, error.message);
    return null;
  }
}

async function testCreateProject(authToken) {
  try {
    const response = await fetch(`${BASE_URL}/projects/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Project'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.projectId && data.name === 'Test Project';
    logTest('Create Project', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Create Project', false, error.message);
    return null;
  }
}

async function testGetProjects(authToken) {
  try {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const passed = response.status === 200 && Array.isArray(data);
    logTest('Get Projects', passed, passed ? `Found ${data.length} projects` : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Get Projects', false, error.message);
    return null;
  }
}

async function testFileUpload(authToken, projectId) {
  try {
    // Create test CSV file
    const testFilePath = './sample-data.csv';
    fs.writeFileSync(testFilePath, TEST_CSV_CONTENT);
    
    // Upload file
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('projectId', projectId);
    
    const response = await fetch(`${BASE_URL}/uploadDataset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: form
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.datasetId && data.name === 'sample-data.csv' && data.projectId === projectId;
    logTest('File Upload with Project', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return passed ? data : null;
  } catch (error) {
    logTest('File Upload with Project', false, error.message);
    return null;
  }
}

async function testGetDatasets(authToken, projectId) {
  try {
    const response = await fetch(`${BASE_URL}/projects/${projectId}/datasets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const passed = response.status === 200 && Array.isArray(data);
    logTest('Get Project Datasets', passed, passed ? `Found ${data.length} datasets` : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Get Project Datasets', false, error.message);
    return null;
  }
}

async function testInvalidCredentials() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'nonexistent',
        password: 'wrongpassword'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 401 && data.error === 'Invalid username or password';
    logTest('Invalid Credentials Rejection', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed;
  } catch (error) {
    logTest('Invalid Credentials Rejection', false, error.message);
    return false;
  }
}

async function testDuplicateSignup() {
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser', // Same username as before
        password: 'testpassword'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 409 && data.error === 'Username already exists';
    logTest('Duplicate Signup Rejection', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed;
  } catch (error) {
    logTest('Duplicate Signup Rejection', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log(`${colors.bold}${colors.blue}🚀 Starting Extended Backend API Tests${colors.reset}\n`);
  
  // Test 1: Health Check
  logSection('Health Check');
  const healthOk = await testHealthCheck();
  
  if (!healthOk) {
    log(`\n${colors.red}❌ Server is not running. Please start the backend server first.${colors.reset}`);
    log(`${colors.yellow}Run: cd backend && npm run dev${colors.reset}\n`);
    return;
  }
  
  // Test 2: Authentication Flow
  logSection('Authentication Flow');
  const signupData = await testSignup();
  const loginData = await testLogin();
  await testInvalidCredentials();
  await testDuplicateSignup();
  
  if (!loginData) {
    log(`\n${colors.red}❌ Authentication tests failed. Cannot proceed with other tests.${colors.reset}\n`);
    return;
  }
  
  const authToken = loginData.token;
  
  // Test 3: User Profile
  logSection('User Profile');
  const profileData = await testProfile(authToken);
  
  // Test 4: Project Management
  logSection('Project Management');
  const projectData = await testCreateProject(authToken);
  const projects = await testGetProjects(authToken);
  
  if (!projectData) {
    log(`\n${colors.red}❌ Project creation failed. Cannot proceed with dataset tests.${colors.reset}\n`);
    return;
  }
  
  // Test 5: Dataset Management
  logSection('Dataset Management');
  const uploadData = await testFileUpload(authToken, projectData.projectId);
  const datasets = await testGetDatasets(authToken, projectData.projectId);
  
  // Test 6: Logout
  logSection('Logout');
  await testLogout(authToken);
  
  // Test Summary
  logSection('Test Summary');
  log(`Total Tests: ${testResults.total}`, 'bold');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log(`\n${colors.green}🎉 All tests passed! Extended backend is working correctly.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  Some tests failed. Check the details above.${colors.reset}`);
  }
  
  // Additional Info
  logSection('API Endpoints Available');
  log(`Health Check: ${BASE_URL}/health`);
  log(`Signup: ${BASE_URL}/auth/signup`);
  log(`Login: ${BASE_URL}/auth/login`);
  log(`Logout: ${BASE_URL}/auth/logout`);
  log(`Profile: ${BASE_URL}/auth/profile`);
  log(`Create Project: ${BASE_URL}/projects/create`);
  log(`Get Projects: ${BASE_URL}/projects`);
  log(`Upload Dataset: ${BASE_URL}/uploadDataset`);
  log(`Get Datasets: ${BASE_URL}/datasets`);
  log(`Get Project Datasets: ${BASE_URL}/projects/:projectId/datasets`);
  
  if (uploadData) {
    log(`\n${colors.green}📁 Test file uploaded successfully:${colors.reset}`);
    log(`   Dataset ID: ${uploadData.datasetId}`);
    log(`   File Name: ${uploadData.name}`);
    log(`   Project ID: ${uploadData.projectId}`);
    log(`   Rows: ${uploadData.rows}`);
    log(`   Columns: ${uploadData.columns}`);
  }
  
  if (profileData && profileData.projects.length > 0) {
    log(`\n${colors.green}📋 User profile data:${colors.reset}`);
    log(`   User ID: ${profileData.userId}`);
    log(`   Username: ${profileData.username}`);
    log(`   Projects: ${profileData.projects.length}`);
    profileData.projects.forEach((project, index) => {
      log(`   ${index + 1}. ${project.name} (${project.datasetCount} datasets)`);
    });
  }
}

// Run tests
runAllTests().catch(console.error);

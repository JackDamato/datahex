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

async function testLogin() {
  try {
    // First try to login with existing user
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'debuguser',
        password: 'debugpass'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 200 && data.token && data.userId;
    logTest('Login Endpoint', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Login Endpoint', false, error.message);
    return null;
  }
}

async function testUnauthorizedAccess() {
  try {
    const response = await fetch(`${BASE_URL}/datasets`);
    const passed = response.status === 401;
    logTest('Unauthorized Access Protection', passed, passed ? '' : `Expected 401, got ${response.status}`);
    return passed;
  } catch (error) {
    // Expected to fail with 401
    const passed = error.message.includes('401') || error.message.includes('Unauthorized');
    logTest('Unauthorized Access Protection', passed, error.message);
    return passed;
  }
}

async function testFileUpload(authToken) {
  try {
    // First get user's projects to get a projectId
    const projectsResponse = await fetch(`${BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (projectsResponse.status !== 200) {
      logTest('File Upload', false, 'Could not get projects');
      return null;
    }
    
    const projects = await projectsResponse.json();
    if (!projects || projects.length === 0) {
      logTest('File Upload', false, 'No projects found for user');
      return null;
    }
    
    const projectId = projects[0].projectId;
    
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
    const passed = response.status === 201 && data.datasetId && data.name === 'sample-data.csv';
    logTest('File Upload', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return passed ? data : null;
  } catch (error) {
    logTest('File Upload', false, error.message);
    return null;
  }
}

async function testGetDatasets(authToken) {
  try {
    const response = await fetch(`${BASE_URL}/datasets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const passed = response.status === 200 && Array.isArray(data);
    logTest('Get Datasets', passed, passed ? `Found ${data.length} datasets` : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    return passed ? data : null;
  } catch (error) {
    logTest('Get Datasets', false, error.message);
    return null;
  }
}

async function testInvalidToken() {
  try {
    const response = await fetch(`${BASE_URL}/datasets`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const passed = response.status === 401;
    logTest('Invalid Token Rejection', passed, passed ? '' : `Expected 401, got ${response.status}`);
    return passed;
  } catch (error) {
    // Expected to fail with 401
    const passed = error.message.includes('401') || error.message.includes('Unauthorized');
    logTest('Invalid Token Rejection', passed, error.message);
    return passed;
  }
}

async function testMissingToken() {
  try {
    const response = await fetch(`${BASE_URL}/datasets`, {
      method: 'GET'
    });
    
    const passed = response.status === 401;
    logTest('Missing Token Rejection', passed, passed ? '' : `Expected 401, got ${response.status}`);
    return passed;
  } catch (error) {
    // Expected to fail with 401
    const passed = error.message.includes('401') || error.message.includes('Unauthorized');
    logTest('Missing Token Rejection', passed, error.message);
    return passed;
  }
}

async function testChatEndpoints() {
  try {
    // Test regular chat endpoint
    const chatResponse = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello, test message'
      })
    });
    
    const chatData = await chatResponse.json();
    const chatPassed = chatResponse.status === 200 && chatData.message;
    logTest('Chat Endpoint', chatPassed, chatPassed ? '' : `Status: ${chatResponse.status}, Data: ${JSON.stringify(chatData)}`);
    
    return chatPassed;
  } catch (error) {
    logTest('Chat Endpoint', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log(`${colors.bold}${colors.blue}🚀 Starting Backend API Tests${colors.reset}\n`);
  
  // Test 1: Health Check
  logSection('Health Check');
  const healthOk = await testHealthCheck();
  
  if (!healthOk) {
    log(`\n${colors.red}❌ Server is not running. Please start the backend server first.${colors.reset}`);
    log(`${colors.yellow}Run: cd backend && npm run dev${colors.reset}\n`);
    return;
  }
  
  // Test 2: Authentication
  logSection('Authentication Tests');
  const authData = await testLogin();
  await testUnauthorizedAccess();
  await testInvalidToken();
  await testMissingToken();
  
  if (!authData) {
    log(`\n${colors.red}❌ Authentication tests failed. Cannot proceed with other tests.${colors.reset}\n`);
    return;
  }
  
  // Test 3: File Upload
  logSection('File Upload Tests');
  const uploadData = await testFileUpload(authData.token);
  
  // Test 4: Dataset Management
  logSection('Dataset Management Tests');
  const datasets = await testGetDatasets(authData.token);
  
  // Test 5: Chat Endpoints
  logSection('Chat Endpoints Tests');
  await testChatEndpoints();
  
  // Test Summary
  logSection('Test Summary');
  log(`Total Tests: ${testResults.total}`, 'bold');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log(`\n${colors.green}🎉 All tests passed! Backend is working correctly.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  Some tests failed. Check the details above.${colors.reset}`);
  }
  
  // Additional Info
  logSection('API Endpoints Available');
  log(`Health Check: ${BASE_URL}/health`);
  log(`Login: ${BASE_URL}/auth/login`);
  log(`Upload Dataset: ${BASE_URL}/uploadDataset`);
  log(`Get Datasets: ${BASE_URL}/datasets`);
  log(`Chat: ${BASE_URL}/chat`);
  log(`Stream Chat: ${BASE_URL}/chat/stream`);
  
  if (uploadData) {
    log(`\n${colors.green}📁 Test file uploaded successfully:${colors.reset}`);
    log(`   Dataset ID: ${uploadData.datasetId}`);
    log(`   File Name: ${uploadData.name}`);
    log(`   Rows: ${uploadData.rows}`);
    log(`   Columns: ${uploadData.columns}`);
  }
  
  if (datasets && datasets.length > 0) {
    log(`\n${colors.green}📋 Datasets in database:${colors.reset}`);
    datasets.forEach((dataset, index) => {
      log(`   ${index + 1}. ${dataset.name} (${dataset.datasetId})`);
    });
  }
}

// Run tests
runAllTests().catch(console.error);

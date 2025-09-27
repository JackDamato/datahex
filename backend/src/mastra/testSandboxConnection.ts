import { mcpClient } from '../mcpClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Quick test to check if sandbox is running and accessible
 */
async function testSandboxConnection() {
  console.log('🔍 Testing Sandbox Connection...');
  console.log('================================');

  const sandboxUrl = process.env.SANDBOX_URL || 'http://localhost:8080';
  console.log(`📡 Sandbox URL: ${sandboxUrl}`);

  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const health = await mcpClient.healthCheck();
    console.log('   ✅ Sandbox is running!');
    console.log('   📊 Status:', health.status);
    console.log('   💬 Message:', health.message);

    // Test 2: Get tools
    console.log('\n2. Testing tools endpoint...');
    const tools = await mcpClient.getTools();
    console.log(`   ✅ Found ${tools.length} available tools:`);
    tools.forEach((tool, index) => {
      console.log(`      ${index + 1}. ${tool.name}: ${tool.description}`);
    });

    // Test 3: Test Python execution
    console.log('\n3. Testing Python execution...');
    const pythonResult = await mcpClient.executePython({
      code: "print('Hello from sandbox!'); print('Python is working correctly')"
    });
    console.log('   ✅ Python execution successful!');
    console.log('   📤 Output:', pythonResult.stdout);
    if (pythonResult.stderr) {
      console.log('   ⚠️ Warnings:', pythonResult.stderr);
    }

    // Test 4: Test data cleaning
    console.log('\n4. Testing data cleaning...');
    const cleanResult = await mcpClient.dropNulls({
      dataset_id: 'test-connection',
      columns: ['test_column']
    });
    console.log('   ✅ Data cleaning successful!');
    console.log('   📊 New dataset ID:', cleanResult.newDatasetId);
    console.log('   📈 Rows processed:', cleanResult.rows);

    console.log('\n🎉 All tests passed! Sandbox is fully functional.');
    console.log('================================================');
    console.log('✅ Health check: OK');
    console.log('✅ Tools available: OK');
    console.log('✅ Python execution: OK');
    console.log('✅ Data cleaning: OK');
    console.log('\n🚀 Your Mastra agents can now connect to the sandbox!');

  } catch (error: any) {
    console.error('\n❌ Sandbox connection failed!');
    console.error('================================');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Make sure the sandbox is running:');
    console.error('   cd sandbox && python app.py');
    console.error('2. Check if port 8080 is available');
    console.error('3. Verify the sandbox URL is correct');
    console.error('4. Check sandbox logs for errors');
  }
}

// Run the test
if (require.main === module) {
  testSandboxConnection().catch(console.error);
}

export { testSandboxConnection };

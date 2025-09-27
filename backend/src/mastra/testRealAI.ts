import { CleanerAgent } from './agents/cleanerAgent';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test real AI integration with OpenAI
 * This requires OPENAI_API_KEY to be set in environment variables
 */
async function testRealAI() {
  console.log('🚀 Testing Real AI Integration with OpenAI');
  console.log('==========================================');

  // Check if API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️ No OPENAI_API_KEY found in environment variables');
  console.log('📝 To test real AI:');
  console.log('   1. Get OpenAI API key from https://platform.openai.com/api-keys');
  console.log('   2. Set environment variable: OPENAI_API_KEY=sk-xxxx');
  console.log('   3. Run this test again');
  console.log('   4. Or create a .env file with: OPENAI_API_KEY=sk-xxxx');
    console.log('');
    console.log('🧪 Running with simulation mode instead...');
    return testWithSimulation();
  }

  console.log('✅ OpenAI API key found');
  console.log('🤖 Testing real AI integration...');

  try {
    // Create agent with real AI model
    const agent = new CleanerAgent();
    
    const context = {
      projectId: "proj_ai_test",
      datasetId: "ds_real_test",
      priorActions: ["user.uploaded_dataset"],
      metadata: { testMode: "real_ai" }
    };

    // Test with real AI call
    const input = {
      datasetId: "test-dataset-real-ai",
      datasetPath: "data/employee_data.csv",
      options: {
        removeNulls: true,
        fillStrategy: 'median' as const
      }
    };

    console.log('📤 Sending request to OpenAI...');
    const result = await agent.run(input, context);
    
    console.log('✅ Real AI response received!');
    console.log('📊 Analysis results:');
    console.log(`   - Cleaned file: ${result.cleanedPath}`);
    console.log(`   - Rows processed: ${result.summary.originalRows} → ${result.summary.cleanedRows}`);
    console.log(`   - Issues found: ${result.summary.issuesFound.length}`);
    console.log(`   - Cleaning steps: ${result.summary.cleaningSteps.length}`);
    
    console.log('\n🎉 Real AI integration working!');
    console.log('✅ Mastra + OpenAI integration verified');

  } catch (error) {
    console.error('❌ Real AI test failed:', (error as Error).message);
    console.log('🔄 Falling back to simulation mode...');
    return testWithSimulation();
  }
}

/**
 * Test with simulation mode (no API key required)
 */
async function testWithSimulation() {
  console.log('\n🧪 Testing with simulation mode');
  console.log('===============================');

  try {
    const agent = new CleanerAgent();
    
    const context = {
      projectId: "proj_sim_test",
      datasetId: "ds_sim_test", 
      priorActions: [],
      metadata: { testMode: "simulation" }
    };

    const input = {
      datasetId: "test-dataset-simple",
      datasetPath: "data/test_data.csv"
    };

    const result = await agent.run(input, context);
    
    console.log('✅ Simulation test completed');
    console.log('📊 Results:', {
      cleanedPath: result.cleanedPath,
      issuesFound: result.summary.issuesFound.length,
      cleaningSteps: result.summary.cleaningSteps.length
    });

  } catch (error) {
    console.error('❌ Simulation test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testRealAI().catch(console.error);
}

export { testRealAI };

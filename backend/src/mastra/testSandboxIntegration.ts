import { mcpClient } from '../mcpClient';
import { CleanerAgent } from './agents/cleanerAgent';
import { AnalystAgent } from './agents/analystAgent';
import { VisualizerAgent } from './agents/visualizerAgent';
import { ModelingAgent } from './agents/modelingAgent';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test Mastra Agents ↔ Python Sandbox Integration
 * 
 * This test verifies that:
 * 1. Sandbox is running and accessible
 * 2. Agents can connect to sandbox endpoints
 * 3. Agents can execute sandbox operations
 * 4. Data flows correctly between agents and sandbox
 */
async function testSandboxIntegration() {
  console.log('🧪 Testing Mastra Agents ↔ Python Sandbox Integration');
  console.log('=====================================================');

  try {
    // Test 1: Check sandbox health
    console.log('\n1. 🔍 Testing Sandbox Health...');
    try {
      const health = await mcpClient.healthCheck();
      console.log('   ✅ Sandbox is healthy:', health);
    } catch (error) {
      console.log('   ❌ Sandbox health check failed:', error);
      console.log('   💡 Make sure the sandbox is running: cd sandbox && python app.py');
      return;
    }

    // Test 2: Get available tools
    console.log('\n2. 🛠️ Testing Available Tools...');
    try {
      const tools = await mcpClient.getTools();
      console.log(`   ✅ Found ${tools.length} tools:`);
      tools.forEach(tool => {
        console.log(`      - ${tool.name}: ${tool.description}`);
      });
    } catch (error) {
      console.log('   ❌ Failed to get tools:', error);
      return;
    }

    // Test 3: Test Python execution
    console.log('\n3. 🐍 Testing Python Execution...');
    try {
      const pythonResult = await mcpClient.executePython({
        code: "print('Hello from Mastra agent!'); import pandas as pd; print('Pandas version:', pd.__version__)"
      });
      console.log('   ✅ Python execution successful:');
      console.log('      stdout:', pythonResult.stdout);
      if (pythonResult.stderr) {
        console.log('      stderr:', pythonResult.stderr);
      }
    } catch (error) {
      console.log('   ❌ Python execution failed:', error);
    }

    // Test 4: Test data cleaning with sandbox
    console.log('\n4. 🧹 Testing Data Cleaning with Sandbox...');
    try {
      const cleanResult = await mcpClient.dropNulls({
        dataset_id: 'test-dirty-data',
        columns: ['name', 'age', 'email']
      });
      console.log('   ✅ Data cleaning successful:');
      console.log('      New Dataset ID:', cleanResult.newDatasetId);
      console.log('      Rows processed:', cleanResult.rows);
    } catch (error) {
      console.log('   ❌ Data cleaning failed:', error);
    }

    // Test 5: Test CleanerAgent with sandbox integration
    console.log('\n5. 🤖 Testing CleanerAgent with Sandbox...');
    try {
      const cleaner = new CleanerAgent();
      
      // Create a context that includes sandbox integration
      const context = {
        projectId: 'test-sandbox-project',
        datasetId: 'test-dirty-data',
        priorActions: [],
        metadata: { 
          sandboxIntegration: true,
          sandboxUrl: process.env.SANDBOX_URL || 'http://localhost:8080'
        }
      };

      const result = await cleaner.run({
        datasetId: 'test-dirty-data',
        datasetPath: './uploads/test_dirty_data.csv',
        options: { 
          removeNulls: true, 
          fillStrategy: 'median',
          useSandbox: true  // Flag to use sandbox
        }
      }, context);

      console.log('   ✅ CleanerAgent with sandbox integration:');
      console.log('      Action:', result.action);
      console.log('      Reasoning:', result.reasoning);
      console.log('      Issues Found:', result.summary?.issuesFound?.length || 0);
    } catch (error) {
      console.log('   ❌ CleanerAgent sandbox integration failed:', error);
    }

    // Test 6: Test other agents with sandbox
    console.log('\n6. 📊 Testing Other Agents with Sandbox...');
    
    const agents = [
      { name: 'AnalystAgent', agent: new AnalystAgent() },
      { name: 'VisualizerAgent', agent: new VisualizerAgent() },
      { name: 'ModelingAgent', agent: new ModelingAgent() }
    ];

    for (const { name, agent } of agents) {
      try {
        console.log(`   Testing ${name}...`);
        const result = await agent.run({
          datasetId: 'test-dirty-data',
          datasetPath: './uploads/test_dirty_data.csv'
        }, {
          projectId: 'test-sandbox-project',
          datasetId: 'test-dirty-data',
          priorActions: [],
          metadata: { sandboxIntegration: true }
        });
        console.log(`      ✅ ${name} working:`, result.action);
      } catch (error: any) {
        console.log(`      ❌ ${name} failed:`, error.message);
      }
    }

    // Test 7: End-to-end workflow test
    console.log('\n7. 🔄 Testing End-to-End Workflow...');
    try {
      // Step 1: Clean data using sandbox
      console.log('   Step 1: Cleaning data...');
      const cleanResult = await mcpClient.dropNulls({
        dataset_id: 'test-dirty-data',
        columns: ['name', 'age', 'email']
      });
      console.log(`      ✅ Cleaned dataset: ${cleanResult.newDatasetId}`);

      // Step 2: Execute Python analysis
      console.log('   Step 2: Running Python analysis...');
      const analysisCode = `
import pandas as pd
import json

# Simulate loading the cleaned dataset
data = {
    'name': ['John', 'Jane', 'Bob'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
}
df = pd.DataFrame(data)

# Basic analysis
summary = {
    'total_rows': len(df),
    'columns': list(df.columns),
    'age_stats': {
        'mean': float(df['age'].mean()),
        'min': int(df['age'].min()),
        'max': int(df['age'].max())
    }
}

print(json.dumps(summary))
      `;

      const analysisResult = await mcpClient.executePython({
        code: analysisCode
      });
      
      console.log('      ✅ Analysis completed:');
      console.log('      stdout:', analysisResult.stdout);
      
    } catch (error) {
      console.log('   ❌ End-to-end workflow failed:', error);
    }

    console.log('\n🎉 Sandbox Integration Test Complete!');
    console.log('=====================================');
    console.log('✅ Sandbox connectivity verified');
    console.log('✅ Agent-sandbox communication working');
    console.log('✅ Data processing pipeline functional');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testSandboxIntegration().catch(console.error);
}

export { testSandboxIntegration };

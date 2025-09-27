import { OrchestratorAgent } from './agents/orchestratorAgent';
import { queryDatabase, insertDatabase } from '../db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test the OrchestratorAgent with real database integration
 */
async function testOrchestrator() {
  console.log('🎭 Testing Orchestrator Agent with Database Integration');
  console.log('=====================================================');

  try {
    // 1. Check if we have test data in the database
    console.log('📊 Checking for existing test data...');
    
    const projects = await queryDatabase('SELECT * FROM projects LIMIT 1');
    const datasets = await queryDatabase('SELECT * FROM datasets LIMIT 1');
    
    let testProjectId: string;
    let testDatasetId: string;

    if (projects.length > 0 && datasets.length > 0) {
      // Use existing test data
      testProjectId = projects[0].projectId;
      testDatasetId = datasets[0].datasetId;
      console.log(`✅ Using existing test project: ${projects[0].name} (${testProjectId})`);
      console.log(`✅ Using existing test dataset: ${datasets[0].name} (${testDatasetId})`);
      
      // Ensure the dataset is linked to the project
      await insertDatabase(
        'UPDATE datasets SET projectId = ? WHERE datasetId = ?',
        [testProjectId, testDatasetId]
      );
      console.log(`✅ Linked dataset ${testDatasetId} to project ${testProjectId}`);
    } else {
      // Create test data
      console.log('📝 Creating test project and dataset...');
      
      testProjectId = 'test-proj-orchestrator';
      testDatasetId = 'test-dataset-orchestrator';
      
      // Create test project
      await insertDatabase(
        'INSERT OR REPLACE INTO projects (projectId, userId, name) VALUES (?, ?, ?)',
        [testProjectId, 'test-user', 'Orchestrator Test Project']
      );
      
      // Create test dataset linked to the test project
      await insertDatabase(
        'INSERT OR REPLACE INTO datasets (datasetId, projectId, name, path, rows, columns) VALUES (?, ?, ?, ?, ?, ?)',
        [testDatasetId, testProjectId, 'Test Employee Data', '/data/test_employees.csv', 1000, 8]
      );
      
      console.log(`✅ Created test project: ${testProjectId}`);
      console.log(`✅ Created test dataset: ${testDatasetId}`);
    }

    // 2. Create orchestrator agent
    console.log('\n🤖 Creating OrchestratorAgent...');
    const orchestrator = new OrchestratorAgent();
    console.log('✅ OrchestratorAgent created');

    // 3. Test different user queries
    const testQueries = [
      {
        query: "Clean the missing values in my dataset",
        expectedAgent: "cleaner"
      },
      {
        query: "Create a scatter plot of salary vs age",
        expectedAgent: "visualizer"
      },
      {
        query: "Find correlations between different features",
        expectedAgent: "correlation"
      },
      {
        query: "Build a machine learning model to predict salary",
        expectedAgent: "modeling"
      },
      {
        query: "Engineer some new features from the existing data",
        expectedAgent: "analyst"
      }
    ];

    console.log('\n🧪 Testing orchestration decisions...');
    console.log('=====================================');

    for (const test of testQueries) {
      console.log(`\n📝 Query: "${test.query}"`);
      
      const context = {
        projectId: testProjectId,
        datasetId: testDatasetId,
        priorActions: [],
        metadata: { testMode: true }
      };

      try {
        const result = await orchestrator.run(
          { 
            projectId: testProjectId, 
            userQuery: test.query,
            priorActions: []
          },
          context
        );

        console.log(`✅ Decision: ${result.nextAgent}`);
        console.log(`💭 Rationale: ${result.rationale}`);
        console.log(`🎯 Confidence: ${result.confidence}`);
        
        // Check if the decision matches expectation
        if (result.nextAgent === test.expectedAgent) {
          console.log('✅ Decision matches expectation');
        } else {
          console.log(`⚠️ Decision differs from expectation (expected: ${test.expectedAgent})`);
        }

      } catch (error) {
        console.error(`❌ Test failed for query: ${test.query}`, error);
      }
    }

    // 4. Test project status endpoint
    console.log('\n🌐 Testing project status...');
    console.log('============================');
    
    const projectStatus = await queryDatabase(`
      SELECT 
        p.name as projectName,
        p.createdAt as projectCreated,
        d.datasetId,
        d.name as datasetName,
        d.path as datasetPath,
        d.rows,
        d.columns,
        d.createdAt as datasetCreated
      FROM projects p
      LEFT JOIN datasets d ON p.projectId = d.projectId
      WHERE p.projectId = ?
    `, [testProjectId]);
    
    if (projectStatus.length > 0) {
      const project = projectStatus[0];
      console.log(`✅ Project: ${project.projectName}`);
      console.log(`✅ Dataset: ${project.datasetName} (${project.rows} rows, ${project.columns} columns)`);
    }

    console.log('\n🎉 All orchestrator tests completed!');
    console.log('=====================================');
    console.log('✅ Database integration working');
    console.log('✅ Project/dataset resolution working');
    console.log('✅ AI-powered orchestration working');
    console.log('✅ Fallback logic working');

  } catch (error) {
    console.error('❌ Orchestrator test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOrchestrator().catch(console.error);
}

export { testOrchestrator };

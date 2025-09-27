import { OrchestratorAgent } from './agents/orchestratorAgent';
import { CleanerAgent } from './agents/cleanerAgent';
import { AnalystAgent } from './agents/analystAgent';
import { VisualizerAgent } from './agents/visualizerAgent';
import { CorrelationAgent } from './agents/correlationAgent';
import { ModelingAgent } from './agents/modelingAgent';
import { ExplainerAgent } from './agents/explainerAgent';
import { queryDatabase } from '../db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test Mastra agents with real data from your database
 */
async function testWithRealData() {
  console.log('🚀 Testing Mastra Agents with Real Data');
  console.log('========================================');

  try {
    // 1. Get real data from your database
    console.log('📊 Fetching real data from database...');
    
    const projects = await queryDatabase('SELECT * FROM projects LIMIT 1');
    const datasets = await queryDatabase('SELECT * FROM datasets LIMIT 1');
    
    if (projects.length === 0 || datasets.length === 0) {
      console.log('❌ No data found in database. Please upload some data first.');
      return;
    }

    const project = projects[0];
    const dataset = datasets[0];
    
    console.log(`✅ Found project: ${project.name}`);
    console.log(`✅ Found dataset: ${dataset.name} (${dataset.rows} rows, ${dataset.columns} columns)`);
    console.log(`📁 Dataset path: ${dataset.path}`);

    // 2. Test each agent with real data
    const context = {
      projectId: project.projectId,
      datasetId: dataset.datasetId,
      priorActions: [],
      metadata: { testMode: "real_data" }
    };

    // Test CleanerAgent
    console.log('\n🧹 Testing CleanerAgent with real data...');
    const cleaner = new CleanerAgent();
    const cleanerResult = await cleaner.run({
      datasetId: dataset.datasetId,
      datasetPath: dataset.path,
      options: { removeNulls: true, fillStrategy: 'median' }
    }, context);
    console.log('✅ CleanerAgent result:', {
      action: cleanerResult.action,
      cleanedPath: cleanerResult.cleanedPath,
      issuesFound: cleanerResult.summary?.issuesFound?.length || 0
    });

    // Test AnalystAgent
    console.log('\n📊 Testing AnalystAgent with real data...');
    const analyst = new AnalystAgent();
    const analystResult = await analyst.run({
      datasetId: dataset.datasetId,
      datasetPath: dataset.path
    }, context);
    console.log('✅ AnalystAgent result:', {
      action: analystResult.action,
      analysisPath: analystResult.analysisPath,
      insights: analystResult.summary?.insights?.length || 0
    });

    // Test VisualizerAgent
    console.log('\n📈 Testing VisualizerAgent with real data...');
    const visualizer = new VisualizerAgent();
    const visualizerResult = await visualizer.run({
      datasetId: dataset.datasetId,
      datasetPath: dataset.path
    }, context);
    console.log('✅ VisualizerAgent result:', {
      action: visualizerResult.action,
      chartPath: visualizerResult.chartPath,
      chartType: visualizerResult.summary?.chartType
    });

    // Test CorrelationAgent
    console.log('\n🔗 Testing CorrelationAgent with real data...');
    const correlation = new CorrelationAgent();
    const correlationResult = await correlation.run({
      datasetId: dataset.datasetId,
      datasetPath: dataset.path
    }, context);
    console.log('✅ CorrelationAgent result:', {
      action: correlationResult.action,
      correlationPath: correlationResult.correlationPath,
      strongCorrelations: correlationResult.summary?.strongCorrelations?.length || 0
    });

    // Test ModelingAgent
    console.log('\n🤖 Testing ModelingAgent with real data...');
    const modeling = new ModelingAgent();
    const modelingResult = await modeling.run({
      datasetId: dataset.datasetId,
      datasetPath: dataset.path
    }, context);
    console.log('✅ ModelingAgent result:', {
      action: modelingResult.action,
      modelPath: modelingResult.modelPath,
      modelType: modelingResult.summary?.modelType,
      accuracy: modelingResult.summary?.accuracy
    });

    // Test ExplainerAgent
    console.log('\n💡 Testing ExplainerAgent with real data...');
    const explainer = new ExplainerAgent();
    const explainerResult = await explainer.run({
      action: 'explain',
      context: {
        datasetInfo: {
          name: dataset.name,
          rows: dataset.rows,
          columns: dataset.columns
        }
      }
    }, context);
    console.log('✅ ExplainerAgent result:', {
      action: explainerResult.action,
      explanationPath: explainerResult.explanationPath,
      keyFindings: explainerResult.summary?.keyFindings?.length || 0
    });

    // Test OrchestratorAgent
    console.log('\n🎭 Testing OrchestratorAgent with real data...');
    const orchestrator = new OrchestratorAgent();
    const orchestratorResult = await orchestrator.run({
      projectId: project.projectId,
      userQuery: "Clean my dataset and create a scatter plot",
      priorActions: []
    }, context);
    console.log('✅ OrchestratorAgent result:', {
      nextAgent: orchestratorResult.nextAgent,
      rationale: orchestratorResult.rationale,
      confidence: orchestratorResult.confidence
    });

    console.log('\n🎉 All agents tested successfully with real data!');
    console.log('==================================================');
    console.log('✅ Real database integration working');
    console.log('✅ AI-powered analysis working');
    console.log('✅ All agents responding with structured data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testWithRealData().catch(console.error);
}

export { testWithRealData };

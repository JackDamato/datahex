# Mastra Agents Testing Suite

Comprehensive testing framework for all 7 Mastra agents with orchestration, integration, and performance testing.

## 🧪 Test Suites

### 1. **testAllAgents.ts** - Comprehensive Agent Testing
Tests all 7 agents with realistic input scenarios and validates output structures.

**Features:**
- Tests each agent with multiple input variations
- Validates output schema compliance
- Performance timing and error tracking
- Comprehensive reporting with success rates

**Usage:**
```bash
cd backend
npx ts-node src/mastra/testing/testAllAgents.ts
```

### 2. **testOrchestrator.ts** - Orchestrator-Specific Testing
Dedicated testing for the OrchestratorAgent's routing logic and clarification detection.

**Features:**
- Tests agent routing for different query types
- Validates clarification detection accuracy
- Tests multi-step workflow scenarios
- Edge case and ambiguous query handling

**Usage:**
```bash
npx ts-node src/mastra/testing/testOrchestrator.ts
```

### 3. **testIndividualAgents.ts** - Individual Agent Testing
Tests each agent's specific capabilities and output formats in isolation.

**Features:**
- Agent-specific input/output validation
- Capability testing for each domain
- Output structure validation
- Performance benchmarking per agent

**Usage:**
```bash
npx ts-node src/mastra/testing/testIndividualAgents.ts
```

### 4. **testAgentIntegration.ts** - Integration Testing
Tests agent-to-agent communication and workflow orchestration.

**Features:**
- Multi-agent workflow testing
- Context propagation validation
- Agent registry functionality testing
- Error handling and recovery testing

**Usage:**
```bash
npx ts-node src/mastra/testing/testAgentIntegration.ts
```

### 5. **testRunner.ts** - Master Test Runner
Orchestrates all test suites and provides comprehensive reporting.

**Features:**
- Runs all test suites in sequence
- Master reporting with performance insights
- Focused testing options
- CLI interface for selective testing

**Usage:**
```bash
# Run all tests
npx ts-node src/mastra/testing/testRunner.ts

# Run specific suite
npx ts-node src/mastra/testing/testRunner.ts suite "Orchestrator Tests"

# Run focused tests
npx ts-node src/mastra/testing/testRunner.ts focus orchestrator
```

## 🚀 Quick Start

### Run All Tests
```bash
cd backend
npx ts-node src/mastra/testing/testRunner.ts
```

### Run Specific Test Suite
```bash
# Orchestrator tests only
npx ts-node src/mastra/testing/testRunner.ts focus orchestrator

# Individual agent tests only
npx ts-node src/mastra/testing/testRunner.ts focus individual

# Integration tests only
npx ts-node src/mastra/testing/testRunner.ts focus integration
```

### Run Individual Test Files
```bash
# Test all agents comprehensively
npx ts-node src/mastra/testing/testAllAgents.ts

# Test orchestrator routing
npx ts-node src/mastra/testing/testOrchestrator.ts

# Test individual agent capabilities
npx ts-node src/mastra/testing/testIndividualAgents.ts

# Test agent integration
npx ts-node src/mastra/testing/testAgentIntegration.ts
```

## 📊 Test Coverage

### Agent Coverage
- ✅ **OrchestratorAgent** - Routing, clarification, agent selection
- ✅ **CleanerAgent** - Data cleaning, null handling, type conversion
- ✅ **AnalystAgent** - Statistical analysis, distribution analysis
- ✅ **VisualizerAgent** - Chart recommendations, visualization logic
- ✅ **CorrelationAgent** - Correlation analysis, relationship detection
- ✅ **ModelingAgent** - Model recommendations, problem type detection
- ✅ **ExplainerAgent** - Result interpretation, stakeholder communication

### Test Types
- ✅ **Unit Tests** - Individual agent functionality
- ✅ **Integration Tests** - Agent-to-agent workflows
- ✅ **Routing Tests** - Orchestrator decision making
- ✅ **Error Handling** - Graceful failure and recovery
- ✅ **Performance Tests** - Response time and efficiency
- ✅ **Schema Validation** - Input/output format compliance

## 📈 Test Scenarios

### Data Science Workflows
1. **Data Cleaning Pipeline** - Clean → Analyze → Visualize
2. **Analysis Pipeline** - Analyze → Correlate → Model
3. **Complete Pipeline** - Clean → Analyze → Visualize → Correlate → Model → Explain
4. **Business Analysis** - Analyze → Visualize → Explain

### Edge Cases
- Vague or ambiguous queries
- Missing or invalid input data
- Malformed requests
- Agent registry failures
- Context propagation issues

### Performance Scenarios
- Large dataset handling
- Complex multi-step workflows
- Concurrent agent execution
- Memory and resource usage

## 🔧 Test Configuration

### Environment Setup
Tests use mock data and fallback mechanisms, so they can run without:
- OpenAI API key (uses fallbacks)
- Real database connections (uses test data)
- External dependencies (uses mocks)

### Test Data
- Mock datasets with realistic structures
- Sample project and dataset IDs
- Simulated analysis results
- Test context and metadata

## 📋 Expected Outputs

### Successful Test Run
```
🧪 Starting comprehensive agent testing...

🎭 Testing OrchestratorAgent...
  🔍 Data cleaning request...
    ✅ Success (245ms)
    📤 Output: {"action": "dispatch", "targetAgent": "cleaner", ...}

📊 TEST SUMMARY REPORT
==================================================
Total Tests: 35
Successful: 33 ✅
Failed: 2 ❌
Success Rate: 94.3%
```

### Test Results Interpretation
- **✅ Success** - Agent processed input and returned valid output
- **❌ Failure** - Agent failed to process or returned invalid output
- **⚠️ Warning** - Agent succeeded but with fallback mechanisms
- **📊 Performance** - Response time and efficiency metrics

## 🐛 Troubleshooting

### Common Issues

1. **"Agent not found in registry"**
   - Ensure agentRegistry.ts is properly configured
   - Check agent imports and exports

2. **"OpenAI client not available"**
   - This is expected in test mode
   - Tests use fallback mechanisms

3. **"Invalid output structure"**
   - Check agent output schema compliance
   - Verify agent.run() method implementation

4. **"TypeScript compilation errors"**
   - Ensure all dependencies are installed
   - Check TypeScript configuration

### Debug Mode
Add `DEBUG=true` to see detailed logging:
```bash
DEBUG=true npx ts-node src/mastra/testing/testRunner.ts
```

## 🎯 Continuous Integration

### Automated Testing
Tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Deterministic test results
- Comprehensive error reporting
- Performance benchmarking

### Test Reports
Generate detailed test reports:
```bash
npx ts-node src/mastra/testing/testRunner.ts > test-results.log 2>&1
```

## 🔮 Future Enhancements

- [ ] Load testing with concurrent requests
- [ ] Mock Python sandbox integration
- [ ] Real-time test monitoring dashboard
- [ ] Automated test data generation
- [ ] Performance regression detection
- [ ] Test coverage metrics

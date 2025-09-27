import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { AgentTestRunner } from './testAllAgents';
import { OrchestratorTester } from './testOrchestrator';
import { IndividualAgentTester } from './testIndividualAgents';
import { AgentIntegrationTester } from './testAgentIntegration';

/**
 * Master test runner for all Mastra agent tests
 * Orchestrates all test suites and provides comprehensive reporting
 */

interface TestSuite {
  name: string;
  description: string;
  runner: () => Promise<void>;
}

class MasterTestRunner {
  private testSuites: TestSuite[] = [];
  private results: {
    suite: string;
    startTime: number;
    endTime?: number;
    success: boolean;
    error?: string;
  }[] = [];

  constructor() {
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    this.testSuites = [
      {
        name: 'Orchestrator Tests',
        description: 'Tests orchestrator routing, clarification detection, and agent selection',
        runner: async () => {
          const tester = new OrchestratorTester();
          await tester.runAllTests();
          await tester.testRoutingScenarios();
          await tester.testClarificationDetection();
        }
      },
      {
        name: 'Individual Agent Tests',
        description: 'Tests each agent\'s specific capabilities and output formats',
        runner: async () => {
          const tester = new IndividualAgentTester();
          await tester.runAllIndividualTests();
        }
      },
      {
        name: 'Agent Integration Tests',
        description: 'Tests agent-to-agent communication and workflow orchestration',
        runner: async () => {
          const tester = new AgentIntegrationTester();
          await tester.runCompleteIntegrationTestSuite();
        }
      },
      {
        name: 'Comprehensive Agent Tests',
        description: 'Tests all agents with realistic scenarios and edge cases',
        runner: async () => {
          const tester = new AgentTestRunner();
          await tester.runAllTests();
        }
      }
    ];
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Master Test Suite for Mastra Agents');
    console.log('='.repeat(60));
    console.log(`📅 Test Run: ${new Date().toISOString()}`);
    console.log(`🎯 Test Suites: ${this.testSuites.length}`);
    console.log('');

    const overallStartTime = Date.now();

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    const overallEndTime = Date.now();
    this.generateMasterReport(overallStartTime, overallEndTime);
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    const startTime = Date.now();
    
    console.log(`\n🧪 Running ${suite.name}`);
    console.log(`📝 ${suite.description}`);
    console.log('-'.repeat(50));

    try {
      await suite.runner();
      
      this.results.push({
        suite: suite.name,
        startTime,
        endTime: Date.now(),
        success: true
      });
      
      console.log(`\n✅ ${suite.name} completed successfully`);
      
    } catch (error: any) {
      this.results.push({
        suite: suite.name,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error.message
      });
      
      console.log(`\n❌ ${suite.name} failed: ${error.message}`);
    }
  }

  private generateMasterReport(startTime: number, endTime: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MASTER TEST REPORT');
    console.log('='.repeat(60));
    
    const totalDuration = endTime - startTime;
    const successfulSuites = this.results.filter(r => r.success).length;
    const failedSuites = this.results.length - successfulSuites;
    
    console.log(`📅 Test Run Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`🎯 Total Test Suites: ${this.results.length}`);
    console.log(`✅ Successful Suites: ${successfulSuites}`);
    console.log(`❌ Failed Suites: ${failedSuites}`);
    console.log(`📈 Success Rate: ${((successfulSuites / this.results.length) * 100).toFixed(1)}%`);
    
    console.log('\n📋 SUITE BREAKDOWN:');
    console.log('-'.repeat(40));
    
    this.results.forEach(result => {
      const duration = result.endTime ? result.endTime - result.startTime : 0;
      const status = result.success ? '✅' : '❌';
      const durationStr = this.formatDuration(duration);
      
      console.log(`${status} ${result.suite}`);
      console.log(`   Duration: ${durationStr}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    if (failedSuites > 0) {
      console.log('\n🚨 FAILED SUITES:');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   ❌ ${result.suite}: ${result.error}`);
        });
    }
    
    console.log('\n🎉 Test execution completed!');
    
    // Performance insights
    this.generatePerformanceInsights();
  }

  private generatePerformanceInsights(): void {
    console.log('\n⚡ PERFORMANCE INSIGHTS:');
    console.log('-'.repeat(30));
    
    const durations = this.results
      .filter(r => r.endTime)
      .map(r => r.endTime! - r.startTime);
    
    if (durations.length > 0) {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      
      console.log(`📊 Average Suite Duration: ${this.formatDuration(avgDuration)}`);
      console.log(`🚀 Fastest Suite: ${this.formatDuration(minDuration)}`);
      console.log(`🐌 Slowest Suite: ${this.formatDuration(maxDuration)}`);
      
      const slowSuites = this.results.filter(r => 
        r.endTime && (r.endTime - r.startTime) > avgDuration * 1.5
      );
      
      if (slowSuites.length > 0) {
        console.log('\n⚠️ SLOW SUITES (>150% of average):');
        slowSuites.forEach(suite => {
          const duration = suite.endTime! - suite.startTime;
          console.log(`   🐌 ${suite.suite}: ${this.formatDuration(duration)}`);
        });
      }
    }
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }

  // Run specific test suite
  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => 
      s.name.toLowerCase().includes(suiteName.toLowerCase())
    );
    
    if (!suite) {
      console.log(`❌ Test suite '${suiteName}' not found`);
      console.log('Available suites:');
      this.testSuites.forEach(s => console.log(`   - ${s.name}`));
      return;
    }
    
    console.log(`🎯 Running specific test suite: ${suite.name}`);
    await this.runTestSuite(suite);
  }

  // Run tests with specific focus
  async runFocusedTests(focus: 'orchestrator' | 'individual' | 'integration' | 'comprehensive'): Promise<void> {
    console.log(`🎯 Running focused tests: ${focus}`);
    
    switch (focus) {
      case 'orchestrator':
        await this.runSpecificSuite('Orchestrator Tests');
        break;
      case 'individual':
        await this.runSpecificSuite('Individual Agent Tests');
        break;
      case 'integration':
        await this.runSpecificSuite('Agent Integration Tests');
        break;
      case 'comprehensive':
        await this.runSpecificSuite('Comprehensive Agent Tests');
        break;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new MasterTestRunner();
  
  if (args.length === 0) {
    // Run all tests
    runner.runAllTests().catch(console.error);
  } else {
    const command = args[0];
    const target = args[1];
    
    switch (command) {
      case 'suite':
        runner.runSpecificSuite(target || '').catch(console.error);
        break;
      case 'focus':
        runner.runFocusedTests(target as any || 'comprehensive').catch(console.error);
        break;
      case 'help':
        console.log('Usage:');
        console.log('  npm run test:mastra                    # Run all tests');
        console.log('  npm run test:mastra suite <name>       # Run specific suite');
        console.log('  npm run test:mastra focus <type>       # Run focused tests');
        console.log('');
        console.log('Available focuses: orchestrator, individual, integration, comprehensive');
        break;
      default:
        console.log('Unknown command. Use "help" for usage information.');
    }
  }
}

export { MasterTestRunner };

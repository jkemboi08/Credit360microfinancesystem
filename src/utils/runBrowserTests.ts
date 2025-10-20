/**
 * Browser-based Test Runner
 * Executes data integrity tests directly in the browser environment
 */

import { dataIntegrityTester } from './dataIntegrityTester';
import { pageDataTester } from './pageDataTester';

export interface BrowserTestResults {
  timestamp: string;
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    successRate: number;
  };
  testSuites: any[];
  criticalIssues: string[];
  recommendations: string[];
}

export class BrowserTestRunner {
  private results: BrowserTestResults | null = null;

  /**
   * Run all data integrity tests
   */
  async runAllTests(): Promise<BrowserTestResults> {
    console.log('🚀 Starting Browser-based Data Integrity Tests');
    console.log('=' * 60);

    const startTime = Date.now();

    try {
      // Run comprehensive data integrity tests
      const dataIntegrityResults = await dataIntegrityTester.runComprehensiveTests();
      
      // Run page-specific tests
      const pageTestResults = await pageDataTester.runAllPageTests();

      // Combine results
      const allTestSuites = [...dataIntegrityResults, ...pageTestResults];

      // Calculate summary
      const totalTests = allTestSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
      const totalPassed = allTestSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
      const totalFailed = allTestSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
      const totalSkipped = allTestSuites.reduce((sum, suite) => sum + suite.skippedTests, 0);

      this.results = {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          totalPassed,
          totalFailed,
          totalSkipped,
          successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
        },
        testSuites: allTestSuites,
        criticalIssues: this.identifyCriticalIssues(allTestSuites),
        recommendations: this.generateRecommendations(allTestSuites, totalFailed)
      };

      const duration = Date.now() - startTime;
      console.log(`\n✅ Test execution completed in ${duration}ms`);
      console.log(`📊 Results: ${totalPassed}/${totalTests} tests passed (${this.results.summary.successRate.toFixed(1)}%)`);

      return this.results;

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  /**
   * Run quick smoke tests
   */
  async runQuickTests(): Promise<BrowserTestResults> {
    console.log('⚡ Running Quick Smoke Tests');
    console.log('=' * 40);

    const startTime = Date.now();

    try {
      // Run only essential tests
      const dataIntegrityResults = await dataIntegrityTester.runComprehensiveTests();
      
      // Calculate summary
      const totalTests = dataIntegrityResults.reduce((sum, suite) => sum + suite.totalTests, 0);
      const totalPassed = dataIntegrityResults.reduce((sum, suite) => sum + suite.passedTests, 0);
      const totalFailed = dataIntegrityResults.reduce((sum, suite) => sum + suite.failedTests, 0);
      const totalSkipped = dataIntegrityResults.reduce((sum, suite) => sum + suite.skippedTests, 0);

      this.results = {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          totalPassed,
          totalFailed,
          totalSkipped,
          successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
        },
        testSuites: dataIntegrityResults,
        criticalIssues: this.identifyCriticalIssues(dataIntegrityResults),
        recommendations: this.generateRecommendations(dataIntegrityResults, totalFailed)
      };

      const duration = Date.now() - startTime;
      console.log(`\n✅ Quick tests completed in ${duration}ms`);
      console.log(`📊 Results: ${totalPassed}/${totalTests} tests passed (${this.results.summary.successRate.toFixed(1)}%)`);

      return this.results;

    } catch (error) {
      console.error('❌ Quick test execution failed:', error);
      throw error;
    }
  }

  /**
   * Test specific page data flows
   */
  async testSpecificPage(pageName: string): Promise<BrowserTestResults> {
    console.log(`🎯 Testing specific page: ${pageName}`);
    console.log('=' * 40);

    try {
      let pageTestResults: any[] = [];

      switch (pageName.toLowerCase()) {
        case 'client':
        case 'clients':
          pageTestResults = [await pageDataTester.testClientManagementPages()];
          break;
        case 'loan':
        case 'loans':
          pageTestResults = [await pageDataTester.testLoanManagementPages()];
          break;
        case 'expense':
        case 'expenses':
          pageTestResults = [await pageDataTester.testExpenseManagementPages()];
          break;
        case 'staff':
        case 'employees':
          pageTestResults = [await pageDataTester.testStaffManagementPages()];
          break;
        case 'savings':
          pageTestResults = [await pageDataTester.testSavingsManagementPages()];
          break;
        default:
          throw new Error(`Unknown page: ${pageName}`);
      }

      // Calculate summary
      const totalTests = pageTestResults.reduce((sum, suite) => sum + suite.totalTests, 0);
      const totalPassed = pageTestResults.reduce((sum, suite) => sum + suite.passedTests, 0);
      const totalFailed = pageTestResults.reduce((sum, suite) => sum + suite.failedTests, 0);
      const totalSkipped = pageTestResults.reduce((sum, suite) => sum + suite.skippedTests, 0);

      this.results = {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          totalPassed,
          totalFailed,
          totalSkipped,
          successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
        },
        testSuites: pageTestResults,
        criticalIssues: this.identifyCriticalIssues(pageTestResults),
        recommendations: this.generateRecommendations(pageTestResults, totalFailed)
      };

      console.log(`\n✅ Page test completed for ${pageName}`);
      console.log(`📊 Results: ${totalPassed}/${totalTests} tests passed (${this.results.summary.successRate.toFixed(1)}%)`);

      return this.results;

    } catch (error) {
      console.error(`❌ Page test failed for ${pageName}:`, error);
      throw error;
    }
  }

  /**
   * Identify critical issues from test results
   */
  private identifyCriticalIssues(testSuites: any[]): string[] {
    const issues: string[] = [];

    const failedTests = testSuites.flatMap(suite => 
      suite.tests.filter((test: any) => test.status === 'failed')
    );

    // Database connection issues
    const dbIssues = failedTests.filter((test: any) => 
      test.testName.toLowerCase().includes('database') || 
      test.testName.toLowerCase().includes('connection')
    );
    if (dbIssues.length > 0) {
      issues.push(`Database connectivity issues detected (${dbIssues.length} tests failed)`);
    }

    // Data integrity issues
    const integrityIssues = failedTests.filter((test: any) => 
      test.testName.toLowerCase().includes('integrity') || 
      test.testName.toLowerCase().includes('consistency')
    );
    if (integrityIssues.length > 0) {
      issues.push(`Data integrity issues detected (${integrityIssues.length} tests failed)`);
    }

    // Performance issues
    const performanceIssues = failedTests.filter((test: any) => 
      test.testName.toLowerCase().includes('performance') || 
      test.testName.toLowerCase().includes('query')
    );
    if (performanceIssues.length > 0) {
      issues.push(`Performance issues detected (${performanceIssues.length} tests failed)`);
    }

    // Page-specific issues
    const pageIssues = failedTests.filter((test: any) => test.page);
    if (pageIssues.length > 0) {
      issues.push(`Page-specific data flow issues detected (${pageIssues.length} tests failed)`);
    }

    return issues;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(testSuites: any[], totalFailed: number): string[] {
    const recommendations: string[] = [];

    if (totalFailed === 0) {
      recommendations.push('✅ All tests passed! System is functioning correctly.');
      recommendations.push('🔄 Consider running these tests regularly as part of your development workflow.');
      recommendations.push('📈 Monitor system performance and data integrity over time.');
    } else {
      recommendations.push(`🔧 Fix the ${totalFailed} failed test(s) before deployment.`);
      recommendations.push('📝 Review error messages for specific issues and root causes.');
      recommendations.push('🧪 Re-run tests after fixes to ensure resolution.');
      
      const failedTests = testSuites.flatMap(suite => 
        suite.tests.filter((test: any) => test.status === 'failed')
      );

      const performanceIssues = failedTests.filter((test: any) => 
        test.testName.toLowerCase().includes('performance')
      );
      if (performanceIssues.length > 0) {
        recommendations.push('⚡ Optimize database queries and consider adding indexes for better performance.');
      }

      const integrityIssues = failedTests.filter((test: any) => 
        test.testName.toLowerCase().includes('integrity')
      );
      if (integrityIssues.length > 0) {
        recommendations.push('🔗 Review and fix referential integrity constraints in the database.');
      }

      const pageIssues = failedTests.filter((test: any) => test.page);
      if (pageIssues.length > 0) {
        recommendations.push('📄 Review page-specific data flows, form validations, and user interactions.');
      }
    }

    return recommendations;
  }

  /**
   * Get current test results
   */
  getResults(): BrowserTestResults | null {
    return this.results;
  }

  /**
   * Export results as JSON
   */
  exportResults(): string {
    if (!this.results) {
      throw new Error('No test results available. Run tests first.');
    }

    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Download results as file
   */
  downloadResults(filename?: string): void {
    if (!this.results) {
      throw new Error('No test results available. Run tests first.');
    }

    const data = this.exportResults();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(): string {
    if (!this.results) {
      throw new Error('No test results available. Run tests first.');
    }

    let markdown = `# Data Integrity Test Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${this.results.summary.totalTests}\n`;
    markdown += `- **Passed:** ${this.results.summary.totalPassed} (${this.results.summary.successRate.toFixed(1)}%)\n`;
    markdown += `- **Failed:** ${this.results.summary.totalFailed}\n`;
    markdown += `- **Skipped:** ${this.results.summary.totalSkipped}\n\n`;

    if (this.results.criticalIssues.length > 0) {
      markdown += `## Critical Issues\n\n`;
      this.results.criticalIssues.forEach(issue => {
        markdown += `- ⚠️ ${issue}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Test Suites\n\n`;
    this.results.testSuites.forEach(suite => {
      const passed = suite.passedTests;
      const failed = suite.failedTests;
      const skipped = suite.skippedTests;
      const successRate = ((passed / suite.totalTests) * 100).toFixed(1);
      
      markdown += `### ${suite.name}\n\n`;
      markdown += `- **Tests:** ${suite.totalTests}\n`;
      markdown += `- **Passed:** ${passed}\n`;
      markdown += `- **Failed:** ${failed}\n`;
      markdown += `- **Skipped:** ${skipped}\n`;
      markdown += `- **Success Rate:** ${successRate}%\n\n`;
      
      if (failed > 0) {
        markdown += `#### Failed Tests\n\n`;
        suite.tests.filter((test: any) => test.status === 'failed').forEach((test: any) => {
          markdown += `- **${test.testName}:** ${test.message}\n`;
          if (test.error) {
            markdown += `  - Error: ${test.error}\n`;
          }
        });
        markdown += `\n`;
      }
    });

    markdown += `## Recommendations\n\n`;
    this.results.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });

    return markdown;
  }
}

// Export singleton instance
export const browserTestRunner = new BrowserTestRunner();




































/**
 * Data Integrity Tester for Frontend-Backend Verification
 * Tests all pages and database operations for data accuracy
 */

import { supabase } from '../lib/supabaseClient';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
}

export class DataIntegrityTester {
  private testResults: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  constructor() {
    this.testResults = [];
  }

  /**
   * Start a new test suite
   */
  startSuite(name: string, description: string): void {
    this.currentSuite = {
      name,
      description,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };
  }

  /**
   * End current test suite
   */
  endSuite(): void {
    if (this.currentSuite) {
      this.testResults.push(this.currentSuite);
      this.currentSuite = null;
    }
  }

  /**
   * Add a test to current suite
   */
  async addTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    if (!this.currentSuite) {
      throw new Error('No active test suite. Call startSuite() first.');
    }

    const startTime = Date.now();
    let result: TestResult;

    try {
      const data = await testFunction();
      const duration = Date.now() - startTime;
      
      result = {
        testName,
        status: 'passed',
        message: 'Test passed successfully',
        data,
        duration
      };
      
      this.currentSuite.passedTests++;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      result = {
        testName,
        status: 'failed',
        message: 'Test failed',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
      
      this.currentSuite.failedTests++;
    }

    this.currentSuite.tests.push(result);
    this.currentSuite.totalTests++;
    
    return result;
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    return { connected: true, message: 'Database connection successful' };
  }

  /**
   * Test user authentication
   */
  async testUserAuthentication(): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(`User authentication failed: ${error.message}`);
    }

    if (!user) {
      throw new Error('No authenticated user found');
    }

    return { authenticated: true, userId: user.id };
  }

  /**
   * Test client data retrieval
   */
  async testClientDataRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (error) {
      throw new Error(`Client data retrieval failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No client data found');
    }

    return { 
      success: true, 
      recordCount: data.length,
      sampleData: data[0]
    };
  }

  /**
   * Test loan products retrieval
   */
  async testLoanProductsRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('loan_products')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw new Error(`Loan products retrieval failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No active loan products found');
    }

    return { 
      success: true, 
      recordCount: data.length,
      products: data
    };
  }

  /**
   * Test loan applications retrieval
   */
  async testLoanApplicationsRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('loan_applications')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone_number
        ),
        loan_products (
          name,
          interest_rate
        )
      `)
      .limit(5);

    if (error) {
      throw new Error(`Loan applications retrieval failed: ${error.message}`);
    }

    return { 
      success: true, 
      recordCount: data?.length || 0,
      applications: data
    };
  }

  /**
   * Test expense categories retrieval
   */
  async testExpenseCategoriesRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Expense categories retrieval failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No active expense categories found');
    }

    return { 
      success: true, 
      recordCount: data.length,
      categories: data
    };
  }

  /**
   * Test expenses retrieval
   */
  async testExpensesRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_categories (
          category_name,
          category_code
        )
      `)
      .limit(5);

    if (error) {
      throw new Error(`Expenses retrieval failed: ${error.message}`);
    }

    return { 
      success: true, 
      recordCount: data?.length || 0,
      expenses: data
    };
  }

  /**
   * Test budget items retrieval
   */
  async testBudgetItemsRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('budget_items')
      .select(`
        *,
        expense_categories (
          category_name,
          category_code
        )
      `)
      .limit(5);

    if (error) {
      throw new Error(`Budget items retrieval failed: ${error.message}`);
    }

    return { 
      success: true, 
      recordCount: data?.length || 0,
      budgetItems: data
    };
  }

  /**
   * Test staff data retrieval
   */
  async testStaffDataRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(5);

    if (error) {
      throw new Error(`Staff data retrieval failed: ${error.message}`);
    }

    return { 
      success: true, 
      recordCount: data?.length || 0,
      staff: data
    };
  }

  /**
   * Test savings accounts retrieval
   */
  async testSavingsAccountsRetrieval(): Promise<any> {
    const { data, error } = await supabase
      .from('savings_accounts')
      .select(`
        *,
        clients (
          first_name,
          last_name
        ),
        savings_products (
          name,
          interest_rate
        )
      `)
      .limit(5);

    if (error) {
      throw new Error(`Savings accounts retrieval failed: ${error.message}`);
    }

    return { 
      success: true, 
      recordCount: data?.length || 0,
      accounts: data
    };
  }

  /**
   * Test data consistency between related tables
   */
  async testDataConsistency(): Promise<any> {
    // Test loan applications with client relationships
    const { data: applications, error: appError } = await supabase
      .from('loan_applications')
      .select('id, client_id, loan_product_id')
      .limit(1);

    if (appError) {
      throw new Error(`Loan applications query failed: ${appError.message}`);
    }

    if (!applications || applications.length === 0) {
      return { success: true, message: 'No loan applications to test consistency' };
    }

    const application = applications[0];
    
    // Check if referenced client exists
    if (application.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', application.client_id)
        .single();

      if (clientError || !client) {
        throw new Error(`Referenced client not found for application ${application.id}`);
      }
    }

    // Check if referenced loan product exists
    if (application.loan_product_id) {
      const { data: product, error: productError } = await supabase
        .from('loan_products')
        .select('id')
        .eq('id', application.loan_product_id)
        .single();

      if (productError || !product) {
        throw new Error(`Referenced loan product not found for application ${application.id}`);
      }
    }

    return { 
      success: true, 
      message: 'Data consistency verified',
      testedApplication: application.id
    };
  }

  /**
   * Test query performance
   */
  async testQueryPerformance(): Promise<any> {
    const queries = [
      { name: 'Clients Query', query: () => supabase.from('clients').select('*').limit(10) },
      { name: 'Loan Applications Query', query: () => supabase.from('loan_applications').select('*').limit(10) },
      { name: 'Expenses Query', query: () => supabase.from('expenses').select('*').limit(10) }
    ];

    const results = [];

    for (const { name, query } of queries) {
      const startTime = Date.now();
      const { data, error } = await query();
      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`${name} failed: ${error.message}`);
      }

      results.push({
        query: name,
        duration,
        recordCount: data?.length || 0,
        performance: duration < 1000 ? 'excellent' : duration < 3000 ? 'good' : 'needs_improvement'
      });
    }

    return { success: true, performanceResults: results };
  }

  /**
   * Run comprehensive data integrity tests
   */
  async runComprehensiveTests(): Promise<TestSuite[]> {
    console.log('🚀 Starting Comprehensive Data Integrity Tests');
    console.log('=' * 60);

    // Database Connection Tests
    this.startSuite('Database Connection', 'Tests database connectivity and basic operations');
    await this.addTest('Database Connection', () => this.testDatabaseConnection());
    await this.addTest('User Authentication', () => this.testUserAuthentication());
    this.endSuite();

    // Core Data Retrieval Tests
    this.startSuite('Core Data Retrieval', 'Tests retrieval of core business data');
    await this.addTest('Client Data Retrieval', () => this.testClientDataRetrieval());
    await this.addTest('Loan Products Retrieval', () => this.testLoanProductsRetrieval());
    await this.addTest('Loan Applications Retrieval', () => this.testLoanApplicationsRetrieval());
    await this.addTest('Expense Categories Retrieval', () => this.testExpenseCategoriesRetrieval());
    await this.addTest('Expenses Retrieval', () => this.testExpensesRetrieval());
    await this.addTest('Budget Items Retrieval', () => this.testBudgetItemsRetrieval());
    await this.addTest('Staff Data Retrieval', () => this.testStaffDataRetrieval());
    await this.addTest('Savings Accounts Retrieval', () => this.testSavingsAccountsRetrieval());
    this.endSuite();

    // Data Integrity Tests
    this.startSuite('Data Integrity', 'Tests data consistency and referential integrity');
    await this.addTest('Data Consistency', () => this.testDataConsistency());
    this.endSuite();

    // Performance Tests
    this.startSuite('Performance', 'Tests query performance and response times');
    await this.addTest('Query Performance', () => this.testQueryPerformance());
    this.endSuite();

    return this.testResults;
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalSkipped = this.testResults.reduce((sum, suite) => sum + suite.skippedTests, 0);

    let report = `
📊 COMPREHENSIVE DATA INTEGRITY TEST REPORT
${'='.repeat(60)}

📈 Overall Results:
   Total Tests: ${totalTests}
   Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)
   Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)
   Skipped: ${totalSkipped} (${((totalSkipped / totalTests) * 100).toFixed(1)}%)

📋 Test Suite Results:
`;

    this.testResults.forEach(suite => {
      report += `
   ${suite.name}:
     Total: ${suite.totalTests}
     Passed: ${suite.passedTests}
     Failed: ${suite.failedTests}
     Skipped: ${suite.skippedTests}
     Success Rate: ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%
`;

      if (suite.failedTests > 0) {
        report += `     Failed Tests:\n`;
        suite.tests.filter(test => test.status === 'failed').forEach(test => {
          report += `       - ${test.testName}: ${test.error}\n`;
        });
      }
    });

    // Identify critical issues
    const failedTests = this.testResults.flatMap(suite => 
      suite.tests.filter(test => test.status === 'failed')
    );

    if (failedTests.length > 0) {
      report += `
🚨 Critical Issues Found:
`;
      failedTests.forEach(test => {
        report += `   - ${test.testName}: ${test.error}\n`;
      });
    }

    // Generate recommendations
    report += `
💡 Recommendations:
`;
    if (totalFailed === 0) {
      report += `   ✅ All tests passed! System is functioning correctly.\n`;
    } else {
      report += `   🔧 Fix the ${totalFailed} failed test(s) before deployment.\n`;
      report += `   📝 Review error messages for specific issues.\n`;
      report += `   🧪 Re-run tests after fixes to ensure resolution.\n`;
    }

    return report;
  }

  /**
   * Get test results as JSON
   */
  getResults(): TestSuite[] {
    return this.testResults;
  }

  /**
   * Export test results to file
   */
  exportResults(): string {
    const timestamp = new Date().toISOString();
    const results = {
      timestamp,
      summary: {
        totalTests: this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0),
        totalPassed: this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0),
        totalFailed: this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0),
        totalSkipped: this.testResults.reduce((sum, suite) => sum + suite.skippedTests, 0)
      },
      testSuites: this.testResults
    };

    return JSON.stringify(results, null, 2);
  }
}

// Export singleton instance
export const dataIntegrityTester = new DataIntegrityTester();




































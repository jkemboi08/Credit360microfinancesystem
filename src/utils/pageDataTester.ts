/**
 * Page-Specific Data Flow Tester
 * Tests individual pages for data input/output integrity
 */

import { supabase } from '../lib/supabaseClient';

export interface PageTestResult {
  pageName: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export interface PageTestSuite {
  pageName: string;
  description: string;
  tests: PageTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
}

export class PageDataTester {
  private testResults: PageTestSuite[] = [];

  /**
   * Test Client Management Pages
   */
  async testClientManagementPages(): Promise<PageTestSuite> {
    const suite: PageTestSuite = {
      pageName: 'Client Management',
      description: 'Tests client registration, management, and data flow',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test client data structure
    const testClientDataStructure = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            pageName: 'Client Management',
            testName: 'Client Data Structure',
            status: 'skipped',
            message: 'No client data found to test structure',
            duration: Date.now() - startTime
          };
        }

        const client = data[0];
        const requiredFields = [
          'id', 'client_type', 'first_name', 'last_name', 'phone_number',
          'email_address', 'created_at', 'updated_at'
        ];

        const missingFields = requiredFields.filter(field => !(field in client));
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        return {
          pageName: 'Client Management',
          testName: 'Client Data Structure',
          status: 'passed',
          message: 'Client data structure is valid',
          data: { fieldCount: Object.keys(client).length, requiredFields: requiredFields.length },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Client Management',
          testName: 'Client Data Structure',
          status: 'failed',
          message: 'Client data structure validation failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test client creation workflow
    const testClientCreationWorkflow = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        // Test individual client creation
        const individualClientData = {
          client_type: 'individual',
          first_name: 'Test',
          last_name: 'Individual',
          national_id_number: 'TEST123456789',
          phone_number: '+255123456789',
          email_address: 'test.individual@example.com',
          date_of_birth: '1990-01-01',
          gender: 'male',
          marital_status: 'single',
          employment_status: 'employed',
          occupation: 'Software Developer',
          net_monthly_salary: 500000
        };

        const { data, error } = await supabase
          .from('clients')
          .insert([individualClientData])
          .select();

        if (error) throw error;

        return {
          pageName: 'Client Management',
          testName: 'Individual Client Creation',
          status: 'passed',
          message: 'Individual client created successfully',
          data: { clientId: data[0].id },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Client Management',
          testName: 'Individual Client Creation',
          status: 'failed',
          message: 'Individual client creation failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test client data retrieval
    const testClientDataRetrieval = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_type', 'individual')
          .limit(5);

        if (error) throw error;

        return {
          pageName: 'Client Management',
          testName: 'Client Data Retrieval',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} individual clients`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Client Management',
          testName: 'Client Data Retrieval',
          status: 'failed',
          message: 'Client data retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Run tests
    suite.tests.push(await testClientDataStructure());
    suite.tests.push(await testClientCreationWorkflow());
    suite.tests.push(await testClientDataRetrieval());

    // Calculate results
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.status === 'passed').length;
    suite.failedTests = suite.tests.filter(t => t.status === 'failed').length;
    suite.skippedTests = suite.tests.filter(t => t.status === 'skipped').length;

    return suite;
  }

  /**
   * Test Loan Management Pages
   */
  async testLoanManagementPages(): Promise<PageTestSuite> {
    const suite: PageTestSuite = {
      pageName: 'Loan Management',
      description: 'Tests loan products, applications, and processing workflow',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test loan products data
    const testLoanProductsData = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('loan_products')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            pageName: 'Loan Management',
            testName: 'Loan Products Data',
            status: 'skipped',
            message: 'No active loan products found',
            duration: Date.now() - startTime
          };
        }

        // Validate loan product structure
        const product = data[0];
        const requiredFields = ['id', 'name', 'min_amount', 'max_amount', 'interest_rate', 'status'];
        const missingFields = requiredFields.filter(field => !(field in product));

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        return {
          pageName: 'Loan Management',
          testName: 'Loan Products Data',
          status: 'passed',
          message: `Found ${data.length} active loan products`,
          data: { productCount: data.length, sampleProduct: product.name },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Loan Management',
          testName: 'Loan Products Data',
          status: 'failed',
          message: 'Loan products data validation failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test loan applications workflow
    const testLoanApplicationsWorkflow = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        // Get a client and loan product for testing
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .eq('client_type', 'individual')
          .limit(1);

        const { data: products } = await supabase
          .from('loan_products')
          .select('id')
          .eq('status', 'active')
          .limit(1);

        if (!clients || clients.length === 0) {
          return {
            pageName: 'Loan Management',
            testName: 'Loan Applications Workflow',
            status: 'skipped',
            message: 'No clients found for loan application test',
            duration: Date.now() - startTime
          };
        }

        if (!products || products.length === 0) {
          return {
            pageName: 'Loan Management',
            testName: 'Loan Applications Workflow',
            status: 'skipped',
            message: 'No loan products found for loan application test',
            duration: Date.now() - startTime
          };
        }

        // Test loan application creation
        const applicationData = {
          client_id: clients[0].id,
          loan_product_id: products[0].id,
          requested_amount: 1000000,
          repayment_period_months: 12,
          loan_purpose: 'Business expansion',
          affordable_repayment_amount: 100000,
          source_of_income: 'Salary',
          status: 'pending',
          kyc_status: 'pending'
        };

        const { data, error } = await supabase
          .from('loan_applications')
          .insert([applicationData])
          .select();

        if (error) throw error;

        return {
          pageName: 'Loan Management',
          testName: 'Loan Applications Workflow',
          status: 'passed',
          message: 'Loan application created successfully',
          data: { applicationId: data[0].id },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Loan Management',
          testName: 'Loan Applications Workflow',
          status: 'failed',
          message: 'Loan application workflow failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test loan application retrieval with relationships
    const testLoanApplicationRetrieval = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
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

        if (error) throw error;

        return {
          pageName: 'Loan Management',
          testName: 'Loan Application Retrieval',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} loan applications with relationships`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Loan Management',
          testName: 'Loan Application Retrieval',
          status: 'failed',
          message: 'Loan application retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Run tests
    suite.tests.push(await testLoanProductsData());
    suite.tests.push(await testLoanApplicationsWorkflow());
    suite.tests.push(await testLoanApplicationRetrieval());

    // Calculate results
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.status === 'passed').length;
    suite.failedTests = suite.tests.filter(t => t.status === 'failed').length;
    suite.skippedTests = suite.tests.filter(t => t.status === 'skipped').length;

    return suite;
  }

  /**
   * Test Expense Management Pages
   */
  async testExpenseManagementPages(): Promise<PageTestSuite> {
    const suite: PageTestSuite = {
      pageName: 'Expense Management',
      description: 'Tests expense categories, budget management, and expense processing',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test expense categories
    const testExpenseCategories = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            pageName: 'Expense Management',
            testName: 'Expense Categories',
            status: 'skipped',
            message: 'No active expense categories found',
            duration: Date.now() - startTime
          };
        }

        return {
          pageName: 'Expense Management',
          testName: 'Expense Categories',
          status: 'passed',
          message: `Found ${data.length} active expense categories`,
          data: { categoryCount: data.length },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Expense Management',
          testName: 'Expense Categories',
          status: 'failed',
          message: 'Expense categories retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test budget items
    const testBudgetItems = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
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

        if (error) throw error;

        return {
          pageName: 'Expense Management',
          testName: 'Budget Items',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} budget items`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Expense Management',
          testName: 'Budget Items',
          status: 'failed',
          message: 'Budget items retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test expense creation workflow
    const testExpenseCreationWorkflow = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        // Get an expense category
        const { data: categories } = await supabase
          .from('expense_categories')
          .select('id')
          .eq('is_active', true)
          .limit(1);

        if (!categories || categories.length === 0) {
          return {
            pageName: 'Expense Management',
            testName: 'Expense Creation Workflow',
            status: 'skipped',
            message: 'No expense categories found for expense creation test',
            duration: Date.now() - startTime
          };
        }

        // Test expense creation
        const expenseData = {
          category_id: categories[0].id,
          amount: 100000,
          currency: 'TZS',
          expense_date: '2024-01-15',
          description: 'Test expense for data integrity testing',
          vendor_name: 'Test Vendor',
          approval_status: 'pending',
          submitted_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        };

        const { data, error } = await supabase
          .from('expenses')
          .insert([expenseData])
          .select();

        if (error) throw error;

        return {
          pageName: 'Expense Management',
          testName: 'Expense Creation Workflow',
          status: 'passed',
          message: 'Expense created successfully',
          data: { expenseId: data[0].id },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Expense Management',
          testName: 'Expense Creation Workflow',
          status: 'failed',
          message: 'Expense creation workflow failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Run tests
    suite.tests.push(await testExpenseCategories());
    suite.tests.push(await testBudgetItems());
    suite.tests.push(await testExpenseCreationWorkflow());

    // Calculate results
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.status === 'passed').length;
    suite.failedTests = suite.tests.filter(t => t.status === 'failed').length;
    suite.skippedTests = suite.tests.filter(t => t.status === 'skipped').length;

    return suite;
  }

  /**
   * Test Staff Management Pages
   */
  async testStaffManagementPages(): Promise<PageTestSuite> {
    const suite: PageTestSuite = {
      pageName: 'Staff Management',
      description: 'Tests employee management, payroll, and attendance tracking',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test employee data
    const testEmployeeData = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .limit(5);

        if (error) throw error;

        return {
          pageName: 'Staff Management',
          testName: 'Employee Data',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} employee records`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Staff Management',
          testName: 'Employee Data',
          status: 'failed',
          message: 'Employee data retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test leave requests
    const testLeaveRequests = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select('*')
          .limit(5);

        if (error) throw error;

        return {
          pageName: 'Staff Management',
          testName: 'Leave Requests',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} leave request records`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Staff Management',
          testName: 'Leave Requests',
          status: 'failed',
          message: 'Leave requests retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test attendance records
    const testAttendanceRecords = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .limit(5);

        if (error) throw error;

        return {
          pageName: 'Staff Management',
          testName: 'Attendance Records',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} attendance records`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Staff Management',
          testName: 'Attendance Records',
          status: 'failed',
          message: 'Attendance records retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Run tests
    suite.tests.push(await testEmployeeData());
    suite.tests.push(await testLeaveRequests());
    suite.tests.push(await testAttendanceRecords());

    // Calculate results
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.status === 'passed').length;
    suite.failedTests = suite.tests.filter(t => t.status === 'failed').length;
    suite.skippedTests = suite.tests.filter(t => t.status === 'skipped').length;

    return suite;
  }

  /**
   * Test Savings Management Pages
   */
  async testSavingsManagementPages(): Promise<PageTestSuite> {
    const suite: PageTestSuite = {
      pageName: 'Savings Management',
      description: 'Tests savings products, accounts, and transactions',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test savings products
    const testSavingsProducts = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('savings_products')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            pageName: 'Savings Management',
            testName: 'Savings Products',
            status: 'skipped',
            message: 'No active savings products found',
            duration: Date.now() - startTime
          };
        }

        return {
          pageName: 'Savings Management',
          testName: 'Savings Products',
          status: 'passed',
          message: `Found ${data.length} active savings products`,
          data: { productCount: data.length },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Savings Management',
          testName: 'Savings Products',
          status: 'failed',
          message: 'Savings products retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test savings accounts
    const testSavingsAccounts = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
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

        if (error) throw error;

        return {
          pageName: 'Savings Management',
          testName: 'Savings Accounts',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} savings accounts`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Savings Management',
          testName: 'Savings Accounts',
          status: 'failed',
          message: 'Savings accounts retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Test savings transactions
    const testSavingsTransactions = async (): Promise<PageTestResult> => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('savings_transactions')
          .select('*')
          .limit(5);

        if (error) throw error;

        return {
          pageName: 'Savings Management',
          testName: 'Savings Transactions',
          status: 'passed',
          message: `Retrieved ${data?.length || 0} savings transactions`,
          data: { recordCount: data?.length || 0 },
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          pageName: 'Savings Management',
          testName: 'Savings Transactions',
          status: 'failed',
          message: 'Savings transactions retrieval failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        };
      }
    };

    // Run tests
    suite.tests.push(await testSavingsProducts());
    suite.tests.push(await testSavingsAccounts());
    suite.tests.push(await testSavingsTransactions());

    // Calculate results
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.status === 'passed').length;
    suite.failedTests = suite.tests.filter(t => t.status === 'failed').length;
    suite.skippedTests = suite.tests.filter(t => t.status === 'skipped').length;

    return suite;
  }

  /**
   * Run all page-specific tests
   */
  async runAllPageTests(): Promise<PageTestSuite[]> {
    console.log('🚀 Starting Page-Specific Data Flow Tests');
    console.log('=' * 60);

    this.testResults = [];

    // Run all test suites
    this.testResults.push(await this.testClientManagementPages());
    this.testResults.push(await this.testLoanManagementPages());
    this.testResults.push(await this.testExpenseManagementPages());
    this.testResults.push(await this.testStaffManagementPages());
    this.testResults.push(await this.testSavingsManagementPages());

    return this.testResults;
  }

  /**
   * Get test results
   */
  getResults(): PageTestSuite[] {
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
📊 PAGE-SPECIFIC DATA FLOW TEST REPORT
${'='.repeat(60)}

📈 Overall Results:
   Total Tests: ${totalTests}
   Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)
   Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)
   Skipped: ${totalSkipped} (${((totalSkipped / totalTests) * 100).toFixed(1)}%)

📋 Page Test Results:
`;

    this.testResults.forEach(suite => {
      report += `
   ${suite.pageName}:
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

    return report;
  }
}

// Export singleton instance
export const pageDataTester = new PageDataTester();




































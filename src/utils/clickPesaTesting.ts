import { clickPesaService } from '../services/clickPesaService';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration: number;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

class ClickPesaTesting {
  private testResults: TestResult[] = [];

  /**
   * Run all ClickPesa integration tests
   */
  async runAllTests(): Promise<TestSuite> {
    const startTime = Date.now();
    this.testResults = [];

    console.log('🧪 Starting ClickPesa Integration Tests...');

    // Test 1: Connection Test
    await this.testConnection();

    // Test 2: Authentication Test
    await this.testAuthentication();

    // Test 3: Account Balance Test
    await this.testAccountBalance();

    // Test 4: Single Payout Test
    await this.testSinglePayout();

    // Test 5: Payment Collection Test
    await this.testPaymentCollection();

    // Test 6: Transaction Status Test
    await this.testTransactionStatus();

    // Test 7: Transaction History Test
    await this.testTransactionHistory();

    // Test 8: Webhook Processing Test
    await this.testWebhookProcessing();

    const endTime = Date.now();
    const duration = endTime - startTime;

    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const skippedTests = this.testResults.filter(t => t.status === 'skipped').length;

    const testSuite: TestSuite = {
      name: 'ClickPesa Integration Tests',
      tests: this.testResults,
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      skippedTests,
      duration
    };

    console.log('✅ ClickPesa Integration Tests Completed!');
    console.log(`📊 Results: ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped`);
    console.log(`⏱️ Duration: ${duration}ms`);

    return testSuite;
  }

  /**
   * Test ClickPesa connection
   */
  private async testConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isConnected = await clickPesaService.testConnection();
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Connection Test',
        status: isConnected ? 'passed' : 'failed',
        message: isConnected ? 'ClickPesa connection successful' : 'ClickPesa connection failed',
        duration,
        details: { connected: isConnected }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Connection Test',
        status: 'failed',
        message: `Connection test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test ClickPesa authentication
   */
  private async testAuthentication(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // This will test JWT token generation
      const isConnected = await clickPesaService.testConnection();
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Authentication Test',
        status: isConnected ? 'passed' : 'failed',
        message: isConnected ? 'JWT token generation successful' : 'JWT token generation failed',
        duration,
        details: { authenticated: isConnected }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Authentication Test',
        status: 'failed',
        message: `Authentication test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test account balance retrieval
   */
  private async testAccountBalance(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const balance = await clickPesaService.getAccountBalance();
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Account Balance Test',
        status: 'passed',
        message: 'Account balance retrieved successfully',
        duration,
        details: { balance }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Account Balance Test',
        status: 'failed',
        message: `Account balance test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test single payout creation
   */
  private async testSinglePayout(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Use test data for payout
      const payoutData = {
        amount: 1000, // Small test amount
        currency: 'TZS',
        recipient_phone: '+255700000000', // Test phone number
        recipient_name: 'Test User',
        reference: `TEST-PAYOUT-${Date.now()}`,
        description: 'ClickPesa integration test payout'
      };

      const result = await clickPesaService.createPayout(payoutData);
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Single Payout Test',
        status: 'passed',
        message: 'Single payout created successfully',
        duration,
        details: { payout: result }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Single Payout Test',
        status: 'failed',
        message: `Single payout test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test payment collection
   */
  private async testPaymentCollection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Use test data for payment
      const paymentData = {
        amount: 1000, // Small test amount
        currency: 'TZS',
        customer_phone: '+255700000000', // Test phone number
        customer_name: 'Test Customer',
        reference: `TEST-PAYMENT-${Date.now()}`,
        description: 'ClickPesa integration test payment'
      };

      const result = await clickPesaService.createPayment(paymentData);
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Payment Collection Test',
        status: 'passed',
        message: 'Payment collection request created successfully',
        duration,
        details: { payment: result }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Payment Collection Test',
        status: 'failed',
        message: `Payment collection test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test transaction status retrieval
   */
  private async testTransactionStatus(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Use a test transaction ID
      const testTransactionId = 'test-transaction-id';
      const result = await clickPesaService.getTransactionStatus(testTransactionId);
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Transaction Status Test',
        status: 'passed',
        message: 'Transaction status retrieved successfully',
        duration,
        details: { transaction: result }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Transaction Status Test',
        status: 'failed',
        message: `Transaction status test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test transaction history retrieval
   */
  private async testTransactionHistory(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await clickPesaService.getTransactionHistory({
        limit: 10,
        offset: 0
      });
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Transaction History Test',
        status: 'passed',
        message: 'Transaction history retrieved successfully',
        duration,
        details: { history: result }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Transaction History Test',
        status: 'failed',
        message: `Transaction history test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test webhook processing
   */
  private async testWebhookProcessing(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate a webhook event
      const webhookEvent = {
        event_type: 'payout.completed',
        transaction_id: 'test-transaction-id',
        status: 'completed',
        amount: 1000,
        currency: 'TZS',
        reference: 'test-reference',
        timestamp: new Date().toISOString(),
        data: { test: true }
      };

      await clickPesaService.processWebhookEvent(webhookEvent);
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName: 'Webhook Processing Test',
        status: 'passed',
        message: 'Webhook event processed successfully',
        duration,
        details: { webhook: webhookEvent }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName: 'Webhook Processing Test',
        status: 'failed',
        message: `Webhook processing test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
    }
  }

  /**
   * Generate test report
   */
  generateReport(testSuite: TestSuite): string {
    let report = `# ClickPesa Integration Test Report\n\n`;
    report += `**Test Suite:** ${testSuite.name}\n`;
    report += `**Total Tests:** ${testSuite.totalTests}\n`;
    report += `**Passed:** ${testSuite.passedTests}\n`;
    report += `**Failed:** ${testSuite.failedTests}\n`;
    report += `**Skipped:** ${testSuite.skippedTests}\n`;
    report += `**Duration:** ${testSuite.duration}ms\n\n`;

    report += `## Test Results\n\n`;
    
    testSuite.tests.forEach((test, index) => {
      const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      report += `### ${index + 1}. ${test.testName} ${statusIcon}\n`;
      report += `- **Status:** ${test.status}\n`;
      report += `- **Message:** ${test.message}\n`;
      report += `- **Duration:** ${test.duration}ms\n`;
      
      if (test.details) {
        report += `- **Details:** \n\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n`;
      }
      report += `\n`;
    });

    return report;
  }

  /**
   * Run specific test
   */
  async runTest(testName: string): Promise<TestResult | null> {
    const startTime = Date.now();
    
    try {
      switch (testName) {
        case 'connection':
          await this.testConnection();
          break;
        case 'authentication':
          await this.testAuthentication();
          break;
        case 'accountBalance':
          await this.testAccountBalance();
          break;
        case 'singlePayout':
          await this.testSinglePayout();
          break;
        case 'paymentCollection':
          await this.testPaymentCollection();
          break;
        case 'transactionStatus':
          await this.testTransactionStatus();
          break;
        case 'transactionHistory':
          await this.testTransactionHistory();
          break;
        case 'webhookProcessing':
          await this.testWebhookProcessing();
          break;
        default:
          throw new Error(`Unknown test: ${testName}`);
      }

      return this.testResults[this.testResults.length - 1];
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        status: 'failed',
        message: `Test failed: ${error.message}`,
        duration,
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const clickPesaTesting = new ClickPesaTesting();
export default clickPesaTesting;

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { clickPesaTesting, TestSuite, TestResult } from '../utils/clickPesaTesting';
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';

const ClickPesaTesting: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showReport, setShowReport] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      const results = await clickPesaTesting.runAllTests();
      setTestSuite(results);
    } catch (error) {
      console.error('Error running tests:', error);
      alert('Error running tests. Please check the console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const runSpecificTest = async () => {
    if (!selectedTest) return;
    
    setIsRunning(true);
    try {
      const result = await clickPesaTesting.runTest(selectedTest);
      setTestResult(result);
    } catch (error) {
      console.error('Error running test:', error);
      alert('Error running test. Please check the console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!testSuite) return;
    
    const report = clickPesaTesting.generateReport(testSuite);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clickpesa-test-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'skipped': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">ClickPesa Integration Testing</h1>
          <p className="text-purple-100">
            Test ClickPesa API integration, authentication, and payment processing
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Test Controls</h2>
            <div className="flex space-x-3">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isRunning ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </button>
              {testSuite && (
                <button
                  onClick={downloadReport}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Report
                </button>
              )}
            </div>
          </div>

          {/* Individual Test Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Run Specific Test
              </label>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a test...</option>
                <option value="connection">Connection Test</option>
                <option value="authentication">Authentication Test</option>
                <option value="accountBalance">Account Balance Test</option>
                <option value="singlePayout">Single Payout Test</option>
                <option value="paymentCollection">Payment Collection Test</option>
                <option value="transactionStatus">Transaction Status Test</option>
                <option value="transactionHistory">Transaction History Test</option>
                <option value="webhookProcessing">Webhook Processing Test</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={runSpecificTest}
                disabled={!selectedTest || isRunning}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run Test
              </button>
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        {testSuite && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Results Summary</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{testSuite.totalTests}</div>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-700">{testSuite.passedTests}</div>
                <p className="text-sm text-green-600">Passed</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-700">{testSuite.failedTests}</div>
                <p className="text-sm text-red-600">Failed</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-700">{testSuite.skippedTests}</div>
                <p className="text-sm text-yellow-600">Skipped</p>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testSuite.tests.map((test, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(test.status)}
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {test.testName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{test.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.duration}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Individual Test Result */}
        {testResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Test Result</h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-4">
                {getStatusIcon(testResult.status)}
                <h3 className="ml-3 text-lg font-medium text-gray-900">{testResult.testName}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className={`text-sm ${testResult.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Duration</p>
                  <p className="text-sm text-gray-900">{testResult.duration}ms</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Message</p>
                <p className="text-sm text-gray-900">{testResult.message}</p>
              </div>
              
              {testResult.details && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Details</p>
                  <pre className="bg-gray-100 rounded-lg p-3 text-xs overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Information */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start">
            <Info className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Testing Information</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Connection Test:</strong> Verifies ClickPesa API connectivity and basic authentication.
                </p>
                <p>
                  <strong>Authentication Test:</strong> Tests JWT token generation and refresh mechanism.
                </p>
                <p>
                  <strong>Account Balance Test:</strong> Retrieves current account balance from ClickPesa.
                </p>
                <p>
                  <strong>Single Payout Test:</strong> Creates a test payout transaction (sandbox mode).
                </p>
                <p>
                  <strong>Payment Collection Test:</strong> Creates a test payment collection request.
                </p>
                <p>
                  <strong>Transaction Status Test:</strong> Retrieves transaction status information.
                </p>
                <p>
                  <strong>Transaction History Test:</strong> Fetches recent transaction history.
                </p>
                <p>
                  <strong>Webhook Processing Test:</strong> Tests webhook event processing and database updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClickPesaTesting;

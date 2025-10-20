import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  RefreshCw,
  AlertTriangle,
  Database,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Zap,
  Target
} from 'lucide-react';
import { browserTestRunner, BrowserTestResults } from '../utils/runBrowserTests';

interface TestStatus {
  running: boolean;
  completed: boolean;
  results: BrowserTestResults | null;
  error: string | null;
}

const DataIntegrityTestComponent: React.FC = () => {
  const [testStatus, setTestStatus] = useState<TestStatus>({
    running: false,
    completed: false,
    results: null,
    error: null
  });

  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});

  const runTests = async () => {
    setTestStatus({
      running: true,
      completed: false,
      results: null,
      error: null
    });

    try {
      const results = await browserTestRunner.runAllTests();
      setTestStatus({
        running: false,
        completed: true,
        results,
        error: null
      });
    } catch (error) {
      setTestStatus({
        running: false,
        completed: false,
        results: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const runQuickTests = async () => {
    setTestStatus({
      running: true,
      completed: false,
      results: null,
      error: null
    });

    try {
      const results = await browserTestRunner.runQuickTests();
      setTestStatus({
        running: false,
        completed: true,
        results,
        error: null
      });
    } catch (error) {
      setTestStatus({
        running: false,
        completed: false,
        results: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const toggleDetails = (suiteName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [suiteName]: !prev[suiteName]
    }));
  };

  const downloadResults = () => {
    if (testStatus.results) {
      browserTestRunner.downloadResults();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'skipped':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSuiteIcon = (suiteName: string) => {
    switch (suiteName) {
      case 'Database Connection':
        return <Database className="w-5 h-5" />;
      case 'Core Data Retrieval':
        return <Users className="w-5 h-5" />;
      case 'Data Integrity':
        return <CheckCircle className="w-5 h-5" />;
      case 'Performance':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const totalTests = testStatus.results?.summary.totalTests || 0;
  const totalPassed = testStatus.results?.summary.totalPassed || 0;
  const totalFailed = testStatus.results?.summary.totalFailed || 0;
  const totalSkipped = testStatus.results?.summary.totalSkipped || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Integrity Test Suite
        </h1>
        <p className="text-gray-600">
          Comprehensive testing of data flow between frontend and Supabase database
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Test Controls</h2>
          <div className="flex space-x-3">
            <button
              onClick={runQuickTests}
              disabled={testStatus.running}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                testStatus.running
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {testStatus.running ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{testStatus.running ? 'Running Tests...' : 'Quick Tests'}</span>
            </button>

            <button
              onClick={runTests}
              disabled={testStatus.running}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                testStatus.running
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {testStatus.running ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{testStatus.running ? 'Running Tests...' : 'Full Tests'}</span>
            </button>

            {testStatus.completed && (
              <button
                onClick={downloadResults}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Results</span>
              </button>
            )}
          </div>
        </div>

        {testStatus.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Test Error</span>
            </div>
            <p className="text-red-600 mt-1">{testStatus.error}</p>
          </div>
        )}
      </div>

      {/* Test Results Summary */}
      {testStatus.completed && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Tests</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{totalTests}</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Passed</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{totalPassed}</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{totalFailed}</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Skipped</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{totalSkipped}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Overall Success Rate</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalTests > 0 ? (totalPassed / totalTests) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Detailed Test Results */}
      {testStatus.completed && testStatus.results && testStatus.results.testSuites.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Test Results</h2>
          
          {testStatus.results.testSuites.map((suite, index) => (
            <div key={index} className="mb-6">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleDetails(suite.name)}
              >
                <div className="flex items-center space-x-3">
                  {getSuiteIcon(suite.name)}
                  <div>
                    <h3 className="font-medium text-gray-900">{suite.name}</h3>
                    <p className="text-sm text-gray-600">{suite.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {suite.passedTests}/{suite.totalTests} passed
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    suite.failedTests === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {suite.failedTests === 0 ? 'PASSED' : 'FAILED'}
                  </div>
                  <div className="text-gray-400">
                    {showDetails[suite.name] ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {showDetails[suite.name] && (
                <div className="mt-4 space-y-2">
                  {suite.tests.map((test, testIndex) => (
                    <div
                      key={testIndex}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(test.status)}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.testName}</div>
                          <div className="text-sm opacity-75">{test.message}</div>
                          {test.error && (
                            <div className="text-sm mt-1 font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                              {test.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {test.duration && `${test.duration}ms`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Critical Issues */}
      {testStatus.completed && testStatus.results && testStatus.results.criticalIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Critical Issues</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Issues Requiring Immediate Attention</span>
            </div>
            <ul className="text-red-700 space-y-1">
              {testStatus.results.criticalIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {testStatus.completed && testStatus.results && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
          
          {totalFailed === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">All Tests Passed!</span>
              </div>
              <p className="text-green-700">
                Your system is functioning correctly. All data flows between frontend and database are working as expected.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Issues Found</span>
              </div>
              <ul className="text-yellow-700 space-y-1">
                {testStatus.results.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataIntegrityTestComponent;

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { WebhookHandler } from '../utils/webhookHandler';

const WebhookTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testWebhook = async () => {
    setIsTesting(true);
    try {
      const result = await WebhookHandler.testWebhook();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Webhook Test</h1>
          <p className="text-purple-100">
            Test ClickPesa webhook functionality
          </p>
        </div>

        {/* Test Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Webhook Processing</h2>
          
          <div className="space-y-4">
            <button
              onClick={testWebhook}
              disabled={isTesting}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isTesting ? 'Testing...' : 'Test Webhook'}
            </button>

            {testResult && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Test Result:</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Webhook URL Info */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Webhook URL</h3>
          <p className="text-blue-800 mb-2">
            For ClickPesa dashboard, use this webhook URL:
          </p>
          <code className="bg-blue-100 px-3 py-2 rounded text-sm font-mono">
            http://localhost:5173/api/webhooks/clickpesa
          </code>
          <p className="text-blue-800 mt-2 text-sm">
            Note: This is a test endpoint. In production, you'll need a proper API server.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default WebhookTest;

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRealtimeData } from '../hooks/useRealtimeData';

const RealtimeDataTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [testData, setTestData] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('Not subscribed');
  
  const { crossModuleData, lastUpdate, isConnected, updateCount } = useRealtimeData({
    events: ['expense_created', 'expense_updated', 'staff_salary_updated', 'budget_updated'],
    autoSync: true,
    syncInterval: 5000
  });

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        console.log('🔍 Testing Supabase connection...');
        const { data, error } = await supabase
          .from('loan_applications')
          .select('count(*)')
          .limit(1);

        if (error) {
          console.error('❌ Supabase connection failed:', error);
          setConnectionStatus('disconnected');
        } else {
          console.log('✅ Supabase connection successful!');
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error('❌ Connection test error:', err);
        setConnectionStatus('disconnected');
      }
    };

    testConnection();
  }, []);

  useEffect(() => {
    // Test real-time subscriptions
    const testSubscriptions = async () => {
      try {
        console.log('🔗 Testing real-time subscriptions...');
        
        // Subscribe to loan_applications changes
        const subscription = supabase
          .channel('test_loan_applications')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'loan_applications'
          }, (payload) => {
            console.log('📊 Real-time update received:', payload);
            setSubscriptionStatus(`Last update: ${new Date().toLocaleTimeString()}`);
            setTestData(payload);
          })
          .subscribe((status) => {
            console.log('📡 Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              setSubscriptionStatus('Subscribed and listening for changes');
            } else if (status === 'CHANNEL_ERROR') {
              setSubscriptionStatus('Subscription error');
            }
          });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Subscription test error:', error);
        setSubscriptionStatus('Subscription failed');
      }
    };

    const cleanup = testSubscriptions();
    return cleanup;
  }, []);

  const testInsert = async () => {
    try {
      console.log('🧪 Testing data insert...');
      const { data, error } = await supabase
        .from('loan_applications')
        .insert({
          client_id: 'test-client-id',
          requested_amount: 100000,
          loan_purpose: 'Test loan for real-time verification',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Insert failed:', error);
        alert('Insert failed: ' + error.message);
      } else {
        console.log('✅ Insert successful:', data);
        alert('Test data inserted successfully! Check the real-time updates below.');
      }
    } catch (err) {
      console.error('❌ Insert error:', err);
      alert('Insert error: ' + err);
    }
  };

  const testQuery = async () => {
    try {
      console.log('🔍 Testing data query...');
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Query failed:', error);
        alert('Query failed: ' + error.message);
      } else {
        console.log('✅ Query successful:', data);
        alert(`Query successful! Found ${data?.length || 0} records.`);
      }
    } catch (err) {
      console.error('❌ Query error:', err);
      alert('Query error: ' + err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🔗 Real-time Data Test Dashboard
        </h2>

        {/* Connection Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Connection Status</h3>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus === 'connected' ? '✅ Connected' : 
               connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
            </div>
            <div className="text-sm text-gray-600">
              Supabase URL: https://klmfbakjbihbgbvbvidw.supabase.co
            </div>
          </div>
        </div>

        {/* Real-time Subscription Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Real-time Subscriptions</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-sm ${
                subscriptionStatus.includes('Subscribed') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {subscriptionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Updates Received:</span>
              <span className="text-sm text-blue-600">{updateCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Update:</span>
              <span className="text-sm text-gray-600">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Cross-module Data */}
        {crossModuleData && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Cross-module Data</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Total Expenses:</span>
                  <span className="ml-2 text-sm text-blue-600">
                    ${crossModuleData.expenseData?.totalExpenses?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Total Staff:</span>
                  <span className="ml-2 text-sm text-green-600">
                    {crossModuleData.staffData?.totalStaff || 0}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Salary Expenses:</span>
                  <span className="ml-2 text-sm text-purple-600">
                    ${crossModuleData.staffData?.salaryExpenses?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Total Budget:</span>
                  <span className="ml-2 text-sm text-orange-600">
                    ${crossModuleData.budgetData?.totalBudget?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Test Operations</h3>
          <div className="flex space-x-4">
            <button
              onClick={testQuery}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Test Query
            </button>
            <button
              onClick={testInsert}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Test Insert
            </button>
          </div>
        </div>

        {/* Real-time Updates */}
        {testData && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Latest Real-time Update</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(testData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Test Real-time Updates</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Click "Test Insert" to add a new loan application</li>
            <li>2. Watch for real-time updates in the "Latest Real-time Update" section</li>
            <li>3. Check that the "Updates Received" counter increases</li>
            <li>4. Verify that cross-module data updates automatically</li>
            <li>5. Open another browser tab and make changes to see real-time sync</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDataTest;











































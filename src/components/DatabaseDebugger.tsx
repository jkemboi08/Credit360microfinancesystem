import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DatabaseDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebugTests = async () => {
      const results: any = {};
      
      try {
        // Test 1: Basic connection
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        results.session = {
          hasSession: !!sessionData.session,
          user: sessionData.session?.user?.email || 'No user',
          error: sessionError?.message || 'No error'
        };

        // Test 2: Check if we can access savings tables
        const { data: productsData, error: productsError } = await supabase
          .from('savings_products')
          .select('*')
          .limit(1);
        
        results.savingsProducts = {
          accessible: !productsError,
          count: productsData?.length || 0,
          error: productsError?.message || 'No error'
        };

        // Test 3: Check savings accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('savings_accounts')
          .select('*')
          .limit(1);
        
        results.savingsAccounts = {
          accessible: !accountsError,
          count: accountsData?.length || 0,
          error: accountsError?.message || 'No error'
        };

        // Test 4: Check interest posting batches
        const { data: batchesData, error: batchesError } = await supabase
          .from('interest_posting_batches')
          .select('*')
          .limit(1);
        
        results.interestBatches = {
          accessible: !batchesError,
          count: batchesData?.length || 0,
          error: batchesError?.message || 'No error'
        };

        // Test 5: Check interest posting details
        const { data: detailsData, error: detailsError } = await supabase
          .from('interest_posting_details')
          .select('*')
          .limit(1);
        
        results.interestDetails = {
          accessible: !detailsError,
          count: detailsData?.length || 0,
          error: detailsError?.message || 'No error'
        };

        // Test 6: Test RLS by trying to insert
        const { data: insertData, error: insertError } = await supabase
          .from('savings_products')
          .insert({
            product_name: 'Debug Test Product',
            product_type: 'voluntary_savings',
            product_code: 'DEBUG001',
            description: 'Test product for debugging',
            minimum_balance: 1000,
            annual_interest_rate: 0.05,
            is_active: true
          })
          .select();

        results.insertTest = {
          success: !insertError,
          error: insertError?.message || 'No error',
          data: insertData
        };

      } catch (error) {
        results.generalError = error;
      }

      setDebugInfo(results);
      setLoading(false);
    };

    runDebugTests();
  }, []);

  if (loading) {
    return <div className="p-4 bg-yellow-100 rounded-lg">Running database debug tests...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Database Connection Debug Info</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(debugInfo).map(([key, value]: [string, any]) => (
          <div key={key} className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
            <pre className="text-xs text-gray-600 mt-2 overflow-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h4 className="font-semibold text-blue-800">Summary:</h4>
        <ul className="text-sm text-blue-700 mt-2">
          <li>Session: {debugInfo.session?.hasSession ? '✅ Active' : '❌ No session'}</li>
          <li>Savings Products: {debugInfo.savingsProducts?.accessible ? '✅ Accessible' : '❌ Not accessible'}</li>
          <li>Savings Accounts: {debugInfo.savingsAccounts?.accessible ? '✅ Accessible' : '❌ Not accessible'}</li>
          <li>Interest Batches: {debugInfo.interestBatches?.accessible ? '✅ Accessible' : '❌ Not accessible'}</li>
          <li>Interest Details: {debugInfo.interestDetails?.accessible ? '✅ Accessible' : '❌ Not accessible'}</li>
          <li>Insert Test: {debugInfo.insertTest?.success ? '✅ Can insert' : '❌ Cannot insert'}</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseDebugger;





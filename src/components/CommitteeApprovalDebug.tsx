import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LoanStatusFlowService } from '../services/loanStatusFlowService';

const CommitteeApprovalDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebug = async () => {
      try {
        setLoading(true);
        
        // 1. Check database connection
        console.log('🔍 Testing database connection...');
        const { data: testData, error: testError } = await supabase
          .from('loan_applications')
          .select('count')
          .limit(1);
        
        if (testError) {
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        // 2. Get all loans
        console.log('🔍 Fetching all loans...');
        const { data: allLoans, error: allLoansError } = await supabase
          .from('loan_applications')
          .select('id, status, client_id, requested_amount, created_at')
          .order('created_at', { ascending: false });

        if (allLoansError) {
          throw new Error(`Failed to fetch loans: ${allLoansError.message}`);
        }

        // 3. Check statuses
        const statuses = [...new Set(allLoans.map(loan => loan.status))];
        const committeeLoans = allLoans.filter(loan => loan.status === 'pending_committee_review');

        // 4. Test LoanStatusFlowService
        console.log('🔍 Testing LoanStatusFlowService...');
        let flowServiceResult;
        try {
          flowServiceResult = await LoanStatusFlowService.getLoansForPage('committee_approval');
        } catch (flowError) {
          flowServiceResult = { error: flowError.message };
        }

        // 5. Check clients table
        console.log('🔍 Checking clients table...');
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .limit(5);

        setDebugInfo({
          databaseConnection: testError ? false : true,
          totalLoans: allLoans.length,
          loanStatuses: statuses,
          committeeLoans: committeeLoans.length,
          flowServiceResult: Array.isArray(flowServiceResult) ? flowServiceResult.length : flowServiceResult,
          clientsCount: clients?.length || 0,
          clientsError: clientsError?.message,
          sampleLoans: allLoans.slice(0, 3).map(loan => ({
            id: loan.id,
            status: loan.status,
            client_id: loan.client_id,
            amount: loan.requested_amount
          }))
        });

      } catch (error) {
        console.error('❌ Debug failed:', error);
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          databaseConnection: false
        });
      } finally {
        setLoading(false);
      }
    };

    runDebug();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">🔍 Debug Information - Loading...</h3>
        <div className="text-blue-700">Running diagnostic tests...</div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-yellow-900 mb-4">🔍 Committee Approval Debug Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Database Status</h4>
          <div className={`px-2 py-1 rounded text-xs ${debugInfo?.databaseConnection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {debugInfo?.databaseConnection ? '✅ Connected' : '❌ Failed'}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Total Loans</h4>
          <div className="text-yellow-700">{debugInfo?.totalLoans || 0}</div>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Loan Statuses</h4>
          <div className="text-yellow-700">
            {debugInfo?.loanStatuses?.length > 0 ? debugInfo.loanStatuses.join(', ') : 'None found'}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Committee Loans</h4>
          <div className="text-yellow-700">{debugInfo?.committeeLoans || 0}</div>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Flow Service Result</h4>
          <div className="text-yellow-700">
            {typeof debugInfo?.flowServiceResult === 'number' 
              ? `${debugInfo.flowServiceResult} loans` 
              : `Error: ${debugInfo?.flowServiceResult?.error || 'Unknown'}`
            }
          </div>
        </div>

        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Clients Table</h4>
          <div className="text-yellow-700">
            {debugInfo?.clientsError 
              ? `Error: ${debugInfo.clientsError}`
              : `${debugInfo?.clientsCount || 0} clients found`
            }
          </div>
        </div>
      </div>

      {debugInfo?.sampleLoans && debugInfo.sampleLoans.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-yellow-800 mb-2">Sample Loans</h4>
          <div className="space-y-1">
            {debugInfo.sampleLoans.map((loan: any, index: number) => (
              <div key={index} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                ID: {loan.id.slice(0, 8)}... | Status: {loan.status} | Amount: {loan.amount}
              </div>
            ))}
          </div>
        </div>
      )}

      {debugInfo?.error && (
        <div className="mt-4">
          <h4 className="font-medium text-red-800 mb-2">Error Details</h4>
          <div className="text-red-700 bg-red-100 p-2 rounded text-xs">
            {debugInfo.error}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeApprovalDebug;





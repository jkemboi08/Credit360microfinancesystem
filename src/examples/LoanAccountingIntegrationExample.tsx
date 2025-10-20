/**
 * Loan Accounting Integration Example
 * Shows how to integrate the loan accounting system with existing loan management pages
 */

import React, { useState, useEffect } from 'react';
import { useLoanAccounting } from '../hooks/useLoanAccounting';
import { supabase } from '../lib/supabaseClient';

interface LoanAccountingIntegrationExampleProps {
  loanId?: string;
  onAccountingProcessed?: (result: { success: boolean; error?: string }) => void;
}

const LoanAccountingIntegrationExample: React.FC<LoanAccountingIntegrationExampleProps> = ({
  loanId,
  onAccountingProcessed
}) => {
  const [loanData, setLoanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    isInitialized,
    isProcessing,
    error,
    accountingSummary,
    processLoanDisbursement,
    processLoanRepayment,
    processLoanLossProvision,
    refreshAccountingSummary,
    validateIntegrity
  } = useLoanAccounting(loanId);

  // Load loan data
  useEffect(() => {
    if (loanId) {
      loadLoanData();
    }
  }, [loanId]);

  const loadLoanData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', loanId)
        .single();

      if (error) throw error;
      setLoanData(data);
    } catch (error) {
      console.error('Error loading loan data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Example: Process loan disbursement accounting
  const handleLoanDisbursement = async () => {
    if (!loanData) return;

    const result = await processLoanDisbursement({
      loanId: loanData.id,
      clientId: loanData.client_id,
      disbursedAmount: loanData.approved_amount,
      disbursementDate: loanData.disbursement_date || new Date().toISOString().split('T')[0],
      interestRate: loanData.interest_rate,
      loanProductId: loanData.loan_product_id
    });

    onAccountingProcessed?.(result);
  };

  // Example: Process loan repayment accounting
  const handleLoanRepayment = async (principalAmount: number, interestAmount: number) => {
    if (!loanData) return;

    const result = await processLoanRepayment({
      loanId: loanData.id,
      clientId: loanData.client_id,
      principalAmount,
      interestAmount,
      paymentDate: new Date().toISOString().split('T')[0]
    });

    onAccountingProcessed?.(result);
  };

  // Example: Process loan loss provision
  const handleLoanLossProvision = async (provisionAmount: number) => {
    if (!loanData) return;

    const result = await processLoanLossProvision({
      loanId: loanData.id,
      clientId: loanData.client_id,
      provisionAmount
    });

    onAccountingProcessed?.(result);
  };

  // Example: Validate accounting integrity
  const handleValidateIntegrity = async () => {
    const validation = await validateIntegrity();
    
    if (validation.isValid) {
      alert('✅ Accounting system is healthy!');
    } else {
      alert(`❌ Accounting issues found: ${validation.errors.join(', ')}`);
    }
  };

  if (isLoading) {
    return <div>Loading loan data...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Loan Accounting Integration</h3>
      
      {/* System Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">System Status</h4>
        <div className="space-y-1 text-sm">
          <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
          <div>Processing: {isProcessing ? '⏳' : '✅'}</div>
          {error && <div className="text-red-600">Error: {error}</div>}
        </div>
      </div>

      {/* Loan Data */}
      {loanData && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <h4 className="font-medium mb-2">Loan Data</h4>
          <div className="text-sm space-y-1">
            <div>Loan ID: {loanData.id}</div>
            <div>Client ID: {loanData.client_id}</div>
            <div>Amount: ${loanData.approved_amount?.toLocaleString()}</div>
            <div>Interest Rate: {loanData.interest_rate}%</div>
            <div>Status: {loanData.status}</div>
            <div>Disbursed: {loanData.is_disbursed ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Accounting Actions */}
      <div className="space-y-3">
        <h4 className="font-medium">Accounting Actions</h4>
        
        {/* Loan Disbursement */}
        <button
          onClick={handleLoanDisbursement}
          disabled={!isInitialized || isProcessing || !loanData?.is_disbursed}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Process Loan Disbursement Accounting
        </button>

        {/* Loan Repayment */}
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Principal Amount"
            className="flex-1 px-3 py-2 border rounded"
            id="principalAmount"
          />
          <input
            type="number"
            placeholder="Interest Amount"
            className="flex-1 px-3 py-2 border rounded"
            id="interestAmount"
          />
          <button
            onClick={() => {
              const principal = parseFloat((document.getElementById('principalAmount') as HTMLInputElement)?.value || '0');
              const interest = parseFloat((document.getElementById('interestAmount') as HTMLInputElement)?.value || '0');
              handleLoanRepayment(principal, interest);
            }}
            disabled={!isInitialized || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Process Repayment
          </button>
        </div>

        {/* Loan Loss Provision */}
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Provision Amount"
            className="flex-1 px-3 py-2 border rounded"
            id="provisionAmount"
          />
          <button
            onClick={() => {
              const amount = parseFloat((document.getElementById('provisionAmount') as HTMLInputElement)?.value || '0');
              handleLoanLossProvision(amount);
            }}
            disabled={!isInitialized || isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Process Loss Provision
          </button>
        </div>

        {/* Validate Integrity */}
        <button
          onClick={handleValidateIntegrity}
          disabled={!isInitialized || isProcessing}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Validate Accounting Integrity
        </button>

        {/* Refresh Summary */}
        <button
          onClick={refreshAccountingSummary}
          disabled={!isInitialized || isProcessing}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Refresh Accounting Summary
        </button>
      </div>

      {/* Accounting Summary */}
      {accountingSummary && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <h4 className="font-medium mb-2">Accounting Summary</h4>
          <div className="text-sm">
            <div>Total Journal Entries: {accountingSummary.totalEntries}</div>
            {accountingSummary.journalEntries.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">Recent Entries:</div>
                {accountingSummary.journalEntries.slice(0, 3).map((entry: any, index: number) => (
                  <div key={index} className="text-xs text-gray-600">
                    {entry.entry_number}: {entry.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanAccountingIntegrationExample;





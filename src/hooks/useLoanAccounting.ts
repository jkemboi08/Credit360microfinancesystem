/**
 * Loan Accounting Hook
 * Provides accounting functionality for loan management
 */

import { useState, useEffect, useCallback } from 'react';
import LoanAccountingIntegration from '../services/loanAccountingIntegration';
import LoanAccountingService from '../services/loanAccountingService';

export interface LoanAccountingData {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  accountingSummary: any;
}

export const useLoanAccounting = (loanId?: string) => {
  const [data, setData] = useState<LoanAccountingData>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    accountingSummary: null
  });

  /**
   * Initialize loan accounting system
   */
  const initializeAccounting = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isProcessing: true, error: null }));
      
      await LoanAccountingIntegration.initialize();
      
      setData(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isProcessing: false 
      }));
      
      console.log('✅ Loan accounting system initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      console.error('❌ Failed to initialize loan accounting:', error);
    }
  }, []);

  /**
   * Process loan disbursement accounting
   */
  const processLoanDisbursement = useCallback(async (loanData: {
    loanId: string;
    clientId: string;
    disbursedAmount: number;
    disbursementDate: string;
    interestRate: number;
    loanProductId: string;
  }) => {
    try {
      setData(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const result = await LoanAccountingService.processLoanDisbursement(loanData);
      
      if (result.success) {
        console.log('✅ Loan disbursement accounting processed');
        // Refresh accounting summary if this is the current loan
        if (loanId === loanData.loanId) {
          await refreshAccountingSummary();
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
      setData(prev => ({ ...prev, isProcessing: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      console.error('❌ Failed to process loan disbursement accounting:', error);
      return { success: false, error: errorMessage };
    }
  }, [loanId]);

  /**
   * Process loan repayment accounting
   */
  const processLoanRepayment = useCallback(async (repaymentData: {
    loanId: string;
    clientId: string;
    principalAmount: number;
    interestAmount: number;
    paymentDate: string;
  }) => {
    try {
      setData(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const results = [];
      
      // Process principal repayment
      if (repaymentData.principalAmount > 0) {
        const principalResult = await LoanAccountingService.processPrincipalRepayment({
          loanId: repaymentData.loanId,
          clientId: repaymentData.clientId,
          principalAmount: repaymentData.principalAmount,
          paymentDate: repaymentData.paymentDate
        });
        results.push(principalResult);
      }
      
      // Process interest collection
      if (repaymentData.interestAmount > 0) {
        const interestResult = await LoanAccountingService.processInterestCollection({
          loanId: repaymentData.loanId,
          clientId: repaymentData.clientId,
          interestAmount: repaymentData.interestAmount,
          paymentDate: repaymentData.paymentDate
        });
        results.push(interestResult);
      }
      
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        console.log('✅ Loan repayment accounting processed');
        // Refresh accounting summary if this is the current loan
        if (loanId === repaymentData.loanId) {
          await refreshAccountingSummary();
        }
      } else {
        const errors = results.filter(result => !result.success).map(result => result.error);
        throw new Error(errors.join('; '));
      }
      
      setData(prev => ({ ...prev, isProcessing: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      console.error('❌ Failed to process loan repayment accounting:', error);
      return { success: false, error: errorMessage };
    }
  }, [loanId]);

  /**
   * Process loan loss provision
   */
  const processLoanLossProvision = useCallback(async (provisionData: {
    loanId: string;
    clientId: string;
    provisionAmount: number;
  }) => {
    try {
      setData(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const result = await LoanAccountingService.processLoanLossProvision({
        loanId: provisionData.loanId,
        clientId: provisionData.clientId,
        provisionAmount: provisionData.provisionAmount,
        provisionDate: new Date().toISOString().split('T')[0]
      });
      
      if (result.success) {
        console.log('✅ Loan loss provision accounting processed');
        // Refresh accounting summary if this is the current loan
        if (loanId === provisionData.loanId) {
          await refreshAccountingSummary();
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
      setData(prev => ({ ...prev, isProcessing: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      console.error('❌ Failed to process loan loss provision accounting:', error);
      return { success: false, error: errorMessage };
    }
  }, [loanId]);

  /**
   * Refresh accounting summary for current loan
   */
  const refreshAccountingSummary = useCallback(async () => {
    if (!loanId) return;
    
    try {
      const summary = await LoanAccountingIntegration.getLoanAccountingSummary(loanId);
      setData(prev => ({ ...prev, accountingSummary: summary }));
    } catch (error) {
      console.error('❌ Failed to refresh accounting summary:', error);
    }
  }, [loanId]);

  /**
   * Process daily interest accrual
   */
  const processDailyInterestAccrual = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isProcessing: true, error: null }));
      
      await LoanAccountingIntegration.processDailyInterestAccrual();
      
      setData(prev => ({ ...prev, isProcessing: false }));
      console.log('✅ Daily interest accrual processed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      console.error('❌ Failed to process daily interest accrual:', error);
    }
  }, []);

  /**
   * Validate accounting integrity
   */
  const validateIntegrity = useCallback(async () => {
    try {
      const validation = await LoanAccountingIntegration.validateAccountingIntegrity();
      
      if (!validation.isValid) {
        setData(prev => ({ 
          ...prev, 
          error: `Accounting integrity issues: ${validation.errors.join(', ')}` 
        }));
      }
      
      return validation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({ ...prev, error: errorMessage }));
      return { isValid: false, errors: [errorMessage] };
    }
  }, []);

  // Initialize accounting system on mount
  useEffect(() => {
    initializeAccounting();
  }, [initializeAccounting]);

  // Refresh accounting summary when loanId changes
  useEffect(() => {
    if (loanId) {
      refreshAccountingSummary();
    }
  }, [loanId, refreshAccountingSummary]);

  return {
    ...data,
    initializeAccounting,
    processLoanDisbursement,
    processLoanRepayment,
    processLoanLossProvision,
    refreshAccountingSummary,
    processDailyInterestAccrual,
    validateIntegrity
  };
};

export default useLoanAccounting;





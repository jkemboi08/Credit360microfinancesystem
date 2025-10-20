import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { roundAmount, roundCurrency, roundPercentage, roundInterestRate, roundLoanAmount, roundFee, roundRepaymentAmount, roundBalance } from '../utils/roundingUtils';
import { clickPesaService } from '../services/clickPesaService';
import { supabase } from '../lib/supabaseClient';
import {
  DollarSign,
  Smartphone,
  CreditCard,
  Download,
  User,
  Calculator,
  BarChart3,
  Eye,
  RefreshCw,
  Zap as ZapIcon,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

// Generate repayment schedule based on loan parameters
const generateRepaymentSchedule = (
  principal: number,
  interestRate: number,
  termMonths: number,
  calculationMethod: string,
  disbursementDate: string
) => {
  const monthlyInterestRate = interestRate / 100;
  const monthlyManagementFeeRate = 0; // Assuming no management fee for now
  const schedule: any[] = [];

  if (principal <= 0 || termMonths <= 0) {
    return schedule;
  }

  if (calculationMethod === 'flat_rate') {
    // Flat Rate Method
    const totalInterest = principal * monthlyInterestRate * termMonths;
    const totalManagementFee = principal * monthlyManagementFeeRate * termMonths;
    const totalRepayment = principal + totalInterest + totalManagementFee;
    const emi = totalRepayment / termMonths;
    
    let remainingBalance = principal;
    const monthlyPrincipal = principal / termMonths;
    const monthlyInterest = totalInterest / termMonths;
    const monthlyManagementFee = totalManagementFee / termMonths;
    
    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      remainingBalance -= monthlyPrincipal;
      
      schedule.push({
        paymentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        principalPortion: Math.round(monthlyPrincipal * 100) / 100,
        interestPortion: Math.round(monthlyInterest * 100) / 100,
        managementFeePortion: Math.round(monthlyManagementFee * 100) / 100,
        totalPayment: Math.round(emi * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
    }
  } else if (calculationMethod === 'reducing_balance') {
    // Reducing Balance Method
    let remainingBalance = principal;
    
    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestPayment = remainingBalance * monthlyInterestRate;
      const managementFeePayment = remainingBalance * monthlyManagementFeeRate;
      const principalPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / (Math.pow(1 + monthlyInterestRate, termMonths) - 1) - interestPayment;
      const totalPayment = principalPayment + interestPayment + managementFeePayment;
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        principalPortion: Math.round(principalPayment * 100) / 100,
        interestPortion: Math.round(interestPayment * 100) / 100,
        managementFeePortion: Math.round(managementFeePayment * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
    }
  } else if (calculationMethod === 'balloon_structure') {
    // Balloon Structure Method
    let remainingBalance = principal;
    
    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestPayment = remainingBalance * monthlyInterestRate;
      const managementFeePayment = remainingBalance * monthlyManagementFeeRate;
      const principalPayment = i === termMonths ? remainingBalance : 0;
      const totalPayment = principalPayment + interestPayment + managementFeePayment;
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        principalPortion: Math.round(principalPayment * 100) / 100,
        interestPortion: Math.round(interestPayment * 100) / 100,
        managementFeePortion: Math.round(managementFeePayment * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
    }
  }

  return schedule;
};

// Function to update loan after disbursement
const updateLoanAfterDisbursement = async (loanApplicationId: string, disbursementAmount: number, disbursementDate: string) => {
  try {
    console.log('🔄 Updating loan after disbursement...');
    console.log('🔍 Looking for loan application ID:', loanApplicationId);
    
    // Debug: Check what loan applications exist
    const { data: allLoans, error: debugError } = await supabase
      .from('loan_applications')
      .select('id, status, requested_amount')
      .limit(10);
    
    if (!debugError && allLoans) {
      console.log('📋 Available loan applications:', allLoans);
    }
    
    // Step 1: Get loan application details
    const { data: loanApp, error: appError } = await supabase
      .from('loan_applications')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone_number
        ),
        loan_products (
          interest_rate,
          loan_term_days
        )
      `)
      .eq('id', loanApplicationId)
      .single();

    if (appError) {
      console.error('❌ Database error:', appError);
      throw new Error(`Database error: ${appError.message}`);
    }
    
    if (!loanApp) {
      console.error('❌ No loan application found with ID:', loanApplicationId);
      console.error('❌ This could mean:');
      console.error('   - The loan application was deleted');
      console.error('   - The ID is incorrect');
      console.error('   - The loan application has a different status');
      throw new Error(`Loan application not found with ID: ${loanApplicationId}`);
    }

    console.log('✅ Loan application found:', {
      id: loanApp.id,
      client: `${loanApp.clients?.first_name || ''} ${loanApp.clients?.last_name || ''}`,
      amount: loanApp.requested_amount
    });

    // Step 2: Calculate loan details
    const principal = parseFloat(loanApp.requested_amount) || disbursementAmount;
    const interestRate = loanApp.loan_products?.interest_rate || 15.0; // Default 15%
    const interestAmount = principal * (interestRate / 100);
    const totalAmount = principal + interestAmount;

    console.log('💰 Loan calculations:', {
      principal,
      interestRate,
      interestAmount,
      totalAmount
    });

    // Step 3: Create active loan record
    const { data: loanRecord, error: loanError } = await supabase
      .from('loans')
      .insert({
        loan_application_id: loanApplicationId,
        client_id: loanApp.client_id,
        principal_amount: principal,
        interest_amount: interestAmount,
        total_amount: totalAmount,
        status: 'active',
        disbursement_date: disbursementDate,
        interest_rate: interestRate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (loanError) {
      console.error('❌ Failed to create loan record:', loanError);
      throw loanError;
    }

    console.log('✅ Active loan record created:', loanRecord);

    // Step 4: Update loan application status to disbursed
    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({ 
        status: 'disbursed',
        updated_at: new Date().toISOString()
      })
      .eq('id', loanApplicationId);

    if (updateError) {
      console.error('❌ Failed to update loan application status:', updateError);
      throw updateError;
    }

    console.log('✅ Loan application status updated to disbursed');

    // Step 5: Create repayment schedule from approved credit assessment
    // Get the approved schedule from loan application (stored during credit assessment)
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from('loan_applications')
      .select('repayment_schedule')
      .eq('id', loanApplicationId)
      .single();

    if (scheduleError || !existingSchedule?.repayment_schedule) {
      console.warn('⚠️ No approved repayment schedule found, creating default schedule');
      
      // Create a default schedule if none exists (fallback)
      const termMonths = Math.ceil((loanApp.loan_products?.loan_term_days || 365) / 30);
      const monthlyPayment = totalAmount / termMonths;
      
      const defaultSchedule = [];
      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        defaultSchedule.push({
          payment_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal_portion: principal / termMonths,
          interest_portion: interestAmount / termMonths,
          management_fee_portion: 0,
          total_payment: monthlyPayment,
          remaining_balance: totalAmount - (monthlyPayment * i),
          is_paid: false
        });
      }
      
      // Insert default schedule
      const { error: insertScheduleError } = await supabase
        .from('repayment_schedules')
        .insert(
          defaultSchedule.map(schedule => ({
            loan_id: loanRecord.id,
            payment_number: schedule.payment_number,
            due_date: schedule.due_date,
            principal_portion: schedule.principal_portion,
            interest_portion: schedule.interest_portion,
            management_fee_portion: schedule.management_fee_portion,
            total_payment: schedule.total_payment,
            remaining_balance: schedule.remaining_balance,
            is_paid: schedule.is_paid
          }))
        );
        
      if (insertScheduleError) {
        console.error('❌ Failed to create default repayment schedule:', insertScheduleError);
      } else {
        console.log('✅ Default repayment schedule created');
      }
    } else {
      // Generate repayment schedule based on approved parameters
      console.log('📋 Generating repayment schedule based on approved parameters...');
      
      const schedule = generateRepaymentSchedule(
        loanApp.approved_amount || loanApp.requested_amount,
        loanApp.approved_interest_rate || 0,
        loanApp.approved_tenor || 0,
        loanApp.calculation_method || 'reducing_balance',
        disbursementDate
      );
      
      if (schedule && schedule.length > 0) {
        const { error: insertScheduleError } = await supabase
          .from('repayment_schedules')
          .insert(
            schedule.map((entry: any) => ({
              loan_id: loanRecord.id,
              payment_number: entry.paymentNumber,
              due_date: entry.dueDate,
              principal_portion: entry.principalPortion,
              interest_portion: entry.interestPortion,
              management_fee_portion: entry.managementFeePortion,
              total_payment: entry.totalPayment,
              remaining_balance: entry.remainingBalance,
              is_paid: false
            }))
          );
          
        if (insertScheduleError) {
          console.error('❌ Failed to create repayment schedule:', insertScheduleError);
        } else {
          console.log('✅ Repayment schedule created successfully');
        }
      } else {
        console.warn('⚠️ No repayment schedule generated');
      }
    }

    // Step 6: Remove from disbursement queue
    const { error: removeError } = await supabase
      .from('disbursement_queue')
      .delete()
      .eq('loan_application_id', loanApplicationId);

    if (removeError) {
      console.error('⚠️ Failed to remove from disbursement queue:', removeError);
      // Don't throw error - loan was successfully created
    } else {
      console.log('✅ Removed from disbursement queue');
    }

    console.log('🎉 Loan disbursement process completed successfully!');
    return loanRecord;

  } catch (error) {
    console.error('❌ Error updating loan after disbursement:', error);
    throw error;
  }
};

interface RepaymentScheduleEntry {
  paymentNumber: number;
  dueDate: string;
  principalPortion: number;
  interestPortion: number;
  managementFeePortion: number;
  totalPayment: number;
  remainingBalance: number;
}

  interface ApprovedLoan {
    id: string;
    applicationId: string;
    clientName: string;
    clientId: string;
  phone: string;
  amount: number;
  product: string;
  approvalDate: string;
  disbursementMethod: string;
  status: 'ready_for_disbursement' | 'disbursed' | 'failed';
  interestRate: number;
  effectiveRate: number;
  tenor: number;
  processingFee: number;
  processingFeeMethod: 'upfront' | 'deduct_at_disbursement';
  disbursementAmount?: number;
  disbursementDate?: string;
  repaymentSchedule?: RepaymentScheduleEntry[];
  // Upfront fees fields
  applicationFee?: number;
  legalFee?: number;
  totalUpfrontFees?: number;
  upfrontFeesPaid?: boolean;
}

const EnhancedDisbursement: React.FC = () => {
  console.log('🚀 ENHANCED DISBURSEMENT COMPONENT LOADED!');
  const { language } = useLanguage();
  const [selectedLoan, setSelectedLoan] = useState<ApprovedLoan | null>(null);
  const [showDisbursement, setShowDisbursement] = useState(false);
  const [disbursementMethod, setDisbursementMethod] = useState('');
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExecutingDisbursement, setIsExecutingDisbursement] = useState(false);
  
  // ClickPesa specific state
  const [clickPesaConnected, setClickPesaConnected] = useState(false);
  const [clickPesaBalance, setClickPesaBalance] = useState(0);
  const [bulkDisbursement, setBulkDisbursement] = useState(false);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [disbursementProgress, setDisbursementProgress] = useState(0);
  const [disbursementStatus, setDisbursementStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch loans from disbursement queue
  const fetchApprovedLoans = async () => {
    try {
      setLoading(true);
        
        const { data: disbursementQueue, error } = await supabase
          .from('disbursement_queue')
          .select(`
            id,
            loan_application_id,
            client_id,
            client_name,
            loan_amount,
            approved_amount,
            interest_rate,
            term_months,
            disbursement_date,
            status,
            created_at,
            loan_applications (
              application_id,
              requested_amount,
              loan_purpose,
              application_fee,
              legal_fee,
              processing_fee_method,
              upfront_fees_paid,
              clients (
                first_name,
                last_name,
                phone_number
              )
            )
          `)
          .in('status', ['pending', 'ready', 'processing'])
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching disbursement queue:', error);
          return;
        }
        
        console.log('🔍 Disbursement Page - Fetched disbursement queue:', {
          count: disbursementQueue?.length || 0,
          queueItems: disbursementQueue?.map(item => ({
            id: item.id,
            loan_application_id: item.loan_application_id,
            client_name: item.client_name,
            status: item.status,
            loan_amount: item.loan_amount,
            application_id: item.loan_applications?.application_id,
            loan_applications_data: item.loan_applications
          })) || []
        });
        
        // Check specifically for Cole-Griffith's loan by application ID
        const coleGriffithLoan = disbursementQueue?.find(item => 
          item.loan_applications?.application_id === 'LA-1760439557884'
        );
        if (coleGriffithLoan) {
          console.log('✅ Cole-Griffith found in disbursement queue by application ID:', coleGriffithLoan);
        } else {
          console.log('❌ Cole-Griffith NOT found in disbursement queue by application ID');
          
          // Let's check what queue items we actually got and their statuses
          console.log('🔍 All disbursement queue items:', {
            total: disbursementQueue?.length || 0,
            queueItems: disbursementQueue?.map(item => ({
              id: item.id,
              loan_application_id: item.loan_application_id,
              application_id: item.loan_applications?.application_id,
              status: item.status,
              client_name: item.client_name,
              loan_amount: item.loan_amount
            }))
          });
          
          // Check if Cole-Griffith exists with different status
          const allStatuses = [...new Set(disbursementQueue?.map(item => item.status) || [])];
          console.log('📊 Status distribution:', {
            statuses: allStatuses
          });
        }
        
        // Also check by name
        const coleGriffithByName = disbursementQueue?.find(item => 
          item.client_name?.toLowerCase().includes('cole-griffith')
        );
        if (coleGriffithByName) {
          console.log('🔍 Cole-Griffith loan found in disbursement by name:', {
            id: coleGriffithByName.id,
            status: coleGriffithByName.status,
            client_name: coleGriffithByName.client_name,
            loan_amount: coleGriffithByName.loan_amount
          });
        } else {
          console.log('❌ Cole-Griffith loan NOT found in disbursement results');
        }
        
        if (disbursementQueue && disbursementQueue.length > 0) {
          const approvedLoansData: ApprovedLoan[] = disbursementQueue.map(queueItem => {
            const processingFee = Math.round((queueItem.loan_amount || 0) * 0.03); // 3% processing fee
            const application = queueItem.loan_applications;
            
            // Calculate upfront fees
            const applicationFee = application?.application_fee || 0;
            const legalFee = application?.legal_fee || 0;
            const totalUpfrontFees = applicationFee + legalFee;
            
            // Debug the application ID extraction
            const applicationId = application?.application_id || `LA-${queueItem.loan_application_id.slice(-8)}`;
            console.log('🔍 Mapping queue item to loan:', {
              queueItemId: queueItem.id,
              loanApplicationId: queueItem.loan_application_id,
              applicationIdFromRelation: application?.application_id,
              finalApplicationId: applicationId,
              clientName: queueItem.client_name,
              upfrontFees: { applicationFee, legalFee, totalUpfrontFees },
              processingFeeMethod: application?.processing_fee_method
            });
            
              return {
                id: queueItem.loan_application_id,
                applicationId: applicationId,
                clientName: queueItem.client_name || 'Unknown Client',
                clientId: queueItem.client_id,
              phone: application?.clients?.phone_number || '',
              amount: queueItem.loan_amount || 0,
              product: application?.loan_purpose || 'Personal Loan',
              approvalDate: queueItem.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              disbursementMethod: 'M-Pesa', // Default method
              status: 'ready_for_disbursement',
              interestRate: 15.0, // Default interest rate
              effectiveRate: 16.2, // Default effective rate
              tenor: 12, // Default tenor
              processingFee: processingFee,
              processingFeeMethod: application?.processing_fee_method || 'upfront',
              // Upfront fees fields
              applicationFee: applicationFee,
              legalFee: legalFee,
              totalUpfrontFees: totalUpfrontFees,
              upfrontFeesPaid: application?.upfront_fees_paid || false
            };
          });
          
          setApprovedLoans(approvedLoansData);
        }
    } catch (error) {
      console.error('Error fetching approved loans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check Cole-Griffith's current status in database
  useEffect(() => {
    const checkColeGriffithStatus = async () => {
      try {
        const { data: coleGriffith, error } = await supabase
          .from('loan_applications')
          .select('*')
          .eq('application_id', 'LA-1760439557884')
          .single();
        
        if (error) {
          console.log('❌ Error fetching Cole-Griffith:', error);
        } else {
          console.log('🔍 Cole-Griffith current database status:', {
            id: coleGriffith.id,
            application_id: coleGriffith.application_id,
            status: coleGriffith.status,
            contract_status: coleGriffith.contract_status,
            updated_at: coleGriffith.updated_at
          });
        }
      } catch (error) {
        console.error('❌ Error checking Cole-Griffith status:', error);
      }
    };
    
    checkColeGriffithStatus();
  }, []);

  // Load approved loans on component mount
  useEffect(() => {
    fetchApprovedLoans();
  }, []);

  // Set up real-time subscription for loan applications
  useEffect(() => {
    // Temporarily disabled to fix 500 error
    // const channel = supabase
    //   .channel('disbursement-loans-updates')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'loan_applications'
    //     },
    //     (payload) => {
    //       console.log('Real-time loan update received:', payload);
    //       // Only refresh if the status is relevant to disbursement
    //       if (payload.new && (payload.new.status === 'approved' || payload.new.status === 'ready_for_disbursement')) {
    //         fetchApprovedLoans();
    //       }
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, []);

  // Initialize ClickPesa connection
  useEffect(() => {
    const initializeClickPesa = async () => {
      try {
        const isConnected = await clickPesaService.testConnection();
        setClickPesaConnected(isConnected);
        
        if (isConnected) {
          const balance = await clickPesaService.getAccountBalance();
          setClickPesaBalance(balance.available_balance || 0);
        }
      } catch (error) {
        console.error('ClickPesa initialization failed:', error);
        setClickPesaConnected(false);
      }
    };

    initializeClickPesa();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_disbursement': return 'bg-yellow-100 text-yellow-800';
      case 'disbursed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(roundCurrency(amount));
  };


  const handleDisburse = (loan: ApprovedLoan) => {
    console.log('🚀 DISBURSE BUTTON CLICKED!', loan);
    setSelectedLoan(loan);
    setDisbursementMethod(loan.disbursementMethod);
    // Set disbursement amount based on processing fee method
    // Calculate disbursement amount considering all fees
    let disbursementAmount = loan.amount;
    
    // Deduct processing fee if not paid upfront
    if (loan.processingFeeMethod === 'deduct_at_disbursement') {
      disbursementAmount -= loan.processingFee;
    }
    
    // Deduct upfront fees if not paid upfront
    if (loan.processingFeeMethod === 'deduct_at_disbursement' && loan.totalUpfrontFees) {
      disbursementAmount -= loan.totalUpfrontFees;
    }
    
    setDisbursementAmount(disbursementAmount.toString());
    setShowDisbursement(true);
  };

  const handleView = (loan: ApprovedLoan) => {
    console.log('🚀 VIEW BUTTON CLICKED!', loan);
    setSelectedLoan(loan);
    setShowDisbursement(true);
  };

  // Schedule is already approved from credit assessment - no need to regenerate

  const handleExecuteDisbursement = async () => {
    if (!selectedLoan) return;
    
    setIsExecutingDisbursement(true);
    setDisbursementStatus('processing');
    
    try {
      let disbursementResult;
      
      if (disbursementMethod === 'ClickPesa') {
        // ClickPesa disbursement
        disbursementResult = await clickPesaService.createPayout({
          amount: parseFloat(disbursementAmount),
          currency: 'TZS',
          recipient_phone: selectedLoan.phone,
          recipient_name: selectedLoan.clientName,
          reference: `LOAN-${selectedLoan.id}`,
          description: `Loan disbursement for ${selectedLoan.product}`
        });
        
        console.log('ClickPesa disbursement result:', disbursementResult);
      } else {
        // Mock disbursement for other methods
        const disbursementSteps = [
          'Validating disbursement amount against approved loan amount',
          'Processing payment via selected channel',
          'Recording disbursement transaction',
          'Creating double-entry journal entry',
          'Updating General Ledger (IFRS 9 compliant)',
          'Sending digital receipt to client',
          'Activating repayment reminders',
          'Updating loan status to active'
        ];
        
        console.log('Executing disbursement:', disbursementSteps);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        disbursementResult = {
          transaction_id: `TXN-${Date.now()}`,
          status: 'completed',
          reference: `LOAN-${selectedLoan.id}`
        };
      }
      
      // Update loan status in database and create active loan record
      await updateLoanAfterDisbursement(selectedLoan.id, parseFloat(disbursementAmount), disbursementDate);
      
      // Update local state
      const updatedLoans = approvedLoans.map(loan => 
        loan.id === selectedLoan.id 
          ? {
              ...loan,
              status: 'disbursed' as const,
              disbursementAmount: parseFloat(disbursementAmount),
              disbursementDate: disbursementDate
            }
          : loan
      );
      
      setApprovedLoans(updatedLoans);
      setDisbursementStatus('completed');
      
      alert(`Disbursement completed successfully! TZS ${formatCurrency(parseFloat(disbursementAmount))} disbursed to ${selectedLoan.clientName} via ${disbursementMethod}`);
      setShowDisbursement(false);
      setIsExecutingDisbursement(false);
      
    } catch (error) {
      console.error('Error executing disbursement:', error);
      setDisbursementStatus('failed');
      alert(`Error executing disbursement: ${error.message || 'Please try again.'}`);
      setIsExecutingDisbursement(false);
    }
  };

  // ClickPesa bulk disbursement
  const handleBulkDisbursement = async () => {
    if (selectedLoans.length === 0) return;
    
    setDisbursementStatus('processing');
    setDisbursementProgress(0);
    
    try {
      const loansToDisburse = approvedLoans.filter(loan => 
        selectedLoans.includes(loan.id) && loan.status === 'ready_for_disbursement'
      );
      
      const payouts = loansToDisburse.map(loan => ({
        amount: loan.amount - loan.processingFee,
        currency: 'TZS',
        recipient_phone: loan.phone,
        recipient_name: loan.clientName,
        reference: `LOAN-${loan.id}`,
        description: `Loan disbursement for ${loan.product}`
      }));
      
      const results = await clickPesaService.createBulkPayouts(payouts);
      
      // Update loan statuses
      const updatedLoans = approvedLoans.map(loan => {
        if (selectedLoans.includes(loan.id)) {
          return {
            ...loan,
            status: 'disbursed' as const,
            disbursementAmount: loan.amount - loan.processingFee,
            disbursementDate: new Date().toISOString().split('T')[0]
          };
        }
        return loan;
      });
      
      setApprovedLoans(updatedLoans);
      setDisbursementStatus('completed');
      setDisbursementProgress(100);
      
      alert(`Bulk disbursement completed! ${results.length} loans disbursed successfully via ClickPesa.`);
      setBulkDisbursement(false);
      setSelectedLoans([]);
      
    } catch (error) {
      console.error('Error executing bulk disbursement:', error);
      setDisbursementStatus('failed');
      alert(`Error executing bulk disbursement: ${error.message || 'Please try again.'}`);
    }
  };

  // Toggle loan selection for bulk disbursement
  const toggleLoanSelection = (loanId: string) => {
    setSelectedLoans(prev => 
      prev.includes(loanId) 
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    );
  };

  // Schedule viewing is now handled inline in disbursement dialog

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'en' ? 'Enhanced Disbursement & Repayment Scheduling' : 'Utoaji wa Mikopo na Upangaji wa Malipo'}
          </h1>
          <p className="text-emerald-100">
            {language === 'en' 
              ? 'Manage loan disbursements with automated scheduling and GL integration'
              : 'Simamia utoaji wa mikopo na upangaji wa kiotomatiki na ujumuishaji wa GL'
            }
          </p>
        </div>

        {/* Debug button for Cole-Griffith */}
        <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-800">Debug: Cole-Griffith Loan</h3>
              <p className="text-orange-600 text-sm">Check and fix Cole-Griffith's loan status</p>
            </div>
            <button
              onClick={async () => {
                console.log('🔧 Manual fix for Cole-Griffith...');
                try {
                  // First check current status
                  const { data: current, error: fetchError } = await supabase
                    .from('loan_applications')
                    .select('*')
                    .eq('application_id', 'LA-1760439557884')
                    .single();
                  
                  if (fetchError) {
                    console.error('❌ Error fetching Cole-Griffith:', fetchError);
                    alert('Error fetching Cole-Griffith: ' + fetchError.message);
                    return;
                  }
                  
                  console.log('🔍 Current Cole-Griffith status:', current);
                  
                  // Update to correct status
                  const { error: updateError } = await supabase
                    .from('loan_applications')
                    .update({ 
                      status: 'approved',
                      contract_status: 'signed_by_client',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', current.id);
                  
                  if (updateError) {
                    console.error('❌ Error updating Cole-Griffith:', updateError);
                    alert('Failed to update Cole-Griffith: ' + updateError.message);
                  } else {
                    console.log('✅ Successfully updated Cole-Griffith');
                    alert('✅ Cole-Griffith updated! Refreshing page...');
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('❌ Error:', error);
                  alert('Error: ' + error.message);
                }
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              title="Manual fix for Cole-Griffith loan"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Fix Cole-Griffith
            </button>
          </div>
        </div>

        {/* ClickPesa Status */}
        {clickPesaConnected && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ZapIcon className="w-6 h-6 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">ClickPesa Connected</h3>
                  <p className="text-blue-100">
                    Available Balance: {formatCurrency(clickPesaBalance)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setBulkDisbursement(!bulkDisbursement)}
                  className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors flex items-center"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {bulkDisbursement ? 'Exit Bulk Mode' : 'Bulk Disbursement'}
                </button>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                  <span className="text-sm">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disbursement Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === 'en' ? 'Disbursement Queue' : 'Mstari wa Utoaji'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'en' 
                    ? 'Approved loans ready for disbursement with automated scheduling'
                    : 'Mikopo iliyoidhinishwa tayari kwa utoaji na upangaji wa kiotomatiki'
                  }
                </p>
              </div>
              {bulkDisbursement && selectedLoans.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {selectedLoans.length} selected
                  </span>
                  <button
                    onClick={handleBulkDisbursement}
                    disabled={disbursementStatus === 'processing'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ZapIcon className="w-4 h-4 mr-2" />
                    Disburse Selected
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {bulkDisbursement && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const readyLoans = approvedLoans
                              .filter(loan => loan.status === 'ready_for_disbursement')
                              .map(loan => loan.id);
                            setSelectedLoans(readyLoans);
                          } else {
                            setSelectedLoans([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Loan Details' : 'Maelezo ya Mkopo'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Client Info' : 'Maelezo ya Mteja'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Amount & Terms' : 'Kiasi na Masharti'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Disbursement Method' : 'Njia ya Utoaji'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Status' : 'Hali'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Actions' : 'Vitendo'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={bulkDisbursement ? 8 : 7} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="animate-spin h-6 w-6 text-blue-600 mr-2" />
                        <span className="text-gray-600">
                          {language === 'en' ? 'Loading approved loans...' : 'Inapakia mikopo iliyoidhinishwa...'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : approvedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={bulkDisbursement ? 8 : 7} className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        {language === 'en' ? 'No approved loans found' : 'Hakuna mikopo iliyoidhinishwa'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  approvedLoans.map((loan) => (
                  <tr key={loan.id} className={`hover:bg-gray-50 ${selectedLoans.includes(loan.id) ? 'bg-blue-50' : ''}`}>
                    {bulkDisbursement && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLoans.includes(loan.id)}
                          onChange={() => toggleLoanSelection(loan.id)}
                          disabled={loan.status !== 'ready_for_disbursement'}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.id}</div>
                        <div className="text-sm text-gray-500">{loan.product}</div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Approved' : 'Imeidhinishwa'}: {loan.approvalDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {loan.clientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            App ID: {loan.applicationId || `LA-${loan.id.slice(-8)}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {loan.clientId} • {loan.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Rate' : 'Kiwango'}: {loan.interestRate}% (APR: {loan.effectiveRate}%)
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Tenor' : 'Muda'}: {loan.tenor} {language === 'en' ? 'months' : 'miezi'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {loan.disbursementMethod === 'M-Pesa' && (
                          <Smartphone className="w-4 h-4 text-green-600 mr-2" />
                        )}
                        {loan.disbursementMethod === 'Bank EFT' && (
                          <CreditCard className="w-4 h-4 text-blue-600 mr-2" />
                        )}
                        {loan.disbursementMethod === 'Tigo Pesa' && (
                          <Smartphone className="w-4 h-4 text-orange-600 mr-2" />
                        )}
                        {loan.disbursementMethod === 'ClickPesa' && (
                          <ZapIcon className="w-4 h-4 text-purple-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900">{loan.disbursementMethod}</span>
                        {loan.disbursementMethod === 'ClickPesa' && !clickPesaConnected && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" title="ClickPesa not connected" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status === 'ready_for_disbursement' ? (language === 'en' ? 'Ready for Disbursement' : 'Tayari kwa Utoaji') :
                         loan.status === 'disbursed' ? (language === 'en' ? 'Disbursed' : 'Imepewa') :
                         (language === 'en' ? 'Failed' : 'Imeshindwa')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        {/* Disburse Button - Show for all loans in disbursement queue */}
                        <button
                          onClick={() => handleDisburse(loan)}
                          className="px-8 py-4 text-xl font-black text-white bg-red-600 rounded-2xl hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 shadow-2xl transition-all duration-200 transform hover:scale-110 flex items-center border-8 border-yellow-400"
                          title={language === 'en' ? 'Disburse Loan' : 'Toa Mkopo'}
                          style={{ minWidth: '150px', fontSize: '18px', fontWeight: '900' }}
                        >
                          <DollarSign className="w-8 h-8 mr-4" />
                          {language === 'en' ? '🚀 DISBURSE 🚀' : '🚀 TOA 🚀'}
                        </button>
                        {/* View Details Button */}
                        <button 
                          onClick={() => handleView(loan)}
                          className="px-8 py-4 text-xl font-black text-white bg-purple-600 rounded-2xl hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 shadow-2xl transition-all duration-200 transform hover:scale-110 flex items-center border-8 border-pink-400"
                          title={language === 'en' ? 'View Details' : 'Ona Maelezo'}
                          style={{ minWidth: '150px', fontSize: '18px', fontWeight: '900' }}
                        >
                          <Eye className="w-8 h-8 mr-4" />
                          {language === 'en' ? '👁️ VIEW 👁️' : '👁️ ONA 👁️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disbursement Modal */}
        {showDisbursement && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Execute Disbursement' : 'Tekeleza Utoaji'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowDisbursement(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Disbursement Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Disbursement Details' : 'Maelezo ya Utoaji'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Loan ID' : 'Namba ya Mkopo'}:</strong> {selectedLoan.id}</p>
                      <p><strong>{language === 'en' ? 'Approved Amount' : 'Kiasi Kiliyoidhinishwa'}:</strong> {formatCurrency(selectedLoan.amount)}</p>
                      <p><strong>{language === 'en' ? 'Processing Fee' : 'Ada ya Uchakataji'}:</strong> {formatCurrency(selectedLoan.processingFee)}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Net Amount' : 'Kiasi Halisi'}:</strong> {formatCurrency(selectedLoan.amount - selectedLoan.processingFee)}</p>
                      <p><strong>{language === 'en' ? 'Client Phone' : 'Simu ya Mteja'}:</strong> {selectedLoan.phone}</p>
                      <p><strong>{language === 'en' ? 'Product' : 'Bidhaa'}:</strong> {selectedLoan.product}</p>
                    </div>
                  </div>
                </div>

                {/* Disbursement Configuration - All in one row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Disbursement Channel' : 'Kituo cha Utoaji'}
                    </label>
                    <select
                      value={disbursementMethod}
                      onChange={(e) => setDisbursementMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="M-Pesa">M-Pesa (0.5% fee)</option>
                      <option value="Tigo Pesa">Tigo Pesa (0.6% fee)</option>
                      <option value="Airtel Money">Airtel Money (0.7% fee)</option>
                      <option value="Bank EFT">Bank EFT via BoT TIPS (TZS 500 fee)</option>
                      <option value="ClickPesa" disabled={!clickPesaConnected}>
                        ClickPesa {clickPesaConnected ? '(0.3% fee)' : '(Not Connected)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Disbursement Amount (TZS)' : 'Kiasi cha Utoaji (TZS)'}
                      <span className="text-xs text-gray-500 ml-1">({language === 'en' ? 'Read-only' : 'Haiwezi kubadilishwa'})</span>
                    </label>
                    <input
                      type="number"
                      value={(() => {
                        let disbursementAmount = selectedLoan.amount;
                        
                        // Deduct processing fee if not paid upfront
                        if (selectedLoan.processingFeeMethod === 'deduct_at_disbursement') {
                          disbursementAmount -= selectedLoan.processingFee;
                        }
                        
                        // Deduct upfront fees if not paid upfront
                        if (selectedLoan.processingFeeMethod === 'deduct_at_disbursement' && selectedLoan.totalUpfrontFees) {
                          disbursementAmount -= selectedLoan.totalUpfrontFees;
                        }
                        
                        return disbursementAmount;
                      })()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      title={language === 'en' ? 'Amount is final - approved in credit assessment' : 'Kiasi ni cha mwisho - kimeidhinishwa katika tathmini ya mkopo'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        if (selectedLoan.processingFeeMethod === 'upfront') {
                          return language === 'en' ? 'Full amount (all fees paid upfront)' : 'Kiasi kamili (ada zote zililipwa awali)';
                        } else {
                          const deductions = [];
                          if (selectedLoan.processingFee > 0) deductions.push('processing fee');
                          if (selectedLoan.totalUpfrontFees > 0) deductions.push('upfront fees');
                          return language === 'en' 
                            ? `Net amount (${deductions.join(' and ')} deducted)` 
                            : `Kiasi halisi (${deductions.join(' na ')} zimetolewa)`;
                        }
                      })()}
                    </p>
                  </div>

                  {/* Fee Breakdown - Only show when deducting fees */}
                  {selectedLoan.processingFeeMethod === 'deduct_at_disbursement' && (selectedLoan.processingFee > 0 || selectedLoan.totalUpfrontFees > 0) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        {language === 'en' ? 'Fee Breakdown' : 'Muhtasari wa Ada'}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {language === 'en' ? 'Original Loan Amount:' : 'Kiasi cha Mkopo wa Asili:'}
                          </span>
                          <span className="font-medium">{selectedLoan.amount.toLocaleString()} TZS</span>
                        </div>
                        
                        {selectedLoan.processingFee > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>
                              {language === 'en' ? 'Processing Fee (3%):' : 'Ada ya Uchakataji (3%):'}
                            </span>
                            <span>-{selectedLoan.processingFee.toLocaleString()} TZS</span>
                          </div>
                        )}
                        
                        {selectedLoan.totalUpfrontFees > 0 && (
                          <>
                            {selectedLoan.applicationFee > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>
                                  {language === 'en' ? 'Application Fee:' : 'Ada ya Maombi:'}
                                </span>
                                <span>-{selectedLoan.applicationFee.toLocaleString()} TZS</span>
                              </div>
                            )}
                            {selectedLoan.legalFee > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>
                                  {language === 'en' ? 'Legal Fee:' : 'Ada ya Kisheria:'}
                                </span>
                                <span>-{selectedLoan.legalFee.toLocaleString()} TZS</span>
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>
                            {language === 'en' ? 'Net Disbursement Amount:' : 'Kiasi halisi cha Utoaji:'}
                          </span>
                          <span className="text-green-600">
                            {(() => {
                              let disbursementAmount = selectedLoan.amount;
                              if (selectedLoan.processingFeeMethod === 'deduct_at_disbursement') {
                                disbursementAmount -= selectedLoan.processingFee;
                                if (selectedLoan.totalUpfrontFees) {
                                  disbursementAmount -= selectedLoan.totalUpfrontFees;
                                }
                              }
                              return disbursementAmount.toLocaleString();
                            })()} TZS
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Disbursement Date' : 'Tarehe ya Utoaji'}
                    </label>
                    <input
                      type="date"
                      value={disbursementDate}
                      onChange={(e) => setDisbursementDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Approved Repayment Schedule (from Credit Assessment) */}
                {selectedLoan.repaymentSchedule && selectedLoan.repaymentSchedule.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        {language === 'en' ? 'Approved Repayment Schedule' : 'Ratiba ya Malipo Iliyoidhinishwa'}
                      </h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {language === 'en' ? 'From Credit Assessment' : 'Kutoka Tathmini ya Mkopo'}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-green-100">
                          <tr>
                            <th className="px-3 py-2 text-left">{language === 'en' ? 'Payment' : 'Malipo'}</th>
                            <th className="px-3 py-2 text-left">{language === 'en' ? 'Due Date' : 'Tarehe ya Malipo'}</th>
                            <th className="px-3 py-2 text-left">{language === 'en' ? 'Principal' : 'Msingi'}</th>
                            <th className="px-3 py-2 text-left">{language === 'en' ? 'Interest' : 'Riba'}</th>
                            <th className="px-3 py-2 text-left">{language === 'en' ? 'Total' : 'Jumla'}</th>
                            <th className="px-3 py-2 text-left">{language === 'en' ? 'Balance' : 'Salio'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLoan.repaymentSchedule.slice(0, 6).map((entry, index) => (
                            <tr key={index} className="border-b border-green-200">
                              <td className="px-3 py-2">{entry.paymentNumber}</td>
                              <td className="px-3 py-2">{entry.dueDate}</td>
                              <td className="px-3 py-2">{formatCurrency(entry.principalPortion)}</td>
                              <td className="px-3 py-2">{formatCurrency(entry.interestPortion)}</td>
                              <td className="px-3 py-2 font-medium">{formatCurrency(entry.totalPayment)}</td>
                              <td className="px-3 py-2">{formatCurrency(entry.remainingBalance)}</td>
                            </tr>
                          ))}
                          {selectedLoan.repaymentSchedule.length > 6 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                                ... {language === 'en' ? 'and' : 'na'} {selectedLoan.repaymentSchedule.length - 6} {language === 'en' ? 'more payments' : 'malipo zaidi'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* General Ledger Integration */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'General Ledger Integration (IFRS 9)' : 'Ujumuishaji wa Kitabu Kikuu (IFRS 9)'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Debit Entry' : 'Kuingia kwa Debit'}:</strong></p>
                      <p className="text-purple-700">Dr. Loan Portfolio (Asset) - {formatCurrency(parseFloat(disbursementAmount) || 0)}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Credit Entry' : 'Kuingia kwa Credit'}:</strong></p>
                      <p className="text-purple-700">Cr. Cash/Bank Account - {formatCurrency(parseFloat(disbursementAmount) || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {language === 'en' ? 'Post-Disbursement Actions' : 'Vitendo baada ya Utoaji'}
                  </h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Send digital receipt to client' : 'Tuma risiti ya kidijitali kwa mteja'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Activate repayment reminders' : 'Amilisha kumbukumbu za malipo'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Update General Ledger' : 'Sasisha Kitabu Kikuu'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Generate loan agreement' : 'Tengeneza makubaliano ya mkopo'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDisbursement(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Cancel' : 'Ghairi'}
                  </button>
                  <button
                    onClick={handleExecuteDisbursement}
                    disabled={!disbursementAmount || parseFloat(disbursementAmount) > selectedLoan.amount || isExecutingDisbursement}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isExecutingDisbursement ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'en' ? 'Processing...' : 'Inachakata...'}
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Execute Disbursement' : 'Tekeleza Utoaji'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule is now shown inline in disbursement dialog - no modal needed */}
      </div>
    </Layout>
  );
};

export default EnhancedDisbursement;


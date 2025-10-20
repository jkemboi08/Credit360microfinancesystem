import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useSupabaseQuery, useSupabaseSubscription } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import { FileText, Clock, CheckCircle, AlertCircle, Search, User, Upload, FileCheck, ArrowRight, BarChart3, Shield, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ContractService, ContractData } from '../services/contractService';
import { ApprovalLevelsService, ApprovalLevel } from '../services/approvalLevelsService';
import { LoanWorkflowTracker, LoanProgressStatus } from '../services/loanWorkflowTracker';
import { LoanStatusFlowService } from '../services/loanStatusFlowService';
import { useRealTimeStatus } from '../hooks/useRealTimeStatus';
import LoanApprovalWorkflow from '../components/LoanApprovalWorkflow';
import Layout from '../components/Layout';
import EnhancedLoanProcessingWorkflow from '../components/EnhancedLoanProcessingWorkflow';
import ContractUploadModal from '../components/ContractUploadModal';
import { LoanWorkflowStateMachine } from '../services/loanWorkflowStateMachine';
import { LoanSyncService } from '../utils/loanSyncService';

const LoanProcessing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showContractUpload, setShowContractUpload] = useState(false);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  
  // Tabbed workflow state
  const [activeTab, setActiveTab] = useState<'clients' | 'processing'>('clients');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedLoanForProcessing, setSelectedLoanForProcessing] = useState<any>(null);
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [currentApprovalLevel, setCurrentApprovalLevel] = useState<ApprovalLevel | null>(null);
  
  // Workflow tracking state
  const [loanProgressStatus, setLoanProgressStatus] = useState<LoanProgressStatus | null>(null);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [loansToRemove, setLoansToRemove] = useState<string[]>([]);

  // Fetch loan applications using the status flow service
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load loan applications for processing page
  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loan Processing - Loading loans...');
        
        // First, let's check what statuses exist in the database
        console.log('🔍 Testing direct Supabase query...');
        const { data: allLoans, error: allLoansError } = await supabase
          .from('loan_applications')
          .select('id, status, client_id, requested_amount')
          .order('created_at', { ascending: false });
        
        if (allLoansError) {
          console.error('❌ Error fetching all loans:', allLoansError);
          console.error('❌ RLS Policy might be blocking access');
        } else {
          console.log('📋 All loans in database:', {
            count: allLoans.length,
            statuses: [...new Set(allLoans.map(loan => loan.status))],
            loans: allLoans.map(loan => ({ id: loan.id, status: loan.status, client_id: loan.client_id, amount: loan.requested_amount }))
          });
        }
        
        // Now get the filtered loans
        console.log('🔍 Testing LoanStatusFlowService...');
        const loans = await LoanStatusFlowService.getLoansForPage('loan_processing');
        console.log('📊 Loan Processing - Received loans:', {
          count: loans.length,
          loans: loans.map(loan => ({ 
            id: loan.id, 
            application_id: loan.application_id,
            status: loan.status, 
            contract_status: loan.contract_status,
            client_id: loan.client_id 
          }))
        });
        
        // Check specifically for Cole-Griffith's loan
        const coleGriffithLoan = loans.find(loan => loan.application_id === 'LA-1760439557884');
        if (coleGriffithLoan) {
          console.log('🔍 Cole-Griffith loan found:', {
            id: coleGriffithLoan.id,
            application_id: coleGriffithLoan.application_id,
            status: coleGriffithLoan.status,
            contract_status: coleGriffithLoan.contract_status,
            shouldShowFixButton: coleGriffithLoan.contract_status === 'uploaded' && coleGriffithLoan.status !== 'approved'
          });
        } else {
          console.log('❌ Cole-Griffith loan NOT found in filtered results');
        }
        
        // If no loans found, let's try without status filter
        if (loans.length === 0 && allLoans && allLoans.length > 0) {
          console.log('⚠️ No loans found with status filter, trying without filter...');
          const { data: unfilteredLoans, error: unfilteredError } = await supabase
            .from('loan_applications')
            .select(`
              id,
              application_id,
              client_id,
              requested_amount,
              loan_purpose,
              repayment_period_months,
              status,
              approval_status,
              contract_status,
              created_at,
              updated_at,
              credit_score,
              risk_rating,
              assessment_score,
              committee_decision,
              committee_comments,
              committee_approved_by,
              committee_approved_at,
              clients (
                id,
                first_name,
                last_name,
                phone_number,
                email_address,
                client_type,
                street_name,
                house_number,
                area_of_residence
              )
            `)
            .order('created_at', { ascending: false });
          
          if (unfilteredError) {
            console.error('❌ Error fetching unfiltered loans:', unfilteredError);
          } else {
            console.log('📋 Unfiltered loans:', {
              count: unfilteredLoans.length,
              loans: unfilteredLoans.map(loan => ({ id: loan.id, status: loan.status, client_id: loan.client_id }))
            });
            setLoanApplications(unfilteredLoans || []);
            return;
          }
        }
        
        setLoanApplications(loans);
      } catch (err) {
        console.error('❌ Error loading loans:', err);
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, []);

  // Track contracts that have been generated (local state)
  const [generatedContracts, setGeneratedContracts] = useState<Set<string>>(new Set());
  const [contractStatuses, setContractStatuses] = useState<Map<string, string>>(new Map());
  
  // Workflow state machine
  const workflowStateMachine = LoanWorkflowStateMachine.getInstance();

  // Load generated contracts from localStorage on component mount
  useEffect(() => {
    const loadGeneratedContracts = () => {
      try {
        const stored = localStorage.getItem('generatedContracts');
        if (stored) {
          const contractIds = JSON.parse(stored);
          setGeneratedContracts(new Set(contractIds));
          console.log('📋 Loaded generated contracts from localStorage:', contractIds);
        }
      } catch (error) {
        console.error('Error loading generated contracts from localStorage:', error);
      }
    };
    
    loadGeneratedContracts();
  }, []);

  // Load contract statuses from loan_contracts table
  const loadContractStatuses = async () => {
    try {
      console.log('🔍 Loading contract statuses for loans:', loanApplications?.map(app => app.id) || []);
      
      const { data: contracts, error } = await supabase
        .from('loan_contracts')
        .select('loan_application_id, status, id, created_at')
        .in('loan_application_id', loanApplications?.map(app => app.id) || []);
      
      console.log('🔍 Contract statuses query result:', { contracts, error });
      
      if (error) {
        console.error('Error loading contract statuses:', error);
        return;
      }
      
      const statusMap = new Map<string, string>();
      contracts?.forEach(contract => {
        statusMap.set(contract.loan_application_id, contract.status);
        console.log('📋 Contract found:', contract);
      });
      
      console.log('📋 Final contract statuses map:', Array.from(statusMap.entries()));
      setContractStatuses(statusMap);
    } catch (error) {
      console.error('Error loading contract statuses:', error);
    }
  };

  // Load contract statuses when loan applications change
  useEffect(() => {
    if (loanApplications && loanApplications.length > 0) {
      loadContractStatuses();
    }
  }, [loanApplications]);

  // Handle navigation state from contract generation
  useEffect(() => {
    console.log('🔍 Checking location state:', location.state);
    console.log('🔍 Checking URL search params:', location.search);
    
    // Check URL parameters first (fallback)
    const urlParams = new URLSearchParams(location.search);
    const loanIdFromUrl = urlParams.get('loanId');
    const showWorkflowFromUrl = urlParams.get('showWorkflow') === 'true';
    const contractGeneratedFromUrl = urlParams.get('contractGenerated') === 'true';
    
    // Check navigation state
    const stateData = location.state as any;
    const selectedLoanId = stateData?.selectedLoanId || loanIdFromUrl;
    const showWorkflow = stateData?.showWorkflow || showWorkflowFromUrl;
    const contractGenerated = stateData?.contractGenerated || contractGeneratedFromUrl;
    
    console.log('🔄 Navigation data:', { selectedLoanId, showWorkflow, contractGenerated });
    
    if (selectedLoanId && showWorkflow) {
      console.log('🔄 Handling navigation from contract generation:', { selectedLoanId, showWorkflow, contractGenerated });
      
      // Find the loan in the applications list
      const loan = loanApplications.find(app => app.id === selectedLoanId);
      if (loan) {
        console.log('✅ Found loan for workflow:', loan);
        
        // Switch to processing tab
        setActiveTab('processing');
        
        // Select the loan for processing
        setSelectedLoanForProcessing(loan);
        
        // Show success message if contract was generated
        if (contractGenerated) {
          toast.success('Contract generated successfully! You can now upload the signed contract.');
        }
        
        // Clear the navigation state and URL params
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        console.log('❌ Loan not found in applications list:', selectedLoanId);
        console.log('📋 Available loans:', loanApplications.map(app => ({ id: app.id, client_id: app.client_id })));
      }
    }
  }, [location.state, location.search, loanApplications, navigate, location.pathname]);

  // Load approval levels
  useEffect(() => {
    const loadApprovalLevels = async () => {
      try {
        const levels = await ApprovalLevelsService.getApprovalLevels();
        setApprovalLevels(levels);
        console.log('📋 Loaded approval levels:', levels);
      } catch (error) {
        console.error('Error loading approval levels:', error);
      }
    };
    
    loadApprovalLevels();
  }, []);

  // Listen for contract generation events and localStorage changes
  useEffect(() => {
    const handleContractGenerated = (event: MessageEvent) => {
      if (event.data.type === 'CONTRACT_GENERATED') {
        console.log('🔄 Contract generated event received for loan:', event.data.loanId);
        // Add to generated contracts set
        setGeneratedContracts(prev => new Set([...prev, event.data.loanId]));
        console.log('✅ Contract generation tracked locally');
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'generatedContracts') {
        console.log('🔄 localStorage changed, reloading generated contracts');
        const stored = localStorage.getItem('generatedContracts');
        if (stored) {
          const contractIds = JSON.parse(stored);
          setGeneratedContracts(new Set(contractIds));
          console.log('📋 Updated generated contracts from localStorage:', contractIds);
        }
      }
    };

    window.addEventListener('message', handleContractGenerated);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('message', handleContractGenerated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const loans = await LoanStatusFlowService.getLoansForPage('loan_processing');
      setLoanApplications(loans);
      
      // Also reload generated contracts from localStorage
      const stored = localStorage.getItem('generatedContracts');
      if (stored) {
        const contractIds = JSON.parse(stored);
        setGeneratedContracts(new Set(contractIds));
        console.log('🔄 Refreshed generated contracts:', contractIds);
      }
    } catch (err) {
      console.error('Error refetching loans:', err);
      setError('Failed to refetch loans');
    } finally {
      setLoading(false);
    }
  };

  // Real-time status updates
  const { isConnected, lastUpdate } = useRealTimeStatus({
    onStatusChange: (event) => {
      if (event.pageAffected.includes('loan_processing')) {
        console.log('Status change detected, refetching loans:', event);
        refetch();
      }
    },
    onNewLoan: (event) => {
      if (event.pageAffected.includes('loan_processing')) {
        console.log('New loan detected, refetching loans:', event);
        refetch();
      }
    },
    onLoanRemoved: (event) => {
      if (event.pageAffected.includes('loan_processing')) {
        console.log('Loan removed, refetching loans:', event);
        refetch();
      }
    }
  });

  // Fetch clients separately for client information
  const { data: allClients } = useSupabaseQuery('clients', {
    select: 'id, first_name, last_name, middle_name, full_name, phone_number, email_address, client_type'
  });

  // Fetch related data separately to avoid relationship ambiguity
  const { data: allGuarantors } = useSupabaseQuery('loan_guarantors', {
    select: 'id, loan_application_id, full_name, residence, occupation, company_business_name, office_location, relationship'
  });

  const { data: allReferences } = useSupabaseQuery('loan_references', {
    select: 'id, loan_application_id, name, phone_number, occupation'
  });

  const { data: allCollateral } = useSupabaseQuery('loan_collateral_assets', {
    select: 'id, loan_application_id, asset_type, value, description'
  });


  // Loading timeout effect
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        console.warn('Loading timeout reached - showing fallback UI');
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Load approval levels
  useEffect(() => {
    const loadApprovalLevels = async () => {
      try {
        const levels = await ApprovalLevelsService.getAllApprovalLevels();
        setApprovalLevels(levels);
      } catch (error) {
        console.error('Error loading approval levels:', error);
      }
    };

    loadApprovalLevels();
  }, []);

  // Load loans to remove from processing list
  useEffect(() => {
    const loadLoansToRemove = async () => {
      try {
        const loansToRemoveIds = await LoanWorkflowTracker.getLoansToRemoveFromProcessing();
        console.log('🔍 Loans to remove from processing:', loansToRemoveIds);
        setLoansToRemove(loansToRemoveIds);
      } catch (error) {
        console.error('Error loading loans to remove:', error);
      }
    };

    loadLoansToRemove();
  }, [loanApplications]); // Refresh when loan applications change

  // Set up real-time subscription for loan applications
  useSupabaseSubscription('loan_applications', (payload) => {
    console.log('Real-time update received:', payload);
    if (payload.eventType === 'INSERT') {
      toast.success('New loan application received!');
      refetch(); // Refresh the data
    }
  });

  // Auto-move loans with uploaded contracts to disbursement
  useEffect(() => {
    if (!loanApplications || loanApplications.length === 0) return;

    const moveLoansToDisbursement = async () => {
      console.log('🔍 Checking loans for auto-movement to disbursement...');
      
      const loansToMove = loanApplications.filter(loan => {
        const hasUploadedContract = loan.contract_status === 'uploaded' || 
                                   loan.contract_status === 'verified' || 
                                   loan.contract_status === 'signed_by_client';
        const needsMovement = hasUploadedContract && loan.status !== 'approved';
        
        // Special debugging for Cole-Griffith
        if (loan.application_id === 'LA-1760439557884') {
          console.log('🔍 Cole-Griffith loan check:', {
            id: loan.id,
            application_id: loan.application_id,
            status: loan.status,
            contract_status: loan.contract_status,
            hasUploadedContract,
            needsMovement
          });
        }
        
        return needsMovement;
      });

      console.log('🚀 Loans to move to disbursement:', loansToMove.length, loansToMove.map(l => ({ id: l.id, app_id: l.application_id, status: l.status, contract_status: l.contract_status })));

      for (const loan of loansToMove) {
        console.log('🚀 Auto-moving loan to disbursement:', loan.id, 'Contract Status:', loan.contract_status);
        try {
          const { error } = await supabase
            .from('loan_applications')
            .update({ 
              status: 'approved',
              contract_status: 'signed_by_client',
              updated_at: new Date().toISOString()
            })
            .eq('id', loan.id);

          if (error) {
            console.error('❌ Failed to move loan to disbursement:', error);
          } else {
            console.log('✅ Successfully moved loan to disbursement:', loan.id);
          }
        } catch (error) {
          console.error('❌ Error moving loan to disbursement:', error);
        }
      }

      // Refresh the data after moving loans
      if (loansToMove.length > 0) {
        console.log('🔄 Refreshing data after moving loans...');
        refetch();
      }
    };

    moveLoansToDisbursement();
  }, [loanApplications, refetch]);

  // Debug: Log the raw data
  console.log('Raw loan applications data:', loanApplications);
  console.log('First loan application:', loanApplications?.[0]);
  console.log('All clients data:', allClients);

  // Transform loan applications data for display and filter out loans that should be removed
  const loans = loanApplications?.map((app: any) => {
    // Get client data from separate lookup
    const clientData = allClients?.find((c: any) => c.id === app.client_id);
    
    
    // Get related data from separate lookups
    const guarantors = allGuarantors?.filter((g: any) => g.loan_application_id === app.id) || [];
    const references = allReferences?.filter((r: any) => r.loan_application_id === app.id) || [];
    const collateral = allCollateral?.filter((c: any) => c.loan_application_id === app.id) || [];
    
    const clientName = clientData ? 
      (clientData.full_name || `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || 'Client Name Not Available') :
      'Client Name Not Available';
    
    
    return {
      id: app.id,
      applicationId: app.application_id || `LA-${app.id.slice(-8)}`,
      clientName: clientName,
      clientId: clientData?.id || app.client_id || 'N/A',
      amount: parseFloat(app.requested_amount) || 0,
      status: app.status,
      applicationDate: app.created_at,
      priority: app.assessment_score >= 750 ? 'low' : app.assessment_score >= 650 ? 'medium' : 'high',
      creditScore: app.assessment_score,
      riskRating: app.risk_grade,
      contractStatus: (() => {
        const isGenerated = generatedContracts.has(app.id);
        const dbStatus = app.contract_status || 'not_generated';
        const contractTableStatus = contractStatuses.get(app.id);
        
        // Priority order: contract table status > generatedContracts set > loan application status
        if (contractTableStatus && contractTableStatus !== 'not_generated') {
          return contractTableStatus;
        }
        
        if (isGenerated) {
          return 'generated';
        }
        
        if (dbStatus && dbStatus !== 'not_generated') {
          return dbStatus;
        }
        
        return 'not_generated';
      })(),
      // Include related data
      guarantors: guarantors,
      references: references,
      collateral: collateral
    };
  }).filter(loan => {
    const shouldRemove = loansToRemove.includes(loan.id);
    if (shouldRemove) {
      console.log('🚫 Filtering out loan:', loan.id, 'Status:', loan.status, 'Contract Status:', loan.contractStatus);
    }
    
    // Also remove loans with uploaded contracts (they should be in disbursement)
    const hasUploadedContract = loan.contractStatus === 'uploaded' || 
                               loan.contractStatus === 'verified' || 
                               loan.contractStatus === 'signed_by_client';
    
    if (hasUploadedContract) {
      console.log('🚫 Auto-moving loan to disbursement:', loan.id, 'Contract Status:', loan.contractStatus);
    }
    
    return !shouldRemove && !hasUploadedContract;
  }) || [];

  const getStatusColor = (status: string) => {
    return LoanStatusFlowService.getStatusColor(status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'not_generated':
        return 'bg-gray-100 text-gray-800';
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'sent_to_client':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed_by_client':
        return 'bg-purple-100 text-purple-800';
      case 'uploaded':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
        return <AlertCircle className="w-3 h-3" />;
      case 'uploaded':
        return <Upload className="w-3 h-3" />;
      case 'generated':
        return <FileText className="w-3 h-3" />;
      default:
        return <FileCheck className="w-3 h-3" />;
    }
  };

  const filteredLoans = loans.filter(loan => {
    const clientName = loan.clientName || '';
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.clientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || loan.status === filterStatus;
    return matchesSearch && matchesFilter;
  });


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAssessLoan = (loanId: string) => {
    navigate(`/staff/loan-processing/${loanId}/assess`);
  };

  const handleGenerateContractText = (loanId: string) => {
    navigate(`/staff/loan-processing/${loanId}/contract-generation`);
  };

  const handleContractUpload = async (loanId: string) => {
    const loan = loanApplications?.find((app: any) => app.id === loanId);
    if (!loan) return;

    // Check if user is authenticated
    if (!user?.id) {
      toast.error('You must be logged in to manage contracts');
      return;
    }

    // Handle demo users - generate a proper UUID for demo mode
    let userId = user.id;
    if (user.id && user.id.startsWith('demo-')) {
      // Generate a proper UUID for demo users
      userId = crypto.randomUUID();
      console.log('Demo user detected, generated UUID:', userId);
    }

    setSelectedLoan(loan);

    try {
      // Check if contract already exists
      const existingContracts = await ContractService.getContractsByLoanApplication(loanId);
      setContracts(existingContracts);
      
      if (existingContracts.length === 0) {
        // Create contract if it doesn't exist
        const contractData = {
          loan_application_id: loanId,
          client_id: loan.client_id,
          status: 'generated' as const,
          contract_text: '',
          loan_amount: parseFloat(loan.requested_amount) || 0,
          interest_rate: parseFloat(loan.interest_rate) || 0,
          management_fee_rate: parseFloat(loan.management_fee_rate) || 8.5,
          repayment_period_months: parseInt(loan.repayment_period_months) || 0,
          total_repayment_amount: parseFloat(loan.total_repayment_amount) || 0,
          monthly_payment: parseFloat(loan.monthly_payment) || 0,
          created_by_user_id: userId, // Use proper UUID (real or generated)
          updated_by_user_id: userId   // Use proper UUID (real or generated)
        };
        const newContract = await ContractService.createContract(contractData);
        setContracts([newContract]);
      }
    } catch (error) {
      console.error('Failed to load/create contract:', error);
      console.error('Error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        loanId: loanId,
        user: user?.id
      });
      toast.error(`Failed to load contract information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setShowContractUpload(true);
  };

  const handleContractUpdated = async () => {
    if (selectedLoan) {
      try {
        const updatedContracts = await ContractService.getContractsByLoanApplication(selectedLoan.id);
        setContracts(updatedContracts);
        
        // Mark contract as uploaded in local state
        setGeneratedContracts(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedLoan.id); // Remove from generated set
          return newSet;
        });
        
        // Reload contract statuses from database
        loadContractStatuses();
        
        // Automatically move loan to disbursement queue after contract upload
        await handleMoveToDisbursement(selectedLoan.id);
        
        // Refresh the loan applications
        refetch();
      } catch (error) {
        console.error('Failed to refresh contracts:', error);
      }
    }
  };



  // Enhanced workflow event handlers
  const handleStatusChange = async (loanId: string, newStatus: string) => {
    console.log('🔄 Status change requested:', { loanId, newStatus });
    
    try {
      // Update the loan status in the database
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId);

      if (error) {
        console.error('❌ Failed to update loan status:', error);
        return;
      }

      console.log('✅ Loan status updated successfully');
      
      // Refresh the loan applications list
      refetch();
    } catch (error) {
      console.error('❌ Error updating loan status:', error);
    }
  };

  // Manual fix for loans with uploaded contracts but wrong status
  const handleFixContractStatus = async (loanId: string) => {
    console.log('🔧 Fixing contract status for loan:', loanId);
    
    try {
      // First, check if there are any contracts for this loan
      const { data: contracts, error: contractError } = await supabase
        .from('loan_contracts')
        .select('id, status, uploaded_at')
        .eq('loan_application_id', loanId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (contractError) {
        console.error('❌ Error checking contracts:', contractError);
        alert('Failed to check contract status: ' + contractError.message);
        return;
      }

      const contract = contracts?.[0];
      console.log('📋 Found contract:', contract);

      // Determine the appropriate status based on contract status
      let newLoanStatus = 'approved';
      let newContractStatus = 'not_generated';

      if (contract) {
        if (contract.status === 'uploaded' || contract.status === 'signed_by_client' || contract.status === 'verified') {
          newContractStatus = 'signed_by_client';
        } else if (contract.status === 'generated' || contract.status === 'sent_to_client') {
          newContractStatus = 'generated';
        }
      }

      // Update the loan status
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: newLoanStatus,
          contract_status: newContractStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId);

      if (error) {
        console.error('❌ Failed to fix loan status:', error);
        alert('Failed to fix loan status: ' + error.message);
        return;
      }

      console.log('✅ Loan status fixed successfully');
      alert(`✅ Loan status fixed! Status: ${newLoanStatus}, Contract Status: ${newContractStatus}`);
      
      // Refresh the loan applications list
      refetch();
    } catch (error) {
      console.error('❌ Error fixing loan status:', error);
      alert('Error fixing loan status: ' + error.message);
    }
  };

  const handleContractGenerated = async (loanId: string) => {
    console.log('📄 Contract generated for loan:', loanId);

    try {
      // Use the state machine to actually generate the contract in the database
      const result = await workflowStateMachine.executeAction(
        'generate_contract',
        loanId,
        user?.id || 'system'
      );

      if (result.success) {
        console.log('✅ Contract generated successfully in database:', result.message);
        
        // Add to generated contracts set
        setGeneratedContracts(prev => new Set([...prev, loanId]));

        // Also update localStorage
        const generatedContracts = JSON.parse(localStorage.getItem('generatedContracts') || '[]');
        if (!generatedContracts.includes(loanId)) {
          generatedContracts.push(loanId);
          localStorage.setItem('generatedContracts', JSON.stringify(generatedContracts));
        }

        // Reload contract statuses from database
        console.log('🔄 Reloading contract statuses after generation...');
        await loadContractStatuses();

        // Refresh the loan applications list
        console.log('🔄 Refreshing loan applications list...');
        await refetch();
        
        toast.success('Contract generated successfully!');
      } else {
        console.error('❌ Failed to generate contract:', result.message);
        toast.error(`Failed to generate contract: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error generating contract:', error);
      toast.error('Failed to generate contract');
    }
  };

  // Fix specific loan by application ID
  const handleFixSpecificLoan = async (applicationId: string) => {
    console.log(`🔧 Fixing specific loan with application ID: ${applicationId}`);
    
    try {
      // Find the loan by application_id
      const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select('id, application_id, status, contract_status')
        .eq('application_id', applicationId)
        .single();

      if (loanError) {
        console.error('❌ Error finding loan:', loanError);
        alert(`Failed to find loan with application ID ${applicationId}: ${loanError.message}`);
        return;
      }

      if (!loan) {
        alert(`No loan found with application ID ${applicationId}`);
        return;
      }

      console.log('📋 Found loan:', loan);

      // Check if there are contracts for this loan
      const { data: contracts, error: contractError } = await supabase
        .from('loan_contracts')
        .select('id, status, uploaded_at')
        .eq('loan_application_id', loan.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (contractError) {
        console.error('❌ Error checking contracts:', contractError);
        alert('Failed to check contract status: ' + contractError.message);
        return;
      }

      const contract = contracts?.[0];
      console.log('📋 Found contract:', contract);

      // Determine the appropriate status based on contract status
      let newLoanStatus = 'approved';
      let newContractStatus = 'not_generated';

      if (contract) {
        if (contract.status === 'uploaded' || contract.status === 'signed_by_client' || contract.status === 'verified') {
          newContractStatus = 'signed_by_client';
        } else if (contract.status === 'generated' || contract.status === 'sent_to_client') {
          newContractStatus = 'generated';
        }
      }

      // Update the loan status
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: newLoanStatus,
          contract_status: newContractStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.id);

      if (error) {
        console.error('❌ Failed to fix loan status:', error);
        alert('Failed to fix loan status: ' + error.message);
        return;
      }

      console.log('✅ Loan status fixed successfully');
      alert(`✅ Loan ${applicationId} fixed! Status: ${newLoanStatus}, Contract Status: ${newContractStatus}`);
      
      // Refresh the loan applications list
      refetch();
    } catch (error) {
      console.error('❌ Error fixing specific loan:', error);
      alert('Error fixing loan: ' + error.message);
    }
  };

  // Fix all loans with contract status issues
  const handleFixAllContractStatuses = async () => {
    console.log('🔧 Fixing all loan contract statuses...');
    
    try {
      // Get all loans that are approved but have contract status issues
      const { data: loans, error: loansError } = await supabase
        .from('loan_applications')
        .select('id, application_id, status, contract_status')
        .eq('status', 'approved')
        .in('contract_status', ['not_generated', null]);

      if (loansError) {
        console.error('❌ Error fetching loans:', loansError);
        alert('Failed to fetch loans: ' + loansError.message);
        return;
      }

      if (!loans || loans.length === 0) {
        alert('No loans found with contract status issues.');
        return;
      }

      console.log(`📋 Found ${loans.length} loans with potential contract status issues`);

      let fixedCount = 0;
      let errorCount = 0;

      for (const loan of loans) {
        try {
          // Check if there are contracts for this loan
          const { data: contracts, error: contractError } = await supabase
            .from('loan_contracts')
            .select('id, status, uploaded_at')
            .eq('loan_application_id', loan.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (contractError) {
            console.warn(`⚠️ Error checking contracts for loan ${loan.application_id}:`, contractError);
            continue;
          }

          const contract = contracts?.[0];
          let newContractStatus = 'not_generated';

          if (contract) {
            if (contract.status === 'uploaded' || contract.status === 'signed_by_client' || contract.status === 'verified') {
              newContractStatus = 'signed_by_client';
            } else if (contract.status === 'generated' || contract.status === 'sent_to_client') {
              newContractStatus = 'generated';
            }
          }

          // Only update if we found a contract or if the status should be different
          if (contract || newContractStatus !== 'not_generated') {
            const { error: updateError } = await supabase
              .from('loan_applications')
              .update({ 
                contract_status: newContractStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', loan.id);

            if (updateError) {
              console.error(`❌ Failed to update loan ${loan.application_id}:`, updateError);
              errorCount++;
            } else {
              console.log(`✅ Fixed loan ${loan.application_id}: ${newContractStatus}`);
              fixedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing loan ${loan.application_id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Fixed ${fixedCount} loans, ${errorCount} errors`);
      alert(`✅ Fixed ${fixedCount} loans with contract status issues. ${errorCount} errors occurred.`);
      
      // Refresh the loan applications list
      refetch();
    } catch (error) {
      console.error('❌ Error fixing all contract statuses:', error);
      alert('Error fixing contract statuses: ' + error.message);
    }
  };

  // Sync all disbursed loans to monitoring table
  const handleSyncDisbursedLoans = async () => {
    console.log('🔄 Syncing all disbursed loans to monitoring table...');
    
    try {
      const result = await LoanSyncService.syncDisbursedLoansToMonitoring();
      
      if (result.success) {
        if (result.synced > 0) {
          alert(`✅ Successfully synced ${result.synced} disbursed loans to monitoring table!`);
        } else {
          alert('ℹ️ All disbursed loans are already synced to monitoring table.');
        }
      } else {
        alert(`❌ Error syncing loans: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error syncing disbursed loans:', error);
      alert('Error syncing disbursed loans: ' + error.message);
    }
  };

  const handleMoveToDisbursement = async (loanId: string) => {
    console.log('💰 Moving loan to disbursement:', loanId);
    
    try {
      // Update loan status to approved and contract status to signed_by_client
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: 'approved',
          contract_status: 'signed_by_client',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId);

      if (error) {
        console.error('❌ Failed to move loan to disbursement:', error);
        return;
      }

      console.log('✅ Loan moved to disbursement successfully');
      
      // Remove from generated contracts (no longer in processing)
      setGeneratedContracts(prev => {
        const newSet = new Set(prev);
        newSet.delete(loanId);
        return newSet;
      });
      
      // Refresh the loan applications list
      refetch();
      
      // Show success message
      alert('Loan moved to disbursement queue successfully!');
    } catch (error) {
      console.error('❌ Error moving loan to disbursement:', error);
    }
  };

  // Load loan progress status
  const loadLoanProgress = async (loanApplicationId: string) => {
    try {
      const progress = await LoanWorkflowTracker.getLoanProgressStatus(loanApplicationId);
      setLoanProgressStatus(progress);
      setShowProgressPanel(true);
    } catch (error) {
      console.error('Error loading loan progress:', error);
      toast.error('Failed to load loan progress');
    }
  };

  // Handle workflow action validation
  const validateWorkflowAction = async (loanApplicationId: string, action: string) => {
    try {
      const validation = await LoanWorkflowTracker.validateWorkflowProgression(loanApplicationId, action);
      if (!validation.isValid) {
        toast.error(validation.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating workflow action:', error);
      toast.error('Failed to validate workflow action');
      return false;
    }
  };

  // Handle contract generation with validation
  const handleGenerateContract = async (loanId: string) => {
    const isValid = await validateWorkflowAction(loanId, 'generate_contract');
    if (!isValid) return;

    try {
      await LoanWorkflowTracker.recordWorkflowStep(
        loanId,
        'contract_generation',
        'completed',
        user?.id || 'system',
        'Contract generated successfully'
      );
      
      toast.success('Contract generation recorded');
      refetch();
    } catch (error) {
      console.error('Error recording contract generation:', error);
      toast.error('Failed to record contract generation');
    }
  };

  // Handle contract verification with automatic queue movement
  const handleContractVerification = async (loanId: string, verificationStatus: string) => {
    if (verificationStatus === 'approved') {
      try {
        // Move to disbursement queue
        await LoanWorkflowTracker.moveToDisbursementQueue(loanId, user?.id || 'system');
        toast.success('Loan moved to disbursement queue');
        
        // Refresh the list to remove this loan
        refetch();
      } catch (error) {
        console.error('Error moving to disbursement queue:', error);
        toast.error('Failed to move loan to disbursement queue');
      }
    } else if (verificationStatus === 'needs_revision') {
      try {
        // Move to committee queue for review
        await LoanWorkflowTracker.moveToCommitteeQueue(loanId, user?.id || 'system');
        toast.success('Loan moved to committee approval queue');
        
        // Refresh the list to remove this loan
        refetch();
      } catch (error) {
        console.error('Error moving to committee queue:', error);
        toast.error('Failed to move loan to committee queue');
      }
    }
  };

  // New tabbed workflow handlers
  const handleSelectClient = (loan: any) => {
    setSelectedClient(loan);
    setActiveTab('processing');
    
    // Find the full loan application data
    const clientLoan = loanApplications?.find((app: any) => app.id === loan.id);
    if (clientLoan) {
      // Create a transformed loan object that includes applicationId for the workflow component
      const transformedLoan = {
        ...clientLoan,
        applicationId: clientLoan.application_id || `LA-${clientLoan.id.slice(-8)}`
      };
      
      setSelectedLoanForProcessing(transformedLoan);
      
      // Determine approval level for this loan
      const loanAmount = parseFloat(clientLoan.requested_amount) || 0;
      const approvalLevel = approvalLevels.find(level => 
        loanAmount >= level.min_amount && loanAmount <= level.max_amount
      );
      setCurrentApprovalLevel(approvalLevel || null);
      
      // Check contract status before showing message
      const isContractGenerated = generatedContracts.has(clientLoan.id) || 
                                 contractStatuses.get(clientLoan.id) === 'generated' ||
                                 clientLoan.contract_status === 'generated';
      
      // If loan is approved, show appropriate message based on contract status
      if (clientLoan.status === 'approved') {
        if (isContractGenerated) {
          toast.success('Contract has been generated. Ready for contract upload.');
        } else {
          toast.success('Loan has been approved by committee. Ready for contract generation.');
        }
      }
    }
  };


  const handleBackToClients = () => {
    setActiveTab('clients');
    setSelectedClient(null);
    setSelectedLoanForProcessing(null);
    setCurrentApprovalLevel(null);
  };


  if (loading && !loadingTimeout) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading loan applications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading loan applications</h3>
              <p className="text-sm text-red-700 mt-1">{typeof error === 'string' ? error : 'An error occurred while loading data.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Loan Processing</h1>
              <p className="text-blue-100">
                Process loan applications through assessment, contract generation, and verification
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleFixSpecificLoan('LA-1760428455257')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm font-medium"
                title="Fix specific loan LA-1760428455257"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Fix LA-1760428455257
              </button>
              <button
                onClick={handleFixAllContractStatuses}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center text-sm font-medium"
                title="Fix all loans with contract status issues"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Fix All Contract Statuses
              </button>
              <button
                onClick={handleSyncDisbursedLoans}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm font-medium"
                title="Sync all disbursed loans to monitoring table"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Disbursed Loans
              </button>
            </div>
          </div>
        </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Select Client
              </div>
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              disabled={!selectedClient}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'processing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Process Loan
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by client name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Processing Status</option>
                  <option value="pending_initial_review">Pending Initial Review</option>
                  <option value="pending_supervisor_approval">Pending Supervisor Approval</option>
                  <option value="pending_manager_approval">Pending Manager Approval</option>
                  <option value="pending_committee_review">Pending Committee Review</option>
                  <option value="approved">Approved</option>
                  <option value="contract_generated">Contract Generated</option>
                  <option value="contract_signed">Contract Signed</option>
                  <option value="ready_for_disbursement">Ready for Disbursement</option>
                </select>
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  ℹ️ Rejected applications are moved to the "Rejected Applications" tab in Loan Applications page
                </div>
              </div>
            </div>
          </div>

          {/* Clients List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FileText className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No loan applications found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {loan.clientName !== 'Client Name Not Available' ? loan.clientName : 'Client Name Not Available'}
                              </div>
                              <div className="text-sm text-gray-500">
                                App ID: {loan.applicationId || loan.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(loan.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                            {LoanStatusFlowService.getStageDescription('approval', loan.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getContractStatusColor(loan.contractStatus || 'not_generated')}`}>
                            {getContractStatusIcon(loan.contractStatus || 'not_generated')}
                            <span className="ml-1">{(loan.contractStatus || 'not_generated').replace(/_/g, ' ').toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(loan.priority || 'normal')}`}>
                            {(loan.priority || 'normal').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(loan.applicationDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Fix Status button for loans with uploaded contracts but wrong status */}
                            {(() => {
                              const shouldShow = loan.contractStatus === 'uploaded' && loan.status !== 'approved';
                              if (loan.applicationId === 'LA-1760439557884') {
                                console.log('🔍 Cole-Griffith Fix Status Button Check:', {
                                  applicationId: loan.applicationId,
                                  contractStatus: loan.contractStatus,
                                  contractStatusType: typeof loan.contractStatus,
                                  status: loan.status,
                                  statusType: typeof loan.status,
                                  shouldShow: shouldShow,
                                  condition1: loan.contractStatus === 'uploaded',
                                  condition2: loan.status !== 'approved'
                                });
                              }
                              return shouldShow;
                            })() && (
                              <button
                                onClick={() => handleFixContractStatus(loan.id)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-xs"
                                title="Fix status - contract uploaded but status not updated"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Fix Status
                              </button>
                            )}
                            
                            {/* Temporary Force Fix button for Cole-Griffith */}
                            {loan.applicationId === 'LA-1760439557884' && (
                              <button
                                onClick={() => handleFixContractStatus(loan.id)}
                                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center text-xs"
                                title="Force fix for Cole-Griffith loan"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Force Fix
                              </button>
                            )}
                            
                            {/* Debug button for Cole-Griffith */}
                            {loan.applicationId === 'LA-1760439557884' && (
                              <button
                                onClick={async () => {
                                  console.log('🔍 Cole-Griffith Debug Info:', {
                                    loanId: loan.id,
                                    applicationId: loan.applicationId,
                                    status: loan.status,
                                    contractStatus: loan.contractStatus,
                                    rawLoanData: loanApplications?.find(app => app.id === loan.id)
                                  });
                                  
                                  // Check database directly
                                  const { data: dbLoan, error } = await supabase
                                    .from('loan_applications')
                                    .select('*')
                                    .eq('application_id', 'LA-1760439557884')
                                    .single();
                                  
                                  console.log('🔍 Database check:', { dbLoan, error });
                                }}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-xs"
                                title="Debug Cole-Griffith loan"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Debug
                              </button>
                            )}
                            
                            {/* Main action button */}
                            <button
                              onClick={() => handleSelectClient(loan)}
                              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                                loan.contractStatus === 'uploaded' || loan.contractStatus === 'verified' || loan.contractStatus === 'signed_by_client'
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : loan.contractStatus === 'generated' || loan.contractStatus === 'sent_to_client'
                                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                                    : loan.status === 'approved' 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              {loan.contractStatus === 'uploaded' || loan.contractStatus === 'verified' || loan.contractStatus === 'signed_by_client'
                                ? 'Disburse' 
                                : loan.contractStatus === 'generated' || loan.contractStatus === 'sent_to_client'
                                  ? 'Upload Contract' 
                                  : loan.status === 'approved' 
                                    ? 'Generate Contract' 
                                    : 'Start Processing'
                              }
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
        </div>
      )}

      {/* Processing Tab */}
      {activeTab === 'processing' && selectedClient && selectedLoanForProcessing && (
        <div className="space-y-6">
          {/* Client Info Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedClient.clientName}</h3>
                  <p className="text-sm text-gray-500">Client ID: {selectedClient.clientId}</p>
                  <p className="text-sm text-gray-500">Loan Amount: {formatCurrency(selectedClient.amount)}</p>
                </div>
              </div>
              <button
                onClick={handleBackToClients}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Clients
              </button>
            </div>
          </div>


          {/* Enhanced Workflow */}
          <EnhancedLoanProcessingWorkflow
            loan={selectedLoanForProcessing}
            approvalLevels={approvalLevels}
            generatedContracts={generatedContracts}
            onStatusChange={handleStatusChange}
            onContractGenerated={handleContractGenerated}
            onMoveToDisbursement={handleMoveToDisbursement}
          />

          {/* Legacy Processing Steps - Keeping for reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ display: 'none' }}>
            {/* Step 1: Credit Assessment */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Credit Assessment
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedLoanForProcessing.status === 'approved' || selectedLoanForProcessing.status === 'under_review' || selectedLoanForProcessing.status === 'disbursed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedLoanForProcessing.status === 'approved' || selectedLoanForProcessing.status === 'under_review' || selectedLoanForProcessing.status === 'disbursed' ? 'Completed' : 'Step 1'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Perform comprehensive credit assessment and risk analysis
              </p>
              {selectedLoanForProcessing.status === 'approved' || selectedLoanForProcessing.status === 'under_review' || selectedLoanForProcessing.status === 'disbursed' ? (
                <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assessment Completed
                </div>
              ) : (
                <button
                  onClick={() => handleAssessLoan(selectedLoanForProcessing.id)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Start Assessment
                </button>
              )}
            </div>

            {/* Step 2: Contract Generation */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Contract Generation
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedLoanForProcessing.contractStatus === 'generated' || selectedLoanForProcessing.contractStatus === 'sent_to_client' || selectedLoanForProcessing.contractStatus === 'uploaded' || selectedLoanForProcessing.contractStatus === 'verified' || selectedLoanForProcessing.contractStatus === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : selectedLoanForProcessing.status === 'approved' || selectedLoanForProcessing.status === 'approved_for_contract' || selectedLoanForProcessing.status === 'disbursed'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedLoanForProcessing.contractStatus === 'generated' || selectedLoanForProcessing.contractStatus === 'sent_to_client' || selectedLoanForProcessing.contractStatus === 'uploaded' || selectedLoanForProcessing.contractStatus === 'verified' || selectedLoanForProcessing.contractStatus === 'approved'
                    ? 'Completed'
                    : selectedLoanForProcessing.status === 'approved' || selectedLoanForProcessing.status === 'approved_for_contract' || selectedLoanForProcessing.status === 'disbursed'
                    ? 'Step 2'
                    : 'Locked'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Generate loan contract for client signature
              </p>
              {selectedLoanForProcessing.contractStatus === 'generated' || selectedLoanForProcessing.contractStatus === 'sent_to_client' || selectedLoanForProcessing.contractStatus === 'uploaded' || selectedLoanForProcessing.contractStatus === 'verified' || selectedLoanForProcessing.contractStatus === 'approved' ? (
                <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Contract Generated
                </div>
              ) : selectedLoanForProcessing.status === 'approved' || selectedLoanForProcessing.status === 'approved_for_contract' || selectedLoanForProcessing.status === 'disbursed' ? (
                <button
                  onClick={() => handleGenerateContractText(selectedLoanForProcessing.id)}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Contract
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Complete Assessment First
                </div>
              )}
            </div>

            {/* Step 3: Contract Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-green-600" />
                  Contract Upload
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedLoanForProcessing.contractStatus === 'uploaded' || selectedLoanForProcessing.contractStatus === 'verified' || selectedLoanForProcessing.contractStatus === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : selectedLoanForProcessing.contractStatus === 'generated' || selectedLoanForProcessing.contractStatus === 'sent_to_client'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedLoanForProcessing.contractStatus === 'uploaded' || selectedLoanForProcessing.contractStatus === 'verified' || selectedLoanForProcessing.contractStatus === 'approved'
                    ? 'Completed'
                    : selectedLoanForProcessing.contractStatus === 'generated' || selectedLoanForProcessing.contractStatus === 'sent_to_client'
                    ? 'Step 3'
                    : 'Locked'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Upload signed contract from client
              </p>
              {selectedLoanForProcessing.contractStatus === 'uploaded' || selectedLoanForProcessing.contractStatus === 'verified' || selectedLoanForProcessing.contractStatus === 'approved' ? (
                <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Contract Uploaded
                </div>
              ) : selectedLoanForProcessing.contractStatus === 'generated' || selectedLoanForProcessing.contractStatus === 'sent_to_client' ? (
                <button
                  onClick={() => handleContractUpload(selectedLoanForProcessing.id)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Contract
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Generate Contract First
                </div>
              )}
            </div>

          </div>


          {/* Approval Workflow */}
          {selectedLoanForProcessing && (
            <div className="mt-8">
              <LoanApprovalWorkflow 
                loanApplication={selectedLoanForProcessing}
                onStatusUpdate={() => {
                  refetch();
                  refetchHistory();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Contract Upload Modal */}
      {showContractUpload && selectedLoan && contracts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upload Signed Contract</h2>
                <button
                  onClick={() => setShowContractUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ContractUploadModal
                isOpen={showContractUpload}
                onClose={() => setShowContractUpload(false)}
                loanApplicationId={selectedLoan.id}
                clientId={selectedLoan.client_id}
                contractData={contracts[0]}
                onContractUpdated={handleContractUpdated}
              />
            </div>
          </div>
        </div>
      )}

      </div>
    </Layout>
  );
};

export default LoanProcessing;
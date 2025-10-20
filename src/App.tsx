import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';
import { testSupabaseConnection } from './lib/supabaseClient';
import { runNetworkDiagnostics } from './utils/networkDiagnostics';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ClientManagement from './pages/ClientManagement';
import AddClient from './pages/AddClient';
import LoanProcessing from './pages/LoanProcessing';
import LoanApplication from './pages/LoanApplication';
import LoanApplications from './pages/LoanApplications';
import StaffLoanApplication from './pages/StaffLoanApplication';
import LoanManagement from './pages/LoanManagement';
import LoanAssessmentPage from './pages/LoanAssessmentPage';
import RepaymentManagement from './pages/RepaymentManagement';
import AccountingDashboard from './pages/AccountingDashboard';
import GeneralLedger from './pages/GeneralLedger';
import Reports from './pages/Reports';
import ReportsSimple from './pages/ReportsSimple';
import RegulatoryReports from './pages/RegulatoryReports';
import StaffManagement from './pages/StaffManagement';
import PayrollManagement from './pages/PayrollManagement';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Complaints from './pages/Complaints';
import TreasuryManagement from './pages/TreasuryManagement';
import Support from './pages/Support';
// Expense Management Module
import ExpenseManagementDashboard from './pages/ExpenseManagementDashboard';
import ExpenseEntryForm from './pages/ExpenseEntryForm';
import ExpenseApprovalWorkflow from './pages/ExpenseApprovalWorkflow';
// Enhanced workflow pages
import LoanCommitteeApproval from './pages/LoanCommitteeApproval';
import EnhancedDisbursement from './pages/EnhancedDisbursement';
import EnhancedDisbursementSimple from './pages/EnhancedDisbursementSimple';
import LoanRestructuring from './pages/LoanRestructuring';
import LoanClosure from './pages/LoanClosure';
import LoanContractPage from './pages/LoanContractPage';
import LoanContractGenerationPage from './pages/LoanContractGenerationPage';
import CreditAssessment from './pages/CreditAssessment';
import ContractUpload from './pages/ContractUpload';
// Savings & Deposits Module
import SavingsProductsSetup from './pages/SavingsProductsSetup';
import SavingsAccountManagement from './pages/SavingsAccountManagement';
import InterestCalculationPosting from './pages/InterestCalculationPosting';
import GroupManagementPage from './pages/GroupManagementPage';
import WebhookTest from './pages/WebhookTest';
import ClickPesaTesting from './pages/ClickPesaTesting';
import BudgetManagement from './pages/BudgetManagement';
import BalanceSheetPage from './pages/BalanceSheetPage';
import IncomeStatementPage from './pages/IncomeStatementPage';
import CashFlowPage from './pages/CashFlowPage';
import TrialBalancePage from './pages/TrialBalancePage';
import GroupConsensusWorkflow from './pages/GroupConsensusWorkflow';
import GroupDefaultManagement from './pages/GroupDefaultManagement';
import GroupMeetingManagement from './pages/GroupMeetingManagement';
import GroupPerformanceAnalytics from './pages/GroupPerformanceAnalytics';
import IndividualGroupLoanPage from './pages/IndividualGroupLoanPage';
import PeerPressureMechanisms from './pages/PeerPressureMechanisms';
import RealtimeDataTest from './components/RealtimeDataTest';
import AppOwnerDashboard from './pages/AppOwnerDashboard';
import SuperUserDashboard from './pages/SuperUserDashboard';

function App() {
  // Test Supabase connection on app start
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔧 Running comprehensive connection tests...');
      
      // Run network diagnostics first
      await runNetworkDiagnostics();
      
      // Then test Supabase connection
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.warn('⚠️ Supabase connection failed. Some features may not work properly.');
        console.warn('💡 Troubleshooting tips:');
        console.warn('   1. Check your internet connection');
        console.warn('   2. Try refreshing the page');
        console.warn('   3. Check if your firewall is blocking the connection');
        console.warn('   4. Try using a different network');
      }
    };
    
    testConnection();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SupabaseAuthProvider>
          <ErrorBoundary>
              <Router>
                <div className="min-h-screen bg-gray-50">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/staff/dashboard" element={
                      <ProtectedRoute role="staff">
                        <StaffDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/clients" element={
                      <ProtectedRoute role="staff">
                        <ClientManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/clients/add" element={
                      <ProtectedRoute role="staff">
                        <AddClient />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-applications" element={
                      <ProtectedRoute role="staff">
                        <LoanApplications />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-applications/new" element={
                      <ProtectedRoute role="staff">
                        <StaffLoanApplication />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-applications/:clientId/apply" element={
                      <ProtectedRoute role="staff">
                        <StaffLoanApplication />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-processing" element={
                      <ProtectedRoute role="staff">
                        <LoanProcessing />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-processing/:loanApplicationId/assess" element={
                      <ProtectedRoute role="staff">
                        <LoanAssessmentPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-processing/:loanApplicationId/contract-generation" element={
                      <ProtectedRoute role="staff">
                        <LoanContractGenerationPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/credit-assessment/:loanId" element={
                      <ProtectedRoute role="staff">
                        <CreditAssessment />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/contract-upload/:loanId" element={
                      <ProtectedRoute role="staff">
                        <ContractUpload />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/committee-approval" element={
                      <ProtectedRoute role="staff">
                        <LoanCommitteeApproval />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/enhanced-disbursement" element={
                      <ProtectedRoute role="staff">
                        <EnhancedDisbursementSimple />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-restructuring" element={
                      <ProtectedRoute role="staff">
                        <LoanRestructuring />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loan-closure" element={
                      <ProtectedRoute role="staff">
                        <LoanClosure />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans" element={
                      <ProtectedRoute role="staff">
                        <LoanManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/process" element={
                      <ProtectedRoute role="staff">
                        <LoanProcessing />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/apply" element={
                      <ProtectedRoute role="staff">
                        <StaffLoanApplication />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/assess" element={
                      <ProtectedRoute role="staff">
                        <LoanAssessmentPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/committee-approval" element={
                      <ProtectedRoute role="staff">
                        <LoanCommitteeApproval />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/disbursement" element={
                      <ProtectedRoute role="staff">
                        <EnhancedDisbursement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/restructuring" element={
                      <ProtectedRoute role="staff">
                        <LoanRestructuring />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/closure" element={
                      <ProtectedRoute role="staff">
                        <LoanClosure />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/contract" element={
                      <ProtectedRoute role="staff">
                        <LoanContractPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/loans/contract/generate" element={
                      <ProtectedRoute role="staff">
                        <LoanContractGenerationPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/repayments" element={
                      <ProtectedRoute role="staff">
                        <RepaymentManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting" element={
                      <ProtectedRoute role="staff">
                        <AccountingDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/general-ledger" element={
                      <ProtectedRoute role="staff">
                        <GeneralLedger />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting/ledger" element={
                      <ProtectedRoute role="staff">
                        <GeneralLedger />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting/general-ledger" element={
                      <ProtectedRoute role="staff">
                        <GeneralLedger />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting/balance-sheet" element={
                      <ProtectedRoute role="staff">
                        <BalanceSheetPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting/income-statement" element={
                      <ProtectedRoute role="staff">
                        <IncomeStatementPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting/cash-flow" element={
                      <ProtectedRoute role="staff">
                        <CashFlowPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/accounting/trial-balance" element={
                      <ProtectedRoute role="staff">
                        <TrialBalancePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/reports" element={
                      <ProtectedRoute role="staff">
                        <ReportsSimple />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/regulatory-reports" element={
                      <ProtectedRoute role="staff">
                        <RegulatoryReports />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/management" element={
                      <ProtectedRoute role="staff">
                        <StaffManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/staff-management" element={
                      <ProtectedRoute role="staff">
                        <StaffManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/payroll" element={
                      <ProtectedRoute role="staff">
                        <PayrollManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/settings" element={
                      <ProtectedRoute role="staff">
                        <Settings />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/audit-logs" element={
                      <ProtectedRoute role="staff">
                        <AuditLogs />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/complaints" element={
                      <ProtectedRoute role="staff">
                        <Complaints />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/treasury" element={
                      <ProtectedRoute role="staff">
                        <TreasuryManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/support" element={
                      <ProtectedRoute role="staff">
                        <Support />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/expense-management" element={
                      <ProtectedRoute role="staff">
                        <ExpenseManagementDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/expense-management/entry" element={
                      <ProtectedRoute role="staff">
                        <ExpenseEntryForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/expense-management/approval" element={
                      <ProtectedRoute role="staff">
                        <ExpenseApprovalWorkflow />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/savings-products" element={
                      <ProtectedRoute role="staff">
                        <SavingsProductsSetup />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/savings-accounts" element={
                      <ProtectedRoute role="staff">
                        <SavingsAccountManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/interest-posting" element={
                      <ProtectedRoute role="staff">
                        <InterestCalculationPosting />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/savings/setup" element={
                      <ProtectedRoute role="staff">
                        <SavingsProductsSetup />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/savings/accounts" element={
                      <ProtectedRoute role="staff">
                        <SavingsAccountManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/savings/interest" element={
                      <ProtectedRoute role="staff">
                        <InterestCalculationPosting />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/group-management" element={
                      <ProtectedRoute role="staff">
                        <GroupManagementPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups" element={
                      <ProtectedRoute role="staff">
                        <GroupManagementPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups/consensus" element={
                      <ProtectedRoute role="staff">
                        <GroupConsensusWorkflow />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups/defaults" element={
                      <ProtectedRoute role="staff">
                        <GroupDefaultManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups/meetings" element={
                      <ProtectedRoute role="staff">
                        <GroupMeetingManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups/analytics" element={
                      <ProtectedRoute role="staff">
                        <GroupPerformanceAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups/individual-loans" element={
                      <ProtectedRoute role="staff">
                        <IndividualGroupLoanPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/groups/peer-pressure" element={
                      <ProtectedRoute role="staff">
                        <PeerPressureMechanisms />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/realtime-test" element={
                      <ProtectedRoute role="staff">
                        <RealtimeDataTest />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/budget" element={
                      <ProtectedRoute role="staff">
                        <BudgetManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/webhook-test" element={
                      <ProtectedRoute role="staff">
                        <WebhookTest />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/clickpesa-test" element={
                      <ProtectedRoute role="staff">
                        <ClickPesaTesting />
                      </ProtectedRoute>
                    } />
                    
                    {/* Client Portal Routes */}
                    <Route path="/client/dashboard" element={
                      <ProtectedRoute role="client">
                        <ClientDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/applications" element={
                      <ProtectedRoute role="client">
                        <LoanApplications />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/apply-loan" element={
                      <ProtectedRoute role="client">
                        <LoanApplication />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/repayments" element={
                      <ProtectedRoute role="client">
                        <RepaymentManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/complaints" element={
                      <ProtectedRoute role="client">
                        <Complaints />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/loans" element={
                      <ProtectedRoute role="client">
                        <LoanApplications />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/loans/apply" element={
                      <ProtectedRoute role="client">
                        <LoanApplication />
                      </ProtectedRoute>
                    } />
                    <Route path="/client/support" element={
                      <ProtectedRoute role="client">
                        <Support />
                      </ProtectedRoute>
                    } />
                    
                    {/* Super User Dashboard */}
                    <Route path="/superuser" element={
                      <ProtectedRoute role="admin">
                        <SuperUserDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/app-owner" element={
                      <ProtectedRoute role="admin">
                        <SuperUserDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute role="admin">
                        <SuperUserDashboard />
                      </ProtectedRoute>
                    } />
                    {/* Admin can access both portals */}
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
                  </Routes>
                  <Toaster position="top-right" />
                </div>
              </Router>
            </ErrorBoundary>
        </SupabaseAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
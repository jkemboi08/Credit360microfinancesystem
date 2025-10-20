import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Tabs, { TabItem } from '../components/Tabs';
import { useTabs } from '../hooks/useTabs';
// import { useLanguage } from '../context/LanguageContext';
// import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { EnhancedUserUpdateService } from '../services/enhancedUserUpdateService';
import { StaffManagementService } from '../services/staffManagementService';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Users,
  CreditCard,
  Smartphone,
  Bell,
  Shield,
  CheckCircle,
  AlertTriangle,
  Save,
  Plus,
  Building2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calculator,
  X,
  Wifi,
  DollarSign,
  Loader2,
  Percent,
  Layers,
  Database,
} from 'lucide-react';
import { FeesConfigService, FeesConfig } from '../services/feesConfigService';
import { ApprovalLevelsService, ApprovalLevel } from '../services/approvalLevelsService';
import { LoanService } from '../services/loanService';

const Settings: React.FC = () => {
  const { user: currentUser } = useSupabaseAuth();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showIntegrationConfig, setShowIntegrationConfig] = useState(false);
  const [showSmsTemplate, setShowSmsTemplate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });

  const [productForm, setProductForm] = useState({
    name: '',
    interest_rate: '',
    max_amount: '',
    min_amount: '',
    tenor_min_months: '',
    tenor_max_months: '',
    product_type: '',
    processing_fee_rate: '',
    late_payment_penalty_rate: '',
    repayment_frequency: 'monthly',
    requires_guarantor: false,
    requires_collateral: false,
    version: '1.0'
  });

  const [integrationForm, setIntegrationForm] = useState({
    api_key: '',
    secret_key: '',
    endpoint_url: '',
    timeout: '30',
    retry_attempts: '3',
    client_id: '',
    webhook_url: '',
    environment: 'sandbox'
  });

  const [smsTemplateForm, setSmsTemplateForm] = useState({
    name: '',
    subject: '',
    message_en: '',
    message_sw: '',
    trigger_event: '',
    send_timing: ''
  });

  // SMS Configuration states
  const [showSmsConfig, setShowSmsConfig] = useState(false);
  const [showBulkSms, setShowBulkSms] = useState(false);
  const [showSmsHistory, setShowSmsHistory] = useState(false);
  const [smsConfig, setSmsConfig] = useState({
    provider: 'africas_talking',
    api_key: '',
    username: '',
    sender_id: '',
    cost_per_sms: 0.05,
    daily_limit: 1000,
    enabled: true
  });

  const [bulkSmsForm, setBulkSmsForm] = useState({
    recipient_type: 'all_clients', // all_clients, specific_clients, loan_status, custom_list
    message: '',
    language: 'en', // en, sw
    schedule_type: 'immediate', // immediate, scheduled
    scheduled_date: '',
    scheduled_time: '',
    client_filter: {
      loan_status: 'all',
      last_payment_days: 30,
      min_balance: 0,
      max_balance: 1000000
    },
    custom_recipients: []
  });

  const [smsHistory, setSmsHistory] = useState([
    {
      id: 1,
      date: '2025-01-08 14:30',
      recipient_count: 150,
      message: 'Payment reminder for all active clients',
      status: 'Delivered',
      cost: 7.50,
      provider: 'Africa\'s Talking'
    },
    {
      id: 2,
      date: '2025-01-07 10:15',
      recipient_count: 25,
      message: 'Overdue payment notice',
      status: 'Delivered',
      cost: 1.25,
      provider: 'Africa\'s Talking'
    },
    {
      id: 3,
      date: '2025-01-06 16:45',
      recipient_count: 300,
      message: 'Monthly statement notification',
      status: 'Failed',
      cost: 0,
      provider: 'Africa\'s Talking'
    }
  ]);

  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsStats, setSmsStats] = useState({
    total_sent: 1250,
    total_delivered: 1180,
    total_failed: 70,
    total_cost: 62.50,
    this_month_sent: 450,
    this_month_cost: 22.50
  });

  // Fees configuration state
  const [feesConfigs, setFeesConfigs] = useState<FeesConfig[]>([]);
  const [currentFeesConfig, setCurrentFeesConfig] = useState<FeesConfig | null>(null);
  const [feesForm, setFeesForm] = useState({
    application_fee_percentage: 2.5,
    legal_fee_amount: 50000
  });
  const [showFeesForm, setShowFeesForm] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  
  // Approval levels state
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [showApprovalLevelForm, setShowApprovalLevelForm] = useState(false);
  const [editingApprovalLevel, setEditingApprovalLevel] = useState<ApprovalLevel | null>(null);
  const [approvalLevelForm, setApprovalLevelForm] = useState({
    level_name: '',
    min_amount: 0,
    max_amount: 1000000,
    requires_committee_approval: false,
    committee_threshold: 0,
    approval_authority: 'loan_officer' as 'loan_officer' | 'senior_officer' | 'manager' | 'committee'
  });
  const [approvalLevelsLoading, setApprovalLevelsLoading] = useState(false);

  // Committee management state
  const [showCommitteeMemberForm, setShowCommitteeMemberForm] = useState(false);
  const [editingCommitteeMember, setEditingCommitteeMember] = useState<any>(null);
  const [committeeMemberForm, setCommitteeMemberForm] = useState({
    user_id: '',
    role: 'member'
  });
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);
  const [committeeMembersLoading, setCommitteeMembersLoading] = useState(false);

  // Approval rules state
  const [approvalRules, setApprovalRules] = useState({
    committeeReviewThreshold: 10000000,
    corporateLoanThreshold: 5000000,
    groupLoanThreshold: 7500000,
    staffApprovalLimit: 2000000
  });
  const [approvalRulesLoading, setApprovalRulesLoading] = useState(false);

  // Dialog states
  const [showAddApprovalDialog, setShowAddApprovalDialog] = useState(false);
  const [showEditApprovalDialog, setShowEditApprovalDialog] = useState(false);
  const [showAddCommitteeDialog, setShowAddCommitteeDialog] = useState(false);
  // Form states
  const [newApprovalLevel, setNewApprovalLevel] = useState({
    level_name: '',
    min_amount: 0,
    max_amount: 0,
    requires_committee_approval: false,
    committee_threshold: 0,
    approval_authority: 'loan_officer' as 'loan_officer' | 'senior_officer' | 'manager' | 'committee',
    created_by_user_id: ''
  });

  const [newCommitteeMember, setNewCommitteeMember] = useState({
    user_id: '',
    role: '',
    is_active: true
  });

  // Tenant Management states
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showEditTenant, setShowEditTenant] = useState(false);
  const [showDeleteTenant, setShowDeleteTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    subdomain: '',
    database_name: '',
    plan: 'BASIC' as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE',
    max_clients: 1000,
    max_users: 10,
    status: 'active' as 'active' | 'suspended' | 'inactive',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    country: 'Tanzania',
    timezone: 'Africa/Dar_es_Salaam',
    currency: 'TZS',
    language: 'en',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    custom_domain: '',
    features: {
      loan_management: true,
      savings_accounts: true,
      group_management: true,
      reporting: true,
      api_access: false,
      custom_branding: false,
      white_label: false
    }
  });
  const [brandingForm, setBrandingForm] = useState({
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#F59E0B',
    font_family: 'Inter',
    custom_css: '',
    favicon_url: '',
    login_background: '',
    header_text: '',
    footer_text: ''
  });

  const tabs: TabItem[] = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'products', label: 'Loan Products', icon: CreditCard },
    { id: 'fees', label: 'Fees Configuration', icon: Percent },
    { id: 'approvals', label: 'Approvals', icon: Layers },
    { id: 'integrations', label: 'Integrations', icon: Wifi },
    { id: 'accounting', label: 'Accounting', icon: Calculator },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sms', label: 'Bulk SMS', icon: Smartphone },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

  const { activeTab, setActiveTab } = useTabs(tabs, { defaultTab: 'users' });

  // Get tab content function
  const getTabContent = (tabId: string) => {
    switch (tabId) {
      case 'users': return renderUserManagement();
      case 'products': return renderLoanProducts();
      case 'fees': return renderFeesConfiguration();
      case 'approvals': return renderApprovals();
      case 'integrations': return renderIntegrations();
      case 'accounting': return renderAccountingConfiguration();
      case 'notifications': return renderNotifications();
      case 'sms': return renderBulkSms();
      case 'compliance': return renderCompliance();
      default: return null;
    }
  };

  // Fetch users from Supabase
  const { data: supabaseUsers, loading: usersLoading, error: usersError, refetch: refetchUsers } = useSupabaseQuery('users', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch employees for dropdown with multiple fallback strategies
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      console.log('🔄 Fetching employees for user management...');
      
      // Strategy 1: Try tenant-filtered method first
      const result = await StaffManagementService.getEmployees();
      if (result.success && result.data) {
        setEmployees(result.data);
        console.log('✅ Fetched employees using tenant-filtered method:', result.data.length);
        return;
      }
      
      console.log('⚠️ Tenant-filtered method failed, trying direct query...');
      console.log('Error from tenant method:', result.error);
      
      // Strategy 2: Direct query without tenant filtering
      const { data: directEmployees, error: directError } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone_number,
          position,
          department,
          salary,
          employment_status,
          hire_date,
          created_at,
          updated_at
        `)
        .eq('employment_status', 'active')
        .order('first_name');

      if (directError) {
        console.error('❌ Direct query also failed:', directError);
        toast.error(`Failed to load employees: ${directError.message}`);
        return;
      }

      if (directEmployees && directEmployees.length > 0) {
        setEmployees(directEmployees);
        console.log('✅ Fetched employees using direct query:', directEmployees.length);
        toast.success(`Loaded ${directEmployees.length} employees`);
      } else {
        console.log('ℹ️ No active employees found');
        setEmployees([]);
        toast('No active employees found. Please add employees first.', { icon: 'ℹ️' });
      }
      
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      toast.error('Error loading employees list');
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Transform Supabase users data for display
  const users = supabaseUsers?.map((user: any) => {
    // Determine user status based on multiple factors
    let status = 'Inactive';
    
    // Check if user has a valid email (basic validation)
    if (user.email && user.email !== 'No email') {
      // Check if user has been active recently (within last 30 days)
      if (user.last_login_at) {
        try {
          // Parse the date more carefully
          const lastLogin = new Date(user.last_login_at);
          const now = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          // Check if the date is valid
          if (isNaN(lastLogin.getTime())) {
            console.warn(`⚠️ Invalid date for user ${user.email}:`, user.last_login_at);
            status = 'Active (Invalid login date)';
          } else {
            // Debug logging for date comparison
            console.log(`🔍 User ${user.email} login analysis:`, {
              rawDate: user.last_login_at,
              parsedDate: lastLogin.toISOString(),
              now: now.toISOString(),
              thirtyDaysAgo: thirtyDaysAgo.toISOString(),
              isRecent: lastLogin > thirtyDaysAgo,
              isFuture: lastLogin > now,
              daysDiff: Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
            });
            
            if (lastLogin > thirtyDaysAgo) {
              // Check if login is in the future (which would be unusual but possible)
              if (lastLogin > now) {
                status = 'Active (Future login - system clock issue?)';
              } else {
                status = 'Active';
              }
            } else {
              status = 'Inactive (No recent activity)';
            }
          }
        } catch (error) {
          console.error(`❌ Error parsing date for user ${user.email}:`, error);
          status = 'Active (Date parsing error)';
        }
      } else {
        // User has email but no login record - consider as active if they have a role
        if (user.role && user.role !== 'Unknown') {
          status = 'Active (No login record)';
        } else {
          status = 'Inactive (No role assigned)';
        }
      }
    } else {
      status = 'Inactive (No email)';
    }
    
    return {
      id: user.id, // Use the integer ID for database operations
      user_id: user.user_id, // Keep the original user_id (UUID) for filtering
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
      email: user.email || 'No email',
      role: user.role || 'Unknown',
      status: status,
      lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never',
      kyc_status: user.kyc_status || 'unknown' // Keep original for reference
    };
  }) || [];

  // Fetch employees when component mounts and when add user modal opens
  useEffect(() => {
    if (showAddUser) {
      fetchEmployees();
    }
  }, [showAddUser]);
  
  // Filter users who have a valid user_id (UUID) for committee member selection
  const usersWithValidUUID = users.filter(user => user.user_id && typeof user.user_id === 'string');

  // Debug logging
  useEffect(() => {
    console.log('Settings User Management Debug:', {
      usersLoading,
      usersError,
      supabaseUsers,
      users,
      usersCount: users?.length || 0
    });
  }, [usersLoading, usersError, supabaseUsers, users]);

  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [loanProductsLoading, setLoanProductsLoading] = useState(false);
  const [loanProductsError, setLoanProductsError] = useState<string | null>(null);

  // Fetch loan products from database
  useEffect(() => {
    const fetchLoanProducts = async () => {
      try {
        setLoanProductsLoading(true);
        setLoanProductsError(null);
        
        const { data, error } = await LoanService.getLoanProducts();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform database data to match the expected format
          const transformedProducts = data.map((product: any) => ({
            id: product.id,
            name: product.name,
            interestRate: `${product.interest_rate}%`,
            maxAmount: `TZS ${product.max_amount.toLocaleString()}`,
            minAmount: `TZS ${product.min_amount.toLocaleString()}`,
            tenor: `${product.tenor_min_months || 'N/A'}-${product.tenor_max_months || 'N/A'} months`,
            status: product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Inactive',
            version: product.version || 'v1.0',
            processingFee: `${product.processing_fee_rate || 0}%`,
            repaymentFrequency: product.repayment_frequency || 'monthly',
            description: product.description,
            productType: product.product_type,
            requiresGuarantor: product.requires_guarantor,
            requiresCollateral: product.requires_collateral,
            latePaymentPenalty: product.late_payment_penalty_rate
          }));
          
          setLoanProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching loan products:', error);
        setLoanProductsError(error instanceof Error ? error.message : 'Failed to fetch loan products');
        toast.error('Failed to load loan products');
      } finally {
        setLoanProductsLoading(false);
      }
    };

    fetchLoanProducts();
  }, []);

  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      name: 'M-Pesa',
      type: 'Mobile Money',
      status: 'Connected',
      lastSync: '2025-01-08 15:30',
      config: {
        api_key: 'mpesa_****_key',
        endpoint: 'https://api.safaricom.co.ke',
        timeout: 30
      }
    },
    {
      id: 2,
      name: 'Tigo Pesa',
      type: 'Mobile Money',
      status: 'Connected',
      lastSync: '2025-01-08 15:25',
      config: {
        api_key: 'tigo_****_key',
        endpoint: 'https://api.tigo.co.tz',
        timeout: 30
      }
    },
    {
      id: 3,
      name: 'Airtel Money',
      type: 'Mobile Money',
      status: 'Disconnected',
      lastSync: '2025-01-07 10:15',
      config: {
        api_key: '',
        endpoint: 'https://api.airtel.co.tz',
        timeout: 30
      }
    },
    {
      id: 4,
      name: 'NIDA (Jamii X-Change)',
      type: 'KYC Verification',
      status: 'Connected',
      lastSync: '2025-01-08 16:00',
      config: {
        api_key: 'nida_****_key',
        endpoint: 'https://api.nida.go.tz',
        timeout: 60
      }
    },
    {
      id: 5,
      name: 'CRB (Dun & Bradstreet)',
      type: 'Credit Bureau',
      status: 'Connected',
      lastSync: '2025-01-08 14:45',
      config: {
        api_key: 'crb_****_key',
        endpoint: 'https://api.crb.co.tz',
        timeout: 45
      }
    },
    {
      id: 6,
      name: 'BoT TIPS',
      type: 'Payment System',
      status: 'Connected',
      lastSync: '2025-01-08 15:45',
      config: {
        api_key: 'bot_****_key',
        endpoint: 'https://tips.bot.go.tz',
        timeout: 120
      }
    },
    {
      id: 7,
      name: 'ClickPesa',
      type: 'Payment Gateway',
      status: 'Disconnected',
      lastSync: 'Not configured',
      config: {
        client_id: '',
        api_key: '',
        endpoint: 'https://api.clickpesa.com',
        webhook_url: '',
        environment: 'sandbox',
        timeout: 30
      }
    }
  ]);

  const [smsTemplates, setSmsTemplates] = useState([
    {
      id: 1,
      name: 'Payment Reminder',
      subject: 'Payment Due Reminder',
      message_en: 'Dear {client_name}, your loan payment of TZS {amount} is due on {due_date}. Please make payment to avoid late fees.',
      message_sw: 'Mpendwa {client_name}, malipo yako ya mkopo ya TZS {amount} yanastahili tarehe {due_date}. Tafadhali fanya malipo ili kuepuka ada za kuchelewa.',
      trigger_event: 'payment_due_3_days',
      send_timing: '3 days before due date',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Overdue Notice',
      subject: 'Overdue Payment Notice',
      message_en: 'Dear {client_name}, your payment of TZS {amount} is now overdue. Please contact us immediately to avoid additional charges.',
      message_sw: 'Mpendwa {client_name}, malipo yako ya TZS {amount} yamechelewa. Tafadhali wasiliana nasi haraka ili kuepuka ada za ziada.',
      trigger_event: 'payment_overdue',
      send_timing: 'When payment becomes overdue',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Loan Approval',
      subject: 'Loan Approved',
      message_en: 'Congratulations {client_name}! Your loan of TZS {amount} has been approved. Disbursement will be processed within 24 hours.',
      message_sw: 'Hongera {client_name}! Mkopo wako wa TZS {amount} umeidhinishwa. Uongozaji utachakatwa ndani ya masaa 24.',
      trigger_event: 'loan_approved',
      send_timing: 'Immediately after approval',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Loan Rejection',
      subject: 'Loan Application Update',
      message_en: 'Dear {client_name}, we regret to inform you that your loan application has not been approved. Please contact us for more information.',
      message_sw: 'Mpendwa {client_name}, tunasikitika kukujulisha kuwa ombi lako la mkopo halijaidhinishwa. Tafadhali wasiliana nasi kwa maelezo zaidi.',
      trigger_event: 'loan_rejected',
      send_timing: 'Immediately after rejection',
      status: 'Active'
    }
  ]);

  // User Management Functions
  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setUserForm({
      name: `${employee.first_name} ${employee.last_name}`.trim(),
      email: employee.email || '',
      role: userForm.role, // Keep the selected role
      password: userForm.password // Keep the password field
    });
  };

  // Function to test date logic
  const testDateLogic = () => {
    console.log('🧪 Testing date logic...');
    
    // Test with your specific date
    const testDate = '9/14/2025, 12:43:21 AM';
    const parsedDate = new Date(testDate);
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('📅 Date test results:', {
      testDate: testDate,
      parsedDate: parsedDate.toISOString(),
      now: now.toISOString(),
      thirtyDaysAgo: thirtyDaysAgo.toISOString(),
      isRecent: parsedDate > thirtyDaysAgo,
      isFuture: parsedDate > now,
      isValid: !isNaN(parsedDate.getTime())
    });
    
    toast.success('Date logic test completed. Check console for results.');
  };

  // Function to refresh user status and show debug info
  const refreshUserStatus = () => {
    console.log('🔄 Refreshing user status...');
    console.log('📊 Current user data:', {
      currentUser: currentUser,
      supabaseUsers: supabaseUsers,
      users: users
    });
    
    // Show detailed status for each user
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`, {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        kyc_status: user.kyc_status
      });
    });
    
    toast.success('User status refreshed. Check console for details.');
  };

  // Alternative function using a more direct approach
  const updateUnknownUserDirect = async () => {
    try {
      console.log('🔄 Using direct SQL approach to update user...');
      
      // Use a raw SQL query approach
      const { data, error } = await supabase
        .rpc('execute_sql', {
          query: `
            UPDATE users 
            SET 
              first_name = 'Japheth',
              last_name = 'Kemboi',
              role = 'admin',
              updated_at = NOW()
            WHERE email = 'md@stairway.co.tz'
            RETURNING id, first_name, last_name, email, role;
          `
        });

      if (error) {
        console.error('❌ SQL update failed:', error);
        toast.error(`SQL update failed: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ User updated successfully via SQL:', data[0]);
        toast.success('User updated successfully: Japheth Kemboi (Admin)');
        refetchUsers();
      } else {
        console.log('⚠️ No user found with email md@stairway.co.tz');
        toast.error('No user found with email md@stairway.co.tz');
      }

    } catch (error) {
      console.error('❌ Error in direct update:', error);
      toast.error('Error updating user');
    }
  };

  // Function to update the specific user "Unknown User" with employee data
  const updateUnknownUser = async () => {
    try {
      console.log('🔄 Updating Unknown User with Japheth Kemboi data...');
      
      // First, find the user with email "md@stairway.co.tz"
      const { data: userToUpdate, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'md@stairway.co.tz')
        .single();

      if (findError || !userToUpdate) {
        console.error('❌ User not found:', findError);
        toast.error('User with email md@stairway.co.tz not found');
        return;
      }

      console.log('✅ Found user to update:', userToUpdate);

      // Try multiple direct update approaches
      let updateSuccess = false;
      let lastError = '';

      // Approach 1: Try direct update with individual fields
      console.log('🔄 Trying direct field-by-field update...');
      try {
        const { error: firstError } = await supabase
          .from('users')
          .update({ first_name: 'Japheth' })
          .eq('id', userToUpdate.id);

        if (!firstError) {
          const { error: lastErrorError } = await supabase
            .from('users')
            .update({ last_name: 'Kemboi' })
            .eq('id', userToUpdate.id);

          if (!lastErrorError) {
            const { error: roleError } = await supabase
              .from('users')
              .update({ role: 'admin' })
              .eq('id', userToUpdate.id);

            if (!roleError) {
              updateSuccess = true;
              console.log('✅ Direct field-by-field update successful');
            } else {
              lastError = roleError.message;
            }
          } else {
            lastError = lastErrorError.message;
          }
        } else {
          lastError = firstError.message;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Approach 2: Try RPC function if direct update failed
      if (!updateSuccess) {
        console.log('🔄 Trying RPC function update...');
        try {
          const { data, error: rpcError } = await supabase.rpc('update_user_profile', {
            user_id: userToUpdate.id,
            update_data: {
              first_name: 'Japheth',
              last_name: 'Kemboi',
              role: 'admin'
            }
          });

          if (!rpcError) {
            updateSuccess = true;
            console.log('✅ RPC function update successful');
          } else {
            lastError = rpcError.message;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      // Approach 3: Try using the service account approach
      if (!updateSuccess) {
        console.log('🔄 Trying service account approach...');
        try {
          // Use the enhanced service as final fallback
          const updateResult = await EnhancedUserUpdateService.updateUserWithFeedback({
            id: userToUpdate.id,
            first_name: 'Japheth',
            last_name: 'Kemboi',
            email: 'md@stairway.co.tz',
            role: 'admin'
          });

          if (updateResult.success) {
            updateSuccess = true;
            console.log('✅ Enhanced service update successful');
          } else {
            lastError = updateResult.message;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      if (updateSuccess) {
        console.log('✅ User updated successfully');
        toast.success('User updated successfully: Japheth Kemboi (Admin)');
        
        // Refresh the users list
        refetchUsers();
      } else {
        console.error('❌ All update methods failed. Last error:', lastError);
        toast.error(`Failed to update user. All methods failed. Last error: ${lastError}`);
        
        // Show detailed error information
        console.log('🔍 Debug information:');
        console.log('- User ID:', userToUpdate.id);
        console.log('- User email:', userToUpdate.email);
        console.log('- Current role:', userToUpdate.role);
        console.log('- Last error:', lastError);
      }

    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error('Error updating user');
    }
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role || !userForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedEmployee) {
      toast.error('Please select an employee from the list');
      return;
    }

    setLoading(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation for demo
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Create user profile in the users table
        const nameParts = userForm.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            user_id: authData.user.id,
            email: userForm.email,
            first_name: firstName,
            last_name: lastName,
            role: userForm.role,
            kyc_status: 'pending'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Still show success since auth user was created
        }

        // Refresh the users list
        refetchUsers();
        
        setUserForm({ name: '', email: '', role: '', password: '' });
        setSelectedEmployee(null);
        setShowAddUser(false);
        toast.success('User added successfully');
      }
    } catch (error: any) {
      console.error('Error adding user:', error.message);
      toast.error(`Failed to add user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Don't pre-fill password for security
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const nameParts = userForm.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Only update password if provided
      if (userForm.password) {
        // Note: In a real app, you'd need to use Supabase Admin API to update passwords
        // For now, we'll just update the profile
        console.log('Password update would require admin API');
      }

      // Use the Enhanced UserUpdateService with comprehensive error handling
      const result = await EnhancedUserUpdateService.updateUserWithFeedback({
        id: selectedUser.id,
        first_name: firstName,
        last_name: lastName,
        email: userForm.email,
        role: userForm.role
      });

      if (!result.success) {
        // Show detailed error message with recommendations
        let errorMessage = result.message;
        if (result.recommendations && result.recommendations.length > 0) {
          errorMessage += '\n\nRecommendations:\n• ' + result.recommendations.join('\n• ');
        }
        
        toast.error(errorMessage, { duration: 8000 });
        console.error('User update failed:', result.details);
        return;
      }

      console.log('User updated successfully:', result.details);

      // Refresh the users list
      refetchUsers();
      
      setUserForm({ name: '', email: '', role: '', password: '' });
      setShowEditUser(false);
      setSelectedUser(null);
      toast.success(result.message);
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setShowDeleteUser(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the users list
      refetchUsers();
      
      setShowDeleteUser(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error.message);
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Loan Product Functions
  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.interest_rate || !productForm.max_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await LoanService.createLoanProduct({
        name: productForm.name,
        interest_rate: parseFloat(productForm.interest_rate),
        max_amount: parseFloat(productForm.max_amount),
        min_amount: parseFloat(productForm.min_amount),
        tenor_min_months: parseInt(productForm.tenor_min_months),
        tenor_max_months: parseInt(productForm.tenor_max_months),
        product_type: productForm.product_type,
        processing_fee_rate: productForm.processing_fee_rate ? parseFloat(productForm.processing_fee_rate) : null,
        late_payment_penalty_rate: productForm.late_payment_penalty_rate ? parseFloat(productForm.late_payment_penalty_rate) : null,
        repayment_frequency: productForm.repayment_frequency as any,
        requires_guarantor: productForm.requires_guarantor,
        requires_collateral: productForm.requires_collateral,
        version: productForm.version,
        status: 'draft'
      });

      if (error) {
        throw error;
      }

      // Refresh loan products from database
      const { data: updatedProducts, error: fetchError } = await LoanService.getLoanProducts();
      if (!fetchError && updatedProducts) {
        const transformedProducts = updatedProducts.map((product: any) => ({
          id: product.id,
          name: product.name,
          interestRate: `${product.interest_rate}%`,
          maxAmount: `TZS ${product.max_amount.toLocaleString()}`,
          minAmount: `TZS ${product.min_amount.toLocaleString()}`,
          tenor: `${product.tenor_min_months || 'N/A'}-${product.tenor_max_months || 'N/A'} months`,
          status: product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Inactive',
          version: product.version || 'v1.0',
          processingFee: `${product.processing_fee_rate || 0}%`,
          repaymentFrequency: product.repayment_frequency || 'monthly',
          description: product.description,
          productType: product.product_type,
          requiresGuarantor: product.requires_guarantor,
          requiresCollateral: product.requires_collateral,
          latePaymentPenalty: product.late_payment_penalty_rate
        }));
        setLoanProducts(transformedProducts);
      }

      resetProductForm();
      setShowAddProduct(false);
      toast.success('Loan product added successfully');
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add loan product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!productForm.name || !productForm.interest_rate || !productForm.max_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedProduct) {
      toast.error('No product selected for update');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await LoanService.updateLoanProduct(selectedProduct.id, {
        name: productForm.name,
        interest_rate: parseFloat(productForm.interest_rate),
        max_amount: parseFloat(productForm.max_amount),
        min_amount: parseFloat(productForm.min_amount),
        tenor_min_months: parseInt(productForm.tenor_min_months),
        tenor_max_months: parseInt(productForm.tenor_max_months),
        product_type: productForm.product_type,
        processing_fee_rate: productForm.processing_fee_rate ? parseFloat(productForm.processing_fee_rate) : null,
        late_payment_penalty_rate: productForm.late_payment_penalty_rate ? parseFloat(productForm.late_payment_penalty_rate) : null,
        repayment_frequency: productForm.repayment_frequency as any,
        requires_guarantor: productForm.requires_guarantor,
        requires_collateral: productForm.requires_collateral,
        version: productForm.version,
        status: 'active'
      });

      if (error) {
        throw error;
      }

      // Refresh loan products from database
      const { data: updatedProducts, error: fetchError } = await LoanService.getLoanProducts();
      if (!fetchError && updatedProducts) {
        const transformedProducts = updatedProducts.map((product: any) => ({
          id: product.id,
          name: product.name,
          interestRate: `${product.interest_rate}%`,
          maxAmount: `TZS ${product.max_amount.toLocaleString()}`,
          minAmount: `TZS ${product.min_amount.toLocaleString()}`,
          tenor: `${product.tenor_min_months || 'N/A'}-${product.tenor_max_months || 'N/A'} months`,
          status: product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Inactive',
          version: product.version || 'v1.0',
          processingFee: `${product.processing_fee_rate || 0}%`,
          repaymentFrequency: product.repayment_frequency || 'monthly',
          description: product.description,
          productType: product.product_type,
          requiresGuarantor: product.requires_guarantor,
          requiresCollateral: product.requires_collateral,
          latePaymentPenalty: product.late_payment_penalty_rate
        }));
        setLoanProducts(transformedProducts);
      }

      resetProductForm();
      setShowEditProduct(false);
      setSelectedProduct(null);
      toast.success('Loan product updated successfully');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update loan product');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      interest_rate: product.interestRate.replace('%', ''),
      max_amount: product.maxAmount.replace('TZS ', '').replace(/,/g, ''),
      min_amount: product.minAmount.replace('TZS ', '').replace(/,/g, ''),
      tenor_min_months: product.tenor.split('-')[0],
      tenor_max_months: product.tenor.split('-')[1].replace(' months', ''),
      product_type: 'standard',
      processing_fee_rate: product.processingFee?.replace('%', '') || '',
      late_payment_penalty_rate: '2',
      repayment_frequency: product.repaymentFrequency,
      requires_guarantor: false,
      requires_collateral: false,
      version: product.version
    });
    setShowEditProduct(true);
  };

  const handleCloneProduct = (product: any) => {
    setProductForm({
      name: `${product.name} (Copy)`,
      interest_rate: product.interestRate.replace('%', ''),
      max_amount: product.maxAmount.replace('TZS ', '').replace(/,/g, ''),
      min_amount: product.minAmount.replace('TZS ', '').replace(/,/g, ''),
      tenor_min_months: product.tenor.split('-')[0],
      tenor_max_months: product.tenor.split('-')[1].replace(' months', ''),
      product_type: 'standard',
      processing_fee_rate: product.processingFee?.replace('%', '') || '',
      late_payment_penalty_rate: '2',
      repayment_frequency: product.repaymentFrequency,
      requires_guarantor: false,
      requires_collateral: false,
      version: '1.0'
    });
    setShowAddProduct(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      interest_rate: '',
      max_amount: '',
      min_amount: '',
      tenor_min_months: '',
      tenor_max_months: '',
      product_type: '',
      processing_fee_rate: '',
      late_payment_penalty_rate: '',
      repayment_frequency: 'monthly',
      requires_guarantor: false,
      requires_collateral: false,
      version: '1.0'
    });
  };

  // Integration Functions
  const handleConfigureIntegration = (integration: any) => {
    setSelectedIntegration(integration);
    setIntegrationForm({
      api_key: integration.config?.api_key || '',
      secret_key: '',
      endpoint_url: integration.config?.endpoint || '',
      timeout: integration.config?.timeout?.toString() || '30',
      retry_attempts: '3',
      client_id: integration.config?.client_id || '',
      webhook_url: integration.config?.webhook_url || '',
      environment: integration.config?.environment || 'sandbox'
    });
    setShowIntegrationConfig(true);
  };

  const handleToggleIntegration = (integration: any) => {
    const newStatus = integration.status === 'Connected' ? 'Disconnected' : 'Connected';
    
    setIntegrations(integrations.map(int => 
      int.id === integration.id 
        ? { ...int, status: newStatus, lastSync: newStatus === 'Connected' ? new Date().toLocaleString() : int.lastSync }
        : int
    ));

    toast.success(`${integration.name} ${newStatus.toLowerCase()} successfully`);
  };

  const handleSaveIntegrationConfig = () => {
    if (!selectedIntegration) return;

    setIntegrations(integrations.map(int => 
      int.id === selectedIntegration.id 
        ? { 
            ...int, 
            config: {
              ...int.config,
              api_key: integrationForm.api_key,
              endpoint: integrationForm.endpoint_url,
              timeout: parseInt(integrationForm.timeout),
              // ClickPesa specific fields
              ...(selectedIntegration.name === 'ClickPesa' && {
                client_id: integrationForm.client_id,
                webhook_url: integrationForm.webhook_url,
                environment: integrationForm.environment
              })
            },
            status: 'Connected',
            lastSync: new Date().toLocaleString()
          }
        : int
    ));

    setShowIntegrationConfig(false);
    toast.success('Integration configuration saved successfully');
  };

  // SMS Template Functions
  const handleEditSmsTemplate = (template: any) => {
    setSelectedTemplate(template);
    setSmsTemplateForm({
      name: template.name,
      subject: template.subject,
      message_en: template.message_en,
      message_sw: template.message_sw,
      trigger_event: template.trigger_event,
      send_timing: template.send_timing
    });
    setShowSmsTemplate(true);
  };

  const handleSaveSmsTemplate = () => {
    if (!selectedTemplate) return;

    setSmsTemplates(smsTemplates.map(template => 
      template.id === selectedTemplate.id 
        ? { 
            ...template,
            name: smsTemplateForm.name,
            subject: smsTemplateForm.subject,
            message_en: smsTemplateForm.message_en,
            message_sw: smsTemplateForm.message_sw,
            trigger_event: smsTemplateForm.trigger_event,
            send_timing: smsTemplateForm.send_timing
          }
        : template
    ));

    setShowSmsTemplate(false);
    toast.success('SMS template updated successfully');
  };

  // SMS Configuration Functions
  const handleSaveSmsConfig = () => {
    setShowSmsConfig(false);
    toast.success('SMS configuration saved successfully');
  };

  const handleSendBulkSms = async () => {
    if (!bulkSmsForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSendingSms(true);
    try {
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add to history
      const newSms = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        recipient_count: bulkSmsForm.recipient_type === 'all_clients' ? 150 : 25,
        message: bulkSmsForm.message,
        status: 'Delivered',
        cost: bulkSmsForm.recipient_type === 'all_clients' ? 7.50 : 1.25,
        provider: 'Africa\'s Talking'
      };
      
      setSmsHistory([newSms, ...smsHistory]);
      
      // Update stats
      setSmsStats(prev => ({
        ...prev,
        total_sent: prev.total_sent + newSms.recipient_count,
        total_delivered: prev.total_delivered + newSms.recipient_count,
        total_cost: prev.total_cost + newSms.cost,
        this_month_sent: prev.this_month_sent + newSms.recipient_count,
        this_month_cost: prev.this_month_cost + newSms.cost
      }));

      setBulkSmsForm({
        recipient_type: 'all_clients',
        message: '',
        language: 'en',
        schedule_type: 'immediate',
        scheduled_date: '',
        scheduled_time: '',
        client_filter: {
          loan_status: 'all',
          last_payment_days: 30,
          min_balance: 0,
          max_balance: 1000000
        },
        custom_recipients: []
      });
      
      setShowBulkSms(false);
      toast.success(`SMS sent successfully to ${newSms.recipient_count} recipients`);
    } catch (error) {
      toast.error('Failed to send SMS. Please try again.');
    } finally {
      setIsSendingSms(false);
    }
  };

  const getRecipientCount = () => {
    switch (bulkSmsForm.recipient_type) {
      case 'all_clients': return 150;
      case 'specific_clients': return bulkSmsForm.custom_recipients.length;
      case 'loan_status': return 45;
      default: return 0;
    }
  };

  const getEstimatedCost = () => {
    return getRecipientCount() * smsConfig.cost_per_sms;
  };

  // Tenant Management Functions
  const loadTenants = async () => {
    setTenantsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setTenantsLoading(false);
    }
  };

  const handleAddTenant = async () => {
    try {
      const { error } = await supabase
        .from('tenants')
        .insert([tenantForm]);

      if (error) throw error;

      toast.success('Tenant created successfully!');
      setShowAddTenant(false);
      resetTenantForm();
      loadTenants();
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Failed to create tenant');
    }
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update(tenantForm)
        .eq('id', selectedTenant.id);

      if (error) throw error;

      toast.success('Tenant updated successfully!');
      setShowEditTenant(false);
      setSelectedTenant(null);
      resetTenantForm();
      loadTenants();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Failed to update tenant');
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', selectedTenant.id);

      if (error) throw error;

      toast.success('Tenant deleted successfully!');
      setShowDeleteTenant(false);
      setSelectedTenant(null);
      loadTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    }
  };

  const handleUpdateBranding = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_branding')
        .upsert({
          tenant_id: tenantId,
          ...brandingForm,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Branding updated successfully!');
      loadTenants();
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding');
    }
  };

  const resetTenantForm = () => {
    setTenantForm({
      name: '',
      subdomain: '',
      database_name: '',
      plan: 'BASIC',
      max_clients: 1000,
      max_users: 10,
      status: 'active',
      contact_email: '',
      contact_phone: '',
      address: '',
      city: '',
      country: 'Tanzania',
      timezone: 'Africa/Dar_es_Salaam',
      currency: 'TZS',
      language: 'en',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      custom_domain: '',
      features: {
        loan_management: true,
        savings_accounts: true,
        group_management: true,
        reporting: true,
        api_access: false,
        custom_branding: false,
        white_label: false
      }
    });
  };

  const openEditTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setTenantForm({
      name: tenant.name || '',
      subdomain: tenant.subdomain || '',
      database_name: tenant.database_name || '',
      plan: tenant.plan || 'BASIC',
      max_clients: tenant.max_clients || 1000,
      max_users: tenant.max_users || 10,
      status: tenant.status || 'active',
      contact_email: tenant.contact_email || '',
      contact_phone: tenant.contact_phone || '',
      address: tenant.address || '',
      city: tenant.city || '',
      country: tenant.country || 'Tanzania',
      timezone: tenant.timezone || 'Africa/Dar_es_Salaam',
      currency: tenant.currency || 'TZS',
      language: tenant.language || 'en',
      logo_url: tenant.logo_url || '',
      primary_color: tenant.primary_color || '#3B82F6',
      secondary_color: tenant.secondary_color || '#1E40AF',
      custom_domain: tenant.custom_domain || '',
      features: tenant.features || {
        loan_management: true,
        savings_accounts: true,
        group_management: true,
        reporting: true,
        api_access: false,
        custom_branding: false,
        white_label: false
      }
    });
    setShowEditTenant(true);
  };

  const openBrandingModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setBrandingForm({
      logo_url: tenant.logo_url || '',
      primary_color: tenant.primary_color || '#3B82F6',
      secondary_color: tenant.secondary_color || '#1E40AF',
      accent_color: tenant.accent_color || '#F59E0B',
      font_family: tenant.font_family || 'Inter',
      custom_css: tenant.custom_css || '',
      favicon_url: tenant.favicon_url || '',
      login_background: tenant.login_background || '',
      header_text: tenant.header_text || '',
      footer_text: tenant.footer_text || ''
    });
  };

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600">Manage staff accounts and role-based permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={updateUnknownUserDirect}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Fix Unknown User
          </button>
          <button
            onClick={refreshUserStatus}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <Database className="w-4 h-4 mr-2" />
            Refresh Status
          </button>
          <button
            onClick={testDateLogic}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Test Date Logic
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {usersLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading users...</p>
          </div>
        ) : usersError ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-2">
              <AlertTriangle className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">Error loading users: {usersError}</p>
            <button
              onClick={() => refetchUsers()}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Users className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status.startsWith('Active') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                      {user.kyc_status && user.kyc_status !== 'unknown' && (
                        <span className="text-xs text-gray-500">
                          KYC: {user.kyc_status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderTenantManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tenant Management</h3>
          <p className="text-sm text-gray-600">Manage multi-tenant organizations and their settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.open('/app-owner', '_blank')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            App Owner Dashboard
          </button>
          <button
            onClick={() => setShowAddTenant(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tenant
          </button>
        </div>
      </div>

      {/* Tenants List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">All Tenants</h4>
        </div>
        <div className="overflow-x-auto">
          {tenantsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading tenants...</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users/Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {tenant.logo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={tenant.logo_url}
                              alt={tenant.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {tenant.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.subdomain}.yourdomain.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                        tenant.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.current_users || 0} / {tenant.max_users} users
                      <br />
                      <span className="text-gray-500">{tenant.current_clients || 0} / {tenant.max_clients} clients</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditTenant(tenant)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openBrandingModal(tenant)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Customize Branding"
                        >
                          <SettingsIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDeleteTenant(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Tenant</h3>
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
                    <input
                      type="text"
                      value={tenantForm.name}
                      onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tenant name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subdomain</label>
                    <input
                      type="text"
                      value={tenantForm.subdomain}
                      onChange={(e) => setTenantForm({...tenantForm, subdomain: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="company-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <select
                      value={tenantForm.plan}
                      onChange={(e) => setTenantForm({...tenantForm, plan: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={tenantForm.status}
                      onChange={(e) => setTenantForm({...tenantForm, status: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Users</label>
                    <input
                      type="number"
                      value={tenantForm.max_users}
                      onChange={(e) => setTenantForm({...tenantForm, max_users: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Clients</label>
                    <input
                      type="number"
                      value={tenantForm.max_clients}
                      onChange={(e) => setTenantForm({...tenantForm, max_clients: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={tenantForm.contact_email}
                    onChange={(e) => setTenantForm({...tenantForm, contact_email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                    <input
                      type="color"
                      value={tenantForm.primary_color}
                      onChange={(e) => setTenantForm({...tenantForm, primary_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                    <input
                      type="color"
                      value={tenantForm.secondary_color}
                      onChange={(e) => setTenantForm({...tenantForm, secondary_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTenant}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Tenant</h3>
                <button
                  onClick={() => setShowEditTenant(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
                    <input
                      type="text"
                      value={tenantForm.name}
                      onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subdomain</label>
                    <input
                      type="text"
                      value={tenantForm.subdomain}
                      onChange={(e) => setTenantForm({...tenantForm, subdomain: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <select
                      value={tenantForm.plan}
                      onChange={(e) => setTenantForm({...tenantForm, plan: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={tenantForm.status}
                      onChange={(e) => setTenantForm({...tenantForm, status: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Users</label>
                    <input
                      type="number"
                      value={tenantForm.max_users}
                      onChange={(e) => setTenantForm({...tenantForm, max_users: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Clients</label>
                    <input
                      type="number"
                      value={tenantForm.max_clients}
                      onChange={(e) => setTenantForm({...tenantForm, max_clients: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={tenantForm.contact_email}
                    onChange={(e) => setTenantForm({...tenantForm, contact_email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                    <input
                      type="color"
                      value={tenantForm.primary_color}
                      onChange={(e) => setTenantForm({...tenantForm, primary_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                    <input
                      type="color"
                      onChange={(e) => setTenantForm({...tenantForm, secondary_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditTenant(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTenant}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branding Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customize Branding - {selectedTenant.name}</h3>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                    <input
                      type="url"
                      value={brandingForm.logo_url}
                      onChange={(e) => setBrandingForm({...brandingForm, logo_url: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Favicon URL</label>
                    <input
                      type="url"
                      value={brandingForm.favicon_url}
                      onChange={(e) => setBrandingForm({...brandingForm, favicon_url: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                    <input
                      type="color"
                      value={brandingForm.primary_color}
                      onChange={(e) => setBrandingForm({...brandingForm, primary_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                    <input
                      type="color"
                      value={brandingForm.secondary_color}
                      onChange={(e) => setBrandingForm({...brandingForm, secondary_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                    <input
                      type="color"
                      value={brandingForm.accent_color}
                      onChange={(e) => setBrandingForm({...brandingForm, accent_color: e.target.value})}
                      className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Font Family</label>
                    <select
                      value={brandingForm.font_family}
                      onChange={(e) => setBrandingForm({...brandingForm, font_family: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Login Background</label>
                    <input
                      type="url"
                      value={brandingForm.login_background}
                      onChange={(e) => setBrandingForm({...brandingForm, login_background: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/background.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Header Text</label>
                  <input
                    type="text"
                    value={brandingForm.header_text}
                    onChange={(e) => setBrandingForm({...brandingForm, header_text: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Welcome to our platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Footer Text</label>
                  <input
                    type="text"
                    value={brandingForm.footer_text}
                    onChange={(e) => setBrandingForm({...brandingForm, footer_text: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Custom CSS</label>
                  <textarea
                    value={brandingForm.custom_css}
                    onChange={(e) => setBrandingForm({...brandingForm, custom_css: e.target.value})}
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/* Custom CSS styles */"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateBranding(selectedTenant.id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Branding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Tenant</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedTenant?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteTenant(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTenant}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLoanProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loan Product Configuration</h3>
          <p className="text-sm text-gray-600">Manage loan products with version control</p>
        </div>
        <button 
          onClick={() => setShowAddProduct(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Loading State */}
      {loanProductsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading loan products...</span>
        </div>
      )}

      {/* Error State */}
      {loanProductsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error loading loan products</span>
          </div>
          <p className="text-red-700 mt-1">{loanProductsError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loanProductsLoading && !loanProductsError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loanProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No loan products found</h3>
              <p className="text-gray-600">Get started by adding your first loan product.</p>
            </div>
          ) : (
            loanProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : product.status === 'Draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-medium">{product.interestRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Range:</span>
                    <span className="font-medium">{product.minAmount} - {product.maxAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenor:</span>
                    <span className="font-medium">{product.tenor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{product.version}</span>
                  </div>
                  {product.productType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{product.productType}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleCloneProduct(product)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Clone
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Integration Settings</h3>
        <p className="text-sm text-gray-600">Configure external service connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{integration.name}</h4>
                <p className="text-sm text-gray-600">{integration.type}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                integration.status === 'Connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {integration.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Sync:</span>
                <span className="font-medium">{integration.lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Endpoint:</span>
                <span className="font-medium text-xs">{integration.config?.endpoint || 'Not configured'}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => handleConfigureIntegration(integration)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
              >
                Configure
              </button>
              <button 
                onClick={() => handleToggleIntegration(integration)}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  integration.status === 'Connected'
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
        <p className="text-sm text-gray-600">Configure SMS and email templates</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">SMS Templates</h4>
        <div className="space-y-4">
          {smsTemplates.map((template) => (
            <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">{template.name}</h5>
                <p className="text-sm text-gray-600">{template.send_timing}</p>
                <p className="text-xs text-gray-500">Status: {template.status}</p>
              </div>
              <button 
                onClick={() => handleEditSmsTemplate(template)}
                className="text-blue-600 hover:text-blue-900"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Email Templates</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Welcome Email</h5>
              <p className="text-sm text-gray-600">Sent to new clients</p>
            </div>
            <button className="text-blue-600 hover:text-blue-900">
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Monthly Statement</h5>
              <p className="text-sm text-gray-600">Sent monthly to active clients</p>
            </div>
            <button className="text-blue-600 hover:text-blue-900">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountingConfiguration = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Accounting Configuration</h3>
        <p className="text-sm text-gray-600">Configure IFRS 9 and BoT-compliant accounting settings</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Chart of Accounts</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">IFRS 9 Compliance</h5>
              <p className="text-sm text-gray-600">Standard chart of accounts structure</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">BoT Mapping</h5>
              <p className="text-sm text-gray-600">Accounts mapped to BoT prudential templates</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <button className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <h5 className="font-medium text-gray-900">Customize Chart of Accounts</h5>
            <p className="text-sm text-gray-600">Add or modify account codes and names</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">ECL Provisioning Rules</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <h5 className="font-medium text-gray-900">Stage 1 (12-month ECL)</h5>
              <div className="mt-2">
                <label className="text-sm text-gray-600">Provision Rate (%)</label>
                <input
                  type="number"
                  defaultValue="0.5"
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-gray-900">Stage 2 (Lifetime ECL)</h5>
              <div className="mt-2">
                <label className="text-sm text-gray-600">Provision Rate (%)</label>
                <input
                  type="number"
                  defaultValue="5.0"
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <h5 className="font-medium text-gray-900">Stage 3 (Credit Impaired)</h5>
              <div className="mt-2">
                <label className="text-sm text-gray-600">Provision Rate (%)</label>
                <input
                  type="number"
                  defaultValue="50.0"
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Compliance Settings</h3>
        <p className="text-sm text-gray-600">Configure regulatory compliance parameters</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">BoT Microfinance Regulations 2025</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Liquidity Ratio Threshold</h5>
              <p className="text-sm text-gray-600">Minimum 1% of outstanding loans</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value="1.0"
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Load fees configurations
  useEffect(() => {
    const loadFeesConfigs = async () => {
      setFeesLoading(true);
      try {
        const configs = await FeesConfigService.getAllFeesConfigs();
        setFeesConfigs(configs);
        
        const activeConfig = configs.find(config => config.is_active);
        if (activeConfig) {
          setCurrentFeesConfig(activeConfig);
          setFeesForm({
            application_fee_percentage: activeConfig.application_fee_percentage,
            legal_fee_amount: activeConfig.legal_fee_amount
          });
        }
      } catch (error) {
        console.error('Error loading fees configs:', error);
        toast.error('Failed to load fees configurations');
      } finally {
        setFeesLoading(false);
      }
    };

    loadFeesConfigs();
  }, []);

  // Load approval levels
  useEffect(() => {
    const loadApprovalLevels = async () => {
      setApprovalLevelsLoading(true);
      try {
        const levels = await ApprovalLevelsService.getAllApprovalLevels();
        setApprovalLevels(levels);
      } catch (error) {
        console.error('Error loading approval levels:', error);
        toast.error('Failed to load approval levels');
        setApprovalLevels([]);
      } finally {
        setApprovalLevelsLoading(false);
      }
    };

    loadApprovalLevels();
  }, []);

  // Load tenants
  useEffect(() => {
    loadTenants();
  }, []);

  // Handle fees form submission
  const handleFeesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeesLoading(true);

    try {
      console.log('🔧 Starting fees configuration update...');
      console.log('📝 Form data:', feesForm);

      // Validate form data
      if (!feesForm.application_fee_percentage || feesForm.application_fee_percentage < 0) {
        throw new Error('Application fee percentage must be a positive number');
      }
      if (!feesForm.legal_fee_amount || feesForm.legal_fee_amount < 0) {
        throw new Error('Legal fee amount must be a positive number');
      }

      const newConfig = await FeesConfigService.createFeesConfig({
        application_fee_percentage: feesForm.application_fee_percentage,
        legal_fee_amount: feesForm.legal_fee_amount,
        is_active: true,
        created_by_user_id: 'system', // This should be the actual user ID
        updated_by_user_id: 'system'
      });

      console.log('✅ Configuration created successfully:', newConfig);

      setCurrentFeesConfig(newConfig);
      setFeesConfigs(prev => [newConfig, ...prev]);
      setShowFeesForm(false);
      toast.success('Fees configuration updated successfully');
    } catch (error) {
      console.error('❌ Error updating fees config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Full error details:', {
        message: errorMessage,
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(`Failed to update fees configuration: ${errorMessage}`);
    } finally {
      setFeesLoading(false);
    }
  };

  // Handle saving approval rules
  const handleSaveApprovalRules = async () => {
    setApprovalRulesLoading(true);
    try {
      // Save approval rules to database
      const { error } = await supabase
        .from('approval_rules')
        .upsert({
          id: 'default',
          committee_review_threshold: approvalRules.committeeReviewThreshold,
          corporate_loan_threshold: approvalRules.corporateLoanThreshold,
          group_loan_threshold: approvalRules.groupLoanThreshold,
          staff_approval_limit: approvalRules.staffApprovalLimit,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Approval rules saved successfully');
    } catch (error) {
      console.error('Error saving approval rules:', error);
      toast.error('Failed to save approval rules');
    } finally {
      setApprovalRulesLoading(false);
    }
  };

  // Add Approval Level handlers
  const handleAddApprovalLevel = () => {
    setNewApprovalLevel({
      level_name: '',
      min_amount: 0,
      max_amount: 0,
      requires_committee_approval: false,
      committee_threshold: 0,
      approval_authority: 'loan_officer',
      created_by_user_id: currentUser?.id || ''
    });
    setShowAddApprovalDialog(true);
  };

  const handleEditApprovalLevel = (level: ApprovalLevel) => {
    setEditingApprovalLevel(level);
    setShowEditApprovalDialog(true);
  };

  const handleSaveApprovalLevel = async () => {
    try {
      const approvalData = {
        level_name: newApprovalLevel.level_name,
        min_amount: newApprovalLevel.min_amount,
        max_amount: newApprovalLevel.max_amount,
        requires_committee_approval: newApprovalLevel.requires_committee_approval,
        committee_threshold: newApprovalLevel.committee_threshold,
        approval_authority: newApprovalLevel.approval_authority,
        created_by_user_id: currentUser?.id || '',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('approval_levels')
        .insert(approvalData);

      if (error) throw error;

      toast.success('Approval level added successfully');
      setShowAddApprovalDialog(false);
      // Refresh approval levels
      const levels = await ApprovalLevelsService.getAllApprovalLevels();
      setApprovalLevels(levels);
    } catch (error) {
      console.error('Error adding approval level:', error);
      toast.error('Failed to add approval level');
    }
  };

  const handleUpdateApprovalLevel = async () => {
    if (!editingApprovalLevel) return;

    try {
      const { error } = await supabase
        .from('approval_levels')
        .update({
          level_name: editingApprovalLevel.level_name,
          min_amount: editingApprovalLevel.min_amount,
          max_amount: editingApprovalLevel.max_amount,
          requires_committee_approval: editingApprovalLevel.requires_committee_approval,
          committee_threshold: editingApprovalLevel.committee_threshold,
          approval_authority: editingApprovalLevel.approval_authority,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingApprovalLevel.id);

      if (error) throw error;

      toast.success('Approval level updated successfully');
      setShowEditApprovalDialog(false);
      setEditingApprovalLevel(null);
      // Refresh approval levels
      const levels = await ApprovalLevelsService.getAllApprovalLevels();
      setApprovalLevels(levels);
    } catch (error) {
      console.error('Error updating approval level:', error);
      toast.error('Failed to update approval level');
    }
  };

  // Add Committee Member handlers
  const handleAddCommitteeMember = () => {
    setNewCommitteeMember({
      user_id: '',
      role: '',
      is_active: true
    });
    setShowAddCommitteeDialog(true);
  };

  const handleSaveCommitteeMember = async () => {
    try {
      const { error } = await supabase
        .from('loan_committee_members')
        .insert({
          ...newCommitteeMember,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Committee member added successfully');
      setShowAddCommitteeDialog(false);
      // Refresh committee members
      fetchCommitteeMembers();
    } catch (error) {
      console.error('Error adding committee member:', error);
      toast.error('Failed to add committee member');
    }
  };

  // Save all settings
  const handleSaveSettings = async () => {
    try {
      // Save approval rules
      await handleSaveApprovalRules();
      
      toast.success('All settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  // Handle approval level form submission
  const handleApprovalLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApprovalLevelsLoading(true);

    try {
      if (editingApprovalLevel) {
        await ApprovalLevelsService.updateApprovalLevel(editingApprovalLevel.id!, approvalLevelForm);
        toast.success('Approval level updated successfully');
      } else {
        await ApprovalLevelsService.createApprovalLevel({
          ...approvalLevelForm,
          created_by_user_id: 'system',
          updated_by_user_id: 'system'
        });
        toast.success('Approval level created successfully');
      }

      // Refresh approval levels
      const levels = await ApprovalLevelsService.getAllApprovalLevels();
      setApprovalLevels(levels);
      
      setShowApprovalLevelForm(false);
      setEditingApprovalLevel(null);
      setApprovalLevelForm({
        level_name: '',
        min_amount: 0,
        max_amount: 0,
        requires_committee_approval: false,
        committee_threshold: 0,
        approval_authority: 'loan_officer'
      });
    } catch (error) {
      console.error('Error saving approval level:', error);
      toast.error('Failed to save approval level');
    } finally {
      setApprovalLevelsLoading(false);
    }
  };


  const handleDeleteApprovalLevel = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this approval level?')) {
      try {
        await ApprovalLevelsService.deleteApprovalLevel(id);
        toast.success('Approval level deleted successfully');
        
        // Refresh approval levels
        const levels = await ApprovalLevelsService.getAllApprovalLevels();
        setApprovalLevels(levels);
      } catch (error) {
        console.error('Error deleting approval level:', error);
        toast.error('Failed to delete approval level');
      }
    }
  };

  // Committee member handlers
  const handleEditCommitteeMember = (member: any) => {
    setEditingCommitteeMember(member);
    setCommitteeMemberForm({
      user_id: member.user_id,
      role: member.role
    });
    setShowCommitteeMemberForm(true);
  };

  const handleDeleteCommitteeMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to delete this committee member?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loan_committee_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Committee member deleted successfully');
      // Refresh committee members list
      fetchCommitteeMembers();
    } catch (error: any) {
      console.error('Error deleting committee member:', error);
      toast.error('Failed to delete committee member');
    }
  };

  const fetchCommitteeMembers = async () => {
    setCommitteeMembersLoading(true);
    try {
      // First, fetch committee members
      const { data: committeeData, error: committeeError } = await supabase
        .from('loan_committee_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (committeeError) throw committeeError;

      // Then, fetch all users to get their names
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, user_id, first_name, last_name, email');

      if (usersError) throw usersError;

      // Create a map of user_id to user details
      const userMap = new Map();
      usersData?.forEach(user => {
        // Map both the numeric id and user_id (UUID) to the user details
        if (user.id) userMap.set(user.id, user);
        if (user.user_id) userMap.set(user.user_id, user);
      });

      // Map committee members with user names
      const membersWithNames = committeeData?.map(member => {
        const user = userMap.get(member.user_id);
        return {
          ...member,
          user_name: user ? 
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User' :
            'Unknown User'
        };
      }) || [];

      setCommitteeMembers(membersWithNames);
    } catch (error: any) {
      console.error('Error fetching committee members:', error);
      toast.error('Failed to fetch committee members');
      setCommitteeMembers([]);
    } finally {
      setCommitteeMembersLoading(false);
    }
  };

  const handleCommitteeMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommitteeMembersLoading(true);

    try {
      if (editingCommitteeMember) {
        const { error } = await supabase
          .from('loan_committee_members')
          .update({
            user_id: committeeMemberForm.user_id,
            role: committeeMemberForm.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCommitteeMember.id);

        if (error) throw error;
        toast.success('Committee member updated successfully');
      } else {
        const { error } = await supabase
          .from('loan_committee_members')
          .insert({
            user_id: committeeMemberForm.user_id,
            role: committeeMemberForm.role,
            is_active: true
          });

        if (error) throw error;
        toast.success('Committee member added successfully');
      }

      setShowCommitteeMemberForm(false);
      setCommitteeMemberForm({ user_id: '', role: 'member' });
      setEditingCommitteeMember(null);
      fetchCommitteeMembers();
    } catch (error: any) {
      console.error('Error saving committee member:', error);
      toast.error('Failed to save committee member');
    } finally {
      setCommitteeMembersLoading(false);
    }
  };

  // Load committee members on component mount
  useEffect(() => {
    fetchCommitteeMembers();
  }, []);

  const renderApprovals = () => (
    <div className="space-y-8">
      {/* Approval Levels Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Approval Levels</h3>
            <p className="text-sm text-gray-600">Configure loan approval levels and committee requirements</p>
          </div>
          <button
            onClick={handleAddApprovalLevel}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Approval Level
          </button>
        </div>

        {/* Approval Levels List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Approval Levels</h4>
            
            {approvalLevelsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading approval levels...</span>
              </div>
            ) : approvalLevels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No approval levels configured</p>
                <p className="text-xs text-gray-400 mt-2">
                  Database tables may need to be created. Check console for details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvalLevels.map((level) => (
                  <div key={level.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-medium text-gray-900">{level.level_name}</h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            level.approval_authority === 'committee' ? 'bg-purple-100 text-purple-800' :
                            level.approval_authority === 'manager' ? 'bg-blue-100 text-blue-800' :
                            level.approval_authority === 'senior_officer' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {level.approval_authority.replace('_', ' ').toUpperCase()}
                          </span>
                          {level.requires_committee_approval && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              COMMITTEE REQUIRED
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Amount Range:</span>
                            <span className="ml-2">{level.min_amount.toLocaleString()} - {level.max_amount.toLocaleString()} TZS</span>
                          </div>
                          <div>
                            <span className="font-medium">Committee Threshold:</span>
                            <span className="ml-2">{level.committee_threshold ? level.committee_threshold.toLocaleString() + ' TZS' : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditApprovalLevel(level)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit approval level"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteApprovalLevel(level.id!)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete approval level"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Committee Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Loan Committee Members</h3>
            <p className="text-sm text-gray-600">Manage loan committee members and their roles</p>
          </div>
          <button
            onClick={handleAddCommitteeMember}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Committee Member
          </button>
        </div>

        {/* Committee Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Committee Members</h4>
            
            {committeeMembersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading committee members...</span>
              </div>
            ) : committeeMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No committee members configured</p>
                <p className="text-xs text-gray-400 mt-2">
                  Database tables may need to be created. Check console for details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {committeeMembers.map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-medium text-gray-900">{member.user_name || 'Unknown User'}</h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'chair' ? 'bg-purple-100 text-purple-800' :
                            member.role === 'secretary' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">User ID:</span>
                          <span className="ml-2 font-mono text-xs">{member.user_id}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCommitteeMember(member)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Edit committee member"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCommitteeMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete committee member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Rules Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Approval Rules</h3>
          <p className="text-sm text-gray-600">Configure automatic approval rules and thresholds</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Committee Review Threshold (TZS)
                  </label>
                  <input
                    type="number"
                    value={approvalRules.committeeReviewThreshold}
                    onChange={(e) => setApprovalRules({...approvalRules, committeeReviewThreshold: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Loans above this amount require committee review</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Corporate Loan Threshold (TZS)
                  </label>
                  <input
                    type="number"
                    value={approvalRules.corporateLoanThreshold}
                    onChange={(e) => setApprovalRules({...approvalRules, corporateLoanThreshold: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Corporate loans above this amount require committee review</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Loan Threshold (TZS)
                  </label>
                  <input
                    type="number"
                    value={approvalRules.groupLoanThreshold}
                    onChange={(e) => setApprovalRules({...approvalRules, groupLoanThreshold: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="7500000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Group loans above this amount require committee review</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Staff Approval Limit (TZS)
                  </label>
                  <input
                    type="number"
                    value={approvalRules.staffApprovalLimit}
                    onChange={(e) => setApprovalRules({...approvalRules, staffApprovalLimit: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum amount staff can approve without supervisor</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveApprovalRules}
                  disabled={approvalRulesLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {approvalRulesLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Rules
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApprovalLevels = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Approval Levels</h3>
          <p className="text-sm text-gray-600">Configure loan approval levels and committee requirements</p>
        </div>
        <button
          onClick={() => {
            setEditingApprovalLevel(null);
            setApprovalLevelForm({
              level_name: '',
              min_amount: 0,
              max_amount: 1000000,
              requires_committee_approval: false,
              committee_threshold: 0,
              approval_authority: 'loan_officer'
            });
            setShowApprovalLevelForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Approval Level
        </button>
      </div>

      {/* Approval Levels List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Approval Levels</h4>
          
          {approvalLevelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading approval levels...</span>
            </div>
          ) : approvalLevels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No approval levels configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalLevels.map((level) => (
                <div key={level.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">{level.level_name}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          level.approval_authority === 'committee' ? 'bg-purple-100 text-purple-800' :
                          level.approval_authority === 'manager' ? 'bg-blue-100 text-blue-800' :
                          level.approval_authority === 'senior_officer' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {level.approval_authority.replace('_', ' ').toUpperCase()}
                        </span>
                        {level.requires_committee_approval && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            COMMITTEE REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amount Range:</span>
                          <span className="ml-2">{level.min_amount.toLocaleString()} - {level.max_amount.toLocaleString()} TZS</span>
                        </div>
                        <div>
                          <span className="font-medium">Committee Threshold:</span>
                          <span className="ml-2">{level.committee_threshold ? level.committee_threshold.toLocaleString() + ' TZS' : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditApprovalLevel(level)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit approval level"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteApprovalLevel(level.id!)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete approval level"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Approval Level Modal */}
      {showApprovalLevelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingApprovalLevel ? 'Edit Approval Level' : 'Add New Approval Level'}
              </h3>
              <button
                onClick={() => setShowApprovalLevelForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleApprovalLevelSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={approvalLevelForm.level_name}
                    onChange={(e) => setApprovalLevelForm(prev => ({ ...prev, level_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Level 1 - Small Loans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Authority *
                  </label>
                  <select
                    required
                    value={approvalLevelForm.approval_authority}
                    onChange={(e) => setApprovalLevelForm(prev => ({ ...prev, approval_authority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="loan_officer">Loan Officer</option>
                    <option value="senior_officer">Senior Officer</option>
                    <option value="manager">Manager</option>
                    <option value="committee">Committee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Amount (TZS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={approvalLevelForm.min_amount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value, 10);
                      setApprovalLevelForm(prev => ({ ...prev, min_amount: isNaN(numValue) ? 0 : numValue }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Amount (TZS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={approvalLevelForm.max_amount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value, 10);
                      setApprovalLevelForm(prev => ({ ...prev, max_amount: isNaN(numValue) ? 0 : numValue }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000000"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={approvalLevelForm.requires_committee_approval}
                        onChange={(e) => setApprovalLevelForm(prev => ({ ...prev, requires_committee_approval: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Requires Committee Approval
                      </span>
                    </label>
                  </div>
                </div>

                {approvalLevelForm.requires_committee_approval && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Committee Threshold (TZS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={approvalLevelForm.committee_threshold || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseInt(value, 10);
                        setApprovalLevelForm(prev => ({ ...prev, committee_threshold: isNaN(numValue) ? 0 : numValue }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Amount above which committee approval is required"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApprovalLevelForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvalLevelsLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {approvalLevelsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingApprovalLevel ? 'Update' : 'Create'} Approval Level
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Committee Member Modal */}
      {showCommitteeMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCommitteeMember ? 'Edit Committee Member' : 'Add Committee Member'}
              </h3>
              <button
                onClick={() => setShowCommitteeMemberForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCommitteeMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={committeeMemberForm.user_id}
                  onChange={(e) => setCommitteeMemberForm({...committeeMemberForm, user_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter user ID"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the user ID from the user management section</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={committeeMemberForm.role}
                  onChange={(e) => setCommitteeMemberForm({...committeeMemberForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="member">Member</option>
                  <option value="chair">Chair</option>
                  <option value="secretary">Secretary</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCommitteeMemberForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={committeeMembersLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {committeeMembersLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingCommitteeMember ? 'Update' : 'Add'} Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeesConfiguration = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fees Configuration</h3>
          <p className="text-sm text-gray-600">Configure application fees and legal fees for loan applications</p>
        </div>
        <button
          onClick={() => setShowFeesForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Update Fees
        </button>
      </div>

      {/* Current Configuration */}
      {currentFeesConfig && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-900">Application Fee</h5>
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{currentFeesConfig.application_fee_percentage}%</p>
              <p className="text-sm text-blue-700">of loan amount</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-green-900">Legal Fee</h5>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{currentFeesConfig.legal_fee_amount.toLocaleString()}</p>
              <p className="text-sm text-green-700">TZS (fixed amount)</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Example:</strong> For a loan of 1,000,000 TZS, the application fee would be {(1000000 * currentFeesConfig.application_fee_percentage / 100).toLocaleString()} TZS + {currentFeesConfig.legal_fee_amount.toLocaleString()} TZS legal fee = {((1000000 * currentFeesConfig.application_fee_percentage / 100) + currentFeesConfig.legal_fee_amount).toLocaleString()} TZS total upfront fees.
            </p>
          </div>
        </div>
      )}

      {/* Configuration History */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuration History</h4>
        {feesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading configurations...</span>
          </div>
        ) : feesConfigs.length > 0 ? (
          <div className="space-y-3">
            {feesConfigs.map((config, index) => (
              <div key={config.id} className={`p-4 rounded-lg border ${config.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Application Fee:</span>
                      <span className="font-semibold">{config.application_fee_percentage}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Legal Fee:</span>
                      <span className="font-semibold">{config.legal_fee_amount.toLocaleString()} TZS</span>
                    </div>
                    {config.is_active && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {config.created_at ? new Date(config.created_at).toLocaleString() : 'Unknown date'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No fees configurations found</p>
          </div>
        )}
      </div>

      {/* Fees Form Modal */}
      {showFeesForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Fees Configuration</h3>
              <button
                onClick={() => setShowFeesForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFeesSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Fee Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={feesForm.application_fee_percentage}
                    onChange={(e) => setFeesForm({...feesForm, application_fee_percentage: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Percentage of loan amount (e.g., 2.5 for 2.5%)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Fee Amount (TZS)
                </label>
                <input
                  type="number"
                  min="0"
                  value={feesForm.legal_fee_amount}
                  onChange={(e) => setFeesForm({...feesForm, legal_fee_amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Fixed amount in Tanzanian Shillings</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFeesForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feesLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {feesLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderBulkSms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk SMS Configuration</h3>
          <p className="text-sm text-gray-600">Configure and send SMS notifications to clients</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSmsConfig(true)}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Configure SMS
          </button>
          <button
            onClick={() => setShowBulkSms(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Send Bulk SMS
          </button>
        </div>
      </div>

      {/* SMS Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Sent</p>
              <p className="text-2xl font-bold text-blue-900">{smsStats.total_sent}</p>
            </div>
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Delivered</p>
              <p className="text-2xl font-bold text-green-900">{smsStats.total_delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-900">{smsStats.total_failed}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Cost</p>
              <p className="text-2xl font-bold text-purple-900">TZS {smsStats.total_cost.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* SMS Configuration Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">SMS Provider Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Provider:</span>
              <span className="font-medium">{smsConfig.provider === 'africas_talking' ? 'Africa\'s Talking' : 'Other'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                smsConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {smsConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cost per SMS:</span>
              <span className="font-medium">TZS {smsConfig.cost_per_sms.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily Limit:</span>
              <span className="font-medium">{smsConfig.daily_limit} SMS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Month:</span>
              <span className="font-medium">{smsStats.this_month_sent} sent</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Month Cost:</span>
              <span className="font-medium">TZS {smsStats.this_month_cost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent SMS History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Recent SMS History</h4>
            <button
              onClick={() => setShowSmsHistory(true)}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {smsHistory.slice(0, 5).map((sms) => (
                <tr key={sms.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sms.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sms.recipient_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {sms.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sms.status === 'Delivered' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sms.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    TZS {sms.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">System Settings</h1>
          <p className="text-blue-100">
            Configure system settings, user roles, and compliance parameters
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs.map(tab => ({
            ...tab,
            content: getTabContent(tab.id)
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          color="blue"
        />

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
                  <p className="text-sm text-gray-600 mt-1">Select an employee to create a user account</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setSelectedEmployee(null);
                    setUserForm({ name: '', email: '', role: '', password: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Employee *
                  </label>
                  <select
                    value={selectedEmployee?.id || ''}
                    onChange={(e) => {
                      const employeeId = e.target.value;
                      const employee = employees.find(emp => emp.id.toString() === employeeId);
                      if (employee) {
                        handleEmployeeSelect(employee);
                      } else {
                        setSelectedEmployee(null);
                        setUserForm({...userForm, name: '', email: ''});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={employeesLoading}
                  >
                    <option value="">
                      {employeesLoading ? 'Loading employees...' : 'Select an employee...'}
                    </option>
                    {employees.length === 0 && !employeesLoading ? (
                      <option value="" disabled>
                        No employees found. Please add employees first.
                      </option>
                    ) : (
                      employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} - {employee.position} ({employee.department})
                        </option>
                      ))
                    )}
                  </select>
                  
                  {/* Retry button for failed loads */}
                  {employees.length === 0 && !employeesLoading && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={fetchEmployees}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Retry loading employees
                      </button>
                    </div>
                  )}
                  
                  {selectedEmployee && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Selected:</strong> {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {selectedEmployee.position} • {selectedEmployee.department}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                    readOnly={selectedEmployee}
                  />
                  {selectedEmployee && (
                    <p className="text-xs text-gray-500 mt-1">
                      Email is auto-populated from employee record
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select 
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select role...</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
                    setUserForm({ name: '', email: '', role: '', password: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUser(false);
                      setSelectedUser(null);
                      setUserForm({ name: '', email: '', role: '', password: '' });
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Delete User</h3>
                <button
                  onClick={() => {
                    setShowDeleteUser(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">Are you sure?</h4>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  You are about to delete <strong>{selectedUser?.name}</strong> ({selectedUser?.email}). 
                  This will permanently remove the user from the system.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteUser(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteUser}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {(showAddProduct || showEditProduct) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showEditProduct ? 'Edit Loan Product' : 'Add New Loan Product'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setShowEditProduct(false);
                    resetProductForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); showEditProduct ? handleUpdateProduct() : handleAddProduct(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.interest_rate}
                      onChange={(e) => setProductForm({...productForm, interest_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter interest rate"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Amount (TZS) *
                    </label>
                    <input
                      type="number"
                      value={productForm.min_amount}
                      onChange={(e) => setProductForm({...productForm, min_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter minimum amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Amount (TZS) *
                    </label>
                    <input
                      type="number"
                      value={productForm.max_amount}
                      onChange={(e) => setProductForm({...productForm, max_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter maximum amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Tenor (Months) *
                    </label>
                    <input
                      type="number"
                      value={productForm.tenor_min_months}
                      onChange={(e) => setProductForm({...productForm, tenor_min_months: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter minimum tenor"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Tenor (Months) *
                    </label>
                    <input
                      type="number"
                      value={productForm.tenor_max_months}
                      onChange={(e) => setProductForm({...productForm, tenor_max_months: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter maximum tenor"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Fee Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.processing_fee_rate}
                      onChange={(e) => setProductForm({...productForm, processing_fee_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter processing fee rate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repayment Frequency
                    </label>
                    <select
                      value={productForm.repayment_frequency}
                      onChange={(e) => setProductForm({...productForm, repayment_frequency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.requires_guarantor}
                      onChange={(e) => setProductForm({...productForm, requires_guarantor: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Requires Guarantor</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.requires_collateral}
                      onChange={(e) => setProductForm({...productForm, requires_collateral: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Requires Collateral</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(false);
                      setShowEditProduct(false);
                      resetProductForm();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Saving...' : (showEditProduct ? 'Update Product' : 'Add Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Integration Configuration Modal */}
        {showIntegrationConfig && selectedIntegration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Configure {selectedIntegration.name}
                </h3>
                <button
                  onClick={() => setShowIntegrationConfig(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveIntegrationConfig(); }} className="space-y-4">
                {/* ClickPesa specific fields */}
                {selectedIntegration.name === 'ClickPesa' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID *
                      </label>
                      <input
                        type="text"
                        value={integrationForm.client_id}
                        onChange={(e) => setIntegrationForm({...integrationForm, client_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter ClickPesa Client ID"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key *
                      </label>
                      <input
                        type="password"
                        value={integrationForm.api_key}
                        onChange={(e) => setIntegrationForm({...integrationForm, api_key: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter ClickPesa API Key"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        value={integrationForm.webhook_url}
                        onChange={(e) => setIntegrationForm({...integrationForm, webhook_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://your-domain.com/webhooks/clickpesa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Environment
                      </label>
                      <select
                        value={integrationForm.environment}
                        onChange={(e) => setIntegrationForm({...integrationForm, environment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="sandbox">Sandbox (Testing)</option>
                        <option value="production">Production (Live)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Standard fields for other integrations */}
                {selectedIntegration.name !== 'ClickPesa' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key *
                      </label>
                      <input
                        type="text"
                        value={integrationForm.api_key}
                        onChange={(e) => setIntegrationForm({...integrationForm, api_key: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter API key"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secret Key
                      </label>
                      <input
                        type="password"
                        value={integrationForm.secret_key}
                        onChange={(e) => setIntegrationForm({...integrationForm, secret_key: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter secret key"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint URL *
                  </label>
                  <input
                    type="url"
                    value={integrationForm.endpoint_url}
                    onChange={(e) => setIntegrationForm({...integrationForm, endpoint_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter endpoint URL"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={integrationForm.timeout}
                      onChange={(e) => setIntegrationForm({...integrationForm, timeout: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      value={integrationForm.retry_attempts}
                      onChange={(e) => setIntegrationForm({...integrationForm, retry_attempts: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowIntegrationConfig(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SMS Template Modal */}
        {showSmsTemplate && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit SMS Template: {selectedTemplate.name}
                </h3>
                <button
                  onClick={() => setShowSmsTemplate(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveSmsTemplate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={smsTemplateForm.name}
                    onChange={(e) => setSmsTemplateForm({...smsTemplateForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Event
                  </label>
                  <select
                    value={smsTemplateForm.trigger_event}
                    onChange={(e) => setSmsTemplateForm({...smsTemplateForm, trigger_event: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="payment_due_3_days">Payment Due (3 days before)</option>
                    <option value="payment_overdue">Payment Overdue</option>
                    <option value="loan_approved">Loan Approved</option>
                    <option value="loan_rejected">Loan Rejected</option>
                    <option value="loan_disbursed">Loan Disbursed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (English) *
                  </label>
                  <textarea
                    value={smsTemplateForm.message_en}
                    onChange={(e) => setSmsTemplateForm({...smsTemplateForm, message_en: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter English message template"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available variables: {'{client_name}'}, {'{amount}'}, {'{due_date}'}, {'{loan_id}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (Kiswahili) *
                  </label>
                  <textarea
                    value={smsTemplateForm.message_sw}
                    onChange={(e) => setSmsTemplateForm({...smsTemplateForm, message_sw: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter Kiswahili message template"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Send Timing
                  </label>
                  <input
                    type="text"
                    value={smsTemplateForm.send_timing}
                    onChange={(e) => setSmsTemplateForm({...smsTemplateForm, send_timing: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 3 days before due date"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSmsTemplate(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SMS Configuration Modal */}
        {showSmsConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">SMS Provider Configuration</h3>
                <button
                  onClick={() => setShowSmsConfig(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveSmsConfig(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMS Provider *
                    </label>
                    <select
                      value={smsConfig.provider}
                      onChange={(e) => setSmsConfig({...smsConfig, provider: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="africas_talking">Africa's Talking</option>
                      <option value="twilio">Twilio</option>
                      <option value="nexmo">Nexmo (Vonage)</option>
                      <option value="custom">Custom Provider</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key *
                    </label>
                    <input
                      type="password"
                      value={smsConfig.api_key}
                      onChange={(e) => setSmsConfig({...smsConfig, api_key: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter API key"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={smsConfig.username}
                      onChange={(e) => setSmsConfig({...smsConfig, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sender ID *
                    </label>
                    <input
                      type="text"
                      value={smsConfig.sender_id}
                      onChange={(e) => setSmsConfig({...smsConfig, sender_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter sender ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost per SMS (TZS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={smsConfig.cost_per_sms}
                      onChange={(e) => setSmsConfig({...smsConfig, cost_per_sms: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={smsConfig.daily_limit}
                      onChange={(e) => setSmsConfig({...smsConfig, daily_limit: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={smsConfig.enabled}
                    onChange={(e) => setSmsConfig({...smsConfig, enabled: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Enable SMS sending</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSmsConfig(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk SMS Modal */}
        {showBulkSms && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Send Bulk SMS</h3>
                <button
                  onClick={() => setShowBulkSms(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendBulkSms(); }} className="space-y-6">
                {/* Recipient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Recipients
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="recipient_type"
                          value="all_clients"
                          checked={bulkSmsForm.recipient_type === 'all_clients'}
                          onChange={(e) => setBulkSmsForm({...bulkSmsForm, recipient_type: e.target.value})}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">All Clients</div>
                          <div className="text-sm text-gray-500">Send to all active clients (150 recipients)</div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="recipient_type"
                          value="loan_status"
                          checked={bulkSmsForm.recipient_type === 'loan_status'}
                          onChange={(e) => setBulkSmsForm({...bulkSmsForm, recipient_type: e.target.value})}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">By Loan Status</div>
                          <div className="text-sm text-gray-500">Filter by loan status (45 recipients)</div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="recipient_type"
                          value="specific_clients"
                          checked={bulkSmsForm.recipient_type === 'specific_clients'}
                          onChange={(e) => setBulkSmsForm({...bulkSmsForm, recipient_type: e.target.value})}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">Specific Clients</div>
                          <div className="text-sm text-gray-500">Select individual clients</div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="recipient_type"
                          value="custom_list"
                          checked={bulkSmsForm.recipient_type === 'custom_list'}
                          onChange={(e) => setBulkSmsForm({...bulkSmsForm, recipient_type: e.target.value})}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">Custom List</div>
                          <div className="text-sm text-gray-500">Upload phone numbers</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Message Composition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={bulkSmsForm.message}
                    onChange={(e) => setBulkSmsForm({...bulkSmsForm, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter your message here..."
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Available variables: {'{client_name}'}, {'{amount}'}, {'{due_date}'}, {'{loan_id}'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bulkSmsForm.message.length}/160 characters
                    </p>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={bulkSmsForm.language}
                      onChange={(e) => setBulkSmsForm({...bulkSmsForm, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="sw">Kiswahili</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule
                    </label>
                    <select
                      value={bulkSmsForm.schedule_type}
                      onChange={(e) => setBulkSmsForm({...bulkSmsForm, schedule_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="immediate">Send Immediately</option>
                      <option value="scheduled">Schedule for Later</option>
                    </select>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recipients: {getRecipientCount()}</p>
                      <p className="text-sm text-gray-600">Cost per SMS: TZS {smsConfig.cost_per_sms.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        Total Cost: TZS {getEstimatedCost().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkSms(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSms || !bulkSmsForm.message.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSendingSms && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isSendingSms ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SMS History Modal */}
        {showSmsHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">SMS History</h3>
                <button
                  onClick={() => setShowSmsHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {smsHistory.map((sms) => (
                      <tr key={sms.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sms.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sms.recipient_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          {sms.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sms.status === 'Delivered' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {sms.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          TZS {sms.cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sms.provider}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Approval Level Dialog */}
        {showAddApprovalDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Approval Level</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level Name</label>
                  <input
                    type="text"
                    value={newApprovalLevel.level_name}
                    onChange={(e) => setNewApprovalLevel({...newApprovalLevel, level_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Small Loans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (TZS)</label>
                  <input
                    type="number"
                    value={newApprovalLevel.min_amount}
                    onChange={(e) => setNewApprovalLevel({...newApprovalLevel, min_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (TZS)</label>
                  <input
                    type="number"
                    value={newApprovalLevel.max_amount}
                    onChange={(e) => setNewApprovalLevel({...newApprovalLevel, max_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approval Authority</label>
                  <select
                    value={newApprovalLevel.approval_authority}
                    onChange={(e) => setNewApprovalLevel({...newApprovalLevel, approval_authority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="loan_officer">Loan Officer</option>
                    <option value="senior_officer">Senior Officer</option>
                    <option value="manager">Manager</option>
                    <option value="committee">Committee</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_committee"
                    checked={newApprovalLevel.requires_committee_approval}
                    onChange={(e) => setNewApprovalLevel({...newApprovalLevel, requires_committee_approval: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="requires_committee" className="text-sm font-medium text-gray-700">
                    Requires Committee Approval
                  </label>
                </div>
                {newApprovalLevel.requires_committee_approval && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Committee Threshold (TZS)</label>
                    <input
                      type="number"
                      value={newApprovalLevel.committee_threshold}
                      onChange={(e) => setNewApprovalLevel({...newApprovalLevel, committee_threshold: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1000000"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowAddApprovalDialog(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApprovalLevel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Approval Level Dialog */}
        {showEditApprovalDialog && editingApprovalLevel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Approval Level</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level Name</label>
                  <input
                    type="text"
                    value={editingApprovalLevel.level_name}
                    onChange={(e) => setEditingApprovalLevel({...editingApprovalLevel, level_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (TZS)</label>
                  <input
                    type="number"
                    value={editingApprovalLevel.min_amount}
                    onChange={(e) => setEditingApprovalLevel({...editingApprovalLevel, min_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (TZS)</label>
                  <input
                    type="number"
                    value={editingApprovalLevel.max_amount}
                    onChange={(e) => setEditingApprovalLevel({...editingApprovalLevel, max_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approval Authority</label>
                  <select
                    value={editingApprovalLevel.approval_authority}
                    onChange={(e) => setEditingApprovalLevel({...editingApprovalLevel, approval_authority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="loan_officer">Loan Officer</option>
                    <option value="senior_officer">Senior Officer</option>
                    <option value="manager">Manager</option>
                    <option value="committee">Committee</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_requires_committee"
                    checked={editingApprovalLevel.requires_committee_approval}
                    onChange={(e) => setEditingApprovalLevel({...editingApprovalLevel, requires_committee_approval: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="edit_requires_committee" className="text-sm font-medium text-gray-700">
                    Requires Committee Approval
                  </label>
                </div>
                {editingApprovalLevel.requires_committee_approval && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Committee Threshold (TZS)</label>
                    <input
                      type="number"
                      value={editingApprovalLevel.committee_threshold || 0}
                      onChange={(e) => setEditingApprovalLevel({...editingApprovalLevel, committee_threshold: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowEditApprovalDialog(false);
                    setEditingApprovalLevel(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateApprovalLevel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Committee Member Dialog */}
        {showAddCommitteeDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Committee Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff Member</label>
                  <select
                    value={newCommitteeMember.user_id}
                    onChange={(e) => setNewCommitteeMember({...newCommitteeMember, user_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a staff member</option>
                    {usersWithValidUUID.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newCommitteeMember.role}
                    onChange={(e) => setNewCommitteeMember({...newCommitteeMember, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a role</option>
                    <option value="chair">Chairperson</option>
                    <option value="vice_chair">Vice Chairperson</option>
                    <option value="member">Member</option>
                    <option value="secretary">Secretary</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newCommitteeMember.is_active}
                    onChange={(e) => setNewCommitteeMember({...newCommitteeMember, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active Member
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowAddCommitteeDialog(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCommitteeMember}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { roundCurrency } from '../utils/roundingUtils';
import { AttendanceService } from '../services/attendanceServiceNew';
import { PayrollEmployeeService } from '../services/payrollEmployeeService';
import LeaveManagementComponent from '../components/LeaveManagementComponent';
import DocumentManagementComponent from '../components/DocumentManagementComponent';
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  FileText,
  Download,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Building,
  Award,
  Shield,
  UserCheck,
  UserX,
  Clock3,
  FileCheck,
  Plus,
  Save,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  RefreshCw,
  User,
  LogIn,
  LogOut,
  DollarSign,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employment_type: 'permanent' | 'contract' | 'temporary' | 'intern';
  employment_status: 'active' | 'inactive' | 'terminated' | 'resigned';
  hire_date: string;
  salary: number;
  basic_salary: number; // Add missing basic_salary property
  national_id: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  bank_name: string;
  bank_account: string;
  nssf_number: string;
  paye_number: string;
  
  // Geographic Assignment (MSP2_10) - Support both snake_case and camelCase
  assignedBranch: string;
  assigned_branch: string; // Add snake_case version
  workRegion: string;
  work_region: string; // Add snake_case version
  regionCode: string;
  region_code: string; // Add snake_case version
  
  // Role Classification - Support both snake_case and camelCase
  staffCategory: 'Management' | 'Credit Officers' | 'Operations' | 'Support';
  staff_category: string; // Add snake_case version
  regulatoryRole: string;
  regulatory_role: string; // Add snake_case version
  
  // Performance Metrics - Support both snake_case and camelCase
  clientsManaged: number;
  clients_managed: number; // Add snake_case version
  loansManaged: number;
  loans_managed: number; // Add snake_case version
  portfolioValue: number;
  portfolio_value: number; // Add snake_case version
  
  // Access Control - Add missing properties
  access_level: string;
  security_clearance_level: string;
  
  // Compliance
  trainingStatus: string[];
  certifications: string[];
  lastPerformanceReview: string;
  
  created_at: string;
  updated_at: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'study' | 'unpaid';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  hours_worked: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  created_at: string;
}

const StaffManagement: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  
  // Debug logging
  console.log('StaffManagement - user:', user, 'authLoading:', authLoading);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceRecordsLoading, setAttendanceRecordsLoading] = useState(false);
  
  // Load today's attendance
  const loadTodayAttendance = async () => {
    if (!user?.id) return;
    
    setAttendanceLoading(true);
    try {
      const result = await AttendanceService.getTodayAttendance(user.id);
      if (result.success) {
        setTodayAttendance(result.data);
      }
    } catch (error) {
      console.error('Error loading today attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load all attendance records
  const loadAttendanceRecords = async (): Promise<void> => {
    setAttendanceRecordsLoading(true);
    try {
      console.log('Loading attendance records...');
      
      // First test the connection
      const connectionTest = await AttendanceService.testConnection();
      console.log('Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        console.error('Database connection test failed:', connectionTest.error);
        toast.error('Database connection failed: ' + connectionTest.error);
        return;
      }
      
      const result = await AttendanceService.getAttendanceRecords();
      console.log('Attendance records result:', result);
      if (result.success) {
        setAttendanceRecords(result.data || []);
        console.log('Attendance records loaded:', result.data?.length || 0, 'records');
      } else {
        console.error('Failed to load attendance records:', result.error);
        toast.error(result.error || 'Failed to load attendance records');
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast.error('Error loading attendance records');
    } finally {
      setAttendanceRecordsLoading(false);
    }
  };
  
  // Load attendance data on component mount
  React.useEffect(() => {
    if (user?.id) {
      loadTodayAttendance();
      loadAttendanceRecords();
    }
  }, [user?.id]);
  
  // Onboarding state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    alternative_phone: '',
    national_id: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: 'Tanzanian',
    
    // Address Information
    residential_address: '',
    postal_address: '',
    region: '',
    district: '',
    ward: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    emergency_contact_address: '',
    
    // Employment Information
    position: '',
    department: '',
    employment_type: 'permanent',
    hire_date: '',
    probation_end_date: '',
    contract_start_date: '',
    contract_end_date: '',
    
    // Salary Information
    basic_salary: '',
    allowances: '',
    currency: 'TZS',
    
    // Banking Information
    bank_name: '',
    bank_account: '',
    bank_branch: '',
    
    // Tax and Social Security
    nssf_number: '',
    paye_number: '',
    tin_number: '',
    
    // Educational Background
    highest_qualification: '',
    institution: '',
    graduation_year: '',
    field_of_study: '',
    
    // Work Experience
    previous_employer: '',
    previous_position: '',
    previous_salary: '',
    years_of_experience: '',
    
    // KYC & Security Information
    passport_number: '',
    passport_expiry: '',
    driving_license: '',
    voter_id: '',
    birth_certificate: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
    next_of_kin_address: '',
    next_of_kin_id: '',
    
    // Financial Information & Risk Assessment
    bank_name_2: '',
    bank_account_2: '',
    bank_name_3: '',
    bank_account_3: '',
    credit_score: '',
    existing_loans: '',
    loan_amount: '',
    monthly_income: '',
    monthly_expenses: '',
    assets: '',
    liabilities: '',
    financial_obligations: '',
    
    // Security & Access Control
    security_clearance_level: 'basic',
    access_level: 'standard',
    system_permissions: [] as string[],
    biometric_data: '',
    security_questions: {
      question1: '',
      answer1: '',
      question2: '',
      answer2: '',
      question3: '',
      answer3: ''
    },
    
    // Background Check & Verification
    criminal_record: 'none',
    credit_check: 'pending',
    reference_check: 'pending',
    employment_verification: 'pending',
    education_verification: 'pending',
    identity_verification: 'pending',
    
    // Compliance & Regulatory
    aml_check: 'pending',
    pep_check: 'pending', // Politically Exposed Person
    sanctions_check: 'pending',
    risk_rating: 'low',
    
    // Documents
    documents: [] as File[],
    kyc_documents: [] as File[],
    identity_documents: [] as File[],
    financial_documents: [] as File[],
    security_documents: [] as File[],
    compliance_documents: [] as File[],
    
    // Required Documents
    passport_photo: null as File | null,
    id_copy: null as File | null,
    academic_papers: [] as File[],
    ward_rep_introduction: null as File | null,
    certificate_of_good_conduct: null as File | null,
    fingerprints: null as File | null,
    
    // Enhanced Staff Data - Geographic Assignment (MSP2_10)
    assignedBranch: '',
    workRegion: '',
    regionCode: '',
    
    // Role Classification
    staffCategory: 'Support' as 'Management' | 'Credit Officers' | 'Operations' | 'Support',
    regulatoryRole: '',
    
    // Performance Metrics
    clientsManaged: 0,
    loansManaged: 0,
    portfolioValue: 0,
    
    // Compliance
    trainingStatus: [] as string[],
    certifications: [] as string[],
    lastPerformanceReview: ''
  });
  
  const [onboardingErrors, setOnboardingErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const [errorType, setErrorType] = useState<'validation' | 'network' | 'database' | 'permission' | 'unknown' | null>(null);
  
  // Employee management states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Fetch data from Supabase - using employees table
  const { data: employees, refetch: refetchEmployees } = useSupabaseQuery('employees', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Supabase insert hook - removed unused insertEmployee

  // Mock data for demonstration - will be replaced when tables are created
  const leaveRequests: LeaveRequest[] = [];

  // Employee management functions
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleArchiveEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowArchiveModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      setIsSubmitting(true);
      
      // Get form data from the modal - use a more specific selector
      const form = document.querySelector('#edit-employee-form') as HTMLFormElement;
      if (!form) {
        console.error('Edit form not found');
        toast.error('Form not found');
        return;
      }

      const formData = new FormData(form);
      const updateData: any = {};

      // Extract all form fields and map to database field names
      // Only include fields that are confirmed to exist in the database schema
      const fieldMapping: { [key: string]: string } = {
        'first_name': 'first_name',
        'last_name': 'last_name',
        'email': 'email',
        'phone': 'phone_number', // Map phone to phone_number
        'national_id': 'national_id',
        'date_of_birth': 'date_of_birth',
        'gender': 'gender',
        'marital_status': 'marital_status',
        'address': 'residential_address', // Map address to residential_address
        'employee_id': 'employee_id',
        'position': 'position',
        'department': 'department',
        'employment_type': 'employment_type',
        'employment_status': 'employment_status',
        'hire_date': 'hire_date',
        'basic_salary': 'basic_salary',
        'emergency_contact_name': 'emergency_contact_name',
        'emergency_contact_phone': 'emergency_contact_phone',
        'emergency_contact_relationship': 'emergency_contact_relationship',
        'bank_name': 'bank_name',
        'bank_account': 'bank_account',
        'nssf_number': 'nssf_number',
        'paye_number': 'paye_number'
      };

      for (const [key, value] of formData.entries()) {
        if (value && value.toString().trim() !== '') {
          const dbFieldName = fieldMapping[key];
          if (dbFieldName) {
            updateData[dbFieldName] = value.toString().trim();
          }
        }
      }

      console.log('Form data collected:', updateData);
      console.log('Employee ID:', editingEmployee.id);

      // Check if we have any data to update
      if (Object.keys(updateData).length === 0) {
        console.warn('No valid form data found to update');
        toast.error('No changes detected');
        return;
      }

      // Convert numeric fields
      if (updateData.basic_salary) {
        updateData.basic_salary = parseFloat(updateData.basic_salary);
      }

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      console.log('Data to update:', updateData);

      // Update employee in Supabase
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', editingEmployee.id)
        .select();

      if (error) {
        console.error('Supabase error updating employee:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error(`Failed to update employee: ${error.message}`);
        return;
      }

      console.log('Update successful:', data);
      toast.success('Employee updated successfully');
      setShowEditModal(false);
      setEditingEmployee(null);
      
      // Refresh the employees list
      refetchEmployees();
      
    } catch (error) {
      console.error('Exception updating employee:', error);
      toast.error(`Failed to update employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmArchiveEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({ 
          employment_status: 'terminated',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      if (error) {
        toast.error('Failed to archive employee: ' + error.message);
        return;
      }

      toast.success('Employee archived successfully');
      setShowArchiveModal(false);
      setSelectedEmployee(null);
      refetchEmployees();
    } catch (error) {
      console.error('Error archiving employee:', error);
      toast.error('Failed to archive employee');
    }
  };


  // Filter employees based on search and filters
  const filteredEmployees = employees?.filter((emp: any) => {
    const matchesSearch = searchTerm === '' || 
      (emp.first_name && emp.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.last_name && emp.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = filterDepartment === '' || (emp.department && emp.department === filterDepartment);
    const matchesStatus = filterStatus === '' || (emp.employment_status && emp.employment_status === filterStatus);
    const matchesBranch = filterBranch === '' || (emp.assignedBranch && emp.assignedBranch === filterBranch);
    const matchesRegion = filterRegion === '' || (emp.workRegion && emp.workRegion === filterRegion);
    const matchesCategory = filterCategory === '' || (emp.staffCategory && emp.staffCategory === filterCategory);
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesBranch && matchesRegion && matchesCategory;
  }) || [];

  // Calculate statistics
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter((emp: any) => emp.employment_status === 'active').length || 0;
  const pendingLeaveRequests = leaveRequests?.filter((leave: LeaveRequest) => leave.status === 'pending').length || 0;
  const todayAttendanceCount = attendanceRecords?.filter((att: AttendanceRecord) => 
    att.date === new Date().toISOString().split('T')[0]
  ).length || 0;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Users className="w-4 h-4" /> },
    { id: 'employees', name: 'Employee Records', icon: <FileText className="w-4 h-4" /> },
    { id: 'geographic', name: 'Geographic Distribution', icon: <Building className="w-4 h-4" /> },
    { id: 'onboarding', name: 'Onboarding', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'attendance', name: 'Time & Attendance', icon: <Clock className="w-4 h-4" /> },
    { id: 'leave', name: 'Leave Management', icon: <Calendar className="w-4 h-4" /> },
    { id: 'documents', name: 'Document Management', icon: <FileText className="w-4 h-4" /> },
    { id: 'offboarding', name: 'Offboarding', icon: <UserX className="w-4 h-4" /> },
    { id: 'reports', name: 'Reports', icon: <Download className="w-4 h-4" /> }
  ];

  const departments = [
    'Human Resources',
    'Finance',
    'Operations',
    'IT',
    'Marketing',
    'Customer Service',
    'Risk Management',
    'Compliance',
    'Legal',
    'Administration'
  ];

  // Tanzania and Zanzibar Administrative Regions
  const tanzaniaRegions = {
    'Tanzania Mainland': [
      'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 
      'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 
      'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 
      'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga'
    ],
    'Zanzibar': [
      'Unguja North', 'Unguja South', 'Unguja Urban West', 'Pemba North', 'Pemba South'
    ]
  };



  // Onboarding helper functions
  const handleOnboardingInputChange = (field: string, value: string | File[] | any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (onboardingErrors[field]) {
      setOnboardingErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
      setErrorType(null);
    }
  };

  // Enhanced error handling utility
  const handleError = (error: any, context: string = 'Unknown') => {
    console.error(`Error in ${context}:`, error);
    setLastError(error);
    
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let errorType: 'validation' | 'network' | 'database' | 'permission' | 'unknown' = 'unknown';
    
    // Categorize and handle different types of errors
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          errorMessage = 'This employee ID already exists. The system will generate a new one automatically.';
          errorType = 'database';
          break;
        case '23514': // Check constraint violation
          errorMessage = 'Some required information is missing or invalid. Please check all fields and try again.';
          errorType = 'validation';
          break;
        case '23503': // Foreign key constraint violation
          errorMessage = 'Invalid reference data. Please refresh the page and try again.';
          errorType = 'database';
          break;
        case '42501': // Insufficient privilege
          errorMessage = 'You do not have permission to perform this action. Please contact your administrator.';
          errorType = 'permission';
          break;
        case 'PGRST116': // Row level security violation
          errorMessage = 'Access denied. Please check your permissions and try again.';
          errorType = 'permission';
          break;
        default:
          errorMessage = `Database error (${error.code}): ${error.message}`;
          errorType = 'database';
      }
    } else if (error.message) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        errorType = 'network';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        errorType = 'network';
      } else if (error.message.includes('validation')) {
        errorMessage = error.message;
        errorType = 'validation';
      } else {
        errorMessage = error.message;
      }
    }
    
    setSubmitError(errorMessage);
    setErrorType(errorType);
    
    // Show toast notification
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-right'
    });
  };

  // Retry mechanism
  const handleRetry = async () => {
    if (retryCount >= 3) {
      setSubmitError('Maximum retry attempts reached. Please refresh the page and try again.');
      return;
    }
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setSubmitError(null);
    setErrorType(null);
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    
    try {
      await handleSubmitOnboarding();
    } catch (error) {
      handleError(error, 'Retry attempt');
    } finally {
      setIsRetrying(false);
    }
  };

  // Clear all errors
  const clearErrors = () => {
    setSubmitError(null);
    setErrorType(null);
    setLastError(null);
    setRetryCount(0);
    setOnboardingErrors({});
  };

  const validateOnboardingStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Personal Information & Identity
        if (!onboardingData.first_name?.trim()) errors.first_name = 'First name is required';
        if (!onboardingData.last_name?.trim()) errors.last_name = 'Last name is required';
        if (!onboardingData.email?.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboardingData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        if (!onboardingData.phone?.trim()) {
          errors.phone = 'Phone number is required';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(onboardingData.phone)) {
          errors.phone = 'Please enter a valid phone number';
        }
        if (!onboardingData.national_id?.trim()) {
          errors.national_id = 'National ID is required';
        } else if (onboardingData.national_id.length < 8) {
          errors.national_id = 'National ID must be at least 8 characters';
        }
        if (!onboardingData.date_of_birth) {
          errors.date_of_birth = 'Date of birth is required';
        } else {
          const birthDate = new Date(onboardingData.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18) {
            errors.date_of_birth = 'Employee must be at least 18 years old';
          } else if (age > 65) {
            errors.date_of_birth = 'Employee age seems too high. Please verify the date.';
          }
        }
        if (!onboardingData.gender) errors.gender = 'Gender is required';
        if (!onboardingData.marital_status) errors.marital_status = 'Marital status is required';
        break;
        
      case 2: // Employment Information
        if (!onboardingData.position?.trim()) errors.position = 'Position is required';
        if (!onboardingData.department?.trim()) errors.department = 'Department is required';
        if (!onboardingData.hire_date) {
          errors.hire_date = 'Hire date is required';
        } else {
          const hireDate = new Date(onboardingData.hire_date);
          const today = new Date();
          if (hireDate > today) {
            errors.hire_date = 'Hire date cannot be in the future';
          }
        }
        if (!onboardingData.basic_salary?.trim()) {
          errors.basic_salary = 'Basic salary is required';
        } else if (isNaN(parseFloat(onboardingData.basic_salary)) || parseFloat(onboardingData.basic_salary) <= 0) {
          errors.basic_salary = 'Please enter a valid salary amount';
        }
        if (!onboardingData.assignedBranch) errors.assignedBranch = 'Assigned branch is required';
        if (!onboardingData.workRegion) errors.workRegion = 'Work region is required';
        if (!onboardingData.regionCode) errors.regionCode = 'Region code is required';
        if (!onboardingData.staffCategory) errors.staffCategory = 'Staff category is required';
        if (!onboardingData.regulatoryRole) errors.regulatoryRole = 'Regulatory role is required';
        break;
        
      case 3: // Required Documents & Photo
        if (!onboardingData.passport_photo) errors.passport_photo = 'Passport photo is required';
        if (!onboardingData.id_copy) errors.id_copy = 'National ID copy is required';
        if (onboardingData.academic_papers.length === 0) errors.academic_papers = 'At least one academic paper is required';
        if (!onboardingData.ward_rep_introduction) errors.ward_rep_introduction = 'Ward rep introduction letter is required';
        if (!onboardingData.certificate_of_good_conduct) errors.certificate_of_good_conduct = 'Certificate of good conduct is required';
        if (!onboardingData.fingerprints) errors.fingerprints = 'Fingerprints are required';
        break;
        
      case 4: // Review & Submit
        // Final validation before submission
        break;
    }
    
    setOnboardingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateOnboardingStep(onboardingStep)) {
      setOnboardingStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setOnboardingStep(prev => Math.max(prev - 1, 1));
  };

  // Removed unused handleFileUpload and removeDocument functions

  const generateEmployeeId = async (retryCount = 0) => {
    const maxRetries = 5;
    
    try {
      console.log(`Generating employee ID (attempt ${retryCount + 1})...`);
      
      // Get all existing employee IDs to find the highest one
      const { data: existingEmployees, error } = await supabase
        .from('employees')
        .select('employee_id')
        .order('employee_id', { ascending: false });

      if (error) {
        console.error('Error fetching existing employees:', error);
        // Fallback to current timestamp if database query fails
        const timestamp = Date.now().toString().slice(-4);
        const fallbackId = `EM${timestamp.padStart(4, '0')}`;
        console.log('Using fallback ID:', fallbackId);
        return fallbackId;
      }

      console.log('Found existing employees:', existingEmployees?.length || 0);

      let nextNumber = 1;
      
      if (existingEmployees && existingEmployees.length > 0) {
        // Find the highest number from all existing IDs
        let maxNumber = 0;
        for (const emp of existingEmployees) {
          const match = emp.employee_id?.match(/^EM(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
        nextNumber = maxNumber + 1;
        console.log('Highest existing number:', maxNumber, 'Next number:', nextNumber);
      }

      // Format as EM0001, EM0002, etc.
      const newId = `EM${nextNumber.toString().padStart(4, '0')}`;
      console.log('Generated candidate ID:', newId);
      
      // Check if this ID already exists (race condition protection)
      const { data: existingId, error: checkError } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('employee_id', newId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing ID:', checkError);
        throw checkError;
      }

      if (existingId) {
        // ID already exists, retry with incremented number
        if (retryCount < maxRetries) {
          console.log(`Employee ID ${newId} already exists, retrying... (attempt ${retryCount + 1})`);
          return generateEmployeeId(retryCount + 1);
        } else {
          // Max retries reached, use timestamp fallback
          const timestamp = Date.now().toString().slice(-4);
          const fallbackId = `EM${timestamp.padStart(4, '0')}`;
          console.log('Max retries reached, using fallback ID:', fallbackId);
          return fallbackId;
        }
      }

      console.log('ID is unique, returning:', newId);
      return newId;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      // Fallback to current timestamp if any error occurs
      const timestamp = Date.now().toString().slice(-4);
      const fallbackId = `EM${timestamp.padStart(4, '0')}`;
      console.log('Using error fallback ID:', fallbackId);
      return fallbackId;
    }
  };

  const handleSubmitOnboarding = async () => {
    if (!validateOnboardingStep(onboardingStep)) return;
    
    setIsSubmitting(true);
    clearErrors(); // Clear any previous errors
    
    try {
      // Generate employee ID
      const employeeId = await generateEmployeeId();
      
      // Get tenant ID for the employee
      let tenantId = '00000000-0000-0000-0000-000000000000'; // Default fallback
      
      if (user?.id) {
        // Try to get user's tenant association
        const { data: tenantUsers, error: tenantError } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (tenantError) {
          console.error('Error fetching tenant association:', tenantError);
        } else if (tenantUsers && tenantUsers.length > 0) {
          // User has tenant association
          tenantId = tenantUsers[0].tenant_id;
          console.log('Using user tenant association:', tenantId);
        } else {
          // User not associated with any tenant, try to get a default tenant
          console.log('User not associated with any tenant, looking for default tenant...');
          
          const { data: defaultTenants, error: defaultTenantError } = await supabase
            .from('tenants')
            .select('id')
            .eq('status', 'ACTIVE')
            .limit(1);

          if (defaultTenantError || !defaultTenants || defaultTenants.length === 0) {
            console.error('No active tenants found:', defaultTenantError);
            console.log('Using hardcoded fallback tenant ID...');
            
            // Use a hardcoded tenant ID as last resort
            tenantId = '00000000-0000-0000-0000-000000000001';
            console.log('Using hardcoded fallback tenant:', tenantId);
          } else {
            tenantId = defaultTenants[0].id;
            console.log('Using default tenant:', tenantId);
          }

          // Optionally, associate the user with this tenant
          const { error: associateError } = await supabase
            .from('tenant_users')
            .insert({
              tenant_id: tenantId,
              user_id: user.id,
              role: 'staff',
              permissions: [],
              is_active: true
            });

          if (associateError) {
            console.warn('Could not associate user with tenant:', associateError);
            // Continue anyway with the tenant ID
          } else {
            console.log('User associated with default tenant');
          }
        }
      } else {
        console.log('No user ID available, using fallback tenant');
      }
      
      // Create employee data for database insertion
      const employeeData = {
        id: crypto.randomUUID(),
        employee_id: employeeId,
        tenant_id: tenantId, // Add the tenant_id field
        first_name: onboardingData.first_name,
        last_name: onboardingData.last_name,
        middle_name: onboardingData.middle_name || null,
        email: onboardingData.email,
        phone_number: onboardingData.phone,
        alternative_phone: onboardingData.alternative_phone || null,
        national_id: onboardingData.national_id,
        date_of_birth: onboardingData.date_of_birth,
        gender: onboardingData.gender || 'other', // Default to 'other' if not selected
        marital_status: onboardingData.marital_status || 'single', // Default to 'single' if not selected
        nationality: onboardingData.nationality || 'Tanzanian',
        residential_address: onboardingData.residential_address,
        postal_address: onboardingData.postal_address || null,
        region: onboardingData.region || null,
        district: onboardingData.district || null,
        ward: onboardingData.ward || null,
        emergency_contact_name: onboardingData.emergency_contact_name || null,
        emergency_contact_phone: onboardingData.emergency_contact_phone || null,
        emergency_contact_relationship: onboardingData.emergency_contact_relationship || null,
        emergency_contact_address: onboardingData.emergency_contact_address || null,
        position: onboardingData.position,
        department: onboardingData.department,
        employment_type: onboardingData.employment_type,
        employment_status: 'active' as const,
        hire_date: onboardingData.hire_date,
        probation_end_date: onboardingData.probation_end_date || null,
        contract_start_date: onboardingData.contract_start_date || null,
        contract_end_date: onboardingData.contract_end_date || null,
        basic_salary: parseFloat(onboardingData.basic_salary) || 0,
        allowances: parseFloat(onboardingData.allowances) || null,
        currency: onboardingData.currency || 'TZS',
        bank_name: onboardingData.bank_name || null,
        bank_account: onboardingData.bank_account || null,
        bank_branch: onboardingData.bank_branch || null,
        nssf_number: onboardingData.nssf_number || null,
        paye_number: onboardingData.paye_number || null,
        tin_number: onboardingData.tin_number || null,
        highest_qualification: onboardingData.highest_qualification || null,
        institution: onboardingData.institution || null,
        graduation_year: onboardingData.graduation_year ? parseInt(onboardingData.graduation_year) : null,
        field_of_study: onboardingData.field_of_study || null,
        previous_employer: onboardingData.previous_employer || null,
        previous_position: onboardingData.previous_position || null,
        previous_salary: onboardingData.previous_salary ? parseFloat(onboardingData.previous_salary) : null,
        years_of_experience: onboardingData.years_of_experience ? parseInt(onboardingData.years_of_experience) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
        updated_by: user?.id || null,
        user_id: null // Will be set when user account is created separately
      };
      
      // Insert employee into database with retry logic for duplicate key errors
      let insertError;
      let retryCount = 0;
      const maxRetries = 3;
      
      console.log('Attempting to insert employee with ID:', employeeData.employee_id);
      
      do {
        insertError = null;
        
        try {
          const { data, error } = await supabase
            .from('employees')
            .insert([employeeData])
            .select();

          if (error) {
            console.error('Database insert error:', error);
            console.error('Employee data being inserted:', employeeData);
            
            // Check for specific error types
            if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
              // Duplicate key error - regenerate employee ID and retry
              if (retryCount < maxRetries) {
                console.log(`Duplicate employee ID detected (${employeeData.employee_id}), regenerating... (attempt ${retryCount + 1})`);
                employeeData.employee_id = await generateEmployeeId();
                console.log('New employee ID generated:', employeeData.employee_id);
                retryCount++;
                continue;
              } else {
                throw new Error(`Failed to generate unique employee ID after ${maxRetries} attempts. Last attempted ID: ${employeeData.employee_id}`);
              }
            } else if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
              throw new Error(`Permission denied: ${error.message}. Please check your database permissions.`);
            } else {
              throw new Error(`Database error (${error.code}): ${error.message}`);
            }
          } else {
            console.log('Employee created successfully:', data);
            
            // Add employee to payroll system
            try {
              const payrollData = {
                id: employeeData.id,
                employee_id: employeeData.employee_id,
                first_name: employeeData.first_name,
                last_name: employeeData.last_name,
                basic_salary: employeeData.basic_salary,
                housing_allowance: 0, // Default values, can be updated later
                transport_allowance: 0,
                other_allowance: employeeData.allowances || 0,
                currency: employeeData.currency || 'TZS',
                tenant_id: tenantId
              };

              const payrollResult = await PayrollEmployeeService.addEmployeeToPayroll(payrollData);
              
              if (payrollResult.success) {
                console.log('✅ Employee added to payroll system successfully');
              } else {
                console.warn('⚠️ Employee created but failed to add to payroll:', payrollResult.error);
              }
            } catch (payrollError) {
              console.warn('⚠️ Employee created but failed to add to payroll:', payrollError);
            }
          }
        } catch (err) {
          console.error('Insert attempt failed:', err);
          insertError = err;
        }
      } while (insertError && retryCount < maxRetries);

      if (insertError) {
        throw insertError;
      }
      
      // Reset form
      resetOnboarding();
      
      setOnboardingStep(1);
      setShowOnboardingModal(false);
      setOnboardingErrors({});
      
      // Refresh employees list
      refetchEmployees();
      
      toast.success('Employee created successfully!');
    } catch (error) {
      handleError(error, 'Employee Creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOnboarding = () => {
    setOnboardingData({
      first_name: '',
      last_name: '',
      middle_name: '',
      email: '',
      phone: '',
      alternative_phone: '',
      national_id: '',
      date_of_birth: '',
      gender: '',
      marital_status: '',
      nationality: 'Tanzanian',
      residential_address: '',
      postal_address: '',
      region: '',
      district: '',
      ward: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      emergency_contact_address: '',
      position: '',
      department: '',
      employment_type: 'permanent',
      hire_date: '',
      probation_end_date: '',
      contract_start_date: '',
      contract_end_date: '',
      basic_salary: '',
      allowances: '',
      currency: 'TZS',
      bank_name: '',
      bank_account: '',
      bank_branch: '',
      nssf_number: '',
      paye_number: '',
      tin_number: '',
      highest_qualification: '',
      institution: '',
      graduation_year: '',
      field_of_study: '',
      previous_employer: '',
      previous_position: '',
      previous_salary: '',
      years_of_experience: '',
      // KYC & Security Information
      passport_number: '',
      passport_expiry: '',
      driving_license: '',
      voter_id: '',
      birth_certificate: '',
      next_of_kin_name: '',
      next_of_kin_phone: '',
      next_of_kin_relationship: '',
      next_of_kin_address: '',
      next_of_kin_id: '',
      
      // Financial Information & Risk Assessment
      bank_name_2: '',
      bank_account_2: '',
      bank_name_3: '',
      bank_account_3: '',
      credit_score: '',
      existing_loans: '',
      loan_amount: '',
      monthly_income: '',
      monthly_expenses: '',
      assets: '',
      liabilities: '',
      financial_obligations: '',
      
      // Security & Access Control
      security_clearance_level: 'basic',
      access_level: 'standard',
      system_permissions: [],
      biometric_data: '',
      security_questions: {
        question1: '',
        answer1: '',
        question2: '',
        answer2: '',
        question3: '',
        answer3: ''
      },
      
      // Background Check & Verification
      criminal_record: 'none',
      credit_check: 'pending',
      reference_check: 'pending',
      employment_verification: 'pending',
      education_verification: 'pending',
      identity_verification: 'pending',
      
      // Compliance & Regulatory
      aml_check: 'pending',
      pep_check: 'pending',
      sanctions_check: 'pending',
      risk_rating: 'low',
      
      // Documents
      documents: [],
      kyc_documents: [],
      identity_documents: [],
      financial_documents: [],
      security_documents: [],
      compliance_documents: [],
      
      // Required Documents
      passport_photo: null,
      id_copy: null,
      academic_papers: [],
      ward_rep_introduction: null,
      certificate_of_good_conduct: null,
      fingerprints: null,
      
      // Enhanced Staff Data - Geographic Assignment (MSP2_10)
      assignedBranch: '',
      workRegion: '',
      regionCode: '',
      
      // Role Classification
      staffCategory: 'Support' as 'Management' | 'Credit Officers' | 'Operations' | 'Support',
      regulatoryRole: '',
      
      // Performance Metrics
      clientsManaged: 0,
      loansManaged: 0,
      portfolioValue: 0,
      
      // Compliance
      trainingStatus: [] as string[],
      certifications: [] as string[],
      lastPerformanceReview: ''
    });
    setOnboardingStep(1);
    setOnboardingErrors({});
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-3xl font-bold text-green-600">{activeEmployees}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Leave Requests</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingLeaveRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
              <p className="text-3xl font-bold text-purple-600">{todayAttendanceCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payroll Management</h3>
              <p className="text-sm text-gray-600 mb-4">Process employee payroll and manage salary calculations</p>
              <button 
                onClick={() => navigate('/staff/payroll')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Manage Payroll
              </button>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Records</h3>
              <p className="text-sm text-gray-600 mb-4">View and manage employee information and records</p>
              <button 
                onClick={() => setActiveTab('employees')}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                View Records
              </button>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Tracking</h3>
              <p className="text-sm text-gray-600 mb-4">Monitor employee attendance and time tracking</p>
              <button 
                onClick={() => setActiveTab('attendance')}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                Track Attendance
              </button>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Requests</h3>
          <div className="space-y-3">
            {leaveRequests?.slice(0, 5).map((leave: LeaveRequest) => (
              <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {employees?.find((emp: Employee) => emp.id === leave.employee_id)?.first_name} {employees?.find((emp: Employee) => emp.id === leave.employee_id)?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{leave.leave_type} - {leave.days_requested} days</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                  leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Hires</h3>
          <div className="space-y-3">
            {employees?.slice(0, 5).map((employee: any) => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{employee.first_name || 'Unknown'} {employee.last_name || 'User'}</p>
                  <p className="text-sm text-gray-600">{employee.position || 'Staff Member'} - {employee.department || 'General'}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeographicDistribution = () => {
    // Group employees by region and branch
    const regionStats = employees?.reduce((acc: any, emp: any) => {
      const region = emp.workRegion || 'Unassigned';
      const branch = emp.assignedBranch || 'Unassigned';
      
      if (!acc[region]) {
        acc[region] = {
          total: 0,
          branches: {},
          categories: { Management: 0, 'Credit Officers': 0, Operations: 0, Support: 0 },
          totalClients: 0,
          totalLoans: 0,
          totalPortfolio: 0
        };
      }
      
      if (!acc[region].branches[branch]) {
        acc[region].branches[branch] = 0;
      }
      
      acc[region].total++;
      acc[region].branches[branch]++;
      acc[region].categories[emp.staffCategory || 'Support']++;
      acc[region].totalClients += emp.clientsManaged || 0;
      acc[region].totalLoans += emp.loansManaged || 0;
      acc[region].totalPortfolio += emp.portfolioValue || 0;
      
      return acc;
    }, {}) || {};

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Geographic Distribution</h2>
            <p className="text-gray-600">Staff distribution across branches and regions (MSP2_10)</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Regions</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(regionStats).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(employees?.map((emp: any) => emp.assignedBranch).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {roundCurrency(employees?.reduce((sum: number, emp: any) => sum + (emp.portfolioValue || 0), 0) || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Region Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Regional Distribution</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(regionStats).map(([region, stats]: [string, any]) => (
                  <tr key={region} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {region.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{region}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {stats.total} staff
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {Object.entries(stats.branches).map(([branch, count]: [string, any]) => (
                          <div key={branch} className="text-xs">
                            {branch}: {count}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {Object.entries(stats.categories).map(([category, count]: [string, any]) => (
                          <div key={category} className="text-xs">
                            {category}: {count}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="text-xs">Clients: {stats.totalClients}</div>
                        <div className="text-xs">Loans: {stats.totalLoans}</div>
                        <div className="text-xs">Portfolio: TZS {roundCurrency(stats.totalPortfolio).toLocaleString()}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(regionStats).map(([region, stats]: [string, any]) => (
              <div key={region} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{region}</h4>
                <div className="space-y-2">
                  {Object.entries(stats.branches).map(([branch, count]: [string, any]) => (
                    <div key={branch} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{branch}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeRecords = () => (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Records</h2>
          <p className="text-gray-600">Manage your organization's employees</p>
        </div>
        <button
          onClick={() => {
            resetOnboarding();
            clearErrors();
            setShowOnboardingModal(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-lg"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add New Employee
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{activeEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees?.filter((emp: any) => {
                  const hireDate = new Date(emp.created_at || emp.hire_date || '');
                  const now = new Date();
                  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  return hireDate >= thisMonth;
                }).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="resigned">Resigned</option>
            </select>
          </div>
          
          {/* Enhanced Geographic and Category Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Branches</option>
              {Array.from(new Set(employees?.map((emp: any) => emp.assignedBranch).filter(Boolean))).map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Regions</option>
              {Array.from(new Set(employees?.map((emp: any) => emp.workRegion).filter(Boolean))).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Management">Management</option>
              <option value="Credit Officers">Credit Officers</option>
              <option value="Operations">Operations</option>
              <option value="Support">Support</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDepartment('');
                setFilterStatus('');
                setFilterBranch('');
                setFilterRegion('');
                setFilterCategory('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header with Bulk Actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
              </span>
              {filteredEmployees.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    Export
                  </button>
                  <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    Bulk Actions
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => refetchEmployees()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch/Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee: any) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.first_name?.[0] || 'U'}{employee.last_name?.[0] || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name || 'Unknown'} {employee.last_name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.position || 'Staff Member'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.department || 'General'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{employee.assignedBranch || 'Not Assigned'}</span>
                      <span className="text-xs text-gray-500">{employee.workRegion || 'No Region'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-1">
                        {employee.staffCategory || 'Support'}
                      </span>
                      <span className="text-xs text-gray-500">{employee.regulatoryRole || 'No Role'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="text-xs">Clients: {employee.clientsManaged || 0}</span>
                      <span className="text-xs">Loans: {employee.loansManaged || 0}</span>
                      <span className="text-xs">Portfolio: {employee.portfolioValue ? `TZS ${roundCurrency(employee.portfolioValue).toLocaleString()}` : 'TZS 0'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.employment_status === 'active' ? 'bg-green-100 text-green-800' :
                      employee.employment_status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      employee.employment_status === 'terminated' ? 'bg-red-100 text-red-800' :
                      employee.employment_status === 'resigned' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.employment_status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="Edit employee"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveEmployee(employee)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Archive employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterDepartment || filterStatus 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first employee.'
            }
          </p>
          {!searchTerm && !filterDepartment && !filterStatus && (
            <button
              onClick={() => {
                resetOnboarding();
                clearErrors();
                setShowOnboardingModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add First Employee
            </button>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => {
          resetOnboarding();
          clearErrors();
          setShowOnboardingModal(true);
        }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Add New Employee"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );

  const renderOnboarding = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Onboarding Process</h3>
        <p className="text-gray-600 mb-6">
          Complete onboarding process for new employees in compliance with Tanzania Labour Act
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">1. Documentation</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Collect required documents</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• National ID</li>
              <li>• Academic certificates</li>
              <li>• Previous employment records</li>
              <li>• Medical certificate</li>
              <li>• Bank account details</li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">2. Compliance</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Verify legal compliance</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• NSSF registration</li>
              <li>• PAYE registration</li>
              <li>• Work permit (if applicable)</li>
              <li>• Background check</li>
              <li>• Reference verification</li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">3. Integration</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Complete integration process</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• System access setup</li>
              <li>• Department orientation</li>
              <li>• Policy training</li>
              <li>• Mentor assignment</li>
              <li>• Probation period setup</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              clearErrors();
              setShowOnboardingModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Start New Onboarding
          </button>
        </div>
      </div>
    </div>
  );

  // Clock in/out functions
  const handleClockIn = async () => {
    console.log('Clock In button clicked');
    if (!user?.id) {
      console.error('User not authenticated');
      toast.error('User not authenticated');
      return;
    }

    console.log('Starting clock in process for user:', user.id);
    setAttendanceLoading(true);
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    console.log('Clock in data:', {
      employee_id: user.id,
      date: now.toISOString().split('T')[0],
      time: timeString
    });

    const result = await AttendanceService.clockIn({
      employee_id: user.id,
      time: timeString,
      notes: ''
    });

    console.log('Clock in result:', result);

    if (result.success) {
      toast.success('Successfully clocked in!');
      setTodayAttendance(result.data || null);
      // Refresh attendance records to show real-time updates
      loadAttendanceRecords();
    } else {
      console.error('Clock in failed:', result.error);
      toast.error(result.error || 'Failed to clock in');
    }
    setAttendanceLoading(false);
  };

  const handleClockOut = async () => {
    console.log('Clock Out button clicked');
    if (!user?.id) {
      console.error('User not authenticated');
      toast.error('User not authenticated');
      return;
    }

    console.log('Starting clock out process for user:', user.id);
    setAttendanceLoading(true);
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    console.log('Clock out data:', {
      employee_id: user.id,
      date: now.toISOString().split('T')[0],
      time: timeString
    });

    const result = await AttendanceService.clockOut({
      employee_id: user.id,
      time: timeString,
      notes: ''
    });

    console.log('Clock out result:', result);

    if (result.success) {
      toast.success('Successfully clocked out!');
      setTodayAttendance(result.data || null);
      // Refresh attendance records to show real-time updates
      loadAttendanceRecords();
    } else {
      console.error('Clock out failed:', result.error);
      toast.error(result.error || 'Failed to clock out');
    }
    setAttendanceLoading(false);
  };

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Time & Attendance Management</h3>
          <div className="flex space-x-3">
            <button 
              onClick={loadAttendanceRecords}
              disabled={attendanceRecordsLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${attendanceRecordsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button 
              onClick={async () => {
                if (user?.id) {
                  const result = await AttendanceService.createTestRecord();
                  if (result.success) {
                    toast.success('Test record created successfully!');
                    await loadAttendanceRecords();
                  } else {
                    toast.error('Failed to create test record: ' + result.error);
                  }
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mr-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Test Record
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </button>
          </div>
        </div>

        {/* Quick Clock In/Out Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-md font-semibold text-blue-900 mb-3">Quick Clock In/Out</h4>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="text-sm text-blue-700 mb-1">Current Status</div>
              {todayAttendance ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {todayAttendance.check_in ? 'Clocked In' : 'Not Clocked In'}
                  </span>
                  {todayAttendance.check_in && (
                    <span className="text-xs text-blue-600">
                      at {new Date(`2000-01-01T${todayAttendance.check_in}`).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-blue-600">No attendance record for today</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleClockIn}
                disabled={todayAttendance?.check_in || attendanceLoading}
                className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                  !todayAttendance?.check_in
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Clock In
              </button>
              <button
                onClick={handleClockOut}
                disabled={!todayAttendance || !todayAttendance.check_in || todayAttendance.check_out || attendanceLoading}
                className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                  todayAttendance?.check_in && !todayAttendance?.check_out
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Clock Out
              </button>
            </div>
            {attendanceLoading && (
              <div className="flex items-center text-blue-600">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Present Today</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{todayAttendanceCount}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">Absent Today</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{activeEmployees - todayAttendanceCount}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">Late Today</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">0</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecordsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Loading attendance records...
                    </div>
                  </td>
                </tr>
              ) : attendanceRecords?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found. Clock in to create your first record!
                  </td>
                </tr>
              ) : (
                attendanceRecords?.slice(0, 10).map((record: AttendanceRecord) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employees?.find((emp: any) => emp.id === record.employee_id)?.first_name || 'Unknown'} {employees?.find((emp: any) => emp.id === record.employee_id)?.last_name || 'User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.check_in}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.check_out || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.hours_worked}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'absent' ? 'bg-red-100 text-red-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLeaveManagement = () => (
    <LeaveManagementComponent />
  );

  const renderDocuments = () => (
    <DocumentManagementComponent />
  );

  const renderOffboarding = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Offboarding Process</h3>
        <p className="text-gray-600 mb-6">
          Complete offboarding process in compliance with Tanzania Labour Act requirements
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <FileCheck className="w-5 h-5 text-red-600" />
              </div>
              <h4 className="font-medium text-gray-900">1. Exit Documentation</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Complete exit formalities</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Exit interview</li>
              <li>• Clearance certificate</li>
              <li>• Final salary calculation</li>
              <li>• NSSF/PAYE finalization</li>
              <li>• Return company property</li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <h4 className="font-medium text-gray-900">2. Legal Compliance</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Ensure legal requirements</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Notice period compliance</li>
              <li>• Severance pay calculation</li>
              <li>• Leave balance settlement</li>
              <li>• Tax clearance</li>
              <li>• Reference letter issuance</li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <UserX className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">3. System Cleanup</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Complete system cleanup</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Deactivate system access</li>
              <li>• Update employee status</li>
              <li>• Archive records</li>
              <li>• Notify relevant departments</li>
              <li>• Update organizational chart</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Management Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-gray-900">Employee Directory</h4>
            </div>
            <p className="text-sm text-gray-600">Complete employee listing with contact details</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-gray-900">Attendance Report</h4>
            </div>
            <p className="text-sm text-gray-600">Monthly attendance summary and analysis</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-gray-900">Leave Report</h4>
            </div>
            <p className="text-sm text-gray-600">Leave utilization and balance report</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <Award className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-gray-900">Performance Report</h4>
            </div>
            <p className="text-sm text-gray-600">Employee performance and appraisal summary</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <Building className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-medium text-gray-900">Department Report</h4>
            </div>
            <p className="text-sm text-gray-600">Department-wise employee distribution</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="font-medium text-gray-900">Compliance Report</h4>
            </div>
            <p className="text-sm text-gray-600">Tanzania Labour Act compliance status</p>
          </button>
        </div>
      </div>
    </div>
  );

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Staff Management...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <XCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access Staff Management.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
          <p className="text-blue-100">
            Comprehensive staff management system compliant with Tanzania Labour Act
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'employees' && renderEmployeeRecords()}
            {activeTab === 'geographic' && renderGeographicDistribution()}
            {activeTab === 'onboarding' && renderOnboarding()}
            {activeTab === 'attendance' && renderAttendance()}
            {activeTab === 'leave' && renderLeaveManagement()}
            {activeTab === 'documents' && renderDocuments()}
            {activeTab === 'offboarding' && renderOffboarding()}
            {activeTab === 'reports' && renderReports()}
          </div>
        </div>

        {/* Onboarding Modal */}
        {showOnboardingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Employee Onboarding</h2>
                    <p className="text-blue-100">Step {onboardingStep} of 4</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowOnboardingModal(false);
                      resetOnboarding();
                    }}
                    className="text-blue-200 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 h-2 rounded-full ${
                          step <= onboardingStep ? 'bg-blue-300' : 'bg-blue-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>Personal Info</span>
                    <span>Employment</span>
                    <span>Documents & Photo</span>
                    <span>Review</span>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {onboardingStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information & Identity</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={onboardingData.first_name}
                          onChange={(e) => handleOnboardingInputChange('first_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.first_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter first name"
                        />
                        {onboardingErrors.first_name && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.first_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={onboardingData.last_name}
                          onChange={(e) => handleOnboardingInputChange('last_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.last_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter last name"
                        />
                        {onboardingErrors.last_name && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.last_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                        <input
                          type="text"
                          value={onboardingData.middle_name}
                          onChange={(e) => handleOnboardingInputChange('middle_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter middle name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={onboardingData.email}
                          onChange={(e) => handleOnboardingInputChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {onboardingErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={onboardingData.phone}
                          onChange={(e) => handleOnboardingInputChange('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+255 712 345 678"
                        />
                        {onboardingErrors.phone && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Phone</label>
                        <input
                          type="tel"
                          value={onboardingData.alternative_phone}
                          onChange={(e) => handleOnboardingInputChange('alternative_phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+255 712 345 679"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">National ID *</label>
                        <input
                          type="text"
                          value={onboardingData.national_id}
                          onChange={(e) => handleOnboardingInputChange('national_id', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.national_id ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="1234567890123456"
                        />
                        {onboardingErrors.national_id && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.national_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                        <input
                          type="text"
                          value={onboardingData.passport_number}
                          onChange={(e) => handleOnboardingInputChange('passport_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="A1234567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                        <input
                          type="date"
                          value={onboardingData.passport_expiry}
                          onChange={(e) => handleOnboardingInputChange('passport_expiry', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driving License</label>
                        <input
                          type="text"
                          value={onboardingData.driving_license}
                          onChange={(e) => handleOnboardingInputChange('driving_license', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="DL123456789"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voter ID</label>
                        <input
                          type="text"
                          value={onboardingData.voter_id}
                          onChange={(e) => handleOnboardingInputChange('voter_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="V123456789"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Birth Certificate Number</label>
                        <input
                          type="text"
                          value={onboardingData.birth_certificate}
                          onChange={(e) => handleOnboardingInputChange('birth_certificate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="BC123456789"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          value={onboardingData.date_of_birth}
                          onChange={(e) => handleOnboardingInputChange('date_of_birth', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {onboardingErrors.date_of_birth && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.date_of_birth}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                        <select
                          value={onboardingData.gender}
                          onChange={(e) => handleOnboardingInputChange('gender', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.gender ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {onboardingErrors.gender && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.gender}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status *</label>
                        <select
                          required
                          value={onboardingData.marital_status}
                          onChange={(e) => handleOnboardingInputChange('marital_status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select status</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                        {onboardingErrors.marital_status && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.marital_status}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address</label>
                      <textarea
                        value={onboardingData.residential_address}
                        onChange={(e) => handleOnboardingInputChange('residential_address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter full residential address"
                      />
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                        <input
                          type="text"
                          value={onboardingData.position}
                          onChange={(e) => handleOnboardingInputChange('position', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.position ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g., Senior Loan Officer"
                        />
                        {onboardingErrors.position && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.position}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                        <select
                          value={onboardingData.department}
                          onChange={(e) => handleOnboardingInputChange('department', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.department ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        {onboardingErrors.department && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.department}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                        <select
                          value={onboardingData.employment_type}
                          onChange={(e) => handleOnboardingInputChange('employment_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="permanent">Permanent</option>
                          <option value="contract">Contract</option>
                          <option value="temporary">Temporary</option>
                          <option value="intern">Intern</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                        <input
                          type="date"
                          value={onboardingData.hire_date}
                          onChange={(e) => handleOnboardingInputChange('hire_date', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.hire_date ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {onboardingErrors.hire_date && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.hire_date}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (TZS) *</label>
                        <input
                          type="number"
                          value={onboardingData.basic_salary}
                          onChange={(e) => handleOnboardingInputChange('basic_salary', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            onboardingErrors.basic_salary ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="2500000"
                        />
                        {onboardingErrors.basic_salary && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.basic_salary}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (TZS)</label>
                        <input
                          type="number"
                          value={onboardingData.allowances}
                          onChange={(e) => handleOnboardingInputChange('allowances', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="500000"
                        />
                      </div>
                    </div>
                    
                    {/* Enhanced Staff Data - Geographic Assignment */}
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Geographic Assignment (MSP2_10)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Branch *</label>
                          <input
                            type="text"
                            value={onboardingData.assignedBranch}
                            onChange={(e) => handleOnboardingInputChange('assignedBranch', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              onboardingErrors.assignedBranch ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Dar es Salaam Main Branch"
                          />
                          {onboardingErrors.assignedBranch && (
                            <p className="text-red-500 text-xs mt-1">{onboardingErrors.assignedBranch}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Work Region *</label>
                          <select
                            value={onboardingData.workRegion}
                            onChange={(e) => handleOnboardingInputChange('workRegion', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              onboardingErrors.workRegion ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select region</option>
                            <optgroup label="Tanzania Mainland">
                              {tanzaniaRegions['Tanzania Mainland'].map((region) => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Zanzibar">
                              {tanzaniaRegions['Zanzibar'].map((region) => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </optgroup>
                          </select>
                          {onboardingErrors.workRegion && (
                            <p className="text-red-500 text-xs mt-1">{onboardingErrors.workRegion}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Region Code *</label>
                          <input
                            type="text"
                            value={onboardingData.regionCode}
                            onChange={(e) => handleOnboardingInputChange('regionCode', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              onboardingErrors.regionCode ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., DSM-001"
                          />
                          {onboardingErrors.regionCode && (
                            <p className="text-red-500 text-xs mt-1">{onboardingErrors.regionCode}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Role Classification */}
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Role Classification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Staff Category *</label>
                          <select
                            value={onboardingData.staffCategory}
                            onChange={(e) => handleOnboardingInputChange('staffCategory', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              onboardingErrors.staffCategory ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select category</option>
                            <option value="Management">Management</option>
                            <option value="Credit Officers">Credit Officers</option>
                            <option value="Operations">Operations</option>
                            <option value="Support">Support</option>
                          </select>
                          {onboardingErrors.staffCategory && (
                            <p className="text-red-500 text-xs mt-1">{onboardingErrors.staffCategory}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Role *</label>
                          <input
                            type="text"
                            value={onboardingData.regulatoryRole}
                            onChange={(e) => handleOnboardingInputChange('regulatoryRole', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              onboardingErrors.regulatoryRole ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Senior Credit Officer"
                          />
                          {onboardingErrors.regulatoryRole && (
                            <p className="text-red-500 text-xs mt-1">{onboardingErrors.regulatoryRole}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Performance Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Clients Managed</label>
                          <input
                            type="number"
                            value={onboardingData.clientsManaged}
                            onChange={(e) => handleOnboardingInputChange('clientsManaged', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loans Managed</label>
                          <input
                            type="number"
                            value={onboardingData.loansManaged}
                            onChange={(e) => handleOnboardingInputChange('loansManaged', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Value (TZS)</label>
                          <input
                            type="number"
                            value={onboardingData.portfolioValue}
                            onChange={(e) => handleOnboardingInputChange('portfolioValue', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Compliance */}
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Compliance & Training</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Training Status (comma-separated)</label>
                          <input
                            type="text"
                            value={onboardingData.trainingStatus.join(', ')}
                            onChange={(e) => handleOnboardingInputChange('trainingStatus', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., AML Training, Credit Assessment, Risk Management"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Certifications (comma-separated)</label>
                          <input
                            type="text"
                            value={onboardingData.certifications.join(', ')}
                            onChange={(e) => handleOnboardingInputChange('certifications', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., CPA, CFA, Banking Certificate"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Performance Review</label>
                          <input
                            type="date"
                            value={onboardingData.lastPerformanceReview}
                            onChange={(e) => handleOnboardingInputChange('lastPerformanceReview', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={onboardingData.bank_name}
                          onChange={(e) => handleOnboardingInputChange('bank_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., CRDB Bank"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                        <input
                          type="text"
                          value={onboardingData.bank_account}
                          onChange={(e) => handleOnboardingInputChange('bank_account', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1234567890"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents & Photo</h3>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <FileCheck className="w-5 h-5 text-red-600 mr-2" />
                        <h4 className="font-medium text-red-800">Mandatory Documents Required</h4>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        All documents marked with * are mandatory for employee onboarding
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Passport Photo */}
                      <div className="md:col-span-2">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Passport Size Photo *</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {onboardingData.passport_photo ? (
                            <div className="space-y-4">
                              <div className="mx-auto w-32 h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                <img 
                                  src={URL.createObjectURL(onboardingData.passport_photo)} 
                                  alt="Passport Photo" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => setOnboardingData(prev => ({ ...prev, passport_photo: null }))}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                >
                                  Remove Photo
                                </button>
                                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                                  Change Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setOnboardingData(prev => ({ ...prev, passport_photo: file }));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="mx-auto w-32 h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="text-center">
                                  <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">No Photo</p>
                                </div>
                              </div>
                              <label className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                                Upload Passport Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setOnboardingData(prev => ({ ...prev, passport_photo: file }));
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-xs text-gray-500 mt-2">
                                JPG, PNG (Max 5MB) - Passport size (35x45mm)
                              </p>
                            </div>
                          )}
                        </div>
                        {onboardingErrors.passport_photo && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.passport_photo}</p>
                        )}
                      </div>

                      {/* ID Copy */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">National ID Copy *</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {onboardingData.id_copy ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center">
                                <FileText className="w-8 h-8 text-green-600 mr-2" />
                                <span className="text-sm text-gray-700">{onboardingData.id_copy.name}</span>
                              </div>
                              <button
                                onClick={() => setOnboardingData(prev => ({ ...prev, id_copy: null }))}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                                Upload ID Copy
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setOnboardingData(prev => ({ ...prev, id_copy: file }));
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {onboardingErrors.id_copy && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.id_copy}</p>
                        )}
                      </div>

                      {/* Academic Papers */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Academic Papers *</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                            Upload Academic Papers
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setOnboardingData(prev => ({ 
                                  ...prev, 
                                  academic_papers: [...prev.academic_papers, ...files] 
                                }));
                              }}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">Certificates, Diplomas, Degrees</p>
                          {onboardingData.academic_papers.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {onboardingData.academic_papers.map((file, index) => (
                                <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                  <span className="truncate">{file.name}</span>
                                  <button
                                    onClick={() => setOnboardingData(prev => ({
                                      ...prev,
                                      academic_papers: prev.academic_papers.filter((_, i) => i !== index)
                                    }))}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {onboardingErrors.academic_papers && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.academic_papers}</p>
                        )}
                      </div>

                      {/* Ward Rep Introduction Letter */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Ward Rep Introduction Letter *</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {onboardingData.ward_rep_introduction ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center">
                                <FileText className="w-8 h-8 text-green-600 mr-2" />
                                <span className="text-sm text-gray-700">{onboardingData.ward_rep_introduction.name}</span>
                              </div>
                              <button
                                onClick={() => setOnboardingData(prev => ({ ...prev, ward_rep_introduction: null }))}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                                Upload Letter
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setOnboardingData(prev => ({ ...prev, ward_rep_introduction: file }));
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {onboardingErrors.ward_rep_introduction && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.ward_rep_introduction}</p>
                        )}
                      </div>

                      {/* Certificate of Good Conduct */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Certificate of Good Conduct *</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {onboardingData.certificate_of_good_conduct ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center">
                                <FileText className="w-8 h-8 text-green-600 mr-2" />
                                <span className="text-sm text-gray-700">{onboardingData.certificate_of_good_conduct.name}</span>
                              </div>
                              <button
                                onClick={() => setOnboardingData(prev => ({ ...prev, certificate_of_good_conduct: null }))}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                                Upload Certificate
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setOnboardingData(prev => ({ ...prev, certificate_of_good_conduct: file }));
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {onboardingErrors.certificate_of_good_conduct && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.certificate_of_good_conduct}</p>
                        )}
                      </div>

                      {/* Fingerprints */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Fingerprints *</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {onboardingData.fingerprints ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center">
                                <FileText className="w-8 h-8 text-green-600 mr-2" />
                                <span className="text-sm text-gray-700">{onboardingData.fingerprints.name}</span>
                              </div>
                              <button
                                onClick={() => setOnboardingData(prev => ({ ...prev, fingerprints: null }))}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                                Upload Fingerprints
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setOnboardingData(prev => ({ ...prev, fingerprints: file }));
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {onboardingErrors.fingerprints && (
                          <p className="text-red-500 text-xs mt-1">{onboardingErrors.fingerprints}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {onboardingStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Employee Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Name:</span> {onboardingData.first_name} {onboardingData.last_name}</p>
                          <p><span className="font-medium">Email:</span> {onboardingData.email}</p>
                          <p><span className="font-medium">Phone:</span> {onboardingData.phone}</p>
                          <p><span className="font-medium">Position:</span> {onboardingData.position}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Department:</span> {onboardingData.department}</p>
                          <p><span className="font-medium">Employment Type:</span> {onboardingData.employment_type}</p>
                          <p><span className="font-medium">Hire Date:</span> {onboardingData.hire_date}</p>
                          <p><span className="font-medium">Salary:</span> TZS {onboardingData.basic_salary}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-blue-900">Ready to Onboard</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            All required information has been provided. Click "Complete Onboarding" to create the employee record.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="px-6 py-4">
                  <div className={`rounded-lg p-4 border ${
                    errorType === 'validation' ? 'bg-yellow-50 border-yellow-200' :
                    errorType === 'network' ? 'bg-orange-50 border-orange-200' :
                    errorType === 'database' ? 'bg-red-50 border-red-200' :
                    errorType === 'permission' ? 'bg-purple-50 border-purple-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {errorType === 'validation' ? (
                          <XCircle className="w-5 h-5 text-yellow-600" />
                        ) : errorType === 'network' ? (
                          <RefreshCw className="w-5 h-5 text-orange-600" />
                        ) : errorType === 'database' ? (
                          <Database className="w-5 h-5 text-red-600" />
                        ) : errorType === 'permission' ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className={`text-sm font-medium ${
                          errorType === 'validation' ? 'text-yellow-800' :
                          errorType === 'network' ? 'text-orange-800' :
                          errorType === 'database' ? 'text-red-800' :
                          errorType === 'permission' ? 'text-purple-800' :
                          'text-red-800'
                        }`}>
                          {errorType === 'validation' ? 'Validation Error' :
                           errorType === 'network' ? 'Network Error' :
                           errorType === 'database' ? 'Database Error' :
                           errorType === 'permission' ? 'Permission Error' :
                           'Error'}
                        </h3>
                        <p className={`mt-1 text-sm ${
                          errorType === 'validation' ? 'text-yellow-700' :
                          errorType === 'network' ? 'text-orange-700' :
                          errorType === 'database' ? 'text-red-700' :
                          errorType === 'permission' ? 'text-purple-700' :
                          'text-red-700'
                        }`}>
                          {submitError}
                        </p>
                        <div className="mt-3 flex space-x-3">
                          {(errorType === 'network' || errorType === 'database') && retryCount < 3 && (
                            <button
                              onClick={handleRetry}
                              disabled={isRetrying}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                errorType === 'network' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                                'bg-red-100 text-red-800 hover:bg-red-200'
                              } disabled:opacity-50`}
                            >
                              {isRetrying ? 'Retrying...' : `Retry (${retryCount}/3)`}
                            </button>
                          )}
                          <button
                            onClick={clearErrors}
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between">
                <div>
                  {onboardingStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowOnboardingModal(false);
                      resetOnboarding();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  
                  {onboardingStep < 4 ? (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitOnboarding}
                      disabled={isSubmitting || isRetrying}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center transition-all duration-200"
                    >
                      {isSubmitting || isRetrying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isRetrying ? `Retrying... (${retryCount}/3)` : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Complete Onboarding
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee View Modal */}
        {showEmployeeModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Employee Details</h2>
                    <p className="text-blue-100">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                  </div>
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="text-white hover:text-blue-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Name:</span> {selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                      <div><span className="font-medium">Email:</span> {selectedEmployee.email}</div>
                      <div><span className="font-medium">Phone:</span> {selectedEmployee.phone || 'N/A'}</div>
                      <div><span className="font-medium">National ID:</span> {selectedEmployee.national_id || 'N/A'}</div>
                      <div><span className="font-medium">Date of Birth:</span> {selectedEmployee.date_of_birth || 'N/A'}</div>
                      <div><span className="font-medium">Gender:</span> {selectedEmployee.gender || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Employment Information</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Position:</span> {selectedEmployee.position || 'N/A'}</div>
                      <div><span className="font-medium">Department:</span> {selectedEmployee.department || 'N/A'}</div>
                      <div><span className="font-medium">Employment Type:</span> {selectedEmployee.employment_type || 'N/A'}</div>
                      <div><span className="font-medium">Status:</span> {selectedEmployee.employment_status || 'N/A'}</div>
                      <div><span className="font-medium">Hire Date:</span> {selectedEmployee.hire_date || 'N/A'}</div>
                      <div><span className="font-medium">Basic Salary:</span> {selectedEmployee.basic_salary ? `TZS ${selectedEmployee.basic_salary.toLocaleString()}` : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Geographic Assignment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Geographic Assignment</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Branch:</span> {selectedEmployee.assigned_branch || 'N/A'}</div>
                      <div><span className="font-medium">Region:</span> {selectedEmployee.work_region || 'N/A'}</div>
                      <div><span className="font-medium">Region Code:</span> {selectedEmployee.region_code || 'N/A'}</div>
                      <div><span className="font-medium">Staff Category:</span> {selectedEmployee.staff_category || 'N/A'}</div>
                      <div><span className="font-medium">Regulatory Role:</span> {selectedEmployee.regulatory_role || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Performance Metrics</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Clients Managed:</span> {selectedEmployee.clients_managed || 0}</div>
                      <div><span className="font-medium">Loans Managed:</span> {selectedEmployee.loans_managed || 0}</div>
                      <div><span className="font-medium">Portfolio Value:</span> {selectedEmployee.portfolio_value ? `TZS ${selectedEmployee.portfolio_value.toLocaleString()}` : 'TZS 0'}</div>
                      <div><span className="font-medium">Access Level:</span> {selectedEmployee.access_level || 'N/A'}</div>
                      <div><span className="font-medium">Security Clearance:</span> {selectedEmployee.security_clearance_level || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowEmployeeModal(false);
                    handleEditEmployee(selectedEmployee);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Employee
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Edit Modal */}
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-green-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Edit Employee</h2>
                    <p className="text-green-100">{editingEmployee.first_name} {editingEmployee.last_name}</p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-white hover:text-green-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <form id="edit-employee-form" className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                          name="first_name"
                        defaultValue={editingEmployee.first_name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                          name="last_name"
                        defaultValue={editingEmployee.last_name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                          name="email"
                        defaultValue={editingEmployee.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                          name="phone"
                        defaultValue={editingEmployee.phone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                      <input
                        type="text"
                          name="national_id"
                          defaultValue={editingEmployee.national_id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="date_of_birth"
                          defaultValue={editingEmployee.date_of_birth}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          name="gender"
                          defaultValue={editingEmployee.gender}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                        <select
                          name="marital_status"
                          defaultValue={editingEmployee.marital_status}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                          name="address"
                          defaultValue={editingEmployee.address}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                        <input
                          type="text"
                          name="employee_id"
                          defaultValue={editingEmployee.employee_id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                        <input
                          type="text"
                          name="position"
                        defaultValue={editingEmployee.position}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <select
                          name="department"
                        defaultValue={editingEmployee.department}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                      >
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                      <select
                          name="employment_type"
                          defaultValue={editingEmployee.employment_type}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="permanent">Permanent</option>
                          <option value="contract">Contract</option>
                          <option value="temporary">Temporary</option>
                          <option value="intern">Intern</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
                        <select
                          name="employment_status"
                        defaultValue={editingEmployee.employment_status}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                        <option value="resigned">Resigned</option>
                      </select>
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                        <input
                          type="date"
                          name="hire_date"
                          defaultValue={editingEmployee.hire_date}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (TZS)</label>
                        <input
                          type="number"
                          name="basic_salary"
                          defaultValue={editingEmployee.basic_salary}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                      <select
                          name="access_level"
                        defaultValue={editingEmployee.access_level}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="standard">Standard</option>
                        <option value="elevated">Elevated</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      </div>
                    </div>
                  </div>

                  {/* Geographic Assignment */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Branch</label>
                        <input
                          type="text"
                          name="assignedBranch"
                          defaultValue={editingEmployee.assignedBranch || editingEmployee.assigned_branch}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Region</label>
                        <input
                          type="text"
                          name="workRegion"
                          defaultValue={editingEmployee.workRegion || editingEmployee.work_region}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region Code</label>
                        <input
                          type="text"
                          name="regionCode"
                          defaultValue={editingEmployee.regionCode || editingEmployee.region_code}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Classification */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Classification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Staff Category</label>
                        <select
                          name="staffCategory"
                          defaultValue={editingEmployee.staffCategory || editingEmployee.staff_category}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="Management">Management</option>
                          <option value="Credit Officers">Credit Officers</option>
                          <option value="Operations">Operations</option>
                          <option value="Support">Support</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Role</label>
                        <input
                          type="text"
                          name="regulatoryRole"
                          defaultValue={editingEmployee.regulatoryRole || editingEmployee.regulatory_role}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Clients Managed</label>
                        <input
                          type="number"
                          name="clientsManaged"
                          defaultValue={editingEmployee.clientsManaged || editingEmployee.clients_managed}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loans Managed</label>
                        <input
                          type="number"
                          name="loansManaged"
                          defaultValue={editingEmployee.loansManaged || editingEmployee.loans_managed}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Value (TZS)</label>
                        <input
                          type="number"
                          name="portfolioValue"
                          defaultValue={editingEmployee.portfolioValue || editingEmployee.portfolio_value}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          defaultValue={editingEmployee.emergency_contact_name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          defaultValue={editingEmployee.emergency_contact_phone}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                        <input
                          type="text"
                          name="emergency_contact_relationship"
                          defaultValue={editingEmployee.emergency_contact_relationship}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          name="bank_name"
                          defaultValue={editingEmployee.bank_name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                        <input
                          type="text"
                          name="bank_account"
                          defaultValue={editingEmployee.bank_account}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NSSF Number</label>
                        <input
                          type="text"
                          name="nssf_number"
                          defaultValue={editingEmployee.nssf_number}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PAYE Number</label>
                        <input
                          type="text"
                          name="paye_number"
                          defaultValue={editingEmployee.paye_number}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEmployee}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Employee Modal */}
        {showArchiveModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="bg-red-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Archive Employee</h2>
                    <p className="text-red-100">This action cannot be undone</p>
                  </div>
                  <button
                    onClick={() => setShowArchiveModal(false)}
                    className="text-white hover:text-red-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-red-600">
                      {selectedEmployee.first_name?.[0] || 'U'}{selectedEmployee.last_name?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h3>
                    <p className="text-gray-600">{selectedEmployee.position} • {selectedEmployee.department}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Archiving this employee will:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Change their status to "Terminated"</li>
                          <li>Revoke their system access</li>
                          <li>Preserve their historical data</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600">
                  Are you sure you want to archive <strong>{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>? 
                  This action will terminate their employment and revoke system access.
                </p>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchiveEmployee}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Archive Employee
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffManagement;

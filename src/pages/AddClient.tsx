import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
// Removed useSupabaseInsert import - now using ClientService
import { FileUploadService } from '../services/fileUploadService';
import { tanzaniaLocations, getDistrictsByRegion, getWardsByDistrict } from '../data/tanzaniaLocations';
import { DraftStorage } from '../utils/draftStorage';
import { cleanClientData } from '../utils/dataCleanup';
import { sanitizeUuidFields } from '../utils/uuidSanitizer';
import { ClientService, BaseClient, IndividualClientDetails, CorporateClientDetails, GroupClientDetails } from '../services/clientService';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import RepeatCustomerDetection from '../components/RepeatCustomerDetection';
import {
  ArrowLeft,
  User,
  Building,
  Users,
  Save,
  Upload,
  Camera,
  Fingerprint,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  FileText,
  UserPlus,
  Trash2
} from 'lucide-react';

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // Removed old insertClient hook - now using ClientService
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});
  const [isRepeatCustomer, setIsRepeatCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showRepeatDetection, setShowRepeatDetection] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showLoadDraftConfirm, setShowLoadDraftConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    // Client Type Selection
    client_type: 'individual' as 'individual' | 'corporate' | 'group',
    
    // Personal Information (Individual) - Reordered with National ID first
    national_id_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    phone_number: '',
    email_address: '',
    marital_status: '',
    date_of_birth: '',
    id_type: '',
    tin_number: '',
    
    // Spouse/Relation Information
    spouse_first_name: '',
    spouse_middle_name: '',
    spouse_last_name: '',
    spouse_id_type: '',
    spouse_id_number: '',
    spouse_phone_number: '',
    spouse_monthly_earnings: '',
    relation_type: '',
    
    // Contact Information - Reordered as requested
    region: '',
    district: '',
    ward: '',
    street_name: '',
    house_number: '',
    nearest_landmark: '',
    postal_address: '',
    country: 'Tanzania',
    
    // Employment Information - Employment status first
    employment_status: '',
    occupation: '',
    other_occupation: '',
    employer_name: '',
    employer_address: '',
    monthly_income: '',
    income_source: '',
    
    // Corporate Information
    company_name: '',
    registration_number: '',
    tax_id: '',
    business_type: '',
    industry: '',
    company_size: '',
    established_date: '',
    company_address: '',
    
    // Director/Proprietor Information
    director_first_name: '',
    director_middle_name: '',
    director_last_name: '',
    director_phone_number: '',
    director_email_address: '',
    director_gender: '',
    director_date_of_birth: '',
    director_national_id_number: '',
    director_id_type: '',
    director_tin_number: '',
    
    // Group Information
    group_name: '',
    group_type: '',
    group_size: '',
    group_leader: '',
    group_address: '',
    
    // Group Leadership Details
    // Chairman/MD/CEO Details
    chairman_first_name: '',
    chairman_middle_name: '',
    chairman_last_name: '',
    chairman_phone_number: '',
    chairman_email_address: '',
    chairman_gender: '',
    chairman_date_of_birth: '',
    chairman_national_id_number: '',
    chairman_id_type: '',
    chairman_tin_number: '',
    
    // Secretary Details
    secretary_first_name: '',
    secretary_middle_name: '',
    secretary_last_name: '',
    secretary_phone_number: '',
    secretary_email_address: '',
    secretary_gender: '',
    secretary_date_of_birth: '',
    secretary_national_id_number: '',
    secretary_id_type: '',
    secretary_tin_number: '',
    
    // Treasurer Details
    treasurer_first_name: '',
    treasurer_middle_name: '',
    treasurer_last_name: '',
    treasurer_phone_number: '',
    treasurer_email_address: '',
    treasurer_gender: '',
    treasurer_date_of_birth: '',
    treasurer_national_id_number: '',
    treasurer_id_type: '',
    treasurer_tin_number: '',
    
    // Financial Information - Updated with bank branch
    bank_name: '',
    bank_branch: '',
    account_number: '',
    account_type: '',
    
    // Additional Information
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    referral_source: '',
    notes: '',
    
    // KYC Information
    kyc_status: 'pending',
    risk_level: 'medium',
    compliance_notes: ''
  });

  // Dynamic step titles based on client type
  const getStepTitle = (stepId: number) => {
    const baseSteps = {
      1: { title: 'Client Type', description: 'Select client type and category' },
      2: { title: 'Personal Info', description: 'Basic personal information' },
      3: { title: 'Contact Details', description: 'Address and contact information' },
      4: { title: 'Employment', description: 'Employment and income details' },
      5: { title: 'Financial Info', description: 'Banking and financial information' },
      6: { title: 'Documents', description: 'Upload required documents' },
      7: { title: 'Review', description: 'Review and submit application' }
    };

    // Update step 2 title based on client type
    if (stepId === 2) {
      switch (formData.client_type) {
        case 'individual':
          return { title: 'Personal Information', description: 'Basic personal information' };
        case 'corporate':
          return { title: 'Corporate Information', description: 'Company and director details' };
        case 'group':
          return { title: 'Group Information', description: 'Group and member details' };
        default:
          return baseSteps[stepId];
      }
    }

    // Update step 4 title based on client type
    if (stepId === 4) {
      switch (formData.client_type) {
        case 'individual':
          return { title: 'Employment', description: 'Employment and income details' };
        case 'corporate':
          return { title: 'Business Details', description: 'Company operations and financials' };
        case 'group':
          return { title: 'Group Leadership Structure', description: 'Group organization and leadership' };
        default:
          return baseSteps[stepId];
      }
    }

    return baseSteps[stepId];
  };

  const steps = useMemo(() => [
    getStepTitle(1),
    getStepTitle(2),
    getStepTitle(3),
    getStepTitle(4),
    getStepTitle(5),
    getStepTitle(6),
    getStepTitle(7)
  ], [formData.client_type]);

  // Debug logging
  console.log('Current step:', currentStep);
  console.log('Steps:', steps);

  // Use the comprehensive Tanzania location data
  const tanzaniaRegions = tanzaniaLocations.regions;

  // Tanzania Banks (BOT Regulatory Reports)
  const tanzaniaBanks = [
    'CRDB Bank Plc',
    'NMB Bank Plc',
    'Equity Bank Tanzania Limited',
    'Exim Bank Tanzania Limited',
    'KCB Bank Tanzania Limited',
    'Stanbic Bank Tanzania Limited',
    'TIB Corporate Bank Limited',
    'Tanzania Agricultural Development Bank Limited',
    'Akiba Commercial Bank Plc',
    'Azania Bank Limited',
    'Bank of Africa Tanzania Limited',
    'Bank M Tanzania Limited',
    'Citibank Tanzania Limited',
    'Commercial Bank of Africa Tanzania Limited',
    'DCB Commercial Bank Plc',
    'Diamond Trust Bank Tanzania Limited',
    'Ecobank Tanzania Limited',
    'First National Bank Tanzania Limited',
    'Guaranty Trust Bank Tanzania Limited',
    'Habib African Bank Limited',
    'I&M Bank Tanzania Limited',
    'Maendeleo Bank Plc',
    'Mkombozi Commercial Bank Plc',
    'Mwalimu Commercial Bank Plc',
    'National Bank of Commerce Limited',
    'People\'s Bank of Zanzibar Limited',
    'Postal Bank Limited',
    'Tanzania Investment Bank Limited',
    'TIB Development Bank Limited',
    'Uchumi Commercial Bank Limited',
    'Wakalima Bank Limited'
  ];

  // East Africa Non-Formal Employment Occupations
  const eastAfricaOccupations = [
    'Street Vendor',
    'Motorcycle Taxi (Boda Boda)',
    'Tuk Tuk Driver',
    'Market Trader',
    'Food Vendor',
    'Clothing Vendor',
    'Mobile Money Agent',
    'Bicycle Repair',
    'Shoe Repair',
    'Hair Salon/Barber',
    'Tailor/Dressmaker',
    'Carpenter',
    'Mason/Builder',
    'Electrician',
    'Plumber',
    'Mechanic',
    'Welder',
    'Painter',
    'Gardener',
    'Security Guard',
    'House Cleaner',
    'Laundry Service',
    'Water Vendor',
    'Charcoal Seller',
    'Firewood Seller',
    'Petty Trader',
    'Hawker',
    'Street Food Seller',
    'Tea Seller',
    'Snack Vendor',
    'Fruit Seller',
    'Vegetable Seller',
    'Fish Seller',
    'Meat Seller',
    'Grain Seller',
    'Spice Seller',
    'Herbal Medicine Seller',
    'Traditional Healer',
    'Midwife',
    'Village Elder',
    'Community Leader',
    'Religious Leader',
    'Musician',
    'Dancer',
    'Artist',
    'Craftsman',
    'Basket Weaver',
    'Potter',
    'Blacksmith',
    'Jeweler',
    'Photographer',
    'Videographer',
    'Event Organizer',
    'Transport Operator',
    'Taxi Driver',
    'Bus Conductor',
    'Truck Driver',
    'Delivery Person',
    'Messenger',
    'Guide',
    'Tour Operator',
    'Hotel Worker',
    'Restaurant Worker',
    'Bar Worker',
    'Shop Assistant',
    'Sales Person',
    'Collector',
    'Debt Collector',
    'Money Lender',
    'Informal Banker',
    'Savings Group Leader',
    'Cooperative Member',
    'Farmer',
    'Livestock Keeper',
    'Fisherman',
    'Miner',
    'Quarry Worker',
    'Construction Worker',
    'Road Worker',
    'Railway Worker',
    'Port Worker',
    'Airport Worker',
    'Warehouse Worker',
    'Factory Worker',
    'Textile Worker',
    'Leather Worker',
    'Food Processor',
    'Beverage Maker',
    'Baker',
    'Cook',
    'Caterer',
    'Waiter',
    'Cleaner',
    'Janitor',
    'Maintenance Worker',
    'Repair Person',
    'Installer',
    'Technician',
    'Assistant',
    'Helper',
    'Laborer',
    'Worker',
    'Other'
  ];

  // Tanzania ID Types
  const tanzaniaIdTypes = [
    'NIDA ID',
    'Passport',
    'Driving License',
    'Voter ID',
    'Student ID',
    'Employee ID',
    'Refugee ID',
    'Alien ID'
  ];

  // Close Relative Relationship Types
  const relationshipTypes = [
    'Parent',
    'Sibling',
    'Child',
    'Grandparent',
    'Grandchild',
    'Uncle',
    'Aunt',
    'Nephew',
    'Niece',
    'Cousin',
    'Guardian',
    'Friend',
    'Neighbor',
    'Colleague',
    'Other'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setIsRepeatCustomer(true);
    setShowRepeatDetection(false);
    
    // Pre-fill form with customer data
    setFormData(prev => ({
      ...prev,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      national_id_number: customer.national_id_number || '',
      phone_number: customer.phone_number || '',
      email_address: customer.email_address || '',
      client_category: 'existing'
    }));
    
    toast.success(`Selected existing customer: ${customer.first_name} ${customer.last_name}`);
  };

  const handleNewCustomer = () => {
    setIsRepeatCustomer(false);
    setSelectedCustomer(null);
    setShowRepeatDetection(false);
    setFormData(prev => ({
      ...prev,
      client_category: 'new'
    }));
    toast.success('Continuing as new customer');
  };

  // Helper function to determine file type based on field name
  const getFileType = (field: string): 'photo' | 'id_document' | 'fingerprint' | 'salary_slip' | 'collateral_document' | 'bank_statement' | 'client_documents' => {
    switch (field) {
      case 'national_id':
        return 'id_document';
      case 'passport_photo':
      case 'group_photos':
        return 'photo';
      case 'fingerprint':
        return 'fingerprint';
      case 'income_proof':
      case 'group_bank_statement':
        return 'bank_statement';
      case 'payslip':
        return 'salary_slip';
      case 'photo':
        return 'photo';
      default:
        return 'client_documents';
    }
  };

  const handleFileUpload = async (field: string, file: File) => {
    try {
      setIsProcessing(true);
      const fileType = getFileType(field);
      const uploadResult = await FileUploadService.uploadFile(file, fileType);
      
      if (uploadResult.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [field]: file
        }));
        toast.success('File uploaded successfully');
      } else {
        toast.error(uploadResult.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Error uploading file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate required documents based on client type
  const validateRequiredDocuments = (): string[] => {
    const errors: string[] = [];
    
    // Always required for all client types
    if (!uploadedFiles.national_id) {
      errors.push('National ID Document is required');
    }
    
    if (!uploadedFiles.passport_photo) {
      errors.push('Passport Size Photo is required');
    }
    
    // Conditional requirements based on client type and employment status
    if (formData.client_type === 'individual') {
      // Bank statement is required for individual clients
      if (!uploadedFiles.income_proof) {
        errors.push('Bank statement for the last 2 months is required');
      }
      
      // Payslip is required only for employed individuals
      if (formData.employment_status === 'employed' && !uploadedFiles.payslip) {
        errors.push('2 Months Payslip is required for employed clients');
      }
    }
    
    if (formData.client_type === 'corporate') {
      // Corporate documents are required
      if (!uploadedFiles.board_resolution) {
        errors.push('Board Resolution to Borrow is required');
      }
      if (!uploadedFiles.business_license) {
        errors.push('Business License is required');
      }
      if (!uploadedFiles.tin_certificate) {
        errors.push('TIN Certificate is required');
      }
      if (!uploadedFiles.incorporation_certificate) {
        errors.push('Certificate of Incorporation is required');
      }
    }
    
    if (formData.client_type === 'group') {
      // Group documents are required
      if (!uploadedFiles.group_national_ids) {
        errors.push('National ID Documents (Chairman, Secretary, Treasurer) are required');
      }
      if (!uploadedFiles.group_photos) {
        errors.push('Passport Size Photos (Chairman, Secretary, Treasurer) are required');
      }
      if (!uploadedFiles.group_bank_statement) {
        errors.push('Bank Statement for the last 3 months is required');
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      // Validate required documents
      const validationErrors = validateRequiredDocuments();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }
      
      // Get current user's tenant ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      let tenantId: string;

      // First, try to get user's tenant association
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (tenantError) {
        console.error('Error fetching tenant users:', tenantError);
        console.log('Tenant users table might not exist or user has no permissions. Trying fallback...');
        
        // If tenant_users table doesn't exist or has permission issues, try to get any active tenant
        const { data: defaultTenants, error: defaultTenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('status', 'ACTIVE')
          .limit(1);

        if (defaultTenantError || !defaultTenants || defaultTenants.length === 0) {
          console.error('No active tenants found:', defaultTenantError);
          console.log('Using hardcoded fallback tenant ID...');
          
          // Use a hardcoded tenant ID as last resort
          // This should be replaced with a proper tenant ID from your database
          tenantId = '00000000-0000-0000-0000-000000000001'; // Replace with actual tenant ID
          console.log('Using hardcoded fallback tenant:', tenantId);
        } else {
          tenantId = defaultTenants[0].id;
          console.log('Using fallback tenant:', tenantId);
        }
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
          tenantId = '00000000-0000-0000-0000-000000000001'; // Replace with actual tenant ID
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

      // Prepare data for single table approach
      const clientData = {
        ...formData,
        tenant_id: tenantId,
        kyc_status: 'pending',
        status: 'active',
        client_category: 'new'
      };

      console.log('Form data keys:', Object.keys(formData));
      console.log('Client data being sent:', clientData);
      console.log('Tenant ID being used:', tenantId);

      // Clean client data
      const cleanedClientData = cleanClientData(clientData);
      console.log('Cleaned client data keys:', Object.keys(cleanedClientData));
      
      let result: any;

      if (formData.client_type === 'individual') {
        // Validate required fields for individual clients
        if (!formData.first_name || !formData.last_name) {
          toast.error('First name and last name are required for individual clients');
          return;
        }
        if (!formData.national_id_number) {
          toast.error('National ID number is required for individual clients');
          return;
        }

        result = await ClientService.insertIndividualClient(
          sanitizeUuidFields(cleanedClientData)
        );

      } else if (formData.client_type === 'corporate') {
        // Validate required fields for corporate clients
        if (!formData.company_name) {
          toast.error('Company name is required for corporate clients');
          return;
        }
        if (!formData.registration_number) {
          toast.error('Registration number is required for corporate clients');
          return;
        }
        if (!formData.director_first_name || !formData.director_last_name) {
          toast.error('Director information is required for corporate clients');
          return;
        }

        result = await ClientService.insertCorporateClient(
          sanitizeUuidFields(cleanedClientData)
        );

      } else if (formData.client_type === 'group') {
        // Validate required fields for group clients
        if (!formData.group_name) {
          toast.error('Group name is required for group clients');
          return;
        }
        if (!formData.group_type) {
          toast.error('Group type is required for group clients');
          return;
        }

        result = await ClientService.insertGroupClient(
          sanitizeUuidFields(cleanedClientData)
        );
      }
      
      if (result && result.success) {
        // Clear draft on successful submission
        DraftStorage.clearDraft('client');
        setHasDraft(false);
        toast.success('Client added successfully!');
        navigate('/staff/clients');
      } else {
        console.error('Client insertion failed:', result);
        const errorMessage = result?.error || 'Unknown error occurred';
        toast.error(`Failed to add client: ${errorMessage}`);
        
        // If the error mentions rollback failure, provide additional context
        if (errorMessage.includes('rollback') || errorMessage.includes('base client may still exist')) {
          toast.error('Note: A partial record may have been created. Please check the client list and delete any incomplete entries.');
        }
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error(`Error adding client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Draft functionality
  const saveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const success = DraftStorage.saveDraft('client', formData, currentStep, uploadedFiles);
      
      if (success) {
        setHasDraft(true);
        toast.success('Draft saved successfully!');
      } else {
        toast.error('Failed to save draft. Please try again.');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Error saving draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = () => {
    // Check if there's any current form data that would be lost
    const hasCurrentData = Object.values(formData).some(value => 
      value !== '' && value !== null && value !== undefined
    );
    
    if (hasCurrentData) {
      setShowLoadDraftConfirm(true);
    } else {
      performLoadDraft();
    }
  };

  const performLoadDraft = () => {
    try {
      const draft = DraftStorage.loadDraft('client');
      if (draft) {
        // Restore form data
        setFormData(draft.formData);
        
        // Restore current step
        setCurrentStep(draft.currentStep);
        
        // Restore uploaded files (note: actual files need to be re-uploaded)
        const restoredFiles = DraftStorage.deserializeFiles(draft.uploadedFiles);
        setUploadedFiles(restoredFiles);
        
        // Update draft status
        setHasDraft(true);
        
        toast.success(`Draft loaded successfully! (Saved ${DraftStorage.getDraftAge(draft.timestamp)})`);
      } else {
        toast.error('No draft found to load.');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Error loading draft. Please try again.');
    }
    setShowLoadDraftConfirm(false);
  };

  const clearDraft = () => {
    try {
      DraftStorage.clearDraft('client');
      setHasDraft(false);
      toast.success('Draft cleared successfully!');
    } catch (error) {
      console.error('Error clearing draft:', error);
      toast.error('Error clearing draft. Please try again.');
    }
  };


  // Check for existing draft on component mount
  React.useEffect(() => {
    const draft = DraftStorage.loadDraft('client');
    if (draft) {
      setHasDraft(true);
    }
  }, []);

  // Auto-save draft when form data changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData && Object.keys(formData).length > 1) {
        DraftStorage.saveDraft('client', formData, currentStep, uploadedFiles);
        setHasDraft(true);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, uploadedFiles]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Type Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleInputChange('client_type', 'individual')}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    formData.client_type === 'individual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-8 h-8 text-blue-600 mb-3" />
                  <h4 className="font-semibold text-gray-900">Individual</h4>
                  <p className="text-sm text-gray-600 mt-1">Personal client account</p>
                </button>
                
                <button
                  onClick={() => handleInputChange('client_type', 'corporate')}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    formData.client_type === 'corporate'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building className="w-8 h-8 text-green-600 mb-3" />
                  <h4 className="font-semibold text-gray-900">Corporate</h4>
                  <p className="text-sm text-gray-600 mt-1">Business client account</p>
                </button>
                
                <button
                  onClick={() => handleInputChange('client_type', 'group')}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    formData.client_type === 'group'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-8 h-8 text-purple-600 mb-3" />
                  <h4 className="font-semibold text-gray-900">Group</h4>
                  <p className="text-sm text-gray-600 mt-1">Group client account</p>
                </button>
              </div>
            </div>

          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {getStepTitle(2).title}
            </h3>
            
            {formData.client_type === 'individual' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number * (BOT Required)</label>
                    <input
                      type="text"
                      value={formData.national_id_number}
                      onChange={(e) => handleInputChange('national_id_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter National ID Number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number * (Must be registered to ID holder)</label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Phone number registered to ID holder"
                    />
                  </div>
                </div>

                {/* Name Fields in One Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middle_name}
                      onChange={(e) => handleInputChange('middle_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email_address}
                      onChange={(e) => handleInputChange('email_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number * (Tax Identification Number)</label>
                    <input
                      type="text"
                      value={formData.tin_number}
                      onChange={(e) => handleInputChange('tin_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter TIN Number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender * (BOT Required)</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth * (BOT Required)</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status *</label>
                    <select
                      value={formData.marital_status}
                      onChange={(e) => handleInputChange('marital_status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                {/* Spouse/Relation Information */}
                {formData.marital_status === 'married' && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">Spouse Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse First Name *</label>
                        <input
                          type="text"
                          value={formData.spouse_first_name}
                          onChange={(e) => handleInputChange('spouse_first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Middle Name</label>
                        <input
                          type="text"
                          value={formData.spouse_middle_name}
                          onChange={(e) => handleInputChange('spouse_middle_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Last Name *</label>
                        <input
                          type="text"
                          value={formData.spouse_last_name}
                          onChange={(e) => handleInputChange('spouse_last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse ID Type *</label>
                        <select
                          value={formData.spouse_id_type}
                          onChange={(e) => handleInputChange('spouse_id_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select ID Type</option>
                          {tanzaniaIdTypes.map(idType => (
                            <option key={idType} value={idType}>{idType}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse ID Number *</label>
                        <input
                          type="text"
                          value={formData.spouse_id_number}
                          onChange={(e) => handleInputChange('spouse_id_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.spouse_phone_number}
                          onChange={(e) => handleInputChange('spouse_phone_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Household Earnings (TZS) *</label>
                        <input
                          type="number"
                          value={formData.spouse_monthly_earnings}
                          onChange={(e) => handleInputChange('spouse_monthly_earnings', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          placeholder="Enter monthly household earnings"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(formData.marital_status === 'single' || formData.marital_status === 'divorced' || formData.marital_status === 'widowed') && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold text-green-900 mb-4">Close Relative Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          value={formData.spouse_first_name}
                          onChange={(e) => handleInputChange('spouse_first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                        <input
                          type="text"
                          value={formData.spouse_middle_name}
                          onChange={(e) => handleInputChange('spouse_middle_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={formData.spouse_last_name}
                          onChange={(e) => handleInputChange('spouse_last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                        <select
                          value={formData.relation_type}
                          onChange={(e) => handleInputChange('relation_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Relationship</option>
                          {relationshipTypes.map(relationship => (
                            <option key={relationship} value={relationship}>{relationship}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                        <select
                          value={formData.spouse_id_type}
                          onChange={(e) => handleInputChange('spouse_id_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select ID Type</option>
                          {tanzaniaIdTypes.map(idType => (
                            <option key={idType} value={idType}>{idType}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                        <input
                          type="text"
                          value={formData.spouse_id_number}
                          onChange={(e) => handleInputChange('spouse_id_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.spouse_phone_number}
                          onChange={(e) => handleInputChange('spouse_phone_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Earnings (TZS) *</label>
                        <input
                          type="number"
                          value={formData.spouse_monthly_earnings}
                          onChange={(e) => handleInputChange('spouse_monthly_earnings', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          placeholder="Enter monthly earnings"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.client_type === 'corporate' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name * (BOT Required)</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number * (BOT Required)</label>
                    <input
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) => handleInputChange('registration_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID * (BOT Required)</label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type * (BOT Required)</label>
                    <select
                      value={formData.business_type}
                      onChange={(e) => handleInputChange('business_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Business Type</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Limited Company">Limited Company</option>
                      <option value="Public Limited Company">Public Limited Company</option>
                      <option value="Cooperative">Cooperative</option>
                      <option value="NGO">NGO</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry * (BOT Required)</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Industry</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Services">Services</option>
                      <option value="Trade">Trade</option>
                      <option value="Construction">Construction</option>
                      <option value="Transport">Transport</option>
                      <option value="Education">Education</option>
                      <option value="Health">Health</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Size * (BOT Required)</label>
                    <select
                      value={formData.company_size}
                      onChange={(e) => handleInputChange('company_size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Size</option>
                      <option value="Micro">Micro (1-4 employees)</option>
                      <option value="Small">Small (5-19 employees)</option>
                      <option value="Medium">Medium (20-99 employees)</option>
                      <option value="Large">Large (100+ employees)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Established Date * (BOT Required)</label>
                    <input
                      type="date"
                      value={formData.established_date}
                      onChange={(e) => handleInputChange('established_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Address * (BOT Required)</label>
                    <textarea
                      value={formData.company_address}
                      onChange={(e) => handleInputChange('company_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.client_type === 'group' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name * (BOT Required)</label>
                  <input
                    type="text"
                    value={formData.group_name}
                    onChange={(e) => handleInputChange('group_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Type * (BOT Required)</label>
                  <select
                    value={formData.group_type}
                    onChange={(e) => handleInputChange('group_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Group Type</option>
                    <option value="Village Community Bank (VICOBA)">Village Community Bank (VICOBA)</option>
                    <option value="Savings and Credit Cooperative (SACCOS)">Savings and Credit Cooperative (SACCOS)</option>
                    <option value="Self Help Group (SHG)">Self Help Group (SHG)</option>
                    <option value="Women Group">Women Group</option>
                    <option value="Youth Group">Youth Group</option>
                    <option value="Farmer Group">Farmer Group</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Size * (BOT Required)</label>
                  <input
                    type="number"
                    value={formData.group_size}
                    onChange={(e) => handleInputChange('group_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="5"
                    max="50"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Leader Name * (BOT Required)</label>
                  <input
                    type="text"
                    value={formData.group_leader}
                    onChange={(e) => handleInputChange('group_leader', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Leader Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Address * (BOT Required)</label>
                  <textarea
                    value={formData.group_address}
                    onChange={(e) => handleInputChange('group_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Leader Email</label>
                  <input
                    type="email"
                    value={formData.email_address}
                    onChange={(e) => handleInputChange('email_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region * (BOT Required)</label>
                <select
                  value={formData.region}
                  onChange={(e) => {
                    handleInputChange('region', e.target.value);
                    handleInputChange('district', ''); // Reset district when region changes
                    handleInputChange('ward', ''); // Reset ward when region changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Region</option>
                  {Object.keys(tanzaniaRegions).map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District * (BOT Required)</label>
                <select
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.region}
                >
                  <option value="">Select District</option>
                  {formData.region && getDistrictsByRegion(formData.region).map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ward * (BOT Required)</label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter Ward"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Name *</label>
                <input
                  type="text"
                  value={formData.street_name}
                  onChange={(e) => handleInputChange('street_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter Street Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House Number</label>
                <input
                  type="text"
                  value={formData.house_number}
                  onChange={(e) => handleInputChange('house_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter House Number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nearest Landmark</label>
                <input
                  type="text"
                  value={formData.nearest_landmark}
                  onChange={(e) => handleInputChange('nearest_landmark', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter nearest landmark"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Address</label>
                <textarea
                  value={formData.postal_address}
                  onChange={(e) => handleInputChange('postal_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter complete postal address"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {getStepTitle(4).title}
            </h3>
            
            {formData.client_type === 'corporate' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.director_first_name}
                      onChange={(e) => handleInputChange('director_first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                    <input
                      type="text"
                      value={formData.director_middle_name}
                      onChange={(e) => handleInputChange('director_middle_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.director_last_name}
                      onChange={(e) => handleInputChange('director_last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.director_phone_number}
                      onChange={(e) => handleInputChange('director_phone_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.director_email_address}
                      onChange={(e) => handleInputChange('director_email_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender * (BOT Required)</label>
                    <select
                      value={formData.director_gender}
                      onChange={(e) => handleInputChange('director_gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth * (BOT Required)</label>
                    <input
                      type="date"
                      value={formData.director_date_of_birth}
                      onChange={(e) => handleInputChange('director_date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number * (BOT Required)</label>
                    <input
                      type="text"
                      value={formData.director_national_id_number}
                      onChange={(e) => handleInputChange('director_national_id_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter National ID Number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                    <select
                      value={formData.director_id_type}
                      onChange={(e) => handleInputChange('director_id_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select ID Type</option>
                      {tanzaniaIdTypes.map(idType => (
                        <option key={idType} value={idType}>{idType}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number * (Tax Identification Number)</label>
                    <input
                      type="text"
                      value={formData.director_tin_number}
                      onChange={(e) => handleInputChange('director_tin_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter TIN Number"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status *</label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => handleInputChange('employment_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Employment Status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              
              {formData.employment_status === 'employed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name *</label>
                    <input
                      type="text"
                      value={formData.employer_name}
                      onChange={(e) => handleInputChange('employer_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (TZS) *</label>
                    <input
                      type="number"
                      value={formData.monthly_income}
                      onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter monthly income"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employer Address</label>
                    <input
                      type="text"
                      value={formData.employer_address}
                      onChange={(e) => handleInputChange('employer_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter employer address"
                    />
                  </div>
                </>
              )}
              
              {formData.employment_status === 'self_employed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation *</label>
                    <select
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Occupation</option>
                      {eastAfricaOccupations.map(occupation => (
                        <option key={occupation} value={occupation}>{occupation}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.occupation === 'Other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation (Please specify) *</label>
                      <input
                        type="text"
                        value={formData.other_occupation}
                        onChange={(e) => handleInputChange('other_occupation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Please specify your occupation"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (TZS) *</label>
                    <input
                      type="number"
                      value={formData.monthly_income}
                      onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter monthly income"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Address *</label>
                    <input
                      type="text"
                      value={formData.business_address}
                      onChange={(e) => handleInputChange('business_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}
              
              {(formData.employment_status === 'unemployed' || formData.employment_status === 'student') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Income Source</label>
                  <input
                    type="text"
                    value={formData.income_source}
                    onChange={(e) => handleInputChange('income_source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe income source"
                  />
                </div>
              )}
              
              {formData.employment_status === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status (Please specify) *</label>
                  <input
                    type="text"
                    value={formData.income_source}
                    onChange={(e) => handleInputChange('income_source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Please specify your employment status"
                  />
                </div>
              )}
              </div>
            )}

            {formData.client_type === 'group' && (
              <div className="space-y-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Group Leadership Structure</h4>
                  <p className="text-sm text-blue-700">Please provide details for the three key leadership positions in the group.</p>
                </div>

                {/* Chairman/MD/CEO Details */}
                <div className="space-y-4">
                  <h5 className="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Chairman/MD/CEO Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={formData.chairman_first_name}
                        onChange={(e) => handleInputChange('chairman_first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                      <input
                        type="text"
                        value={formData.chairman_middle_name}
                        onChange={(e) => handleInputChange('chairman_middle_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={formData.chairman_last_name}
                        onChange={(e) => handleInputChange('chairman_last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.chairman_phone_number}
                        onChange={(e) => handleInputChange('chairman_phone_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.chairman_email_address}
                        onChange={(e) => handleInputChange('chairman_email_address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="chairman@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                      <select
                        value={formData.chairman_gender}
                        onChange={(e) => handleInputChange('chairman_gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.chairman_date_of_birth}
                        onChange={(e) => handleInputChange('chairman_date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number *</label>
                      <input
                        type="text"
                        value={formData.chairman_national_id_number}
                        onChange={(e) => handleInputChange('chairman_national_id_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Enter National ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                      <select
                        value={formData.chairman_id_type}
                        onChange={(e) => handleInputChange('chairman_id_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="national_id">National ID</option>
                        <option value="passport">Passport</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
                      <input
                        type="text"
                        value={formData.chairman_tin_number}
                        onChange={(e) => handleInputChange('chairman_tin_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter TIN Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Secretary Details */}
                <div className="space-y-4">
                  <h5 className="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Secretary Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={formData.secretary_first_name}
                        onChange={(e) => handleInputChange('secretary_first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                      <input
                        type="text"
                        value={formData.secretary_middle_name}
                        onChange={(e) => handleInputChange('secretary_middle_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={formData.secretary_last_name}
                        onChange={(e) => handleInputChange('secretary_last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.secretary_phone_number}
                        onChange={(e) => handleInputChange('secretary_phone_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.secretary_email_address}
                        onChange={(e) => handleInputChange('secretary_email_address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="secretary@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                      <select
                        value={formData.secretary_gender}
                        onChange={(e) => handleInputChange('secretary_gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.secretary_date_of_birth}
                        onChange={(e) => handleInputChange('secretary_date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number *</label>
                      <input
                        type="text"
                        value={formData.secretary_national_id_number}
                        onChange={(e) => handleInputChange('secretary_national_id_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Enter National ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                      <select
                        value={formData.secretary_id_type}
                        onChange={(e) => handleInputChange('secretary_id_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="national_id">National ID</option>
                        <option value="passport">Passport</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
                      <input
                        type="text"
                        value={formData.secretary_tin_number}
                        onChange={(e) => handleInputChange('secretary_tin_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter TIN Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Treasurer Details */}
                <div className="space-y-4">
                  <h5 className="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Treasurer Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={formData.treasurer_first_name}
                        onChange={(e) => handleInputChange('treasurer_first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                      <input
                        type="text"
                        value={formData.treasurer_middle_name}
                        onChange={(e) => handleInputChange('treasurer_middle_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={formData.treasurer_last_name}
                        onChange={(e) => handleInputChange('treasurer_last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.treasurer_phone_number}
                        onChange={(e) => handleInputChange('treasurer_phone_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.treasurer_email_address}
                        onChange={(e) => handleInputChange('treasurer_email_address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="treasurer@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                      <select
                        value={formData.treasurer_gender}
                        onChange={(e) => handleInputChange('treasurer_gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.treasurer_date_of_birth}
                        onChange={(e) => handleInputChange('treasurer_date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number *</label>
                      <input
                        type="text"
                        value={formData.treasurer_national_id_number}
                        onChange={(e) => handleInputChange('treasurer_national_id_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Enter National ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                      <select
                        value={formData.treasurer_id_type}
                        onChange={(e) => handleInputChange('treasurer_id_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="national_id">National ID</option>
                        <option value="passport">Passport</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
                      <input
                        type="text"
                        value={formData.treasurer_tin_number}
                        onChange={(e) => handleInputChange('treasurer_tin_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter TIN Number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Bank</option>
                  {tanzaniaBanks.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Branch *</label>
                <input
                  type="text"
                  value={formData.bank_branch}
                  onChange={(e) => handleInputChange('bank_branch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter bank branch"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number (TZS) *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter account number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => handleInputChange('account_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Account Type</option>
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                  <option value="fixed_deposit">Fixed Deposit</option>
                  <option value="business">Business Account</option>
                  <option value="joint">Joint Account</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Upload</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">National ID Document *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('national_id', e.target.files[0])}
                    className="hidden"
                    id="national_id"
                  />
                  <label htmlFor="national_id" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload National ID</p>
                  </label>
                  {uploadedFiles.national_id && (
                    <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.national_id.name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Size Photo *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('passport_photo', e.target.files[0])}
                    className="hidden"
                    id="passport_photo"
                  />
                  <label htmlFor="passport_photo" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload Passport Photo</p>
                    <p className="text-xs text-gray-500 mt-1">Standard passport size (35mm x 45mm)</p>
                  </label>
                  {uploadedFiles.passport_photo && (
                    <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.passport_photo.name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fingerprints</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('fingerprint', e.target.files[0])}
                    className="hidden"
                    id="fingerprint"
                  />
                  <label htmlFor="fingerprint" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload Fingerprints</p>
                    <p className="text-xs text-gray-500 mt-1">Both thumbprints or all 10 fingerprints</p>
                  </label>
                  {uploadedFiles.fingerprint && (
                    <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.fingerprint.name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank statement for the last 2 months</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('income_proof', e.target.files[0])}
                    className="hidden"
                    id="income_proof"
                  />
                  <label htmlFor="income_proof" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload Bank Statement</p>
                  </label>
                  {uploadedFiles.income_proof && (
                    <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.income_proof.name}</p>
                  )}
                </div>
              </div>
              
              {formData.employment_status === 'employed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">2 Months Payslip</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('payslip', e.target.files[0])}
                      className="hidden"
                      id="payslip"
                    />
                    <label htmlFor="payslip" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload 2 Months Payslip</p>
                    </label>
                    {uploadedFiles.payslip && (
                      <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.payslip.name}</p>
                    )}
                  </div>
                </div>
              )}
              
              {formData.client_type === 'corporate' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Board Resolution to Borrow *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('board_resolution', e.target.files[0])}
                        className="hidden"
                        id="board_resolution"
                      />
                      <label htmlFor="board_resolution" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Board Resolution</p>
                      </label>
                      {uploadedFiles.board_resolution && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.board_resolution.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business License *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('business_license', e.target.files[0])}
                        className="hidden"
                        id="business_license"
                      />
                      <label htmlFor="business_license" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Business License</p>
                      </label>
                      {uploadedFiles.business_license && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.business_license.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxpayer Identification Number (TIN) Certificate *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('tin_certificate', e.target.files[0])}
                        className="hidden"
                        id="tin_certificate"
                      />
                      <label htmlFor="tin_certificate" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload TIN Certificate</p>
                      </label>
                      {uploadedFiles.tin_certificate && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.tin_certificate.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Clearance Certificate</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('tax_clearance', e.target.files[0])}
                        className="hidden"
                        id="tax_clearance"
                      />
                      <label htmlFor="tax_clearance" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Tax Clearance</p>
                      </label>
                      {uploadedFiles.tax_clearance && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.tax_clearance.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Incorporation *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('incorporation_certificate', e.target.files[0])}
                        className="hidden"
                        id="incorporation_certificate"
                      />
                      <label htmlFor="incorporation_certificate" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Incorporation Certificate</p>
                      </label>
                      {uploadedFiles.incorporation_certificate && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.incorporation_certificate.name}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {formData.client_type === 'group' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">National ID Documents (Chairman, Secretary, Treasurer) *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_national_ids', e.target.files[0])}
                        className="hidden"
                        id="group_national_ids"
                      />
                      <label htmlFor="group_national_ids" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload National ID Documents</p>
                        <p className="text-xs text-gray-500 mt-1">Upload 3 documents (Chairman, Secretary, Treasurer)</p>
                      </label>
                      {uploadedFiles.group_national_ids && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_national_ids.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Passport Size Photos (Chairman, Secretary, Treasurer) *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_photos', e.target.files[0])}
                        className="hidden"
                        id="group_photos"
                      />
                      <label htmlFor="group_photos" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Passport Photos</p>
                        <p className="text-xs text-gray-500 mt-1">Upload 3 photos (Chairman, Secretary, Treasurer)</p>
                      </label>
                      {uploadedFiles.group_photos && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_photos.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Statement for the last 3 months *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_bank_statement', e.target.files[0])}
                        className="hidden"
                        id="group_bank_statement"
                      />
                      <label htmlFor="group_bank_statement" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Bank Statement</p>
                      </label>
                      {uploadedFiles.group_bank_statement && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_bank_statement.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Most Recent Audited Annual Financials</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_financials', e.target.files[0])}
                        className="hidden"
                        id="group_financials"
                      />
                      <label htmlFor="group_financials" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Financials</p>
                      </label>
                      {uploadedFiles.group_financials && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_financials.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Registration Certificate</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_registration', e.target.files[0])}
                        className="hidden"
                        id="group_registration"
                      />
                      <label htmlFor="group_registration" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Registration Certificate</p>
                      </label>
                      {uploadedFiles.group_registration && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_registration.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TIN Certificate</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_tin_certificate', e.target.files[0])}
                        className="hidden"
                        id="group_tin_certificate"
                      />
                      <label htmlFor="group_tin_certificate" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload TIN Certificate</p>
                      </label>
                      {uploadedFiles.group_tin_certificate && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_tin_certificate.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('group_license', e.target.files[0])}
                        className="hidden"
                        id="group_license"
                      />
                      <label htmlFor="group_license" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload License</p>
                      </label>
                      {uploadedFiles.group_license && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.group_license.name}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getStepTitle(2).title}
                  </h4>
                  
                  {formData.client_type === 'individual' && (
                    <>
                      <p className="text-sm text-gray-600">
                        {formData.first_name} {formData.last_name}
                      </p>
                      <p className="text-sm text-gray-600">Gender: {formData.gender}</p>
                      <p className="text-sm text-gray-600">DOB: {formData.date_of_birth}</p>
                      <p className="text-sm text-gray-600">ID: {formData.national_id_number}</p>
                    </>
                  )}
                  
                  {formData.client_type === 'corporate' && (
                    <>
                      <p className="text-sm text-gray-600">Company: {formData.company_name}</p>
                      <p className="text-sm text-gray-600">Reg No: {formData.registration_number}</p>
                      <p className="text-sm text-gray-600">Tax ID: {formData.tax_id}</p>
                      <p className="text-sm text-gray-600">Type: {formData.business_type}</p>
                      <p className="text-sm text-gray-600">Industry: {formData.industry}</p>
                      <p className="text-sm text-gray-600">Size: {formData.company_size}</p>
                    </>
                  )}
                  
                  {formData.client_type === 'group' && (
                    <>
                      <p className="text-sm text-gray-600">Group: {formData.group_name}</p>
                      <p className="text-sm text-gray-600">Type: {formData.group_type}</p>
                      <p className="text-sm text-gray-600">Size: {formData.group_size} members</p>
                      <p className="text-sm text-gray-600">Leader: {formData.group_leader}</p>
                    </>
                  )}
                  
                  {formData.client_type === 'group' && (
                    <div className="mt-4 space-y-3">
                      <h5 className="font-medium text-gray-900">Group Leadership</h5>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Chairman:</strong> {formData.chairman_first_name} {formData.chairman_last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Secretary:</strong> {formData.secretary_first_name} {formData.secretary_last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Treasurer:</strong> {formData.treasurer_first_name} {formData.treasurer_last_name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">Phone: {formData.phone_number}</p>
                  <p className="text-sm text-gray-600">Email: {formData.email_address}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Address</h4>
                  <p className="text-sm text-gray-600">
                    {formData.street_name} {formData.house_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.ward}, {formData.district}
                  </p>
                  <p className="text-sm text-gray-600">{formData.region}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/staff/clients')}
                  className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Clients
                </button>
                <div className="border-l border-gray-300 h-6 mr-4"></div>
                <h1 className="text-xl font-semibold text-gray-900">Add New Client</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Repeat Customer Detection */}
          {showRepeatDetection && (
            <div className="mb-8">
              <RepeatCustomerDetection
                onCustomerSelect={handleCustomerSelect}
                onNewCustomer={handleNewCustomer}
                searchCriteria={{
                  nationalId: formData.national_id_number,
                  phoneNumber: formData.phone_number,
                  email: formData.email_address,
                  firstName: formData.first_name,
                  lastName: formData.last_name
                }}
              />
            </div>
          )}

          {/* Selected Customer Info */}
          {selectedCustomer && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Existing Customer Selected</h3>
                  <p className="text-green-700">
                    {selectedCustomer.first_name} {selectedCustomer.last_name} - 
                    {selectedCustomer.client_category?.toUpperCase()} Category - 
                    {selectedCustomer.status?.toUpperCase()} Status
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRepeatDetection(true);
                    setSelectedCustomer(null);
                    setIsRepeatCustomer(false);
                  }}
                  className="ml-auto text-green-600 hover:text-green-800 underline text-sm"
                >
                  Change Customer
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Progress Steps */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                <div className="space-y-3">
                  {steps.map((step) => {
                    const isActive = currentStep >= step.id;
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    
                    console.log(`Step ${step.id}: isActive=${isActive}, isCompleted=${isCompleted}, isCurrent=${isCurrent}`);
                    
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-500 bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: isActive ? '#eff6ff' : '#f9fafb',
                          color: isActive ? '#1d4ed8' : '#6b7280',
                          border: isActive ? '1px solid #dbeafe' : '1px solid #e5e7eb'
                        }}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted
                              ? 'bg-blue-600 text-white'
                              : isCurrent
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? '#2563eb' : isCurrent ? '#dbeafe' : '#e5e7eb',
                            color: isCompleted ? '#ffffff' : isCurrent ? '#1d4ed8' : '#6b7280'
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{step.title}</p>
                          <p className="text-xs">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {renderStepContent()}
                </div>
                
                {/* Navigation Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  {/* Draft Controls */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {hasDraft && (
                        <div className="flex items-center text-sm text-amber-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Draft saved
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* Load Draft Button */}
                      <button
                        onClick={loadDraft}
                        className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 flex items-center"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Load Draft
                      </button>
                      
                      {/* Clear Draft Button */}
                      {hasDraft && (
                        <button
                          onClick={clearDraft}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear Draft
                        </button>
                      )}
                      
                      {/* Save Draft Button */}
                      <button
                        onClick={saveDraft}
                        disabled={isSavingDraft}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSavingDraft ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-1" />
                            Save Draft
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-3">
                      {currentStep === steps.length ? (
                        <button
                          onClick={handleSubmit}
                          disabled={isProcessing}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding Client...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Add Client
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={nextStep}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Load Draft Confirmation Dialog */}
      {showLoadDraftConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Load Draft?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Loading a draft will replace your current form data. Any unsaved changes will be lost. 
              Do you want to continue?
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowLoadDraftConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={performLoadDraft}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Load Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AddClient;

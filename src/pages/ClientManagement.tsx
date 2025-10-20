import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { DynamicDataService } from '../services/dynamicDataService';
import { useLanguage } from '../context/LanguageContext';
// import { useSupabaseAuth } from '../context/SupabaseAuthContext'; // Removed unused import
import { useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '../hooks/useSupabase';
import { FileUploadService } from '../services/fileUploadService';
import { GroupService } from '../services/groupService';
import { ClientService } from '../services/clientService';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Loader2,
  RefreshCw,
  Users
} from 'lucide-react';
import BulkClientUpload from '../components/BulkClientUpload';

const ClientManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    clientType: '',
    status: '',
    kycStatus: '',
    searchField: 'all' // all, name, nin, phone, email, company, group
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [clientToArchive, setClientToArchive] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  // State for clients data
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  
  const [newClientData, setNewClientData] = useState({
    // Client Type Selection
    client_type: 'individual' as 'individual' | 'corporate' | 'group',
    client_category: 'new' as 'new' | 'existing',
    
    // Personal Information (Individual)
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    phone_number: '',
    email_address: '',
    marital_status: '',
    date_of_birth: '',
    national_id_number: '',
    id_type: '',
    
    // Contact Information
    street_name: '',
    house_number: '',
    area_of_residence: '',
    housing_type: '',
    
    // Next of Kin Details
    next_of_kin_name: '',
    next_of_kin_relationship: '',
    next_of_kin_phone: '',
    next_of_kin_address: '',
    
    // Employment Information
    employment_status: '' as 'employed' | 'self_employed' | 'volunteer' | 'unemployed' | 'retired' | 'student',
    company_name: '',
    office_location: '',
    position: '',
    years_of_employment: '',
    net_monthly_salary: '',
    salary_slip_uploaded: false,
    employment_contact_person: '',
    employment_contact_phone: '',
    
    // Financial Information
    bank_name: '',
    bank_account_number: '',
    bank_branch: '',
    mobile_money_provider: '',
    mobile_money_number: '',
    monthly_expenses: '',
    existing_debts: '',
    asset_ownership: '',
    
    // Business Details
    business_name: '',
    business_location: '',
    average_monthly_income: '',
    type_of_business: '',
    since_when_business: '',
    
    // Household/Dependents Information
    number_of_dependents: '',
    household_income_contributors: '',
    living_arrangements: '',
    education_expenses: '',
    
    // Spouse Information
    spouse_name: '',
    
    // Group Information
    group_name: '',
    group_type: '',
    group_description: '',
    meeting_frequency: '',
    meeting_day: '',
    meeting_time: '',
    meeting_location: '',
    guarantee_model: '',
    guarantee_value: '',
    
    // Corporate Information (for corporate clients)
    company_registration_number: '',
    tax_identification_number: '',
    legal_structure: '',
    date_of_incorporation: '',
    country_of_incorporation: '',
    industry_sector: '',
    business_description: '',
    number_of_employees: '',
    annual_turnover: '',
    years_in_operation: '',
    registered_address: '',
    physical_address: '',
    website: '',
    primary_contact_person: '',
    authorized_signatories: '',
    
    // Verification and Documents
    kyc_status: 'pending' as 'pending' | 'verified' | 'rejected',
    id_document_uploaded: false,
    passport_photo_uploaded: false,
    fingerprint_uploaded: false,
    digital_signature_uploaded: false,
    voice_print_uploaded: false,
    facial_recognition_uploaded: false,
    
    // Document URLs
    id_document_url: '',
    passport_photo_url: '',
    fingerprint_url: '',
    salary_slip_url: '',
    digital_signature_url: '',
    voice_print_url: '',
    facial_recognition_url: '',
    
    // === ENHANCED REGULATORY DATA CAPTURE ===
    
    // Geographic Data (MSP2_10 - Geographical Distribution)
    region_code: '',
    district_code: '',
    ward_code: '',
    branch_assignment: '',
    gps_coordinates: '',
    address_verification_status: 'pending' as 'pending' | 'verified' | 'failed',
    
    // Enhanced Demographic Data (MSP2_09, MSP2_10)
    education_level: '',
    age_group: '', // Auto-calculated from date_of_birth
    household_size: '',
    income_bracket: '',
    
    // Economic Sector Classification (MSP2_03, MSP2_09)
    primary_business_sector: '',
    secondary_business_sector: '',
    business_sector_confidence: 0, // AI confidence score
    business_activity_description: '',
    annual_income: '',
    monthly_business_income: '',
    business_registration_number: '',
    business_license_number: '',
    
    // Enhanced Risk Management
    guarantor_type: '' as 'individual' | 'group' | 'employer' | 'asset' | 'none',
    guarantor_details: '',
    collateral_type: '',
    collateral_value: '',
    collateral_description: '',
    risk_rating: 'low' as 'low' | 'medium' | 'high',
    risk_factors: [] as string[],
    
    // Enhanced Compliance Data
    compliance_flags: [] as string[],
    aml_risk_level: 'low' as 'low' | 'medium' | 'high',
    pep_status: false, // Politically Exposed Person
    sanctions_check_status: 'pending' as 'pending' | 'clear' | 'flagged',
    credit_bureau_score: '',
    credit_bureau_status: 'pending' as 'pending' | 'verified' | 'failed',
    
    // Regulatory Reporting Fields
    reporting_region: '',
    reporting_district: '',
    gender_for_reporting: '' as 'Male' | 'Female',
    age_group_for_reporting: '' as 'Up35' | 'Above35',
    sector_for_reporting: '',
    loan_purpose_category: '',
    
    // Additional KYC Fields
    kyc_completion_percentage: 0,
    kyc_required_documents: [] as string[],
    kyc_uploaded_documents: [] as string[],
    kyc_verification_date: '',
    kyc_verified_by: '',
    kyc_notes: '',
    
    // Data Quality Flags
    data_quality_score: 0,
    missing_required_fields: [] as string[],
    data_validation_errors: [] as string[],
    last_data_validation: '',
    
    // Regulatory Compliance
    regulatory_status: 'compliant' as 'compliant' | 'non_compliant' | 'under_review',
    compliance_review_date: '',
    compliance_reviewer: '',
    compliance_notes: ''
  });

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{
    id_document?: File;
    passport_photo?: File;
    fingerprint?: File;
    salary_slip?: File;
    digital_signature?: File;
    voice_print?: File;
    facial_recognition?: File;
  }>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  // const [uploadedFileUrls, setUploadedFileUrls] = useState<{
  //   id_document_url?: string;
  //   passport_photo_url?: string;
  //   fingerprint_url?: string;
  //   salary_slip_url?: string;
  // }>({}); // Removed unused variable

  // Fetch clients with details and set up realtime subscription
  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        setClientsError(null);
        
        const result = await ClientService.getClientsWithDetails();
        
        if (result.success) {
          setClients(result.data || []);
          console.log('✅ Clients loaded successfully:', result.data?.length || 0);
          
          // Debug: Log the first client to see the data structure
          if (result.data && result.data.length > 0) {
            console.log('🔍 First client data structure:', result.data[0]);
            console.log('🔍 First client individual details:', result.data[0].individual_client_details);
            console.log('🔍 First client corporate details:', result.data[0].corporate_client_details);
            console.log('🔍 First client group details:', result.data[0].group_client_details);
          }
        } else {
          setClientsError(result.error || 'Failed to fetch clients');
          console.error('❌ Error fetching clients:', result.error);
        }
      } catch (error) {
        console.error('❌ Exception fetching clients:', error);
        setClientsError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();

    // Set up realtime subscription for clients table
    const subscription = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'clients' 
        }, 
        (payload: any) => {
          console.log('🔄 Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new client to the list
            setClients(prevClients => [payload.new, ...prevClients]);
            toast.success('New client added!');
          } else if (payload.eventType === 'UPDATE') {
            // Update existing client in the list
            setClients(prevClients => 
              prevClients.map(client => 
                client.id === payload.new.id ? payload.new : client
              )
            );
            toast.success('Client updated!');
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted client from the list
            setClients(prevClients => 
              prevClients.filter(client => client.id !== payload.old.id)
            );
            toast.success('Client deleted!');
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh function
  const refreshClients = async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      
      const result = await ClientService.getClientsWithDetails();
      
      if (result.success) {
        setClients(result.data || []);
        console.log('✅ Clients refreshed successfully:', result.data?.length || 0);
      } else {
        setClientsError(result.error || 'Failed to fetch clients');
        console.error('❌ Error refreshing clients:', result.error);
      }
    } catch (error) {
      console.error('❌ Exception refreshing clients:', error);
      setClientsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setClientsLoading(false);
    }
  };

  // Check user profile and role - we'll get this from auth context
  // const { user } = useAuth(); // Removed unused variable


  // Hooks for database operations
  const { insert: insertClient, loading: insertLoading } = useSupabaseInsert('clients');
  const { update: updateClient, loading: updateLoading } = useSupabaseUpdate('clients');
  const { deleteRecord: deleteClient, loading: deleteLoading } = useSupabaseDelete('clients');

  const filteredClients = clients.filter(client => {
    // Apply search term filter
    if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const fullName = client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim();
    
      // Search based on selected field or all fields
      let matchesSearch = false;
      
      switch (searchFilters.searchField) {
        case 'name':
          matchesSearch = fullName.toLowerCase().includes(searchLower);
          break;
        case 'nin':
          matchesSearch = client.national_id_number?.toLowerCase().includes(searchLower) ||
                         client.director_national_id_number?.toLowerCase().includes(searchLower) ||
                         client.chairman_national_id_number?.toLowerCase().includes(searchLower) ||
                         client.secretary_national_id_number?.toLowerCase().includes(searchLower) ||
                         client.treasurer_national_id_number?.toLowerCase().includes(searchLower);
          break;
        case 'phone':
          matchesSearch = client.phone_number?.toLowerCase().includes(searchLower) ||
                         client.director_phone_number?.toLowerCase().includes(searchLower) ||
                         client.chairman_phone_number?.toLowerCase().includes(searchLower) ||
                         client.secretary_phone_number?.toLowerCase().includes(searchLower) ||
                         client.treasurer_phone_number?.toLowerCase().includes(searchLower);
          break;
        case 'email':
          matchesSearch = client.email_address?.toLowerCase().includes(searchLower) ||
                         client.director_email_address?.toLowerCase().includes(searchLower) ||
                         client.chairman_email_address?.toLowerCase().includes(searchLower) ||
                         client.secretary_email_address?.toLowerCase().includes(searchLower) ||
                         client.treasurer_email_address?.toLowerCase().includes(searchLower);
          break;
        case 'company':
          matchesSearch = client.company_name?.toLowerCase().includes(searchLower) ||
                         client.registration_number?.toLowerCase().includes(searchLower) ||
                         client.tax_id?.toLowerCase().includes(searchLower);
          break;
        case 'group':
          matchesSearch = client.group_name?.toLowerCase().includes(searchLower) ||
                         client.group_leader?.toLowerCase().includes(searchLower) ||
                         client.group_leader_name?.toLowerCase().includes(searchLower);
          break;
        default: // 'all'
          matchesSearch = fullName.toLowerCase().includes(searchLower) ||
           client.phone_number?.toLowerCase().includes(searchLower) ||
           client.email_address?.toLowerCase().includes(searchLower) ||
           client.company_name?.toLowerCase().includes(searchLower) ||
                         client.group_name?.toLowerCase().includes(searchLower) ||
                         client.national_id_number?.toLowerCase().includes(searchLower) ||
                         client.registration_number?.toLowerCase().includes(searchLower) ||
                         client.tax_id?.toLowerCase().includes(searchLower) ||
                         client.group_leader?.toLowerCase().includes(searchLower) ||
                         client.group_leader_name?.toLowerCase().includes(searchLower);
      }
      
      if (!matchesSearch) return false;
    }
    
    // Apply client type filter
    if (searchFilters.clientType && client.client_type !== searchFilters.clientType) {
      return false;
    }
    
    // Apply status filter
    if (searchFilters.status && client.status !== searchFilters.status) {
      return false;
    }
    
    // Apply KYC status filter
    if (searchFilters.kycStatus && client.kyc_status !== searchFilters.kycStatus) {
      return false;
    }
    
    return true;
  });


  const handleAddClient = () => {
    navigate('/staff/clients/add');
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setIsEditing(true);
    setNewClientData({
      // Client Type Selection
      client_type: client.client_type || 'individual' as 'individual' | 'corporate' | 'group',
      client_category: client.client_category || 'existing' as 'new' | 'existing',
      
      // Personal Information (Individual) - Populate with existing data
      first_name: client.first_name || '',
      middle_name: client.middle_name || '',
      last_name: client.last_name || '',
      gender: client.gender || '',
      phone_number: client.phone_number || '',
      email_address: client.email_address || '',
      marital_status: client.marital_status || '',
      date_of_birth: client.date_of_birth || '',
      national_id_number: client.national_id_number || '',
      id_type: client.id_type || '',
      
      // Contact Information - Populate with existing data
      street_name: client.street_name || '',
      house_number: client.house_number || '',
      area_of_residence: client.area_of_residence || '',
      housing_type: client.housing_type || '',
      
      // Next of Kin Details - Populate with existing data
      next_of_kin_name: client.next_of_kin_name || '',
      next_of_kin_relationship: client.next_of_kin_relationship || '',
      next_of_kin_phone: client.next_of_kin_phone || '',
      next_of_kin_address: client.next_of_kin_address || '',
      
      // Employment Information - Populate with existing data
      employment_status: client.employment_status || '' as 'employed' | 'self_employed' | 'volunteer' | 'unemployed' | 'retired' | 'student',
      company_name: client.company_name || '',
      office_location: client.office_location || '',
      position: client.position || '',
      years_of_employment: client.years_of_employment || '',
      net_monthly_salary: client.net_monthly_salary || '',
      salary_slip_uploaded: client.salary_slip_uploaded || false,
      employment_contact_person: client.employment_contact_person || '',
      employment_contact_phone: client.employment_contact_phone || '',
      
      // Financial Information - Populate with existing data
      bank_name: client.bank_name || '',
      bank_account_number: client.bank_account_number || '',
      bank_branch: client.bank_branch || '',
      mobile_money_provider: client.mobile_money_provider || '',
      mobile_money_number: client.mobile_money_number || '',
      monthly_expenses: client.monthly_expenses || '',
      existing_debts: client.existing_debts || '',
      asset_ownership: client.asset_ownership || '',
      
      // Business Details
      business_name: '',
      business_location: '',
      average_monthly_income: '',
      type_of_business: '',
      since_when_business: '',
      
      // Household/Dependents Information
      number_of_dependents: '',
      household_income_contributors: '',
      living_arrangements: '',
      education_expenses: '',
      
      // Spouse Information
      spouse_name: '',
      
      // Group Information
      group_name: '',
      group_type: '',
      group_description: '',
      meeting_frequency: '',
      meeting_day: '',
      meeting_time: '',
      meeting_location: '',
      guarantee_model: '',
      guarantee_value: '',
      
      // Corporate Information (for corporate clients)
      company_registration_number: '',
      tax_identification_number: '',
      legal_structure: '',
      date_of_incorporation: '',
      country_of_incorporation: '',
      industry_sector: '',
      business_description: '',
      number_of_employees: '',
      annual_turnover: '',
      years_in_operation: '',
      registered_address: '',
      physical_address: '',
      website: '',
      primary_contact_person: '',
      authorized_signatories: '',
      
      // Verification and Documents
      kyc_status: 'pending' as 'pending' | 'verified' | 'rejected',
      id_document_uploaded: false,
      passport_photo_uploaded: false,
      fingerprint_uploaded: false,
      digital_signature_uploaded: false,
      voice_print_uploaded: false,
      facial_recognition_uploaded: false,
      
      // Document URLs
      id_document_url: '',
      passport_photo_url: '',
      fingerprint_url: '',
      salary_slip_url: '',
      digital_signature_url: '',
      voice_print_url: '',
      facial_recognition_url: '',
      
      // === ENHANCED REGULATORY DATA CAPTURE ===
      
      // Geographic Data (MSP2_10 - Geographical Distribution)
      region_code: '',
      district_code: '',
      ward_code: '',
      branch_assignment: '',
      gps_coordinates: '',
      address_verification_status: 'pending' as 'pending' | 'verified' | 'failed',
      
      // Enhanced Demographic Data (MSP2_09, MSP2_10)
      education_level: '',
      age_group: '', // Auto-calculated from date_of_birth
      household_size: '',
      income_bracket: '',
      
      // Economic Sector Classification (MSP2_03, MSP2_09)
      primary_business_sector: '',
      secondary_business_sector: '',
      business_sector_confidence: 0, // AI confidence score
      business_activity_description: '',
      annual_income: '',
      monthly_business_income: '',
      business_registration_number: '',
      business_license_number: '',
      
      // Enhanced Risk Management
      guarantor_type: '' as 'individual' | 'group' | 'employer' | 'asset' | 'none',
      guarantor_details: '',
      collateral_type: '',
      collateral_value: '',
      collateral_description: '',
      risk_rating: 'low' as 'low' | 'medium' | 'high',
      risk_factors: [] as string[],
      
      // Enhanced Compliance Data
      compliance_flags: [] as string[],
      aml_risk_level: 'low' as 'low' | 'medium' | 'high',
      pep_status: false, // Politically Exposed Person
      sanctions_check_status: 'pending' as 'pending' | 'clear' | 'flagged',
      credit_bureau_score: '',
      credit_bureau_status: 'pending' as 'pending' | 'verified' | 'failed',
      
      // Regulatory Reporting Fields
      reporting_region: '',
      reporting_district: '',
      gender_for_reporting: '' as 'Male' | 'Female',
      age_group_for_reporting: '' as 'Up35' | 'Above35',
      sector_for_reporting: '',
      loan_purpose_category: '',
      
      // Additional KYC Fields
      kyc_completion_percentage: 0,
      kyc_required_documents: [] as string[],
      kyc_uploaded_documents: [] as string[],
      kyc_verification_date: '',
      kyc_verified_by: '',
      kyc_notes: '',
      
      // Data Quality Flags
      data_quality_score: 0,
      missing_required_fields: [] as string[],
      data_validation_errors: [] as string[],
      last_data_validation: '',
      
      // Regulatory Compliance
      regulatory_status: 'compliant' as 'compliant' | 'non_compliant' | 'under_review',
      compliance_review_date: '',
      compliance_reviewer: '',
      compliance_notes: ''
    });
    // Reset file states
    setUploadedFiles({});
    // setUploadedFileUrls({}); // Removed unused call
  };

  const handleEditClientModal = (client: any) => {
    setSelectedClient(client);
    setIsEditing(true);
    setNewClientData({
      // Client Type Selection
      client_type: client.client_type || 'individual' as 'individual' | 'corporate' | 'group',
      client_category: client.client_category || 'new' as 'new' | 'existing',
      
      // Personal Information (Individual)
      first_name: client.first_name || '',
      middle_name: client.middle_name || '',
      last_name: client.last_name || '',
      gender: client.gender || '',
      phone_number: client.phone_number || '',
      email_address: client.email_address || '',
      marital_status: client.marital_status || '',
      date_of_birth: client.date_of_birth || '',
      national_id_number: client.national_id_number || '',
      id_type: client.id_type || '',
      
      // Contact Information
      street_name: client.street_name || '',
      house_number: client.house_number || '',
      area_of_residence: client.area_of_residence || '',
      housing_type: client.housing_type || '',
      
      // Next of Kin Details
      next_of_kin_name: client.next_of_kin_name || '',
      next_of_kin_relationship: client.next_of_kin_relationship || '',
      next_of_kin_phone: client.next_of_kin_phone || '',
      next_of_kin_address: client.next_of_kin_address || '',
      
      // Employment Information
      employment_status: client.employment_status || '' as 'employed' | 'self_employed' | 'volunteer' | 'unemployed' | 'retired' | 'student',
      company_name: client.company_name || '',
      office_location: client.office_location || '',
      position: client.position || '',
      years_of_employment: client.years_of_employment || '',
      net_monthly_salary: client.net_monthly_salary || '',
      salary_slip_uploaded: client.salary_slip_uploaded || false,
      employment_contact_person: client.employment_contact_person || '',
      employment_contact_phone: client.employment_contact_phone || '',
      
      // Financial Information
      bank_name: client.bank_name || '',
      bank_account_number: client.bank_account_number || '',
      bank_branch: client.bank_branch || '',
      mobile_money_provider: client.mobile_money_provider || '',
      mobile_money_number: client.mobile_money_number || '',
      monthly_expenses: client.monthly_expenses || '',
      existing_debts: client.existing_debts || '',
      asset_ownership: client.asset_ownership || '',
      
      // Business Details
      business_name: client.business_name || '',
      business_location: client.business_location || '',
      average_monthly_income: client.average_monthly_income || '',
      type_of_business: client.type_of_business || '',
      since_when_business: client.since_when_business || '',
      
      // Household/Dependents Information
      number_of_dependents: client.number_of_dependents || '',
      household_income_contributors: client.household_income_contributors || '',
      living_arrangements: client.living_arrangements || '',
      education_expenses: client.education_expenses || '',
      
      // Spouse Information
      spouse_name: client.spouse_name || '',
      
      // Group Information
      group_name: client.group_name || '',
      group_type: client.group_type || '',
      group_description: client.group_description || '',
      meeting_frequency: client.meeting_frequency || '',
      meeting_day: client.meeting_day || '',
      meeting_time: client.meeting_time || '',
      meeting_location: client.meeting_location || '',
      guarantee_model: client.guarantee_model || '',
      guarantee_value: client.guarantee_value || '',
      
      // Corporate Information (for corporate clients)
      company_registration_number: client.company_registration_number || '',
      tax_identification_number: client.tax_identification_number || '',
      legal_structure: client.legal_structure || '',
      date_of_incorporation: client.date_of_incorporation || '',
      country_of_incorporation: client.country_of_incorporation || '',
      industry_sector: client.industry_sector || '',
      business_description: client.business_description || '',
      number_of_employees: client.number_of_employees || '',
      annual_turnover: client.annual_turnover || '',
      years_in_operation: client.years_in_operation || '',
      registered_address: client.registered_address || '',
      physical_address: client.physical_address || '',
      website: client.website || '',
      primary_contact_person: client.primary_contact_person || '',
      authorized_signatories: client.authorized_signatories || '',
      
      // Verification and Documents
      kyc_status: client.kyc_status || 'pending' as 'pending' | 'verified' | 'rejected',
      id_document_uploaded: client.id_document_uploaded || false,
      passport_photo_uploaded: client.passport_photo_uploaded || false,
      fingerprint_uploaded: client.fingerprint_uploaded || false,
      digital_signature_uploaded: client.digital_signature_uploaded || false,
      voice_print_uploaded: client.voice_print_uploaded || false,
      facial_recognition_uploaded: client.facial_recognition_uploaded || false,
      
      // Document URLs
      id_document_url: client.id_document_url || '',
      passport_photo_url: client.passport_photo_url || '',
      fingerprint_url: client.fingerprint_url || '',
      salary_slip_url: client.salary_slip_url || '',
      digital_signature_url: client.digital_signature_url || '',
      voice_print_url: client.voice_print_url || '',
      facial_recognition_url: client.facial_recognition_url || '',
      
      // === ENHANCED REGULATORY DATA CAPTURE ===
      
      // Geographic Data (MSP2_10 - Geographical Distribution)
      region_code: client.region_code || '',
      district_code: client.district_code || '',
      ward_code: client.ward_code || '',
      branch_assignment: client.branch_assignment || '',
      gps_coordinates: client.gps_coordinates || '',
      address_verification_status: client.address_verification_status || 'pending' as 'pending' | 'verified' | 'failed',
      
      // Enhanced Demographic Data (MSP2_09, MSP2_10)
      education_level: client.education_level || '',
      age_group: client.age_group || '',
      household_size: client.household_size || '',
      income_bracket: client.income_bracket || '',
      
      // Economic Sector Classification (MSP2_03, MSP2_09)
      primary_business_sector: client.primary_business_sector || '',
      secondary_business_sector: client.secondary_business_sector || '',
      business_sector_confidence: client.business_sector_confidence || 0,
      business_activity_description: client.business_activity_description || '',
      annual_income: client.annual_income || '',
      monthly_business_income: client.monthly_business_income || '',
      business_registration_number: client.business_registration_number || '',
      business_license_number: client.business_license_number || '',
      
      // Enhanced Risk Management
      guarantor_type: client.guarantor_type || '' as 'individual' | 'group' | 'employer' | 'asset' | 'none',
      guarantor_details: client.guarantor_details || '',
      collateral_type: client.collateral_type || '',
      collateral_value: client.collateral_value || '',
      collateral_description: client.collateral_description || '',
      risk_rating: client.risk_rating || 'low' as 'low' | 'medium' | 'high',
      risk_factors: client.risk_factors || [] as string[],
      
      // Enhanced Compliance Data
      compliance_flags: client.compliance_flags || [] as string[],
      aml_risk_level: client.aml_risk_level || 'low' as 'low' | 'medium' | 'high',
      pep_status: client.pep_status || false,
      sanctions_check_status: client.sanctions_check_status || 'pending' as 'pending' | 'clear' | 'flagged',
      credit_bureau_score: client.credit_bureau_score || '',
      credit_bureau_status: client.credit_bureau_status || 'pending' as 'pending' | 'verified' | 'failed',
      
      // Regulatory Reporting Fields
      reporting_region: client.reporting_region || '',
      reporting_district: client.reporting_district || '',
      gender_for_reporting: client.gender_for_reporting || '' as 'Male' | 'Female',
      age_group_for_reporting: client.age_group_for_reporting || '' as 'Up35' | 'Above35',
      sector_for_reporting: client.sector_for_reporting || '',
      loan_purpose_category: client.loan_purpose_category || '',
      
      // Additional KYC Fields
      kyc_completion_percentage: client.kyc_completion_percentage || 0,
      kyc_required_documents: client.kyc_required_documents || [] as string[],
      kyc_uploaded_documents: client.kyc_uploaded_documents || [] as string[],
      kyc_verification_date: client.kyc_verification_date || '',
      kyc_verified_by: client.kyc_verified_by || '',
      kyc_notes: client.kyc_notes || '',
      
      // Data Quality Flags
      data_quality_score: client.data_quality_score || 0,
      missing_required_fields: client.missing_required_fields || [] as string[],
      data_validation_errors: client.data_validation_errors || [] as string[],
      last_data_validation: client.last_data_validation || '',
      
      // Regulatory Compliance
      regulatory_status: client.regulatory_status || 'compliant' as 'compliant' | 'non_compliant' | 'under_review',
      compliance_review_date: client.compliance_review_date || '',
      compliance_reviewer: client.compliance_reviewer || '',
      compliance_notes: client.compliance_notes || ''
    });
    setShowAddClient(true);
    setIsEditing(true);
  };

  const handleArchiveClient = (client: any) => {
    setClientToArchive(client);
    setShowArchiveModal(true);
  };

  const confirmArchiveClient = async () => {
    if (clientToArchive) {
      try {
        await deleteClient(clientToArchive.id);
        toast.success('Client archived successfully');
        setShowArchiveModal(false);
        setClientToArchive(null);
      } catch (error) {
        toast.error('Failed to archive client');
        console.error('Error archiving client:', error);
      }
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) return;
    
    try {
      await updateClient(selectedClient.id, {
        ...newClientData,
        updated_at: new Date().toISOString(),
        kyc_status: 'pending' // Reset KYC status when client is updated
      });
      
      toast.success('Client updated successfully');
      setIsEditing(false);
      setSelectedClient(null);
      setNewClientData({
        // Reset form data
        client_type: 'individual' as 'individual' | 'corporate' | 'group',
        client_category: 'new' as 'new' | 'existing',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        phone_number: '',
        email_address: '',
        marital_status: '',
        date_of_birth: '',
        national_id_number: '',
        id_type: '',
        street_name: '',
        house_number: '',
        area_of_residence: '',
        housing_type: '',
        next_of_kin_name: '',
        next_of_kin_relationship: '',
        next_of_kin_phone: '',
        next_of_kin_address: '',
        employment_status: '' as 'employed' | 'self_employed' | 'volunteer' | 'unemployed' | 'retired' | 'student',
        company_name: '',
        office_location: '',
        position: '',
        years_of_employment: '',
        net_monthly_salary: '',
        salary_slip_uploaded: false,
        employment_contact_person: '',
        employment_contact_phone: '',
        bank_name: '',
        bank_account_number: '',
        bank_branch: '',
        mobile_money_provider: '',
        mobile_money_number: '',
        monthly_expenses: '',
        existing_debts: '',
        asset_ownership: '',
        business_name: '',
        business_location: '',
        average_monthly_income: '',
        type_of_business: '',
        since_when_business: '',
        number_of_dependents: '',
        household_income_contributors: '',
        living_arrangements: '',
        education_expenses: '',
        spouse_name: '',
        group_name: '',
        group_type: '',
        group_chairman_name: '',
        group_chairman_phone: '',
        group_secretary_name: '',
        group_secretary_phone: '',
        group_treasurer_name: '',
        group_treasurer_phone: '',
        group_bank_name: '',
        group_bank_account: '',
        group_bank_branch: '',
        group_savings_amount: '',
        group_loan_amount: '',
        group_guarantee_amount: '',
        group_meeting_attendance: '',
        group_loan_history: '',
        group_repayment_history: '',
        group_guarantee_history: '',
        group_meeting_minutes: '',
        group_financial_records: '',
        group_legal_documents: '',
        group_other_documents: ''
      });
    } catch (error) {
      toast.error('Failed to update client');
      console.error('Error updating client:', error);
    }
  };

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
  };

  const handleKYCVerification = async (client: any, status: 'verified' | 'rejected') => {
    try {
      await updateClient(client.id, {
        kyc_status: status,
        kyc_verified_at: status === 'verified' ? new Date().toISOString() : null,
        kyc_verified_by: 'current_user_id', // This should be the actual user ID
        updated_at: new Date().toISOString()
      });
      
      toast.success(`Client KYC ${status} successfully`);
    } catch (error) {
      toast.error(`Failed to ${status} client KYC`);
      console.error('Error updating KYC status:', error);
    }
  };

  const calculateCreditScore = (client: any) => {
    let score = 0;
    
    // Base score
    score += 300;
    
    // KYC verification
    if (client.kyc_status === 'verified') score += 100;
    
    // Employment status
    if (client.employment_status === 'employed') score += 50;
    else if (client.employment_status === 'self_employed') score += 30;
    
    // Income level (if available)
    if (client.net_monthly_salary) {
      const salary = parseFloat(client.net_monthly_salary);
      if (salary > 1000000) score += 50;
      else if (salary > 500000) score += 30;
      else if (salary > 200000) score += 20;
    }
    
    // Bank account
    if (client.bank_account_number) score += 30;
    
    // Mobile money
    if (client.mobile_money_number) score += 20;
    
    // Dependents (fewer is better for credit)
    if (client.number_of_dependents) {
      const dependents = parseInt(client.number_of_dependents);
      if (dependents <= 2) score += 20;
      else if (dependents <= 4) score += 10;
    }
    
    // Cap the score at 850
    return Math.min(score, 850);
  };

  // Handle file selection
  const handleFileSelect = (fileType: keyof typeof uploadedFiles, file: File | null) => {
    if (file) {
      // Validate file
      const validation = FileUploadService.validateFile(file, fileType as any);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: file
      }));

      // Update the boolean flag
      setNewClientData(prev => ({
        ...prev,
        [`${fileType}_uploaded`]: true
      }));

      toast.success(`${fileType.replace('_', ' ')} file selected successfully`);
    } else {
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fileType];
        return newFiles;
      });

      setNewClientData(prev => ({
        ...prev,
        [`${fileType}_uploaded`]: false
      }));
    }
  };

  // Upload files to Supabase storage
  const uploadFilesToStorage = async (clientId: string) => {
    const filesToUpload = Object.entries(uploadedFiles).filter(([_, file]) => file);
    
    if (filesToUpload.length === 0) {
      return {};
    }

    setUploadingFiles(true);
    const uploadResults: { [key: string]: string } = {};

    try {
      for (const [fileType, file] of filesToUpload) {
        if (file) {
          const result = await FileUploadService.uploadFile(
            file, 
            fileType as any, 
            clientId
          );

          if (result.success && result.url) {
            uploadResults[`${fileType}_url`] = result.url;
            toast.success(`${fileType.replace('_', ' ')} uploaded successfully`);
          } else {
            toast.error(`Failed to upload ${fileType.replace('_', ' ')}: ${result.error}`);
          }
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Error uploading files');
    } finally {
      setUploadingFiles(false);
    }

    return uploadResults;
  };

  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let clientId: string;

      if (isEditing && selectedClient) {
        // Update existing client
        const clientData = DynamicDataService.updateTimestamps({
          ...newClientData
        });

        // Upload files if any
        const fileUrls = await uploadFilesToStorage(selectedClient.id);
        
        // Update client with file URLs
        const updatedClientData = {
          ...clientData,
          ...fileUrls
        };

        await updateClient(selectedClient.id, updatedClientData);
        toast.success('Client updated successfully');
        clientId = selectedClient.id;
      } else {
        // Create new client first
        const clientData = DynamicDataService.generateClientData({
          ...newClientData,
          role: 'client'
        });

        const newClient = await insertClient(clientData);
        if (!newClient) {
          throw new Error('Failed to create client');
        }

        clientId = newClient.id;

        // Upload files after client creation
        const fileUrls = await uploadFilesToStorage(clientId);
        
        // Update client with file URLs
        if (Object.keys(fileUrls).length > 0) {
          await updateClient(clientId, fileUrls);
        }

        toast.success('Client added successfully');

        // If this is a group client, create the group in the database
        if (newClientData.client_type === 'group' && newClientData.group_name) {
          try {
            const groupResult = await GroupService.createGroupFromClient(newClientData);
            if (groupResult.success) {
              toast.success('Group created successfully and is now available in Group Management');
            } else {
              toast.error(`Client created but group creation failed: ${groupResult.error}`);
            }
          } catch (error) {
            console.error('Error creating group from client:', error);
            toast.error('Client created but group creation failed');
          }
        }
      }

      setShowAddClient(false);
      setSelectedClient(null);
      setIsEditing(false);
      // Reset file states
      setUploadedFiles({});
      // setUploadedFileUrls({}); // Removed unused call
    } catch (error) {
      toast.error('Failed to save client');
      console.error('Error saving client:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'No Active Loans': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('clients')} Management</h1>
              <p className="text-blue-100">
                Manage client information, KYC verification, and client relationships
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddClient}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('add_client')}
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, NIN, phone, email, company, or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Advanced
              </button>
              <button
                onClick={refreshClients}
                disabled={clientsLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center"
              >
                {clientsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {clientsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Advanced Search Filters */}
          {showAdvancedSearch && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Field Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search In
                  </label>
                  <select
                    value={searchFilters.searchField}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, searchField: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Fields</option>
                    <option value="name">Name Only</option>
                    <option value="nin">NIN Only</option>
                    <option value="phone">Phone Only</option>
                    <option value="email">Email Only</option>
                    <option value="company">Company Only</option>
                    <option value="group">Group Only</option>
                  </select>
                </div>

                {/* Client Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Type
                  </label>
                  <select
                    value={searchFilters.clientType}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, clientType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporate</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={searchFilters.status}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* KYC Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    KYC Status
                  </label>
                  <select
                    value={searchFilters.kycStatus}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All KYC Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchFilters({
                      clientType: '',
                      status: '',
                      kycStatus: '',
                      searchField: 'all'
                    });
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Client List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Client List</h3>
              <div className="text-sm text-gray-600">
                {filteredClients.length} of {clients.length} clients
                {(searchTerm || searchFilters.clientType || searchFilters.status || searchFilters.kycStatus) && (
                  <span className="ml-2 text-blue-600">(filtered)</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Manage client profiles, KYC verification, and group lending
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading clients...
                      </div>
                    </td>
                  </tr>
                ) : clientsError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                      Error loading clients: {clientsError}
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.full_name || 
                           (client.client_type === 'individual' ? 
                             `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Individual Client' :
                             client.client_type === 'corporate' ? 
                             client.company_name || 'Corporate Client' :
                             client.client_type === 'group' ? 
                             client.group_name || 'Group Client' :
                             `Client (${client.phone_number || client.id})`)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.kyc_status || 'pending')}`}>
                        {client.kyc_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.loan_status || 'No Active Loans')}`}>
                        {client.loan_status || 'No Active Loans'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.client_type?.charAt(0).toUpperCase() + client.client_type?.slice(1) || 'Individual'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.credit_score || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEditClientModal(client)}
                          className="px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleArchiveClient(client)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Details Modal */}
        {selectedClient && !isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Client Details</h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Client Type</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedClient.client_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.status || 'active')}`}>
                        {selectedClient.status || 'Active'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">KYC Status</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.kyc_status || 'pending')}`}>
                        {selectedClient.kyc_status || 'Pending'}
                      </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="text-sm text-gray-900">{selectedClient.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedClient.email_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID</label>
                    <p className="text-sm text-gray-900">{selectedClient.national_id_number || 'N/A'}</p>
                  </div>
                  </div>
                </div>

                {/* Individual Client Details */}
                {selectedClient.client_type === 'individual' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="text-sm text-gray-900">
                          {`${selectedClient.first_name || ''} ${selectedClient.middle_name || ''} ${selectedClient.last_name || ''}`.trim() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedClient.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <p className="text-sm text-gray-900">{selectedClient.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedClient.marital_status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ID Type</label>
                        <p className="text-sm text-gray-900">{selectedClient.id_type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">TIN Number</label>
                        <p className="text-sm text-gray-900">{selectedClient.tin_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Corporate Client Details */}
                {selectedClient.client_type === 'corporate' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Business Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <p className="text-sm text-gray-900">{selectedClient.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                        <p className="text-sm text-gray-900">{selectedClient.registration_number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                        <p className="text-sm text-gray-900">{selectedClient.tax_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Type</label>
                        <p className="text-sm text-gray-900">{selectedClient.business_type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Industry</label>
                        <p className="text-sm text-gray-900">{selectedClient.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Size</label>
                        <p className="text-sm text-gray-900">{selectedClient.company_size || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Director Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Director Name</label>
                          <p className="text-sm text-gray-900">
                            {`${selectedClient.director_first_name || ''} ${selectedClient.director_last_name || ''}`.trim() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Director Phone</label>
                          <p className="text-sm text-gray-900">{selectedClient.director_phone_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Director Email</label>
                          <p className="text-sm text-gray-900">{selectedClient.director_email_address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Group Client Details */}
                {selectedClient.client_type === 'group' && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Group Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Group Name</label>
                        <p className="text-sm text-gray-900">{selectedClient.group_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Group Type</label>
                        <p className="text-sm text-gray-900">{selectedClient.group_type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Group Size</label>
                        <p className="text-sm text-gray-900">{selectedClient.group_size || 'N/A'} members</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Group Leader</label>
                        <p className="text-sm text-gray-900">{selectedClient.group_leader || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Group Address</label>
                        <p className="text-sm text-gray-900">{selectedClient.group_address || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Group Leadership</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Chairman</label>
                          <p className="text-sm text-gray-900">
                            {`${selectedClient.chairman_first_name || ''} ${selectedClient.chairman_last_name || ''}`.trim() || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">{selectedClient.chairman_phone_number || ''}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Secretary</label>
                          <p className="text-sm text-gray-900">
                            {`${selectedClient.secretary_first_name || ''} ${selectedClient.secretary_last_name || ''}`.trim() || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">{selectedClient.secretary_phone_number || ''}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Treasurer</label>
                          <p className="text-sm text-gray-900">
                            {`${selectedClient.treasurer_first_name || ''} ${selectedClient.treasurer_last_name || ''}`.trim() || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">{selectedClient.treasurer_phone_number || ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Region</label>
                      <p className="text-sm text-gray-900">{selectedClient.region || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">District</label>
                      <p className="text-sm text-gray-900">{selectedClient.district || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ward</label>
                      <p className="text-sm text-gray-900">{selectedClient.ward || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Street Name</label>
                      <p className="text-sm text-gray-900">{selectedClient.street_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">House Number</label>
                      <p className="text-sm text-gray-900">{selectedClient.house_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nearest Landmark</label>
                      <p className="text-sm text-gray-900">{selectedClient.nearest_landmark || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Financial Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monthly Income</label>
                      <p className="text-sm text-gray-900">
                        {selectedClient.monthly_income ? `TZS ${parseInt(selectedClient.monthly_income).toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <p className="text-sm text-gray-900">{selectedClient.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number</label>
                      <p className="text-sm text-gray-900">{selectedClient.account_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employment Status</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedClient.employment_status || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <p className="text-sm text-gray-900">{selectedClient.occupation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employer Name</label>
                      <p className="text-sm text-gray-900">{selectedClient.employer_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">System Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedClient.id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created At</label>
                      <p className="text-sm text-gray-900">{selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Updated At</label>
                      <p className="text-sm text-gray-900">{selectedClient.updated_at ? new Date(selectedClient.updated_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedClient.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        selectedClient.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedClient.risk_level || 'Medium'}
                    </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Credit Score</label>
                      <p className="text-sm text-gray-900">{selectedClient.credit_score || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Client' : 'Add New Client'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddClient(false);
                    setIsEditing(false);
                    setSelectedClient(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddClientSubmit} className="space-y-6">
                {/* Client Type Selection */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Client Type Selection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Type *</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="client_type"
                            value="individual"
                            checked={newClientData.client_type === 'individual'}
                            onChange={(e) => setNewClientData({...newClientData, client_type: e.target.value as 'individual' | 'corporate' | 'group'})}
                            className="mr-2"
                          />
                          Individual Person
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="client_type"
                            value="corporate"
                            checked={newClientData.client_type === 'corporate'}
                            onChange={(e) => setNewClientData({...newClientData, client_type: e.target.value as 'individual' | 'corporate' | 'group'})}
                            className="mr-2"
                          />
                          Corporate/Entity
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="client_type"
                            value="group"
                            checked={newClientData.client_type === 'group'}
                            onChange={(e) => setNewClientData({...newClientData, client_type: e.target.value as 'individual' | 'corporate' | 'group'})}
                            className="mr-2"
                          />
                          Group
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Client Form */}
                {newClientData.client_type === 'individual' && (
                  <>
                    {/* Personal Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Details of the Applicant</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.first_name}
                        onChange={(e) => setNewClientData({...newClientData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={newClientData.middle_name}
                        onChange={(e) => setNewClientData({...newClientData, middle_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.last_name}
                        onChange={(e) => setNewClientData({...newClientData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        required
                        value={newClientData.gender}
                        onChange={(e) => setNewClientData({...newClientData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male (Me)</option>
                        <option value="Female">Female (Ke)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newClientData.phone_number}
                        onChange={(e) => setNewClientData({...newClientData, phone_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newClientData.email_address}
                        onChange={(e) => setNewClientData({...newClientData, email_address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status *</label>
                      <select
                        required
                        value={newClientData.marital_status}
                        onChange={(e) => setNewClientData({...newClientData, marital_status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Married">Married (Ameoa/Olewa)</option>
                        <option value="Engaged">Engaged (Ameoa/Olewa)</option>
                        <option value="Single">Single (Hajaoa/Olewa)</option>
                        <option value="Divorced">Divorced (Ameachika)</option>
                        <option value="Widowed">Widowed (Mjane/Mgane)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={newClientData.date_of_birth}
                        onChange={(e) => setNewClientData({...newClientData, date_of_birth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Next of Kin Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Next of Kin Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next of Kin Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.next_of_kin_name}
                        onChange={(e) => setNewClientData({...newClientData, next_of_kin_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                      <select
                        required
                        value={newClientData.next_of_kin_relationship}
                        onChange={(e) => setNewClientData({...newClientData, next_of_kin_relationship: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newClientData.next_of_kin_phone}
                        onChange={(e) => setNewClientData({...newClientData, next_of_kin_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.next_of_kin_address}
                        onChange={(e) => setNewClientData({...newClientData, next_of_kin_address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Current Residence Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Current Residence Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Name *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.street_name}
                        onChange={(e) => setNewClientData({...newClientData, street_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House Number *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.house_number}
                        onChange={(e) => setNewClientData({...newClientData, house_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Area of Residence *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.area_of_residence}
                        onChange={(e) => setNewClientData({...newClientData, area_of_residence: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Housing Type *</label>
                      <select
                        required
                        value={newClientData.housing_type}
                        onChange={(e) => setNewClientData({...newClientData, housing_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="Own">Own (Kwako)</option>
                        <option value="Rented">Rented (Umepanga)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spouse's Full Name</label>
                      <input
                        type="text"
                        value={newClientData.spouse_name}
                        onChange={(e) => setNewClientData({...newClientData, spouse_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
                      <select
                        required
                        value={newClientData.employment_status}
                        onChange={(e) => setNewClientData({...newClientData, employment_status: e.target.value as 'employed' | 'self_employed' | 'volunteer' | 'unemployed' | 'retired' | 'student'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Employment Status</option>
                        <option value="employed">Employed (Formal employment)</option>
                        <option value="self_employed">Self-employed/Entrepreneur</option>
                        <option value="volunteer">Volunteer/Unpaid work</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="retired">Retired</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company/Employer Name</label>
                      <input
                        type="text"
                        value={newClientData.company_name}
                        onChange={(e) => setNewClientData({...newClientData, company_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                      <input
                        type="text"
                        value={newClientData.office_location}
                        onChange={(e) => setNewClientData({...newClientData, office_location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title/Position</label>
                      <input
                        type="text"
                        value={newClientData.position}
                        onChange={(e) => setNewClientData({...newClientData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Duration (Years)</label>
                      <input
                        type="text"
                        value={newClientData.years_of_employment}
                        onChange={(e) => setNewClientData({...newClientData, years_of_employment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                      <input
                        type="number"
                        value={newClientData.net_monthly_salary}
                        onChange={(e) => setNewClientData({...newClientData, net_monthly_salary: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Contact Person</label>
                      <input
                        type="text"
                        value={newClientData.employment_contact_person}
                        onChange={(e) => setNewClientData({...newClientData, employment_contact_person: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
                      <input
                        type="tel"
                        value={newClientData.employment_contact_phone}
                        onChange={(e) => setNewClientData({...newClientData, employment_contact_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Month's Salary Slip</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('salary_slip', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.salary_slip_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.salary_slip && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.salary_slip.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Financial Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={newClientData.bank_name}
                        onChange={(e) => setNewClientData({...newClientData, bank_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={newClientData.bank_account_number}
                        onChange={(e) => setNewClientData({...newClientData, bank_account_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                      <input
                        type="text"
                        value={newClientData.bank_branch}
                        onChange={(e) => setNewClientData({...newClientData, bank_branch: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Money Provider</label>
                      <select
                        value={newClientData.mobile_money_provider}
                        onChange={(e) => setNewClientData({...newClientData, mobile_money_provider: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Provider</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="tigopesa">Tigo Pesa</option>
                        <option value="airtelmoney">Airtel Money</option>
                        <option value="halopesa">Halo Pesa</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Money Number</label>
                      <input
                        type="tel"
                        value={newClientData.mobile_money_number}
                        onChange={(e) => setNewClientData({...newClientData, mobile_money_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses</label>
                      <input
                        type="number"
                        value={newClientData.monthly_expenses}
                        onChange={(e) => setNewClientData({...newClientData, monthly_expenses: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Existing Debts/Obligations</label>
                      <input
                        type="number"
                        value={newClientData.existing_debts}
                        onChange={(e) => setNewClientData({...newClientData, existing_debts: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asset Ownership</label>
                      <textarea
                        value={newClientData.asset_ownership}
                        onChange={(e) => setNewClientData({...newClientData, asset_ownership: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="List owned assets (house, car, land, etc.)"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Details - Only for Self-Employed Individuals */}
                {newClientData.employment_status === 'self_employed' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Business Details (Self-Employed)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                        <input
                          type="text"
                          value={newClientData.business_name}
                          onChange={(e) => setNewClientData({...newClientData, business_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Location</label>
                        <input
                          type="text"
                          value={newClientData.business_location}
                          onChange={(e) => setNewClientData({...newClientData, business_location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Start Date</label>
                        <input
                          type="text"
                          value={newClientData.since_when_business}
                          onChange={(e) => setNewClientData({...newClientData, since_when_business: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 2 years"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Household/Dependents Information - Only for Individual Clients */}
                {newClientData.client_type === 'individual' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Household/Dependents Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Dependents</label>
                      <input
                        type="number"
                        value={newClientData.number_of_dependents}
                        onChange={(e) => setNewClientData({...newClientData, number_of_dependents: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Household Income Contributors</label>
                      <input
                        type="number"
                        value={newClientData.household_income_contributors}
                        onChange={(e) => setNewClientData({...newClientData, household_income_contributors: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Living Arrangements</label>
                      <select
                        value={newClientData.living_arrangements}
                        onChange={(e) => setNewClientData({...newClientData, living_arrangements: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Living Arrangement</option>
                        <option value="alone">Living Alone</option>
                        <option value="with_family">With Family</option>
                        <option value="with_roommates">With Roommates</option>
                        <option value="with_spouse">With Spouse</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education Expenses (Monthly)</label>
                      <input
                        type="number"
                        value={newClientData.education_expenses}
                        onChange={(e) => setNewClientData({...newClientData, education_expenses: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* ID and Verification */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">ID and Verification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type of ID *</label>
                      <select
                        required
                        value={newClientData.id_type}
                        onChange={(e) => setNewClientData({...newClientData, id_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select ID Type</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="National ID">National ID</option>
                        <option value="Voters ID">Voters ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">National ID (NIN) *</label>
                      <input
                        type="text"
                        required
                        value={newClientData.national_id_number}
                        onChange={(e) => setNewClientData({...newClientData, national_id_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID Document Upload</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('id_document', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.id_document_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.id_document && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.id_document.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passport Size Photo Upload</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('passport_photo', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.passport_photo_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.passport_photo && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.passport_photo.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fingerprint Upload (Primary)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('fingerprint', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.fingerprint_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.fingerprint && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.fingerprint.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Digital Signature Capture</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileSelect('digital_signature', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.digital_signature_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.digital_signature && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.digital_signature.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voice Print Recording</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".mp3,.wav,.m4a"
                          onChange={(e) => handleFileSelect('voice_print', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.voice_print_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.voice_print && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.voice_print.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facial Recognition Setup</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('facial_recognition', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newClientData.facial_recognition_uploaded && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {uploadedFiles.facial_recognition && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {uploadedFiles.facial_recognition.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                      <input
                        type="text"
                        value={newClientData.group_name}
                        onChange={(e) => setNewClientData({...newClientData, group_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                  </>
                )}

                {/* Corporate Client Form */}
                {newClientData.client_type === 'corporate' && (
                  <>
                    {/* Entity Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Entity Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization Name *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.company_name}
                            onChange={(e) => setNewClientData({...newClientData, company_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.company_registration_number}
                            onChange={(e) => setNewClientData({...newClientData, company_registration_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Identification Number *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.tax_identification_number}
                            onChange={(e) => setNewClientData({...newClientData, tax_identification_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Legal Structure *</label>
                          <select
                            required
                            value={newClientData.legal_structure}
                            onChange={(e) => setNewClientData({...newClientData, legal_structure: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Legal Structure</option>
                            <option value="limited_company">Limited Company</option>
                            <option value="partnership">Partnership</option>
                            <option value="ngo">NGO</option>
                            <option value="cooperative">Cooperative</option>
                            <option value="sole_proprietorship">Sole Proprietorship</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Incorporation *</label>
                          <input
                            type="date"
                            required
                            value={newClientData.date_of_incorporation}
                            onChange={(e) => setNewClientData({...newClientData, date_of_incorporation: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country of Incorporation *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.country_of_incorporation}
                            onChange={(e) => setNewClientData({...newClientData, country_of_incorporation: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Business Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industry/Sector *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.industry_sector}
                            onChange={(e) => setNewClientData({...newClientData, industry_sector: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees *</label>
                          <input
                            type="number"
                            required
                            value={newClientData.number_of_employees}
                            onChange={(e) => setNewClientData({...newClientData, number_of_employees: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Turnover *</label>
                          <input
                            type="number"
                            required
                            value={newClientData.annual_turnover}
                            onChange={(e) => setNewClientData({...newClientData, annual_turnover: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Years in Operation *</label>
                          <input
                            type="number"
                            required
                            value={newClientData.years_in_operation}
                            onChange={(e) => setNewClientData({...newClientData, years_in_operation: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Description *</label>
                          <textarea
                            required
                            value={newClientData.business_description}
                            onChange={(e) => setNewClientData({...newClientData, business_description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe the nature of your business..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address *</label>
                          <textarea
                            required
                            value={newClientData.registered_address}
                            onChange={(e) => setNewClientData({...newClientData, registered_address: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Physical/Operational Address *</label>
                          <textarea
                            required
                            value={newClientData.physical_address}
                            onChange={(e) => setNewClientData({...newClientData, physical_address: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={newClientData.phone_number}
                            onChange={(e) => setNewClientData({...newClientData, phone_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={newClientData.email_address}
                            onChange={(e) => setNewClientData({...newClientData, email_address: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                          <input
                            type="url"
                            value={newClientData.website}
                            onChange={(e) => setNewClientData({...newClientData, website: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Authorized Representatives */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Authorized Representatives</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Person *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.primary_contact_person}
                            onChange={(e) => setNewClientData({...newClientData, primary_contact_person: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Signatories *</label>
                          <textarea
                            required
                            value={newClientData.authorized_signatories}
                            onChange={(e) => setNewClientData({...newClientData, authorized_signatories: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="List all authorized signatories..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Financial Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.bank_name}
                            onChange={(e) => setNewClientData({...newClientData, bank_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.bank_account_number}
                            onChange={(e) => setNewClientData({...newClientData, bank_account_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.bank_branch}
                            onChange={(e) => setNewClientData({...newClientData, bank_branch: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Legal Documentation */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Legal Documentation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Certificate of Incorporation *</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('id_document', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.id_document_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Clearance Certificate *</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('passport_photo', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.passport_photo_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business License *</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('salary_slip', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.salary_slip_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Memorandum and Articles *</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('fingerprint', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.fingerprint_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Group Client Form */}
                {newClientData.client_type === 'group' && (
                  <>
                    {/* Group Creation */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Comprehensive Group Creation
                      </h4>
                      <p className="text-sm text-blue-700 mb-6">
                        Create a new group that will be available for management in the Group Management system.
                      </p>
                      
                      <div className="space-y-6">
                        {/* Basic Group Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                            <input
                              type="text"
                              required
                              value={newClientData.group_name}
                              onChange={(e) => setNewClientData({...newClientData, group_name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter unique group name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group Type *</label>
                            <select
                              required
                              value={newClientData.legal_structure}
                              onChange={(e) => setNewClientData({...newClientData, legal_structure: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Group Type</option>
                              <option value="solidarity">Solidarity Group</option>
                              <option value="self_help">Self-help Group</option>
                              <option value="investment_club">Investment Club</option>
                              <option value="village_bank">Village Bank</option>
                              <option value="cooperative">Cooperative</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Formation Date *</label>
                            <input
                              type="date"
                              required
                              value={newClientData.date_of_incorporation}
                              onChange={(e) => setNewClientData({...newClientData, date_of_incorporation: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                            <input
                              type="text"
                              value={newClientData.company_registration_number}
                              onChange={(e) => setNewClientData({...newClientData, company_registration_number: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Official registration number"
                            />
                          </div>
                        </div>

                        {/* Group Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Group Description *</label>
                          <textarea
                            required
                            value={newClientData.business_description}
                            onChange={(e) => setNewClientData({...newClientData, business_description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe the group's purpose, objectives, and activities"
                          />
                        </div>

                        {/* Geographic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                            <input
                              type="text"
                              required
                              value={newClientData.reporting_region}
                              onChange={(e) => setNewClientData({...newClientData, reporting_region: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Dar es Salaam"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                            <input
                              type="text"
                              required
                              value={newClientData.reporting_district}
                              onChange={(e) => setNewClientData({...newClientData, reporting_district: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Kinondoni"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ward/Village</label>
                            <input
                              type="text"
                              value={newClientData.area_of_residence}
                              onChange={(e) => setNewClientData({...newClientData, area_of_residence: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ward or village name"
                            />
                          </div>
                        </div>

                        {/* Meeting Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Frequency *</label>
                            <select
                              required
                              value={newClientData.meeting_frequency}
                              onChange={(e) => setNewClientData({...newClientData, meeting_frequency: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Frequency</option>
                              <option value="weekly">Weekly</option>
                              <option value="bi_weekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day *</label>
                            <select
                              required
                              value={newClientData.meeting_day}
                              onChange={(e) => setNewClientData({...newClientData, meeting_day: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Day</option>
                              <option value="monday">Monday</option>
                              <option value="tuesday">Tuesday</option>
                              <option value="wednesday">Wednesday</option>
                              <option value="thursday">Thursday</option>
                              <option value="friday">Friday</option>
                              <option value="saturday">Saturday</option>
                              <option value="sunday">Sunday</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Time *</label>
                            <input
                              type="time"
                              required
                              value={newClientData.meeting_time}
                              onChange={(e) => setNewClientData({...newClientData, meeting_time: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Location *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.registered_address}
                            onChange={(e) => setNewClientData({...newClientData, registered_address: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Community Center, Village Hall"
                          />
                        </div>

                        {/* Guarantee Configuration */}
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h5 className="text-md font-semibold text-yellow-900 mb-3">Guarantee Configuration</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Model *</label>
                              <select
                                required
                                value={newClientData.guarantee_model}
                                onChange={(e) => setNewClientData({...newClientData, guarantee_model: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select Model</option>
                                <option value="fixed_amount">Fixed Amount per Member</option>
                                <option value="percentage">Percentage of Loan Amount</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Value *</label>
                              <input
                                type="number"
                                required
                                step="0.01"
                                value={newClientData.guarantee_value}
                                onChange={(e) => setNewClientData({...newClientData, guarantee_value: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter amount or percentage"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Group Leadership */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Group Leadership</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Group Leader *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.primary_contact_person}
                            onChange={(e) => setNewClientData({...newClientData, primary_contact_person: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Secretary/Treasurer *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.authorized_signatories}
                            onChange={(e) => setNewClientData({...newClientData, authorized_signatories: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Committee Members</label>
                          <textarea
                            value={newClientData.business_description}
                            onChange={(e) => setNewClientData({...newClientData, business_description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="List all committee members and their roles..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Member Management */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Member Management</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Members *</label>
                          <input
                            type="number"
                            required
                            value={newClientData.number_of_employees}
                            onChange={(e) => setNewClientData({...newClientData, number_of_employees: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Contribution Required *</label>
                          <input
                            type="number"
                            required
                            value={newClientData.annual_turnover}
                            onChange={(e) => setNewClientData({...newClientData, annual_turnover: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Entry Requirements</label>
                          <textarea
                            value={newClientData.business_description}
                            onChange={(e) => setNewClientData({...newClientData, business_description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="List entry requirements for new members..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guarantee Structure */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Guarantee Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Individual Guarantee Amount *</label>
                          <input
                            type="number"
                            required
                            value={newClientData.monthly_expenses}
                            onChange={(e) => setNewClientData({...newClientData, monthly_expenses: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Joint Liability Setup</label>
                          <select
                            value={newClientData.living_arrangements}
                            onChange={(e) => setNewClientData({...newClientData, living_arrangements: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Liability Type</option>
                            <option value="joint_liability">Joint Liability</option>
                            <option value="individual_liability">Individual Liability</option>
                            <option value="mixed_liability">Mixed Liability</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Conditions</label>
                          <textarea
                            value={newClientData.asset_ownership}
                            onChange={(e) => setNewClientData({...newClientData, asset_ownership: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe guarantee conditions and default handling procedures..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Group Rules & Policies */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Group Rules & Policies</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Attendance Requirements *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.business_name}
                            onChange={(e) => setNewClientData({...newClientData, business_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 80% attendance required"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Savings Contribution Rules *</label>
                          <input
                            type="text"
                            required
                            value={newClientData.business_location}
                            onChange={(e) => setNewClientData({...newClientData, business_location: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Minimum 10,000 TZS per month"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Disciplinary Measures</label>
                          <textarea
                            value={newClientData.type_of_business}
                            onChange={(e) => setNewClientData({...newClientData, type_of_business: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe disciplinary measures and exit procedures..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Group Verification */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Group Verification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Group Constitution Upload *</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('id_document', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.id_document_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Member Consent Documentation *</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('passport_photo', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.passport_photo_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Group Training Completion Certificate</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('salary_slip', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.salary_slip_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Group Registration Approval</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect('fingerprint', e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {newClientData.fingerprint_uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* === ENHANCED REGULATORY DATA CAPTURE SECTIONS === */}
                
                {/* Geographic Intelligence Panel (MSP2_10) */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🌍</span>
                    Geographic Intelligence Panel (MSP2_10)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region Code *</label>
                      <select
                        required
                        value={newClientData.region_code}
                        onChange={(e) => setNewClientData({...newClientData, region_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Region</option>
                        <option value="01">Arusha</option>
                        <option value="02">Dar es Salaam</option>
                        <option value="03">Dodoma</option>
                        <option value="04">Iringa</option>
                        <option value="05">Kagera</option>
                        <option value="06">Kigoma</option>
                        <option value="07">Kilimanjaro</option>
                        <option value="08">Lindi</option>
                        <option value="09">Manyara</option>
                        <option value="10">Mara</option>
                        <option value="11">Mbeya</option>
                        <option value="12">Morogoro</option>
                        <option value="13">Mtwara</option>
                        <option value="14">Mwanza</option>
                        <option value="15">Njombe</option>
                        <option value="16">Pemba North</option>
                        <option value="17">Pemba South</option>
                        <option value="18">Pwani</option>
                        <option value="19">Rukwa</option>
                        <option value="20">Ruvuma</option>
                        <option value="21">Shinyanga</option>
                        <option value="22">Simiyu</option>
                        <option value="23">Singida</option>
                        <option value="24">Songwe</option>
                        <option value="25">Tabora</option>
                        <option value="26">Tanga</option>
                        <option value="27">Unguja North</option>
                        <option value="28">Unguja South</option>
                        <option value="29">Zanzibar North</option>
                        <option value="30">Zanzibar South</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District Code</label>
                      <input
                        type="text"
                        value={newClientData.district_code}
                        onChange={(e) => setNewClientData({...newClientData, district_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="District Code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ward Code</label>
                      <input
                        type="text"
                        value={newClientData.ward_code}
                        onChange={(e) => setNewClientData({...newClientData, ward_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ward Code"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Assignment</label>
                      <select
                        value={newClientData.branch_assignment}
                        onChange={(e) => setNewClientData({...newClientData, branch_assignment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Branch</option>
                        <option value="HQ">Headquarters</option>
                        <option value="BR001">Branch 001</option>
                        <option value="BR002">Branch 002</option>
                        <option value="BR003">Branch 003</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GPS Coordinates</label>
                      <input
                        type="text"
                        value={newClientData.gps_coordinates}
                        onChange={(e) => setNewClientData({...newClientData, gps_coordinates: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Lat, Lng (e.g., -6.7924, 39.2083)"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Verification Status</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="address_verification_status"
                          value="pending"
                          checked={newClientData.address_verification_status === 'pending'}
                          onChange={(e) => setNewClientData({...newClientData, address_verification_status: e.target.value as 'pending' | 'verified' | 'failed'})}
                          className="mr-2"
                        />
                        Pending
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="address_verification_status"
                          value="verified"
                          checked={newClientData.address_verification_status === 'verified'}
                          onChange={(e) => setNewClientData({...newClientData, address_verification_status: e.target.value as 'pending' | 'verified' | 'failed'})}
                          className="mr-2"
                        />
                        Verified
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="address_verification_status"
                          value="failed"
                          checked={newClientData.address_verification_status === 'failed'}
                          onChange={(e) => setNewClientData({...newClientData, address_verification_status: e.target.value as 'pending' | 'verified' | 'failed'})}
                          className="mr-2"
                        />
                        Failed
                      </label>
                    </div>
                  </div>
                </div>

                {/* Enhanced Demographic Analytics (MSP2_09, MSP2_10) */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Demographic Analytics (MSP2_09, MSP2_10)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education Level *</label>
                      <select
                        required
                        value={newClientData.education_level}
                        onChange={(e) => setNewClientData({...newClientData, education_level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Education Level</option>
                        <option value="no_formal">No Formal Education</option>
                        <option value="primary">Primary Education</option>
                        <option value="secondary">Secondary Education</option>
                        <option value="diploma">Diploma</option>
                        <option value="bachelor">Bachelor's Degree</option>
                        <option value="master">Master's Degree</option>
                        <option value="phd">PhD</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age Group (Auto-calculated)</label>
                      <input
                        type="text"
                        value={newClientData.age_group}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Auto-calculated from date of birth"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Household Size</label>
                      <input
                        type="number"
                        value={newClientData.household_size}
                        onChange={(e) => setNewClientData({...newClientData, household_size: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number of household members"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Income Bracket</label>
                      <select
                        value={newClientData.income_bracket}
                        onChange={(e) => setNewClientData({...newClientData, income_bracket: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Income Bracket</option>
                        <option value="under_500k">Under 500,000 TZS</option>
                        <option value="500k_1m">500,000 - 1,000,000 TZS</option>
                        <option value="1m_2m">1,000,000 - 2,000,000 TZS</option>
                        <option value="2m_5m">2,000,000 - 5,000,000 TZS</option>
                        <option value="5m_10m">5,000,000 - 10,000,000 TZS</option>
                        <option value="over_10m">Over 10,000,000 TZS</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sector Classification Wizard (MSP2_03, MSP2_09) - Only for Business Clients */}
                {(newClientData.client_type === 'corporate' || newClientData.employment_status === 'self_employed') && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🏭</span>
                      Sector Classification Wizard (MSP2_03, MSP2_09)
                    </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Business Sector *</label>
                      <select
                        required
                        value={newClientData.primary_business_sector}
                        onChange={(e) => setNewClientData({...newClientData, primary_business_sector: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Primary Sector</option>
                        <option value="agriculture">Agriculture, Forestry & Fishing</option>
                        <option value="mining">Mining & Quarrying</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="construction">Construction</option>
                        <option value="wholesale_retail">Wholesale & Retail Trade</option>
                        <option value="transport">Transportation & Storage</option>
                        <option value="accommodation">Accommodation & Food Services</option>
                        <option value="information">Information & Communication</option>
                        <option value="finance">Financial & Insurance Activities</option>
                        <option value="real_estate">Real Estate Activities</option>
                        <option value="professional">Professional, Scientific & Technical</option>
                        <option value="administrative">Administrative & Support Services</option>
                        <option value="education">Education</option>
                        <option value="health">Human Health & Social Work</option>
                        <option value="arts">Arts, Entertainment & Recreation</option>
                        <option value="other_services">Other Service Activities</option>
                        <option value="public_admin">Public Administration & Defense</option>
                        <option value="households">Activities of Households</option>
                        <option value="international">Activities of International Organizations</option>
                        <option value="electricity">Electricity, Gas, Steam & Air Conditioning</option>
                        <option value="water">Water Supply, Sewerage & Waste Management</option>
                        <option value="repair">Repair of Motor Vehicles & Motorcycles</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Business Sector</label>
                      <select
                        value={newClientData.secondary_business_sector}
                        onChange={(e) => setNewClientData({...newClientData, secondary_business_sector: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Secondary Sector (Optional)</option>
                        <option value="agriculture">Agriculture, Forestry & Fishing</option>
                        <option value="mining">Mining & Quarrying</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="construction">Construction</option>
                        <option value="wholesale_retail">Wholesale & Retail Trade</option>
                        <option value="transport">Transportation & Storage</option>
                        <option value="accommodation">Accommodation & Food Services</option>
                        <option value="information">Information & Communication</option>
                        <option value="finance">Financial & Insurance Activities</option>
                        <option value="real_estate">Real Estate Activities</option>
                        <option value="professional">Professional, Scientific & Technical</option>
                        <option value="administrative">Administrative & Support Services</option>
                        <option value="education">Education</option>
                        <option value="health">Human Health & Social Work</option>
                        <option value="arts">Arts, Entertainment & Recreation</option>
                        <option value="other_services">Other Service Activities</option>
                        <option value="public_admin">Public Administration & Defense</option>
                        <option value="households">Activities of Households</option>
                        <option value="international">Activities of International Organizations</option>
                        <option value="electricity">Electricity, Gas, Steam & Air Conditioning</option>
                        <option value="water">Water Supply, Sewerage & Waste Management</option>
                        <option value="repair">Repair of Motor Vehicles & Motorcycles</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Activity Description</label>
                      <textarea
                        value={newClientData.business_activity_description}
                        onChange={(e) => setNewClientData({...newClientData, business_activity_description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Detailed description of business activities"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AI Confidence Score</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newClientData.business_sector_confidence}
                          onChange={(e) => setNewClientData({...newClientData, business_sector_confidence: parseInt(e.target.value)})}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">{newClientData.business_sector_confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (TZS)</label>
                      <input
                        type="number"
                        value={newClientData.annual_income}
                        onChange={(e) => setNewClientData({...newClientData, annual_income: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Annual income in TZS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Business Income (TZS)</label>
                      <input
                        type="number"
                        value={newClientData.monthly_business_income}
                        onChange={(e) => setNewClientData({...newClientData, monthly_business_income: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Monthly business income in TZS"
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* Enhanced Risk Management */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Enhanced Risk Management
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor Type</label>
                      <select
                        value={newClientData.guarantor_type}
                        onChange={(e) => setNewClientData({...newClientData, guarantor_type: e.target.value as 'individual' | 'group' | 'employer' | 'asset' | 'none'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Guarantor Type</option>
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                        <option value="employer">Employer</option>
                        <option value="asset">Asset</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Risk Rating</label>
                      <select
                        value={newClientData.risk_rating}
                        onChange={(e) => setNewClientData({...newClientData, risk_rating: e.target.value as 'low' | 'medium' | 'high'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor Details</label>
                      <textarea
                        value={newClientData.guarantor_details}
                        onChange={(e) => setNewClientData({...newClientData, guarantor_details: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Guarantor information and details"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collateral Type</label>
                      <select
                        value={newClientData.collateral_type}
                        onChange={(e) => setNewClientData({...newClientData, collateral_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Collateral Type</option>
                        <option value="land">Land/Property</option>
                        <option value="vehicle">Vehicle</option>
                        <option value="equipment">Equipment</option>
                        <option value="savings">Savings Account</option>
                        <option value="guarantee">Third Party Guarantee</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collateral Value (TZS)</label>
                      <input
                        type="number"
                        value={newClientData.collateral_value}
                        onChange={(e) => setNewClientData({...newClientData, collateral_value: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Collateral value in TZS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collateral Description</label>
                      <textarea
                        value={newClientData.collateral_description}
                        onChange={(e) => setNewClientData({...newClientData, collateral_description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Detailed description of collateral"
                      />
                    </div>
                  </div>
                </div>

                {/* KYC Compliance Dashboard */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔍</span>
                    KYC Compliance Dashboard
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">KYC Completion Percentage</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newClientData.kyc_completion_percentage}
                          onChange={(e) => setNewClientData({...newClientData, kyc_completion_percentage: parseInt(e.target.value)})}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">{newClientData.kyc_completion_percentage}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AML Risk Level</label>
                      <select
                        value={newClientData.aml_risk_level}
                        onChange={(e) => setNewClientData({...newClientData, aml_risk_level: e.target.value as 'low' | 'medium' | 'high'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PEP Status (Politically Exposed Person)</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pep_status"
                            value="false"
                            checked={!newClientData.pep_status}
                            onChange={() => setNewClientData({...newClientData, pep_status: false})}
                            className="mr-2"
                          />
                          No
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pep_status"
                            value="true"
                            checked={newClientData.pep_status}
                            onChange={() => setNewClientData({...newClientData, pep_status: true})}
                            className="mr-2"
                          />
                          Yes
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sanctions Check Status</label>
                      <select
                        value={newClientData.sanctions_check_status}
                        onChange={(e) => setNewClientData({...newClientData, sanctions_check_status: e.target.value as 'pending' | 'clear' | 'flagged'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="clear">Clear</option>
                        <option value="flagged">Flagged</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Bureau Score</label>
                      <input
                        type="text"
                        value={newClientData.credit_bureau_score}
                        onChange={(e) => setNewClientData({...newClientData, credit_bureau_score: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Credit bureau score"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Bureau Status</label>
                      <select
                        value={newClientData.credit_bureau_status}
                        onChange={(e) => setNewClientData({...newClientData, credit_bureau_status: e.target.value as 'pending' | 'verified' | 'failed'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">KYC Notes</label>
                    <textarea
                      value={newClientData.kyc_notes}
                      onChange={(e) => setNewClientData({...newClientData, kyc_notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Additional KYC notes and observations"
                    />
                  </div>
                </div>

                {/* Regulatory Reporting Fields */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Regulatory Reporting Fields
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender for Reporting</label>
                      <select
                        value={newClientData.gender_for_reporting}
                        onChange={(e) => setNewClientData({...newClientData, gender_for_reporting: e.target.value as 'Male' | 'Female'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age Group for Reporting</label>
                      <select
                        value={newClientData.age_group_for_reporting}
                        onChange={(e) => setNewClientData({...newClientData, age_group_for_reporting: e.target.value as 'Up35' | 'Above35'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Age Group</option>
                        <option value="Up35">Up to 35 years</option>
                        <option value="Above35">Above 35 years</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sector for Reporting</label>
                      <input
                        type="text"
                        value={newClientData.sector_for_reporting}
                        onChange={(e) => setNewClientData({...newClientData, sector_for_reporting: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Sector classification for regulatory reporting"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loan Purpose Category</label>
                      <select
                        value={newClientData.loan_purpose_category}
                        onChange={(e) => setNewClientData({...newClientData, loan_purpose_category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Loan Purpose</option>
                        <option value="working_capital">Working Capital</option>
                        <option value="asset_purchase">Asset Purchase</option>
                        <option value="business_expansion">Business Expansion</option>
                        <option value="debt_consolidation">Debt Consolidation</option>
                        <option value="emergency">Emergency</option>
                        <option value="education">Education</option>
                        <option value="housing">Housing</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Data Quality & Compliance */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">✅</span>
                    Data Quality & Compliance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data Quality Score</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newClientData.data_quality_score}
                          onChange={(e) => setNewClientData({...newClientData, data_quality_score: parseInt(e.target.value)})}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">{newClientData.data_quality_score}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Status</label>
                      <select
                        value={newClientData.regulatory_status}
                        onChange={(e) => setNewClientData({...newClientData, regulatory_status: e.target.value as 'compliant' | 'non_compliant' | 'under_review'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="compliant">Compliant</option>
                        <option value="non_compliant">Non-Compliant</option>
                        <option value="under_review">Under Review</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Notes</label>
                    <textarea
                      value={newClientData.compliance_notes}
                      onChange={(e) => setNewClientData({...newClientData, compliance_notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Compliance review notes and observations"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClient(false);
                      setIsEditing(false);
                      setSelectedClient(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={insertLoading || updateLoading || uploadingFiles}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {uploadingFiles && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {uploadingFiles ? 'Uploading Files...' : (insertLoading || updateLoading ? 'Saving...' : (isEditing ? 'Update Client' : 'Add Client'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {showArchiveModal && clientToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Archive Client</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to archive this client? This action can be undone later.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-6">
                <p className="text-sm font-medium text-gray-900">
                  {clientToArchive.full_name || 
                   (clientToArchive.client_type === 'individual' ? 
                     `${clientToArchive.first_name || ''} ${clientToArchive.last_name || ''}`.trim() || 'Individual Client' :
                     clientToArchive.client_type === 'corporate' ? 
                     clientToArchive.company_name || 'Corporate Client' :
                     clientToArchive.client_type === 'group' ? 
                     clientToArchive.group_name || 'Group Client' :
                     `Client (${clientToArchive.phone_number || clientToArchive.id})`)}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {clientToArchive.client_type} • {clientToArchive.phone_number || 'No phone'}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchiveClient}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Archiving...' : 'Archive Client'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkClientUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            refreshClients();
            setShowBulkUpload(false);
          }}
        />
      )}
    </Layout>
  );
};

export default ClientManagement;
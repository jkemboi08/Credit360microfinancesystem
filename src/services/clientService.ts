import { supabase } from '../lib/supabaseClient';
import { Database } from '../lib/supabaseClient';
import { sanitizeUuidFields } from '../utils/uuidSanitizer';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export interface ClientFormData {
  // Client Type Selection
  client_type: 'individual' | 'corporate' | 'group';
  client_category: 'new' | 'existing';
  
  // Personal Information (Individual)
  national_id_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  phone_number: string;
  email_address: string;
  marital_status: string;
  date_of_birth: string;
  id_type: string;
  tin_number: string;
  
  // Spouse/Relation Information
  spouse_first_name: string;
  spouse_middle_name: string;
  spouse_last_name: string;
  spouse_id_type: string;
  spouse_id_number: string;
  spouse_phone_number: string;
  spouse_monthly_earnings: string;
  relation_type: string;
  
  // Contact Information
  region: string;
  district: string;
  ward: string;
  street_name: string;
  house_number: string;
  nearest_landmark: string;
  postal_address: string;
  country: string;
  
  // Employment Information
  employment_status: string;
  occupation: string;
  other_occupation: string;
  employer_name: string;
  employer_address: string;
  monthly_income: string;
  income_source: string;
  
  // Corporate Information
  company_name: string;
  registration_number: string;
  tax_id: string;
  business_type: string;
  industry: string;
  company_size: string;
  established_date: string;
  company_address: string;
  
  // Director/Proprietor Information
  director_first_name: string;
  director_middle_name: string;
  director_last_name: string;
  director_phone_number: string;
  director_email_address: string;
  director_gender: string;
  director_date_of_birth: string;
  director_national_id_number: string;
  director_id_type: string;
  director_tin_number: string;
  
  // Group Information
  group_name: string;
  group_type: string;
  group_size: string;
  group_leader: string;
  group_address: string;
  
  // Group Leadership Details - Chairman/MD/CEO
  chairman_first_name: string;
  chairman_middle_name: string;
  chairman_last_name: string;
  chairman_phone_number: string;
  chairman_email_address: string;
  chairman_gender: string;
  chairman_date_of_birth: string;
  chairman_national_id_number: string;
  chairman_id_type: string;
  chairman_tin_number: string;
  
  // Group Leadership Details - Secretary
  secretary_first_name: string;
  secretary_middle_name: string;
  secretary_last_name: string;
  secretary_phone_number: string;
  secretary_email_address: string;
  secretary_gender: string;
  secretary_date_of_birth: string;
  secretary_national_id_number: string;
  secretary_id_type: string;
  secretary_tin_number: string;
  
  // Group Leadership Details - Treasurer
  treasurer_first_name: string;
  treasurer_middle_name: string;
  treasurer_last_name: string;
  treasurer_phone_number: string;
  treasurer_email_address: string;
  treasurer_gender: string;
  treasurer_date_of_birth: string;
  treasurer_national_id_number: string;
  treasurer_id_type: string;
  treasurer_tin_number: string;
  
  // Financial Information
  bank_name: string;
  bank_branch: string;
  account_number: string;
  account_type: string;
  
  // Additional Information
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  referral_source: string;
  notes: string;
  
  // KYC Information
  kyc_status: 'pending' | 'verified' | 'rejected';
  risk_level: 'low' | 'medium' | 'high';
  compliance_notes: string;
}

export class ClientService {
  /**
   * Insert individual client using single table approach
   */
  static async insertIndividualClient(formData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Inserting individual client with single table...');
      
      // Prepare client data for single table insertion
      const clientData = {
        ...sanitizeUuidFields(formData),
        client_type: 'individual',
        client_category: 'new',
        status: 'active',
        kyc_status: 'pending',
        // Ensure gender is always valid - WORKAROUND for constraint violation
        gender: (formData.gender && ['male', 'female', 'other'].includes(formData.gender.toLowerCase())) 
          ? formData.gender.toLowerCase() 
          : 'male',
        // Compute full name
        full_name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
        // Set contact person name for individual clients (same as full name)
        contact_person_name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
        group_leader_name: null
      };

      console.log('🔍 Inserting client data:', clientData);
      console.log('🔍 Gender value being sent:', clientData.gender);
      console.log('🔍 Gender type:', typeof clientData.gender);
      console.log('🔍 Gender length:', clientData.gender?.length);
      console.log('🔍 Gender in valid values?', ['male', 'female', 'other'].includes(clientData.gender));
      
      const { data: clientResult, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error('❌ Error inserting client:', clientError);
        return { success: false, error: `Failed to create client: ${clientError.message}` };
      }

      console.log('✅ Individual client created successfully:', clientResult.id);
      return { success: true, data: clientResult };
    } catch (error) {
      console.error('Error in insertIndividualClient:', error);
      return { 
        success: false, 
        error: `Failed to create individual client: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Insert corporate client using single table approach
   */
  static async insertCorporateClient(formData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Inserting corporate client with single table...');
      
      // Prepare client data for single table insertion
      const clientData = {
        ...sanitizeUuidFields(formData),
        client_type: 'corporate',
        client_category: 'new',
        status: 'active',
        kyc_status: 'pending',
        // Ensure gender is always valid - WORKAROUND for constraint violation
        gender: (formData.gender && ['male', 'female', 'other'].includes(formData.gender.toLowerCase())) 
          ? formData.gender.toLowerCase() 
          : 'male',
        // Ensure director_gender is always valid
        director_gender: (formData.director_gender && ['male', 'female', 'other'].includes(formData.director_gender.toLowerCase())) 
          ? formData.director_gender.toLowerCase() 
          : 'male',
        // Use company name as full name
        full_name: formData.company_name || 'Unnamed Corporate',
        // Set contact person name for corporate clients
        contact_person_name: `${formData.director_first_name || ''} ${formData.director_last_name || ''}`.trim(),
        group_leader_name: null
      };

      console.log('🔍 Inserting client data:', clientData);
      
      const { data: clientResult, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error('❌ Error inserting client:', clientError);
        return { success: false, error: `Failed to create client: ${clientError.message}` };
      }

      console.log('✅ Corporate client created successfully:', clientResult.id);
      return { success: true, data: clientResult };
    } catch (error) {
      console.error('Error in insertCorporateClient:', error);
      return { 
        success: false, 
        error: `Failed to create corporate client: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Insert group client using single table approach
   */
  static async insertGroupClient(formData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Inserting group client with single table...');
      
      // Prepare client data for single table insertion
      const clientData = {
        ...sanitizeUuidFields(formData),
        client_type: 'group',
        client_category: 'new',
        status: 'active',
        kyc_status: 'pending',
        // Ensure gender is always valid - WORKAROUND for constraint violation
        gender: (formData.gender && ['male', 'female', 'other'].includes(formData.gender.toLowerCase())) 
          ? formData.gender.toLowerCase() 
          : 'male',
        // Ensure chairman_gender is always valid
        chairman_gender: (formData.chairman_gender && ['male', 'female', 'other'].includes(formData.chairman_gender.toLowerCase())) 
          ? formData.chairman_gender.toLowerCase() 
          : 'male',
        // Ensure secretary_gender is always valid
        secretary_gender: (formData.secretary_gender && ['male', 'female', 'other'].includes(formData.secretary_gender.toLowerCase())) 
          ? formData.secretary_gender.toLowerCase() 
          : 'male',
        // Ensure treasurer_gender is always valid
        treasurer_gender: (formData.treasurer_gender && ['male', 'female', 'other'].includes(formData.treasurer_gender.toLowerCase())) 
          ? formData.treasurer_gender.toLowerCase() 
          : 'male',
        // Use group name as full name
        full_name: formData.group_name || 'Unnamed Group',
        contact_person_name: null,
        // Set group leader name
        group_leader_name: formData.group_leader || null
      };

      console.log('🔍 Inserting client data:', clientData);
      
      const { data: clientResult, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error('❌ Error inserting client:', clientError);
        return { success: false, error: `Failed to create client: ${clientError.message}` };
      }

      console.log('✅ Group client created successfully:', clientResult.id);
      return { success: true, data: clientResult };
    } catch (error) {
      console.error('Error in insertGroupClient:', error);
      return { 
        success: false, 
        error: `Failed to create group client: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create a new client
   */
  static async createClient(formData: ClientFormData): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
      // Transform form data to database format
      const clientData: ClientInsert = {
        // Client Type
        client_type: formData.client_type,
        client_category: formData.client_category,
        status: 'active',
        
        // Personal Information
        first_name: formData.first_name || null,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name || null,
        common_name: formData.first_name || null, // Use first_name as common_name if not provided
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        national_id_number: formData.national_id_number || null,
        id_type: formData.id_type || null,
        tin_number: formData.tin_number || null,
        
        // Contact Information
        phone_number: formData.phone_number || null,
        email_address: formData.email_address || null,
        region: formData.region || null,
        district: formData.district || null,
        ward: formData.ward || null,
        street_name: formData.street_name || null,
        house_number: formData.house_number || null,
        area_of_residence: formData.ward || null, // Map ward to area_of_residence
        housing_type: 'unknown', // Default value
        nearest_landmark: formData.nearest_landmark || null,
        postal_address: formData.postal_address || null,
        country: formData.country || 'Tanzania',
        
        // Marital Status and Spouse
        marital_status: formData.marital_status || null,
        spouse_name: formData.spouse_first_name ? 
          `${formData.spouse_first_name} ${formData.spouse_last_name}`.trim() : null,
        spouse_common_name: formData.spouse_first_name || null,
        spouse_first_name: formData.spouse_first_name || null,
        spouse_middle_name: formData.spouse_middle_name || null,
        spouse_last_name: formData.spouse_last_name || null,
        spouse_id_type: formData.spouse_id_type || null,
        spouse_id_number: formData.spouse_id_number || null,
        spouse_phone_number: formData.spouse_phone_number || null,
        spouse_monthly_earnings: formData.spouse_monthly_earnings ? 
          parseFloat(formData.spouse_monthly_earnings) : null,
        relation_type: formData.relation_type || null,
        
        // Employment Information
        employment_status: formData.employment_status || null,
        occupation: formData.occupation || null,
        other_occupation: formData.other_occupation || null,
        employer_name: formData.employer_name || null,
        employer_address: formData.employer_address || null,
        monthly_income: formData.monthly_income ? 
          parseFloat(formData.monthly_income) : null,
        income_source: formData.income_source || null,
        company_name: formData.company_name || null,
        office_location: formData.employer_address || null,
        position: formData.occupation || null,
        years_of_employment: null, // Not in form
        net_monthly_salary: formData.monthly_income ? 
          parseFloat(formData.monthly_income) : null,
        salary_slip_uploaded: false,
        
        // Business Information
        business_name: formData.business_name || null,
        business_location: formData.company_address || null,
        average_monthly_income: formData.monthly_income ? 
          parseFloat(formData.monthly_income) : null,
        type_of_business: formData.business_type || null,
        since_when_business: null, // Not in form
        
        // Corporate Information
        registration_number: formData.registration_number || null,
        tax_id: formData.tax_id || null,
        business_type: formData.business_type || null,
        industry: formData.industry || null,
        company_size: formData.company_size || null,
        established_date: formData.established_date || null,
        company_address: formData.company_address || null,
        
        // Director/Proprietor Information
        director_first_name: formData.director_first_name || null,
        director_middle_name: formData.director_middle_name || null,
        director_last_name: formData.director_last_name || null,
        director_phone_number: formData.director_phone_number || null,
        director_email_address: formData.director_email_address || null,
        director_gender: formData.director_gender || null,
        director_date_of_birth: formData.director_date_of_birth || null,
        director_national_id_number: formData.director_national_id_number || null,
        director_id_type: formData.director_id_type || null,
        director_tin_number: formData.director_tin_number || null,
        
        // Group Information
        group_name: formData.group_name || null,
        group_type: formData.group_type || null,
        group_size: formData.group_size ? parseInt(formData.group_size) : null,
        group_leader: formData.group_leader || null,
        group_address: formData.group_address || null,
        
        // Group Leadership - Chairman
        chairman_first_name: formData.chairman_first_name || null,
        chairman_middle_name: formData.chairman_middle_name || null,
        chairman_last_name: formData.chairman_last_name || null,
        chairman_phone_number: formData.chairman_phone_number || null,
        chairman_email_address: formData.chairman_email_address || null,
        chairman_gender: formData.chairman_gender || null,
        chairman_date_of_birth: formData.chairman_date_of_birth || null,
        chairman_national_id_number: formData.chairman_national_id_number || null,
        chairman_id_type: formData.chairman_id_type || null,
        chairman_tin_number: formData.chairman_tin_number || null,
        
        // Group Leadership - Secretary
        secretary_first_name: formData.secretary_first_name || null,
        secretary_middle_name: formData.secretary_middle_name || null,
        secretary_last_name: formData.secretary_last_name || null,
        secretary_phone_number: formData.secretary_phone_number || null,
        secretary_email_address: formData.secretary_email_address || null,
        secretary_gender: formData.secretary_gender || null,
        secretary_date_of_birth: formData.secretary_date_of_birth || null,
        secretary_national_id_number: formData.secretary_national_id_number || null,
        secretary_id_type: formData.secretary_id_type || null,
        secretary_tin_number: formData.secretary_tin_number || null,
        
        // Group Leadership - Treasurer
        treasurer_first_name: formData.treasurer_first_name || null,
        treasurer_middle_name: formData.treasurer_middle_name || null,
        treasurer_last_name: formData.treasurer_last_name || null,
        treasurer_phone_number: formData.treasurer_phone_number || null,
        treasurer_email_address: formData.treasurer_email_address || null,
        treasurer_gender: formData.treasurer_gender || null,
        treasurer_date_of_birth: formData.treasurer_date_of_birth || null,
        treasurer_national_id_number: formData.treasurer_national_id_number || null,
        treasurer_id_type: formData.treasurer_id_type || null,
        treasurer_tin_number: formData.treasurer_tin_number || null,
        
        // Financial Information
        bank_name: formData.bank_name || null,
        bank_branch: formData.bank_branch || null,
        account_number: formData.account_number || null,
        account_type: formData.account_type || null,
        
        // Additional Information
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        referral_source: formData.referral_source || null,
        notes: formData.notes || null,
        
        // KYC and Compliance
        kyc_status: formData.kyc_status || 'pending',
        risk_level: formData.risk_level || 'medium',
        compliance_notes: formData.compliance_notes || null,
        
        // Document Upload Status
        id_document_uploaded: false,
        passport_photo_uploaded: false,
        fingerprint_uploaded: false,
        
        // Repeat Customer Fields
        customer_since: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createClient:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update an existing client
   */
  static async updateClient(id: string, formData: Partial<ClientFormData>): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
      // Transform form data to database format (similar to createClient)
      const updateData: ClientUpdate = {
        // Only include fields that are being updated
        ...(formData.first_name && { first_name: formData.first_name }),
        ...(formData.last_name && { last_name: formData.last_name }),
        ...(formData.phone_number && { phone_number: formData.phone_number }),
        ...(formData.email_address && { email_address: formData.email_address }),
        // Add other fields as needed
      };

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateClient:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all clients with search functionality
   */
  static async getClients(searchTerm?: string): Promise<{ success: boolean; data?: Client[]; error?: string }> {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email_address.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,group_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching clients:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getClients:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all clients from single table with calculated loan status
   */
  static async getClientsWithDetails(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('🔍 Fetching clients with loan status...');

      // Fetch clients directly from the clients table
      let { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('❌ Error fetching clients:', clientsError);
        return { success: false, error: clientsError.message };
      }

      // Fetch all active loans with their related loan applications to get the correct client_id
      const { data: activeLoans, error: loansError } = await supabase
        .from('loans')
        .select(`
          id,
          status,
          loan_applications!loans_loan_application_id_fkey (
            client_id
          )
        `)
        .in('status', ['active', 'overdue']);

      if (loansError) {
        console.warn('⚠️ Error fetching loans for status calculation:', loansError);
        // Continue without loan status calculation
      }

      // Create a map of client_id to loan status
      const clientLoanStatusMap = new Map<string, string>();
      if (activeLoans) {
        activeLoans.forEach(loan => {
          const clientId = loan.loan_applications?.client_id;
          if (clientId) {
            const existingStatus = clientLoanStatusMap.get(clientId);
            if (!existingStatus || loan.status === 'overdue') {
              // Prioritize 'overdue' status over 'active'
              clientLoanStatusMap.set(clientId, loan.status);
            }
          }
        });
      }

      // Add calculated loan status to each client
      const clientsWithLoanStatus = clients?.map(client => ({
        ...client,
        loan_status: clientLoanStatusMap.get(client.id) || 'No Active Loans'
      })) || [];

      console.log('✅ Clients fetched successfully:', clientsWithLoanStatus.length, 'clients');
      console.log('🔍 Loan status distribution:', {
        active: clientsWithLoanStatus.filter(c => c.loan_status === 'active').length,
        overdue: clientsWithLoanStatus.filter(c => c.loan_status === 'overdue').length,
        noLoans: clientsWithLoanStatus.filter(c => c.loan_status === 'No Active Loans').length
      });
      
      return { success: true, data: clientsWithLoanStatus };
    } catch (error) {
      console.error('❌ Error in getClientsWithDetails:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get a single client by ID
   */
  static async getClientById(id: string): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getClientById:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a client
   */
  static async deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteClient:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Search clients by various criteria
   */
  static async searchClients(criteria: {
    searchTerm?: string;
    clientType?: string;
    status?: string;
    kycStatus?: string;
  }): Promise<{ success: boolean; data?: Client[]; error?: string }> {
    try {
      let query = supabase
        .from('clients')
        .select('*');

      // Apply filters
      if (criteria.searchTerm) {
        query = query.or(`first_name.ilike.%${criteria.searchTerm}%,last_name.ilike.%${criteria.searchTerm}%,phone_number.ilike.%${criteria.searchTerm}%,email_address.ilike.%${criteria.searchTerm}%,company_name.ilike.%${criteria.searchTerm}%,group_name.ilike.%${criteria.searchTerm}%`);
      }

      if (criteria.clientType) {
        query = query.eq('client_type', criteria.clientType);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.kycStatus) {
        query = query.eq('kyc_status', criteria.kycStatus);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error searching clients:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in searchClients:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Validate client form data
   */
  static validateClientData(formData: ClientFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!formData.client_type) {
      errors.push('Client type is required');
    }

    if (formData.client_type === 'individual') {
      if (!formData.first_name) errors.push('First name is required for individual clients');
      if (!formData.last_name) errors.push('Last name is required for individual clients');
      if (!formData.national_id_number) errors.push('National ID number is required for individual clients');
      if (!formData.phone_number) errors.push('Phone number is required');
    }

    if (formData.client_type === 'corporate') {
      if (!formData.company_name) errors.push('Company name is required for corporate clients');
      if (!formData.registration_number) errors.push('Registration number is required for corporate clients');
      if (!formData.director_first_name) errors.push('Director first name is required for corporate clients');
      if (!formData.director_last_name) errors.push('Director last name is required for corporate clients');
    }

    if (formData.client_type === 'group') {
      if (!formData.group_name) errors.push('Group name is required for group clients');
      if (!formData.group_type) errors.push('Group type is required for group clients');
      if (!formData.chairman_first_name) errors.push('Chairman first name is required for group clients');
      if (!formData.chairman_last_name) errors.push('Chairman last name is required for group clients');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ClientService;
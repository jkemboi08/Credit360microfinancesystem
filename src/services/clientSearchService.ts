/**
 * Client Search Service
 * Handles client search functionality with proper error handling
 */

import { supabase } from '../lib/supabaseClient';

export interface ClientSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  common_name: string | null;
  phone_number: string | null;
  email_address: string | null;
  national_id_number: string | null;
  client_type: 'individual' | 'corporate' | 'group' | null;
  kyc_status: 'pending' | 'verified' | 'rejected' | null;
  created_at: string | null;
}

export interface ClientSearchResponse {
  success: boolean;
  data?: ClientSearchResult[];
  error?: string;
  totalCount?: number;
}

export class ClientSearchService {
  /**
   * Search clients by various criteria - TENANT FILTERED
   */
  static async searchClients(searchTerm: string, limit: number = 10): Promise<ClientSearchResponse> {
    try {
      console.log('🔍 Searching clients with term:', searchTerm);

      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: false,
          error: 'Search term must be at least 2 characters long'
        };
      }

      // Get current tenant context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Get user's tenant IDs
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        return {
          success: false,
          error: 'User not associated with any tenant'
        };
      }

      const tenantIds = tenantUsers.map(tu => tu.tenant_id);
      const trimmedTerm = searchTerm.trim();
      
      // Search in individual_client_details first (most common case)
      const { data: individualResults, error: individualError } = await supabase
        .from('individual_client_details')
        .select(`
          client_id,
          first_name,
          last_name,
          national_id_number,
          clients!inner(
            id,
            phone_number,
            email_address,
            client_type,
            status,
            client_category,
            created_at,
            tenant_id
          )
        `)
        .in('clients.tenant_id', tenantIds)
        .or(`
          first_name.ilike.%${trimmedTerm}%,
          last_name.ilike.%${trimmedTerm}%,
          national_id_number.ilike.%${trimmedTerm}%
        `)
        .limit(limit);

      if (individualError) {
        console.error('❌ Individual search error:', individualError);
        return {
          success: false,
          error: `Search failed: ${individualError.message}`
        };
      }

      // Search in main clients table for phone/email
      const { data: clientResults, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          phone_number,
          email_address,
          client_type,
          status,
          client_category,
          created_at,
          tenant_id,
          individual_client_details!left(
            first_name,
            last_name,
            national_id_number
          )
        `)
        .in('tenant_id', tenantIds)
        .or(`
          phone_number.ilike.%${trimmedTerm}%,
          email_address.ilike.%${trimmedTerm}%
        `)
        .limit(limit);

      if (clientError) {
        console.error('❌ Client search error:', clientError);
        return {
          success: false,
          error: `Search failed: ${clientError.message}`
        };
      }

      // Combine and format results
      const individualFormatted = (individualResults || []).map(customer => ({
        id: customer.client_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        common_name: null,
        national_id_number: customer.national_id_number,
        phone_number: customer.clients.phone_number,
        email_address: customer.clients.email_address,
        client_type: customer.clients.client_type,
        kyc_status: null,
        created_at: customer.clients.created_at
      }));

      const clientFormatted = (clientResults || []).map(customer => ({
        id: customer.id,
        first_name: customer.individual_client_details?.[0]?.first_name || null,
        last_name: customer.individual_client_details?.[0]?.last_name || null,
        common_name: null,
        national_id_number: customer.individual_client_details?.[0]?.national_id_number || null,
        phone_number: customer.phone_number,
        email_address: customer.email_address,
        client_type: customer.client_type,
        kyc_status: null,
        created_at: customer.created_at
      }));

      // Combine results and remove duplicates
      const allResults = [...individualFormatted, ...clientFormatted];
      const uniqueResults = allResults.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      console.log('✅ Client search successful:', uniqueResults.length, 'results found for tenant(s):', tenantIds.join(', '));

      return {
        success: true,
        data: uniqueResults,
        totalCount: uniqueResults.length
      };

    } catch (error) {
      console.error('❌ Client search exception:', error);
      return {
        success: false,
        error: `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get client by ID
   */
  static async getClientById(id: string): Promise<ClientSearchResponse> {
    try {
      console.log('🔍 Getting client by ID:', id);

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          common_name,
          phone_number,
          email_address,
          national_id_number,
          client_type,
          kyc_status,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Get client by ID error:', error);
        return {
          success: false,
          error: `Client not found: ${error.message}`
        };
      }

      return {
        success: true,
        data: data ? [data] : [],
        totalCount: data ? 1 : 0
      };

    } catch (error) {
      console.error('❌ Get client by ID exception:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all clients with pagination
   */
  static async getAllClients(page: number = 1, limit: number = 20): Promise<ClientSearchResponse> {
    try {
      console.log('🔍 Getting all clients, page:', page, 'limit:', limit);

      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          common_name,
          phone_number,
          email_address,
          national_id_number,
          client_type,
          kyc_status,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Get all clients error:', error);
        return {
          success: false,
          error: `Failed to fetch clients: ${error.message}`
        };
      }

      return {
        success: true,
        data: data || [],
        totalCount: count || 0
      };

    } catch (error) {
      console.error('❌ Get all clients exception:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search clients by phone number
   */
  static async searchByPhone(phoneNumber: string): Promise<ClientSearchResponse> {
    try {
      console.log('🔍 Searching clients by phone:', phoneNumber);

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          email_address,
          national_id_number,
          client_type,
          status,
          client_category,
          created_at
        `)
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Search by phone error:', error);
        return {
          success: false,
          error: `Phone search failed: ${error.message}`
        };
      }

      return {
        success: true,
        data: data || [],
        totalCount: data?.length || 0
      };

    } catch (error) {
      console.error('❌ Search by phone exception:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search clients by national ID
   */
  static async searchByNationalId(nationalId: string): Promise<ClientSearchResponse> {
    try {
      console.log('🔍 Searching clients by national ID:', nationalId);

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          email_address,
          national_id_number,
          client_type,
          status,
          client_category,
          created_at
        `)
        .eq('national_id_number', nationalId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Search by national ID error:', error);
        return {
          success: false,
          error: `National ID search failed: ${error.message}`
        };
      }

      return {
        success: true,
        data: data || [],
        totalCount: data?.length || 0
      };

    } catch (error) {
      console.error('❌ Search by national ID exception:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get client statistics
   */
  static async getClientStats(): Promise<{
    success: boolean;
    stats?: {
      totalClients: number;
      individualClients: number;
      corporateClients: number;
      groupClients: number;
      verifiedClients: number;
      pendingClients: number;
    };
    error?: string;
  }> {
    try {
      console.log('🔍 Getting client statistics');

      const { data, error } = await supabase
        .from('clients')
        .select('client_type, kyc_status');

      if (error) {
        console.error('❌ Get client stats error:', error);
        return {
          success: false,
          error: `Failed to get statistics: ${error.message}`
        };
      }

      const stats = {
        totalClients: data?.length || 0,
        individualClients: data?.filter(c => c.client_type === 'individual').length || 0,
        corporateClients: data?.filter(c => c.client_type === 'corporate').length || 0,
        groupClients: data?.filter(c => c.client_type === 'group').length || 0,
        verifiedClients: data?.filter(c => c.kyc_status === 'verified').length || 0,
        pendingClients: data?.filter(c => c.kyc_status === 'pending').length || 0
      };

      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('❌ Get client stats exception:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}







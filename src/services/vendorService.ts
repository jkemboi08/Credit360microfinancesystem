import { supabase } from '../lib/supabaseClient';

export interface Vendor {
  id: string;
  vendor_name: string;
  vendor_type: 'supplier' | 'service_provider' | 'contractor' | 'consultant';
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export class VendorService {
  // Get all active vendors
  static async getVendors(): Promise<Vendor[]> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('vendor_name', { ascending: true });

      if (error) {
        console.error('Error fetching vendors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }

  // Get vendor by ID
  static async getVendorById(id: string): Promise<Vendor | null> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching vendor:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      return null;
    }
  }

  // Get vendor by name
  static async getVendorByName(name: string): Promise<Vendor | null> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('vendor_name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching vendor by name:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching vendor by name:', error);
      return null;
    }
  }

  // Create new vendor
  static async createVendor(vendorData: Partial<Vendor>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          vendor_name: vendorData.vendor_name,
          vendor_type: vendorData.vendor_type || 'supplier',
          contact_person: vendorData.contact_person,
          email: vendorData.email,
          phone: vendorData.phone,
          address: vendorData.address,
          tax_id: vendorData.tax_id,
          is_approved: vendorData.is_approved ?? false,
          is_active: vendorData.is_active ?? true
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating vendor:', error);
      return { success: false, error: error.message };
    }
  }

  // Update vendor
  static async updateVendor(id: string, vendorData: Partial<Vendor>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          vendor_name: vendorData.vendor_name,
          vendor_type: vendorData.vendor_type,
          contact_person: vendorData.contact_person,
          email: vendorData.email,
          phone: vendorData.phone,
          address: vendorData.address,
          tax_id: vendorData.tax_id,
          is_approved: vendorData.is_approved,
          is_active: vendorData.is_active
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating vendor:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete vendor (soft delete)
  static async deleteVendor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting vendor:', error);
      return { success: false, error: error.message };
    }
  }
}









































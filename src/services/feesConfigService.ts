import { supabase } from '../lib/supabaseClient';

export interface FeesConfig {
  id?: string;
  application_fee_percentage: number; // Percentage of loan amount
  legal_fee_amount: number; // Fixed amount in TZS
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

export class FeesConfigService {
  // Get current active fees configuration
  static async getActiveFeesConfig(): Promise<FeesConfig | null> {
    try {
      const { data, error } = await supabase
        .from('fees_configuration')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching fees config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching fees config:', error);
      return null;
    }
  }

  // Get all fees configurations
  static async getAllFeesConfigs(): Promise<FeesConfig[]> {
    try {
      const { data, error } = await supabase
        .from('fees_configuration')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fees configs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching fees configs:', error);
      return [];
    }
  }

  // Create new fees configuration
  static async createFeesConfig(config: Omit<FeesConfig, 'id' | 'created_at' | 'updated_at'>): Promise<FeesConfig> {
    try {
      console.log('🔧 Creating fees configuration:', config);

      // First, check if the table exists by trying to query it
      const { data: testData, error: testError } = await supabase
        .from('fees_configuration')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ Table access error:', testError);
        throw new Error(`Database table 'fees_configuration' does not exist or is not accessible. Please run the migration script first. Error: ${testError.message}`);
      }

      console.log('✅ Table access confirmed');

      // Deactivate all existing configurations
      console.log('🔄 Deactivating existing configurations...');
      const { error: deactivateError } = await supabase
        .from('fees_configuration')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateError) {
        console.warn('⚠️ Warning deactivating existing configs:', deactivateError);
        // Don't fail the operation for this
      }

      // Create new configuration
      console.log('➕ Creating new configuration...');
      const { data, error } = await supabase
        .from('fees_configuration')
        .insert([{
          ...config,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        throw new Error(`Failed to create fees config: ${error.message} (Code: ${error.code})`);
      }

      if (!data) {
        throw new Error('Failed to create fees config: No data returned from database');
      }

      console.log('✅ Fees configuration created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating fees config:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred: ${JSON.stringify(error)}`);
      }
    }
  }

  // Update fees configuration
  static async updateFeesConfig(id: string, updates: Partial<FeesConfig>): Promise<FeesConfig> {
    try {
      const { data, error } = await supabase
        .from('fees_configuration')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update fees config: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating fees config:', error);
      throw error;
    }
  }

  // Calculate application fee based on loan amount
  static calculateApplicationFee(loanAmount: number, percentage: number): number {
    return (loanAmount * percentage) / 100;
  }

  // Calculate total upfront fees
  static calculateTotalUpfrontFees(loanAmount: number, config: FeesConfig): {
    applicationFee: number;
    legalFee: number;
    totalFees: number;
  } {
    const applicationFee = this.calculateApplicationFee(loanAmount, config.application_fee_percentage);
    const legalFee = config.legal_fee_amount;
    const totalFees = applicationFee + legalFee;

    return {
      applicationFee,
      legalFee,
      totalFees
    };
  }

  // Get default fees configuration (fallback)
  static getDefaultFeesConfig(): FeesConfig {
    return {
      application_fee_percentage: 2.5, // 2.5% of loan amount
      legal_fee_amount: 50000, // 50,000 TZS fixed
      is_active: true
    };
  }
}








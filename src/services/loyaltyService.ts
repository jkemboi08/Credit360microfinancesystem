import { supabase } from '../lib/supabaseClient';

export interface LoyaltyTier {
  id: string;
  tier_name: string;
  min_loans: number;
  min_amount: number;
  min_performance_score: number;
  min_lifetime_value: number;
  benefits: any;
  interest_rate_discount: number;
  processing_fee_discount: number;
  priority_processing: boolean;
  express_approval: boolean;
  higher_credit_limit_multiplier: number;
}

export interface CustomerBenefit {
  id: string;
  client_id: string;
  benefit_type: string;
  benefit_description: string;
  benefit_value: number;
  benefit_percentage: number;
  is_active: boolean;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

export interface PreApproval {
  id: string;
  client_id: string;
  pre_approved_amount: number;
  max_interest_rate: number;
  max_term_months: number;
  special_conditions: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerNotification {
  id: string;
  client_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
  expires_at: string | null;
  action_required: boolean;
  action_url: string | null;
  created_at: string;
}

export class LoyaltyService {
  // Get all loyalty tiers
  static async getLoyaltyTiers(): Promise<LoyaltyTier[]> {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .order('min_lifetime_value', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get customer's current tier
  static async getCustomerTier(clientId: string): Promise<LoyaltyTier | null> {
    const { data: customer, error: customerError } = await supabase
      .from('clients')
      .select('client_category')
      .eq('id', clientId)
      .single();

    if (customerError) throw customerError;
    if (!customer?.client_category) return null;

    const { data: tier, error: tierError } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('tier_name', customer.client_category)
      .single();

    if (tierError) throw tierError;
    return tier;
  }

  // Check if customer is eligible for tier upgrade
  static async checkTierUpgradeEligibility(clientId: string): Promise<any> {
    const { data, error } = await supabase.rpc('check_tier_upgrade_eligibility', {
      client_uuid: clientId
    });

    if (error) throw error;
    return data;
  }

  // Process tier upgrade
  static async processTierUpgrade(clientId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('process_tier_upgrade', {
      client_uuid: clientId
    });

    if (error) throw error;
    return data;
  }

  // Generate pre-approval for customer
  static async generatePreApproval(
    clientId: string,
    preApprovedAmount: number,
    maxInterestRate: number,
    maxTermMonths: number,
    expiresDays: number = 30
  ): Promise<string> {
    const { data, error } = await supabase.rpc('generate_pre_approval', {
      client_uuid: clientId,
      pre_approved_amount: preApprovedAmount,
      max_interest_rate: maxInterestRate,
      max_term_months: maxTermMonths,
      expires_days: expiresDays
    });

    if (error) throw error;
    return data;
  }

  // Apply loyalty benefits to loan application
  static async applyLoyaltyBenefits(loanApplicationId: string): Promise<any> {
    const { data, error } = await supabase.rpc('apply_loyalty_benefits', {
      loan_application_uuid: loanApplicationId
    });

    if (error) throw error;
    return data;
  }

  // Get customer benefits
  static async getCustomerBenefits(clientId: string): Promise<CustomerBenefit[]> {
    const { data, error } = await supabase
      .from('customer_benefits')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get customer pre-approvals
  static async getCustomerPreApprovals(clientId: string): Promise<PreApproval[]> {
    const { data, error } = await supabase
      .from('pre_approvals')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get customer notifications
  static async getCustomerNotifications(clientId: string): Promise<CustomerNotification[]> {
    const { data, error } = await supabase
      .from('customer_notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Create customer benefit
  static async createCustomerBenefit(
    clientId: string,
    benefitType: string,
    benefitDescription: string,
    benefitValue: number = 0,
    benefitPercentage: number = 0,
    expiresAt: string | null = null
  ): Promise<string> {
    const { data, error } = await supabase
      .from('customer_benefits')
      .insert({
        client_id: clientId,
        benefit_type: benefitType,
        benefit_description: benefitDescription,
        benefit_value: benefitValue,
        benefit_percentage: benefitPercentage,
        expires_at: expiresAt
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  // Use customer benefit
  static async useCustomerBenefit(benefitId: string, loanApplicationId?: string): Promise<void> {
    const { error } = await supabase
      .from('customer_benefits')
      .update({ 
        is_active: false,
        used_at: new Date().toISOString()
      })
      .eq('id', benefitId);

    if (error) throw error;
  }

  // Update customer metrics
  static async updateCustomerMetrics(clientId: string): Promise<void> {
    const { error } = await supabase.rpc('update_customer_metrics_for_client', {
      client_uuid: clientId
    });

    if (error) throw error;
  }

  // Get customer analytics
  static async getCustomerAnalytics(clientId: string): Promise<any> {
    const { data, error } = await supabase.rpc('generate_customer_analytics', {
      client_uuid: clientId
    });

    if (error) throw error;
    return data;
  }

  // Get loyalty program settings
  static async getLoyaltySettings(): Promise<any> {
    const { data, error } = await supabase
      .from('loyalty_program_settings')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  // Update loyalty program settings
  static async updateLoyaltySettings(settingName: string, settingValue: any): Promise<void> {
    const { error } = await supabase
      .from('loyalty_program_settings')
      .update({ setting_value: settingValue })
      .eq('setting_name', settingName);

    if (error) throw error;
  }

  // Get customer loyalty events
  static async getCustomerLoyaltyEvents(clientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('loyalty_events')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get customer segments
  static async getCustomerSegments(): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('is_active', true)
      .order('customer_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get customers in segment
  static async getCustomersInSegment(segmentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_segment_assignments')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          status,
          client_category,
          created_at
        )
      `)
      .eq('segment_id', segmentId);

    if (error) throw error;
    return data || [];
  }

  // Update customer segments
  static async updateCustomerSegments(): Promise<void> {
    const { error } = await supabase.rpc('update_customer_segments');

    if (error) throw error;
  }

  // Get risk alerts
  static async getRiskAlerts(clientId?: string): Promise<any[]> {
    let query = supabase
      .from('risk_alerts')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Resolve risk alert
  static async resolveRiskAlert(alertId: string, resolvedNotes: string): Promise<void> {
    const { error } = await supabase
      .from('risk_alerts')
      .update({ 
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_notes: resolvedNotes
      })
      .eq('id', alertId);

    if (error) throw error;
  }
}

export default LoyaltyService;


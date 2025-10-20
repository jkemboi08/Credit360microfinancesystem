// Comprehensive Repayment and Restructuring Service
// Real-time integration with Supabase for loan management

import { supabase } from '../lib/supabaseClient';

// =============================================
// INTERFACES AND TYPES
// =============================================

export interface LoanRepayment {
  id: number;
  loan_id: number;
  user_id: number;
  amount: number;
  payment_method: 'm_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'cash';
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface LoanRestructuring {
  id: string;
  loan_id: number;
  client_id: number;
  original_tenor: number;
  original_interest_rate: number;
  original_monthly_payment: number;
  original_principal_balance: number;
  new_tenor: number;
  new_interest_rate: number;
  new_monthly_payment: number;
  grace_period: number;
  total_interest_savings: number;
  total_payment_reduction: number;
  new_total_amount: number;
  reason: string;
  justification: string;
  client_consent: boolean;
  client_consent_date?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_by: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  implemented_by?: string;
  implemented_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow_type: 'restructuring' | 'loan_approval' | 'payment_plan' | 'write_off';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalInstance {
  id: string;
  workflow_id: string;
  entity_type: 'restructuring' | 'loan_approval' | 'payment_plan' | 'write_off';
  entity_id: string;
  current_step_id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_by: string;
  submitted_at: string;
  completed_at?: string;
  created_at: string;
}

export interface CommunicationLog {
  id: string;
  client_id: number;
  loan_id: number;
  communication_type: 'sms' | 'email' | 'phone_call' | 'in_person' | 'letter';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'read' | 'responded';
  sent_by: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  response_received_at?: string;
  metadata?: any;
}

export interface RestructuringImpact {
  original_monthly_payment: number;
  new_monthly_payment: number;
  total_interest_savings: number;
  total_payment_reduction: number;
  new_total_amount: number;
}

// =============================================
// REPAYMENT MANAGEMENT SERVICE
// =============================================

export class RepaymentRestructuringService {
  
  // =============================================
  // REPAYMENT OPERATIONS
  // =============================================

  // Get all repayments for a loan
  static async getLoanRepayments(loanId: number): Promise<{ data: LoanRepayment[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_repayments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching loan repayments:', error);
      return { data: null, error: error.message };
    }
  }

  // Get all repayments for a user
  static async getUserRepayments(userId: number): Promise<{ data: LoanRepayment[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_repayments')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user repayments:', error);
      return { data: null, error: error.message };
    }
  }

  // Create a new repayment
  static async createRepayment(repaymentData: {
    loan_id: number;
    user_id: number;
    amount: number;
    payment_method: 'm_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'cash';
    reference_number?: string;
    notes?: string;
  }): Promise<{ data: LoanRepayment | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_repayments')
        .insert({
          ...repaymentData,
          payment_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating repayment:', error);
      return { data: null, error: error.message };
    }
  }

  // Update repayment
  static async updateRepayment(repaymentId: number, updates: Partial<LoanRepayment>): Promise<{ data: LoanRepayment | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_repayments')
        .update(updates)
        .eq('id', repaymentId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating repayment:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete repayment
  static async deleteRepayment(repaymentId: number): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('loan_repayments')
        .delete()
        .eq('id', repaymentId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting repayment:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // RESTRUCTURING OPERATIONS
  // =============================================

  // Get all restructuring requests
  static async getRestructuringRequests(filters?: {
    status?: string;
    client_id?: number;
    loan_id?: number;
    priority?: string;
  }): Promise<{ data: LoanRestructuring[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('loan_restructuring')
        .select(`
          *,
          loans!inner(principal_amount, interest_amount, total_amount, status),
          clients!inner(name, phone, email)
        `)
        .order('submitted_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.loan_id) {
        query = query.eq('loan_id', filters.loan_id);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching restructuring requests:', error);
      return { data: null, error: error.message };
    }
  }

  // Get restructuring request by ID
  static async getRestructuringRequest(id: string): Promise<{ data: LoanRestructuring | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_restructuring')
        .select(`
          *,
          loans!inner(principal_amount, interest_amount, total_amount, status),
          clients!inner(name, phone, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching restructuring request:', error);
      return { data: null, error: error.message };
    }
  }

  // Create restructuring request
  static async createRestructuringRequest(restructuringData: {
    loan_id: number;
    client_id: number;
    original_tenor: number;
    original_interest_rate: number;
    original_monthly_payment: number;
    original_principal_balance: number;
    new_tenor: number;
    new_interest_rate: number;
    new_monthly_payment: number;
    grace_period?: number;
    total_interest_savings: number;
    total_payment_reduction: number;
    new_total_amount: number;
    reason: string;
    justification: string;
    client_consent?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<{ data: LoanRestructuring | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('loan_restructuring')
        .insert({
          ...restructuringData,
          submitted_by: user.user.id,
          client_consent: restructuringData.client_consent || false,
          priority: restructuringData.priority || 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating restructuring request:', error);
      return { data: null, error: error.message };
    }
  }

  // Update restructuring request
  static async updateRestructuringRequest(id: string, updates: Partial<LoanRestructuring>): Promise<{ data: LoanRestructuring | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_restructuring')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating restructuring request:', error);
      return { data: null, error: error.message };
    }
  }

  // Calculate restructuring impact
  static async calculateRestructuringImpact(
    principal: number,
    originalRate: number,
    originalTenor: number,
    newRate: number,
    newTenor: number,
    gracePeriod: number = 0
  ): Promise<{ data: RestructuringImpact | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('calculate_restructuring_impact', {
        p_principal: principal,
        p_original_rate: originalRate,
        p_original_tenor: originalTenor,
        p_new_rate: newRate,
        p_new_tenor: newTenor,
        p_grace_period: gracePeriod
      });

      if (error) throw error;
      return { data: data[0] || null, error: null };
    } catch (error) {
      console.error('Error calculating restructuring impact:', error);
      return { data: null, error: error.message };
    }
  }

  // =============================================
  // APPROVAL WORKFLOW OPERATIONS
  // =============================================

  // Get approval workflows
  static async getApprovalWorkflows(workflowType?: string): Promise<{ data: ApprovalWorkflow[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('approval_workflows')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (workflowType) {
        query = query.eq('workflow_type', workflowType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching approval workflows:', error);
      return { data: null, error: error.message };
    }
  }

  // Get approval instances
  static async getApprovalInstances(filters?: {
    status?: string;
    entity_type?: string;
    entity_id?: string;
  }): Promise<{ data: ApprovalInstance[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('approval_instances')
        .select(`
          *,
          approval_workflows(name, description),
          approval_workflow_steps(step_name, required_role)
        `)
        .order('submitted_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching approval instances:', error);
      return { data: null, error: error.message };
    }
  }

  // Create approval instance
  static async createApprovalInstance(
    workflowId: string,
    entityType: string,
    entityId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<{ data: ApprovalInstance | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('approval_instances')
        .insert({
          workflow_id: workflowId,
          entity_type: entityType,
          entity_id: entityId,
          submitted_by: user.user.id,
          priority
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating approval instance:', error);
      return { data: null, error: error.message };
    }
  }

  // =============================================
  // COMMUNICATION OPERATIONS
  // =============================================

  // Get communication logs
  static async getCommunicationLogs(filters?: {
    client_id?: number;
    loan_id?: number;
    communication_type?: string;
    direction?: string;
  }): Promise<{ data: CommunicationLog[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('communication_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.loan_id) {
        query = query.eq('loan_id', filters.loan_id);
      }
      if (filters?.communication_type) {
        query = query.eq('communication_type', filters.communication_type);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching communication logs:', error);
      return { data: null, error: error.message };
    }
  }

  // Create communication log
  static async createCommunicationLog(communicationData: {
    client_id: number;
    loan_id: number;
    communication_type: 'sms' | 'email' | 'phone_call' | 'in_person' | 'letter';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
    status?: 'sent' | 'delivered' | 'failed' | 'read' | 'responded';
    metadata?: any;
  }): Promise<{ data: CommunicationLog | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('communication_logs')
        .insert({
          ...communicationData,
          sent_by: user.user.id,
          status: communicationData.status || 'sent'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating communication log:', error);
      return { data: null, error: error.message };
    }
  }

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================

  // Subscribe to repayment updates
  static subscribeToRepayments(callback: (payload: any) => void) {
    return supabase
      .channel('repayment_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'loan_repayments' }, 
        callback
      )
      .subscribe();
  }

  // Subscribe to restructuring updates
  static subscribeToRestructuring(callback: (payload: any) => void) {
    return supabase
      .channel('restructuring_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'loan_restructuring' }, 
        callback
      )
      .subscribe();
  }

  // Subscribe to approval updates
  static subscribeToApprovals(callback: (payload: any) => void) {
    return supabase
      .channel('approval_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'approval_instances' }, 
        callback
      )
      .subscribe();
  }

  // =============================================
  // ANALYTICS AND REPORTING
  // =============================================

  // Get repayment statistics
  static async getRepaymentStats(loanId?: number): Promise<{ data: any | null; error: string | null }> {
    try {
      let query = supabase
        .from('loan_repayments')
        .select('amount, payment_date, payment_method');

      if (loanId) {
        query = query.eq('loan_id', loanId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalRepayments: data.length,
        totalAmount: data.reduce((sum, r) => sum + r.amount, 0),
        averageAmount: data.length > 0 ? data.reduce((sum, r) => sum + r.amount, 0) / data.length : 0,
        paymentMethods: data.reduce((acc, r) => {
          acc[r.payment_method] = (acc[r.payment_method] || 0) + 1;
          return acc;
        }, {}),
        recentRepayments: data.slice(0, 10)
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching repayment stats:', error);
      return { data: null, error: error.message };
    }
  }

  // Get restructuring statistics
  static async getRestructuringStats(): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('loan_restructuring')
        .select('status, priority, submitted_at, total_interest_savings, total_payment_reduction');

      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalRequests: data.length,
        statusBreakdown: data.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {}),
        priorityBreakdown: data.reduce((acc, r) => {
          acc[r.priority] = (acc[r.priority] || 0) + 1;
          return acc;
        }, {}),
        totalSavings: data.reduce((sum, r) => sum + (r.total_interest_savings || 0), 0),
        totalReductions: data.reduce((sum, r) => sum + (r.total_payment_reduction || 0), 0),
        recentRequests: data.slice(0, 10)
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching restructuring stats:', error);
      return { data: null, error: error.message };
    }
  }
}

export default RepaymentRestructuringService;



























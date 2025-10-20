import { supabase } from '../lib/supabaseClient';

export interface ContractData {
  id?: string;
  loan_application_id: string;
  client_id: string;
  contract_version?: string;
  status: 'generated' | 'sent_to_client' | 'signed_by_client' | 'uploaded' | 'verified' | 'rejected';
  contract_text?: string;
  contract_template_used?: string;
  original_contract_file_path?: string;
  signed_contract_file_path?: string;
  contract_file_size?: number;
  contract_file_type?: string;
  sent_to_client_at?: string;
  sent_via_channel?: 'email' | 'sms' | 'whatsapp' | 'in_person' | 'postal';
  client_signed_at?: string;
  uploaded_at?: string;
  uploaded_by_user_id?: string;
  verified_at?: string;
  verified_by_user_id?: string;
  verification_notes?: string;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  loan_amount: number;
  interest_rate: number;
  management_fee_rate: number;
  repayment_period_months: number;
  total_repayment_amount: number;
  monthly_payment: number;
  client_digital_signature?: string;
  client_signature_timestamp?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

export interface ContractAttachment {
  id?: string;
  contract_id: string;
  attachment_type: 'signed_contract' | 'client_id_copy' | 'guarantor_id_copy' | 'collateral_document' | 'other';
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at?: string;
  uploaded_by_user_id?: string;
  description?: string;
  is_required?: boolean;
  created_at?: string;
}

export class ContractService {
  // Create a new contract record
  static async createContract(contractData: Omit<ContractData, 'id' | 'created_at' | 'updated_at'>): Promise<ContractData> {
    const { data, error } = await supabase
      .from('loan_contracts')
      .insert([contractData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contract: ${error.message}`);
    }

    return data;
  }

  // Get contracts for a loan application
  static async getContractsByLoanApplication(loanApplicationId: string): Promise<ContractData[]> {
    const { data, error } = await supabase
      .from('loan_contracts')
      .select('*')
      .eq('loan_application_id', loanApplicationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contracts: ${error.message}`);
    }

    return data || [];
  }

  // Get contracts for a client
  static async getContractsByClient(clientId: string): Promise<ContractData[]> {
    const { data, error } = await supabase
      .from('loan_contracts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch client contracts: ${error.message}`);
    }

    return data || [];
  }

  // Update contract status
  static async updateContractStatus(
    contractId: string, 
    status: ContractData['status'],
    additionalData?: Partial<ContractData>
  ): Promise<ContractData> {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    const { data, error } = await supabase
      .from('loan_contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contract status: ${error.message}`);
    }

    return data;
  }

  // Upload signed contract file
  static async uploadSignedContract(
    contractId: string,
    file: File,
    uploadedByUserId: string
  ): Promise<ContractData> {
    console.log('📤 Starting contract upload...');
    console.log('Contract ID:', contractId);
    console.log('File:', file.name, file.size, file.type);
    console.log('User ID:', uploadedByUserId);
    
    // Handle demo users - generate a proper UUID for demo mode
    let userId = uploadedByUserId;
    if (uploadedByUserId && uploadedByUserId.startsWith('demo-')) {
      // Generate a proper UUID for demo users
      userId = crypto.randomUUID();
      console.log('Demo user detected, generated UUID:', userId);
    }
    
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${contractId}_signed_contract_${timestamp}.${fileExt}`;
    const filePath = `contracts/signed/${fileName}`;
    
    console.log('File path:', filePath);

    console.log('📤 Uploading to storage...');
    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file, {
        upsert: true // This will overwrite if file exists
      });

    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    console.log('✅ File uploaded to storage successfully');

    // Get public URL
    console.log('🔗 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath);
    
    console.log('Public URL:', publicUrl);

    // Update contract record
    console.log('💾 Updating contract record...');
    const updateData = {
      status: 'uploaded' as const,
      signed_contract_file_path: publicUrl,
      contract_file_size: file.size,
      contract_file_type: file.type,
      uploaded_at: new Date().toISOString(),
      uploaded_by_user_id: userId,
      updated_at: new Date().toISOString()
    };
    
    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('loan_contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database update failed:', error);
      throw new Error(`Failed to update contract with file info: ${error.message}`);
    }
    
    console.log('✅ Contract updated successfully');
    return data;
  }

  // Verify contract
  static async verifyContract(
    contractId: string,
    verificationStatus: 'approved' | 'rejected' | 'needs_revision',
    verificationNotes: string,
    verifiedByUserId: string
  ): Promise<ContractData> {
    // Handle demo users - generate a proper UUID for demo mode
    let userId = verifiedByUserId;
    if (verifiedByUserId && verifiedByUserId.startsWith('demo-')) {
      // Generate a proper UUID for demo users
      userId = crypto.randomUUID();
      console.log('Demo user detected in verification, generated UUID:', userId);
    }
    
    const updateData = {
      status: verificationStatus === 'approved' ? 'verified' as const : 'rejected' as const,
      verification_status: verificationStatus,
      verification_notes: verificationNotes,
      verified_at: new Date().toISOString(),
      verified_by_user_id: userId,
      updated_at: new Date().toISOString()
    };

    console.log('🔍 Starting contract verification...');
    console.log('Contract ID:', contractId);
    console.log('Verification Status:', verificationStatus);
    console.log('Verification Notes:', verificationNotes);
    console.log('User ID:', verifiedByUserId, '→', userId);
    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('loan_contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      console.error('❌ Verification failed:', error);
      throw new Error(`Failed to verify contract: ${error.message}`);
    }
    
    console.log('✅ Contract verification successful');
    
    // Automatically move loan application to disbursement queue after contract verification
    if (verificationStatus === 'approved') {
      console.log('🚀 Moving loan application to disbursement queue...');
      try {
        // Import the workflow tracker
        const { LoanWorkflowTracker } = await import('./loanWorkflowTracker');
        
        // Move to disbursement queue
        await LoanWorkflowTracker.moveToDisbursementQueue(
          contractData.loan_application_id,
          userId
        );
        
        console.log('✅ Loan application moved to disbursement queue');
      } catch (workflowError) {
        console.error('❌ Failed to move to disbursement queue:', workflowError);
        // Don't throw error - contract verification was successful
      }
    } else if (verificationStatus === 'needs_revision') {
      console.log('🚀 Moving loan application to committee approval queue...');
      try {
        // Import the workflow tracker
        const { LoanWorkflowTracker } = await import('./loanWorkflowTracker');
        
        // Move to committee queue
        await LoanWorkflowTracker.moveToCommitteeQueue(
          contractData.loan_application_id,
          userId
        );
        
        console.log('✅ Loan application moved to committee approval queue');
      } catch (workflowError) {
        console.error('❌ Failed to move to committee queue:', workflowError);
        // Don't throw error - contract verification was successful
      }
    }
    
    return data;
  }

  // Add contract attachment
  static async addContractAttachment(
    contractId: string,
    file: File,
    attachmentType: ContractAttachment['attachment_type'],
    description?: string,
    isRequired: boolean = false,
    uploadedByUserId: string
  ): Promise<ContractAttachment> {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${contractId}_${attachmentType}_${Date.now()}.${fileExt}`;
    const filePath = `contracts/attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload attachment: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath);

    // Create attachment record
    const attachmentData = {
      contract_id: contractId,
      attachment_type: attachmentType,
      file_path: publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      uploaded_by_user_id: uploadedByUserId,
      description,
      is_required: isRequired
    };

    const { data, error } = await supabase
      .from('contract_attachments')
      .insert([attachmentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create attachment record: ${error.message}`);
    }

    return data;
  }

  // Get contract attachments
  static async getContractAttachments(contractId: string): Promise<ContractAttachment[]> {
    const { data, error } = await supabase
      .from('contract_attachments')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contract attachments: ${error.message}`);
    }

    return data || [];
  }

  // Delete contract attachment
  static async deleteContractAttachment(attachmentId: string): Promise<void> {
    // Get attachment info first
    const { data: attachment, error: fetchError } = await supabase
      .from('contract_attachments')
      .select('file_path')
      .eq('id', attachmentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch attachment: ${fetchError.message}`);
    }

    // Delete from storage
    const filePath = attachment.file_path.split('/').slice(-2).join('/'); // Get relative path
    const { error: deleteError } = await supabase.storage
      .from('contracts')
      .remove([filePath]);

    if (deleteError) {
      console.warn(`Failed to delete file from storage: ${deleteError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('contract_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      throw new Error(`Failed to delete attachment: ${dbError.message}`);
    }
  }

  // Get contract statistics
  static async getContractStatistics(): Promise<{
    total: number;
    generated: number;
    uploaded: number;
    verified: number;
    rejected: number;
  }> {
    const { data, error } = await supabase
      .from('loan_contracts')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch contract statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      generated: data.filter(c => c.status === 'generated').length,
      uploaded: data.filter(c => c.status === 'uploaded').length,
      verified: data.filter(c => c.status === 'verified').length,
      rejected: data.filter(c => c.status === 'rejected').length
    };

    return stats;
  }

  /**
   * Upload contract file to Supabase Storage
   */
  static async uploadContractFile(file: File, filePath: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.storage
        .from('contracts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      return { error };
    } catch (err) {
      return { error: err };
    }
  }


  /**
   * Update loan application status
   */
  static async updateLoanStatus(
    loanApplicationId: string, 
    status: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);

      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Get contract file URL from storage
   */
  static async getContractFileUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error getting contract file URL:', err);
      return null;
    }
  }

  /**
   * Delete contract file from storage
   */
  static async deleteContractFile(filePath: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.storage
        .from('contracts')
        .remove([filePath]);

      return { error };
    } catch (err) {
      return { error: err };
    }
  }
}

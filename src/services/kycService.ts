import { supabase, handleSupabaseError } from '../lib/supabaseClient';

export interface KYCVerificationData {
  client_id: string;
  verification_type: 'nida_id' | 'photo_capture' | 'biometric' | 'sanctions_screen';
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_data?: any;
  api_response?: any;
  verified_by_user_id?: string;
  expiry_date?: string;
}

export class KYCService {
  // Verify NIDA ID through Jamii X-Change API
  static async verifyNidaId(clientId: string, nidaNumber: string, verifiedBy: string) {
    try {
      // Mock NIDA verification - in real implementation, call Jamii X-Change API
      const mockApiResponse = {
        status: 'success',
        data: {
          nida_number: nidaNumber,
          full_name: 'Mary Kinyangi',
          date_of_birth: '1985-04-25',
          gender: 'Female',
          marital_status: 'Married',
          nationality: 'Tanzanian',
          verification_timestamp: new Date().toISOString()
        },
        api_reference: `NIDA_${Date.now()}`
      };

      // Store verification result
      const verificationData: KYCVerificationData = {
        client_id: clientId,
        verification_type: 'nida_id',
        verification_status: 'verified',
        verification_data: mockApiResponse.data,
        api_response: mockApiResponse,
        verified_by_user_id: verifiedBy,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year
      };

      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert(verificationData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update client KYC status
      await supabase
        .from('clients')
        .update({ kyc_status: 'verified' })
        .eq('id', clientId);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Capture client photo
  static async capturePhoto(clientId: string, photoUrl: string, verifiedBy: string) {
    try {
      const verificationData: KYCVerificationData = {
        client_id: clientId,
        verification_type: 'photo_capture',
        verification_status: 'verified',
        verification_data: { photo_url: photoUrl },
        verified_by_user_id: verifiedBy
      };

      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert(verificationData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update client photo URL
      await supabase
        .from('clients')
        .update({ photo_url: photoUrl })
        .eq('id', clientId);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Capture biometric data
  static async captureBiometric(clientId: string, biometricData: any, verifiedBy: string) {
    try {
      const verificationData: KYCVerificationData = {
        client_id: clientId,
        verification_type: 'biometric',
        verification_status: 'verified',
        verification_data: biometricData,
        verified_by_user_id: verifiedBy
      };

      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert(verificationData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update client fingerprint URL
      await supabase
        .from('clients')
        .update({ fingerprint_url: biometricData.fingerprint_url })
        .eq('id', clientId);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Perform sanctions and PEP screening
  static async performSanctionsScreen(clientId: string, verifiedBy: string) {
    try {
      // Mock sanctions screening - in real implementation, call sanctions API
      const mockScreeningResult = {
        status: 'clear',
        sanctions_matches: [],
        pep_matches: [],
        screening_timestamp: new Date().toISOString(),
        screening_provider: 'World-Check'
      };

      const verificationData: KYCVerificationData = {
        client_id: clientId,
        verification_type: 'sanctions_screen',
        verification_status: 'verified',
        verification_data: mockScreeningResult,
        verified_by_user_id: verifiedBy,
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days
      };

      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert(verificationData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get KYC verification status for client
  static async getKYCStatus(clientId: string) {
    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Analyze verification status
      const verificationTypes = ['nida_id', 'photo_capture', 'biometric', 'sanctions_screen'];
      const completedVerifications = verificationTypes.filter(type =>
        data.some(v => v.verification_type === type && v.verification_status === 'verified')
      );

      const overallStatus = completedVerifications.length === verificationTypes.length ? 'verified' : 'pending';

      return { 
        data: {
          verifications: data,
          overall_status: overallStatus,
          completed_count: completedVerifications.length,
          total_required: verificationTypes.length
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }
}
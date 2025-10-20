import { supabase } from '../lib/supabaseClient';

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  expiry_date?: string;
  is_required: boolean;
  status: 'active' | 'expired' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  type: string;
  name: string;
  required: boolean;
  maxSize: number; // in MB
  allowedTypes: string[];
  description: string;
}

export class DocumentManagementService {
  // Document types configuration
  static readonly DOCUMENT_TYPES: DocumentType[] = [
    {
      type: 'national_id',
      name: 'National ID',
      required: true,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Copy of National ID card'
    },
    {
      type: 'passport',
      name: 'Passport',
      required: false,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Copy of passport (if applicable)'
    },
    {
      type: 'birth_certificate',
      name: 'Birth Certificate',
      required: true,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Copy of birth certificate'
    },
    {
      type: 'educational_certificate',
      name: 'Educational Certificate',
      required: true,
      maxSize: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Highest educational qualification certificate'
    },
    {
      type: 'employment_contract',
      name: 'Employment Contract',
      required: true,
      maxSize: 10,
      allowedTypes: ['application/pdf'],
      description: 'Signed employment contract'
    },
    {
      type: 'nssf_card',
      name: 'NSSF Card',
      required: true,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'NSSF membership card'
    },
    {
      type: 'bank_details',
      name: 'Bank Account Details',
      required: true,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Bank account statement or details'
    },
    {
      type: 'emergency_contact',
      name: 'Emergency Contact Form',
      required: true,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Emergency contact information form'
    },
    {
      type: 'medical_certificate',
      name: 'Medical Certificate',
      required: true,
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Medical fitness certificate'
    },
    {
      type: 'reference_letter',
      name: 'Reference Letter',
      required: false,
      maxSize: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      description: 'Reference letter from previous employer'
    }
  ];

  // Get all documents for an employee
  static async getEmployeeDocuments(employeeId: string): Promise<{ data: EmployeeDocument[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching employee documents:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getEmployeeDocuments:', error);
      return { data: [], error: 'Failed to fetch employee documents' };
    }
  }

  // Upload document
  static async uploadDocument(
    employeeId: string,
    documentType: string,
    file: File,
    uploadedBy: string,
    expiryDate?: string
  ): Promise<{ data: EmployeeDocument | null; error: string | null }> {
    try {
      // Validate file type and size
      const docType = this.DOCUMENT_TYPES.find(dt => dt.type === documentType);
      if (!docType) {
        return { data: null, error: 'Invalid document type' };
      }

      if (!docType.allowedTypes.includes(file.type)) {
        return { data: null, error: `File type not allowed. Allowed types: ${docType.allowedTypes.join(', ')}` };
      }

      if (file.size > docType.maxSize * 1024 * 1024) {
        return { data: null, error: `File too large. Maximum size: ${docType.maxSize}MB` };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `employee-documents/${employeeId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { data: null, error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath);

      // Save document record to database
      const { data, error } = await supabase
        .from('employee_documents')
        .insert([{
          employee_id: employeeId,
          document_type: documentType,
          document_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: uploadedBy,
          expiry_date: expiryDate,
          is_required: docType.required,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving document record:', error);
        // Clean up uploaded file
        await supabase.storage
          .from('employee-documents')
          .remove([filePath]);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      return { data: null, error: 'Failed to upload document' };
    }
  }

  // Update document
  static async updateDocument(
    documentId: string,
    updates: Partial<EmployeeDocument>
  ): Promise<{ data: EmployeeDocument | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating document:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateDocument:', error);
      return { data: null, error: 'Failed to update document' };
    }
  }

  // Delete document
  static async deleteDocument(documentId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get document details first
      const { data: document, error: fetchError } = await supabase
        .from('employee_documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Error fetching document:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        console.error('Error deleting document record:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Delete from storage
      if (document?.file_url) {
        const filePath = document.file_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('employee-documents')
          .remove([filePath]);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      return { success: false, error: 'Failed to delete document' };
    }
  }

  // Get document types
  static getDocumentTypes(): DocumentType[] {
    return this.DOCUMENT_TYPES;
  }

  // Check if employee has all required documents
  static async checkRequiredDocuments(employeeId: string): Promise<{ 
    hasAllRequired: boolean; 
    missing: string[]; 
    expired: string[]; 
    error: string | null 
  }> {
    try {
      const { data: documents, error } = await this.getEmployeeDocuments(employeeId);
      
      if (error) {
        return { hasAllRequired: false, missing: [], expired: [], error };
      }

      const requiredTypes = this.DOCUMENT_TYPES.filter(dt => dt.required).map(dt => dt.type);
      const uploadedTypes = documents.map(doc => doc.document_type);
      const missing = requiredTypes.filter(type => !uploadedTypes.includes(type));
      
      const now = new Date();
      const expired = documents
        .filter(doc => doc.expiry_date && new Date(doc.expiry_date) < now)
        .map(doc => doc.document_type);

      return {
        hasAllRequired: missing.length === 0 && expired.length === 0,
        missing,
        expired,
        error: null
      };
    } catch (error) {
      console.error('Error in checkRequiredDocuments:', error);
      return { hasAllRequired: false, missing: [], expired: [], error: 'Failed to check required documents' };
    }
  }

  // Get document statistics
  static async getDocumentStatistics(): Promise<{ data: any; error: string | null }> {
    try {
      const { data: documents, error } = await supabase
        .from('employee_documents')
        .select('document_type, status, expiry_date');

      if (error) {
        console.error('Error fetching document statistics:', error);
        return { data: null, error: error.message };
      }

      const now = new Date();
      const stats = {
        total: documents?.length || 0,
        byType: documents?.reduce((acc: any, doc) => {
          acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
          return acc;
        }, {}) || {},
        byStatus: documents?.reduce((acc: any, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        }, {}) || {},
        expired: documents?.filter(doc => 
          doc.expiry_date && new Date(doc.expiry_date) < now
        ).length || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error in getDocumentStatistics:', error);
      return { data: null, error: 'Failed to fetch document statistics' };
    }
  }
}



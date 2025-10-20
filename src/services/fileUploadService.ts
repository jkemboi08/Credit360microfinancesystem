import { supabase } from '../lib/supabaseClient';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface UploadedFile {
  file: File;
  type: 'photo' | 'id_document' | 'fingerprint' | 'salary_slip' | 'collateral_document' | 'bank_statement' | 'client_documents';
  clientId?: string;
}

export class FileUploadService {
  // Upload a single file to Supabase storage
  static async uploadFile(
    file: File, 
    type: UploadedFile['type'], 
    clientId?: string
  ): Promise<FileUploadResult> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Determine bucket and path based on file type
      const { bucket, path } = this.getBucketAndPath(type, clientId, fileName);
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('File upload exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: UploadedFile[]
  ): Promise<{ [key: string]: FileUploadResult }> {
    const results: { [key: string]: FileUploadResult } = {};
    
    for (const uploadedFile of files) {
      const key = `${uploadedFile.type}_${uploadedFile.clientId || 'temp'}`;
      results[key] = await this.uploadFile(
        uploadedFile.file, 
        uploadedFile.type, 
        uploadedFile.clientId
      );
    }
    
    return results;
  }

  // Delete a file from storage
  static async deleteFile(bucket: string, path: string): Promise<FileUploadResult> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get file URL from storage
  static getFileUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Private helper to determine bucket and path
  private static getBucketAndPath(
    type: UploadedFile['type'], 
    clientId?: string, 
    fileName: string
  ): { bucket: string; path: string } {
    const basePath = clientId ? `clients/${clientId}` : 'temp';
    
    switch (type) {
      case 'photo':
        return {
          bucket: 'client-photos',
          path: `${basePath}/${fileName}`
        };
      case 'id_document':
        return {
          bucket: 'client-documents', // Using client-documents for ID documents
          path: `${basePath}/id_documents/${fileName}`
        };
      case 'fingerprint':
        return {
          bucket: 'client-documents', // Using client-documents for fingerprints
          path: `${basePath}/fingerprints/${fileName}`
        };
      case 'salary_slip':
        return {
          bucket: 'salary-slips', // Using dedicated salary-slips bucket
          path: `${basePath}/${fileName}`
        };
      case 'collateral_document':
        return {
          bucket: 'collateral-documents', // Using dedicated collateral-documents bucket
          path: `${basePath}/${fileName}`
        };
      case 'bank_statement':
        return {
          bucket: 'client-documents',
          path: `${basePath}/bank_statements/${fileName}`
        };
      case 'client_documents':
        return {
          bucket: 'client-documents',
          path: `${basePath}/documents/${fileName}`
        };
      default:
        return {
          bucket: 'client-documents',
          path: `${basePath}/misc/${fileName}`
        };
    }
  }

  // Validate file before upload
  static validateFile(file: File, type: UploadedFile['type']): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type based on upload type
    const allowedTypes = this.getAllowedFileTypes(type);
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Get allowed file types for each upload type
  private static getAllowedFileTypes(type: UploadedFile['type']): string[] {
    switch (type) {
      case 'photo':
        return ['image/jpeg', 'image/jpg', 'image/png'];
      case 'id_document':
        return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      case 'fingerprint':
        return ['image/jpeg', 'image/jpg', 'image/png'];
      case 'salary_slip':
        return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      case 'collateral_document':
        return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      case 'bank_statement':
        return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      case 'client_documents':
        return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      default:
        return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    }
  }
}

import { supabase } from '../lib/supabaseClient';

export interface LetterheadData {
  id?: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  is_active: boolean;
  created_at?: string;
  created_by_user_id: string;
}

export class LetterheadService {
  static TABLE_NAME = 'letterhead_templates';

  // Get the active letterhead
  static async getActiveLetterhead(): Promise<LetterheadData | null> {
    try {
      // First try database
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_active', true)
        .single();

      if (data) return data;
      
      // If no database data, check localStorage
      const localLetterhead = localStorage.getItem('active_letterhead');
      if (localLetterhead) {
        return JSON.parse(localLetterhead);
      }

      return null;
    } catch (error) {
      console.error('Error fetching active letterhead:', error);
      // Fallback to localStorage
      const localLetterhead = localStorage.getItem('active_letterhead');
      if (localLetterhead) {
        return JSON.parse(localLetterhead);
      }
      return null;
    }
  }

  // Upload and set new letterhead
  static async uploadLetterhead(
    file: File, 
    userId: string
  ): Promise<LetterheadData> {
    try {
      // For now, use localStorage as fallback until database is set up
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          const letterheadData = {
            id: `local-${Date.now()}`,
            file_name: file.name,
            file_url: base64Data,
            file_size: file.size,
            mime_type: file.type,
            is_active: true,
            created_at: new Date().toISOString(),
            created_by_user_id: userId
          };
          
          // Store in localStorage as fallback
          localStorage.setItem('active_letterhead', JSON.stringify(letterheadData));
          resolve(letterheadData);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading letterhead:', error);
      throw error;
    }
  }

  // Check if letterhead exists
  static async hasActiveLetterhead(): Promise<boolean> {
    const letterhead = await this.getActiveLetterhead();
    return letterhead !== null;
  }
}

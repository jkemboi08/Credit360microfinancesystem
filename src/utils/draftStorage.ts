// Draft storage utility for saving form data locally
// This prevents data loss when errors occur during form submission

export interface DraftData {
  formData: any;
  currentStep: number;
  uploadedFiles: { [key: string]: File | null };
  timestamp: number;
  formType: 'client' | 'loan';
}

export class DraftStorage {
  private static readonly DRAFT_PREFIX = 'draft_';
  private static readonly MAX_DRAFTS = 5; // Keep only last 5 drafts

  // Save draft data to localStorage
  static saveDraft(formType: 'client' | 'loan', formData: any, currentStep: number = 1, uploadedFiles: { [key: string]: File | null } = {}) {
    try {
      const draftData: DraftData = {
        formData,
        currentStep,
        uploadedFiles: this.serializeFiles(uploadedFiles),
        timestamp: Date.now(),
        formType
      };

      const key = `${this.DRAFT_PREFIX}${formType}`;
      localStorage.setItem(key, JSON.stringify(draftData));
      
      // Clean up old drafts
      this.cleanupOldDrafts();
      
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }

  // Load draft data from localStorage
  static loadDraft(formType: 'client' | 'loan'): DraftData | null {
    try {
      const key = `${this.DRAFT_PREFIX}${formType}`;
      const draftData = localStorage.getItem(key);
      
      if (!draftData) {
        return null;
      }

      const parsed: DraftData = JSON.parse(draftData);
      
      // Check if draft is not too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      if (Date.now() - parsed.timestamp > maxAge) {
        this.clearDraft(formType);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }

  // Clear draft data
  static clearDraft(formType: 'client' | 'loan') {
    try {
      const key = `${this.DRAFT_PREFIX}${formType}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing draft:', error);
      return false;
    }
  }

  // Check if draft exists
  static hasDraft(formType: 'client' | 'loan'): boolean {
    return this.loadDraft(formType) !== null;
  }

  // Get all drafts
  static getAllDrafts(): DraftData[] {
    const drafts: DraftData[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.DRAFT_PREFIX)) {
          const draftData = localStorage.getItem(key);
          if (draftData) {
            const parsed: DraftData = JSON.parse(draftData);
            drafts.push(parsed);
          }
        }
      }
    } catch (error) {
      console.error('Error getting all drafts:', error);
    }

    return drafts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Serialize files for storage (convert to base64)
  private static serializeFiles(files: { [key: string]: File | null }): { [key: string]: string | null } {
    const serialized: { [key: string]: string | null } = {};
    
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        // For now, we'll store file metadata only
        // In a real implementation, you might want to store base64 or use a different approach
        serialized[key] = JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
      } else {
        serialized[key] = null;
      }
    });

    return serialized;
  }

  // Deserialize files from storage
  static deserializeFiles(serializedFiles: { [key: string]: string | null }): { [key: string]: File | null } {
    const files: { [key: string]: File | null } = {};
    
    Object.entries(serializedFiles).forEach(([key, serialized]) => {
      if (serialized) {
        try {
          const fileData = JSON.parse(serialized);
          // Note: We can't recreate the actual File object from metadata
          // This is a limitation of localStorage - files would need to be re-uploaded
          files[key] = null; // Will need to be re-uploaded
        } catch (error) {
          files[key] = null;
        }
      } else {
        files[key] = null;
      }
    });

    return files;
  }

  // Clean up old drafts
  private static cleanupOldDrafts() {
    try {
      const drafts = this.getAllDrafts();
      
      if (drafts.length > this.MAX_DRAFTS) {
        // Sort by timestamp and keep only the most recent ones
        const sortedDrafts = drafts.sort((a, b) => b.timestamp - a.timestamp);
        const draftsToRemove = sortedDrafts.slice(this.MAX_DRAFTS);
        
        draftsToRemove.forEach(draft => {
          this.clearDraft(draft.formType);
        });
      }
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
    }
  }

  // Get draft age in human readable format
  static getDraftAge(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}























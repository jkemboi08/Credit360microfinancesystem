// cache.ts
import { LRUCache } from 'lru-cache';

export class SupabaseCache {
  private static userProfileCache = new LRUCache<string, any>({
    max: 100, // Maximum number of items
    maxAge: 1000 * 60 * 15 // 15 minutes
  });

  static async getUserProfile(supabase: any, userId: string) {
    // Check cache first
    if (this.userProfileCache.has(userId)) {
      return this.userProfileCache.get(userId);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Store in cache
      this.userProfileCache.set(userId, data);
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  // Method to manually invalidate cache
  static invalidateUserProfile(userId: string) {
    this.userProfileCache.delete(userId);
  }

  // Clear entire cache
  static clearCache() {
    this.userProfileCache.clear();
  }
}
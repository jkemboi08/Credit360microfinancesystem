/**
 * Utility to clean up orphaned client records
 * This removes clients that don't have corresponding detail records
 */

import { supabase } from '../lib/supabaseClient';

export async function cleanupOrphanedClients(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    console.log('🧹 Starting cleanup of orphaned client records...');

    // Find clients that don't have corresponding individual_client_details
    const { data: orphanedClients, error: findError } = await supabase
      .from('clients')
      .select('id, client_type, created_at')
      .not('id', 'in', 
        supabase
          .from('individual_client_details')
          .select('client_id')
      )
      .not('id', 'in',
        supabase
          .from('corporate_client_details')
          .select('client_id')
      )
      .not('id', 'in',
        supabase
          .from('group_client_details')
          .select('client_id')
      );

    if (findError) {
      console.error('❌ Error finding orphaned clients:', findError);
      return { success: false, deletedCount: 0, error: findError.message };
    }

    if (!orphanedClients || orphanedClients.length === 0) {
      console.log('✅ No orphaned clients found');
      return { success: true, deletedCount: 0 };
    }

    console.log(`🔍 Found ${orphanedClients.length} orphaned clients:`, orphanedClients);

    // Delete orphaned clients
    const clientIds = orphanedClients.map(client => client.id);
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .in('id', clientIds);

    if (deleteError) {
      console.error('❌ Error deleting orphaned clients:', deleteError);
      return { success: false, deletedCount: 0, error: deleteError.message };
    }

    console.log(`✅ Successfully deleted ${orphanedClients.length} orphaned clients`);
    return { success: true, deletedCount: orphanedClients.length };

  } catch (error) {
    console.error('❌ Error in cleanupOrphanedClients:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to run cleanup from browser console
if (typeof window !== 'undefined') {
  (window as any).cleanupOrphanedClients = cleanupOrphanedClients;
}


















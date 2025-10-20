// Database Migration Runner
// This utility helps run the accounting database migration

import { supabase } from '../lib/supabaseClient';

export const runAccountingMigration = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Starting accounting database migration...');
    
    // Check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('chart_of_accounts')
      .select('count')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
        return {
          success: false,
          error: 'Database tables not found. Please run the SQL migration file: supabase/migrations/20250128000000_create_accounting_tables.sql'
        };
      }
      return {
        success: false,
        error: `Database connection error: ${testError.message}`
      };
    }
    
    return {
      success: true,
      error: undefined
    };
  } catch (error) {
    console.error('Migration check failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const checkDatabaseStatus = async (): Promise<{
  isConnected: boolean;
  tablesExist: boolean;
  error?: string;
}> => {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('chart_of_accounts')
      .select('count')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
        return {
          isConnected: true,
          tablesExist: false,
          error: 'Accounting tables not found'
        };
      }
      return {
        isConnected: false,
        tablesExist: false,
        error: testError.message
      };
    }
    
    return {
      isConnected: true,
      tablesExist: true,
      error: undefined
    };
  } catch (error) {
    return {
      isConnected: false,
      tablesExist: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};






















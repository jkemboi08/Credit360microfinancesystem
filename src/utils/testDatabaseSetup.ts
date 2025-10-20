// Test database and storage setup for contracts
import { supabase } from '../lib/supabaseClient';

export async function testDatabaseSetup() {
  console.log('🔍 Testing database and storage setup...');
  
  try {
    // Test 1: Check if loan_contracts table exists
    console.log('📋 Testing loan_contracts table...');
    const { data: contracts, error: contractsError } = await supabase
      .from('loan_contracts')
      .select('id')
      .limit(1);
    
    if (contractsError) {
      console.error('❌ loan_contracts table error:', contractsError);
    } else {
      console.log('✅ loan_contracts table accessible');
    }
    
    // Test 2: Check if contract_attachments table exists
    console.log('📋 Testing contract_attachments table...');
    const { data: attachments, error: attachmentsError } = await supabase
      .from('contract_attachments')
      .select('id')
      .limit(1);
    
    if (attachmentsError) {
      console.error('❌ contract_attachments table error:', attachmentsError);
    } else {
      console.log('✅ contract_attachments table accessible');
    }
    
    // Test 3: Check if contracts storage bucket exists
    console.log('📋 Testing contracts storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError);
    } else {
      const contractsBucket = buckets?.find(bucket => bucket.name === 'contracts');
      if (contractsBucket) {
        console.log('✅ contracts storage bucket exists');
      } else {
        console.error('❌ contracts storage bucket not found');
        console.log('Available buckets:', buckets?.map(b => b.name));
      }
    }
    
    return {
      contractsTable: !contractsError,
      attachmentsTable: !attachmentsError,
      storageBucket: buckets?.some(b => b.name === 'contracts') || false
    };
    
  } catch (error) {
    console.error('❌ Database setup test failed:', error);
    return {
      contractsTable: false,
      attachmentsTable: false,
      storageBucket: false
    };
  }
}




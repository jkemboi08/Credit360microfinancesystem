// Network diagnostics utility for debugging connection issues

export interface NetworkTestResult {
  success: boolean;
  error?: string;
  details?: any;
}

export const testSupabaseConnectivity = async (): Promise<NetworkTestResult> => {
  try {
    console.log('🔍 Testing Supabase connectivity...');
    
    // Test 1: Basic DNS resolution with retry logic
    const supabaseUrl = 'https://klmfbakjbihbgbvbvidw.supabase.co';
    
    let dnsSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(supabaseUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        console.log('✅ Basic connectivity test passed');
        dnsSuccess = true;
        break;
      } catch (dnsError) {
        console.warn(`⚠️ DNS resolution attempt ${attempt} failed:`, dnsError);
        if (attempt === 3) {
          console.error('❌ DNS resolution failed after 3 attempts:', dnsError);
          return {
            success: false,
            error: 'DNS resolution failed. Please check your internet connection and try again.',
            details: dnsError
          };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    // Test 2: Supabase REST API endpoint with retry logic
    let apiSuccess = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const restUrl = `${supabaseUrl}/rest/v1/`;
        const response = await fetch(restUrl, {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWZiYWtqYmloYmdidmJ2aWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODczNjEsImV4cCI6MjA2Nzg2MzM2MX0.a6HqB6Az-rbcLx7nq6nc036EBNWegPFTwkMn6wh2dYE',
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          console.log('✅ Supabase REST API accessible');
          apiSuccess = true;
          break;
        } else {
          console.warn(`⚠️ Supabase REST API returned status: ${response.status}`);
          if (attempt === 2) {
            return {
              success: false,
              error: `Supabase API returned status ${response.status}. Please check your connection.`,
              details: { status: response.status, statusText: response.statusText }
            };
          }
        }
      } catch (apiError) {
        console.warn(`⚠️ Supabase REST API attempt ${attempt} failed:`, apiError);
        if (attempt === 2) {
          console.error('❌ Supabase REST API test failed after 2 attempts:', apiError);
          return {
            success: false,
            error: 'Supabase API not accessible. Please check your internet connection and try again.',
            details: apiError
          };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Test 3: Supabase Auth endpoint
    try {
      const authUrl = `${supabaseUrl}/auth/v1/`;
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWZiYWtqYmloYmdidmJ2aWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODczNjEsImV4cCI6MjA2Nzg2MzM2MX0.a6HqB6Az-rbcLx7nq6nc036EBNWegPFTwkMn6wh2dYE'
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase Auth API accessible');
      } else {
        console.warn('⚠️ Supabase Auth API returned status:', response.status);
      }
    } catch (authError) {
      console.error('❌ Supabase Auth API test failed:', authError);
      return {
        success: false,
        error: 'Supabase Auth API not accessible. Please check your internet connection.',
        details: authError
      };
    }
    
    console.log('✅ All connectivity tests passed');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Network diagnostics failed:', error);
    return {
      success: false,
      error: 'Network diagnostics failed. Please check your internet connection.',
      details: error
    };
  }
};

export const runNetworkDiagnostics = async (): Promise<void> => {
  console.log('🔧 Running network diagnostics...');
  
  const result = await testSupabaseConnectivity();
  
  if (result.success) {
    console.log('✅ Network diagnostics completed successfully');
  } else {
    console.error('❌ Network diagnostics failed:', result.error);
    console.error('📊 Details:', result.details);
  }
};


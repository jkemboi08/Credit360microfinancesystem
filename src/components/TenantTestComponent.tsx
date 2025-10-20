import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { Building2, Users, Settings, AlertCircle, CheckCircle } from 'lucide-react';

const TenantTestComponent: React.FC = () => {
  const { currentTenant, tenants, loading, error, switchTenant, refreshTenants } = useTenant();
  const { user } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<{
    tenantContext: boolean;
    userContext: boolean;
    tenantSwitch: boolean;
    dataLoading: boolean;
  } | null>(null);

  const runTests = async () => {
    const results = {
      tenantContext: !!currentTenant,
      userContext: !!user,
      tenantSwitch: tenants.length > 0,
      dataLoading: !loading
    };
    
    setTestResults(results);

    // Test tenant switching if multiple tenants exist
    if (tenants.length > 1) {
      try {
        await switchTenant(tenants[1].id);
        // Switch back to original
        setTimeout(() => switchTenant(tenants[0].id), 1000);
      } catch (err) {
        console.error('Tenant switch test failed:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Tenant Test Component</h3>
        </div>
        <div className="text-gray-500">Loading tenant data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center space-x-2 mb-4">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Tenant Test Component</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Current Tenant</h4>
          {currentTenant ? (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: currentTenant.primary_color || '#3B82F6' }}
                >
                  {currentTenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{currentTenant.name}</div>
                  <div className="text-sm text-gray-500">{currentTenant.domain}</div>
                  <div className="text-xs text-gray-400">Status: {currentTenant.status}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No tenant selected</div>
          )}
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Available Tenants</h4>
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: tenant.primary_color || '#3B82F6' }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm">{tenant.name}</span>
                </div>
                <button
                  onClick={() => switchTenant(tenant.id)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Switch
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">User Context</h4>
          <div className="p-3 bg-gray-50 rounded-md">
            {user ? (
              <div>
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-gray-500">Role: {user.role}</div>
              </div>
            ) : (
              <div className="text-gray-500">No user logged in</div>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Run Tests
          </button>
          <button
            onClick={refreshTenants}
            className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Refresh Tenants
          </button>
        </div>

        {testResults && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Test Results</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {testResults.tenantContext ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Tenant Context: {testResults.tenantContext ? 'Working' : 'Failed'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {testResults.userContext ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">User Context: {testResults.userContext ? 'Working' : 'Failed'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {testResults.tenantSwitch ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Tenant Switch: {testResults.tenantSwitch ? 'Working' : 'Failed'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {testResults.dataLoading ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Data Loading: {testResults.dataLoading ? 'Working' : 'Failed'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantTestComponent;





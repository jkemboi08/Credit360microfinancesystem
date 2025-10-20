// Tenant Switcher Component
// Allows users to switch between tenants they have access to

import React, { useState } from 'react';
import { useTenantAwareAuth } from '../context/TenantAwareAuthContext';

interface TenantSwitcherProps {
  className?: string;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ className = '' }) => {
  const { user, currentTenant, switchTenant } = useTenantAwareAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!user || !user.tenants || user.tenants.length <= 1) {
    return null; // Don't show switcher if user has no tenants or only one tenant
  }

  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === currentTenant?.id) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const result = await switchTenant(tenantId);
      if (result.success) {
        setIsOpen(false);
        // Optionally show success message
        console.log('Tenant switched successfully');
      } else {
        console.error('Failed to switch tenant:', result.error);
        // Optionally show error message
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>{currentTenant?.name || 'Select Tenant'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Available Tenants
            </div>
            {user.tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleTenantSwitch(tenant.id)}
                disabled={switching}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 ${
                  tenant.id === currentTenant?.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-gray-500">{tenant.subdomain}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tenant.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : tenant.status === 'SUSPENDED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.status}
                    </span>
                    {tenant.id === currentTenant?.id && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
// Tenant Context Indicator Component
// Shows current tenant information and context

import React from 'react';
import { useTenantAwareAuth } from '../context/TenantAwareAuthContext';

interface TenantContextIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const TenantContextIndicator: React.FC<TenantContextIndicatorProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const { currentTenant, user } = useTenantAwareAuth();

  if (!currentTenant) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span>No tenant context</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          currentTenant.status === 'ACTIVE' 
            ? 'bg-green-500' 
            : currentTenant.status === 'SUSPENDED'
            ? 'bg-red-500'
            : 'bg-yellow-500'
        }`}></div>
        <span className="text-sm font-medium text-gray-700">
          {currentTenant.name}
        </span>
        {showDetails && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span>•</span>
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              {currentTenant.plan}
            </span>
            <span>•</span>
            <span>{currentTenant.subdomain}</span>
          </div>
        )}
      </div>
      
      {user && (
        <div className="text-xs text-gray-500">
          ({user.role})
        </div>
      )}
    </div>
  );
};






























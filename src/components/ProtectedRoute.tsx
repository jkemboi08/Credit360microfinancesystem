import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'staff' | 'client' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useSupabaseAuth();

  console.log('ProtectedRoute - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'role:', role);

  if (loading) {
    console.log('ProtectedRoute - showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we initialize your session</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - user not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role) {
    // Map SupabaseAuth roles to route roles
    const isStaffRole = user.role === 'admin' || user.role === 'manager' || user.role === 'staff';
    const isClientRole = user.role === 'client';
    const isAdminRole = user.role === 'admin';
    
    if (role === 'admin' && !isAdminRole) {
      return <Navigate to="/staff/dashboard" replace />;
    }
    if (role === 'staff' && !isStaffRole) {
      return <Navigate to="/client/dashboard" replace />;
    }
    if (role === 'client' && !isClientRole) {
      return <Navigate to="/staff/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
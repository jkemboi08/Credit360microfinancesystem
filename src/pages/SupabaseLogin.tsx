// Supabase Login Page
// Production-ready login with proper Supabase authentication

import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SupabaseLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  const { signIn, user, isAuthenticated, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return '/admin/dashboard';
      case 'TENANT_ADMIN':
        return '/tenant/dashboard';
      case 'TENANT_USER':
        return '/dashboard';
      case 'CLIENT':
        return '/client/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful! Welcome back.');
        // Navigation will be handled by useEffect
      } else {
        setError(result.error || 'Login failed');
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Demo credentials for testing
      const demoCredentials = {
        'PLATFORM_ADMIN': { email: 'admin@creditmanagement.com', password: 'admin123' },
        'TENANT_ADMIN': { email: 'tenant@rythm.com', password: 'tenant123' },
        'TENANT_USER': { email: 'user@rythm.com', password: 'user123' },
        'CLIENT': { email: 'client@example.com', password: 'client123' }
      };

      const credentials = demoCredentials[role as keyof typeof demoCredentials];
      if (credentials) {
        const result = await signIn(credentials.email, credentials.password);
        
        if (result.success) {
          toast.success(`Demo ${role} login successful!`);
        } else {
          setError(result.error || 'Demo login failed');
          toast.error(result.error || 'Demo login failed');
        }
      }
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo login failed');
      toast.error('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🏦</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Credit Management System</h2>
            <p className="text-gray-600 mt-2">Secure Login Portal</p>
            
            {/* Language Selector */}
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Login Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Demo Login Buttons */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 text-center mb-4">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('PLATFORM_ADMIN')}
                  disabled={isLoading}
                  className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50"
                >
                  Platform Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('TENANT_ADMIN')}
                  disabled={isLoading}
                  className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                >
                  Tenant Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('TENANT_USER')}
                  disabled={isLoading}
                  className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                >
                  Tenant User
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('CLIENT')}
                  disabled={isLoading}
                  className="px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 disabled:opacity-50"
                >
                  Client
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-center">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            <a href="#" className="hover:text-blue-600">Privacy Policy</a> | 
            <a href="#" className="hover:text-blue-600 ml-1">Terms of Use</a> | 
            <a href="#" className="hover:text-blue-600 ml-1">Contact Support</a>
          </p>
          <p className="text-xs">
            Protected by Supabase Auth | Compliant with BoT Regulations 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseLogin;






























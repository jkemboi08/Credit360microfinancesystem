import React from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Globe, User, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, signOut } = useSupabaseAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isInStaffPortal = location.pathname.startsWith('/staff');
  const isInClientPortal = location.pathname.startsWith('/client');
  
  const handlePortalSwitch = () => {
    if (isInStaffPortal) {
      navigate('/client/dashboard');
    } else {
      navigate('/staff/dashboard');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };


  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center flex-shrink-0">
              <img src="/mfi_logo__2_-removebg-preview.png" alt="RYTHM Microfinance Limited Logo" className="h-10 w-auto mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">RYTHM Microfinance Limited</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">

            {/* App Owner Dashboard Link */}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/app-owner')}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">App Owner</span>
              </button>
            )}

            {/* Portal Switcher for Admin */}
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600">
                  {isInStaffPortal ? 'Staff Portal' : 'Client Portal'}
                </span>
                <button
                  onClick={handlePortalSwitch}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                  title={`Switch to ${isInStaffPortal ? 'Client' : 'Staff'} Portal`}
                >
                  {isInStaffPortal ? (
                    <ToggleLeft className="w-5 h-5" />
                  ) : (
                    <ToggleRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center space-x-2">
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

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <span className="text-xs text-gray-500 capitalize">({user?.role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
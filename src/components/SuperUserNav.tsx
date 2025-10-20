// Super User Navigation Component
// Quick access navigation for superuser features
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Crown, 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard, 
  Server,
  Home,
  LogOut
} from 'lucide-react';

const SuperUserNav: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home, href: '/superuser' },
    { id: 'tenants', label: 'Tenants', icon: Building2, href: '/superuser#tenants' },
    { id: 'users', label: 'Users', icon: Users, href: '/superuser#users' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/superuser#analytics' },
    { id: 'billing', label: 'Billing', icon: CreditCard, href: '/superuser#billing' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/superuser#settings' },
    { id: 'system', label: 'System', icon: Server, href: '/superuser#system' }
  ];

  const isActive = (href: string) => {
    if (href === '/superuser') {
      return location.pathname === '/superuser' || location.pathname === '/app-owner' || location.pathname === '/admin/dashboard';
    }
    return location.hash === href.split('#')[1];
  };

  return (
    <div className="bg-white shadow-lg border-r border-gray-200 w-64 min-h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Super User</h1>
            <p className="text-sm text-gray-600">Platform Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Link
          to="/staff/dashboard"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="w-5 h-5" />
          <span>Back to Staff Portal</span>
        </Link>
      </div>
    </div>
  );
};

export default SuperUserNav;

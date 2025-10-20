import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  Settings,
  Shield,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Archive,
  Users as UsersIcon,
  Calculator,
  PiggyBank,
  Banknote,
  Percent,
  ChevronDown,
  ChevronRight,
  Building2,
  Wallet,
  Receipt,
  BarChart3,
  CheckCircle,
  Crown
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([]));

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const staffMenuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/staff/dashboard' },
    { icon: Users, label: t('clients'), path: '/staff/clients' },
    { icon: FileText, label: t('loan_applications'), path: '/staff/loan-applications' },
    { icon: FileText, label: t('loan_processing'), path: '/staff/loan-processing' },
    { icon: UsersIcon, label: t('committee_approval'), path: '/staff/committee-approval' },
    { icon: Calculator, label: t('enhanced_disbursement'), path: '/staff/enhanced-disbursement' },
    { icon: CreditCard, label: t('loans'), path: '/staff/loans' },
    { icon: RefreshCw, label: t('loan_restructuring'), path: '/staff/loan-restructuring' },
    { icon: Archive, label: t('loan_closure'), path: '/staff/loan-closure' },
    { icon: DollarSign, label: t('repayments'), path: '/staff/repayments' },
    { icon: TrendingUp, label: t('accounting'), path: '/staff/accounting' },
    { icon: FileText, label: t('general_ledger'), path: '/staff/general-ledger' },
    { icon: FileText, label: t('reports'), path: '/staff/reports' },
    { icon: Shield, label: t('regulatory_reports'), path: '/staff/regulatory-reports' },
    { icon: Users, label: t('staff_management'), path: '/staff/management' },
    { icon: UsersIcon, label: t('group_management'), path: '/staff/group-management' },
    { icon: Settings, label: t('settings'), path: '/staff/settings' },
    { icon: Shield, label: t('audit_logs'), path: '/staff/audit-logs' },
    { icon: MessageCircle, label: t('complaints'), path: '/staff/complaints' },
    { icon: Building2, label: t('treasury_management'), path: '/staff/treasury' },
    { icon: HelpCircle, label: t('support'), path: '/staff/support' },
  ];

  // Add superuser dashboard for admin users
  const adminMenuItems = [
    ...staffMenuItems,
    { icon: Crown, label: 'Super User Dashboard', path: '/superuser' }
  ];

  const savingsDepositsItems = [
    { icon: PiggyBank, label: t('savings_products'), path: '/staff/savings-products' },
    { icon: Banknote, label: t('savings_accounts'), path: '/staff/savings-accounts' },
    { icon: Percent, label: t('interest_posting'), path: '/staff/interest-posting' },
  ];

  const expenseManagementItems = [
    { icon: Receipt, label: t('expense_dashboard'), path: '/staff/expense-management' },
    { icon: FileText, label: t('expense_entry'), path: '/staff/expense-management/entry' },
    { icon: CheckCircle, label: t('expense_approval'), path: '/staff/expense-management/approval' },
    { icon: BarChart3, label: t('budget_management'), path: '/staff/budget' },
  ];

  const clientMenuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/client/dashboard' },
    { icon: CreditCard, label: t('apply_loan'), path: '/client/apply-loan' },
    { icon: FileText, label: t('loan_applications'), path: '/client/applications' },
    { icon: DollarSign, label: t('repayments'), path: '/client/repayments' },
    { icon: MessageCircle, label: t('complaints'), path: '/client/complaints' },
    { icon: HelpCircle, label: t('support'), path: '/client/support' },
  ];

  const menuItems = user?.role === 'client' ? clientMenuItems : 
                   user?.role === 'admin' ? adminMenuItems : staffMenuItems;

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-16 border-r border-gray-200 flex flex-col">
      {/* Fixed Header */}
      <div className="px-4 py-6 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {user?.role === 'client' ? 'Client Portal' : 
           user?.role === 'admin' ? 'Admin Portal' : 'Staff Portal'}
        </h2>
      </div>
      
      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-4">
          <ul className="space-y-2 px-3">
            {/* Savings & Deposits Group */}
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <li>
                <button
                  onClick={() => toggleGroup('savings-deposits')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <PiggyBank className="w-5 h-5" />
                    <span>{t('savings_deposits')}</span>
                  </div>
                  {expandedGroups.has('savings-deposits') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {expandedGroups.has('savings-deposits') && (
                  <ul className="ml-6 mt-2 space-y-1">
                    {savingsDepositsItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={(e) => {
                            console.log('Savings deposits navigation clicked:', item.path);
                            // Let React Router handle the navigation normally
                          }}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}

            {/* Expense Management Group */}
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <li>
                <button
                  onClick={() => toggleGroup('expense-management')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-5 h-5" />
                    <span>{t('expense_management')}</span>
                  </div>
                  {expandedGroups.has('expense-management') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {expandedGroups.has('expense-management') && (
                  <ul className="ml-6 mt-2 space-y-1">
                    {expenseManagementItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={(e) => {
                            console.log('Expense management navigation clicked:', item.path);
                            // Let React Router handle the navigation normally
                          }}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
            
            {/* Regular Menu Items */}
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={(e) => {
                    console.log('Sidebar navigation clicked:', item.path);
                    // Let React Router handle the navigation normally
                  }}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Fixed Footer - Compliance Section */}
      {(user?.role === 'staff' || user?.role === 'admin') && (
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('compliance')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-xs text-green-800">PAR 30</span>
              <span className="text-xs font-semibold text-green-800">2.4%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-800">Liquidity</span>
              <span className="text-xs font-semibold text-blue-800">15.2%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <span className="text-xs text-yellow-800">NPL Ratio</span>
              <span className="text-xs font-semibold text-yellow-800">3.1%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
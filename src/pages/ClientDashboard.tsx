import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import {
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client's loan applications from database
  const { data: loanApplications, loading: applicationsLoading, error: applicationsError } = useSupabaseQuery('loan_applications', {
    filters: [{ column: 'client_id', operator: 'eq', value: user?.id }],
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch client's transactions
  const { data: transactions, loading: transactionsLoading, error: transactionsError } = useSupabaseQuery('transactions', {
    filters: [{ column: 'client_id', operator: 'eq', value: user?.id }],
    orderBy: { column: 'created_at', ascending: false }
  });

  // Calculate real metrics from database
  const activeLoans = loanApplications?.filter(app => 
    app.status === 'approved' || app.status === 'disbursed'
  ) || [];

  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + (loan.outstanding_amount || 0), 0);
  
  const nextPayment = activeLoans.length > 0 ? activeLoans[0] : null;
  const nextPaymentAmount = nextPayment?.monthly_payment || 0;
  const nextPaymentDate = nextPayment?.next_payment_date || 'N/A';

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Data is loaded via useSupabaseQuery hooks
      } catch (error) {
        console.error('Error loading client data:', error);
        setError('Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  if (loading || applicationsLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || applicationsError) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error || applicationsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t('welcome')}, {user?.name}!
              </h1>
              <p className="text-blue-100">
                Your loan dashboard and account overview
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">{activeLoans.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {totalOutstanding.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {nextPaymentAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{nextPaymentDate}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Active Loans</h3>
          </div>
          
          <div className="p-6">
            {activeLoans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Loans</h3>
                <p className="text-gray-600">You don't have any active loans at the moment.</p>
              </div>
            ) : (
              activeLoans.map((loan) => (
                <div key={loan.id} className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{loan.application_number} - {loan.loan_type}</h4>
                      <p className="text-sm text-gray-600">
                        Balance: TZS {(loan.outstanding_amount || 0).toLocaleString()} of TZS {(loan.requested_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {loan.status}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Next Payment: {nextPaymentDate}</p>
                      <p className="text-sm font-medium text-gray-900">TZS {nextPaymentAmount.toLocaleString()}</p>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium">
                      Make Payment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.type}</p>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">TZS {(transaction.amount || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientDashboard;
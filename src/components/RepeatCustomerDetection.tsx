import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, DollarSign, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CustomerMatch {
  id: string;
  first_name: string | null;
  last_name: string | null;
  national_id_number: string | null;
  phone_number: string | null;
  email_address: string | null;
  client_type: string | null;
  status: string | null;
  client_category: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface RepeatCustomerDetectionProps {
  onCustomerSelect: (customer: CustomerMatch) => void;
  onNewCustomer: () => void;
  searchCriteria: {
    nationalId?: string;
    phoneNumber?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

const RepeatCustomerDetection: React.FC<RepeatCustomerDetectionProps> = ({
  onCustomerSelect,
  onNewCustomer,
  searchCriteria
}) => {
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (searchCriteria.nationalId || searchCriteria.phoneNumber || searchCriteria.email) {
      searchCustomers();
    }
  }, [searchCriteria]);

  const searchCustomers = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Search by National ID first - check individual_client_details
      if (searchCriteria.nationalId) {
        const { data: nationalIdResults, error: nationalIdError } = await supabase
          .from('individual_client_details')
          .select(`
            client_id,
            first_name,
            last_name,
            national_id_number,
            clients!inner(
              id,
              phone_number,
              email_address,
              client_type,
              status,
              client_category,
              created_at,
              updated_at
            )
          `)
          .eq('national_id_number', searchCriteria.nationalId)
          .limit(10);

        if (nationalIdError) throw nationalIdError;

        if (nationalIdResults && nationalIdResults.length > 0) {
          const formattedResults = nationalIdResults.map(customer => ({
            id: customer.client_id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            national_id_number: customer.national_id_number,
            phone_number: customer.clients.phone_number,
            email_address: customer.clients.email_address,
            client_type: customer.clients.client_type,
            status: customer.clients.status,
            client_category: customer.clients.client_category,
            created_at: customer.clients.created_at,
            updated_at: customer.clients.updated_at
          }));
          setMatches(formattedResults);
          return;
        }
      }

      // Search by phone number - check main clients table
      if (searchCriteria.phoneNumber) {
        const { data: phoneResults, error: phoneError } = await supabase
          .from('clients')
          .select(`
            id,
            phone_number,
            email_address,
            client_type,
            status,
            client_category,
            created_at,
            updated_at,
            individual_client_details!left(
              first_name,
              last_name,
              national_id_number
            )
          `)
          .eq('phone_number', searchCriteria.phoneNumber)
          .limit(10);

        if (phoneError) throw phoneError;

        if (phoneResults && phoneResults.length > 0) {
          const formattedResults = phoneResults.map(customer => ({
            id: customer.id,
            first_name: customer.individual_client_details?.[0]?.first_name || null,
            last_name: customer.individual_client_details?.[0]?.last_name || null,
            national_id_number: customer.individual_client_details?.[0]?.national_id_number || null,
            phone_number: customer.phone_number,
            email_address: customer.email_address,
            client_type: customer.client_type,
            status: customer.status,
            client_category: customer.client_category,
            created_at: customer.created_at,
            updated_at: customer.updated_at
          }));
          setMatches(formattedResults);
          return;
        }
      }

      // Search by email - check main clients table
      if (searchCriteria.email) {
        const { data: emailResults, error: emailError } = await supabase
          .from('clients')
          .select(`
            id,
            phone_number,
            email_address,
            client_type,
            status,
            client_category,
            created_at,
            updated_at,
            individual_client_details!left(
              first_name,
              last_name,
              national_id_number
            )
          `)
          .eq('email_address', searchCriteria.email)
          .limit(10);

        if (emailError) throw emailError;

        if (emailResults && emailResults.length > 0) {
          const formattedResults = emailResults.map(customer => ({
            id: customer.id,
            first_name: customer.individual_client_details?.[0]?.first_name || null,
            last_name: customer.individual_client_details?.[0]?.last_name || null,
            national_id_number: customer.individual_client_details?.[0]?.national_id_number || null,
            phone_number: customer.phone_number,
            email_address: customer.email_address,
            client_type: customer.client_type,
            status: customer.status,
            client_category: customer.client_category,
            created_at: customer.created_at,
            updated_at: customer.updated_at
          }));
          setMatches(formattedResults);
          return;
        }
      }

      // Search by name - check individual_client_details
      if (searchCriteria.firstName || searchCriteria.lastName) {
        let query = supabase
          .from('individual_client_details')
          .select(`
            client_id,
            first_name,
            last_name,
            national_id_number,
            clients!inner(
              id,
              phone_number,
              email_address,
              client_type,
              status,
              client_category,
              created_at,
              updated_at
            )
          `)
          .not('client_id', 'is', null);

        if (searchCriteria.firstName) {
          query = query.ilike('first_name', `%${searchCriteria.firstName}%`);
        }
        if (searchCriteria.lastName) {
          query = query.ilike('last_name', `%${searchCriteria.lastName}%`);
        }

        const { data: nameResults, error: nameError } = await query.limit(10);

        if (nameError) throw nameError;

        if (nameResults && nameResults.length > 0) {
          const formattedResults = nameResults.map(customer => ({
            id: customer.client_id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            national_id_number: customer.national_id_number,
            phone_number: customer.clients.phone_number,
            email_address: customer.clients.email_address,
            client_type: customer.clients.client_type,
            status: customer.clients.status,
            client_category: customer.clients.client_category,
            created_at: customer.clients.created_at,
            updated_at: customer.clients.updated_at
          }));
          setMatches(formattedResults);
          return;
        }
      }

      // No results found
      setMatches([]);
    } catch (err) {
      console.error('Error searching customers:', err);
      // If it's a database connection issue, treat as new customer
      if (err.message?.includes('relation "clients" does not exist') || 
          err.message?.includes('clients table not found') ||
          err.message?.includes('relation') && err.message?.includes('does not exist')) {
        setMatches([]); // Treat as new customer
        setError(null);
      } else {
        setError('Failed to search customers. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'returning': return 'text-green-600 bg-green-100';
      case 'vip': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-TZ');
  };

  if (!hasSearched) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Customer Search</h3>
            <p className="text-sm text-blue-700">
              Enter customer details to check if they're an existing customer
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Searching...</h3>
            <p className="text-sm text-gray-600">Looking for existing customers</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Search Error</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={searchCustomers}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">New Customer</h3>
            <p className="text-sm text-green-700 mb-4">
              No existing customer found with the provided details. This appears to be a new customer.
            </p>
            <button
              onClick={onNewCustomer}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue as New Customer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <User className="w-6 h-6 text-yellow-600" />
        <div>
          <h3 className="text-lg font-semibold text-yellow-900">Existing Customer Found</h3>
          <p className="text-sm text-yellow-700">
            Found {matches.length} matching customer{matches.length > 1 ? 's' : ''}. Please select the correct one.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {matches.map((customer) => (
          <div
            key={customer.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => onCustomerSelect(customer)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(customer.client_category)}`}>
                    {customer.client_category?.toUpperCase() || 'NEW'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">ID: {customer.national_id_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Type: {customer.client_type || 'Individual'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Phone: {customer.phone_number || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Email: {customer.email_address || 'N/A'}
                    </span>
                  </div>
                </div>

                {customer.created_at && (
                  <div className="mt-2 text-sm text-gray-500">
                    Member since: {formatDate(customer.created_at)}
                  </div>
                )}
              </div>

              <div className="ml-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Select Customer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-200">
        <p className="text-sm text-yellow-700 mb-3">
          Don't see the right customer? This might be a new customer.
        </p>
        <button
          onClick={onNewCustomer}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Continue as New Customer
        </button>
      </div>
    </div>
  );
};

export default RepeatCustomerDetection;


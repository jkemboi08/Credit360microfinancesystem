import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Tabs, { TabItem } from '../components/Tabs';
import { useTabs } from '../hooks/useTabs';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { User, Search, ArrowRight, Users, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const LoanApplications: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();

  // Tab configuration
  const tabs: TabItem[] = [
    { id: 'clients', label: 'Select Client', icon: Users },
    { id: 'applications', label: 'All Applications', icon: User },
    { id: 'rejected', label: 'Rejected Applications', icon: XCircle }
  ];

  const { activeTab, setActiveTab } = useTabs(tabs, { defaultTab: 'clients' });


  // Handle URL parameter to switch to rejected tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'rejected') {
      setActiveTab('rejected');
    }
  }, [searchParams, setActiveTab]);


  // Fetch clients for loan application
  const { data: clients, loading: clientsLoading, error: clientsError } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch all loan applications
  const { data: allApplications, loading: applicationsLoading, error: applicationsError } = useSupabaseQuery('loan_applications', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch rejected loan applications
  const { data: rejectedApplications, loading: rejectedLoading, error: rejectedError } = useSupabaseQuery('loan_applications', {
    select: '*',
    filter: [
      { column: 'status', operator: 'eq', value: 'rejected' }
    ],
    orderBy: { column: 'updated_at', ascending: false }
  });

  // Fetch clients data separately
  const { data: allClients } = useSupabaseQuery('clients', {
    select: 'id, first_name, last_name, phone_number, email_address, client_type'
  });

  // Fetch loan products data separately
  const { data: allLoanProducts } = useSupabaseQuery('loan_products', {
    select: 'id, name, interest_rate, product_type'
  });

  // Combine the data for all applications, excluding those in processing
  const enrichedAllApplications = allApplications?.map(app => ({
    ...app,
    clients: allClients?.find(client => client.id === app.client_id),
    loan_products: allLoanProducts?.find(product => product.id === app.product_id)
  })).filter(app => {
    // Exclude applications that are in processing status (moved to loan processing queue)
    const processingStatuses = [
      'pending_committee_review',
      'under_review', 
      'submitted',
      'approved',
      'approved_for_contract',
      'contract_generated',
      'contract_signed',
      'ready_for_disbursement',
      'disbursed',
      'completed'
    ];
    return !processingStatuses.includes(app.status);
  }) || [];

  // Combine the data for rejected applications
  const enrichedRejectedApplications = rejectedApplications?.map(app => ({
    ...app,
    clients: allClients?.find(client => client.id === app.client_id),
    loan_products: allLoanProducts?.find(product => product.id === app.product_id)
  })) || [];

  // Handle view details - navigate to loan application form with original data
  const handleViewDetails = (application: any) => {
    // Navigate to loan application form with the application data for editing
    navigate(`/staff/loan-applications/new?edit=${application.id}&client=${application.client_id}`);
  };

  // Handle delete application
  const handleDeleteApplication = async (application: any) => {
    if (!window.confirm(`Are you sure you want to delete this loan application? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loan_applications')
        .delete()
        .eq('id', application.id);

      if (error) {
        console.error('Error deleting application:', error);
        toast.error('Failed to delete application');
        return;
      }

      toast.success('Application deleted successfully');
      // Refresh the page to update the list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const filteredClients = (clients || []).filter((client: any) => {
    // First check if client has any active loan applications
    const hasActiveApplication = allApplications?.some((app: any) => {
      const processingStatuses = [
        'pending_committee_review',
        'under_review', 
        'submitted',
        'approved',
        'approved_for_contract',
        'contract_generated',
        'contract_signed',
        'ready_for_disbursement',
        'disbursed',
        'completed'
      ];
      return app.client_id === client.id && processingStatuses.includes(app.status);
    });

    // If client has active application, exclude them
    if (hasActiveApplication) {
      return false;
    }

    // Otherwise, apply search filter
    const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           client.phone_number?.includes(searchTerm) ||
           client.email_address?.includes(searchTerm);
  });

  const handleStartApplication = (clientId: string) => {
    navigate(`/staff/loan-applications/${clientId}/apply`);
  };

  // Render client selection tab
  const renderClientSelection = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Available Clients</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a client to create a new loan application
          </p>
        </div>
        
        {clientsLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading clients...</p>
          </div>
        ) : clientsError ? (
          <div className="p-6 text-center text-red-500">
            <User className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p>Error loading clients: {clientsError.message}</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No clients found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telephone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Creation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {client.full_name || 
                             (client.client_type === 'individual' ? 
                               `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Individual Client' :
                               client.client_type === 'corporate' ? 
                               client.company_name || 'Corporate Client' :
                               client.client_type === 'group' ? 
                               client.group_name || 'Group Client' :
                               `Client (${client.phone_number || client.id})`)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {client.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {client.client_type?.charAt(0).toUpperCase() + client.client_type?.slice(1) || 'Individual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.phone_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleStartApplication(client.id)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Start Application
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Render all applications tab
  const renderAllApplications = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              All Loan Applications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              View and manage all loan applications in the system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {enrichedAllApplications?.length || 0} total applications
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh applications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {applicationsLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading applications...</p>
          </div>
        ) : applicationsError ? (
          <div className="p-6 text-center text-red-500">
            <User className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p>Error loading applications: {applicationsError.message}</p>
          </div>
        ) : !enrichedAllApplications || enrichedAllApplications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No applications found</p>
            <p className="text-sm">Create your first loan application by selecting a client</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {enrichedAllApplications.map((application: any) => (
              <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          application.status === 'approved' ? 'bg-green-100' :
                          application.status === 'rejected' ? 'bg-red-100' :
                          application.status === 'pending' || application.status === 'pending_committee_review' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            application.status === 'approved' ? 'text-green-600' :
                            application.status === 'rejected' ? 'text-red-600' :
                            application.status === 'pending' || application.status === 'pending_committee_review' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {application.clients?.first_name} {application.clients?.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {application.clients?.client_type === 'individual' ? 'Individual' : 'Group'} Client
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Application ID</p>
                        <p className="text-sm text-gray-900">{application.application_id || application.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          application.status === 'approved' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          application.status === 'pending' || application.status === 'pending_committee_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {application.status || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Loan Product</p>
                        <p className="text-sm text-gray-900">{application.loan_products?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested Amount</p>
                        <p className="text-sm text-gray-900">
                          TZS {application.requested_amount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interest Rate</p>
                        <p className="text-sm text-gray-900">
                          {application.loan_products?.interest_rate || 'N/A'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                      <span>📞 {application.clients?.phone_number || 'N/A'}</span>
                      <span>✉️ {application.clients?.email_address || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteApplication(application)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render rejected applications tab
  const renderRejectedApplications = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-red-600" />
              Rejected Applications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Applications that have been rejected with assessment details
            </p>
          </div>
          <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {enrichedRejectedApplications?.length || 0} rejected applications
          </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh rejected applications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rejected Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {rejectedLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading rejected applications...</p>
          </div>
        ) : rejectedError ? (
          <div className="p-6 text-center text-red-500">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p>Error loading rejected applications: {rejectedError.message}</p>
          </div>
        ) : !enrichedRejectedApplications || enrichedRejectedApplications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No rejected applications</p>
            <p className="text-sm">All applications are currently under review or approved</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {enrichedRejectedApplications.map((application: any) => (
              <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {application.clients?.first_name} {application.clients?.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {application.clients?.client_type === 'individual' ? 'Individual' : 'Group'} Client
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Application ID</p>
                        <p className="text-sm text-gray-900">{application.application_id || application.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Loan Product</p>
                        <p className="text-sm text-gray-900">{application.loan_products?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested Amount</p>
                        <p className="text-sm text-gray-900">
                          TZS {application.requested_amount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interest Rate</p>
                        <p className="text-sm text-gray-900">
                          {application.loan_products?.interest_rate || 'N/A'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tenor</p>
                        <p className="text-sm text-gray-900">
                          {application.repayment_period_months || 'N/A'} months
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(application.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Rejection Details */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-red-800 mb-2">Rejection Details</h5>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-red-700">Rejection Reason:</p>
                          <p className="text-sm text-red-600">
                            {application.rejection_reason || 'No specific reason provided'}
                          </p>
                        </div>
                        {application.assessment_score && (
                          <div>
                            <p className="text-xs font-medium text-red-700">Assessment Score:</p>
                            <p className="text-sm text-red-600">{application.assessment_score}/850</p>
                          </div>
                        )}
                        {application.risk_grade && (
                          <div>
                            <p className="text-xs font-medium text-red-700">Risk Grade:</p>
                            <p className="text-sm text-red-600">{application.risk_grade}</p>
                          </div>
                        )}
                        {application.auto_decline_flags && application.auto_decline_flags.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-red-700">Auto-Decline Flags:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {application.auto_decline_flags.map((flag: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                      <span>📞 {application.clients?.phone_number || 'N/A'}</span>
                      <span>✉️ {application.clients?.email_address || 'N/A'}</span>
                    </div>
                  </div>

                       <div className="flex flex-col space-y-2 ml-4">
                         <button
                           onClick={() => handleViewDetails(application)}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                         >
                           View Details
                         </button>
                         <button
                           onClick={() => handleDeleteApplication(application)}
                           className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                         >
                           <Trash2 className="w-4 h-4 mr-1" />
                           Delete
                         </button>
                       </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Get tab content function
  const getTabContent = (tabId: string) => {
    switch (tabId) {
      case 'clients': return renderClientSelection();
      case 'applications': return renderAllApplications();
      case 'rejected': return renderRejectedApplications();
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Loan Applications</h1>
          <p className="text-blue-100">
            Manage loan applications and client selection
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs.map(tab => ({
            ...tab,
            content: getTabContent(tab.id)
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          color="blue"
        />
      </div>
    </Layout>
  );
};

export default LoanApplications;
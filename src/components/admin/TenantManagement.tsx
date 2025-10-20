// Tenant Management Component
// Comprehensive tenant creation, editing, and management
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Users,
  Database,
  CreditCard,
  Activity,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  database_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  max_clients: number;
  max_users: number;
  storage_limit_gb: number;
  api_calls_limit: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  current_users?: number;
  current_clients?: number;
  current_loans?: number;
  current_savings?: number;
  user_usage_percent?: number;
  client_usage_percent?: number;
  last_activity?: string;
  billing_status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  trial_ends_at?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  language?: string;
}

interface TenantFormData {
  name: string;
  subdomain: string;
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  max_clients: number;
  max_users: number;
  storage_limit_gb: number;
  api_calls_limit: number;
  contact_email: string;
  contact_phone: string;
  address: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  settings: Record<string, any>;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats>({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    trialTenants: 0,
    totalUsers: 0,
    totalClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    subdomain: '',
    plan: 'BASIC',
    max_clients: 1000,
    max_users: 50,
    storage_limit_gb: 10,
    api_calls_limit: 10000,
    contact_email: '',
    contact_phone: '',
    address: '',
    country: '',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
    settings: {}
  });

  useEffect(() => {
    loadTenants();
    loadStats();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenant_management_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantError) {
        console.error('Error loading tenants:', tenantError);
        // Fallback to basic tenants table
        const { data: basicTenants, error: basicError } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!basicError && basicTenants) {
          setTenants(basicTenants);
        }
      } else {
        setTenants(tenantData || []);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_tenant_stats');

      if (!statsError && statsData) {
        setStats(statsData);
      } else {
        // Fallback to manual calculation
        const { data: allTenants } = await supabase.from('tenants').select('status, created_at');
        const { data: allUsers } = await supabase.from('users').select('created_at');
        const { data: allClients } = await supabase.from('clients').select('created_at');

        setStats({
          totalTenants: allTenants?.length || 0,
          activeTenants: allTenants?.filter(t => t.status === 'ACTIVE').length || 0,
          suspendedTenants: allTenants?.filter(t => t.status === 'SUSPENDED').length || 0,
          trialTenants: allTenants?.filter(t => t.status === 'TRIAL').length || 0,
          totalUsers: allUsers?.length || 0,
          totalClients: allClients?.length || 0,
          totalRevenue: 0,
          monthlyRevenue: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const createTenant = async (tenantData: TenantFormData) => {
    try {
      const { data, error } = await supabase
        .rpc('create_tenant', {
          tenant_name: tenantData.name,
          tenant_subdomain: tenantData.subdomain,
          admin_email: tenantData.contact_email,
          admin_first_name: 'Admin',
          admin_last_name: 'User',
          plan_name: tenantData.plan,
          max_clients: tenantData.max_clients,
          max_users: tenantData.max_users,
          storage_limit_gb: tenantData.storage_limit_gb,
          api_calls_limit: tenantData.api_calls_limit,
          contact_phone: tenantData.contact_phone,
          address: tenantData.address,
          country: tenantData.country,
          timezone: tenantData.timezone,
          currency: tenantData.currency,
          language: tenantData.language,
          settings: tenantData.settings
        });

      if (error) {
        console.error('Error creating tenant:', error);
        return { success: false, error: error.message };
      }

      await loadTenants();
      await loadStats();
      setShowCreateModal(false);
      resetForm();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating tenant:', error);
      return { success: false, error: 'Failed to create tenant' };
    }
  };

  const updateTenant = async (tenantId: string, tenantData: Partial<TenantFormData>) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          ...tenantData,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        console.error('Error updating tenant:', error);
        return { success: false, error: error.message };
      }

      await loadTenants();
      setShowEditModal(false);
      return { success: true };
    } catch (error) {
      console.error('Error updating tenant:', error);
      return { success: false, error: 'Failed to update tenant' };
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', tenantId);

      if (error) {
        console.error('Error updating tenant status:', error);
        return { success: false, error: error.message };
      }

      await loadTenants();
      await loadStats();
      return { success: true };
    } catch (error) {
      console.error('Error updating tenant status:', error);
      return { success: false, error: 'Failed to update tenant status' };
    }
  };

  const deleteTenant = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) {
        console.error('Error deleting tenant:', error);
        return { success: false, error: error.message };
      }

      await loadTenants();
      await loadStats();
      return { success: true };
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return { success: false, error: 'Failed to delete tenant' };
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subdomain: '',
      plan: 'BASIC',
      max_clients: 1000,
      max_users: 50,
      storage_limit_gb: 10,
      api_calls_limit: 10000,
      contact_email: '',
      contact_phone: '',
      address: '',
      country: '',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      settings: {}
    });
  };

  const handleEdit = (tenant: Tenant) => {
    setFormData({
      name: tenant.name,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      max_clients: tenant.max_clients,
      max_users: tenant.max_users,
      storage_limit_gb: tenant.storage_limit_gb,
      api_calls_limit: tenant.api_calls_limit,
      contact_email: tenant.contact_email || '',
      contact_phone: tenant.contact_phone || '',
      address: tenant.address || '',
      country: tenant.country || '',
      timezone: tenant.timezone || 'UTC',
      currency: tenant.currency || 'USD',
      language: tenant.language || 'en',
      settings: tenant.settings || {}
    });
    setSelectedTenant(tenant);
    setShowEditModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'SUSPENDED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'INACTIVE':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'TRIAL':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'BASIC':
        return 'bg-gray-100 text-gray-800';
      case 'PROFESSIONAL':
        return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      case 'CUSTOM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tenant.contact_email && tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.plan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
          <p className="text-gray-600">Manage all tenant organizations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Tenant
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trial Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trialTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TRIAL">Trial</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="BASIC">Basic</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="plan">Plan</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Tenants ({filteredTenants.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.subdomain}.creditmanagement.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(tenant.status)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Users:</span>
                        <span>{tenant.current_users || 0}/{tenant.max_users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clients:</span>
                        <span>{tenant.current_clients || 0}/{tenant.max_clients}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {tenant.contact_email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs">{tenant.contact_email}</span>
                        </div>
                      )}
                      {tenant.contact_phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs">{tenant.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Edit Tenant"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                          updateTenantStatus(tenant.id, newStatus);
                        }}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title={tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      >
                        {tenant.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Tenant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Tenant</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                createTenant(formData);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenant Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subdomain *</label>
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan *</label>
                    <select
                      required
                      value={formData.plan}
                      onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Users</label>
                    <input
                      type="number"
                      value={formData.max_users}
                      onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Clients</label>
                    <input
                      type="number"
                      value={formData.max_clients}
                      onChange={(e) => setFormData({...formData, max_clients: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Storage Limit (GB)</label>
                    <input
                      type="number"
                      value={formData.storage_limit_gb}
                      onChange={(e) => setFormData({...formData, storage_limit_gb: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">API Calls Limit</label>
                    <input
                      type="number"
                      value={formData.api_calls_limit}
                      onChange={(e) => setFormData({...formData, api_calls_limit: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="TZS">TZS</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Create Tenant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tenant: {selectedTenant.name}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateTenant(selectedTenant.id, formData);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenant Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subdomain *</label>
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan *</label>
                    <select
                      required
                      value={formData.plan}
                      onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={selectedTenant.status}
                      onChange={(e) => updateTenantStatus(selectedTenant.id, e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="TRIAL">Trial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Users</label>
                    <input
                      type="number"
                      value={formData.max_users}
                      onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Clients</label>
                    <input
                      type="number"
                      value={formData.max_clients}
                      onChange={(e) => setFormData({...formData, max_clients: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTenant(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Tenant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tenant Details: {selectedTenant.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{selectedTenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subdomain:</span>
                      <span className="text-sm font-medium">{selectedTenant.subdomain}.creditmanagement.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Plan:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanColor(selectedTenant.plan)}`}>
                        {selectedTenant.plan}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTenant.status)}`}>
                        {selectedTenant.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">{new Date(selectedTenant.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Usage Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Users:</span>
                      <span className="text-sm font-medium">{selectedTenant.current_users || 0}/{selectedTenant.max_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Clients:</span>
                      <span className="text-sm font-medium">{selectedTenant.current_clients || 0}/{selectedTenant.max_clients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Storage:</span>
                      <span className="text-sm font-medium">{selectedTenant.storage_limit_gb}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">API Calls:</span>
                      <span className="text-sm font-medium">{selectedTenant.api_calls_limit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedTenant(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedTenant);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Edit Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;

// User Management Component
// Comprehensive user management and role assignment
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserUpdateService } from '../../services/userUpdateService';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  Calendar,
  Building2,
  Crown,
  Settings,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Activity,
  Clock,
  Globe
} from 'lucide-react';

interface PlatformUser {
  id: number;
  user_id?: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'staff' | 'client' | 'manager' | 'admin';
  kyc_status?: 'pending' | 'verified' | 'rejected' | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  national_id?: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at?: string | null;
  // Additional fields for display
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tenant_id?: string;
  tenant_name?: string;
  permissions?: string[];
  phone?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  two_factor_enabled?: boolean;
  email_verified?: boolean;
  login_attempts?: number;
  locked_until?: string;
}

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'staff' | 'client' | 'manager' | 'admin';
  phone_number?: string;
  date_of_birth?: string;
  national_id?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected';
  // Additional fields for display
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tenant_id?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  permissions?: string[];
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  superAdmins: number;
  platformAdmins: number;
  tenantAdmins: number;
  tenantUsers: number;
  usersOnline: number;
  newUsersThisMonth: number;
  usersWith2FA: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    superAdmins: 0,
    platformAdmins: 0,
    tenantAdmins: 0,
    tenantUsers: 0,
    usersOnline: 0,
    newUsersThisMonth: 0,
    usersWith2FA: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    phone_number: '',
    date_of_birth: '',
    national_id: '',
    kyc_status: 'pending',
    status: 'ACTIVE',
    tenant_id: '',
    phone: '',
    timezone: 'UTC',
    language: 'en',
    permissions: []
  });

  const availableRoles = [
    { value: 'admin', label: 'Admin', description: 'Full platform access', icon: Crown },
    { value: 'manager', label: 'Manager', description: 'Management access', icon: Shield },
    { value: 'staff', label: 'Staff', description: 'Staff access', icon: Building2 },
    { value: 'client', label: 'Client', description: 'Client access', icon: Users }
  ];

  const availablePermissions = [
    'manage_tenants',
    'manage_users',
    'view_all_data',
    'manage_staff',
    'view_reports',
    'approve_loans',
    'view_clients',
    'create_loans',
    'manage_clients',
    'view_own_data',
    'apply_loans',
    'manage_billing',
    'view_analytics',
    'manage_settings'
  ];

  useEffect(() => {
    loadUsers();
    loadTenants();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data: basicUsers, error: basicError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!basicError && basicUsers) {
        setUsers(basicUsers.map(user => ({
          ...user,
          status: 'ACTIVE',
          permissions: []
        })));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, subdomain')
        .order('name');

      if (!tenantError && tenantData) {
        setTenants(tenantData);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_stats');

      if (!statsError && statsData) {
        setStats(statsData);
      } else {
        // Fallback to manual calculation
        const { data: allUsers } = await supabase.from('users').select('role, status, created_at, two_factor_enabled');
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setStats({
          totalUsers: allUsers?.length || 0,
          activeUsers: allUsers?.filter(u => u.status === 'ACTIVE').length || 0,
          suspendedUsers: allUsers?.filter(u => u.status === 'SUSPENDED').length || 0,
          superAdmins: allUsers?.filter(u => u.role === 'SUPER_ADMIN').length || 0,
          platformAdmins: allUsers?.filter(u => u.role === 'PLATFORM_ADMIN').length || 0,
          tenantAdmins: allUsers?.filter(u => u.role === 'TENANT_ADMIN').length || 0,
          tenantUsers: allUsers?.filter(u => u.role === 'TENANT_USER').length || 0,
          usersOnline: 0, // Would need real-time tracking
          newUsersThisMonth: allUsers?.filter(u => new Date(u.created_at) >= thisMonth).length || 0,
          usersWith2FA: allUsers?.filter(u => u.two_factor_enabled).length || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const createUser = async (userData: UserFormData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          phone_number: userData.phone_number,
          date_of_birth: userData.date_of_birth,
          national_id: userData.national_id,
          kyc_status: userData.kyc_status || 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return { success: false, error: error.message };
      }

      await loadUsers();
      await loadStats();
      setShowCreateModal(false);
      resetForm();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  };

  const updateUser = async (userId: number, userData: Partial<UserFormData>) => {
    try {
      // Use the UserUpdateService to handle the update
      const result = await UserUpdateService.updateUser({
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        phone_number: userData.phone_number,
        date_of_birth: userData.date_of_birth,
        national_id: userData.national_id,
        kyc_status: userData.kyc_status
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update user' };
      }

      await loadUsers();
      await loadStats();
      setShowEditModal(false);
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  };

  const updateUserRole = async (userId: number, role: string, permissions: string[]) => {
    try {
      // Use the UserUpdateService to handle the role update
      const result = await UserUpdateService.updateUserRole(userId, role);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update user role' };
      }

      await loadUsers();
      await loadStats();
      setShowRoleModal(false);
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  };

  const updateUserStatus = async (userId: number, status: string) => {
    try {
      // Note: The users table doesn't have a status field, so we'll skip this for now
      // or implement it differently based on your needs
      console.log('Status update not implemented for users table');
      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, error: 'Failed to update user status' };
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message };
      }

      await loadUsers();
      await loadStats();
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'staff',
      phone_number: '',
      date_of_birth: '',
      national_id: '',
      kyc_status: 'pending',
      status: 'ACTIVE',
      tenant_id: '',
      phone: '',
      timezone: 'UTC',
      language: 'en',
      permissions: []
    });
  };

  const handleEdit = (user: PlatformUser) => {
    setFormData({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      phone_number: user.phone_number || '',
      date_of_birth: user.date_of_birth || '',
      national_id: user.national_id || '',
      kyc_status: user.kyc_status || 'pending',
      status: user.status || 'ACTIVE',
      tenant_id: user.tenant_id || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      language: user.language || 'en',
      permissions: user.permissions || []
    });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleRoleChange = (user: PlatformUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      status: user.status,
      tenant_id: user.tenant_id || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      language: user.language || 'en',
      permissions: user.permissions || []
    });
    setShowRoleModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'SUSPENDED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'INACTIVE':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    const roleInfo = availableRoles.find(r => r.value === role);
    return roleInfo ? <roleInfo.icon className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'PLATFORM_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'TENANT_ADMIN':
        return 'bg-green-100 text-green-800';
      case 'TENANT_USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTenant = filterTenant === 'all' || user.tenant_id === filterTenant;
    return matchesSearch && matchesStatus && matchesRole && matchesTenant;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage platform users and their roles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.superAdmins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Key className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">2FA Enabled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usersWith2FA}</p>
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
                placeholder="Search users..."
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
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="TENANT_USER">Tenant User</option>
            </select>
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tenants</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="status">Status</option>
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

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users ({filteredUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Security
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        {user.avatar ? (
                          <img className="w-8 h-8 rounded-full" src={user.avatar} alt="" />
                        ) : (
                          <Users className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.status)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.tenant_name || 'Platform'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-gray-400 mr-1" />
                        {new Date(user.last_login).toLocaleDateString()}
                      </div>
                    ) : (
                      'Never'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      {user.two_factor_enabled && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Key className="w-3 h-3 mr-1" />
                          2FA
                        </span>
                      )}
                      {user.email_verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Mail className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRoleChange(user)}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        title="Change Role"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                          updateUserStatus(user.id, newStatus);
                        }}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title={user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      >
                        {user.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete User"
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                createUser(formData);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableRoles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenant</label>
                    <select
                      value={formData.tenant_id}
                      onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Tenant</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Africa/Nairobi">Nairobi</option>
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
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Role: {selectedUser.first_name} {selectedUser.last_name}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateUserRole(selectedUser.id, formData.role, formData.permissions);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {availableRoles.map(role => (
                        <div
                          key={role.value}
                          className={`p-3 border rounded-lg cursor-pointer ${
                            formData.role === role.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                          onClick={() => setFormData({...formData, role: role.value as any})}
                        >
                          <div className="flex items-center">
                            <role.icon className="w-5 h-5 text-gray-600 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{role.label}</div>
                              <div className="text-xs text-gray-500">{role.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Permissions</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {availablePermissions.map(permission => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissions: [...formData.permissions, permission]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter(p => p !== permission)
                                });
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{permission.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details: {selectedUser.first_name} {selectedUser.last_name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Role:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tenant:</span>
                      <span className="text-sm font-medium">{selectedUser.tenant_name || 'Platform'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Security & Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">2FA Enabled:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.two_factor_enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email Verified:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.email_verified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Login:</span>
                      <span className="text-sm font-medium">
                        {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Login Attempts:</span>
                      <span className="text-sm font-medium">{selectedUser.login_attempts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Timezone:</span>
                      <span className="text-sm font-medium">{selectedUser.timezone || 'UTC'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Language:</span>
                      <span className="text-sm font-medium">{selectedUser.language || 'en'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedUser);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

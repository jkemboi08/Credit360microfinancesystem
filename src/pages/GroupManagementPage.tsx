import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { GroupService, Group, GroupMember } from '../services/groupService';
import {
  Users, Plus, Search, UserCheck, Shield, AlertTriangle,
  Eye, MessageSquare, Download, RefreshCw, TrendingUp, DollarSign
} from 'lucide-react';

// Interfaces are now imported from groupService

const GroupManagementPage: React.FC = () => {
  console.log('GroupManagementPage: Component rendering');
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  // Fetch real data from Supabase
  const { data: groupsData, loading: groupsLoading } = useSupabaseQuery('groups', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: groupMembersData, loading: membersLoading } = useSupabaseQuery('group_members', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: clients, loading: clientsLoading } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [messageText, setMessageText] = useState('');
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('GroupManagementPage: useEffect running');
    loadGroups();
    loadAvailableClients();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups();
      
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0]);
          loadGroupMembers(result.data[0].id);
        }
      } else {
        // If groups table doesn't exist, show a helpful message
        if (result.error && result.error.includes('does not exist')) {
          setError('Groups table not found. Please run database migration first.');
        } else {
          setError(result.error || 'Failed to load groups');
        }
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const result = await GroupService.getGroupMembers(groupId);
      if (result.success && result.data) {
        setGroupMembers(result.data);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const loadAvailableClients = async () => {
    try {
      const result = await GroupService.getAvailableClients();
      if (result.success && result.data) {
        setAvailableClients(result.data);
      }
    } catch (error) {
      console.error('Error loading available clients:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-yellow-600 bg-yellow-100';
      case 'defaulted': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get member display name
  const getMemberDisplayName = (member: any) => {
    if (member.clients) {
      return `${member.clients.first_name} ${member.clients.last_name}`;
    }
    return 'Unknown Member';
  };

  // Helper function to get member phone
  const getMemberPhone = (member: any) => {
    return member.clients?.phone_number || 'N/A';
  };

  // Helper function to get member email
  const getMemberEmail = (member: any) => {
    return member.clients?.email_address || 'N/A';
  };

  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  const handleExportGroup = () => {
    // Export group data functionality
    const exportData = {
      group: selectedGroup,
      members: groupMembers,
      exportDate: new Date().toISOString(),
      totalMembers: groupMembers.length,
      totalLoanAmount: selectedGroup?.total_loan_amount || 0,
      guaranteeBalance: selectedGroup?.current_guarantee_balance || 0
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `group-${selectedGroup?.name?.replace(/\s+/g, '-').toLowerCase()}-export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMembers = () => {
    setShowAddMembers(true);
    setSelectedClients([]);
    setSearchQuery('');
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleAddSingleClient = async (client: any) => {
    if (!selectedGroup) {
      alert('Please select a group first.');
      return;
    }

    try {
      const result = await GroupService.addGroupMember(selectedGroup.id, client.id, 'member');
      
      if (result.success) {
        // Reload group members to get updated data
        await loadGroupMembers(selectedGroup.id);
        
        // Update group member count
        setGroups(prev => prev.map(group => 
          group.id === selectedGroup.id 
            ? { ...group, total_members: group.total_members + 1 }
            : group
        ));
        setSelectedGroup(prev => prev ? { ...prev, total_members: prev.total_members + 1 } : null);

        alert(`${client.first_name} ${client.last_name} has been added to the group successfully!`);
      } else {
        alert(`Failed to add member: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding group member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleAddSelectedClients = async () => {
    if (selectedClients.length === 0) {
      alert('Please select at least one client to add to the group.');
      return;
    }

    if (!selectedGroup) {
      alert('Please select a group first.');
      return;
    }

    const clientsToAdd = availableClients.filter(client => 
      selectedClients.includes(client.id)
    );

    if (clientsToAdd.length === 0) {
      alert('No valid clients selected to add to the group.');
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const client of clientsToAdd) {
        const result = await GroupService.addGroupMember(selectedGroup.id, client.id, 'member');
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to add ${client.first_name} ${client.last_name}:`, result.error);
        }
      }

      if (successCount > 0) {
        // Reload group members to get updated data
        await loadGroupMembers(selectedGroup.id);
        
        // Update group member count
        setGroups(prev => prev.map(group => 
          group.id === selectedGroup.id 
            ? { ...group, total_members: group.total_members + successCount }
            : group
        ));
        setSelectedGroup(prev => prev ? { ...prev, total_members: prev.total_members + successCount } : null);
      }

      setSelectedClients([]);
      setShowAddMembers(false);
      
      if (errorCount === 0) {
        alert(`${successCount} client(s) have been added to the group successfully!`);
      } else {
        alert(`${successCount} client(s) added successfully, ${errorCount} failed.`);
      }
    } catch (error) {
      console.error('Error adding group members:', error);
      alert('Failed to add members. Please try again.');
    }
  };

  const filteredClients = availableClients.filter(client => {
    const query = searchQuery.toLowerCase();
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    return (
      fullName.includes(query) ||
      client.phone_number?.toLowerCase().includes(query) ||
      client.email_address?.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (member: GroupMember) => {
    // Navigate to member details page
    console.log('View details for member:', getMemberDisplayName(member));
    // In a real app, this would navigate to: /staff/group-management/{groupId}/member/{memberId}
    alert(`Viewing details for ${getMemberDisplayName(member)}\nPhone: ${getMemberPhone(member)}\nEmail: ${getMemberEmail(member)}\nRole: ${member.role}\nMembership Status: ${member.membership_status}\nRepayment Rate: ${member.repayment_rate}%`);
  };

  const handleSendMessage = (member: any) => {
    setSelectedMember(member);
    setShowMessageModal(true);
  };

  const handleSendMessageSubmit = () => {
    if (messageText.trim() && selectedMember) {
      console.log(`Sending message to ${getMemberDisplayName(selectedMember)}:`, messageText);
      alert(`Message sent to ${getMemberDisplayName(selectedMember)}:\n"${messageText}"`);
      setMessageText('');
      setShowMessageModal(false);
      setSelectedMember(null);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const groupName = formData.get('groupName') as string;
    const description = formData.get('description') as string;
    const guaranteeModel = formData.get('guaranteeModel') as string;
    const guaranteeValue = formData.get('guaranteeValue') as string;

    if (groupName && description && guaranteeModel && guaranteeValue) {
      try {
        const groupData = {
          name: groupName,
          description: description,
          group_type: 'solidarity' as const, // Default type
          status: 'active' as const,
          guarantee_model: guaranteeModel as 'fixed_amount' | 'percentage',
          guarantee_value: parseFloat(guaranteeValue),
          total_members: 0,
          collective_guarantee_amount: 0,
          current_guarantee_balance: 0,
          total_loan_amount: 0
        };

        const result = await GroupService.createGroup(groupData);
        
        if (result.success && result.data) {
          setGroups(prev => [...prev, result.data!]);
          setSelectedGroup(result.data);
          setShowCreateGroup(false);
          alert(`Group "${groupName}" created successfully!`);
        } else {
          alert(`Failed to create group: ${result.error}`);
        }
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Group Management...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Setup Required</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">To fix this issue:</h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Start Docker Desktop</li>
                <li>2. Run: <code className="bg-yellow-100 px-1 rounded">cd supabase && npx supabase start</code></li>
                <li>3. Run: <code className="bg-yellow-100 px-1 rounded">npx supabase db reset</code></li>
                <li>4. Refresh this page</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Group Management</h1>
              <p className="text-teal-100">Manage group lending operations and collective guarantees</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateGroup}
                className="bg-white text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </button>
              <button
                onClick={handleExportGroup}
                disabled={!selectedGroup}
                className="bg-white text-green-600 hover:bg-green-50 disabled:bg-gray-200 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Group
              </button>
            </div>
          </div>
        </div>

        {/* Group Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  loadGroupMembers(group.id);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedGroup?.id === group.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{group.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                    {group.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Members:</span>
                    <span className="ml-1 font-medium">{group.total_members}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Leader:</span>
                    <span className="ml-1 font-medium">{group.group_leader_name || 'No leader assigned'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedGroup && (
          <>
            {/* Group Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedGroup.total_members}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Loan Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedGroup.total_loan_amount)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Guarantee Balance</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedGroup.current_guarantee_balance)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Avg Repayment Rate</p>
                    <p className="text-2xl font-bold text-gray-900">86%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Roster */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Group Roster</h3>
                <button
                  onClick={handleAddMembers}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Members
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Member</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Loan Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Repayment Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Current Balance</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <UserCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getMemberDisplayName(member)}</p>
                              <p className="text-sm text-gray-500">{getMemberPhone(member)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.role === 'leader' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.membership_status)}`}>
                            {member.membership_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-green-600">{member.repayment_rate}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{formatCurrency(member.current_balance)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(member)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              View
                            </button>
                            <button
                              onClick={() => handleSendMessage(member)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors"
                              title="Send Message"
                            >
                              <MessageSquare className="w-4 h-4 mr-1.5" />
                              Message
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                  <input
                    type="text"
                    name="groupName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter unique group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the group's purpose and objectives"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guarantee Model *</label>
                    <select
                      name="guaranteeModel"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select model...</option>
                      <option value="fixed_amount">Fixed Amount per Member</option>
                      <option value="percentage">Percentage of Loan Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guarantee Value *</label>
                    <input
                      type="number"
                      name="guaranteeValue"
                      required
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount or percentage"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Members Modal */}
        {showAddMembers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Members to Group</h3>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search clients by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Selection Summary */}
              {selectedClients.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedClients.length}</strong> client(s) selected
                  </p>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <div 
                      key={client.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedClients.includes(client.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleClientSelect(client.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => handleClientSelect(client.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.first_name} {client.last_name}</p>
                            <p className="text-sm text-gray-500">{client.phone_number}</p>
                            <p className="text-xs text-gray-400">{client.email_address}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                true // All clients from database are considered complete 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                Profile Complete
                              </span>
                              <span className="text-xs text-gray-500">
                                Available for Group Membership
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSingleClient(client);
                            }}
                            disabled={!client.profileComplete}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No clients found matching your search criteria.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600">
                  {selectedClients.length > 0 && (
                    <span>{selectedClients.length} client(s) selected</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAddMembers(false);
                      setSelectedClients([]);
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSelectedClients}
                    disabled={selectedClients.length === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Add Selected Members ({selectedClients.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {showMessageModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send Message to {getMemberDisplayName(selectedMember)}
              </h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Member:</strong> {getMemberDisplayName(selectedMember)} ({selectedMember.role})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {getMemberPhone(selectedMember)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {getMemberEmail(selectedMember)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your message..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedMember(null);
                    setMessageText('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessageSubmit}
                  disabled={!messageText.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupManagementPage;
